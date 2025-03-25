const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Razorpay API credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_WcTQX42FAQu5zO';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'yourTestSecret';

/**
 * Verifies a Razorpay payment signature
 * 
 * @param {Object} data Request data containing orderId, paymentId, signature, and bookingId
 * @param {Object} context Firebase functions context
 * @returns {Object} Result of verification
 */
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to verify a payment'
      );
    }

    // Validate required fields
    if (!data.razorpay_order_id || !data.razorpay_payment_id || !data.razorpay_signature || !data.bookingId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, or bookingId'
      );
    }

    // Get the order from Firestore
    const orderSnapshot = await admin.firestore().collection('razorpayOrders').doc(data.razorpay_order_id).get();
    
    if (!orderSnapshot.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Order not found'
      );
    }
    
    const orderData = orderSnapshot.data();
    
    // Create the expected signature
    const payload = data.razorpay_order_id + '|' + data.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');
    
    // Verify the signature
    const isValid = expectedSignature === data.razorpay_signature;
    
    if (!isValid) {
      // Log invalid signature for security monitoring
      await admin.firestore().collection('securityAlerts').add({
        type: 'invalid_payment_signature',
        userId: context.auth.uid,
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
        bookingId: data.bookingId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Invalid payment signature'
      );
    }
    
    // Get the booking details
    const bookingSnapshot = await admin.firestore().collection('bookings').doc(data.bookingId).get();
    
    if (!bookingSnapshot.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Booking not found'
      );
    }
    
    const bookingData = bookingSnapshot.data();
    
    // Calculate priest's commission (90% of ceremony price)
    const priestCommission = Math.round(bookingData.ceremonyPrice * 0.9);
    const platformFee = bookingData.ceremonyPrice - priestCommission;
    
    // Update the booking status in Firestore
    await admin.firestore().collection('bookings').doc(data.bookingId).update({
      paymentStatus: 'verified',
      bookingStatus: 'confirmed',
      transactionId: data.razorpay_payment_id,
      transactionDetails: {
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature
      },
      priestCommission: priestCommission,
      platformFee: platformFee,
      commissionPaid: false,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update the order status
    await admin.firestore().collection('razorpayOrders').doc(data.razorpay_order_id).update({
      status: 'payment_verified',
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
      verificationMethod: 'server',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If the booking has a priest, update their records
    if (bookingData.priestId) {
      // Add to priest's orders collection
      await admin.firestore().collection('priests').doc(bookingData.priestId)
        .collection('orders').doc(data.bookingId).set({
          ...bookingData,
          paymentStatus: 'verified',
          bookingStatus: 'confirmed',
          transactionId: data.razorpay_payment_id,
          transactionDetails: {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature
          },
          priestCommission: priestCommission,
          platformFee: platformFee,
          commissionPaid: false,
          paymentDue: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      // Add to priest's earnings record
      await admin.firestore().collection('priests').doc(bookingData.priestId)
        .collection('earnings').add({
          bookingId: data.bookingId,
          ceremonyName: bookingData.ceremonyName,
          bookingDate: bookingData.bookingDate,
          amount: priestCommission,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      // Create a notification for the priest
      await admin.firestore().collection('priests').doc(bookingData.priestId)
        .collection('notifications').add({
          type: 'new_order',
          title: 'New Booking Confirmed',
          message: `You have a new confirmed booking for ${bookingData.ceremonyName}`,
          bookingId: data.bookingId,
          amount: priestCommission,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
    }
    
    // Return success
    return { success: true, message: 'Payment verification successful' };
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    
    // Log the error in Firestore for debugging
    await admin.firestore().collection('errorLogs').add({
      type: 'payment_verification_error',
      userId: context.auth ? context.auth.uid : null,
      orderId: data.orderId,
      paymentId: data.paymentId,
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return appropriate error
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify payment: ' + error.message
    );
  }
});