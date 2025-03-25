// Authentication System for Archaka Website

// Initialize Firebase Authentication
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error('Firebase not initialized!');
        return;
    }

    console.log('Auth.js loaded and initializing');

    // Set authentication state persistence
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch(error => {
            console.error('Error setting auth persistence:', error);
        });

    // Listen for authentication state changes
    firebase.auth().onAuthStateChanged(handleAuthStateChanged);

    // Add event listeners to auth elements if they exist
    setupAuthEventListeners();
});

/**
 * Handle authentication state changes
 */
function handleAuthStateChanged(user) {
    console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'User logged out');
    
    // Update navigation user info
    updateUserNavInfo(user);
    
    // Update any page-specific auth-dependent elements
    updateAuthDependentUI(user);
    
    // Update user session data
    if (user) {
        loadUserData(user.uid);
    }
    
    // Trigger a custom event that other scripts can listen for
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
}

/**
 * Update the navigation user information
 */
function updateUserNavInfo(user) {
    const navUserName = document.getElementById('navUserName');
    const navProfileImage = document.getElementById('navProfileImage');
    const userDropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // Make sure the elements exist on the page before trying to manipulate them
    if (!navUserName && !navProfileImage && !userDropdown) {
        console.log('Nav user elements not found, skipping UI update');
        return;
    }
    
    console.log('Updating navigation UI for user:', user ? user.email : 'Guest');
    
    if (user) {
        // User is signed in
        if (navUserName) {
            navUserName.textContent = user.displayName || user.email || 'User';
        }
        
        if (navProfileImage) {
            if (user.photoURL) {
                navProfileImage.src = user.photoURL;
            } else {
                // Use initial of name or email as profile image
                const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                navProfileImage.src = `https://via.placeholder.com/32/8e44ad/ffffff?text=${initial}`;
            }
        }
        
        // Add logged-in class to user dropdown if it exists
        if (userDropdown) {
            userDropdown.classList.add('logged-in');
            userDropdown.classList.remove('logged-out');
        }
        
        // Update dropdown menu items for logged-in state
        if (dropdownMenu) {
            dropdownMenu.innerHTML = `
                <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i> Profile</a></li>
                <li><a class="dropdown-item" href="orders.html"><i class="fas fa-list-alt me-2"></i> My Bookings</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
            `;
            
            // Add logout event listener
            document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
    } else {
        // User is signed out
        if (navUserName) {
            navUserName.textContent = 'Guest';
        }
        
        if (navProfileImage) {
            navProfileImage.src = 'https://via.placeholder.com/32/6c757d/ffffff?text=G';
        }
        
        // Add logged-out class to user dropdown if it exists
        if (userDropdown) {
            userDropdown.classList.add('logged-out');
            userDropdown.classList.remove('logged-in');
        }
        
        // Update dropdown menu items for logged-out state
        if (dropdownMenu) {
            dropdownMenu.innerHTML = `
                <li><a class="dropdown-item" href="login.html"><i class="fas fa-sign-in-alt me-2"></i> Login</a></li>
                <li><a class="dropdown-item" href="register.html"><i class="fas fa-user-plus me-2"></i> Register</a></li>
            `;
        }
    }
}

/**
 * Update page-specific UI elements based on auth state
 */
function updateAuthDependentUI(user) {
    // Detect current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    console.log('Updating auth-dependent UI on page:', currentPage);
    
    // Elements that should be visible only when logged in
    const authRequiredElements = document.querySelectorAll('.auth-required');
    // Elements that should be visible only when logged out
    const noAuthElements = document.querySelectorAll('.no-auth-required');
    
    // Show/hide elements based on auth state
    authRequiredElements.forEach(el => {
        el.style.display = user ? '' : 'none';
    });
    
    noAuthElements.forEach(el => {
        el.style.display = user ? 'none' : '';
    });
    
    // Handle specific pages
    if (currentPage === 'priest-booking.html' || currentPage === 'checkout.html') {
        // For pages that need authentication to proceed
        const proceedBtn = document.getElementById('proceedToBookingBtn') || 
                          document.getElementById('checkoutBtn');
        
        if (proceedBtn) {
            console.log('Found proceed button, updating based on auth state');
            
            proceedBtn.disabled = !user;
            if (!user) {
                proceedBtn.title = 'Please login to proceed';
                
                // Add a login prompt if not already present
                if (!document.getElementById('loginPrompt')) {
                    const prompt = document.createElement('div');
                    prompt.id = 'loginPrompt';
                    prompt.className = 'alert alert-warning mt-3';
                    prompt.innerHTML = `
                        <i class="fas fa-exclamation-circle me-2"></i>
                        You need to <a href="login.html" class="alert-link">login</a> or 
                        <a href="register.html" class="alert-link">register</a> to proceed with booking.
                    `;
                    proceedBtn.parentNode.appendChild(prompt);
                }
            } else {
                // Remove login prompt if exists
                document.getElementById('loginPrompt')?.remove();
            }
        }
    }
    
    // Update cart and user-specific data
    updateCartCount();
}

/**
 * Set up event listeners for authentication forms
 */
function setupAuthEventListeners() {
    console.log('Setting up auth event listeners');
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Found login form, adding submit handler');
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('loginError');
            const loginBtn = loginForm.querySelector('button[type="submit"]');
            
            if (errorMsg) errorMsg.textContent = '';
            
            // Disable button and show loading state
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Logging in...';
            }
            
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    // Re-enable button
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.innerHTML = 'Login';
                    }
                    
                    if (errorMsg) {
                        errorMsg.textContent = error.message;
                        errorMsg.style.display = 'block';
                    }
                    console.error('Login error:', error);
                });
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('Found register form, adding submit handler');
        
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('registerName')?.value || '';
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorMsg = document.getElementById('registerError');
            const registerBtn = registerForm.querySelector('button[type="submit"]');
            
            if (errorMsg) errorMsg.textContent = '';
            
            // Check if passwords match
            if (password !== confirmPassword) {
                if (errorMsg) {
                    errorMsg.textContent = 'Passwords do not match';
                    errorMsg.style.display = 'block';
                }
                return;
            }
            
            // Disable button and show loading state
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Creating account...';
            }
            
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Update user profile with name if provided
                    if (name) {
                        return userCredential.user.updateProfile({
                            displayName: name
                        }).then(() => userCredential);
                    }
                    return userCredential;
                })
                .then(userCredential => {
                    // Create user profile in Firestore
                    return firebase.firestore().collection('users').doc(userCredential.user.uid).set({
                        displayName: name || '',
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        role: 'customer'
                    });
                })
                .then(() => {
                    // Redirect to home page
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    // Re-enable button
                    if (registerBtn) {
                        registerBtn.disabled = false;
                        registerBtn.innerHTML = 'Register';
                    }
                    
                    if (errorMsg) {
                        errorMsg.textContent = error.message;
                        errorMsg.style.display = 'block';
                    }
                    console.error('Registration error:', error);
                });
        });
    }
    
    // Google sign-in
    const googleSignInBtn = document.getElementById('googleLogin');
    if (googleSignInBtn) {
        console.log('Found Google sign-in button, adding click handler');
        
        googleSignInBtn.addEventListener('click', function() {
            // Disable button and show loading state
            googleSignInBtn.disabled = true;
            googleSignInBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Connecting...';
            
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then(result => {
                    // Check if this is a new user
                    const isNewUser = result.additionalUserInfo.isNewUser;
                    if (isNewUser) {
                        // Create user profile in Firestore
                        return firebase.firestore().collection('users').doc(result.user.uid).set({
                            email: result.user.email,
                            displayName: result.user.displayName,
                            photoURL: result.user.photoURL,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            role: 'customer'
                        });
                    }
                })
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    // Re-enable button
                    googleSignInBtn.disabled = false;
                    googleSignInBtn.innerHTML = '<i class="fab fa-google me-2"></i> Sign in with Google';
                    
                    console.error('Google sign-in error:', error);
                    alert('Google sign-in failed: ' + error.message);
                });
        });
    }
    
    // Logout buttons (outside of dropdown)
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    });
}

/**
 * Logout the current user
 */
function logoutUser() {
    console.log('Logging out user');
    
    firebase.auth().signOut()
        .then(() => {
            console.log('Logout successful');
            
            // Clear any user-specific data from session storage
            sessionStorage.removeItem('userData');
            
            // Redirect to home page after logout
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Logout error:', error);
            alert('Error signing out: ' + error.message);
        });
}

/**
 * Load user data from Firestore
 */
function loadUserData(userId) {
    console.log('Loading user data for:', userId);
    
    firebase.firestore().collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                console.log('User data loaded:', userData);
                
                // Store user data in session storage for easy access
                sessionStorage.setItem('userData', JSON.stringify(userData));
                
                // Update any user profile UI elements if on profile page
                if (window.location.pathname.includes('profile.html')) {
                    updateProfileUI(userData);
                }
            } else {
                console.log('No user data found in Firestore');
            }
        })
        .catch(error => {
            console.error('Error loading user data:', error);
        });
}

/**
 * Update profile page UI with user data
 */
function updateProfileUI(userData) {
    console.log('Updating profile UI with user data');
    
    // Profile name
    const profileName = document.getElementById('profileName');
    if (profileName) {
        profileName.textContent = userData.displayName || userData.email;
    }
    
    // Profile details form
    const profileNameInput = document.getElementById('inputName');
    const profileEmailInput = document.getElementById('inputEmail');
    const profilePhoneInput = document.getElementById('inputPhone');
    const profileAddressInput = document.getElementById('inputAddress');
    
    if (profileNameInput) profileNameInput.value = userData.displayName || '';
    if (profileEmailInput) profileEmailInput.value = userData.email || '';
    if (profilePhoneInput) profilePhoneInput.value = userData.phone || '';
    if (profileAddressInput) profileAddressInput.value = userData.address || '';
}

/**
 * Update cart count from session storage or Firestore
 */
function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;
    
    const user = firebase.auth().currentUser;
    
    if (user) {
        // Get cart from Firestore if user is logged in
        firebase.firestore().collection('users').doc(user.uid)
            .collection('cart').get()
            .then(snapshot => {
                const count = snapshot.size;
                cartCountElement.textContent = count;
                
                // Show/hide based on count
                if (count > 0) {
                    cartCountElement.style.display = 'inline-block';
                } else {
                    cartCountElement.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error getting cart count:', error);
                cartCountElement.textContent = '0';
                cartCountElement.style.display = 'none';
            });
    } else {
        // Use localStorage for guest users
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cartCountElement.textContent = cart.length;
        
        // Show/hide based on count
        if (cart.length > 0) {
            cartCountElement.style.display = 'inline-block';
        } else {
            cartCountElement.style.display = 'none';
        }
    }
}

// Export functions for use in other scripts
window.archAuth = {
    logoutUser,
    updateCartCount,
    isAuthenticated: () => !!firebase.auth().currentUser,
    getCurrentUser: () => firebase.auth().currentUser
};