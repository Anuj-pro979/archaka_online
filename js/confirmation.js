document.addEventListener('DOMContentLoaded', function() {
    // Get booking ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    
    // Display booking ID
    const bookingIdElement = document.getElementById('bookingId');
    if (bookingIdElement && bookingId) {
        bookingIdElement.textContent = `PS-${bookingId.substring(0, 6)}`;
    }
    
    // If Firebase is initialized and user is logged in, fetch booking details
    if (typeof db !== 'undefined' && currentUser) {
        if (bookingId) {
            db.collection('bookings').doc(bookingId)
                .get()
                .then(doc => {
                    if (doc.exists && doc.data().userId === currentUser.uid) {
                        const bookingData = doc.data();
                        updateBookingDetails(bookingData);
                    } else {
                        console.log('No booking found or not authorized to view this booking');
                    }
                })
                .catch(error => {
                    console.error('Error getting booking:', error);
                });
        }
    }
    
    // Handle download invoice button click
    const downloadInvoiceBtn = document.getElementById('downloadInvoiceBtn');
    if (downloadInvoiceBtn) {
        downloadInvoiceBtn.addEventListener('click', function(e) {
            e.preventDefault();
            generateInvoice();
        });
    }
});

// Update booking details in the UI
function updateBookingDetails(bookingData) {
    if (!bookingData) return;
    
    // Update ceremony details
    const ceremonyNameElement = document.getElementById('ceremonyName');
    if (ceremonyNameElement) ceremonyNameElement.textContent = formatCeremonyName(bookingData.ceremony);
    
    const ceremonyDateElement = document.getElementById('ceremonyDate');
    if (ceremonyDateElement) ceremonyDateElement.textContent = bookingData.date;
    
    const ceremonyTimeElement = document.getElementById('ceremonyTime');
    if (ceremonyTimeElement) {
        let timeText = bookingData.time;
        switch(bookingData.time) {
            case 'morning':
                timeText = 'Morning (6:00 AM - 12:00 PM)';
                break;
            case 'afternoon':
                timeText = 'Afternoon (12:00 PM - 4:00 PM)';
                break;
            case 'evening':
                timeText = 'Evening (4:00 PM - 8:00 PM)';
                break;
        }
        ceremonyTimeElement.textContent = timeText;
    }
    
    const priestNameElement = document.getElementById('priestName');
    if (priestNameElement) priestNameElement.textContent = bookingData.priestName;
    
    // Update payment details
    const amountPaidElement = document.getElementById('amountPaid');
    if (amountPaidElement) amountPaidElement.textContent = `₹${bookingData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const paymentMethodElement = document.getElementById('paymentMethod');
    if (paymentMethodElement) paymentMethodElement.textContent = bookingData.paymentMethod || 'Credit Card';
    
    const transactionIdElement = document.getElementById('transactionId');
    if (transactionIdElement) transactionIdElement.textContent = bookingData.transactionId || `TXN${Date.now().toString().substring(0, 10)}`;
}

// Generate and download invoice
function generateInvoice() {
    // Get booking details
    const bookingId = document.getElementById('bookingId').textContent;
    const ceremonyName = document.getElementById('ceremonyName').textContent;
    const ceremonyDate = document.getElementById('ceremonyDate').textContent;
    const ceremonyTime = document.getElementById('ceremonyTime').textContent;
    const priestName = document.getElementById('priestName').textContent;
    const amountPaid = document.getElementById('amountPaid').textContent;
    
    // In a real implementation, this would generate a PDF invoice
    // For now, we'll just create a simple text representation
    const invoiceContent = `
    ===========================================
                PRIEST SERVICES
    ===========================================
    
    INVOICE
    
    Booking ID: ${bookingId}
    Date: ${new Date().toLocaleDateString()}
    
    Ceremony: ${ceremonyName}
    Date: ${ceremonyDate}
    Time: ${ceremonyTime}
    Priest: ${priestName}
    
    ---------------------------------------
    Amount Paid: ${amountPaid}
    ---------------------------------------
    
    Thank you for choosing Priest Services!
    
    For any queries, please contact:
    support@priestservices.com
    +91 9500095649
    
    ===========================================
    `;
    
    // Create a Blob containing the invoice content
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${bookingId}.txt`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Format ceremony name for display (e.g., "naamakaranam" -> "Naamakaranam")
function formatCeremonyName(ceremonySlug) {
    if (!ceremonySlug) return '';
    return ceremonySlug.charAt(0).toUpperCase() + ceremonySlug.slice(1).replace(/-/g, ' ');
}