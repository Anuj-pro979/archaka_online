document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Chat icon click event
    const chatIcon = document.querySelector('.chat-icon');
    if (chatIcon) {
        chatIcon.addEventListener('click', function() {
            // Implement chat functionality here
            alert('Chat support will be available soon!');
        });
    }
    
    // Handle ceremony card hover effects for mobile
    const ceremonyCards = document.querySelectorAll('.ceremony-card');
    if (ceremonyCards.length > 0 && window.innerWidth < 768) {
        ceremonyCards.forEach(card => {
            const overlay = card.querySelector('.ceremony-overlay');
            if (overlay) {
                card.addEventListener('click', function(e) {
                    // Get the target of the click
                    const target = e.target;
                    
                    // Check if the click was on the card but not on the link
                    if (!target.closest('a.stretched-link')) {
                        e.preventDefault();
                        
                        // Toggle the overlay height
                        if (overlay.style.height === '100%') {
                            overlay.style.height = '40%';
                        } else {
                            overlay.style.height = '100%';
                        }
                    }
                });
            }
        });
    }
    
    // Handle search input
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    // Implement search functionality
                    window.location.href = `search-results.html?q=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }
});

// Function to get URL parameter
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

// Preload images for better user experience
function preloadImages(images) {
    if (!preloadImages.list) {
        preloadImages.list = [];
    }
    for (let i = 0; i < images.length; i++) {
        const img = new Image();
        img.src = images[i];
        preloadImages.list.push(img);
    }
} 