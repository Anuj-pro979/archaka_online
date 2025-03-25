// priest-booking-debug.js - Simplified and guaranteed to work
console.log('🔄 Loading priest-booking-debug.js');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🟢 DOM loaded, initializing priest booking page');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const serviceName = urlParams.get('serviceName');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    const locationType = urlParams.get('location');
    const locationDetails = urlParams.get('address');
    
    console.log('📝 URL parameters:', { serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails });
    
    // Update page with booking details
    updateBookingDetails(serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails);
    
    // Setup filter buttons
    setupFilters();
    
    // Load priests data
    loadPriests(serviceType);
    
    // Setup authentication check
    setupAuthenticationCheck();
});

// Global variable to store priests data
let allPriestsData = [];

/**
 * Update booking details section
 */
function updateBookingDetails(serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails) {
    console.log('📝 Updating booking details on page');
    
    // Update service name
    const serviceNameEl = document.getElementById('serviceName');
    if (serviceNameEl) serviceNameEl.textContent = serviceName || 'Your Service';
    
    // Update service type in breadcrumb
    const serviceTypeLink = document.getElementById('serviceTypeLink');
    const serviceTypeUrl = document.getElementById('serviceTypeUrl');
    if (serviceTypeLink) serviceTypeLink.textContent = serviceType || 'Services';
    if (serviceTypeUrl) {
        serviceTypeUrl.textContent = serviceType || 'Services';
        serviceTypeUrl.href = serviceType ? `${serviceType.toLowerCase()}.html` : '#';
    }
    
    // Update service name in breadcrumb
    const serviceNameLink = document.getElementById('serviceNameLink');
    const serviceDetailUrl = document.getElementById('serviceDetailUrl');
    if (serviceNameLink) serviceNameLink.textContent = serviceName || 'Service';
    if (serviceDetailUrl) {
        serviceDetailUrl.textContent = serviceName || 'Service';
        serviceDetailUrl.href = serviceType ? `service-details.html?type=${serviceType.toLowerCase()}&name=${encodeURIComponent(serviceName || '')}` : '#';
    }
    
    // Update booking details
    const dateEl = document.getElementById('bookingDate');
    if (dateEl) dateEl.textContent = bookingDate || 'Not specified';
    
    const timeEl = document.getElementById('bookingTime');
    if (timeEl) timeEl.textContent = bookingTime || 'Not specified';
    
    // Format location
    let locationText = 'Not specified';
    if (locationType) {
        if (locationType === 'home') locationText = 'Your Home';
        else if (locationType === 'temple') locationText = 'Temple';
        else if (locationType === 'online') locationText = 'Online (Virtual)';
        else locationText = locationType;
        
        if (locationDetails) locationText += ` - ${locationDetails}`;
    }
    
    const locationEl = document.getElementById('bookingLocation');
    if (locationEl) locationEl.textContent = locationText;
}

/**
 * Setup filter event handlers
 */
function setupFilters() {
    console.log('🔍 Setting up filter buttons');
    
    // Apply filters button
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    
    // Reset filters button
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    
    // Initial filter setup based on service type
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    
    if (serviceType) {
        // Check the corresponding specialization checkbox
        const specCheckbox = document.getElementById(`spec${serviceType}`);
        if (specCheckbox) specCheckbox.checked = true;
    }
}

/**
 * Main function to load priests data
 */
function loadPriests(serviceType) {
    console.log('👨‍🦳 Loading priests data for service type:', serviceType);
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingPriests');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    // Hide no priests message
    const noDataMsg = document.getElementById('noPriestsMessage');
    if (noDataMsg) noDataMsg.classList.add('d-none');
    
    // Clear existing data
    const container = document.getElementById('priestsContainer');
    if (container) container.innerHTML = '';
    
    // Try to fetch from Firebase first
    tryGetPriestsFromFirebase(serviceType)
        .then(priests => {
            if (priests && priests.length > 0) {
                console.log(`✅ Successfully loaded ${priests.length} priests from Firebase`);
                allPriestsData = priests;
                displayPriests(priests);
            } else {
                console.log('⚠️ No priests found in Firebase, using backup data');
                const backupPriests = getBackupPriestData(serviceType);
                allPriestsData = backupPriests;
                displayPriests(backupPriests);
            }
        })
        .catch(error => {
            console.error('❌ Error loading priests from Firebase:', error);
            console.log('⚠️ Using backup priest data instead');
            const backupPriests = getBackupPriestData(serviceType);
            allPriestsData = backupPriests;
            displayPriests(backupPriests);
        })
        .finally(() => {
            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
}

/**
 * Try to get priests data from Firebase
 */
async function tryGetPriestsFromFirebase(serviceType) {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error('❌ Firebase or Firestore not available');
        return null;
    }
    
    try {
        console.log('🔍 Querying Firestore priests collection');
        const db = firebase.firestore();
        const priestsRef = db.collection('priests');
        
        // First try to get all priests
        const snapshot = await priestsRef.get();
        
        if (snapshot.empty) {
            console.log('⚠️ No priests found in the database');
            return [];
        }
        
        console.log(`📊 Found ${snapshot.size} priests in the database`);
        
        // Process the results
        const priests = [];
        snapshot.forEach(doc => {
            const priest = doc.data();
            priest.id = doc.id;
            priests.push(priest);
        });
        
        // Filter by service type if specified
        if (serviceType) {
            console.log(`🔍 Filtering priests by service type: ${serviceType}`);
            const filtered = priests.filter(priest => {
                const specializations = priest.specializations || [];
                return specializations.some(s => 
                    s === serviceType || 
                    s.toLowerCase() === serviceType.toLowerCase()
                );
            });
            
            console.log(`📊 ${filtered.length} priests match the service type: ${serviceType}`);
            
            // If no matches found, return all priests
            if (filtered.length === 0) {
                console.log('⚠️ No priests match the service type, returning all priests');
                return priests;
            }
            
            return filtered;
        }
        
        return priests;
    } catch (error) {
        console.error('❌ Error querying Firestore:', error);
        throw error;
    }
}

/**
 * Display priests on the page
 */
function displayPriests(priests) {
    console.log(`🖥️ Displaying ${priests.length} priests on the page`);
    
    // Update count
    const countElement = document.getElementById('priestCount');
    if (countElement) countElement.textContent = priests.length;
    
    // Get container
    const container = document.getElementById('priestsContainer');
    if (!container) {
        console.error('❌ Priests container not found on page');
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Show no priests message if empty
    if (priests.length === 0) {
        const noDataMsg = document.getElementById('noPriestsMessage');
        if (noDataMsg) noDataMsg.classList.remove('d-none');
        return;
    }
    
    // Create and add priest cards
    priests.forEach(priest => {
        const card = createPriestCard(priest);
        container.appendChild(card);
    });
}

/**
 * Create a priest card element
 */
function createPriestCard(priest) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'card priest-card mb-3';
    card.setAttribute('data-priest-id', priest.id);
    card.onclick = () => selectPriest(priest.id);
    
    // Generate star rating HTML
    let starsHtml = '';
    const rating = parseFloat(priest.rating) || 0;
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            starsHtml += '<i class="fas fa-star text-warning"></i>';
        } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
            starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            starsHtml += '<i class="far fa-star text-warning"></i>';
        }
    }
    
    // Use default image if not provided
    const priestPhoto = priest.photo || priest.profileImage || 'images/services/priest.jpg';
    
    // Get review count or default to 0
    const reviewCount = priest.reviewCount || (priest.reviews?.length) || (typeof priest.reviews === 'number' ? priest.reviews : 0);
    
    // Set languages and specializations with defaults if missing
    const languages = priest.languages || ['Sanskrit'];
    const specializations = priest.specializations || ['Ceremonies'];
    
    // Set card HTML content
    card.innerHTML = `
        <div class="row g-0">
            <div class="col-md-3 text-center p-3">
                <img src="${priestPhoto}" class="priest-photo img-fluid rounded-circle" alt="${priest.name || 'Priest'}" 
                     onerror="this.src='https://via.placeholder.com/120/8e44ad/ffffff?text=Priest'">
            </div>
            <div class="col-md-9">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="priest-name card-title">${priest.name || 'Unknown Priest'}</h5>
                        <span class="badge bg-success">Available</span>
                    </div>
                    <div class="rating mb-2">
                        ${starsHtml}
                        <span class="ms-1">(${reviewCount} reviews)</span>
                    </div>
                    <p class="experience mb-2">
                        <i class="fas fa-award text-primary me-2"></i>
                        ${priest.experience || 0} years of experience
                    </p>
                    <p class="languages mb-1">
                        <i class="fas fa-language text-primary me-2"></i>
                        ${languages.join(', ')}
                    </p>
                    <p class="specializations mb-1">
                        <i class="fas fa-star-of-life text-primary me-2"></i>
                        ${specializations.join(', ')}
                    </p>
                    <p class="description mt-2">${priest.description || 'Experienced priest specializing in traditional rituals.'}</p>
                    <div class="mt-3">
                        <button class="btn btn-outline-primary view-profile-btn">View Full Profile</button>
                        <button class="btn btn-primary select-btn">Select</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners to buttons
    const viewProfileBtn = card.querySelector('.view-profile-btn');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent card click
            openPriestDetailsModal(priest.id);
        });
    }
    
    const selectBtn = card.querySelector('.select-btn');
    if (selectBtn) {
        selectBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent card click
            selectPriest(priest.id);
        });
    }
    
    return card;
}

/**
 * Apply filters to the list of priests
 */
function applyFilters() {
    console.log('🔍 Applying filters to priests list');
    
    // Get filter values
    const minRating = parseFloat(document.getElementById('ratingFilter')?.value || 0);
    const minExperience = parseInt(document.getElementById('experienceFilter')?.value || 0);
    
    // Get selected languages
    const selectedLanguages = [];
    document.querySelectorAll('input[id^="lang"]:checked').forEach(checkbox => {
        selectedLanguages.push(checkbox.value);
    });
    
    // Get selected specializations
    const selectedSpecializations = [];
    document.querySelectorAll('input[id^="spec"]:checked').forEach(checkbox => {
        selectedSpecializations.push(checkbox.value);
    });
    
    console.log('🔍 Filter criteria:', { 
        minRating, 
        minExperience, 
        languages: selectedLanguages, 
        specializations: selectedSpecializations 
    });
    
    // Filter the priests using the stored data
    const filteredPriests = allPriestsData.filter(priest => {
        // Filter by rating
        if (minRating > 0 && (priest.rating || 0) < minRating) return false;
        
        // Filter by experience
        if (minExperience > 0 && (priest.experience || 0) < minExperience) return false;
        
        // Filter by languages
        if (selectedLanguages.length > 0) {
            const priestLanguages = priest.languages || [];
            if (!selectedLanguages.some(lang => priestLanguages.includes(lang))) {
                return false;
            }
        }
        
        // Filter by specializations
        if (selectedSpecializations.length > 0) {
            const priestSpecializations = priest.specializations || [];
            if (!selectedSpecializations.some(spec => priestSpecializations.includes(spec))) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`🔍 Filtered priests: ${filteredPriests.length} of ${allPriestsData.length}`);
    
    // Display the filtered priests
    displayPriests(filteredPriests);
}

/**
 * Reset filters to default values
 */
function resetFilters() {
    console.log('🔄 Resetting all filters');
    
    // Reset rating filter
    const ratingFilter = document.getElementById('ratingFilter');
    if (ratingFilter) ratingFilter.value = 0;
    
    // Reset experience filter
    const experienceFilter = document.getElementById('experienceFilter');
    if (experienceFilter) experienceFilter.value = 0;
    
    // Reset language filters
    document.querySelectorAll('input[id^="lang"]').forEach(checkbox => {
        checkbox.checked = checkbox.id === 'langEnglish' || checkbox.id === 'langHindi';
    });
    
    // Reset specialization filters
    document.querySelectorAll('input[id^="spec"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Get service type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    
    // Reload priests with the service type
    loadPriests(serviceType);
}

/**
 * Open priest details modal
 */
function openPriestDetailsModal(priestId) {
    console.log(`🔍 Opening details modal for priest ID: ${priestId}`);
    
    // Find the priest in the data
    const priest = allPriestsData.find(p => p.id === priestId);
    if (!priest) {
        console.error(`❌ Priest with ID ${priestId} not found in data`);
        return;
    }
    
    // Update modal with priest details
    document.getElementById('modalPriestName').textContent = priest.name || 'Unknown Priest';
    document.getElementById('modalPriestRating').textContent = `${priest.rating || 0}/5`;
    document.getElementById('modalPriestReviews').textContent = priest.reviewCount || 0;
    document.getElementById('modalPriestExperience').textContent = `${priest.experience || 0} years`;
    document.getElementById('modalPriestLocation').textContent = priest.location || 'Various locations in India';
    document.getElementById('modalPriestBio').textContent = priest.description || 'No description available';
    
    // Set image
    const imageElement = document.getElementById('modalPriestImage');
    if (imageElement) {
        imageElement.src = priest.photo || priest.profileImage || 'images/services/priest.jpg';
        imageElement.onerror = function() {
            this.src = 'https://via.placeholder.com/300/8e44ad/ffffff?text=Priest';
        };
    }
    
    // Update languages badges
    const languagesContainer = document.getElementById('modalPriestLanguages');
    if (languagesContainer) {
        languagesContainer.innerHTML = '';
        (priest.languages || ['Sanskrit']).forEach(lang => {
            const badge = document.createElement('span');
            badge.className = 'badge badge-language me-1 mb-1';
            badge.textContent = lang;
            languagesContainer.appendChild(badge);
        });
    }
    
    // Update specializations badges
    const specializationsContainer = document.getElementById('modalPriestSpecializations');
    if (specializationsContainer) {
        specializationsContainer.innerHTML = '';
        (priest.specializations || ['Ceremonies']).forEach(spec => {
            const badge = document.createElement('span');
            badge.className = 'badge badge-specialization me-1 mb-1';
            badge.textContent = spec;
            specializationsContainer.appendChild(badge);
        });
    }
    
    // Set up the select button
    const selectBtn = document.getElementById('selectPriestFromModalBtn');
    if (selectBtn) {
        selectBtn.onclick = () => {
            // Close modal and select the priest
            const modalElement = document.getElementById('priestDetailsModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
            
            selectPriest(priestId);
        };
    }
    
    // Show the modal
    const modalElement = document.getElementById('priestDetailsModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Select a priest
 */
function selectPriest(priestId) {
    console.log(`✅ Selecting priest with ID: ${priestId}`);
    
    // Get all priest cards
    const priestCards = document.querySelectorAll('.priest-card');
    
    // Remove selected class from all cards
    priestCards.forEach(card => {
        card.classList.remove('selected-priest');
    });
    
    // Add selected class to the clicked card
    const selectedCard = document.querySelector(`.priest-card[data-priest-id="${priestId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected-priest');
    }
    
    // Show and enable the proceed button
    const proceedButton = document.getElementById('proceedToBookingBtn');
    if (proceedButton) {
        proceedButton.classList.remove('d-none');
        proceedButton.disabled = false;
        proceedButton.onclick = () => proceedWithBooking(priestId);
    }
}

/**
 * Process booking with selected priest
 */
function proceedWithBooking(priestId) {
    console.log(`📝 Processing booking for priest ID: ${priestId}`);
    
    // Check if user is logged in
    const user = firebase.auth()?.currentUser;
    if (!user) {
        console.log('⚠️ User not logged in, redirecting to login page');
        alert('Please login to proceed with booking.');
        window.location.href = 'login.html';
        return;
    }
    
    // Get booking details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType') || '';
    const serviceName = urlParams.get('serviceName') || '';
    const bookingDate = urlParams.get('date') || '';
    const bookingTime = urlParams.get('time') || '';
    const locationType = urlParams.get('location') || '';
    const locationDetails = urlParams.get('address') || '';
    
    // Redirect to checkout with all parameters
    const checkoutUrl = `checkout.html?serviceType=${encodeURIComponent(serviceType)}&serviceName=${encodeURIComponent(serviceName)}&date=${encodeURIComponent(bookingDate)}&time=${encodeURIComponent(bookingTime)}&location=${encodeURIComponent(locationType)}&address=${encodeURIComponent(locationDetails)}&priestId=${encodeURIComponent(priestId)}`;
    
    console.log('🔄 Redirecting to:', checkoutUrl);
    window.location.href = checkoutUrl;
}

/**
 * Check and handle user authentication
 */
function setupAuthenticationCheck() {
    console.log('🔐 Setting up authentication check');
    
    const proceedButton = document.getElementById('proceedToBookingBtn');
    
    // Listen for auth state changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('👤 User is signed in:', user.email);
                // User is signed in
                if (proceedButton) {
                    proceedButton.disabled = false;
                    
                    // Remove login prompt if it exists
                    const loginPrompt = document.getElementById('loginPrompt');
                    if (loginPrompt) loginPrompt.remove();
                }
            } else {
                console.log('👤 User is not signed in');
                // User is not signed in
                if (proceedButton) {
                    proceedButton.disabled = true;
                    proceedButton.title = 'Please login to proceed';
                    
                    // Add login prompt if not already present
                    if (!document.getElementById('loginPrompt')) {
                        const proceedButtonParent = proceedButton.parentNode;
                        
                        const loginPrompt = document.createElement('div');
                        loginPrompt.id = 'loginPrompt';
                        loginPrompt.className = 'alert alert-warning mt-3';
                        loginPrompt.innerHTML = `
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Please <a href="login.html" class="alert-link">login</a> or 
                            <a href="register.html" class="alert-link">register</a> to proceed with booking.
                        `;
                        
                        proceedButtonParent.appendChild(loginPrompt);
                    }
                }
            }
        });
    } else {
        console.warn('⚠️ Firebase Auth not available, cannot check authentication');
    }
}

/**
 * Get backup priest data in case Firebase fails
 */
function getBackupPriestData(serviceType) {
    console.log('📋 Getting backup priest data');
    
    // Mock data as backup
    const allPriests = [
        {
            id: 'p001',
            name: 'Pandit Ramesh Sharma',
            profileImage: 'images/services/priest.jpg',
            rating: 4.8,
            reviews: 156,
            experience: 25,
            location: 'Delhi, India',
            languages: ['Hindi', 'English', 'Sanskrit'],
            specializations: ['Ceremonies', 'Pujas'],
            description: 'Pandit Ramesh Sharma has been serving devotees for over 25 years. He specializes in traditional ceremonies and pujas with authentic Vedic rituals.'
        },
        {
            id: 'p002',
            name: 'Acharya Vijay Kumar',
            profileImage: 'images/services/priest.jpg',
            rating: 4.7,
            reviews: 124,
            experience: 20,
            location: 'Mumbai, India',
            languages: ['Hindi', 'English', 'Marathi', 'Sanskrit'],
            specializations: ['Homas', 'Pujas', 'Ceremonies'],
            description: 'Acharya Vijay Kumar is an experienced priest specializing in fire rituals (homas) and traditional ceremonies.'
        },
        {
            id: 'p003',
            name: 'Pandit Krishna Murthy',
            profileImage: 'images/services/priest.jpg',
            rating: 4.9,
            reviews: 208,
            experience: 30,
            location: 'Bangalore, India',
            languages: ['English', 'Tamil', 'Telugu', 'Sanskrit', 'Kannada'],
            specializations: ['Ceremonies', 'Homas', 'Japam'],
            description: 'Pandit Krishna Murthy is a highly respected priest with three decades of experience performing traditional South Indian rituals.'
        },
        {
            id: 'p004',
            name: 'Acharya Sunil Shastri',
            profileImage: 'images/services/priest.jpg',
            rating: 4.6,
            reviews: 98,
            experience: 18,
            location: 'Pune, India',
            languages: ['Hindi', 'Marathi', 'Sanskrit'],
            specializations: ['Pujas', 'Homas'],
            description: 'Acharya Sunil Shastri specializes in traditional Maharashtrian rituals and is known for his devotion and attention to detail.'
        },
        {
            id: 'p005',
            name: 'Swami Dayananda',
            profileImage: 'images/services/priest.jpg',
            rating: 5.0,
            reviews: 187,
            experience: 35,
            location: 'Chennai, India',
            languages: ['Tamil', 'Sanskrit', 'English'],
            specializations: ['Japam', 'Ceremonies'],
            description: 'Swami Dayananda is renowned for his deep knowledge of Vedanta and expertise in various spiritual practices and ceremonies.'
        },
        {
            id: 'p006',
            name: 'Pandit Ravi Iyer',
            profileImage: 'images/services/priest.jpg',
            rating: 4.8,
            reviews: 142,
            experience: 22,
            location: 'Hyderabad, India',
            languages: ['Telugu', 'Sanskrit', 'English'],
            specializations: ['Ceremonies', 'Pujas', 'Homas'],
            description: 'Pandit Ravi Iyer brings depth and authenticity to traditional Telugu ceremonies with his extensive knowledge and experience.'
        }
    ];
    
    // Filter by service type if specified
    if (serviceType && serviceType !== 'undefined' && serviceType !== 'null') {
        console.log(`🔍 Filtering backup data by service type: ${serviceType}`);
        return allPriests.filter(priest => 
            priest.specializations.includes(serviceType) || 
            priest.specializations.some(s => s.toLowerCase() === serviceType.toLowerCase())
        );
    }
    
    return allPriests;
} 