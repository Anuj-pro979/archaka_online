document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const priestProfileContent = document.getElementById('priestProfileContent');
    const profileSpinner = document.getElementById('profileSpinner');
    
    // Priest details elements
    const priestPhoto = document.getElementById('priestPhoto');
    const priestName = document.getElementById('priestName');
    const priestExperience = document.getElementById('priestExperience');
    const priestRating = document.getElementById('priestRating');
    const priestReviewCount = document.getElementById('priestReviewCount');
    const priestLocation = document.getElementById('priestLocation');
    const priestLanguages = document.getElementById('priestLanguages');
    const priestEducation = document.getElementById('priestEducation');
    const priestSpecialties = document.getElementById('priestSpecialties');
    const priestEmail = document.getElementById('priestEmail');
    const priestPhone = document.getElementById('priestPhone');
    const priestBio = document.getElementById('priestBio');
    
    // Review elements
    const avgRating = document.getElementById('avgRating');
    const totalReviews = document.getElementById('totalReviews');
    const reviewsList = document.getElementById('reviewsList');
    const writeReviewBtn = document.getElementById('writeReviewBtn');
    const reviewForm = document.getElementById('reviewForm');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    const loadMoreReviewsBtn = document.getElementById('loadMoreReviewsBtn');
    
    // Rating stars
    const ratingStars = document.querySelectorAll('.rating-input .star');
    const ratingInput = document.getElementById('ratingInput');
    
    // Book priest button
    const bookPriestBtn = document.getElementById('bookPriestBtn');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.location.href = `search-results.html?q=${encodeURIComponent(searchInput.value)}`;
        }
    });
    
    // Variables
    let priestData = null;
    let priestId = null;
    
    // Initialize
    init();
    
    function init() {
        // Show loading spinner
        profileSpinner.classList.remove('d-none');
        priestProfileContent.classList.add('d-none');
        
        // Get priest ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        priestId = urlParams.get('id');
        
        // Initialize UI elements
        initializeUI();
        
        // Load priest data
        if (priestId) {
            loadPriestData(priestId);
        } else {
            // No priest ID provided, load mock data
            loadMockPriestData();
        }
    }
    
    function initializeUI() {
        // Set up event listeners for rating stars
        ratingStars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(value);
            });
            
            star.addEventListener('click', function() {
                const value = parseInt(this.getAttribute('data-value'));
                ratingInput.value = value;
                highlightStars(value);
            });
        });
        
        // Reset stars on mouseout
        document.querySelector('.rating-input').addEventListener('mouseout', function() {
            const currentRating = parseInt(ratingInput.value);
            highlightStars(currentRating);
        });
        
        // Write review button
        writeReviewBtn.addEventListener('click', function() {
            // Check if user is logged in
            const user = firebase.auth().currentUser;
            if (!user) {
                // Redirect to login
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
                return;
            }
            
            reviewForm.classList.remove('d-none');
            this.classList.add('d-none');
        });
        
        // Cancel review button
        cancelReviewBtn.addEventListener('click', function() {
            reviewForm.classList.add('d-none');
            writeReviewBtn.classList.remove('d-none');
            document.getElementById('reviewTitle').value = '';
            document.getElementById('reviewContent').value = '';
            ratingInput.value = 0;
            highlightStars(0);
        });
        
        // Review form submission
        document.getElementById('priestReviewForm').addEventListener('submit', function(e) {
            e.preventDefault();
            submitReview();
        });
        
        // Book priest button
        bookPriestBtn.addEventListener('click', function() {
            // Check if user is logged in
            const user = firebase.auth().currentUser;
            if (!user) {
                // Redirect to login
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
                return;
            }
            
            // Redirect to booking page
            window.location.href = `booking.html?priestId=${priestId}`;
        });
        
        // Load more reviews button
        loadMoreReviewsBtn.addEventListener('click', function() {
            if (priestId) {
                // In a real implementation, you would load more reviews with pagination
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = 'Load More Reviews';
                    this.disabled = false;
                    this.classList.add('d-none');
                }, 1500);
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
    }
    
    function loadPriestData(priestId) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            // Try to get priest data from Firestore
            firebase.firestore().collection('priests').doc(priestId)
                .get()
                .then((doc) => {
                    if (doc.exists) {
                        priestData = {
                            id: doc.id,
                            ...doc.data()
                        };
                        updatePriestUI(priestData);
                    } else {
                        console.log("No priest found with ID:", priestId);
                        loadMockPriestData();
                    }
                })
                .catch((error) => {
                    console.error("Error loading priest data: ", error);
                    loadMockPriestData();
                });
        } else {
            // Use mock data if Firebase is not available
            loadMockPriestData();
        }
    }
    
    function loadMockPriestData() {
        // Use mock data for the priest
        priestData = {
            id: 'priest1',
            name: 'Pandit Ramesh Sharma',
            image: 'images/priest1.jpg',
            location: 'Chennai, Tamil Nadu',
            rating: 4.8,
            reviewCount: 120,
            experienceYears: 25,
            specialties: ['Naamakaranam', 'Annaprasana', 'Upanayanam', 'Gruhapravesam', 'Wedding Ceremonies'],
            languages: ['Tamil', 'Sanskrit', 'English'],
            education: 'Vedic Studies, Kanchipuram',
            bio: 'Pandit Ramesh Sharma is a highly respected priest with over 25 years of experience performing various Vedic ceremonies with precision and devotion. He is known for his deep knowledge of Sastras and ability to explain the significance of rituals to devotees. Born into a traditional family of priests in Tamil Nadu, he completed his Vedic education in Kanchipuram and has been serving devotees across South India ever since. He specializes in traditional ceremonies like Naamakaranam, Annaprasana, Upanayanam, Gruhapravesam, and Wedding Ceremonies, ensuring that each ritual is performed with authenticity and spiritual significance.',
            email: 'ramesh@priestservices.com',
            phone: '+91 9500095649'
        };
        
        updatePriestUI(priestData);
    }
    
    function updatePriestUI(priestData) {
        // Update basic priest information
        document.title = `${priestData.name} - Priest Services`;
        priestPhoto.src = priestData.image || 'images/priest-placeholder.jpg';
        priestName.textContent = priestData.name;
        priestExperience.textContent = `Experience: ${priestData.experienceYears || 0}+ years`;
        priestRating.textContent = priestData.rating ? priestData.rating.toFixed(1) : '0.0';
        priestReviewCount.textContent = `(${priestData.reviewCount || 0} Reviews)`;
        priestLocation.textContent = priestData.location || 'Location not specified';
        priestLanguages.textContent = priestData.languages ? priestData.languages.join(', ') : 'Not specified';
        priestEducation.textContent = priestData.education || 'Education not specified';
        priestEmail.textContent = priestData.email;
        priestEmail.href = `mailto:${priestData.email}`;
        priestPhone.textContent = priestData.phone;
        priestPhone.href = `tel:${priestData.phone}`;
        priestBio.textContent = priestData.bio || 'No biography available.';
        
        // Update specialties
        priestSpecialties.innerHTML = '';
        if (priestData.specialties && priestData.specialties.length > 0) {
            priestData.specialties.forEach(specialty => {
                const li = document.createElement('li');
                li.className = 'mb-2';
                li.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i> ${specialty}`;
                priestSpecialties.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'mb-2 text-muted';
            li.textContent = 'No specialties listed';
            priestSpecialties.appendChild(li);
        }
        
        // Update average rating
        avgRating.textContent = priestData.rating ? priestData.rating.toFixed(1) : '0.0';
        totalReviews.textContent = `Based on ${priestData.reviewCount || 0} reviews`;
        
        // Load reviews
        loadPriestReviews(priestData.id);
        
        // Initialize calendar
        initCalendar();
        
        // Hide spinner and show content
        profileSpinner.classList.add('d-none');
        priestProfileContent.classList.remove('d-none');
    }
    
    function loadPriestReviews(priestId) {
        // Clear existing reviews
        reviewsList.innerHTML = '';
        
        if (typeof firebase !== 'undefined' && firebase.firestore && priestId) {
            // Try to get reviews from Firestore
            firebase.firestore().collection('priests').doc(priestId)
                .collection('reviews')
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        // No reviews, create mock reviews
                        createMockReviews();
                    } else {
                        querySnapshot.forEach((doc) => {
                            const reviewData = doc.data();
                            const reviewElement = createReviewElement(reviewData);
                            reviewsList.appendChild(reviewElement);
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error loading reviews: ", error);
                    createMockReviews();
                });
        } else {
            // Use mock reviews if Firebase is not available
            createMockReviews();
        }
    }
    
    function createReviewElement(review) {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item mb-4 pb-4 border-bottom';
        
        // Generate stars for rating
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                starsHtml += '<span class="text-warning"><i class="fas fa-star"></i></span>';
            } else {
                starsHtml += '<span class="text-muted"><i class="far fa-star"></i></span>';
            }
        }
        
        // Format date
        const createdAt = review.createdAt ? new Date(review.createdAt.seconds * 1000) : new Date();
        const timeAgo = getTimeAgo(createdAt);
        
        reviewItem.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <img src="${review.userPhoto || 'images/user-placeholder.jpg'}" class="rounded-circle me-2" alt="User" width="40" height="40">
                <div>
                    <h6 class="mb-0">${review.userName || 'Anonymous User'}</h6>
                    <small class="text-muted">${timeAgo}</small>
                </div>
            </div>
            <div class="ratings mb-2">
                ${starsHtml}
            </div>
            <h6 class="mb-2">${review.title || 'No title'}</h6>
            <p class="mb-0">${review.content || 'No content provided.'}</p>
        `;
        
        return reviewItem;
    }
    
    function createMockReviews() {
        const mockReviews = [
            {
                userName: 'Rajesh Kumar',
                userPhoto: 'images/user-placeholder.jpg',
                rating: 5,
                title: 'Excellent Service for our Gruhapravesam',
                content: 'The pandit was very knowledgeable and performed all rituals with precision. He explained the significance of each step, making it meaningful for our family. Highly recommended!',
                createdAt: { seconds: Math.floor(Date.now() / 1000) - 1209600 } // 2 weeks ago
            },
            {
                userName: 'Anjali Sharma',
                userPhoto: 'images/user-placeholder.jpg',
                rating: 4,
                title: 'Great for our baby\'s Naamakaranam',
                content: 'We had a wonderful experience with the pandit for our baby\'s naming ceremony. He was punctual, professional and very patient with our family members. The ceremony was conducted beautifully.',
                createdAt: { seconds: Math.floor(Date.now() / 1000) - 2592000 } // 1 month ago
            },
            {
                userName: 'Vinod Reddy',
                userPhoto: 'images/user-placeholder.jpg',
                rating: 4.5,
                title: 'Thorough and Detailed Service',
                content: 'The pandit was thorough in his approach, making sure all the rituals were performed correctly. He was also very accommodating with our specific requirements and preferences.',
                createdAt: { seconds: Math.floor(Date.now() / 1000) - 5184000 } // 2 months ago
            }
        ];
        
        mockReviews.forEach(review => {
            const reviewElement = createReviewElement(review);
            reviewsList.appendChild(reviewElement);
        });
    }
    
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return interval === 1 ? '1 year ago' : `${interval} years ago`;
        }
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval === 1 ? '1 month ago' : `${interval} months ago`;
        }
        
        interval = Math.floor(seconds / 604800);
        if (interval >= 1) {
            return interval === 1 ? '1 week ago' : `${interval} weeks ago`;
        }
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval === 1 ? '1 day ago' : `${interval} days ago`;
        }
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
        }
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
        }
        
        return 'Just now';
    }
    
    function submitReview() {
        const rating = parseInt(ratingInput.value);
        const title = document.getElementById('reviewTitle').value.trim();
        const content = document.getElementById('reviewContent').value.trim();
        
        // Validate inputs
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        
        if (title === '') {
            alert('Please enter a title for your review');
            return;
        }
        
        if (content === '') {
            alert('Please enter your review');
            return;
        }
        
        // Get current user
        const user = firebase.auth().currentUser;
        
        if (!user) {
            alert('You must be logged in to submit a review');
            return;
        }
        
        // Prepare review data
        const reviewData = {
            rating: rating,
            title: title,
            content: content,
            userName: user.displayName || 'Anonymous User',
            userPhoto: user.photoURL || 'images/user-placeholder.jpg',
            userId: user.uid,
            priestId: priestId,
            createdAt: new Date()
        };
        
        // Show loading state
        const submitButton = document.querySelector('#priestReviewForm button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
        submitButton.disabled = true;
        
        if (typeof firebase !== 'undefined' && firebase.firestore && priestId) {
            // Submit to Firestore
            firebase.firestore().collection('priests').doc(priestId)
                .collection('reviews').add(reviewData)
                .then(() => {
                    // Update priest document with new rating count
                    return firebase.firestore().collection('priests').doc(priestId).update({
                        reviewCount: firebase.firestore.FieldValue.increment(1)
                    });
                })
                .then(() => {
                    // Success
                    alert('Thank you for your review!');
                    
                    // Reset form
                    document.getElementById('reviewTitle').value = '';
                    document.getElementById('reviewContent').value = '';
                    ratingInput.value = 0;
                    highlightStars(0);
                    
                    // Hide form
                    reviewForm.classList.add('d-none');
                    writeReviewBtn.classList.remove('d-none');
                    
                    // Add the new review to the top of the list
                    const reviewElement = createReviewElement(reviewData);
                    reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
                })
                .catch((error) => {
                    console.error("Error submitting review: ", error);
                    alert('Error submitting review. Please try again.');
                })
                .finally(() => {
                    // Reset button
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                });
        } else {
            // Mock submission
            setTimeout(() => {
                // Success
                alert('Thank you for your review!');
                
                // Reset form
                document.getElementById('reviewTitle').value = '';
                document.getElementById('reviewContent').value = '';
                ratingInput.value = 0;
                highlightStars(0);
                
                // Hide form
                reviewForm.classList.add('d-none');
                writeReviewBtn.classList.remove('d-none');
                
                // Add the new review to the top of the list
                const reviewElement = createReviewElement(reviewData);
                reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
                
                // Reset button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 1500);
        }
    }
    
    function highlightStars(value) {
        ratingStars.forEach((star, index) => {
            const starValue = index + 1;
            if (starValue <= value) {
                star.innerHTML = '<i class="fas fa-star"></i>';
            } else {
                star.innerHTML = '<i class="far fa-star"></i>';
            }
        });
    }
    
    function initCalendar() {
        // Initialize Flatpickr calendar
        const availabilityCalendar = flatpickr('#availabilityCalendar', {
            inline: true,
            minDate: 'today',
            maxDate: new Date().fp_incr(60), // 60 days from now
            dateFormat: 'Y-m-d',
            disable: [
                function(date) {
                    // Disable random dates to simulate unavailability
                    // In a real implementation, you would get this from the database
                    const random = Math.random();
                    return random < 0.3; // 30% of dates are unavailable
                }
            ],
            onChange: function(selectedDates, dateStr, instance) {
                // When a date is selected
                if (selectedDates.length > 0) {
                    // Check if user is logged in
                    const user = firebase.auth().currentUser;
                    if (!user) {
                        alert('Please login to book this priest');
                        instance.clear();
                        return;
                    }
                    
                    // Redirect to booking page with selected date
                    const date = dateStr;
                    window.location.href = `booking.html?priestId=${priestId}&date=${date}`;
                }
            }
        });
    }
}); 