// service-details.js - Handles dynamic content for service details page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize datepicker
    flatpickr("#serviceDate", {
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            // Generate time slots when date is selected
            generateTimeSlots(dateStr);
        },
        disable: [
            function(date) {
                // Disable dates as needed (e.g., past dates)
                return false;
            }
        ]
    });

    // Get service information from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = getServiceTypeFromUrl(urlParams);
    const serviceId = getServiceIdFromUrl(urlParams, serviceType);
    
    // Hide benefits section by default (will show it only for non-ceremonies)
    document.getElementById('serviceBenefits').style.display = 'none';
    
    // Load service details if we have valid parameters
    if (serviceType && serviceId) {
        loadServiceDetails(serviceType, serviceId);
    } else {
        showErrorMessage("Service not found. Please try again.");
    }

    // Set up event handlers
    setupEventHandlers();
    
    // Update cart count
    updateCartCount();
    
    // Check if user is logged in
    checkUserAuthentication();
});

/**
 * Get service type from URL parameters
 */
function getServiceTypeFromUrl(urlParams) {
    if (urlParams.has('ceremony')) return 'Ceremonies';
    if (urlParams.has('puja')) return 'Pujas';
    if (urlParams.has('japa')) return 'Japa';
    if (urlParams.has('homa')) return 'Homas';
    return null;
}

/**
 * Get service ID (name in slug form) from URL parameters
 */
function getServiceIdFromUrl(urlParams, serviceType) {
    if (!serviceType) return null;
    
    switch (serviceType) {
        case 'Ceremonies': return urlParams.get('ceremony');
        case 'Pujas': return urlParams.get('puja');
        case 'Japa': return urlParams.get('japa');
        case 'Homas': return urlParams.get('homa');
        default: return null;
    }
}

/**
 * Load service details based on service type and ID
 */
function loadServiceDetails(serviceType, serviceId) {
    // Make sure servicesData is available
    if (typeof servicesData === 'undefined') {
        console.error('Services data not found. Make sure services-data.js is loaded before this script.');
        showErrorMessage("Service data could not be loaded.");
        return;
    }
    
    // Find the service in the data
    const services = servicesData[serviceType];
    if (!services) {
        showErrorMessage(`No data found for service type: ${serviceType}`);
        return;
    }
    
    // Convert serviceId from slug back to a possible name
    const serviceSlug = serviceId.toLowerCase();
    const service = services.find(s => {
        const slug = s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        return slug === serviceSlug;
    });
    
    if (!service) {
        showErrorMessage(`Service not found: ${serviceId}`);
        return;
    }
    
    // Update the page with service details
    updatePageWithServiceDetails(service, serviceType);
    
    // Load related services
    loadRelatedServices(serviceType, service.name);
}

/**
 * Update the page with service details
 */
function updatePageWithServiceDetails(service, serviceType) {
    // Update page title
    document.title = `${service.name} - Priest Services`;
    
    // Update breadcrumb
    const serviceTypeLink = document.getElementById('serviceTypeLink');
    const serviceTypeLinkHref = document.getElementById('serviceTypeLinkHref');
    serviceTypeLink.textContent = serviceType;
    serviceTypeLinkHref.href = `${serviceType.toLowerCase()}.html`;
    
    document.getElementById('serviceName').textContent = service.name;
    
    // Update service details
    document.getElementById('serviceTitle').textContent = service.name;
    document.getElementById('serviceTypeTag').textContent = serviceType;
    
    // Update service image
    const serviceImage = document.getElementById('serviceImage');
    serviceImage.src = service.image || `images/${serviceType.toLowerCase()}-placeholder.jpg`;
    serviceImage.alt = service.name;
    
    // Update description/benefits based on service type
    if (serviceType === 'Ceremonies') {
        document.getElementById('serviceDescription').textContent = service.description || '';
        document.getElementById('serviceBenefits').style.display = 'none';
    } else {
        document.getElementById('serviceDescription').textContent = 'This service is performed by our experienced priests following authentic Vedic traditions.';
        document.getElementById('serviceBenefits').style.display = 'block';
        document.getElementById('benefitsText').textContent = service.benefits || '';
    }
    
    // Update the overview tab
    let overviewText = '';
    switch(serviceType) {
        case 'Ceremonies':
            overviewText = `${service.name} is an important ceremony in Hindu tradition. ${service.description} Our experienced priests perform this ceremony with attention to detail, following all traditional rituals.`;
            break;
        case 'Pujas':
            overviewText = `${service.name} is a sacred ritual dedicated to invoke divine blessings. ${service.benefits} Our priests perform this puja with devotion and precision, following authentic Vedic traditions.`;
            break;
        case 'Japa':
            overviewText = `${service.name} involves the meditative repetition of sacred mantras. ${service.benefits} Our priests have mastered the correct pronunciation and technique for performing this japa with maximum efficacy.`;
            break;
        case 'Homas':
            overviewText = `${service.name} is a sacred fire ritual where offerings are made into the consecrated fire. ${service.benefits} Our priests perform this homam following traditional procedures with appropriate mantras and rituals.`;
            break;
    }
    document.getElementById('overviewText').textContent = overviewText;
    
    // Update share link
    document.getElementById('shareLink').value = window.location.href;
}

/**
 * Load related services
 */
function loadRelatedServices(serviceType, currentServiceName) {
    const services = servicesData[serviceType];
    if (!services) return;
    
    // Get random 3 services from the same type, excluding the current one
    const relatedServices = services
        .filter(service => service.name !== currentServiceName)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    const container = document.getElementById('relatedServicesContainer');
    container.innerHTML = '';
    
    // Create HTML for each related service
    relatedServices.forEach(service => {
        const serviceSlug = service.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        let detailsPageUrl = '';
        
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
        }
        
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'col';
        serviceDiv.innerHTML = `
            <div class="d-flex align-items-center p-2 border rounded">
                <img src="${service.image || `images/${serviceType.toLowerCase()}-placeholder.jpg`}" alt="${service.name}" class="rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">
                <div>
                    <h6 class="mb-1">${service.name}</h6>
                    <a href="${detailsPageUrl}" class="text-decoration-none">View details</a>
                </div>
            </div>
        `;
        
        container.appendChild(serviceDiv);
    });
}

/**
 * Set up event handlers for the page
 */
function setupEventHandlers() {
    // Share button
    document.getElementById('shareBtn').addEventListener('click', function() {
        const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        shareModal.show();
    });
    
    // Copy share link button
    document.getElementById('copyLinkBtn').addEventListener('click', function() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        document.execCommand('copy');
        this.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });
    
    // Location type change
    document.getElementById('locationType').addEventListener('change', function() {
        const addressContainer = document.getElementById('addressInputContainer');
        if (this.value === 'home' || this.value === 'venue') {
            addressContainer.classList.remove('d-none');
        } else {
            addressContainer.classList.add('d-none');
        }
    });
    
    // Location method change (manual/live)
    document.querySelectorAll('input[name="locationMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const manualContainer = document.getElementById('manualAddressContainer');
            const liveContainer = document.getElementById('liveLocationContainer');
            
            if (this.value === 'manual') {
                manualContainer.classList.remove('d-none');
                liveContainer.classList.add('d-none');
            } else {
                manualContainer.classList.add('d-none');
                liveContainer.classList.remove('d-none');
            }
        });
    });
    
    // Detect location button
    document.getElementById('detectLocationBtn').addEventListener('click', function() {
        detectUserLocation();
    });
    
    // Book now button
    document.getElementById('bookNowBtn').addEventListener('click', function() {
        handleBookNowClick();
    });
    
    // Service date change - will trigger time slot generation
    document.getElementById('serviceDate').addEventListener('change', function() {
        generateTimeSlots(this.value);
    });
    
    // Share buttons
    document.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.getAttribute('data-platform');
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(`Check out this service: ${document.getElementById('serviceTitle').textContent}`);
            
            let shareUrl = '';
            switch(platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${text} ${url}`;
                    break;
                case 'email':
                    shareUrl = `mailto:?subject=${text}&body=${text} ${url}`;
                    break;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank');
            }
        });
    });
}

/**
 * Generate time slots based on selected date
 * @param {string} dateStr - Selected date in YYYY-MM-DD format
 */
function generateTimeSlots(dateStr) {
    const timeSelect = document.getElementById('serviceTime');
    
    // Clear existing options except the first one
    while (timeSelect.options.length > 1) {
        timeSelect.remove(1);
    }
    
    // Get current date to compare
    const currentDate = new Date();
    const selectedDate = new Date(dateStr);
    const isToday = currentDate.toDateString() === selectedDate.toDateString();
    
    // Generate half-hour slots from 6:00 AM to 9:00 PM
    // If today, only show future time slots
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    
    for (let hour = 6; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            // Skip past times if today
            if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
                continue;
            }
            
            const formattedHour = hour % 12 || 12; // Convert to 12-hour format
            const period = hour < 12 ? 'AM' : 'PM';
            const formattedMinute = minute === 0 ? '00' : '30';
            const timeText = `${formattedHour}:${formattedMinute} ${period}`;
            const timeValue = `${hour.toString().padStart(2, '0')}:${formattedMinute}`;
            
            const option = document.createElement('option');
            option.value = timeValue;
            option.textContent = timeText;
            timeSelect.appendChild(option);
        }
    }
    
    // If no slots available
    if (timeSelect.options.length === 1) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No time slots available for this date";
        option.disabled = true;
        timeSelect.appendChild(option);
    }
}

/**
 * Detect user's location using Geolocation API
 */
function detectUserLocation() {
    const detectBtn = document.getElementById('detectLocationBtn');
    const locationDisplay = document.getElementById('detectedLocationDisplay');
    const locationText = document.getElementById('detectedLocationText');
    
    // Change button state
    detectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Detecting...';
    detectBtn.disabled = true;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Reverse geocoding to get address (using browser's API or a service like Google Maps)
                // For demo, we'll just show coordinates
                reverseGeocode(latitude, longitude, function(address) {
                    locationText.textContent = address || `Detected at coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    locationDisplay.classList.remove('d-none');
                    detectBtn.innerHTML = '<i class="fas fa-location-arrow me-2"></i>Update My Location';
                    detectBtn.disabled = false;
                    
                    // Store location data for form submission
                    document.getElementById('detectedLocationDisplay').dataset.latitude = latitude;
                    document.getElementById('detectedLocationDisplay').dataset.longitude = longitude;
                    document.getElementById('detectedLocationDisplay').dataset.address = address || '';
                });
            },
            // Error callback
            function(error) {
                let errorMessage = "Could not detect your location.";
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access was denied. Please check your browser permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable. Please try again later.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please try again.";
                        break;
                }
                
                locationText.textContent = errorMessage;
                locationDisplay.classList.remove('d-none');
                locationDisplay.classList.remove('alert-info');
                locationDisplay.classList.add('alert-danger');
                detectBtn.innerHTML = '<i class="fas fa-location-arrow me-2"></i>Try Again';
                detectBtn.disabled = false;
            }
        );
    } else {
        locationText.textContent = "Geolocation is not supported by your browser.";
        locationDisplay.classList.remove('d-none');
        locationDisplay.classList.remove('alert-info');
        locationDisplay.classList.add('alert-danger');
        detectBtn.innerHTML = '<i class="fas fa-location-arrow me-2"></i>Detect My Location';
        detectBtn.disabled = false;
    }
}

/**
 * Reverse geocode coordinates to address (simplified mock implementation)
 * In a real app, you would use a service like Google Maps API
 */
function reverseGeocode(latitude, longitude, callback) {
    // Simulate an API call
    setTimeout(() => {
        // This is a mock response
        // In reality, you would make an API call to a geocoding service
        const mockAddress = "123 Main St, City, State, Country";
        callback(mockAddress);
    }, 1000);
}

/**
 * Handle book now button click
 */
function handleBookNowClick() {
    // Validate form
    const serviceDate = document.getElementById('serviceDate').value;
    const serviceTime = document.getElementById('serviceTime').value;
    const locationType = document.getElementById('locationType').value;
    
    // Basic validation
    if (!serviceDate) {
        alert('Please select a date for the service.');
        return;
    }
    
    if (!serviceTime) {
        alert('Please select a time slot for the service.');
        return;
    }
    
    if (!locationType) {
        alert('Please select a location type for the service.');
        return;
    }
    
    // Get location details based on selected method
    let locationDetails = "";
    let latitude = "";
    let longitude = "";
    
    if (locationType === 'home' || locationType === 'venue') {
        const locationMethod = document.querySelector('input[name="locationMethod"]:checked').value;
        
        if (locationMethod === 'manual') {
            locationDetails = document.getElementById('addressInput').value;
            if (!locationDetails.trim()) {
                alert('Please enter the address for the service.');
                return;
            }
        } else {
            // Live location
            const locationDisplay = document.getElementById('detectedLocationDisplay');
            if (locationDisplay.classList.contains('d-none')) {
                alert('Please detect your location first.');
                return;
            }
            
            locationDetails = document.getElementById('detectedLocationText').textContent;
            latitude = locationDisplay.dataset.latitude || '';
            longitude = locationDisplay.dataset.longitude || '';
        }
    }
    
    // Get service details for redirecting
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = getServiceTypeFromUrl(urlParams);
    const serviceId = getServiceIdFromUrl(urlParams, serviceType);
    
    // Build the redirect URL
    let redirectUrl = 'priest-booking.html?';
    redirectUrl += `serviceType=${encodeURIComponent(serviceType)}`;
    redirectUrl += `&serviceName=${encodeURIComponent(document.getElementById('serviceTitle').textContent)}`;
    redirectUrl += `&date=${encodeURIComponent(serviceDate)}`;
    redirectUrl += `&time=${encodeURIComponent(serviceTime)}`;
    redirectUrl += `&locationType=${encodeURIComponent(locationType)}`;
    
    if (locationDetails) {
        redirectUrl += `&location=${encodeURIComponent(locationDetails)}`;
    }
    
    if (latitude && longitude) {
        redirectUrl += `&lat=${encodeURIComponent(latitude)}`;
        redirectUrl += `&lng=${encodeURIComponent(longitude)}`;
    }
    
    // Redirect to the priest booking page
    window.location.href = redirectUrl;
}

/**
 * Show error message on the page
 */
function showErrorMessage(message) {
    const container = document.querySelector('.container');
    const firstSection = container.querySelector('section');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.role = 'alert';
    alertDiv.textContent = message;
    
    if (firstSection) {
        firstSection.insertBefore(alertDiv, firstSection.firstChild);
    } else {
        container.insertBefore(alertDiv, container.firstChild);
    }
}

/**
 * Update cart count from localStorage
 */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('priestServicesCart') || '[]');
    document.getElementById('cartCount').textContent = cart.length;
}

/**
 * Check if user is authenticated
 */
function checkUserAuthentication() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> My Account';
                document.getElementById('accountBtn').href = 'profile.html';
            } else {
                document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> Login';
                document.getElementById('accountBtn').href = 'login.html';
            }
        });
    }
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchQuery = this.value.trim();
            if (searchQuery) {
                window.location.href = `search-results.html?q=${encodeURIComponent(searchQuery)}`;
            }
        }
    });
} 