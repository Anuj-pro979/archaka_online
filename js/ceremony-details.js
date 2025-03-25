document.addEventListener('DOMContentLoaded', function() {
    // Get ceremony from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ceremony = urlParams.get('ceremony');
    
    // Handle thumbnail gallery click
    const thumbnails = document.querySelectorAll('.thumbnail-gallery img');
    const mainImage = document.getElementById('mainImage');
    
    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Update main image
                mainImage.src = this.getAttribute('data-thumb');
                
                // Update active class
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // Handle read more button
    const readMoreBtn = document.getElementById('readMoreBtn');
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Fetch full ceremony details from Firestore
            if (ceremony) {
                db.collection('ceremonies').doc(ceremony)
                    .get()
                    .then(doc => {
                        if (doc.exists) {
                            const data = doc.data();
                            // Show full description in a modal or expanded section
                            alert('Full description functionality would be implemented here.');
                        }
                    })
                    .catch(error => {
                        console.error('Error getting ceremony details:', error);
                    });
            } else {
                // If not connected to Firestore yet, just show a placeholder
                alert('Full ceremony description would appear here.');
            }
        });
    }
    
    // Book Now button click handling
    const bookNowBtn = document.querySelector('.btn-book');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', function(e) {
            // Check if user is logged in
            if (!currentUser) {
                e.preventDefault();
                // Store the intended booking URL for redirect after login
                sessionStorage.setItem('redirectAfterLogin', this.href);
                window.location.href = 'login.html';
            }
        });
    }
});

// Load ceremony data from Firebase (if available)
function loadCeremonyData(ceremonySlug) {
    if (!ceremonySlug) return;
    
    // If Firebase is initialized, fetch ceremony data
    if (typeof db !== 'undefined') {
        db.collection('ceremonies').doc(ceremonySlug)
            .get()
            .then(doc => {
                if (doc.exists) {
                    updateCeremonyUI(doc.data());
                } else {
                    console.log('No ceremony data found for:', ceremonySlug);
                }
            })
            .catch(error => {
                console.error('Error getting ceremony data:', error);
            });
    }
}

// Update UI with ceremony data
function updateCeremonyUI(ceremonyData) {
    if (!ceremonyData) return;
    
    // Update title, description, price, etc.
    const titleElement = document.querySelector('h1');
    if (titleElement) titleElement.textContent = ceremonyData.name;
    
    const priceElement = document.querySelector('.price');
    if (priceElement) priceElement.textContent = `₹${ceremonyData.price.toFixed(2)}`;
    
    const descriptionElement = document.querySelector('.lead');
    if (descriptionElement) descriptionElement.textContent = ceremonyData.shortDescription;
    
    // Update other elements as needed
} 