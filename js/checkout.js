document.addEventListener('DOMContentLoaded', function() {
    // Get booking data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    const ceremonyId = urlParams.get('ceremonyId');
    const priestId = urlParams.get('priestId');
    const bookingDate = urlParams.get('date');
    const bookingTime = urlParams.get('time');
    
    // UI elements
    const ceremonyImage = document.getElementById('ceremonyImage');
    const ceremonyName = document.getElementById('ceremonyName');
    const bookingDateElement = document.getElementById('bookingDate');
    const bookingTimeElement = document.getElementById('bookingTime');
    const priestNameElement = document.getElementById('priestName');
    const ceremonyPriceElement = document.getElementById('ceremonyPrice');
    const serviceFeeElement = document.getElementById('serviceFee');
    const taxAmountElement = document.getElementById('taxAmount');
    const totalAmountElement = document.getElementById('totalAmount');
    const termsCheck = document.getElementById('termsCheck');
    const payButton = document.getElementById('payButton');
    
    // Payment method radios
    const creditCardRadio = document.getElementById('creditCard');
    const upiRadio = document.getElementById('upi');
    const netBankingRadio = document.getElementById('netBanking');
    
    // Payment method forms
    const creditCardForm = document.getElementById('creditCardForm');
    const upiForm = document.getElementById('upiForm');
    const netBankingForm = document.getElementById('netBankingForm');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.location.href = `search-results.html?q=${encodeURIComponent(searchInput.value)}`;
        }
    });
    
    // Form elements
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    // Initialize booking data and prices
    let bookingData = {
        ceremonyName: '',
        priestName: '',
        ceremonyPrice: 0,
        serviceFee: 0,
        taxAmount: 0,
        totalAmount: 0
    };
    
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> My Account';
            document.getElementById('accountBtn').href = 'profile.html';
            
            // Fetch user data to prefill form
            fetchUserData(user.uid);
        } else {
            // User is not signed in
            document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> Login';
            document.getElementById('accountBtn').href = 'login.html';
            
            // Redirect to login page with redirect back to checkout
            window.location.href = `login.html?redirect=checkout.html${window.location.search}`;
        }
    });
    
    // Fetch booking details
    fetchBookingDetails();
    
    // Enable/disable pay button based on terms checkbox
    termsCheck.addEventListener('change', function() {
        payButton.disabled = !this.checked;
    });
    
    // Toggle payment method forms
    creditCardRadio.addEventListener('change', togglePaymentForms);
    upiRadio.addEventListener('change', togglePaymentForms);
    netBankingRadio.addEventListener('change', togglePaymentForms);
    
    // Handle pay button click
    payButton.addEventListener('click', processPayment);
    
    // Function to toggle payment forms based on selected method
    function togglePaymentForms() {
        if (creditCardRadio.checked) {
            creditCardForm.classList.remove('d-none');
            upiForm.classList.add('d-none');
            netBankingForm.classList.add('d-none');
        } else if (upiRadio.checked) {
            creditCardForm.classList.add('d-none');
            upiForm.classList.remove('d-none');
            netBankingForm.classList.add('d-none');
        } else if (netBankingRadio.checked) {
            creditCardForm.classList.add('d-none');
            upiForm.classList.add('d-none');
            netBankingForm.classList.remove('d-none');
        }
    }
    
    // Function to fetch booking details
    function fetchBookingDetails() {
        if (bookingId) {
            // If bookingId is provided, fetch the booking directly
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                firebase.firestore().collection('bookings').doc(bookingId)
                    .get()
                    .then((doc) => {
                        if (doc.exists) {
                            const data = doc.data();
                            updateBookingUI(data);
                            calculatePrices(data.ceremonyPrice || 0);
                        } else {
                            console.error("No booking found with this ID");
                            // Use mock data or redirect
                            useMockBookingData();
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching booking: ", error);
                        useMockBookingData();
                    });
            } else {
                useMockBookingData();
            }
        } else if (ceremonyId) {
            // If ceremonyId is provided, fetch ceremony details
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                let ceremonyPromise;
                
                // Determine which collection to query based on a prefix in ceremonyId
                if (ceremonyId.startsWith('ceremony-')) {
                    ceremonyPromise = firebase.firestore().collection('ceremonies').doc(ceremonyId).get();
                } else if (ceremonyId.startsWith('homa-')) {
                    ceremonyPromise = firebase.firestore().collection('homas').doc(ceremonyId).get();
                } else if (ceremonyId.startsWith('japam-')) {
                    ceremonyPromise = firebase.firestore().collection('japam').doc(ceremonyId).get();
                } else if (ceremonyId.startsWith('puja-')) {
                    ceremonyPromise = firebase.firestore().collection('pujas').doc(ceremonyId).get();
                } else {
                    // Default to ceremonies collection
                    ceremonyPromise = firebase.firestore().collection('ceremonies').doc(ceremonyId).get();
                }
                
                // Get ceremony data
                ceremonyPromise
                    .then((doc) => {
                        if (doc.exists) {
                            const ceremonyData = doc.data();
                            
                            // If priestId is provided, get priest details
                            if (priestId) {
                                firebase.firestore().collection('priests').doc(priestId)
                                    .get()
                                    .then((priestDoc) => {
                                        let priestData = null;
                                        if (priestDoc.exists) {
                                            priestData = priestDoc.data();
                                        }
                                        
                                        // Combine ceremony and priest data
                                        // Check if priest has custom pricing for this ceremony
                                        let ceremonyPrice = ceremonyData.price;
                                        if (priestData && priestData.customPricing && priestData.customPricing[ceremonyId]) {
                                            ceremonyPrice = priestData.customPricing[ceremonyId];
                                        }
                                        
                                        const combinedData = {
                                            ceremonyName: ceremonyData.name,
                                            ceremonyImage: ceremonyData.image,
                                            ceremonyPrice: ceremonyPrice,
                                            priestName: priestData ? priestData.name : 'Selected Priest',
                                            bookingDate: bookingDate || 'Select a date',
                                            bookingTime: bookingTime || 'Select a time',
                                            priestId: priestId
                                        };
                                        
                                        updateBookingUI(combinedData);
                                        calculatePrices(combinedData.ceremonyPrice || 0);
                                    })
                                    .catch((error) => {
                                        console.error("Error fetching priest: ", error);
                                        
                                        // Use ceremony data without priest details
                                        const combinedData = {
                                            ceremonyName: ceremonyData.name,
                                            ceremonyImage: ceremonyData.image,
                                            ceremonyPrice: ceremonyData.price,
                                            priestName: 'Selected Priest',
                                            bookingDate: bookingDate || 'Select a date',
                                            bookingTime: bookingTime || 'Select a time'
                                        };
                                        
                                        updateBookingUI(combinedData);
                                        calculatePrices(combinedData.ceremonyPrice || 0);
                                    });
                            } else {
                                // Use ceremony data without priest details
                                const combinedData = {
                                    ceremonyName: ceremonyData.name,
                                    ceremonyImage: ceremonyData.image,
                                    ceremonyPrice: ceremonyData.price,
                                    priestName: 'Select a priest',
                                    bookingDate: bookingDate || 'Select a date',
                                    bookingTime: bookingTime || 'Select a time'
                                };
                                
                                updateBookingUI(combinedData);
                                calculatePrices(combinedData.ceremonyPrice || 0);
                            }
                        } else {
                            console.error("No ceremony found with this ID");
                            useMockBookingData();
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching ceremony: ", error);
                        useMockBookingData();
                    });
            } else {
                useMockBookingData();
            }
        } else {
            // If no IDs are provided, use mock data
            useMockBookingData();
        }
    }
    
    // Function to update booking UI
    function updateBookingUI(data) {
        if (data.ceremonyImage) {
            ceremonyImage.src = data.ceremonyImage;
        }
        
        ceremonyName.textContent = data.ceremonyName || 'Ceremony';
        bookingDateElement.textContent = formatDate(data.bookingDate) || 'Select a date';
        bookingTimeElement.textContent = data.bookingTime || 'Select a time';
        priestNameElement.textContent = data.priestName || 'Select a priest';
        
        // Save booking data for later use
        bookingData = {
            ...bookingData,
            ceremonyName: data.ceremonyName,
            priestName: data.priestName,
            ceremonyPrice: data.ceremonyPrice
        };
    }
    
    // Function to calculate prices
    function calculatePrices(basePrice) {
        // Default values
        const baseCeremonyPrice = basePrice || 0;
        const serviceFeePercentage = 0.1; // 10% service fee
        const taxPercentage = 0.18; // 18% GST
        
        // Calculate fees
        const serviceFee = Math.round(baseCeremonyPrice * serviceFeePercentage);
        const subtotal = baseCeremonyPrice + serviceFee;
        const taxAmount = Math.round(subtotal * taxPercentage);
        const totalAmount = subtotal + taxAmount;
        
        // Update UI
        ceremonyPriceElement.textContent = `₹${formatPrice(baseCeremonyPrice)}`;
        serviceFeeElement.textContent = `₹${formatPrice(serviceFee)}`;
        taxAmountElement.textContent = `₹${formatPrice(taxAmount)}`;
        totalAmountElement.textContent = `₹${formatPrice(totalAmount)}`;
        
        // Save for later use
        bookingData.ceremonyPrice = baseCeremonyPrice;
        bookingData.serviceFee = serviceFee;
        bookingData.taxAmount = taxAmount;
        bookingData.totalAmount = totalAmount;
    }
    
    // Format price to show proper formatting with commas
    function formatPrice(price) {
        return price.toLocaleString('en-IN');
    }
    
    // Function to fetch user data
    function fetchUserData(userId) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            firebase.firestore().collection('users').doc(userId)
                .get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Pre-fill form fields
                        if (userData.displayName) {
                            fullNameInput.value = userData.displayName;
                        }
                        
                        if (userData.email) {
                            emailInput.value = userData.email;
                        }
                        
                        if (userData.phone) {
                            phoneInput.value = userData.phone;
                        }
                        
                        // Pre-fill address fields if available
                        if (userData.address) {
                            if (userData.address.addressLine1) {
                                document.getElementById('addressLine1').value = userData.address.addressLine1;
                            }
                            
                            if (userData.address.addressLine2) {
                                document.getElementById('addressLine2').value = userData.address.addressLine2;
                            }
                            
                            if (userData.address.city) {
                                document.getElementById('city').value = userData.address.city;
                            }
                            
                            if (userData.address.state) {
                                document.getElementById('state').value = userData.address.state;
                            }
                            
                            if (userData.address.zipCode) {
                                document.getElementById('zipCode').value = userData.address.zipCode;
                            }
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error fetching user data: ", error);
                });
        }
    }
    
    // Function to process payment using Razorpay
    function processPayment() {
        // Validate forms
        const personalInfoForm = document.getElementById('personalInfoForm');
        const addressForm = document.getElementById('addressForm');
        
        // Add form validation
        if (!personalInfoForm.checkValidity()) {
            personalInfoForm.reportValidity();
            return;
        }
        
        if (!addressForm.checkValidity()) {
            addressForm.reportValidity();
            return;
        }
        
        // Show loading state
        payButton.disabled = true;
        payButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        // Get form data
        const formData = {
            fullName: fullNameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            whatsapp: document.getElementById('whatsapp').value || phoneInput.value,
            address: {
                addressLine1: document.getElementById('addressLine1').value,
                addressLine2: document.getElementById('addressLine2').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value
            },
            specialInstructions: document.getElementById('specialInstructions').value,
            paymentMethod: 'razorpay'
        };
        
        // Generate booking ID and transaction reference
        const generatedBookingId = generateBookingId();
        
        // Create booking object with initial details
        const bookingDetails = {
            ...bookingData,
            ...formData,
            bookingId: bookingId || generatedBookingId,
            ceremonyId: ceremonyId,
            priestId: priestId,
            bookingDate: bookingDate,
            bookingTime: bookingTime,
            bookingStatus: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Save initial booking in Firebase if available
        let userId = null;
        
        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.auth().currentUser) {
            userId = firebase.auth().currentUser.uid;
            
            // Save pending booking to bookings collection
            firebase.firestore().collection('bookings').doc(bookingDetails.bookingId)
                .set(bookingDetails)
                .then(() => {
                    // Also add to user's bookings subcollection
                    return firebase.firestore().collection('users').doc(userId)
                        .collection('bookings').doc(bookingDetails.bookingId)
                        .set(bookingDetails);
                })
                .then(() => {
                    // Now initiate Razorpay payment
                    initiateRazorpayPayment(bookingDetails, userId);
                })
                .catch((error) => {
                    console.error("Error saving pending booking: ", error);
                    // Try to continue with payment anyway
                    initiateRazorpayPayment(bookingDetails, userId);
                });
        } else {
            // If Firebase isn't available, just initiate Razorpay directly
            initiateRazorpayPayment(bookingDetails, userId);
        }
    }
    
    // Function to initiate Razorpay payment
    function initiateRazorpayPayment(bookingDetails, userId) {
        // Show loading state
        payButton.disabled = true;
        payButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        // Create order data
        const orderData = {
            amount: bookingDetails.totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: bookingDetails.bookingId,
            notes: {
                bookingId: bookingDetails.bookingId,
                userId: userId,
                priestId: bookingDetails.priestId,
                ceremonyId: bookingDetails.ceremonyId,
                ceremonyName: bookingDetails.ceremonyName,
                bookingDate: bookingDetails.bookingDate,
                bookingTime: bookingDetails.bookingTime
            }
        };
        
        // If Firebase is available, create order using Cloud Function
        if (typeof firebase !== 'undefined' && firebase.functions) {
            const createRazorpayOrder = firebase.functions().httpsCallable('createRazorpayOrder');
            
            createRazorpayOrder(orderData)
                .then((result) => {
                    // Order created successfully, now open Razorpay checkout
                    const order = result.data;
                    
                    // Razorpay configuration
                    const options = {
                        key: 'rzp_test_WcTQX42FAQu5zO', // Replace with your Razorpay key
                        amount: bookingDetails.totalAmount * 100, // Amount in paise
                        currency: 'INR',
                        name: 'Archaka Priest Services',
                        description: `Booking for ${bookingDetails.ceremonyName}`,
                        image: 'images/archaka.png',
                        order_id: order.id, // Use the order ID from the server
                        handler: function (response) {
                            // Handle successful payment
                            handleSuccessfulPayment(response, bookingDetails, userId);
                        },
                        prefill: {
                            name: bookingDetails.fullName,
                            email: bookingDetails.email,
                            contact: bookingDetails.phone
                        },
                        notes: {
                            bookingId: bookingDetails.bookingId,
                            ceremonyName: bookingDetails.ceremonyName,
                            priestName: bookingDetails.priestName,
                            priestId: bookingDetails.priestId,
                            bookingDate: bookingDetails.bookingDate,
                            bookingTime: bookingDetails.bookingTime
                        },
                        theme: {
                            color: '#3f51b5'
                        },
                        modal: {
                            ondismiss: function() {
                                // Reset pay button if payment is cancelled
                                payButton.disabled = false;
                                payButton.innerHTML = 'Complete Payment';
                            }
                        }
                    };
                    
                    const razorpayInstance = new Razorpay(options);
                    razorpayInstance.open();
                })
                .catch((error) => {
                    console.error("Error creating Razorpay order:", error);
                    alert("There was an error processing your payment. Please try again.");
                    
                    // Reset pay button
                    payButton.disabled = false;
                    payButton.innerHTML = 'Complete Payment';
                });
        } else {
            // Fallback if Firebase Functions is not available
            // Razorpay configuration
            const options = {
                key: 'rzp_test_WcTQX42FAQu5zO', // Replace with your Razorpay key
                amount: bookingDetails.totalAmount * 100, // Amount in paise
                currency: 'INR',
                name: 'Archaka Priest Services',
                description: `Booking for ${bookingDetails.ceremonyName}`,
                image: 'images/archaka.png',
                handler: function (response) {
                    // Handle successful payment
                    handleSuccessfulPayment(response, bookingDetails, userId);
                },
                prefill: {
                    name: bookingDetails.fullName,
                    email: bookingDetails.email,
                    contact: bookingDetails.phone
                },
                notes: {
                    bookingId: bookingDetails.bookingId,
                    ceremonyName: bookingDetails.ceremonyName,
                    priestName: bookingDetails.priestName,
                    priestId: bookingDetails.priestId,
                    bookingDate: bookingDetails.bookingDate,
                    bookingTime: bookingDetails.bookingTime
                },
                theme: {
                    color: '#3f51b5'
                },
                modal: {
                    ondismiss: function() {
                        // Reset pay button if payment is cancelled
                        payButton.disabled = false;
                        payButton.innerHTML = 'Complete Payment';
                    }
                }
            };
            
            const razorpayInstance = new Razorpay(options);
            razorpayInstance.open();
        }
    }
    
    // Handle successful payment
    function handleSuccessfulPayment(response, bookingDetails, userId) {
        // Update booking with payment details
        const updatedBookingDetails = {
            ...bookingDetails,
            bookingStatus: 'confirmed',
            paymentStatus: 'paid',
            transactionId: response.razorpay_payment_id,
            transactionDetails: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
            },
            updatedAt: new Date().toISOString()
        };
        
        // Verify payment with Razorpay (in production, this would be done server-side)
        if (typeof window.verifyRazorpayPayment === 'function') {
            window.verifyRazorpayPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: updatedBookingDetails.bookingId
            })
            .then(verificationResult => {
                console.log('Payment verification result:', verificationResult);
                updateBookingAfterPayment(updatedBookingDetails, userId, true);
            })
            .catch(error => {
                console.error('Payment verification failed:', error);
                // Still update the booking, but mark it as requiring verification
                updatedBookingDetails.paymentStatus = 'requires_verification';
                updateBookingAfterPayment(updatedBookingDetails, userId, false);
            });
        } else {
            // Verification function not available, just update booking
            console.warn('Payment verification function not available');
            updateBookingAfterPayment(updatedBookingDetails, userId, false);
        }
    }
    
    // Update booking after payment (and optional verification)
    function updateBookingAfterPayment(updatedBookingDetails, userId, isVerified) {
        // Update booking in Firebase if available
        if (typeof firebase !== 'undefined' && firebase.firestore && userId) {
            // Calculate priest's commission (90% of ceremony price)
            const priestCommission = Math.round(updatedBookingDetails.ceremonyPrice * 0.9);
            const platformFee = updatedBookingDetails.ceremonyPrice - priestCommission;
            
            // Basic update data
            const updateData = {
                bookingStatus: 'confirmed',
                paymentStatus: isVerified ? 'verified' : updatedBookingDetails.paymentStatus,
                transactionId: updatedBookingDetails.transactionId,
                transactionDetails: updatedBookingDetails.transactionDetails,
                priestCommission: priestCommission,
                platformFee: platformFee,
                serviceFee: updatedBookingDetails.serviceFee,
                taxAmount: updatedBookingDetails.taxAmount,
                totalAmount: updatedBookingDetails.totalAmount,
                commissionPaid: false, // Will be set to true when priest is paid
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update booking in bookings collection
            firebase.firestore().collection('bookings').doc(updatedBookingDetails.bookingId)
                .update(updateData)
                .then(() => {
                    // Also update in user's bookings subcollection
                    return firebase.firestore().collection('users').doc(userId)
                        .collection('bookings').doc(updatedBookingDetails.bookingId)
                        .update(updateData);
                })
                .then(() => {
                    // Add to priest's orders
                    if (updatedBookingDetails.priestId) {
                        // For the priest's orders, include all booking details plus commission info
                        const priestOrderData = {
                            ...updatedBookingDetails,
                            ...updateData,
                            priestCommission: priestCommission,
                            platformFee: platformFee,
                            paymentDue: true
                        };
                        
                        return firebase.firestore().collection('priests').doc(updatedBookingDetails.priestId)
                            .collection('orders').doc(updatedBookingDetails.bookingId)
                            .set(priestOrderData);
                    }
                })
                .then(() => {
                    // Update priest's earnings record
                    if (updatedBookingDetails.priestId) {
                        return firebase.firestore().collection('priests').doc(updatedBookingDetails.priestId)
                            .collection('earnings').add({
                                bookingId: updatedBookingDetails.bookingId,
                                ceremonyName: updatedBookingDetails.ceremonyName,
                                bookingDate: updatedBookingDetails.bookingDate,
                                amount: priestCommission,
                                status: 'pending', // Will be updated to 'paid' when transferred
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                    }
                })
                .then(() => {
                    // Create a notification for the priest
                    if (updatedBookingDetails.priestId) {
                        const notification = {
                            type: 'new_order',
                            title: 'New Booking Received',
                            message: `You have a new booking for ${updatedBookingDetails.ceremonyName} on ${formatDate(updatedBookingDetails.bookingDate)}`,
                            bookingId: updatedBookingDetails.bookingId,
                            amount: priestCommission,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            read: false
                        };
                        
                        return firebase.firestore().collection('priests').doc(updatedBookingDetails.priestId)
                            .collection('notifications').add(notification);
                    }
                })
                .then(() => {
                    // Redirect to confirmation page
                    window.location.href = `booking-confirmation.html?bookingId=${updatedBookingDetails.bookingId}`;
                })
                .catch((error) => {
                    console.error("Error updating booking: ", error);
                    // Redirect anyway, since payment was successful
                    window.location.href = `booking-confirmation.html?bookingId=${updatedBookingDetails.bookingId}`;
                });
        } else {
            // If Firebase isn't available, just redirect to confirmation page
            window.location.href = `booking-confirmation.html?bookingId=${updatedBookingDetails.bookingId}`;
        }
    }
    
    // Function to use mock booking data
    function useMockBookingData() {
        const mockData = {
            ceremonyName: 'Satyanarayan Puja',
            ceremonyImage: 'images/satyanarayan-puja.jpg',
            ceremonyPrice: 5000,
            priestName: 'Pandit Ramesh Sharma',
            bookingDate: bookingDate || new Date().toISOString().split('T')[0],
            bookingTime: bookingTime || '09:00 AM'
        };
        
        updateBookingUI(mockData);
        calculatePrices(mockData.ceremonyPrice);
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString || dateString === 'Select a date') {
            return 'Select a date';
        }
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    }
    
    // Helper function to generate booking ID
    function generateBookingId() {
        return 'BK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
    }
});