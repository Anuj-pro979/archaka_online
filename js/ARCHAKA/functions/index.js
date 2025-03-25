// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure nodemailer with your SMTP settings
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password'     // Replace with your app password
    }
});

exports.sendBookingConfirmation = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userEmail, userName, orderDetails } = data;

    // Create email content
    const emailContent = `
        <h2>Booking Confirmation</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for booking services with Archaka Services. Here are your booking details:</p>
        
        <h3>Order Details</h3>
        <p>Order ID: ${orderDetails.orderId}</p>
        <p>Service Date: ${orderDetails.preferredDate}</p>
        <p>Service Time: ${orderDetails.preferredTime}</p>
        <p>Location: ${orderDetails.serviceLocation}</p>
        
        <h3>Services Booked:</h3>
        <ul>
            ${orderDetails.items.map(item => `
                <li>${item.name} - ₹${item.price.toFixed(2)} x ${item.quantity}</li>
            `).join('')}
        </ul>
        
        <p>Total Amount: ₹${orderDetails.total.toFixed(2)}</p>
        
        <p>Status: ${orderDetails.status}</p>
        
        <p>Our priest will contact you before the service. If you have any questions, please reply to this email.</p>
        
        <p>Best regards,<br>Archaka Services Team</p>
    `;

    // Send email
    try {
        await transporter.sendMail({
            from: '"Archaka Services" <your-email@gmail.com>',
            to: userEmail,
            subject: 'Booking Confirmation - Archaka Services',
            html: emailContent
        });

        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new functions.https.HttpsError('internal', 'Error sending email');
    }
});

// Optional: Send email on order status update
exports.onOrderStatusUpdate = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();

        // Only send email if status has changed
        if (newData.status === previousData.status) {
            return null;
        }

        const statusEmailContent = `
            <h2>Order Status Update</h2>
            <p>Dear ${newData.userName},</p>
            <p>Your order status has been updated:</p>
            <p>Order ID: ${context.params.orderId}</p>
            <p>New Status: ${newData.status}</p>
            <p>If you have any questions, please contact us.</p>
            <p>Best regards,<br>Archaka Services Team</p>
        `;

        try {
            await transporter.sendMail({
                from: '"Archaka Services" <your-email@gmail.com>',
                to: newData.userEmail,
                subject: `Order Status Update - ${newData.status}`,
                html: statusEmailContent
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending status update email:', error);
            return null;
        }
    });