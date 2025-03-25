const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// Razorpay webhook secret key - replace with your actual webhook secret
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_razorpay_webhook_secret';

// Razorpay API credentials - replace with your actual credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret';

// Razorpay API base URL
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

/**
 * Webhook handler for Razorpay payment events
 * This function verifies and processes payment callbacks from Razorpay
 */
exports.razorpayWebhook = functions.https.onRequest(async (request, response) => {
  try {
    // Verify webhook signature
    const webhookSignature = request.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(request.body);
    
    // Validate the webhook signature
    const isValidSignature = verifyRazorpayWebhookSignature(webhookBody, webhookSignature);
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return response.status(400).send({ error: 'Invalid signature' });
    }
    
    // Extract payment information
    const event = request.body;
    const eventType = event.event;
    
    // Handle different event types
    switch (eventType) {
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
      
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
        
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
        
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    // Successfully processed webhook
    return response.status(200).send({ status: 'success' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log the error in Firestore for debugging
    await db.collection('errorLogs').add({
      type: 'webhook_processing_error',
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return response.status(500).send({ error: 'Internal server error' });
  }
});

/**
 * Verify the Razorpay webhook signature
 */
function verifyRazorpayWebhookSignature(webhookBody, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');
  
  return expectedSignature === signature;
}

/**
 * Handle payment.authorized event
 */
async function handlePaymentAuthorized(payment) {
  try {
    const { notes, amount } = payment;
    if (!notes || !notes.priestId || !notes.plan || !notes.orderId) {
      console.error('Missing required payment notes');
      return;
    }
    
    const { priestId, plan, orderId } = notes;
    
    // Update the order status in Firestore
    await db.collection('subscriptionOrders').doc(orderId).update({
      status: 'authorized',
      paymentId: payment.id,
      authorizationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      paymentDetails: payment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Payment authorized for priest ${priestId}, plan ${plan}, amount ${amount / 100}`);
  } catch (error) {
    console.error('Error handling payment authorized:', error);
    throw error;
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment) {
  try {
    const { notes, amount } = payment;
    if (!notes || !notes.priestId || !notes.plan || !notes.orderId) {
      console.error('Missing required payment notes');
      return;
    }
    
    const { priestId, plan, orderId } = notes;
    
    // Get subscription plan details based on plan type
    const planDetails = getSubscriptionPlanDetails(plan);
    if (!planDetails) {
      console.error(`Invalid plan type: ${plan}`);
      return;
    }
    
    // Calculate expiration date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    // Update order status and create subscription
    const batch = db.batch();
    
    // Update order status
    const orderRef = db.collection('subscriptionOrders').doc(orderId);
    batch.update(orderRef, {
      status: 'completed',
      paymentId: payment.id,
      captureTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      paymentDetails: payment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update priest subscription data
    const priestRef = db.collection('priests').doc(priestId);
    batch.update(priestRef, {
      'subscription.plan': plan,
      'subscription.startedAt': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.expiresAt': expiryDate,
      'subscription.remainingLeads': planDetails.customerRequests,
      'subscription.autoRenew': true,
      'subscription.paymentHistory': admin.firestore.FieldValue.arrayUnion({
        orderId: orderId,
        paymentId: payment.id,
        amount: amount / 100,
        plan: plan,
        date: new Date()
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for the priest
    const notificationRef = db.collection('priestNotifications').doc();
    batch.set(notificationRef, {
      priestId: priestId,
      title: `Subscription Activated: ${planDetails.name} Plan`,
      message: `Your ${planDetails.name} Plan subscription has been activated successfully. It will expire on ${expiryDate.toDateString()}.`,
      type: 'subscription',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Payment captured for priest ${priestId}, plan ${plan}, amount ${amount / 100}`);
  } catch (error) {
    console.error('Error handling payment captured:', error);
    throw error;
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment) {
  try {
    const { notes, error_code, error_description } = payment;
    if (!notes || !notes.priestId || !notes.orderId) {
      console.error('Missing required payment notes');
      return;
    }
    
    const { priestId, orderId } = notes;
    
    // Update the order status in Firestore
    await db.collection('subscriptionOrders').doc(orderId).update({
      status: 'failed',
      paymentId: payment.id,
      failureReason: error_description || 'Payment failed',
      errorCode: error_code,
      failureTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      paymentDetails: payment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for the priest
    await db.collection('priestNotifications').add({
      priestId: priestId,
      title: 'Payment Failed',
      message: `Your subscription payment failed. Reason: ${error_description || 'Unknown error'}. Please try again.`,
      type: 'payment',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Payment failed for priest ${priestId}, orderId ${orderId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

/**
 * Handle subscription.charged event for recurring payments
 */
async function handleSubscriptionCharged(subscription) {
  try {
    const { notes, amount } = subscription;
    if (!notes || !notes.priestId || !notes.plan) {
      console.error('Missing required subscription notes');
      return;
    }
    
    const { priestId, plan } = notes;
    
    // Get subscription plan details based on plan type
    const planDetails = getSubscriptionPlanDetails(plan);
    if (!planDetails) {
      console.error(`Invalid plan type: ${plan}`);
      return;
    }
    
    // Calculate new expiration date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    // Generate order ID for record keeping
    const orderId = db.collection('subscriptionOrders').doc().id;
    
    // Update priest subscription data and create a record
    const batch = db.batch();
    
    // Create subscription order record
    const orderRef = db.collection('subscriptionOrders').doc(orderId);
    batch.set(orderRef, {
      priestId,
      plan,
      amount: amount / 100,
      currency: 'INR',
      status: 'completed',
      subscriptionId: subscription.id,
      paymentId: subscription.payment_id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update priest subscription data
    const priestRef = db.collection('priests').doc(priestId);
    batch.update(priestRef, {
      'subscription.expiresAt': expiryDate,
      'subscription.remainingLeads': planDetails.customerRequests,
      'subscription.renewedAt': admin.firestore.FieldValue.serverTimestamp(),
      'subscription.paymentHistory': admin.firestore.FieldValue.arrayUnion({
        orderId: orderId,
        paymentId: subscription.payment_id,
        amount: amount / 100,
        plan: plan,
        date: new Date(),
        isRenewal: true
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for the priest
    const notificationRef = db.collection('priestNotifications').doc();
    batch.set(notificationRef, {
      priestId: priestId,
      title: `Subscription Renewed: ${planDetails.name} Plan`,
      message: `Your ${planDetails.name} Plan subscription has been automatically renewed. It will expire on ${expiryDate.toDateString()}.`,
      type: 'subscription',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Subscription renewed for priest ${priestId}, plan ${plan}, amount ${amount / 100}`);
  } catch (error) {
    console.error('Error handling subscription charged:', error);
    throw error;
  }
}

/**
 * Scheduled function to check for expiring subscriptions and send renewal reminders
 * Runs daily at midnight
 */
exports.checkExpiringSubscriptions = functions.pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      // Get the date 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      // Get the end of the day for the 7-day cutoff
      const endOfSeventhDay = new Date(sevenDaysFromNow);
      endOfSeventhDay.setHours(23, 59, 59, 999);
      
      // Get the start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Query for priests with subscriptions expiring in the next 7 days
      const expiringSubscriptions = await db.collection('priests')
        .where('subscription.expiresAt', '>=', today)
        .where('subscription.expiresAt', '<=', endOfSeventhDay)
        .where('subscription.autoRenew', '==', false) // Only check non-auto-renewing subscriptions
        .get();
      
      if (expiringSubscriptions.empty) {
        console.log('No expiring subscriptions found');
        return null;
      }
      
      // Process each expiring subscription
      const batch = db.batch();
      let notificationCount = 0;
      
      expiringSubscriptions.forEach(doc => {
        const priest = doc.data();
        const subscription = priest.subscription || {};
        const expiryDate = subscription.expiresAt.toDate();
        
        // Calculate days until expiry
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Create a notification for the priest
        const notificationRef = db.collection('priestNotifications').doc();
        batch.set(notificationRef, {
          priestId: doc.id,
          title: 'Subscription Expiring Soon',
          message: `Your ${subscription.plan} subscription will expire in ${daysToExpiry} days. Please renew to maintain your access and visibility.`,
          type: 'subscription',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        notificationCount++;
      });
      
      // Commit the batch if there are notifications to send
      if (notificationCount > 0) {
        await batch.commit();
        console.log(`Sent ${notificationCount} expiration reminders`);
      }
      
      return null;
    } catch (error) {
      console.error('Error checking expiring subscriptions:', error);
      
      // Log the error in Firestore
      await db.collection('errorLogs').add({
        type: 'expiry_check_error',
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

/**
 * Scheduled function to handle subscription renewals
 * Runs daily at 1 AM
 */
exports.processSubscriptionRenewals = functions.pubsub.schedule('0 1 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get tomorrow's date (for the query upper bound)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Query for priests with auto-renewing subscriptions expiring today
      const subscriptionsToRenew = await db.collection('priests')
        .where('subscription.expiresAt', '>=', today)
        .where('subscription.expiresAt', '<', tomorrow)
        .where('subscription.autoRenew', '==', true)
        .get();
      
      if (subscriptionsToRenew.empty) {
        console.log('No subscriptions to renew today');
        return null;
      }
      
      // Process each subscription to renew
      let renewalCount = 0;
      
      for (const doc of subscriptionsToRenew.docs) {
        const priest = doc.data();
        const subscription = priest.subscription || {};
        
        // Attempt to create a Razorpay renewal payment
        const renewed = await createRazorpayRenewalPayment(doc.id, priest);
        
        if (renewed) {
          renewalCount++;
        }
      }
      
      console.log(`Processed ${renewalCount} subscription renewals`);
      return null;
    } catch (error) {
      console.error('Error processing subscription renewals:', error);
      
      // Log the error in Firestore
      await db.collection('errorLogs').add({
        type: 'renewal_processing_error',
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

/**
 * Create a renewal payment in Razorpay
 */
async function createRazorpayRenewalPayment(priestId, priestData) {
  try {
    const subscription = priestData.subscription || {};
    
    // Get subscription plan details
    const planDetails = getSubscriptionPlanDetails(subscription.plan);
    if (!planDetails) {
      console.error(`Invalid plan type: ${subscription.plan}`);
      return false;
    }
    
    // Calculate amount in paise
    const amountInPaise = planDetails.monthlyFee * 100;
    
    // Calculate new expiration date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    
    // Create order in Razorpay
    const authorization = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const orderResponse = await axios.post(
      `${RAZORPAY_API_URL}/orders`,
      {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `renewal_${priestId}_${Date.now()}`,
        notes: {
          priestId: priestId,
          plan: subscription.plan,
          isRenewal: true
        }
      },
      {
        headers: {
          'Authorization': `Basic ${authorization}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!orderResponse.data || !orderResponse.data.id) {
      console.error('Failed to create Razorpay renewal order');
      return false;
    }
    
    const razorpayOrderId = orderResponse.data.id;
    
    // Create order record in Firestore
    const orderId = db.collection('subscriptionOrders').doc().id;
    
    await db.collection('subscriptionOrders').doc(orderId).set({
      priestId: priestId,
      priestEmail: priestData.email,
      plan: subscription.plan,
      amount: planDetails.monthlyFee,
      currency: 'INR',
      status: 'pending_renewal',
      razorpayOrderId: razorpayOrderId,
      isRenewal: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create notification for the priest
    await db.collection('priestNotifications').add({
      priestId: priestId,
      title: 'Subscription Renewal',
      message: `Your ${planDetails.name} Plan subscription is up for renewal. Please complete the payment to continue enjoying your benefits.`,
      type: 'subscription',
      read: false,
      actionUrl: `priest-portal/renewal.html?orderId=${orderId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error creating Razorpay renewal payment:', error);
    
    // Log the error in Firestore
    await db.collection('errorLogs').add({
      type: 'renewal_payment_creation_error',
      priestId: priestId,
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return false;
  }
}

/**
 * Scheduled function to reset monthly lead counts for all priests
 * Runs on the 1st of every month at 12:05 AM
 */
exports.resetMonthlyLeads = functions.pubsub.schedule('5 0 1 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      // Get all active priests with subscriptions
      const activePriests = await db.collection('priests')
        .where('active', '==', true)
        .where('subscription.plan', 'in', ['basic', 'standard', 'premium'])
        .get();
      
      if (activePriests.empty) {
        console.log('No active priests with subscriptions found');
        return null;
      }
      
      // Process each priest in batches (Firestore allows up to 500 operations per batch)
      const batchSize = 400;
      let currentBatch = db.batch();
      let operationCount = 0;
      let totalCount = 0;
      
      for (const doc of activePriests.docs) {
        const priest = doc.data();
        const subscription = priest.subscription || {};
        
        // Get subscription plan details
        const planDetails = getSubscriptionPlanDetails(subscription.plan);
        if (!planDetails) {
          console.error(`Invalid plan type: ${subscription.plan}`);
          continue;
        }
        
        // Reset the remaining leads to the plan's maximum
        const priestRef = db.collection('priests').doc(doc.id);
        currentBatch.update(priestRef, {
          'subscription.remainingLeads': planDetails.customerRequests,
          'subscription.lastLeadReset': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create notification for the priest
        const notificationRef = db.collection('priestNotifications').doc();
        currentBatch.set(notificationRef, {
          priestId: doc.id,
          title: 'Monthly Lead Count Reset',
          message: `Your monthly lead count has been reset to ${planDetails.customerRequests}. You can now receive up to ${planDetails.customerRequests} new customer requests this month.`,
          type: 'leads',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        operationCount += 2;
        totalCount++;
        
        // If the batch is getting too large, commit it and start a new one
        if (operationCount >= batchSize) {
          await currentBatch.commit();
          currentBatch = db.batch();
          operationCount = 0;
        }
      }
      
      // Commit any remaining operations
      if (operationCount > 0) {
        await currentBatch.commit();
      }
      
      console.log(`Reset lead counts for ${totalCount} priests`);
      return null;
    } catch (error) {
      console.error('Error resetting monthly leads:', error);
      
      // Log the error in Firestore
      await db.collection('errorLogs').add({
        type: 'lead_reset_error',
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

/**
 * Scheduled function to generate monthly success fee invoices
 * Runs on the last day of each month at 11 PM
 */
exports.generateMonthlySuccessFeeInvoices = functions.pubsub.schedule('0 23 28,29,30,31 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      // Check if this is the last day of the month
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // If tomorrow's month is the same as today's, it's not the last day of the month
      if (tomorrow.getMonth() === today.getMonth()) {
        console.log('Not the last day of the month, skipping invoice generation');
        return null;
      }
      
      // Get the start of the current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
      
      // Get all active priests
      const activePriests = await db.collection('priests')
        .where('active', '==', true)
        .get();
      
      if (activePriests.empty) {
        console.log('No active priests found');
        return null;
      }
      
      // Process each priest
      let invoiceCount = 0;
      
      for (const doc of activePriests.docs) {
        const priest = doc.data();
        const subscription = priest.subscription || {};
        const successfulBookings = subscription.successfulBookings || { local: 0, outstation: 0, premium: 0 };
        
        // Calculate success fees
        const localFees = successfulBookings.local * 30; // ₹30 per local booking
        const outstationFees = successfulBookings.outstation * 50; // ₹50 per outstation booking
        const premiumFees = successfulBookings.premium * 100; // ₹100 per premium booking
        const totalFees = localFees + outstationFees + premiumFees;
        
        // Skip if no success fees to invoice
        if (totalFees <= 0) {
          continue;
        }
        
        // Create invoice in Firestore
        const invoiceRef = db.collection('priestInvoices').doc();
        await invoiceRef.set({
          priestId: doc.id,
          priestName: priest.fullName || priest.name,
          priestEmail: priest.email,
          month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
          invoiceDate: admin.firestore.FieldValue.serverTimestamp(),
          dueDate: tomorrow,
          items: [
            {
              description: 'Local Bookings Success Fee',
              quantity: successfulBookings.local,
              rate: 30,
              amount: localFees
            },
            {
              description: 'Outstation Bookings Success Fee',
              quantity: successfulBookings.outstation,
              rate: 50,
              amount: outstationFees
            },
            {
              description: 'Premium Bookings Success Fee',
              quantity: successfulBookings.premium,
              rate: 100,
              amount: premiumFees
            }
          ],
          subtotal: totalFees,
          tax: Math.round(totalFees * 0.18), // 18% GST
          total: Math.round(totalFees * 1.18), // Total including GST
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create notification for the priest
        await db.collection('priestNotifications').add({
          priestId: doc.id,
          title: 'Monthly Success Fee Invoice',
          message: `Your success fee invoice for the month of ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()} has been generated. Total amount due: ₹${Math.round(totalFees * 1.18)}.`,
          type: 'invoice',
          actionUrl: `priest-portal/invoice.html?id=${invoiceRef.id}`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Reset the success fee counters for the next month
        await db.collection('priests').doc(doc.id).update({
          'subscription.successfulBookings': { local: 0, outstation: 0, premium: 0 },
          'subscription.lastSuccessFeeReset': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        invoiceCount++;
      }
      
      console.log(`Generated ${invoiceCount} monthly success fee invoices`);
      return null;
    } catch (error) {
      console.error('Error generating monthly success fee invoices:', error);
      
      // Log the error in Firestore
      await db.collection('errorLogs').add({
        type: 'invoice_generation_error',
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

/**
 * When a new booking document is created or updated, check if it's a confirmation and
 * increment the priest's successful bookings counter
 */
exports.onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onWrite(async (change, context) => {
    try {
      // Check if this is a new document or an update
      const beforeData = change.before.exists ? change.before.data() : null;
      const afterData = change.after.exists ? change.after.data() : null;
      
      // If document was deleted or no after data, skip
      if (!afterData) {
        return null;
      }
      
      // Get the booking status before and after
      const beforeStatus = beforeData ? beforeData.status : null;
      const afterStatus = afterData.status;
      
      // Only continue if this is a new confirmed booking or status changed to confirmed
      if (afterStatus !== 'confirmed' || (beforeData && beforeStatus === 'confirmed')) {
        return null;
      }
      
      // Get booking details
      const { priestId, bookingType } = afterData;
      if (!priestId) {
        console.error('Booking missing priestId:', context.params.bookingId);
        return null;
      }
      
      // Determine booking type for success fee calculation
      const bookingTypeForFee = determineBookingTypeForFee(afterData);
      
      // Increment the priest's successful bookings counter
      const successfulBookingsPath = `subscription.successfulBookings.${bookingTypeForFee}`;
      
      await db.collection('priests').doc(priestId).update({
        [successfulBookingsPath]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Incremented ${bookingTypeForFee} booking count for priest ${priestId}`);
      return null;
    } catch (error) {
      console.error('Error handling booking status change:', error);
      
      // Log the error in Firestore
      await db.collection('errorLogs').add({
        type: 'booking_status_change_error',
        bookingId: context.params.bookingId,
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

/**
 * When a new priest request is created, decrement the priest's remaining leads counter
 */
exports.onPriestRequestCreated = functions.firestore
  .document('priestRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    try {
      const requestData = snapshot.data();
      const { priestId } = requestData;
      
      if (!priestId) {
        console.error('Request missing priestId:', context.params.requestId);
        return null;
      }
      
      // Decrement the priest's remaining leads counter
      await db.collection('priests').doc(priestId).update({
        'subscription.remainingLeads': admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Decremented leads for priest ${priestId}`);
      return null;
    } catch (error) {
      console.error('Error handling priest request creation:', error);
      
      // Log the error in Firestore
      await db.collection('errorLogs').add({
        type: 'priest_request_creation_error',
        requestId: context.params.requestId,
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

/**
 * Helper function to get subscription plan details
 */
function getSubscriptionPlanDetails(planType) {
  const subscriptionPlans = {
    basic: {
      name: 'Basic',
      monthlyFee: 199,
      customerRequests: 10
    },
    standard: {
      name: 'Standard',
      monthlyFee: 499,
      customerRequests: 30
    },
    premium: {
      name: 'Premium',
      monthlyFee: 999,
      customerRequests: 999 // Unlimited
    }
  };
  
  return subscriptionPlans[planType] || null;
}

/**
 * Helper function to determine booking type for success fee
 */
function determineBookingTypeForFee(bookingData) {
  // If booking already has a specific type for fee, use it
  if (bookingData.feeType && ['local', 'outstation', 'premium'].includes(bookingData.feeType)) {
    return bookingData.feeType;
  }
  
  // Otherwise determine based on booking properties
  if (bookingData.isOutstation || bookingData.bookingDistance > 30) {
    return 'outstation';
  }
  
  // Check if it's a premium ceremony or service
  const premiumServices = [
    'wedding', 'marriage', 'upanayanam', 'thread ceremony', 
    'gruhapravesam', 'house warming', 'satyanarayan puja',
    'kumbhabhishekam', 'temple inauguration'
  ];
  
  const serviceName = bookingData.serviceName || bookingData.serviceType || '';
  
  if (premiumServices.some(service => serviceName.toLowerCase().includes(service)) ||
      bookingData.isPremium || bookingData.amount > 10000) {
    return 'premium';
  }
  
  // Default to local
  return 'local';
} 