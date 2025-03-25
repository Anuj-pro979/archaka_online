document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const bookingSpinner = document.getElementById('bookingSpinner');
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    
    // Ceremony elements
    const ceremonyType = document.getElementById('ceremonyType');
    const otherCeremonyGroup = document.getElementById('otherCeremonyGroup');
    const otherCeremony = document.getElementById('otherCeremony');
    const ceremonyDetails = document.getElementById('ceremonyDetails');
    const ceremonyImage = document.getElementById('ceremonyImage');
    const ceremonyTitle = document.getElementById('ceremonyTitle');
    const ceremonyDescription = document.getElementById('ceremonyDescription');
    const ceremonyDuration = document.getElementById('ceremonyDuration');
    const ceremonyPrice = document.getElementById('ceremonyPrice');
    
    // Priest elements
    const selectedPriestInfo = document.getElementById('selectedPriestInfo');
    const priestSelection = document.getElementById('priestSelection');
    const priestImage = document.getElementById('priestImage');
    const priestName = document.getElementById('priestName');
    const priestRating = document.getElementById('priestRating');
    const priestExperience = document.getElementById('priestExperience');
    const changePriestBtn = document.getElementById('changePriestBtn');
    const priestFilter = document.getElementById('priestFilter');
    const priestsList = document.getElementById('priestsList');
    
    // Date and time elements
    const ceremonyDate = document.getElementById('ceremonyDate');
    const ceremonyTime = document.getElementById('ceremonyTime');
    
    // Address elements
    const addressLine1 = document.getElementById('addressLine1');
    const addressLine2 = document.getElementById('addressLine2');
    const city = document.getElementById('city');
    const state = document.getElementById('state');
    const zipCode = document.getElementById('zipCode');
    const phone = document.getElementById('phone');
    const specialInstructions = document.getElementById('specialInstructions');
    
    // Summary elements
    const summaryCeremony = document.getElementById('summaryCeremony');
    const summaryPriest = document.getElementById('summaryPriest');
    const summaryDateTime = document.getElementById('summaryDateTime');
    const summaryFee = document.getElementById('summaryFee');
    const summaryServiceFee = document.getElementById('summaryServiceFee');
    const summaryTax = document.getElementById('summaryTax');
    const summaryTotal = document.getElementById('summaryTotal');
    const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    // Breadcrumb elements
    const breadcrumbCeremony = document.getElementById('breadcrumbCeremony');
    const breadcrumbPriest = document.getElementById('breadcrumbPriest');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.location.href = `search-results.html?q=${encodeURIComponent(searchInput.value)}`;
        }
    });
    
    // Variables
    let selectedCeremony = null;
    let selectedPriest = null;
    let ceremonies = [];
    let priests = [];
    
    // Initialize
    init();
    
    function init() {
        // Check authentication
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> My Account';
                document.getElementById('accountBtn').href = 'profile.html';
            } else {
                // User is not signed in
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
        });
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const priestId = urlParams.get('priestId');
        const ceremonyId = urlParams.get('ceremonyId');
        const dateParam = urlParams.get('date');
        
        // Initialize flatpickr date picker
        flatpickr(ceremonyDate, {
            minDate: 'today',
            maxDate: new Date().fp_incr(60), // 60 days from now
            dateFormat: 'Y-m-d',
            disable: [
                function(date) {
                    // Disable Sundays and random dates to simulate unavailability
                    return (date.getDay() === 0) || (Math.random() < 0.2);
                }
            ],
            defaultDate: dateParam || null,
            onChange: function(selectedDates, dateStr) {
                updateSummary();
            }
        });
        
        // Event listeners
        ceremonyType.addEventListener('change', handleCeremonyTypeChange);
        otherCeremony.addEventListener('input', updateSummary);
        changePriestBtn.addEventListener('click', showPriestSelection);
        priestFilter.addEventListener('change', filterPriests);
        ceremonyTime.addEventListener('change', updateSummary);
        
        // Checkout buttons
        proceedToCheckoutBtn.addEventListener('click', proceedToCheckout);
        addToCartBtn.addEventListener('click', addToCart);
        
        // Address fields
        const addressFields = [addressLine1, addressLine2, city, state, zipCode, phone];
        addressFields.forEach(field => {
            if (field) field.addEventListener('change', updateSummary);
        });
        
        // Load data
        loadCeremonies().then(() => {
            loadPriests().then(() => {
                // If priestId is provided, select that priest
                if (priestId) {
                    selectPriestById(priestId);
                }
                
                // If ceremonyId is provided, select that ceremony
                if (ceremonyId) {
                    selectCeremonyById(ceremonyId);
                }
                
                // Show the form
                bookingSpinner.classList.add('d-none');
                bookingFormContainer.classList.remove('d-none');
            });
        });
    }
    
    async function loadCeremonies() {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const snapshot = await firebase.firestore().collection('ceremonies').get();
                
                if (!snapshot.empty) {
                    ceremonies = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                } else {
                    ceremonies = getMockCeremonies();
                }
            } else {
                ceremonies = getMockCeremonies();
            }
        } catch (error) {
            console.error("Error loading ceremonies:", error);
            ceremonies = getMockCeremonies();
        }
    }
    
    async function loadPriests() {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const snapshot = await firebase.firestore().collection('priests').get();
                
                if (!snapshot.empty) {
                    priests = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                } else {
                    priests = getMockPriests();
                }
            } else {
                priests = getMockPriests();
            }
            
            // Display priests in the selection list
            displayPriests();
        } catch (error) {
            console.error("Error loading priests:", error);
            priests = getMockPriests();
            displayPriests();
        }
    }
    
    function handleCeremonyTypeChange() {
        const selectedValue = ceremonyType.value;
        
        // Show/hide "Other" input
        if (selectedValue === 'other') {
            otherCeremonyGroup.classList.remove('d-none');
        } else {
            otherCeremonyGroup.classList.add('d-none');
        }
        
        // Find the selected ceremony
        if (selectedValue && selectedValue !== 'other') {
            const ceremony = ceremonies.find(c => c.id === selectedValue);
            
            if (ceremony) {
                selectedCeremony = ceremony;
                
                // Update UI
                ceremonyImage.src = ceremony.image || 'images/ceremony-placeholder.jpg';
                ceremonyTitle.textContent = ceremony.name || selectedValue;
                ceremonyDescription.textContent = ceremony.description || 'No description available.';
                ceremonyDuration.textContent = ceremony.duration || '2-3 hours';
                ceremonyPrice.textContent = ceremony.price ? `₹${ceremony.price.toFixed(2)}` : '₹5,000.00';
                
                // Show ceremony details
                ceremonyDetails.classList.remove('d-none');
            } else {
                ceremonyDetails.classList.add('d-none');
                selectedCeremony = {
                    id: selectedValue,
                    name: selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1),
                    price: 5000
                };
            }
        } else {
            ceremonyDetails.classList.add('d-none');
            
            if (selectedValue === 'other') {
                selectedCeremony = {
                    id: 'other',
                    name: otherCeremony.value || 'Custom Ceremony',
                    price: 5000
                };
            } else {
                selectedCeremony = null;
            }
        }
        
        updateSummary();
    }
    
    function selectCeremonyById(ceremonyId) {
        // Set the select value
        ceremonyType.value = ceremonyId;
        
        // Trigger change event
        handleCeremonyTypeChange();
    }
    
    function showPriestSelection() {
        selectedPriestInfo.classList.add('d-none');
        priestSelection.classList.remove('d-none');
    }
    
    function selectPriest(priest) {
        selectedPriest = priest;
        
        // Update UI
        priestImage.src = priest.image || 'images/priest-placeholder.jpg';
        priestName.textContent = priest.name;
        
        // Update rating stars
        let starsHtml = '';
        const rating = priest.rating || 4.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                starsHtml += '<span class="text-warning"><i class="fas fa-star"></i></span>';
            } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
                starsHtml += '<span class="text-warning"><i class="fas fa-star-half-alt"></i></span>';
            } else {
                starsHtml += '<span class="text-warning"><i class="far fa-star"></i></span>';
            }
        }
        starsHtml += `<span class="ms-1">${rating}</span>`;
        priestRating.innerHTML = starsHtml;
        
        priestExperience.textContent = `Experience: ${priest.experienceYears || 15}+ years`;
        
        // Show priest info
        selectedPriestInfo.classList.remove('d-none');
        priestSelection.classList.add('d-none');
        
        updateSummary();
    }
    
    function selectPriestById(priestId) {
        const priest = priests.find(p => p.id === priestId);
        if (priest) {
            selectPriest(priest);
        }
    }
    
    function displayPriests() {
        // Clear priest list
        priestsList.innerHTML = '';
        
        // Sort priests according to filter
        sortPriests();
        
        // Display priests
        priests.forEach(priest => {
            const priestCard = createPriestCard(priest);
            priestsList.appendChild(priestCard);
        });
    }
    
    function sortPriests() {
        const sortOption = priestFilter.value;
        
        switch (sortOption) {
            case 'rating':
                priests.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'experience':
                priests.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
                break;
            default:
                // For 'recommended', use a combination of rating and experience
                priests.sort((a, b) => {
                    const aScore = (a.rating || 0) * 0.7 + (a.experienceYears || 0) * 0.3 / 10;
                    const bScore = (b.rating || 0) * 0.7 + (b.experienceYears || 0) * 0.3 / 10;
                    return bScore - aScore;
                });
                break;
        }
    }
    
    function filterPriests() {
        displayPriests();
    }
    
    function createPriestCard(priest) {
        const col = document.createElement('div');
        col.className = 'col';
        
        // Generate stars for rating
        let starsHtml = '';
        const rating = priest.rating || 0;
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                starsHtml += '<span class="text-warning"><i class="fas fa-star"></i></span>';
            } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
                starsHtml += '<span class="text-warning"><i class="fas fa-star-half-alt"></i></span>';
            } else {
                starsHtml += '<span class="text-warning"><i class="far fa-star"></i></span>';
            }
        }
        
        col.innerHTML = `
            <div class="card h-100 hover-effect cursor-pointer">
                <div class="row g-0">
                    <div class="col-md-4">
                        <img src="${priest.image || 'images/priest-placeholder.jpg'}" class="img-fluid rounded-start" alt="${priest.name}" style="height: 100%; object-fit: cover;">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title mb-1">${priest.name || 'Unnamed Priest'}</h5>
                            <div class="ratings mb-1">
                                ${starsHtml} <span class="ms-1">${priest.rating ? priest.rating.toFixed(1) : '0.0'}</span>
                            </div>
                            <p class="card-text mb-2 small"><i class="fas fa-map-marker-alt me-1 text-primary"></i> ${priest.location || 'Location not specified'}</p>
                            <p class="card-text mb-2 small"><i class="fas fa-graduation-cap me-1 text-primary"></i> ${priest.experienceYears || 0}+ years experience</p>
                            <button class="btn btn-outline-primary btn-sm mt-auto">Select</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener for selecting a priest
        col.querySelector('.card').addEventListener('click', function() {
            selectPriest(priest);
        });
        
        return col;
    }
    
    function updateSummary() {
        // Update ceremony summary
        if (selectedCeremony) {
            let ceremonyName = selectedCeremony.name;
            if (selectedCeremony.id === 'other') {
                ceremonyName = otherCeremony.value || 'Custom Ceremony';
            }
            summaryCeremony.textContent = ceremonyName;
        } else {
            summaryCeremony.textContent = 'Not selected';
        }
        
        // Update priest summary
        if (selectedPriest) {
            summaryPriest.textContent = selectedPriest.name;
        } else {
            summaryPriest.textContent = 'Not selected';
        }
        
        // Update date & time summary
        const date = ceremonyDate.value;
        const time = ceremonyTime.value;
        if (date && time) {
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const formattedTime = new Date(`2023-01-01T${time}`).toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
            summaryDateTime.textContent = `${formattedDate} at ${formattedTime}`;
        } else {
            summaryDateTime.textContent = 'Not selected';
        }
        
        // Update price summary
        const baseFee = selectedCeremony ? selectedCeremony.price : 0;
        const serviceFee = baseFee * 0.05; // 5% service fee
        const tax = (baseFee + serviceFee) * 0.18; // 18% GST
        const total = baseFee + serviceFee + tax;
        
        summaryFee.textContent = `₹${baseFee.toFixed(2)}`;
        summaryServiceFee.textContent = `₹${serviceFee.toFixed(2)}`;
        summaryTax.textContent = `₹${tax.toFixed(2)}`;
        summaryTotal.textContent = `₹${total.toFixed(2)}`;
        
        // Enable/disable buttons
        const isFormComplete = selectedCeremony && selectedPriest && date && time && addressLine1.value && city.value && state.value && zipCode.value && phone.value;
        
        proceedToCheckoutBtn.disabled = !isFormComplete;
        addToCartBtn.disabled = !isFormComplete;
    }
    
    function proceedToCheckout() {
        // Prepare booking data
        const bookingData = prepareBookingData();
        
        // Save to localStorage for checkout page
        localStorage.setItem('currentBooking', JSON.stringify(bookingData));
        
        // Redirect to checkout
        window.location.href = `checkout.html?ceremonyId=${bookingData.ceremonyId}&priestId=${bookingData.priestId}&date=${bookingData.date}&time=${encodeURIComponent(bookingData.time)}`;
    }
    
    function addToCart() {
        // Prepare booking data
        const bookingData = prepareBookingData();
        
        // Get existing cart from localStorage
        let cart = JSON.parse(localStorage.getItem('priestServicesCart') || '[]');
        
        // Add new item
        cart.push(bookingData);
        
        // Save to localStorage
        localStorage.setItem('priestServicesCart', JSON.stringify(cart));
        
        // Update cart count
        document.getElementById('cartCount').textContent = cart.length;
        
        // Show confirmation message
        alert('Ceremony added to cart successfully!');
        
        // Check if user is authenticated
        const user = firebase.auth().currentUser;
        if (user && typeof firebase !== 'undefined' && firebase.firestore) {
            // Save to Firestore
            firebase.firestore().collection('users').doc(user.uid)
                .collection('cart').add(bookingData)
                .catch(error => {
                    console.error("Error adding to cart: ", error);
                });
        }
    }
    
    function prepareBookingData() {
        // Prepare booking data
        let ceremonyName = selectedCeremony.name;
        if (selectedCeremony.id === 'other') {
            ceremonyName = otherCeremony.value || 'Custom Ceremony';
        }
        
        return {
            ceremonyId: selectedCeremony.id,
            name: ceremonyName,
            priestId: selectedPriest.id,
            priestName: selectedPriest.name,
            date: ceremonyDate.value,
            time: ceremonyTime.value,
            price: selectedCeremony.price,
            address: {
                line1: addressLine1.value,
                line2: addressLine2.value,
                city: city.value,
                state: state.value,
                zipCode: zipCode.value
            },
            phone: phone.value,
            specialInstructions: specialInstructions.value,
            image: selectedCeremony.image || 'images/ceremony-placeholder.jpg',
            category: selectedCeremony.category || 'ceremony',
            createdAt: new Date().toISOString()
        };
    }
    
    function getMockCeremonies() {
        return [
            {
                id: 'gruhapravesam',
                name: 'Gruhapravesam (House Warming)',
                description: 'Traditional ceremony performed when moving into a new home to invoke blessings and positive energy.',
                image: 'images/gruhapravesam.jpg',
                price: 12000,
                duration: '3-4 hours',
                category: 'ceremonies'
            },
            {
                id: 'naamakaranam',
                name: 'Naamakaranam (Naming Ceremony)',
                description: 'The sacred ceremony of naming a newborn child according to astrological calculations and family traditions.',
                image: 'images/naamakaranam.jpg',
                price: 8000,
                duration: '1-2 hours',
                category: 'ceremonies'
            },
            {
                id: 'annaprasana',
                name: 'Annaprasana (First Solid Food)',
                description: 'Important ceremony when a child is given solid food for the first time, usually performed when the baby is 6 months old.',
                image: 'images/annaprasana.jpg',
                price: 7500,
                duration: '1-2 hours',
                category: 'ceremonies'
            },
            {
                id: 'upanayanam',
                name: 'Upanayanam (Thread Ceremony)',
                description: 'A significant ceremony marking the beginning of formal education for young boys, also known as the sacred thread ceremony.',
                image: 'images/upanayanam.jpg',
                price: 15000,
                duration: '4-5 hours',
                category: 'ceremonies'
            },
            {
                id: 'wedding',
                name: 'Wedding Ceremony',
                description: 'Traditional Hindu wedding ceremony following all rituals and customs as per family traditions and cultural background.',
                image: 'images/wedding.jpg',
                price: 25000,
                duration: '2-3 days',
                category: 'ceremonies'
            },
            {
                id: 'satyanarayana',
                name: 'Satyanarayan Puja',
                description: 'A sacred puja dedicated to Lord Vishnu that brings prosperity, happiness, and success to the devotees.',
                image: 'images/satyanarayana.jpg',
                price: 5000,
                duration: '2-3 hours',
                category: 'pujas'
            },
            {
                id: 'ganapathi',
                name: 'Ganapathi Homam',
                description: 'A fire ritual dedicated to Lord Ganesha to remove obstacles and ensure success in new endeavors.',
                image: 'images/ganapathi.jpg',
                price: 6000,
                duration: '2-3 hours',
                category: 'homas'
            },
            {
                id: 'navagraha',
                name: 'Navagraha Homam',
                description: 'A powerful homam to pacify the nine planetary deities and mitigate their negative effects.',
                image: 'images/navagraha.jpg',
                price: 8000,
                duration: '3-4 hours',
                category: 'homas'
            }
        ];
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
                specialties: ['wedding', 'gruhapravesam', 'upanayanam', 'satyanarayan']
            },
            {
                id: 'priest2',
                name: 'Pandit Venkatesh Iyer',
                image: 'images/priest2.jpg',
                location: 'Bangalore',
                rating: 4.9,
                experienceYears: 30,
                specialties: ['naamakaranam', 'annaprasana', 'wedding', 'homam']
            },
            {
                id: 'priest3',
                name: 'Acharya Subramaniam',
                image: 'images/priest3.jpg',
                location: 'Chennai',
                rating: 4.7,
                experienceYears: 20,
                specialties: ['homam', 'gruhapravesam', 'vastu', 'navagraha']
            },
            {
                id: 'priest4',
                name: 'Pandit Krishnan Iyengar',
                image: 'images/priest4.jpg',
                location: 'Hyderabad',
                rating: 4.6,
                experienceYears: 22,
                specialties: ['wedding', 'upanayanam', 'satyanarayana', 'aksharabhyasam']
            }
        ];
    }
}); 