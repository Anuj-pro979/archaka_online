// service-cards.js - Dynamic service card generator

document.addEventListener('DOMContentLoaded', function() {
    // Check if servicesData exists (imported from services-data.js)
    if (typeof servicesData === 'undefined') {
        console.error('Services data not found. Make sure services-data.js is loaded before this script.');
        return;
    }

    // Initialize services on the page
    initializeServices();
});

/**
 * Initialize services by detecting the page type and rendering appropriate cards
 */
function initializeServices() {
    // Determine which page we're on based on the URL or page elements
    const currentPath = window.location.pathname;
    const pageTitle = document.querySelector('h1')?.textContent.trim().toLowerCase() || '';
    
    if (currentPath.includes('ceremonies') || pageTitle.includes('ceremonies')) {
        renderServiceCards('Ceremonies');
    } else if (currentPath.includes('pujas') || pageTitle.includes('pujas')) {
        renderServiceCards('Pujas');
    } else if (currentPath.includes('japam') || pageTitle.includes('japam') || 
               currentPath.includes('japa') || pageTitle.includes('japa')) {
        renderServiceCards('Japa');
    } else if (currentPath.includes('homas') || pageTitle.includes('homas') || 
               currentPath.includes('homam') || pageTitle.includes('homam')) {
        renderServiceCards('Homas');
    }
}

/**
 * Render service cards for a specific service type
 * @param {string} serviceType - Type of service (Ceremonies, Pujas, Japa, Homas)
 */
function renderServiceCards(serviceType) {
    const services = servicesData[serviceType];
    if (!services) {
        console.error(`No data found for service type: ${serviceType}`);
        return;
    }

    // Find the container element for the service cards
    const container = document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-lg-4.g-4') || 
                    document.querySelector('.container .row') ||
                    document.querySelector('#servicesContainer');
    
    if (!container) {
        console.error('Service container not found on the page.');
        return;
    }

    // Clear existing content
    container.innerHTML = '';
    
    // Create cards for each service
    services.forEach(service => {
        const card = createServiceCard(service, serviceType);
        container.appendChild(card);
    });
}

/**
 * Create a service card element
 * @param {Object} service - Service data object
 * @param {string} serviceType - Type of service (Ceremonies, Pujas, Japa, Homas)
 * @returns {HTMLElement} - Card column element
 */
function createServiceCard(service, serviceType) {
    const col = document.createElement('div');
    col.className = 'col';
    
    // Default image if none provided
    const imageSrc = service.image || `images/${serviceType.toLowerCase()}-placeholder.jpg`;
    
    // Format URL-friendly service name
    const serviceSlug = service.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    // Determine details page URL based on service type - using unified service-details.html
    let detailsPageUrl;
    switch(serviceType) {
        case 'Ceremonies':
            detailsPageUrl = `service-details.html?ceremony=${serviceSlug}`;
            break;
        case 'Pujas':
            detailsPageUrl = `service-details.html?puja=${serviceSlug}`;
            break;
        case 'Japa':
            detailsPageUrl = `service-details.html?japa=${serviceSlug}`;
            break;
        case 'Homas':
            detailsPageUrl = `service-details.html?homa=${serviceSlug}`;
            break;
        default:
            detailsPageUrl = `#`;
    }
    
    // Create card HTML based on service type
    if (serviceType === 'Ceremonies') {
        col.innerHTML = `
            <div class="card h-100 ceremony-card">
                <div class="position-relative">
                    <img src="${imageSrc}" class="card-img-top" alt="${service.name}">
                    <div class="ceremony-overlay">
                        <p class="text-white p-3">${service.description}</p>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${service.name}</h5>
                    <a href="${detailsPageUrl}" class="stretched-link"></a>
                </div>
            </div>
        `;
    } else {
        // For Pujas, Japa, and Homas
        col.innerHTML = `
            <div class="card h-100 service-card">
                <div class="position-relative">
                    <img src="${imageSrc}" class="card-img-top" alt="${service.name}">
                    <div class="service-overlay">
                        <p class="text-white p-3">${service.benefits}</p>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${service.name}</h5>
                    <a href="${detailsPageUrl}" class="stretched-link"></a>
                </div>
            </div>
        `;
    }
    
    return col;
}

/**
 * Create service cards for a specific section
 * @param {string} serviceType - Type of service (Ceremonies, Pujas, Japa, Homas)
 * @param {HTMLElement} container - Container element for the cards
 * @param {number} limit - Maximum number of cards to display (optional)
 */
function createServiceSection(serviceType, container, limit = null) {
    if (!container) return;
    
    const services = servicesData[serviceType];
    if (!services) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Limit the number of services if specified
    const servicesToShow = limit ? services.slice(0, limit) : services;
    
    // Create cards for each service
    servicesToShow.forEach(service => {
        const card = createServiceCard(service, serviceType);
        container.appendChild(card);
    });
}

/**
 * Initialize service cards on demand for a specific container
 * @param {string} serviceType - Type of service (Ceremonies, Pujas, Japa, Homas)
 * @param {string} containerSelector - CSS selector for the container
 * @param {number} limit - Maximum number of cards to display (optional)
 */
function initServiceCards(serviceType, containerSelector, limit = null) {
    const container = document.querySelector(containerSelector);
    if (container) {
        createServiceSection(serviceType, container, limit);
    }
} 