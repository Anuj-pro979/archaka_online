// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCadZIoYzIc_QhEkGjv86G4rjFwMASd5ig",
  authDomain: "nothing-d3af4.firebaseapp.com",
  databaseURL: "https://nothing-d3af4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nothing-d3af4",
  storageBucket: "nothing-d3af4.firebasestorage.app",
  messagingSenderId: "7155955115",
  appId: "1:7155955115:web:3bd80618f9aff1a4dc8eee",
  measurementId: "G-XSVGL2M8LL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Initialize EmailJS
(function() {
  emailjs.init("ulDLogj4en_CQ0QbW");
})();

// Global variables for Firebase collections
const collectionsRef = {
  priests: db.collection('priests'),
  pendingPriests: db.collection('pendingPriests'),
  rejectedPriests: db.collection('rejectedPriests'),
  approvalTokens: db.collection('approvalTokens'),
  orders: db.collection('orders'),
  services: db.collection('services'),
  transactions: db.collection('transactions'),
  notifications: db.collection('notifications'),
  withdrawalRequests: db.collection('withdrawalRequests')
};

// Helper to generate secure tokens
function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Helper to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

// Helper to format dates
function formatDate(timestamp) {
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Helper to format timestamps
function formatTimestamp(timestamp) {
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Calculate gross-up amount to offset payment gateway fees
function calculateGrossUpAmount(netAmount, feePercentage = 2.0) {
  // Formula: gross = net / (1 - fee%)
  return netAmount / (1 - (feePercentage / 100));
}

// Show loader
function showLoader() {
  // Create loader if it doesn't exist
  if (!document.querySelector('.loader-overlay')) {
    const loaderOverlay = document.createElement('div');
    loaderOverlay.className = 'loader-overlay';
    
    const loader = document.createElement('div');
    loader.className = 'loader';
    
    loaderOverlay.appendChild(loader);
    document.body.appendChild(loaderOverlay);
  } else {
    document.querySelector('.loader-overlay').style.display = 'flex';
  }
}

// Hide loader
function hideLoader() {
  const loaderOverlay = document.querySelector('.loader-overlay');
  if (loaderOverlay) {
    loaderOverlay.style.display = 'none';
  }
}

// Show alert message
function showAlert(message, type = 'info', containerId = 'alert-container', autoHide = true) {
  // Find or create alert container
  let alertContainer = document.getElementById(containerId);
  
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = containerId;
    alertContainer.className = 'alert-container position-fixed top-0 start-50 translate-middle-x p-3';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }
  
  // Create alert element
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type} alert-dismissible fade show`;
  alertEl.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to container
  alertContainer.appendChild(alertEl);
  
  // Auto hide after 5 seconds if enabled
  if (autoHide) {
    setTimeout(() => {
      alertEl.classList.remove('show');
      setTimeout(() => {
        alertContainer.removeChild(alertEl);
      }, 300); // wait for fade out animation
    }, 5000);
  }
  
  return alertEl;
}

// Authentication state change
auth.onAuthStateChanged(user => {
  hideLoader();
  
  if (user) {
    // User is signed in, check if approved priest
    collectionsRef.priests.doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          // Priest is approved
          if (!window.location.pathname.includes('/dashboard.html') && 
              !window.location.pathname.includes('/profile.html') && 
              !window.location.pathname.includes('/orders.html') && 
              !window.location.pathname.includes('/earnings.html') && 
              !window.location.pathname.includes('/notifications.html')) {
            // Redirect to dashboard if not on a protected page
            window.location.href = 'dashboard.html';
          }
        } else {
          // Check if pending
          collectionsRef.pendingPriests.doc(user.uid).get()
            .then(pendingDoc => {
              if (pendingDoc.exists) {
                // Pending approval
                if (!window.location.pathname.includes('/pending.html')) {
                  window.location.href = 'pending.html';
                }
              } else {
                // Check if rejected
                collectionsRef.rejectedPriests.doc(user.uid).get()
                  .then(rejectedDoc => {
                    if (rejectedDoc.exists) {
                      // Registration rejected
                      auth.signOut().then(() => {
                        window.location.href = 'index.html';
                        showAlert('Your registration has been rejected. Please contact support for more information.', 'danger');
                      });
                    } else {
                      // Not registered as priest
                      if (!window.location.pathname.includes('/index.html')) {
                        window.location.href = 'index.html';
                      }
                    }
                  });
              }
            });
        }
      })
      .catch(error => {
        console.error('Error checking priest status:', error);
        showAlert('An error occurred. Please try again later.', 'danger');
      });
  } else {
    // User is signed out
    if (window.location.pathname.includes('/dashboard.html') || 
        window.location.pathname.includes('/profile.html') || 
        window.location.pathname.includes('/orders.html') || 
        window.location.pathname.includes('/earnings.html') || 
        window.location.pathname.includes('/notifications.html') ||
        window.location.pathname.includes('/pending.html')) {
      // Redirect to homepage if trying to access protected page
      window.location.href = 'index.html';
    }
  }
}); 