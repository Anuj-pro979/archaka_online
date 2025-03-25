// Image Fallbacks Script
// This script handles missing images by providing fallbacks

document.addEventListener('DOMContentLoaded', function() {
    // List of image elements to check and provide fallbacks for
    const imageSelectors = [
        // Footer partners image
        'img[src="images/partners.png"]',
        // Any priest images
        'img[src^="images/services/priest"]',
        // Generic fallbacks for any image
        'img[src$=".jpg"]',
        'img[src$=".png"]',
        'img[src$=".webp"]'
    ];
    
    // Apply fallbacks to matching images
    imageSelectors.forEach(selector => {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            img.onerror = function() {
                handleImageError(this);
            };
            
            // Force error handling for images that have already failed
            if (img.complete && img.naturalHeight === 0) {
                handleImageError(img);
            }
        });
    });
    
    // Special handling for partners.png in the footer
    const partnersImages = document.querySelectorAll('img[src="images/partners.png"]');
    if (partnersImages.length > 0) {
        partnersImages.forEach(img => {
            img.style.height = '40px';
            img.style.background = '#f8f9fa';
            img.style.borderRadius = '4px';
            img.style.padding = '8px';
            
            // Create a default partners image using a canvas
            createPartnersImage(img);
        });
    }
});

/**
 * Handle image loading errors by providing appropriate fallbacks
 */
function handleImageError(img) {
    const src = img.getAttribute('src');
    
    if (src === 'images/partners.png') {
        // For partners image
        createPartnersImage(img);
    } else if (src.includes('priest')) {
        // For priest images
        img.src = 'https://via.placeholder.com/120x120/8e44ad/ffffff?text=Priest';
    } else if (src.includes('ceremony') || src.includes('service')) {
        // For ceremony images
        img.src = 'https://via.placeholder.com/300x200/3498db/ffffff?text=Ceremony';
    } else if (src.includes('puja')) {
        // For puja images
        img.src = 'https://via.placeholder.com/300x200/27ae60/ffffff?text=Puja';
    } else if (src.includes('homa')) {
        // For homa images
        img.src = 'https://via.placeholder.com/300x200/e74c3c/ffffff?text=Homa';
    } else if (src.includes('japam')) {
        // For japam images
        img.src = 'https://via.placeholder.com/300x200/f39c12/ffffff?text=Japam';
    } else {
        // Generic fallback
        const width = img.getAttribute('width') || 150;
        const height = img.getAttribute('height') || 150;
        const text = img.getAttribute('alt') || 'Image';
        img.src = `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=${encodeURIComponent(text)}`;
    }
    
    img.onerror = null; // Prevent infinite loop
}

/**
 * Create a partners image canvas with text
 */
function createPartnersImage(img) {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 40;
    
    // Get 2D context
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#8e44ad');
    gradient.addColorStop(0.5, '#3498db');
    gradient.addColorStop(1, '#27ae60');
    
    // Draw text
    ctx.fillStyle = gradient;
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Archaka Partner Organizations', canvas.width / 2, canvas.height / 2);
    
    // Add decorative elements
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(50, 10);
    ctx.moveTo(canvas.width - 50, 10);
    ctx.lineTo(canvas.width - 10, 10);
    ctx.moveTo(10, canvas.height - 10);
    ctx.lineTo(50, canvas.height - 10);
    ctx.moveTo(canvas.width - 50, canvas.height - 10);
    ctx.lineTo(canvas.width - 10, canvas.height - 10);
    ctx.stroke();
    
    // Set as image source
    img.src = canvas.toDataURL('image/png');
} 