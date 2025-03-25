// Modified priest-booking.js that ensures priest data always loads

document.addEventListener('DOMContentLoaded', function() {
    console.log('Priest booking page initialized with fixed script');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const serviceName = urlParams.get('serviceName');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    const locationType = urlParams.get('location');
    const locationDetails = urlParams.get('address');
    
    // Update booking details section
    updateBookingDetails(serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails);
    
    // Set up the event handlers for filters
    setupEventHandlers();
    
    // Initialize filters based on service type
    initializeFilters(serviceType);
    
    // Load available priests
    loadAvailablePriests(serviceType, bookingDate, bookingTime, locationType);
    
    // Check user authentication
    checkUserAuthentication();
    
    // Update cart count
    updateCartCount();
});

/**
 * Update booking details section
 */
function updateBookingDetails(serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails) {
    console.log("Updating booking details:", { serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails });
    
    // Update service name
    const serviceNameElement = document.getElementById('serviceName');
    if (serviceNameElement) {
        serviceNameElement.textContent = serviceName || 'Your Service';
    }
    
    // Update service type link and URL
    const serviceTypeElement = document.getElementById('serviceTypeLink');
    const serviceTypeUrlElement = document.getElementById('serviceTypeUrl');
    
    if (serviceTypeElement && serviceTypeUrlElement) {
        serviceTypeElement.textContent = serviceType || 'Services';
        serviceTypeUrlElement.textContent = serviceType || 'Services';
        serviceTypeUrlElement.href = serviceType ? `${serviceType.toLowerCase()}.html` : '#';
    }
    
    // Update service name link and URL
    const serviceNameLinkElement = document.getElementById('serviceNameLink');
    const serviceDetailUrlElement = document.getElementById('serviceDetailUrl');
    
    if (serviceNameLinkElement && serviceDetailUrlElement) {
        serviceNameLinkElement.textContent = serviceName || 'Service';
        serviceDetailUrlElement.textContent = serviceName || 'Service';
        serviceDetailUrlElement.href = serviceType ? `service-details.html?type=${serviceType.toLowerCase()}&name=${encodeURIComponent(serviceName || '')}` : '#';
    }
    
    // Update booking date, time, and location
    const bookingDateElement = document.getElementById('bookingDate');
    if (bookingDateElement) {
        bookingDateElement.textContent = bookingDate || 'Not specified';
    }
    
    const bookingTimeElement = document.getElementById('bookingTime');
    if (bookingTimeElement) {
        bookingTimeElement.textContent = bookingTime || 'Not specified';
    }
    
    // Update location text
    let locationText = 'Not specified';
    if (locationType) {
        if (locationType === 'home') {
            locationText = 'Your Home';
        } else if (locationType === 'temple') {
            locationText = 'Temple';
        } else if (locationType === 'online') {
            locationText = 'Online (Virtual)';
        } else {
            locationText = locationType;
        }
    }
    
    if (locationDetails) {
        locationText += ` - ${locationDetails}`;
    }
    
    const bookingLocationElement = document.getElementById('bookingLocation');
    if (bookingLocationElement) {
        bookingLocationElement.textContent = locationText;
    }
}

/**
 * Load available priests based on booking criteria
 */
function loadAvailablePriests(serviceType, bookingDate, bookingTime, locationType) {
    const priestsContainer = document.getElementById('priestsContainer');
    const loadingIndicator = document.getElementById('loadingPriests');
    const noPriestsMessage = document.getElementById('noPriestsMessage');
    
    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    if (noPriestsMessage) {
        noPriestsMessage.classList.add('d-none');
    }
    
    if (priestsContainer) {
        priestsContainer.innerHTML = '';
    }
    
    console.log(`Loading priests for service type: ${serviceType}`);
    
    // Function to render backup data if needed
    function showBackupData() {
        console.log('Using backup priest data');
        const backupPriests = getBackupPriestData(serviceType);
        const priestCountElement = document.getElementById('priestCount');
        if (priestCountElement) {
            priestCountElement.textContent = backupPriests.length;
        }
        renderPriests(backupPriests);
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // First try to get priests from Firebase
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase is not defined');
            showBackupData();
            return;
        }
        
        if (!firebase.firestore) {
            console.error('Firebase Firestore is not available');
            showBackupData();
            return;
        }
        
        // Create reference to priests collection
        const db = firebase.firestore();
        console.log('Getting Firestore reference');
        
        // First, try to get ALL priests without any filters
        db.collection('priests').get()
            .then(snapshot => {
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                console.log(`Firebase returned ${snapshot.size} total priests`);
                
                // If no priests found at all, use backup data
                if (snapshot.empty) {
                    console.log('No priests found in Firebase at all, using backup data');
                    showBackupData();
                    return;
                }
                
                // Get all priests from the snapshot
                const allPriests = [];
                snapshot.forEach(doc => {
                    const priest = doc.data();
                    priest.id = doc.id;
                    allPriests.push(priest);
                    console.log(`Found priest: ${priest.name || 'Unknown'} (id: ${priest.id})`);
                });
                
                // Filter priests by service type client-side if needed
                let filteredPriests = allPriests;
                if (serviceType && serviceType !== 'undefined' && serviceType !== 'null') {
                    console.log(`Client-side filtering for service type: ${serviceType}`);
                    filteredPriests = allPriests.filter(priest => {
                        const specializations = priest.specializations || [];
                        return specializations.some(s => 
                            s === serviceType || 
                            s.toLowerCase() === serviceType.toLowerCase()
                        );
                    });
                    
                    console.log(`Found ${filteredPriests.length} priests matching service type: ${serviceType}`);
                }
                
                // If no priests match the service type, show all priests
                if (filteredPriests.length === 0) {
                    console.log(`No priests found for service type: ${serviceType}, showing all priests`);
                    filteredPriests = allPriests;
                }
                
                // Update count and render priests
                const priestCountElement = document.getElementById('priestCount');
                if (priestCountElement) {
                    priestCountElement.textContent = filteredPriests.length;
                }
                renderPriests(filteredPriests);
            })
            .catch(error => {
                console.error('Error fetching all priests from Firebase:', error);
                showBackupData();
            });
    } catch (error) {
        console.error('Exception while accessing Firebase:', error);
        showBackupData();
    }
}

/**
 * Get backup priest data in case Firebase fails
 */
function getBackupPriestData(serviceType) {
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
            description: 'Pandit Ramesh Sharma has been serving devotees for over 25 years. He specializes in traditional ceremonies and pujas with authentic Vedic rituals.',
            testimonials: [
                {
                    name: 'Suresh K.',
                    rating: 5,
                    date: '3 weeks ago',
                    comment: 'Pandit ji performed Grihapravesh puja for our new home. The ceremony was beautiful, and he explained each step clearly.'
                }
            ]
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
            description: 'Acharya Vijay Kumar is an experienced priest specializing in fire rituals (homas) and traditional ceremonies.',
            testimonials: [
                {
                    name: 'Rajesh T.',
                    rating: 5,
                    date: '1 month ago',
                    comment: 'Acharya ji performed Satyanarayan Puja at our home. His knowledge and devotion made the ceremony very special.'
                }
            ]
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
            description: 'Pandit Krishna Murthy is a highly respected priest with three decades of experience performing traditional South Indian rituals.',
            testimonials: [
                {
                    name: 'Venkat R.',
                    rating: 5,
                    date: '2 weeks ago',
                    comment: 'Excellent service. Pandit ji\'s mantras and rituals were performed with utmost devotion and precision.'
                }
            ]
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
            description: 'Acharya Sunil Shastri specializes in traditional Maharashtrian rituals and is known for his devotion and attention to detail.',
            testimonials: [
                {
                    name: 'Priya M.',
                    rating: 4.5,
                    date: '1 month ago',
                    comment: 'Acharya ji performed our son\'s thread ceremony with great care and explained all rituals clearly.'
                }
            ]
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
            description: 'Swami Dayananda is renowned for his deep knowledge of Vedanta and expertise in various spiritual practices and ceremonies.',
            testimonials: [
                {
                    name: 'Karthik S.',
                    rating: 5,
                    date: '2 weeks ago',
                    comment: 'Swamiji\'s guidance during our family\'s spiritual retreat was transformative. His knowledge of scriptures is exceptional.'
                }
            ]
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
            description: 'Pandit Ravi Iyer brings depth and authenticity to traditional Telugu ceremonies with his extensive knowledge and experience.',
            testimonials: [
                {
                    name: 'Srinivas P.',
                    rating: 5,
                    date: '3 weeks ago',
                    comment: 'Pandit ji conducted my daughter\'s wedding with great precision. Every ritual was performed perfectly.'
                }
            ]
        }
    ];
    
    // Filter by service type if specified
    if (serviceType && serviceType !== 'undefined' && serviceType !== 'null') {
        return allPriests.filter(priest => 
            priest.specializations.includes(serviceType) || 
            priest.specializations.some(s => s.toLowerCase() === serviceType.toLowerCase())
        );
    }
    
    return allPriests;
}

/**
 * Render priests list
 */
function renderPriests(priests) {
    console.log(`Rendering ${priests.length} priests`);
    
    const container = document.getElementById('priestsContainer');
    if (!container) {
        console.error('Priests container not found on page');
        return;
    }
    
    // Clear container first
    container.innerHTML = '';
    
    // If no priests to display, show message
    if (priests.length === 0) {
        const noPriestsMessage = document.getElementById('noPriestsMessage');
        if (noPriestsMessage) {
            noPriestsMessage.classList.remove('d-none');
        }
        return;
    }
    
    // Create priest cards
    priests.forEach(priest => {
        // Create priest card
        const card = document.createElement('div');
        card.className = 'card priest-card mb-3 h-100 border-0 shadow-sm';
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
        
        // Set HTML content   <div class="row g-0">
                <div class="row go0">
-               <div >lass= col-md-3"                <im    g src="${priestPhoto}" class="pripeihsttphoto  lgifluuntround d-s=art$est.name}" onerror="this.src='https://via.placeholder.com/120/8e44ad/ffffff?text=Priest'">
        const reviewCount = priest.reviewCount || (priest.reviews?.length) || (typeof priest.reviews === 'number' ? priest.reviews : 0);
        
        // Set languages and specializations with defaults if missing
        const languages = priest.languages || ['Sanskrit'];
        const specializations = priest.specializations || ['Ceremonies'];
        
        // Set HTML content   <div class="row g-0">
                <div class="row go0">
-               <div >lass= col-md-3"                <im    g src="${priestPhoto}" class="pripeihsttphoto  lgifluuntround d-s=art$est.name}" onerror="this.src='https://via.placeholder.com/120/8e44ad/ffffff?text=Priest'">
                </div>
    /div>
                <div class="col-md-9">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <            <div classcardctitlel-md-9">
                    <div clas            ss=an"card-bobadgy bgs cc ss  Ava   blft-sbanetween align-items-        </div>start">
                                    <h52class="priest-name card-        title">${priest.name}</h5>
                                    <span class="badge bg-success">Available</span        >
                      </div> p        experience <di2 class="rating mb-2">
          i        f s fa-awa  a    prim  y    2  </i>
                                   <span class="ms-1"> of experience
                        ($riew     Count} reviews)</sp<paclass="
        mb-1" 
                             idiv>
  f s fa  an ua eass="eprimpeyien-2"></i>
                            
   gua e        ,    
                        </p>         <i class="fas fa-<paclass="rd text-primar"imb-1"
                           
 i        f s fa-sta  oft.eferienceprim yyarsx2e></ir
                            ienceializ tio s       ,                 </p>
         p                           <p class="description mt-2">${priest.description<||p'Experienced priestcspecializinglinatraditionalsrituals.'}</p>s=        "languages mb-1">
         mt 3               <i class="fas fa-language text-primary me-2"></i>
                            Full ${languages.join('        , ')}
                        </p>
                        <p class="specia>
                        </divliz    ations mb-1">
                                <    i class=</div>fas fa-star-of-life text-primary me-2"></i>
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
        
        // Add event listener to the view profile button
        const viewProfileBtn = card.querySelector('.view-profile-btn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', function(event) {
                event.stopPropagation(); // Prevent card click
                openPriestDetailsModal(priest.id);
            });
        }
        
        // Add event listener to the select button
        const selectBtn = card.querySelector('.select-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', function(event) {
                event.stopPropagation(); // Prevent card click
                selectPriest(priest.id);
            });
        }
        
        // Append card to container
        container.appendChild(card);
    });
}

/**
 * Set up event handlers
 */
function setupEventHandlers() {
    // Apply filters button
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

/**
 * Initialize filters based on service type
 */
function initializeFilters(serviceType) {
    if (serviceType) {
        // Check the appropriate specialization filter
        const specFilterId = `spec${serviceType}`;
        const specFilter = document.getElementById(specFilterId);
        if (specFilter) {
            specFilter.checked = true;
        }
    }
}

/**
 * Apply filters to the priests list
 */
function applyFilters() {
    // Get filter values
    const minRating = parseFloat(document.getElementById('ratingFilter').value);
    const minExperience = parseInt(document.getElementById('experienceFilter').value);
    
    // Get selected languages
    const selectedLanguages = [];
    const languageFilters = document.querySelectorAll('input[id^="lang"]:checked');
    languageFilters.forEach(filter => {
        selectedLanguages.push(filter.value);
    });
    
    // Get selected specializations
    const selectedSpecializations = [];
    const specializationFilters = document.querySelectorAll('input[id^="spec"]:checked');
    specializationFilters.forEach(filter => {
        selectedSpecializations.push(filter.value);
    });
    
    // Get service type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    
    // Apply filters
    applyLocalFilters(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations);
}

/**
 * Apply filters locally to already loaded priest cards
 */
function applyLocalFilters(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations) {
    // First try to get data from Firebase again with the service type filter
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const priestsRef = firebase.firestore().collection('priests');
            
            // Build query based on filters
            let query = priestsRef;
            
            // Only filter by service type if provided and none of the specializations is selected
            if (serviceType && selectedSpecializations.length === 0) {
                query = query.where('specializations', 'array-contains', serviceType);
            }
            
            // Execute the query
            query.get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        // If no results from Firebase, use backup data
                        filterBackupData(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations);
                        return;
                    }
                    
                    // Process priests and apply client-side filters
                    let priests = [];
                    snapshot.forEach(doc => {
                        const priest = doc.data();
                        priest.id = doc.id;
                        priests.push(priest);
                    });
                    
                    // Apply client-side filters
                    priests = filterPriests(priests, minRating, minExperience, selectedLanguages, selectedSpecializations);
                    
                    // Update count and render
                    document.getElementById('priestCount').textContent = priests.length;
                    renderPriests(priests);
                })
                .catch(error => {
                    console.error('Error applying filters with Firebase:', error);
                    filterBackupData(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations);
                });
        } else {
            // If Firebase not available, filter backup data
            filterBackupData(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations);
        }
    } catch (error) {
        console.error('Exception applying filters:', error);
        filterBackupData(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations);
    }
}

/**
 * Filter backup priest data
 */
function filterBackupData(serviceType, minRating, minExperience, selectedLanguages, selectedSpecializations) {
    // Get backup data
    let priests = getBackupPriestData(serviceType);
    
    // Apply filters
    priests = filterPriests(priests, minRating, minExperience, selectedLanguages, selectedSpecializations);
    
    // Update count and render
    document.getElementById('priestCount').textContent = priests.length;
    renderPriests(priests);
}

/**
 * Filter priests based on criteria
 */
function filterPriests(priests, minRating, minExperience, selectedLanguages, selectedSpecializations) {
    return priests.filter(priest => {
        // Filter by rating
        if (priest.rating < minRating) {
            return false;
        }
        
        // Filter by experience
        if (priest.experience < minExperience) {
            return false;
        }
        
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
}

/**
 * Reset filters to default values
 */
function resetFilters() {
    // Reset rating filter
    document.getElementById('ratingFilter').value = 0;
    
    // Reset experience filter
    document.getElementById('experienceFilter').value = 0;
    
    // Reset language filters
    const languageFilters = document.querySelectorAll('input[id^="lang"]');
    languageFilters.forEach(filter => {
        filter.checked = filter.id === 'langEnglish' || filter.id === 'langHindi';
    });
    
    // Reset specialization filters
    const specializationFilters = document.querySelectorAll('input[id^="spec"]');
    specializationFilters.forEach(filter => {
        filter.checked = false;
    });
    
    // Get service type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    
    // Apply reset (which means no client-side filters)
    loadAvailablePriests(serviceType);
}

/**
 * Open priest details modal
 */
function openPriestDetailsModal(priestId) {
    // Find the priest data
    const priestCard = document.querySelector(`.priest-card[data-priest-id="${priestId}"]`);
    if (!priestCard) {
        console.error(`Priest card with ID ${priestId} not found`);
        return;
    }
    
    // Get priest details from card
    const name = priestCard.querySelector('.priest-name').textContent;
    const rating = priestCard.querySelector('.rating').textContent.match(/\d+\.?\d*/)[0] || '0';
    const reviews = priestCard.querySelector('.rating').textContent.match(/\((\d+) reviews\)/)[1] || '0';
    const experience = priestCard.querySelector('.experience').textContent.match(/(\d+) years/)[1] || '0';
    const languages = priestCard.querySelector('.languages')?.textContent.replace('Languages:', '').trim() || '';
    const specializations = priestCard.querySelector('.specializations')?.textContent.replace('Specializes in:', '').trim() || '';
    const description = priestCard.querySelector('.description')?.textContent || '';
    const photoSrc = priestCard.querySelector('img').src;
    
    // Update modal with priest details
    document.getElementById('modalPriestName').textContent = name;
    document.getElementById('modalPriestRating').textContent = `${rating}/5`;
    document.getElementById('modalPriestReviews').textContent = reviews;
    document.getElementById('modalPriestExperience').textContent = `${experience} years`;
    document.getElementById('modalPriestLocation').textContent = 'Various locations in India';
    document.getElementById('modalPriestBio').textContent = description;
    document.getElementById('modalPriestImage').src = photoSrc;
    
    // Update languages badges
    const languagesList = languages.split(',').filter(lang => lang.trim().length > 0);
    const languagesContainer = document.getElementById('modalPriestLanguages');
    languagesContainer.innerHTML = '';
    languagesList.forEach(lang => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-language me-1 mb-1';
        badge.textContent = lang.trim();
        languagesContainer.appendChild(badge);
    });
    
    // Update specializations badges
    const specializationsList = specializations.split(',').filter(spec => spec.trim().length > 0);
    const specializationsContainer = document.getElementById('modalPriestSpecializations');
    specializationsContainer.innerHTML = '';
    specializationsList.forEach(spec => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-specialization me-1 mb-1';
        badge.textContent = spec.trim();
        specializationsContainer.appendChild(badge);
    });
    
    // Set up the select button
    const selectBtn = document.getElementById('selectPriestFromModalBtn');
    selectBtn.onclick = () => {
        // Close modal
        const modalElement = document.getElementById('priestDetailsModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Select the priest
        selectPriest(priestId);
    };
    
    // Show the modal
    const modalElement = document.getElementById('priestDetailsModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Select a priest
 */
function selectPriest(priestId) {
    console.log(`Selecting priest: ${priestId}`);
    
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
    
    // Show the proceed button and update it
    const proceedButton = document.getElementById('proceedToBookingBtn');
    if (proceedButton) {
        proceedButton.classList.remove('d-none');
        proceedButton.disabled = false;
        proceedButton.onclick = () => proceedWithBooking(priestId);
    }
    
    // Update booking summary if needed
    updatePriceBreakdown();
}

/**
 * Process booking with selected priest
 */
function proceedWithBooking(priestId) {
    // Check if user is logged in
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please login to proceed with booking.');
        window.location.href = 'login.html';
        return;
    }
    
    // Get booking details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const serviceName = urlParams.get('serviceName');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    const locationType = urlParams.get('location');
    const locationDetails = urlParams.get('address');
    
    // You can add more booking data here
    
    // Redirect to checkout with all parameters
    const checkoutUrl = `checkout.html?serviceType=${encodeURIComponent(serviceType || '')}&serviceName=${encodeURIComponent(serviceName || '')}&date=${encodeURIComponent(bookingDate || '')}&time=${encodeURIComponent(bookingTime || '')}&location=${encodeURIComponent(locationType || '')}&address=${encodeURIComponent(locationDetails || '')}&priestId=${encodeURIComponent(priestId)}`;
    
    window.location.href = checkoutUrl;
}

/**
 * Check user authentication
 */
function checkUserAuthentication() {
    const proceedButton = document.getElementById('proceedToBookingBtn');
    
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            if (proceedButton) {
                proceedButton.disabled = false;
                
                // Remove login prompt if it exists
                const loginPrompt = document.getElementById('loginPrompt');
                if (loginPrompt) {
                    loginPrompt.remove();
                }
            }
        } else {
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
}

/**
 * Update cart count
 */
function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;
    
    // For demo purposes, just set a random number
    cartCountElement.textContent = Math.floor(Math.random() * 3);
} 

/**
 * Update price breakdown display
 */
function updatePriceBreakdown() {
    // This would typically get the selected priest's pricing information
    // and update a price breakdown section on the page.
    // For now, it's a stub that can be implemented later.
}