// priest-booking.js - Handles the priest booking functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get booking details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const serviceName = urlParams.get('serviceName');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    const locationType = urlParams.get('locationType');
    const locationDetails = urlParams.get('location');
    const latitude = urlParams.get('lat');
    const longitude = urlParams.get('lng');

    // Update the UI with booking details
    updateBookingDetails(serviceType, serviceName, bookingDate, bookingTime, locationType, locationDetails);
    
    // Load priests based on the booking criteria
    loadAvailablePriests(serviceType, bookingDate, bookingTime, locationType);
    
    // Set up event handlers
    setupEventHandlers();
    
    // Initialize filters
    initializeFilters(serviceType);
    
    // Update cart count
    updateCartCount();
    
    // Check if user is logged in
    checkUserAuthentication();
});

/**
 * Update booking details in the UI
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
    loadingIndicator.style.display = 'block';
    noPriestsMessage.classList.add('d-none');
    priestsContainer.innerHTML = '';
    
    console.log(`Loading priests for service type: ${serviceType}`);
    
    try {
        // Create reference to priests collection in Firestore
        const priestsRef = firebase.firestore().collection('priests');
        
        // Build query based on filters
        let query = priestsRef;
        
        // Filter by service type specialization if provided
        if (serviceType) {
            console.log(`Filtering by specialization: ${serviceType}`);
            query = query.where('specializations', 'array-contains', serviceType);
        }
        
        // No availability filter for now - we'll check all priests and display them
        
        // Execute query
        query.get()
            .then(snapshot => {
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
                
                console.log(`Firestore query returned ${snapshot.size} priests`);
                
                if (snapshot.empty) {
                    // No priests found
                    console.log('No priests found matching the criteria');
                    noPriestsMessage.classList.remove('d-none');
                    document.getElementById('priestCount').textContent = '0';
                    return;
                }
                
                // Process results - display all priests without availability check for now
                const priests = [];
                snapshot.forEach(doc => {
                    const priest = doc.data();
                    priest.id = doc.id;
                    console.log(`Found priest: ${priest.name} (ID: ${doc.id})`);
                    priests.push(priest);
                });
                
                // Update priest count
                document.getElementById('priestCount').textContent = priests.length;
                
                // Render priests
                renderPriests(priests);
            })
            .catch(error => {
                console.error("Error fetching priests: ", error);
                loadingIndicator.style.display = 'none';
                
                // If error, fallback to mock data
                const priests = getBackupPriestData(serviceType);
                if (priests.length === 0) {
                    noPriestsMessage.classList.remove('d-none');
                    document.getElementById('priestCount').textContent = '0';
                } else {
                    document.getElementById('priestCount').textContent = priests.length;
                    renderPriests(priests);
                }
            });
    } catch (error) {
        console.error("Error in priest loading function: ", error);
        loadingIndicator.style.display = 'none';
        
        // Fallback to mock data
        const priests = getBackupPriestData(serviceType);
        if (priests.length === 0) {
            noPriestsMessage.classList.remove('d-none');
            document.getElementById('priestCount').textContent = '0';
        } else {
            document.getElementById('priestCount').textContent = priests.length;
            renderPriests(priests);
        }
    }
}

/**
 * Check if a priest is available for a specific date and time
 * @param {string} priestId - The priest's ID
 * @param {string} date - The booking date (YYYY-MM-DD)
 * @param {string} time - The booking time (HH:MM)
 * @returns {Promise<boolean>} - Promise resolving to true if available, false if not
 */
function checkPriestAvailability(priestId, date, time) {
    return new Promise((resolve, reject) => {
        if (!priestId || !date || !time) {
            resolve(false);
            return;
        }
        
        // First check custom availability schedule if exists
        firebase.firestore().collection('priests').doc(priestId).collection('availability')
            .where('date', '==', date)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    // Priest has custom availability for this date
                    let isTimeSlotAvailable = false;
                    snapshot.forEach(doc => {
                        const availabilityData = doc.data();
                        // Check if the time slot is within available hours
                        if (availabilityData.timeSlots && availabilityData.timeSlots.length > 0) {
                            isTimeSlotAvailable = availabilityData.timeSlots.some(slot => {
                                return timeIsInRange(time, slot.startTime, slot.endTime);
                            });
                        }
                    });
                    
                    if (!isTimeSlotAvailable) {
                        resolve(false);
                        return;
                    }
                }
                
                // Now check if there's any booking that conflicts with the requested time
                return firebase.firestore().collection('priestAvailability')
                    .where('priestId', '==', priestId)
                    .where('bookingDate', '==', date)
                    .get();
            })
            .then(snapshot => {
                if (!snapshot) return resolve(true); // No custom availability, so default to available
                
                // Check if there's any booking that conflicts with the requested time
                let hasConflict = false;
                
                snapshot.forEach(doc => {
                    const booking = doc.data();
                    // Simple time comparison - in a real app you would check for overlapping time slots
                    if (booking.bookingTime === time) {
                        hasConflict = true;
                    }
                });
                
                resolve(!hasConflict);
            })
            .catch(error => {
                console.error("Error checking priest availability:", error);
                // In case of error, assume priest is available (more merchant-friendly)
                resolve(true);
            });
    });
}

/**
 * Check if a time is within a given range
 * @param {string} time - Time to check (HH:MM)
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {boolean} - True if time is within range
 */
function timeIsInRange(time, startTime, endTime) {
    const [checkHours, checkMinutes] = time.split(':').map(Number);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const checkMinutesTotal = checkHours * 60 + checkMinutes;
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;
    
    return checkMinutesTotal >= startMinutesTotal && checkMinutesTotal <= endMinutesTotal;
}

/**
 * Get backup priest data in case Firebase fails (for demonstration purposes)
 * In a production app, you'd have better error handling
 */
function getBackupPriestData(serviceType) {
    // Mock data as backup
    const allPriests = [
        {
            id: 'p001',
            name: 'Pandit Ramesh Sharma',
            profileImage: 'images/priest-1.jpg',
            rating: 4.8,
            reviews: 156,
            experience: 25,
            location: 'Delhi, India',
            languages: ['Hindi', 'English', 'Sanskrit'],
            specializations: ['Ceremonies', 'Pujas'],
            bio: 'Pandit Ramesh Sharma has been serving devotees for over 25 years. He specializes in traditional ceremonies and pujas with authentic Vedic rituals.',
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
            profileImage: 'images/priest-2.jpg',
            rating: 4.7,
            reviews: 124,
            experience: 20,
            location: 'Mumbai, India',
            languages: ['Hindi', 'English', 'Marathi', 'Sanskrit'],
            specializations: ['Homas', 'Pujas', 'Ceremonies'],
            bio: 'Acharya Vijay Kumar is an experienced priest specializing in fire rituals (homas) and traditional ceremonies.',
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
            profileImage: 'images/priest-3.jpg',
            rating: 4.9,
            reviews: 208,
            experience: 30,
            location: 'Bangalore, India',
            languages: ['English', 'Tamil', 'Telugu', 'Sanskrit', 'Kannada'],
            specializations: ['Ceremonies', 'Homas', 'Japa'],
            bio: 'Pandit Krishna Murthy is a highly respected priest with three decades of experience performing traditional South Indian rituals.',
            testimonials: [
                {
                    name: 'Venkat R.',
                    rating: 5,
                    date: '2 weeks ago',
                    comment: 'Excellent service. Pandit ji\'s mantras and rituals were performed with utmost devotion and precision.'
                }
            ]
        }
    ];
    
    // Filter by service type if specified
    if (serviceType) {
        return allPriests.filter(priest => priest.specializations.includes(serviceType));
    }
    
    return allPriests;
}

/**
 * Render priests list
 */
function renderPriests(priests) {
    const container = document.getElementById('priestsContainer');
    container.innerHTML = '';
    
    priests.forEach(priest => {
        // Create priest card
        const card = document.createElement('div');
        card.className = 'priest-card';
        card.setAttribute('data-priest-id', priest.id);
        card.onclick = () => selectPriest(priest.id);
        
        // Create testimonials HTML
        let testimonialHtml = '';
        if (priest.testimonials && priest.testimonials.length > 0) {
            // Get the first testimonial
            const testimonial = priest.testimonials[0];
            testimonialHtml = `
                <div class="testimonials mt-3">
                    <h6 class="text-muted">Recent Testimonials</h6>
                    <div class="testimonial">
                        <i class="fas fa-quote-left text-primary me-2"></i>
                        <span>${testimonial.text || testimonial}</span>
                        <div class="testimonial-author">- ${testimonial.author || 'Happy Client'}</div>
                    </div>
                </div>
            `;
        }
        
        // Create languages HTML
        let languagesHtml = '';
        if (priest.languages && priest.languages.length > 0) {
            languagesHtml = `
                <div class="languages mt-2">
                    <span class="text-muted">Languages: </span>
                    ${priest.languages.join(', ')}
                </div>
            `;
        }
        
        // Create specializations HTML
        let specializationsHtml = '';
        if (priest.specializations && priest.specializations.length > 0) {
            specializationsHtml = `
                <div class="specializations mt-2">
                    <span class="text-muted">Specializes in: </span>
                    ${priest.specializations.join(', ')}
                </div>
            `;
        }
        
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
        
        // Check for available time slots (for future implementation)
        let availabilityBadge = '<span class="badge bg-success">Available</span>';
        
        // Use default image if not provided
        const priestPhoto = priest.photo || priest.photoUrl || 'images/services/priest.jpg';
        
        // Get review count or default to 0
        const reviewCount = priest.reviewCount || priest.reviews?.length || 0;
        
        // Set HTML content
        card.innerHTML = `
            <div class="row g-0">
                <div class="col-md-3">
                    <img src="${priestPhoto}" class="priest-photo img-fluid rounded-start" alt="${priest.name}" onerror="this.src='images/services/priest.jpg'">
                </div>
                <div class="col-md-9">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="priest-name card-title">${priest.name}</h5>
                            ${availabilityBadge}
                        </div>
                        <div class="rating mb-2">
                            ${starsHtml}
                            <span class="ms-1">(${reviewCount} reviews)</span>
                        </div>
                        <p class="experience mb-2">
                            <i class="fas fa-award text-primary me-2"></i>
                            ${priest.experience} years of experience
                        </p>
                        ${languagesHtml}
                        ${specializationsHtml}
                        <p class="description mt-2">${priest.description || 'Experienced priest specializing in traditional rituals.'}</p>
                        ${testimonialHtml}
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary view-profile-btn">View Full Profile</button>
                            <button class="btn btn-sm btn-primary select-btn">Select</button>
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
                window.open(`priest-profile.html?id=${priest.id}`, '_blank');
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
 * Setup event handlers for the page
 */
function setupEventHandlers() {
    // Apply filters button
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        applyFilters();
    });
    
    // Reset filters button
    document.getElementById('resetFiltersBtn').addEventListener('click', function() {
        resetFilters();
    });
    
    // Edit booking details button
    const editBookingLink = document.getElementById('editBookingLink');
    if (editBookingLink) {
        editBookingLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Get current URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const serviceType = urlParams.get('serviceType');
            const serviceName = urlParams.get('serviceName');
            
            // Redirect back to service details page with current parameters
            let redirectUrl = `service-details.html?`;
            if (serviceType) {
                redirectUrl += `type=${serviceType.toLowerCase()}`;
                if (serviceName) {
                    redirectUrl += `&name=${encodeURIComponent(serviceName)}`;
                }
            }
            window.location.href = redirectUrl;
        });
    }
    
    // Delegation for priest card buttons
    document.getElementById('priestsContainer').addEventListener('click', function(e) {
        // View profile button
        if (e.target.classList.contains('view-profile-btn') || e.target.closest('.view-profile-btn')) {
            const button = e.target.classList.contains('view-profile-btn') ? e.target : e.target.closest('.view-profile-btn');
            const priestId = button.dataset.priestId;
            openPriestDetailsModal(priestId);
        }
        
        // Select priest button
        if (e.target.classList.contains('select-priest-btn') || e.target.closest('.select-priest-btn')) {
            const button = e.target.classList.contains('select-priest-btn') ? e.target : e.target.closest('.select-priest-btn');
            const priestId = button.dataset.priestId;
            selectPriest(priestId);
        }
    });
    
    // Select priest from modal
    document.getElementById('selectPriestFromModalBtn').addEventListener('click', function() {
        const priestId = this.dataset.priestId;
        selectPriest(priestId);
        const priestModal = bootstrap.Modal.getInstance(document.getElementById('priestDetailsModal'));
        priestModal.hide();
    });
    
    // Proceed with booking button
    document.getElementById('proceedToBookingBtn').addEventListener('click', function() {
        const selectedPriestId = document.querySelector('.selected-priest').dataset.priestId;
        proceedWithBooking(selectedPriestId);
    });
    
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

/**
 * Initialize filters based on service type
 */
function initializeFilters(serviceType) {
    // Pre-select specialization checkboxes based on service type
    if (serviceType) {
        const specCheckbox = document.getElementById(`spec${serviceType}`);
        if (specCheckbox) {
            specCheckbox.checked = true;
        }
    }
}

/**
 * Apply filters to priests list
 */
function applyFilters() {
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingPriests');
    const noPriestsMessage = document.getElementById('noPriestsMessage');
    const priestsContainer = document.getElementById('priestsContainer');
    
    loadingIndicator.style.display = 'block';
    noPriestsMessage.classList.add('d-none');
    priestsContainer.innerHTML = '';
    
    // Get filter values
    const minRating = parseFloat(document.getElementById('ratingFilter').value);
    const minExperience = parseInt(document.getElementById('experienceFilter').value);
    
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
    
    // Get service type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    
    // Create reference to priests collection
    const priestsRef = firebase.firestore().collection('priests');
    
    // Build query based on filters
    let query = priestsRef;
    
    // We can only use one array-contains clause in Firestore, so we'll prioritize service type
    if (serviceType) {
        query = query.where('specializations', 'array-contains', serviceType);
    } else if (selectedSpecializations.length === 1) {
        // If no service type but exactly one specialization selected, we can query by that
        query = query.where('specializations', 'array-contains', selectedSpecializations[0]);
    }
    
    // For experience, we can use a range query
    if (minExperience > 0) {
        query = query.where('experience', '>=', minExperience);
    }
    
    // For rating, we can use a range query
    if (minRating > 0) {
        query = query.where('rating', '>=', minRating);
    }
    
    // Execute query
    query.get()
        .then(snapshot => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            if (snapshot.empty) {
                // No priests found
                noPriestsMessage.classList.remove('d-none');
                document.getElementById('priestCount').textContent = '0';
                return;
            }
            
            // Process results
            let priests = [];
            snapshot.forEach(doc => {
                const priest = doc.data();
                priest.id = doc.id;
                priests.push(priest);
            });
            
            // Apply client-side filtering for complex filters that can't be done in Firestore query
            // Filter by languages if any selected (priest must know at least one selected language)
            if (selectedLanguages.length > 0) {
                priests = priests.filter(priest => 
                    priest.languages && priest.languages.some(lang => selectedLanguages.includes(lang))
                );
            }
            
            // If we couldn't use specializations in the query, filter them here
            if (serviceType === null && selectedSpecializations.length > 1) {
                priests = priests.filter(priest => 
                    priest.specializations && priest.specializations.some(spec => selectedSpecializations.includes(spec))
                );
            }
            
            // Update UI
            if (priests.length === 0) {
                noPriestsMessage.classList.remove('d-none');
                document.getElementById('priestCount').textContent = '0';
            } else {
                document.getElementById('priestCount').textContent = priests.length;
                renderPriests(priests);
            }
        })
        .catch(error => {
            console.error("Error applying filters: ", error);
            loadingIndicator.style.display = 'none';
            
            // Fallback to local filtering on error
            const priests = getBackupPriestData(serviceType);
            const filteredPriests = applyLocalFilters(priests, minRating, minExperience, selectedLanguages, selectedSpecializations);
            
            if (filteredPriests.length === 0) {
                noPriestsMessage.classList.remove('d-none');
                document.getElementById('priestCount').textContent = '0';
            } else {
                document.getElementById('priestCount').textContent = filteredPriests.length;
                renderPriests(filteredPriests);
            }
        });
}

/**
 * Apply filters locally (used as fallback if Firestore query fails)
 */
function applyLocalFilters(priests, minRating, minExperience, selectedLanguages, selectedSpecializations) {
    return priests.filter(priest => {
        // Rating filter
        if (priest.rating < minRating) {
            return false;
        }
        
        // Experience filter
        if (priest.experience < minExperience) {
            return false;
        }
        
        // Languages filter (priest must know at least one selected language)
        if (selectedLanguages.length > 0) {
            const hasLanguage = priest.languages.some(lang => selectedLanguages.includes(lang));
            if (!hasLanguage) {
                return false;
            }
        }
        
        // Specializations filter (priest must have at least one selected specialization)
        if (selectedSpecializations.length > 0) {
            const hasSpecialization = priest.specializations.some(spec => selectedSpecializations.includes(spec));
            if (!hasSpecialization) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Reset all filters
 */
function resetFilters() {
    // Reset rating filter
    document.getElementById('ratingFilter').value = '0';
    
    // Reset experience filter
    document.getElementById('experienceFilter').value = '0';
    
    // Reset language checkboxes
    document.querySelectorAll('input[id^="lang"]').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // Reset specialization checkboxes
    document.querySelectorAll('input[id^="spec"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reload priests
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    const locationType = urlParams.get('locationType');
    
    loadAvailablePriests(serviceType, bookingDate, bookingTime, locationType);
}

/**
 * Open priest details modal
 */
function openPriestDetailsModal(priestId) {
    // Find the priest data
    const priest = getMockPriestsData().find(p => p.id === priestId);
    if (!priest) return;
    
    // Update modal content
    document.getElementById('priestDetailsModalLabel').textContent = priest.name;
    document.getElementById('modalPriestImage').src = priest.profileImage || 'images/priest-placeholder.jpg';
    document.getElementById('modalPriestName').textContent = priest.name;
    document.getElementById('modalPriestRating').textContent = `${priest.rating}/5`;
    document.getElementById('modalPriestReviews').textContent = priest.reviews;
    document.getElementById('modalPriestExperience').textContent = `${priest.experience} years`;
    document.getElementById('modalPriestLocation').textContent = priest.location;
    document.getElementById('modalPriestBio').textContent = priest.bio;
    
    // Set the priest ID on the select button
    document.getElementById('selectPriestFromModalBtn').dataset.priestId = priestId;
    
    // Update languages badges
    const languagesContainer = document.getElementById('modalPriestLanguages');
    languagesContainer.innerHTML = priest.languages.map(lang => 
        `<span class="badge badge-language me-1 mb-1">${lang}</span>`
    ).join('');
    
    // Update specializations badges
    const specializationsContainer = document.getElementById('modalPriestSpecializations');
    specializationsContainer.innerHTML = priest.specializations.map(spec => 
        `<span class="badge badge-specialization me-1 mb-1">${spec}</span>`
    ).join('');
    
    // Update reviews
    const reviewsContainer = document.getElementById('modalPriestReviewsContainer');
    reviewsContainer.innerHTML = '';
    
    if (priest.testimonials && priest.testimonials.length > 0) {
        priest.testimonials.forEach(review => {
            // Generate stars based on rating
            let starsHTML = '';
            for (let i = 0; i < review.rating; i++) {
                starsHTML += '<i class="fas fa-star"></i>';
            }
            for (let i = review.rating; i < 5; i++) {
                starsHTML += '<i class="far fa-star"></i>';
            }
            
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review-item mb-3';
            reviewElement.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <div class="rating-stars me-2">
                        ${starsHTML}
                    </div>
                    <strong>${review.name}</strong>
                    <span class="text-muted ms-auto">${review.date}</span>
                </div>
                <p class="mb-0">${review.comment}</p>
            `;
            
            reviewsContainer.appendChild(reviewElement);
        });
    } else {
        reviewsContainer.innerHTML = '<p class="text-muted">No reviews available yet.</p>';
    }
    
    // Show the modal
    const priestModal = new bootstrap.Modal(document.getElementById('priestDetailsModal'));
    priestModal.show();
}

/**
 * Select a priest
 */
function selectPriest(priestId) {
    // Get all priest cards
    const priestCards = document.querySelectorAll('.priest-card');
    
    // Remove selected class from all cards
    priestCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to the clicked card
    const selectedCard = document.querySelector(`.priest-card[data-priest-id="${priestId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Show the proceed button and update booking summary
    const proceedButton = document.getElementById('proceedToBookingBtn');
    proceedButton.classList.remove('d-none');
    proceedButton.onclick = () => proceedWithBooking(priestId);
    
    // Get priest details from Firebase for the booking summary
    firebase.firestore().collection('priests').doc(priestId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('Priest not found');
            }
            
            const priest = doc.data();
            
            // Update booking summary
            const urlParams = new URLSearchParams(window.location.search);
            const serviceType = urlParams.get('serviceType');
            const serviceName = urlParams.get('serviceName');
            const bookingDate = urlParams.get('date');
            const bookingTime = urlParams.get('time');
            const locationType = urlParams.get('locationType');
            const location = urlParams.get('location');
            
            // Update the booking summary in the UI
            document.getElementById('summaryServiceName').textContent = serviceName || serviceType;
            document.getElementById('summaryDate').textContent = bookingDate;
            document.getElementById('summaryTime').textContent = bookingTime;
            document.getElementById('summaryLocation').textContent = location || locationType;
            document.getElementById('summaryPriest').textContent = priest.name;
            
            // Show the booking summary
            document.getElementById('bookingSummary').classList.remove('d-none');
        })
        .catch(error => {
            console.error("Error loading priest details: ", error);
            
            // Fallback to using the displayed info from the card
            if (selectedCard) {
                const priestName = selectedCard.querySelector('.priest-name').textContent;
                
                // Update booking summary with available data
                const urlParams = new URLSearchParams(window.location.search);
                const serviceType = urlParams.get('serviceType');
                const serviceName = urlParams.get('serviceName');
                const bookingDate = urlParams.get('date');
                const bookingTime = urlParams.get('time');
                const locationType = urlParams.get('locationType');
                const location = urlParams.get('location');
                
                // Update the booking summary in the UI
                document.getElementById('summaryServiceName').textContent = serviceName || serviceType;
                document.getElementById('summaryDate').textContent = bookingDate;
                document.getElementById('summaryTime').textContent = bookingTime;
                document.getElementById('summaryLocation').textContent = location || locationType;
                document.getElementById('summaryPriest').textContent = priestName;
                
                // Show the booking summary
                document.getElementById('bookingSummary').classList.remove('d-none');
            }
        });
    
    // Scroll to the proceed section
    document.getElementById('proceedSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Proceed with booking
 */
function proceedWithBooking(priestId) {
    // Check if user is logged in
    if (!firebase.auth().currentUser) {
        alert("Please log in to complete your booking.");
        // Store booking details in session storage
        sessionStorage.setItem('pendingBooking', JSON.stringify({
            priestId: priestId,
            returnUrl: window.location.href
        }));
        // Redirect to login page
        window.location.href = 'login.html?redirect=booking';
        return;
    }
    
    // Get booking details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const serviceName = urlParams.get('serviceName');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    const locationType = urlParams.get('locationType');
    const location = urlParams.get('location');
    const latitude = urlParams.get('lat');
    const longitude = urlParams.get('lng');
    
    // Disable the proceed button and show loading state
    const proceedBtn = document.getElementById('proceedToBookingBtn');
    const originalBtnText = proceedBtn.innerHTML;
    proceedBtn.disabled = true;
    proceedBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // Get customer information
    const userId = firebase.auth().currentUser.uid;
    let userEmail = firebase.auth().currentUser.email;
    let customerRef = null;
    let priestData = null;
    let serviceData = null;
    let bookingId = null;
    
    // First get service details to calculate pricing
    let servicePromise;
    if (serviceType && serviceName) {
        servicePromise = firebase.firestore().collection('services')
            .where('type', '==', serviceType)
            .where('name', '==', serviceName)
            .limit(1)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    serviceData = snapshot.docs[0].data();
                    return serviceData;
                } else {
                    // If service not found, use default pricing
                    serviceData = {
                        basePrice: 1500
                    };
                    return serviceData;
                }
            });
    } else {
        // Default service data if none provided
        serviceData = {
            basePrice: 1500
        };
        servicePromise = Promise.resolve(serviceData);
    }
    
    // Chain promises to get all required data
    servicePromise
        .then(() => {
            return firebase.firestore().collection('customers').doc(userId).get();
        })
        .then(doc => {
            if (doc.exists) {
                customerRef = doc;
                return firebase.firestore().collection('priests').doc(priestId).get();
            } else {
                throw new Error('Customer record not found');
            }
        })
        .then(doc => {
            if (!doc.exists) {
                throw new Error('Priest not found');
            }
            
            priestData = doc.data();
            
            // Calculate the final price using the provided formula
            // M = [Base Price × (p + 0.02)] / 0.98
            // where p is the commission percentage (10% = 0.1)
            
            // Get base price - either from the priest's custom price for this service, service default, or fallback
            let basePrice = 1500; // Default fallback
            
            // First check if priest has a custom price for this service
            if (priestData.servicesPricing && 
                priestData.servicesPricing[serviceType] && 
                priestData.servicesPricing[serviceType][serviceName]) {
                basePrice = priestData.servicesPricing[serviceType][serviceName];
            }
            // Otherwise check if we have service data with a base price
            else if (serviceData && serviceData.basePrice) {
                basePrice = serviceData.basePrice;
            }
            
            // Platform commission (10%)
            const commissionPercentage = 0.1;
            
            // Calculate the final price using the formula
            const finalPrice = calculateFinalPrice(basePrice);
            
            // Calculate the platform fee and payment gateway fee for transparency
            const platformFee = basePrice * commissionPercentage;
            const paymentGatewayFee = finalPrice * 0.02;
            const priestAmount = basePrice;
            
            // Create booking record in Firestore with pricing details
            return firebase.firestore().collection('bookings').add({
                userId: userId,
                userEmail: userEmail,
                customerName: customerRef ? `${customerRef.data().firstName} ${customerRef.data().lastName}` : 'Customer',
                customerPhone: customerRef ? customerRef.data().phone : '',
                priestId: priestId,
                priestName: priestData.name || priestData.firstName + ' ' + priestData.lastName,
                serviceType: serviceType,
                serviceName: serviceName,
                bookingDate: bookingDate,
                bookingTime: bookingTime,
                locationType: locationType,
                location: location || null,
                coordinates: (latitude && longitude) ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : null,
                status: 'pending', // pending, confirmed, completed, cancelled
                pricing: {
                    basePrice: basePrice,
                    platformFee: platformFee,
                    paymentGatewayFee: paymentGatewayFee,
                    totalAmount: finalPrice,
                    priestAmount: priestAmount
                },
                isPaid: false,
                paymentMethod: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(bookingRef => {
            // Save booking ID for later use
            bookingId = bookingRef.id;
            
            // Create availability record to mark priest as booked for this time slot
            return firebase.firestore().collection('priestAvailability').add({
                priestId: priestId,
                bookingId: bookingRef.id,
                bookingDate: bookingDate,
                bookingTime: bookingTime,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Create notification for the priest
                return firebase.firestore().collection('priests').doc(priestId).collection('notifications').add({
                    title: 'New Booking Request',
                    message: `You have a new booking request for ${serviceName} on ${bookingDate} at ${bookingTime}.`,
                    type: 'order',
                    actionUrl: `orders.html?id=${bookingRef.id}`,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }).then(() => {
                return firebase.firestore().collection('bookings').doc(bookingRef.id).get();
            });
        })
        .then(bookingDoc => {
            // Get the booking data with pricing information
            const bookingData = bookingDoc.data();
            
            // Initiate Razorpay payment
            initiateRazorpayPayment(bookingId, bookingData);
        })
        .catch(error => {
            console.error("Error creating booking: ", error);
            
            // Restore button state
            proceedBtn.disabled = false;
            proceedBtn.innerHTML = originalBtnText;
            
            // Show error message
            alert("There was an error processing your booking. Please try again.");
        });
}

/**
 * Initiate Razorpay payment
 */
function initiateRazorpayPayment(bookingId, bookingData) {
    // Check if Razorpay is available
    if (typeof Razorpay === 'undefined') {
        alert("Payment gateway is not available. Please try again later.");
        window.location.href = `booking-confirmation.html?bookingId=${bookingId}&paymentStatus=pending`;
        return;
    }
    
    // Format customer details
    const customerName = bookingData.customerName || 'Customer';
    const customerEmail = bookingData.userEmail || '';
    const customerPhone = bookingData.customerPhone || '';
    
    // Format date for display
    const bookingDate = new Date(bookingData.bookingDate);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Razorpay configuration
    const options = {
        key: 'rzp_test_WcTQX42FAQu5zO', // Replace with your Razorpay key
        amount: Math.round(bookingData.pricing.totalAmount * 100), // Amount in paise
        currency: 'INR',
        name: 'Archaka Priest Services',
        description: `Booking for ${bookingData.serviceName}`,
        image: 'images/archaka.png',
        order_id: '', // This will be generated from your backend
        handler: function(response) {
            // Handle successful payment
            handleSuccessfulPayment(response, bookingId);
        },
        prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
        },
        notes: {
            bookingId: bookingId,
            serviceName: bookingData.serviceName,
            priestName: bookingData.priestName,
            bookingDate: formattedDate,
            bookingTime: bookingData.bookingTime
        },
        theme: {
            color: '#8e44ad'
        },
        modal: {
            ondismiss: function() {
                // If user closes payment window
                alert("Payment cancelled. Your booking has been saved but is not confirmed until payment is complete.");
                
                // Redirect to booking list with pending status
                window.location.href = `my-bookings.html?highlight=${bookingId}`;
                
                // Reset the proceed button
                const proceedBtn = document.getElementById('proceedToBookingBtn');
                proceedBtn.disabled = false;
                proceedBtn.innerHTML = 'Proceed to Payment';
            }
        }
    };
    
    // Create Razorpay instance and open payment modal
    const razorpayInstance = new Razorpay(options);
    razorpayInstance.open();
}

/**
 * Handle successful payment
 */
function handleSuccessfulPayment(response, bookingId) {
    // Update booking with payment details
    const paymentData = {
        isPaid: true,
        paymentStatus: 'paid',
        paymentMethod: 'razorpay',
        transactionId: response.razorpay_payment_id,
        transactionDetails: {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
        },
        paidAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Verify payment signature if verification function is available
    if (typeof window.verifyRazorpayPayment === 'function') {
        window.verifyRazorpayPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingId
        })
        .then(verificationResult => {
            console.log('Payment verification result:', verificationResult);
            updateBookingAfterPayment(bookingId, paymentData, true);
        })
        .catch(error => {
            console.error('Payment verification failed:', error);
            paymentData.paymentStatus = 'requires_verification';
            updateBookingAfterPayment(bookingId, paymentData, false);
        });
    } else {
        // If verification function is not available, proceed without verification
        updateBookingAfterPayment(bookingId, paymentData, false);
    }
}

/**
 * Update booking after payment
 */
function updateBookingAfterPayment(bookingId, paymentData, isVerified) {
    // Add verification status if verified
    if (isVerified) {
        paymentData.paymentStatus = 'verified';
        paymentData.paymentVerifiedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    
    // Update booking record in Firestore
    firebase.firestore().collection('bookings').doc(bookingId)
        .update(paymentData)
        .then(() => {
            // Get priest ID from booking to update their earnings
            return firebase.firestore().collection('bookings').doc(bookingId).get()
                .then(bookingDoc => {
                    const bookingData = bookingDoc.data();
                    const priestId = bookingData.priestId;
                    
                    // Create earning record for the priest
                    if (priestId) {
                        return firebase.firestore().collection('priests').doc(priestId).collection('earnings').add({
                            bookingId: bookingId,
                            serviceName: bookingData.serviceName,
                            amount: bookingData.pricing.priestAmount,
                            status: 'pending', // pending, released, paid
                            bookingDate: bookingData.bookingDate,
                            bookingTime: bookingData.bookingTime,
                            customerName: bookingData.customerName,
                            transactionId: paymentData.transactionId,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });
        })
        .then(() => {
            // Redirect to booking confirmation page
            window.location.href = `booking-confirmation.html?bookingId=${bookingId}`;
        })
        .catch(error => {
            console.error('Error updating booking after payment:', error);
            alert('Payment recorded, but there was an error updating your booking. Please contact support.');
            window.location.href = `booking-confirmation.html?bookingId=${bookingId}&error=update`;
        });
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
                // If we're using the original header
                if (document.getElementById('accountBtn')) {
                    document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> My Account';
                    document.getElementById('accountBtn').href = 'profile.html';
                }
                // If we're using the new header
                if (document.getElementById('navUserName')) {
                    document.getElementById('navUserName').textContent = user.displayName || user.email;
                    if (user.photoURL) {
                        document.getElementById('navProfileImage').src = user.photoURL;
                    }
                }
            } else {
                // If we're using the original header
                if (document.getElementById('accountBtn')) {
                    document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> Login';
                    document.getElementById('accountBtn').href = 'login.html';
                }
                // If we're using the new header
                if (document.getElementById('navUserName')) {
                    document.getElementById('navUserName').textContent = 'Guest';
                    document.getElementById('navProfileImage').src = 'https://via.placeholder.com/32';
                }
            }
        });
    }
}

// Add helper function to format dates from Firestore
function formatFirestoreDate(firestoreTimestamp) {
    if (!firestoreTimestamp) return '';
    
    try {
        const date = firestoreTimestamp.toDate();
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return '';
    }
}

/**
 * Calculate final price using platform's formula
 * M = [Base Price × (p + 0.02)] / 0.98
 * where p is the commission percentage (10% = 0.1)
 * @param {number} basePrice - The base price set by the priest
 * @returns {Object} - Object containing various price components
 */
function calculateFinalPrice(basePrice) {
    const commissionPercentage = 0.1; // 10%
    const finalPrice = (basePrice * (commissionPercentage + 0.02)) / 0.98;
    
    return {
        basePrice: basePrice,
        platformFee: basePrice * commissionPercentage,
        paymentGatewayFee: finalPrice * 0.02,
        totalAmount: finalPrice,
        priestAmount: basePrice
    };
}

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Add event listeners once DOM is loaded to update price displays
document.addEventListener('DOMContentLoaded', function() {
    // Update price breakdowns if price elements exist on page
    const priceBreakdownEl = document.getElementById('priceBreakdown');
    if (priceBreakdownEl) {
        updatePriceBreakdown();
    }
});

/**
 * Update price breakdown display
 */
function updatePriceBreakdown() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('serviceType');
    const serviceName = urlParams.get('serviceName');
    const priestId = document.querySelector('.selected-priest')?.dataset.priestId;
    
    if (!priestId) return;
    
    // Get the selected priest's data
    firebase.firestore().collection('priests').doc(priestId).get()
        .then(doc => {
            if (!doc.exists) return;
            
            const priestData = doc.data();
            
            // First check if priest has a custom price for this service
            let basePrice = 1500; // Default fallback
            
            if (priestData.servicesPricing && 
                priestData.servicesPricing[serviceType] && 
                priestData.servicesPricing[serviceType][serviceName]) {
                basePrice = priestData.servicesPricing[serviceType][serviceName];
            } else {
                // Check if we have service price in firestore
                return firebase.firestore().collection('services')
                    .where('type', '==', serviceType)
                    .where('name', '==', serviceName)
                    .limit(1)
                    .get()
                    .then(snapshot => {
                        if (!snapshot.empty) {
                            basePrice = snapshot.docs[0].data().basePrice || basePrice;
                        }
                        return updatePriceDisplay(basePrice);
                    });
            }
            
            return updatePriceDisplay(basePrice);
        })
        .catch(error => {
            console.error("Error getting priest data:", error);
            // Use default price if error
            updatePriceDisplay(1500);
        });
}

/**
 * Update the price display with calculated values
 */
function updatePriceDisplay(basePrice) {
    const priceDetails = calculateFinalPrice(basePrice);
    
    // Update DOM elements with price breakdown
    const priceBreakdownEl = document.getElementById('priceBreakdown');
    if (priceBreakdownEl) {
        priceBreakdownEl.innerHTML = `
            <div class="card mt-3">
                <div class="card-header bg-white">
                    <h5>Price Breakdown</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Base Price:</span>
                            <span>${formatCurrency(priceDetails.basePrice)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Platform Fee (10%):</span>
                            <span>${formatCurrency(priceDetails.platformFee)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Payment Gateway Fee (2%):</span>
                            <span>${formatCurrency(priceDetails.paymentGatewayFee)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between fw-bold">
                            <span>Total Amount:</span>
                            <span>${formatCurrency(priceDetails.totalAmount)}</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Update total amount on any other elements
    const totalAmountEl = document.getElementById('totalAmount');
    if (totalAmountEl) {
        totalAmountEl.textContent = formatCurrency(priceDetails.totalAmount);
    }
}