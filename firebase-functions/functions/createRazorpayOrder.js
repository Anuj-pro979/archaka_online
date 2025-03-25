const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Razorpay API credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_WcTQX42FAQu5zO';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'yourTestSecret';

// Razorpay API URL
const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

/**
 * Creates a Razorpay order for a ceremony booking
 * 
 * @param {Object} data Request data containing amount, currency, receipt, and notes
 * @param {Object} context Firebase functions context
 * @returns {Object} The created Razorpay order
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to create an order'
      );
    }

    // Validate required fields
    if (!data.amount || !data.currency || !data.receipt) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: amount, currency, or receipt'
      );
    }

    // Create basic auth header for Razorpay API
    const authorization = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    // Make request to Razorpay API to create order
    const response = await axios.post(
      `${RAZORPAY_API_URL}/orders`,
      {
        amount: data.amount,
        currency: data.currency,
        receipt: data.receipt,
        notes: data.notes || {}
      },
      {
        headers: {
          'Authorization': `Basic ${authorization}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log the order creation for debugging
    console.log('Razorpay order created:', response.data);
    
    // Store the order in Firestore for reference
    await admin.firestore().collection('razorpayOrders').doc(response.data.id).set({
      orderId: response.data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      notes: data.notes || {},
      status: response.data.status,
      bookingId: data.notes?.bookingId,
      userId: context.auth.uid,
      priestId: data.notes?.priestId,
      ceremonyId: data.notes?.ceremonyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return the created order data
    return response.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    // If it's an axios error with a response, log it for debugging
    if (error.response) {
      console.error('Razorpay API error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    // Log the error in Firestore for debugging
    await admin.firestore().collection('errorLogs').add({
      type: 'razorpay_order_creation_error',
      userId: context.auth ? context.auth.uid : null,
      error: error.message,
      stack: error.stack,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return appropriate error
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create Razorpay order'
    );
  }
});