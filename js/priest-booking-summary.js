// priest-booking-summary.js - Handles the booking summary functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if the booking summary section exists
    const bookingSummarySection = document.getElementById('bookingSummary');
    
    // If it doesn't exist, create it
    if (!bookingSummarySection) {
        createBookingSummarySection();
    }
});

/**
 * Create the booking summary section dynamically
 */
function createBookingSummarySection() {
    // Get the container where we'll add the booking summary
    const container = document.querySelector('.container');
    const mainSection = document.querySelector('section.py-5');
    
    if (!container || !mainSection) {
        console.error('Container or main section not found');
        return;
    }
    
    // Create the proceed section
    const proceedSection = document.createElement('div');
    proceedSection.id = 'proceedSection';
    proceedSection.className = 'mt-5';
    
    // Create the booking summary card
    const bookingSummary = document.createElement('div');
    bookingSummary.id = 'bookingSummary';
    bookingSummary.className = 'card border-0 shadow-sm d-none';
    
    // Set the HTML content for the booking summary
    bookingSummary.innerHTML = `
        <div class="card-header bg-white">
            <h5 class="mb-0">Booking Summary</h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <p class="mb-2"><strong>Service:</strong> <span id="summaryServiceName">Not selected</span></p>
                    <p class="mb-2"><strong>Date:</strong> <span id="summaryDate">Not selected</span></p>
                    <p class="mb-2"><strong>Time:</strong> <span id="summaryTime">Not selected</span></p>
                </div>
                <div class="col-md-6">
                    <p class="mb-2"><strong>Location:</strong> <span id="summaryLocation">Not selected</span></p>
                    <p class="mb-2"><strong>Priest:</strong> <span id="summaryPriest">Not selected</span></p>
                </div>
            </div>
            <div class="d-grid gap-2 mt-3">
                <button id="proceedToBookingBtn" class="btn btn-primary btn-lg">
                    <i class="fas fa-check-circle me-2"></i>Proceed to Payment
                </button>
            </div>
        </div>
    `;
    
    // Add the booking summary to the proceed section
    proceedSection.appendChild(bookingSummary);
    
    // Add the proceed section after the main section
    mainSection.after(proceedSection);
    
    console.log('Booking summary section created');
}