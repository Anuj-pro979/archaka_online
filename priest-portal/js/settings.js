// Initialize Firebase
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase from the firebase-config.js file
  initializeFirebase();
  
  // Check authentication and load user data
  checkAuth();
  
  // Setup event listeners
  setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in
      loadUserData(user);
      updateUIForLoggedInUser(user);
    } else {
      // User is not signed in, redirect to login
      window.location.href = 'index.html';
    }
  });
}

// Load user data from Firestore
function loadUserData(user) {
  const db = firebase.firestore();
  
  // Get priest data
  db.collection('priests').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        const priestData = doc.data();
        
        // Update account settings form
        populateAccountSettings(priestData);
        
        // Load payment settings
        loadPaymentSettings(user.uid);
        
        // Load notification preferences
        loadNotificationPreferences(user.uid);
        
        // Load privacy settings
        loadPrivacySettings(user.uid);
      } else {
        console.error("No priest data found for the user");
      }
    })
    .catch((error) => {
      console.error("Error getting priest data:", error);
      showAlert('error', 'Failed to load your profile data. Please try again later.');
    });
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
  // Update navigation bar
  document.getElementById('navUserName').textContent = user.displayName || 'Priest';
  
  // Set email in settings form
  document.getElementById('settingsEmail').value = user.email;
  
  // Update profile image in navigation if available
  if (user.photoURL) {
    document.getElementById('navProfileImage').src = user.photoURL;
  }
  
  // Load notification count
  loadNotificationCount(user.uid);
}

// Load notification count
function loadNotificationCount(userId) {
  const db = firebase.firestore();
  
  db.collection('notifications')
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get()
    .then((querySnapshot) => {
      const count = querySnapshot.size;
      const badgeElement = document.getElementById('notification-count');
      
      if (count > 0) {
        badgeElement.textContent = count;
        badgeElement.style.display = 'flex';
      } else {
        badgeElement.style.display = 'none';
      }
    })
    .catch((error) => {
      console.error("Error getting notification count:", error);
    });
}

// Populate account settings form
function populateAccountSettings(priestData) {
  // Phone number
  if (priestData.phone) {
    document.getElementById('settingsPhone').value = priestData.phone;
  }
  
  // Language preference (default to English if not set)
  const languageSelect = document.getElementById('settingsLanguage');
  if (priestData.languagePreference) {
    languageSelect.value = priestData.languagePreference;
  } else {
    languageSelect.value = 'en';
  }
  
  // Timezone (default to India if not set)
  const timezoneSelect = document.getElementById('settingsTimezone');
  if (priestData.timezone) {
    timezoneSelect.value = priestData.timezone;
  } else {
    timezoneSelect.value = 'Asia/Kolkata';
  }
}

// Load payment settings
function loadPaymentSettings(userId) {
  const db = firebase.firestore();
  
  db.collection('payments').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const paymentData = doc.data();
        
        // Bank account details
        if (paymentData.bankDetails) {
          document.getElementById('accountName').value = paymentData.bankDetails.accountName || '';
          document.getElementById('accountNumber').value = paymentData.bankDetails.accountNumber || '';
          document.getElementById('ifscCode').value = paymentData.bankDetails.ifscCode || '';
          document.getElementById('bankName').value = paymentData.bankDetails.bankName || '';
          document.getElementById('bankBranch').value = paymentData.bankDetails.bankBranch || '';
        }
        
        // UPI ID
        if (paymentData.upiId) {
          document.getElementById('upiId').value = paymentData.upiId;
        }
        
        // PAN Number
        if (paymentData.panNumber) {
          document.getElementById('panNumber').value = paymentData.panNumber;
        }
      }
    })
    .catch((error) => {
      console.error("Error loading payment settings:", error);
    });
}

// Load notification preferences
function loadNotificationPreferences(userId) {
  const db = firebase.firestore();
  
  db.collection('notificationPreferences').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const preferences = doc.data();
        
        // Email notifications
        if (preferences.email) {
          document.getElementById('emailNewOrder').checked = preferences.email.newOrder ?? true;
          document.getElementById('emailOrderUpdate').checked = preferences.email.orderUpdate ?? true;
          document.getElementById('emailPayment').checked = preferences.email.payment ?? true;
          document.getElementById('emailSystem').checked = preferences.email.system ?? true;
          document.getElementById('emailMarketing').checked = preferences.email.marketing ?? false;
        }
        
        // SMS notifications
        if (preferences.sms) {
          document.getElementById('smsNewOrder').checked = preferences.sms.newOrder ?? true;
          document.getElementById('smsOrderUpdate').checked = preferences.sms.orderUpdate ?? false;
          document.getElementById('smsPayment').checked = preferences.sms.payment ?? false;
        }
        
        // Browser notifications
        if (preferences.browser) {
          document.getElementById('browserNotifications').checked = preferences.browser.enabled ?? true;
        }
      }
    })
    .catch((error) => {
      console.error("Error loading notification preferences:", error);
    });
}

// Load privacy settings
function loadPrivacySettings(userId) {
  const db = firebase.firestore();
  
  db.collection('privacySettings').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const settings = doc.data();
        
        // Profile visibility
        if (settings.profileVisibility) {
          document.getElementById('showPhone').checked = settings.profileVisibility.showPhone ?? true;
          document.getElementById('showEmail').checked = settings.profileVisibility.showEmail ?? false;
          document.getElementById('showLocation').checked = settings.profileVisibility.showLocation ?? true;
        }
        
        // Data usage
        if (settings.dataUsage) {
          document.getElementById('dataAnalytics').checked = settings.dataUsage.analytics ?? true;
          document.getElementById('dataPersonalization').checked = settings.dataUsage.personalization ?? true;
        }
      }
    })
    .catch((error) => {
      console.error("Error loading privacy settings:", error);
    });
}

// Setup event listeners for forms and buttons
function setupEventListeners() {
  // Account settings form submission
  const accountForm = document.getElementById('accountSettingsForm');
  if (accountForm) {
    accountForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveAccountSettings();
    });
  }
  
  // Password change form submission
  const passwordForm = document.getElementById('passwordChangeForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      changePassword();
    });
  }
  
  // Notification preferences form submission
  const notificationForm = document.getElementById('notificationSettingsForm');
  if (notificationForm) {
    notificationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveNotificationPreferences();
    });
  }
  
  // Payment settings form submission
  const paymentForm = document.getElementById('paymentSettingsForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      savePaymentSettings();
    });
  }
  
  // Privacy settings form submission
  const privacyForm = document.getElementById('privacySettingsForm');
  if (privacyForm) {
    privacyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      savePrivacySettings();
    });
  }
  
  // Request browser notification permission
  const notificationPermissionBtn = document.getElementById('requestNotificationPermission');
  if (notificationPermissionBtn) {
    notificationPermissionBtn.addEventListener('click', function() {
      requestNotificationPermission();
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      firebase.auth().signOut()
        .then(() => {
          window.location.href = 'index.html';
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          showAlert('error', 'Failed to sign out. Please try again.');
        });
    });
  }
  
  // Delete account confirmation input
  const deleteConfirmInput = document.getElementById('deleteConfirmation');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  
  if (deleteConfirmInput && confirmDeleteBtn) {
    deleteConfirmInput.addEventListener('input', function() {
      confirmDeleteBtn.disabled = (this.value !== 'DELETE');
    });
  }
  
  // Confirm deactivate button
  const confirmDeactivateBtn = document.getElementById('confirmDeactivateBtn');
  if (confirmDeactivateBtn) {
    confirmDeactivateBtn.addEventListener('click', function() {
      deactivateAccount();
    });
  }
  
  // Confirm delete button
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function() {
      deleteAccount();
    });
  }
}

// Save account settings
function saveAccountSettings() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const db = firebase.firestore();
  const phone = document.getElementById('settingsPhone').value;
  const language = document.getElementById('settingsLanguage').value;
  const timezone = document.getElementById('settingsTimezone').value;
  
  const updates = {
    phone: phone,
    languagePreference: language,
    timezone: timezone,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('priests').doc(user.uid).update(updates)
    .then(() => {
      showAlert('success', 'Account settings updated successfully!');
    })
    .catch((error) => {
      console.error("Error updating account settings:", error);
      showAlert('error', 'Failed to update account settings. Please try again.');
    });
}

// Change password
function changePassword() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (newPassword !== confirmPassword) {
    showAlert('error', 'New passwords do not match. Please try again.');
    return;
  }
  
  // Check password strength
  if (!isValidPassword(newPassword)) {
    showAlert('error', 'Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.');
    return;
  }
  
  // Re-authenticate user before changing password
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
  
  user.reauthenticateWithCredential(credential)
    .then(() => {
      // User re-authenticated, now change the password
      return user.updatePassword(newPassword);
    })
    .then(() => {
      document.getElementById('passwordChangeForm').reset();
      showAlert('success', 'Password changed successfully!');
    })
    .catch((error) => {
      console.error("Error changing password:", error);
      
      if (error.code === 'auth/wrong-password') {
        showAlert('error', 'Current password is incorrect. Please try again.');
      } else {
        showAlert('error', 'Failed to change password: ' + error.message);
      }
    });
}

// Check if password meets requirements
function isValidPassword(password) {
  // At least 8 characters long, has a letter, a number, and a symbol
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return regex.test(password);
}

// Save notification preferences
function saveNotificationPreferences() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const db = firebase.firestore();
  
  const preferences = {
    email: {
      newOrder: document.getElementById('emailNewOrder').checked,
      orderUpdate: document.getElementById('emailOrderUpdate').checked,
      payment: document.getElementById('emailPayment').checked,
      system: document.getElementById('emailSystem').checked,
      marketing: document.getElementById('emailMarketing').checked
    },
    sms: {
      newOrder: document.getElementById('smsNewOrder').checked,
      orderUpdate: document.getElementById('smsOrderUpdate').checked,
      payment: document.getElementById('smsPayment').checked
    },
    browser: {
      enabled: document.getElementById('browserNotifications').checked
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('notificationPreferences').doc(user.uid).set(preferences, { merge: true })
    .then(() => {
      showAlert('success', 'Notification preferences saved successfully!');
    })
    .catch((error) => {
      console.error("Error saving notification preferences:", error);
      showAlert('error', 'Failed to save notification preferences. Please try again.');
    });
}

// Save payment settings
function savePaymentSettings() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const db = firebase.firestore();
  
  const paymentData = {
    bankDetails: {
      accountName: document.getElementById('accountName').value,
      accountNumber: document.getElementById('accountNumber').value,
      ifscCode: document.getElementById('ifscCode').value,
      bankName: document.getElementById('bankName').value,
      bankBranch: document.getElementById('bankBranch').value
    },
    upiId: document.getElementById('upiId').value,
    panNumber: document.getElementById('panNumber').value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('payments').doc(user.uid).set(paymentData, { merge: true })
    .then(() => {
      showAlert('success', 'Payment details saved successfully!');
    })
    .catch((error) => {
      console.error("Error saving payment details:", error);
      showAlert('error', 'Failed to save payment details. Please try again.');
    });
}

// Save privacy settings
function savePrivacySettings() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const db = firebase.firestore();
  
  const privacySettings = {
    profileVisibility: {
      showPhone: document.getElementById('showPhone').checked,
      showEmail: document.getElementById('showEmail').checked,
      showLocation: document.getElementById('showLocation').checked
    },
    dataUsage: {
      analytics: document.getElementById('dataAnalytics').checked,
      personalization: document.getElementById('dataPersonalization').checked
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  db.collection('privacySettings').doc(user.uid).set(privacySettings, { merge: true })
    .then(() => {
      showAlert('success', 'Privacy settings saved successfully!');
    })
    .catch((error) => {
      console.error("Error saving privacy settings:", error);
      showAlert('error', 'Failed to save privacy settings. Please try again.');
    });
}

// Request notification permission
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showAlert('error', 'This browser does not support desktop notifications.');
    return;
  }
  
  Notification.requestPermission()
    .then((permission) => {
      if (permission === 'granted') {
        showAlert('success', 'Notification permission granted!');
        
        // Send a test notification
        new Notification('Archaka Priest Portal', {
          body: 'You will now receive notifications for new bookings and updates.',
          icon: 'images/logo.png'
        });
        
        // Update the switch to checked
        document.getElementById('browserNotifications').checked = true;
      } else {
        showAlert('error', 'Notification permission denied by browser.');
        document.getElementById('browserNotifications').checked = false;
      }
    });
}

// Deactivate account
function deactivateAccount() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const db = firebase.firestore();
  const reason = document.getElementById('deactivateReason').value;
  
  // Update the priest's active status
  db.collection('priests').doc(user.uid).update({
    isActive: false,
    deactivationReason: reason || null,
    deactivatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deactivateModal'));
    modal.hide();
    
    showAlert('success', 'Your account has been deactivated. You will be logged out now.');
    
    // Wait a moment then sign out
    setTimeout(() => {
      firebase.auth().signOut()
        .then(() => {
          window.location.href = 'index.html';
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    }, 3000);
  })
  .catch((error) => {
    console.error("Error deactivating account:", error);
    showAlert('error', 'Failed to deactivate account. Please try again.');
  });
}

// Delete account
function deleteAccount() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const confirmation = document.getElementById('deleteConfirmation').value;
  if (confirmation !== 'DELETE') {
    showAlert('error', 'Please type DELETE to confirm account deletion.');
    return;
  }
  
  const reason = document.getElementById('deleteReason').value;
  const db = firebase.firestore();
  
  // Store deletion request first (for administrative purposes)
  db.collection('accountDeletionRequests').add({
    userId: user.uid,
    email: user.email,
    displayName: user.displayName,
    reason: reason || null,
    requestedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    // Mark the priest as deleted in Firestore (but keep the record for reference)
    return db.collection('priests').doc(user.uid).update({
      isDeleted: true,
      deletionReason: reason || null,
      deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  })
  .then(() => {
    // Delete the Firebase Auth user
    return user.delete();
  })
  .then(() => {
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    
    showAlert('success', 'Your account has been deleted. You will be redirected to the home page.');
    
    // Wait a moment then redirect
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
  })
  .catch((error) => {
    console.error("Error deleting account:", error);
    
    if (error.code === 'auth/requires-recent-login') {
      showAlert('error', 'For security reasons, you need to log in again before deleting your account.');
      
      // Wait a moment then sign out to force re-login
      setTimeout(() => {
        firebase.auth().signOut()
          .then(() => {
            window.location.href = 'index.html';
          });
      }, 3000);
    } else {
      showAlert('error', 'Failed to delete account: ' + error.message);
    }
  });
}

// Show alert message
function showAlert(type, message) {
  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4`;
  alertElement.setAttribute('role', 'alert');
  alertElement.style.zIndex = '1050';
  alertElement.style.minWidth = '300px';
  
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to body
  document.body.appendChild(alertElement);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    alertElement.classList.remove('show');
    setTimeout(() => {
      alertElement.remove();
    }, 150);
  }, 5000);
} 