document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthState();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Check authentication state
function checkAuthState() {
    // Firebase auth state observer
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            showUserProfile(user);
            loadUserData(user.uid);
            loadUserBookings(user.uid);
        } else {
            // User is not signed in, show login required message
            document.getElementById('loginRequiredAlert').classList.remove('d-none');
            document.getElementById('profileContent').classList.add('d-none');
        }
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Personal information form
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updatePersonalInfo();
        });
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
}

// Show user profile information
function showUserProfile(user) {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userPhotoElement = document.getElementById('userPhoto');
    
    if (userNameElement) userNameElement.textContent = user.displayName || 'User';
    if (userEmailElement) userEmailElement.textContent = user.email;
    if (userPhotoElement && user.photoURL) userPhotoElement.src = user.photoURL;
}

// Load user data from Firestore
function loadUserData(userId) {
    db.collection('users').doc(userId)
        .get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Set form fields
                document.getElementById('firstName').value = userData.firstName || '';
                document.getElementById('lastName').value = userData.lastName || '';
                document.getElementById('profileEmail').value = userData.email || '';
                document.getElementById('phoneNumber').value = userData.phoneNumber || '';
                document.getElementById('address').value = userData.address || '';
                
                // Set username in the sidebar
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = userData.displayName || userData.firstName + ' ' + userData.lastName;
                }
            }
        })
        .catch(error => {
            console.error('Error getting user data:', error);
        });
}

// Load user bookings from Firestore
function loadUserBookings(userId) {
    const bookingTableBody = document.getElementById('bookingTableBody');
    const bookingListSpinner = document.querySelector('.booking-list-spinner');
    const bookingListEmpty = document.querySelector('.booking-list-empty');
    const bookingList = document.querySelector('.booking-list');
    
    if (bookingListSpinner) bookingListSpinner.classList.remove('d-none');
    if (bookingList) bookingList.classList.add('d-none');
    if (bookingListEmpty) bookingListEmpty.classList.add('d-none');
    
    db.collection('bookings')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
            if (bookingListSpinner) bookingListSpinner.classList.add('d-none');
            
            if (querySnapshot.empty) {
                if (bookingListEmpty) bookingListEmpty.classList.remove('d-none');
                return;
            }
            
            if (bookingList) bookingList.classList.remove('d-none');
            
            if (bookingTableBody) {
                bookingTableBody.innerHTML = '';
                
                querySnapshot.forEach(doc => {
                    const booking = doc.data();
                    const bookingId = doc.id;
                    
                    // Format date
                    const bookingDate = booking.date ? new Date(booking.date) : new Date();
                    const formattedDate = bookingDate.toLocaleDateString();
                    
                    // Create row
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>PS-${bookingId.substring(0, 6)}</td>
                        <td>${formatCeremonyName(booking.ceremony)}</td>
                        <td>${formattedDate}</td>
                        <td>${booking.priestName || 'Not assigned'}</td>
                        <td>
                            <span class="badge ${getStatusBadgeClass(booking.status)}">
                                ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                        </td>
                        <td>
                            <a href="booking-confirmation.html?id=${bookingId}" class="btn btn-sm btn-primary me-1">
                                <i class="fas fa-eye"></i>
                            </a>
                            ${booking.status === 'pending' ? `
                                <button class="btn btn-sm btn-danger cancel-booking" data-id="${bookingId}">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </td>
                    `;
                    
                    bookingTableBody.appendChild(row);
                });
                
                // Add event listeners to cancel buttons
                const cancelButtons = document.querySelectorAll('.cancel-booking');
                cancelButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const bookingId = this.getAttribute('data-id');
                        cancelBooking(bookingId);
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error getting bookings:', error);
            if (bookingListSpinner) bookingListSpinner.classList.add('d-none');
        });
}

// Update personal information
function updatePersonalInfo() {
    if (!currentUser) return;
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const address = document.getElementById('address').value;
    
    const userData = {
        firstName: firstName,
        lastName: lastName,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phoneNumber,
        address: address,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('users').doc(currentUser.uid)
        .update(userData)
        .then(() => {
            // Update display name in Firebase Auth
            return currentUser.updateProfile({
                displayName: `${firstName} ${lastName}`
            });
        })
        .then(() => {
            // Show success message
            const successAlert = document.getElementById('personalInfoSuccess');
            if (successAlert) {
                successAlert.classList.remove('d-none');
                setTimeout(() => {
                    successAlert.classList.add('d-none');
                }, 3000);
            }
            
            // Update UI
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = `${firstName} ${lastName}`;
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Error updating profile. Please try again.');
        });
}

// Change password
function changePassword() {
    if (!currentUser) return;
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const errorElement = document.getElementById('passwordError');
    const successElement = document.getElementById('passwordSuccess');
    
    // Reset error message
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.add('d-none');
    }
    
    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
        if (errorElement) {
            errorElement.textContent = 'New passwords do not match';
            errorElement.classList.remove('d-none');
        }
        return;
    }
    
    // Check password length
    if (newPassword.length < 8) {
        if (errorElement) {
            errorElement.textContent = 'Password must be at least 8 characters long';
            errorElement.classList.remove('d-none');
        }
        return;
    }
    
    // Re-authenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
    );
    
    currentUser.reauthenticateWithCredential(credential)
        .then(() => {
            // Change password
            return currentUser.updatePassword(newPassword);
        })
        .then(() => {
            // Show success message
            if (successElement) {
                successElement.classList.remove('d-none');
                setTimeout(() => {
                    successElement.classList.add('d-none');
                }, 3000);
            }
            
            // Clear form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        })
        .catch(error => {
            console.error('Error changing password:', error);
            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
}

// Cancel booking
function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    db.collection('bookings').doc(bookingId)
        .update({
            status: 'cancelled',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // Reload bookings
            loadUserBookings(currentUser.uid);
        })
        .catch(error => {
            console.error('Error cancelling booking:', error);
            alert('Error cancelling booking. Please try again.');
        });
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch(status) {
        case 'pending':
            return 'bg-warning text-dark';
        case 'confirmed':
            return 'bg-success';
        case 'cancelled':
            return 'bg-danger';
        case 'completed':
            return 'bg-info';
        default:
            return 'bg-secondary';
    }
}

// Format ceremony name for display (e.g., "naamakaranam" -> "Naamakaranam")
function formatCeremonyName(ceremonySlug) {
    if (!ceremonySlug) return '';
    return ceremonySlug.charAt(0).toUpperCase() + ceremonySlug.slice(1).replace(/-/g, ' ');
} 