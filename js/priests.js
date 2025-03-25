document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const priestsList = document.getElementById('priestsList');
    const priestsSpinner = document.getElementById('priestsSpinner');
    const noPriests = document.getElementById('noPriests');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // Filters
    const specialtyFilter = document.getElementById('specialtyFilter');
    const locationFilter = document.getElementById('locationFilter');
    const languageFilter = document.getElementById('languageFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.location.href = `search-results.html?q=${encodeURIComponent(searchInput.value)}`;
        }
    });
    
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> My Account';
            document.getElementById('accountBtn').href = 'profile.html';
        } else {
            // User is not signed in
            document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> Login';
            document.getElementById('accountBtn').href = 'login.html';
        }
    });
    
    // Variables for pagination
    let allPriests = [];
    let filteredPriests = [];
    let visiblePriests = 0;
    const priestsPerPage = 6;
    
    // Initialize
    init();
    
    function init() {
        // Show loading spinner
        priestsSpinner.classList.remove('d-none');
        priestsList.classList.add('d-none');
        noPriests.classList.add('d-none');
        
        // Set up event listeners
        specialtyFilter.addEventListener('change', applyFilters);
        locationFilter.addEventListener('change', applyFilters);
        languageFilter.addEventListener('change', applyFilters);
        sortFilter.addEventListener('change', applyFilters);
        resetFiltersBtn.addEventListener('click', resetFilters);
        loadMoreBtn.addEventListener('click', loadMorePriests);
        
        // Load priests data
        loadPriests();
    }
    
    function loadPriests() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            // Try to get priests from Firestore
            firebase.firestore().collection('priests')
                .get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        allPriests = getMockPriests();
                    } else {
                        allPriests = querySnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data
                            };
                        });
                    }
                    initializePriests();
                })
                .catch((error) => {
                    console.error("Error loading priests: ", error);
                    allPriests = getMockPriests();
                    initializePriests();
                });
        } else {
            // Use mock data if Firebase is not available
            allPriests = getMockPriests();
            initializePriests();
        }
    }
    
    function initializePriests() {
        // Apply initial filters
        applyFilters();
        
        // Hide spinner
        priestsSpinner.classList.add('d-none');
    }
    
    function applyFilters() {
        const specialty = specialtyFilter.value;
        const location = locationFilter.value;
        const language = languageFilter.value;
        const sortOption = sortFilter.value;
        
        // Filter priests based on selected criteria
        filteredPriests = allPriests.filter(priest => {
            let matchesSpecialty = specialty === 'all' || 
                (priest.specialties && priest.specialties.includes(specialty));
            
            let matchesLocation = location === 'all' || 
                (priest.location && priest.location.toLowerCase().includes(location.toLowerCase()));
            
            let matchesLanguage = language === 'all' || 
                (priest.languages && priest.languages.includes(language));
            
            return matchesSpecialty && matchesLocation && matchesLanguage;
        });
        
        // Sort priests
        sortPriests(sortOption);
        
        // Reset pagination
        visiblePriests = 0;
        
        // Clear priests list
        priestsList.innerHTML = '';
        
        // Show/hide elements based on filtered results
        if (filteredPriests.length === 0) {
            noPriests.classList.remove('d-none');
            priestsList.classList.add('d-none');
            loadMoreBtn.classList.add('d-none');
        } else {
            noPriests.classList.add('d-none');
            priestsList.classList.remove('d-none');
            displayPriests();
        }
    }
    
    function sortPriests(sortOption) {
        switch (sortOption) {
            case 'rating-high':
                filteredPriests.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'experience-high':
                filteredPriests.sort((a, b) => {
                    const aExp = a.experienceYears || 0;
                    const bExp = b.experienceYears || 0;
                    return bExp - aExp;
                });
                break;
            case 'name-asc':
                filteredPriests.sort((a, b) => {
                    const aName = a.name || '';
                    const bName = b.name || '';
                    return aName.localeCompare(bName);
                });
                break;
            default:
                // Default is relevance, no need to sort
                break;
        }
    }
    
    function displayPriests() {
        const priestsToShow = Math.min(filteredPriests.length - visiblePriests, priestsPerPage);
        
        for (let i = 0; i < priestsToShow; i++) {
            const priest = filteredPriests[visiblePriests + i];
            const priestCard = createPriestCard(priest);
            priestsList.appendChild(priestCard);
        }
        
        visiblePriests += priestsToShow;
        
        // Show/hide load more button
        if (visiblePriests >= filteredPriests.length) {
            loadMoreBtn.classList.add('d-none');
        } else {
            loadMoreBtn.classList.remove('d-none');
        }
    }
    
    function createPriestCard(priest) {
        const col = document.createElement('div');
        col.className = 'col';
        
        // Prepare specialties list (limit to 3 with "and more" text)
        let specialtiesHtml = '';
        if (priest.specialties && priest.specialties.length > 0) {
            const specialtiesLimit = Math.min(3, priest.specialties.length);
            for (let i = 0; i < specialtiesLimit; i++) {
                specialtiesHtml += `<span class="badge bg-light text-dark me-1 mb-1">${formatSpecialtyName(priest.specialties[i])}</span>`;
            }
            if (priest.specialties.length > 3) {
                specialtiesHtml += `<span class="badge bg-light text-dark me-1 mb-1">+${priest.specialties.length - 3} more</span>`;
            }
        }
        
        // Prepare languages list
        let languagesHtml = '';
        if (priest.languages && priest.languages.length > 0) {
            priest.languages.forEach(language => {
                languagesHtml += `<span class="badge bg-light text-dark me-1 mb-1">${language}</span>`;
            });
        }
        
        // Generate stars for rating
        let starsHtml = '';
        const rating = priest.rating || 0;
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                starsHtml += '<i class="fas fa-star text-warning"></i>';
            } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
                starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                starsHtml += '<i class="far fa-star text-warning"></i>';
            }
        }
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm hover-effect">
                <div class="position-relative">
                    <img src="${priest.image || 'images/priest-placeholder.jpg'}" class="card-img-top" alt="${priest.name}" style="height: 220px; object-fit: cover;">
                    <div class="position-absolute bottom-0 start-0 w-100 p-2 bg-gradient-dark text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-map-marker-alt me-1"></i> ${priest.location || 'Location not specified'}
                            </div>
                            <div class="text-warning">
                                ${starsHtml} <span class="ms-1">${rating.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${priest.name || 'Unnamed Priest'}</h5>
                    <p class="card-text text-muted mb-2"><i class="fas fa-graduation-cap me-2"></i> ${priest.experienceYears || 0}+ years experience</p>
                    
                    <div class="mb-3">
                        <h6 class="mb-2 small">Specialties:</h6>
                        <div>${specialtiesHtml || '<span class="text-muted small">No specialties listed</span>'}</div>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="mb-2 small">Languages:</h6>
                        <div>${languagesHtml || '<span class="text-muted small">No languages listed</span>'}</div>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <a href="priest-profile.html?id=${priest.id}" class="btn btn-outline-primary">View Profile</a>
                        <button class="btn btn-primary book-priest-btn" data-priest-id="${priest.id}">Book Now</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener to book button
        const bookBtn = col.querySelector('.book-priest-btn');
        bookBtn.addEventListener('click', function() {
            const priestId = this.getAttribute('data-priest-id');
            window.location.href = `booking.html?priestId=${priestId}`;
        });
        
        return col;
    }
    
    function loadMorePriests() {
        displayPriests();
    }
    
    function resetFilters() {
        specialtyFilter.value = 'all';
        locationFilter.value = 'all';
        languageFilter.value = 'all';
        sortFilter.value = 'relevance';
        applyFilters();
    }
    
    function formatSpecialtyName(specialty) {
        // Format specialty name for display
        // E.g., "naamakaranam" -> "Naamakaranam"
        if (!specialty) return '';
        return specialty.charAt(0).toUpperCase() + specialty.slice(1);
    }
    
    function getMockPriests() {
        return [
            {
                id: 'priest1',
                name: 'Pandit Ramesh Sharma',
                image: 'images/priest1.jpg',
                location: 'Chennai',
                rating: 4.8,
                experienceYears: 25,
                specialties: ['wedding', 'gruhapravesam', 'upanayanam', 'satyanarayan'],
                languages: ['Tamil', 'Sanskrit', 'English'],
                education: 'Vedic Studies, Kanchipuram',
                bio: 'Pandit Ramesh Sharma is a highly respected priest with over 25 years of experience performing various Vedic ceremonies with precision and devotion. He is known for his deep knowledge of Sastras and ability to explain the significance of rituals to devotees.',
                email: 'ramesh@priestservices.com',
                phone: '+91 9500095001'
            },
            {
                id: 'priest2',
                name: 'Pandit Venkatesh Iyer',
                image: 'images/priest2.jpg',
                location: 'Bangalore',
                rating: 4.9,
                experienceYears: 30,
                specialties: ['naamakaranam', 'annaprasana', 'wedding', 'homam'],
                languages: ['Kannada', 'Tamil', 'Sanskrit', 'English'],
                education: 'Traditional Gurukula, Sringeri',
                bio: 'Pandit Venkatesh Iyer comes from a traditional family of priests and has been performing ceremonies for three decades. He is particularly known for his expertise in child-related ceremonies and wedding rituals.',
                email: 'venkatesh@priestservices.com',
                phone: '+91 9500095002'
            },
            {
                id: 'priest3',
                name: 'Acharya Subramaniam',
                image: 'images/priest3.jpg',
                location: 'Chennai',
                rating: 4.7,
                experienceYears: 20,
                specialties: ['homam', 'gruhapravesam', 'vastu', 'navagraha'],
                languages: ['Tamil', 'Telugu', 'Sanskrit'],
                education: 'Vedic Studies, Tirupati',
                bio: 'Acharya Subramaniam specializes in homams and rituals related to Vastu and astrological remedies. His ceremonies are known for their authenticity and adherence to traditional methods.',
                email: 'subramaniam@priestservices.com',
                phone: '+91 9500095003'
            },
            {
                id: 'priest4',
                name: 'Pandit Krishnan Iyengar',
                image: 'images/priest4.jpg',
                location: 'Hyderabad',
                rating: 4.6,
                experienceYears: 22,
                specialties: ['wedding', 'upanayanam', 'satyanarayana', 'aksharabhyasam'],
                languages: ['Telugu', 'Sanskrit', 'English', 'Hindi'],
                education: 'Vedic Studies, Mysore',
                bio: 'Pandit Krishnan Iyengar is known for his melodious chanting and thorough knowledge of rituals. He takes time to explain the significance of each ritual to the participants, making ceremonies more meaningful.',
                email: 'krishnan@priestservices.com',
                phone: '+91 9500095004'
            },
            {
                id: 'priest5',
                name: 'Acharya Raghavan',
                image: 'images/priest5.jpg',
                location: 'Mumbai',
                rating: 4.5,
                experienceYears: 18,
                specialties: ['gruhapravesam', 'wedding', 'homam', 'pitru'],
                languages: ['Marathi', 'Hindi', 'Sanskrit'],
                education: 'Traditional Gurukula, Nashik',
                bio: 'Acharya Raghavan combines traditional knowledge with a modern approach, making ceremonies relevant for today\'s families while maintaining their sacred essence.',
                email: 'raghavan@priestservices.com',
                phone: '+91 9500095005'
            },
            {
                id: 'priest6',
                name: 'Pandit Vishwanath Sastri',
                image: 'images/priest6.jpg',
                location: 'Delhi',
                rating: 4.8,
                experienceYears: 35,
                specialties: ['naamakaranam', 'annaprasana', 'wedding', 'satyanarayana'],
                languages: ['Hindi', 'Sanskrit', 'English'],
                education: 'Vedic Studies, Varanasi',
                bio: 'Pandit Vishwanath Sastri is one of our most experienced priests with over three decades of service. His deep understanding of Vedic traditions and fluid Sanskrit recitation make ceremonies truly special.',
                email: 'vishwanath@priestservices.com',
                phone: '+91 9500095006'
            },
            {
                id: 'priest7',
                name: 'Acharya Ganesh Hegde',
                image: 'images/priest7.jpg',
                location: 'Bangalore',
                rating: 4.7,
                experienceYears: 15,
                specialties: ['wedding', 'upanayanam', 'homam', 'vastu'],
                languages: ['Kannada', 'English', 'Sanskrit', 'Hindi'],
                education: 'Vedic Studies, Udupi',
                bio: 'Acharya Ganesh Hegde represents the younger generation of priests who combine traditional knowledge with a contemporary approach to ceremonies.',
                email: 'ganesh@priestservices.com',
                phone: '+91 9500095007'
            },
            {
                id: 'priest8',
                name: 'Pandit Hari Prasad',
                image: 'images/priest8.jpg',
                location: 'Chennai',
                rating: 4.9,
                experienceYears: 28,
                specialties: ['naamakaranam', 'annaprasana', 'wedding', 'gruhapravesam'],
                languages: ['Tamil', 'Telugu', 'Sanskrit', 'English'],
                education: 'Traditional Gurukula, Kumbakonam',
                bio: 'Pandit Hari Prasad is highly sought after for family ceremonies and is known for his patient approach and attention to detail in every ritual he performs.',
                email: 'hari@priestservices.com',
                phone: '+91 9500095008'
            },
            {
                id: 'priest9',
                name: 'Acharya Narayanan',
                image: 'images/priest9.jpg',
                location: 'Hyderabad',
                rating: 4.6,
                experienceYears: 19,
                specialties: ['homam', 'navagraha', 'satyanarayana', 'pitru'],
                languages: ['Telugu', 'Sanskrit', 'English'],
                education: 'Vedic Studies, Chennai',
                bio: 'Acharya Narayanan specializes in astrological remedies and homams. His ceremonies are known for their energy and powerful mantras that create a divine atmosphere.',
                email: 'narayanan@priestservices.com',
                phone: '+91 9500095009'
            }
        ];
    }
}); 