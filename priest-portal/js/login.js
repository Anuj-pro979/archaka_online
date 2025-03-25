// Login and authentication management
document.addEventListener('DOMContentLoaded', function() {
  // Login form elements
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('login-alert');
  const loginBtn = document.getElementById('loginBtn');
  const loginSpinner = document.getElementById('loginSpinner');
  
  // Password reset elements
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const resetSpinner = document.getElementById('resetSpinner');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const backToLoginLink = document.getElementById('backToLoginLink');
  
  // Toggle between login and password reset forms
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.add('d-none');
      resetPasswordForm.classList.remove('d-none');
    });
  }
  
  if (backToLoginLink) {
    backToLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      resetPasswordForm.classList.add('d-none');
      loginForm.classList.remove('d-none');
    });
  }
  
  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form inputs
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const rememberMe = document.getElementById('rememberMe').checked;
      
      // Validate inputs
      if (!email || !password) {
        showLoginError('Please enter both email and password.');
        return;
      }
      
      // Disable login button and show spinner
      loginBtn.disabled = true;
      loginSpinner.classList.remove('d-none');
      
      try {
        // Set persistence based on "Remember me" checkbox
        const persistence = rememberMe ? 
          firebase.auth.Auth.Persistence.LOCAL : 
          firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Sign in with email and password
        await auth.signInWithEmailAndPassword(email, password);
        
        // Check if user is a registered priest
        const user = auth.currentUser;
        
        if (user) {
          // Check if user is in priests collection (approved)
          const priestDoc = await collectionsRef.priests.doc(user.uid).get();
          
          if (priestDoc.exists) {
            // User is an approved priest, redirect to dashboard
            window.location.href = 'dashboard.html';
          } else {
            // Check if user is in pendingPriests collection
            const pendingDoc = await collectionsRef.pendingPriests.doc(user.uid).get();
            
            if (pendingDoc.exists) {
              // Registration is pending approval
              window.location.href = 'pending.html';
            } else {
              // Check if user was rejected
              const rejectedDoc = await collectionsRef.rejectedPriests.doc(user.uid).get();
              
              if (rejectedDoc.exists) {
                // Registration was rejected
                await auth.signOut();
                showLoginError('Your registration has been rejected. Please contact support for more information.');
              } else {
                // User is not registered as a priest
                await auth.signOut();
                showLoginError('You are not registered as a priest. Please complete registration first.');
              }
            }
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific error codes
        switch (error.code) {
          case 'auth/user-not-found':
            showLoginError('No account found with this email address.');
            break;
          case 'auth/wrong-password':
            showLoginError('Incorrect password. Please try again.');
            break;
          case 'auth/too-many-requests':
            showLoginError('Too many failed login attempts. Please try again later or reset your password.');
            break;
          case 'auth/user-disabled':
            showLoginError('Your account has been disabled. Please contact support.');
            break;
          default:
            showLoginError(`Login failed: ${error.message}`);
        }
      } finally {
        // Enable login button and hide spinner
        loginBtn.disabled = false;
        loginSpinner.classList.add('d-none');
      }
    });
  }
  
  // Handle password reset form submission
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form input
      const email = document.getElementById('resetEmail').value;
      
      // Validate input
      if (!email) {
        showLoginError('Please enter your email address.');
        return;
      }
      
      // Disable reset button and show spinner
      resetPasswordBtn.disabled = true;
      resetSpinner.classList.remove('d-none');
      
      try {
        // Send password reset email
        await auth.sendPasswordResetEmail(email);
        
        // Show success message
        showLoginError('Password reset link has been sent to your email address.', 'success');
        
        // Switch back to login form after 3 seconds
        setTimeout(function() {
          resetPasswordForm.classList.add('d-none');
          loginForm.classList.remove('d-none');
        }, 3000);
      } catch (error) {
        console.error('Password reset error:', error);
        
        // Handle specific error codes
        switch (error.code) {
          case 'auth/user-not-found':
            showLoginError('No account found with this email address.');
            break;
          case 'auth/invalid-email':
            showLoginError('Please enter a valid email address.');
            break;
          default:
            showLoginError(`Password reset failed: ${error.message}`);
        }
      } finally {
        // Enable reset button and hide spinner
        resetPasswordBtn.disabled = false;
        resetSpinner.classList.add('d-none');
      }
    });
  }
  
  // Helper function to show login error
  function showLoginError(message, type = 'danger') {
    if (loginAlert) {
      loginAlert.textContent = message;
      loginAlert.className = `alert alert-${type}`;
      loginAlert.classList.remove('d-none');
    } else {
      showAlert(message, type);
    }
  }
}); 