const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Import Razorpay-related functions
const { createRazorpayOrder } = require('./createRazorpayOrder');
const { verifyRazorpayPayment } = require('./verifyRazorpayPayment');

// Import webhook handler and other functions from webhook.js
const {
  razorpayWebhook,
  checkExpiringSubscriptions,
  processSubscriptionRenewals,
  resetMonthlyLeads,
  generateMonthlySuccessFeeInvoices,
  onBookingStatusChange,
  onPriestRequestCreated
} = require('./webhook');

// Export the functions
exports.createRazorpayOrder = createRazorpayOrder;
exports.verifyRazorpayPayment = verifyRazorpayPayment;
exports.razorpayWebhook = razorpayWebhook;
exports.checkExpiringSubscriptions = checkExpiringSubscriptions;
exports.processSubscriptionRenewals = processSubscriptionRenewals;
exports.resetMonthlyLeads = resetMonthlyLeads;
exports.generateMonthlySuccessFeeInvoices = generateMonthlySuccessFeeInvoices;
exports.onBookingStatusChange = onBookingStatusChange;
exports.onPriestRequestCreated = onPriestRequestCreated;

/**
 * Function to confirm a booking and increment the priest's success count
 */
exports.confirmBooking = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to confirm a booking'
      );
    }

    // Validate required fields
    if (!data.bookingId || !data.priestId || !data.bookingType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: bookingId, priestId, or bookingType'
      );
    }

    // Start a Firestore transaction to ensure atomic updates
    const result = await admin.firestore().runTransaction(async (transaction) => {
      // Get the booking document
      const bookingRef = admin.firestore().collection('bookings').doc(data.bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      // Check if booking exists
      if (!bookingDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Booking not found');
      }

      const booking = bookingDoc.data();

      // Check if booking is already confirmed
      if (booking.status === 'confirmed') {
        return { success: true, message: 'Booking already confirmed' };
      }

      // Verify the booking belongs to the specified priest
      if (booking.priestId !== data.priestId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'This booking does not belong to the specified priest'
        );
      }

      // Update booking status
      transaction.update(bookingRef, {
        status: 'confirmed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Determine booking type for success fee calculation
      const bookingTypeForFee = determineBookingTypeForFee(booking, data.bookingType);

      // Increment the priest's successful bookings counter
      const priestRef = admin.firestore().collection('priests').doc(data.priestId);
      const successfulBookingsPath = `subscription.successfulBookings.${bookingTypeForFee}`;
      
      transaction.update(priestRef, {
        [successfulBookingsPath]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create notification for the priest
      const priestNotificationRef = admin.firestore().collection('priestNotifications').doc();
      transaction.set(priestNotificationRef, {
        priestId: data.priestId,
        title: 'Booking Confirmed',
        message: `Booking #${data.bookingId} has been confirmed. Check your schedule for details.`,
        type: 'booking',
        bookingId: data.bookingId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create notification for the customer
      if (booking.userId) {
        const userNotificationRef = admin.firestore().collection('userNotifications').doc();
        transaction.set(userNotificationRef, {
          userId: booking.userId,
          title: 'Booking Confirmed',
          message: `Your booking #${data.bookingId} has been confirmed. Check your bookings for details.`,
          type: 'booking',
          bookingId: data.bookingId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true, message: 'Booking confirmed successfully' };
    });

    return result;
  } catch (error) {
    console.error('Error confirming booking:', error);
    
    // Log the error in Firestore for debugging
    await admin.firestore().collection('errorLogs').add({
      type: 'booking_confirmation_error',
      userId: context.auth ? context.auth.uid : null,
      bookingId: data.bookingId,
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return appropriate error
    throw new functions.https.HttpsError(
      'internal',
      'Failed to confirm booking: ' + error.message
    );
  }
});

/**
 * Function to create a priest request and decrement the priest's remaining leads
 */
exports.createPriestRequest = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to create a request'
      );
    }

    // Validate required fields
    if (!data.priestId || !data.requestData) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: priestId or requestData'
      );
    }

    // Start a Firestore transaction to ensure atomic updates
    const result = await admin.firestore().runTransaction(async (transaction) => {
      // Get the priest document
      const priestRef = admin.firestore().collection('priests').doc(data.priestId);
      const priestDoc = await transaction.get(priestRef);

      // Check if priest exists
      if (!priestDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Priest not found');
      }

      const priest = priestDoc.data();
      const subscription = priest.subscription || {};
      const remainingLeads = subscription.remainingLeads || 0;

      // Check if the priest has remaining leads
      if (remainingLeads <= 0 && subscription.plan !== 'premium') {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'This priest has reached their monthly request limit'
        );
      }

      // Create the priest request
      const requestRef = admin.firestore().collection('priestRequests').doc();
      const requestData = {
        ...data.requestData,
        priestId: data.priestId,
        userId: context.auth.uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.set(requestRef, requestData);

      // Decrement the priest's remaining leads if not premium
      if (subscription.plan !== 'premium') {
        transaction.update(priestRef, {
          'subscription.remainingLeads': admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Create notification for the priest
      const priestNotificationRef = admin.firestore().collection('priestNotifications').doc();
      transaction.set(priestNotificationRef, {
        priestId: data.priestId,
        title: 'New Customer Request',
        message: 'You have received a new customer request. Check your requests for details.',
        type: 'request',
        requestId: requestRef.id,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { 
        success: true, 
        message: 'Request created successfully',
        requestId: requestRef.id
      };
    });

    return result;
  } catch (error) {
    console.error('Error creating priest request:', error);
    
    // Log the error in Firestore for debugging
    await admin.firestore().collection('errorLogs').add({
      type: 'priest_request_creation_error',
      userId: context.auth ? context.auth.uid : null,
      priestId: data.priestId,
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return appropriate error
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create request: ' + error.message
    );
  }
});

/**
 * Helper function to determine booking type for success fee
 */
function determineBookingTypeForFee(booking, defaultType = 'local') {
  // If booking already has a specific type for fee, use it
  if (booking.feeType && ['local', 'outstation', 'premium'].includes(booking.feeType)) {
    return booking.feeType;
  }
  
  // Otherwise determine based on booking properties
  if (booking.isOutstation || (booking.bookingDistance && booking.bookingDistance > 30)) {
    return 'outstation';
  }
  
  // Check if it's a premium ceremony or service
  const premiumServices = [
    'wedding', 'marriage', 'upanayanam', 'thread ceremony', 
    'gruhapravesam', 'house warming', 'satyanarayan puja',
    'kumbhabhishekam', 'temple inauguration'
  ];
  
  const serviceName = booking.serviceName || booking.serviceType || '';
  
  if (premiumServices.some(service => serviceName.toLowerCase().includes(service)) ||
      booking.isPremium || (booking.amount && booking.amount > 10000)) {
    return 'premium';
  }
  
  // Default to the provided type or local
  return defaultType || 'local';
} 