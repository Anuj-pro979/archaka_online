document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase from firebase-config.js
  
  // DOM Elements
  const profileName = document.getElementById('profileName');
  const profileQualification = document.getElementById('profileQualification');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileCover = document.getElementById('profileCover');
  const navUserName = document.getElementById('navUserName');
  const navProfileImage = document.getElementById('navProfileImage');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Form Elements
  const personalInfoForm = document.getElementById('personalInfoForm');
  const savePersonalInfoBtn = document.getElementById('savePersonalInfoBtn');
  const personalInfoSpinner = document.getElementById('personalInfoSpinner');
  
  // Document Elements
  const updateIdProofBtn = document.getElementById('updateIdProofBtn');
  const updateQualificationProofBtn = document.getElementById('updateQualificationProofBtn');
  const addDocumentBtn = document.getElementById('addDocumentBtn');
  const uploadDocumentBtn = document.getElementById('uploadDocumentBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  
  // Service Elements
  const saveServiceBtn = document.getElementById('saveServiceBtn');
  
  // Settings Elements
  const changePasswordForm = document.getElementById('changePasswordForm');
  const notificationPreferencesForm = document.getElementById('notificationPreferencesForm');
  const availabilityStatus = document.getElementById('availabilityStatus');
  const confirmDeactivateBtn = document.getElementById('confirmDeactivateBtn');
  
  // Check authentication state
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in, get user data
      loadUserProfile(user.uid);
    } else {
      // No user is signed in, redirect to login
      window.location.href = 'login.html';
    }
  });

  // Load user profile data from Firestore
  function loadUserProfile(userId) {
    showLoader('Loading profile...');
    
    firebase.firestore().collection('priests').doc(userId).get()
      .then((doc) => {
        hideLoader();
        
        if (doc.exists) {
          const userData = doc.data();
          
          // Update profile header and navigation
          profileName.textContent = `${userData.firstName} ${userData.lastName}`;
          navUserName.textContent = `${userData.firstName} ${userData.lastName}`;
          profileQualification.textContent = userData.qualification;
          
          if (userData.profilePhotoURL) {
            profileAvatar.src = userData.profilePhotoURL;
            navProfileImage.src = userData.profilePhotoURL;
          }
          
          if (userData.coverPhotoURL) {
            profileCover.src = userData.coverPhotoURL;
          }
          
          // Fill in personal info form
          document.getElementById('firstName').value = userData.firstName || '';
          document.getElementById('lastName').value = userData.lastName || '';
          document.getElementById('email').value = userData.email || '';
          document.getElementById('phone').value = userData.phone || '';
          document.getElementById('dob').value = userData.dob || '';
          document.getElementById('gender').value = userData.gender || '';
          document.getElementById('address').value = userData.address || '';
          document.getElementById('city').value = userData.city || '';
          document.getElementById('state').value = userData.state || '';
          document.getElementById('country').value = userData.country || '';
          document.getElementById('bio').value = userData.bio || '';
          document.getElementById('qualification').value = userData.qualification || '';
          document.getElementById('experience').value = userData.experience || '';
          
          // Set language checkboxes
          if (userData.languages && userData.languages.length > 0) {
            userData.languages.forEach(lang => {
              const checkbox = document.getElementById(`lang${lang}`);
              if (checkbox) checkbox.checked = true;
            });
          }
          
          // Set availability status
          if (availabilityStatus) {
            availabilityStatus.checked = userData.isAvailable || false;
          }
          
          // Load documents previews
          if (userData.idProofURL) {
            document.getElementById('idProofPreview').innerHTML = `
              <img src="${userData.idProofURL}" alt="ID Proof" class="img-fluid mb-2" style="max-height: 200px;">
              <p class="mb-0 text-muted">ID Document</p>
            `;
          }
          
          if (userData.qualificationProofURL) {
            document.getElementById('qualificationProofPreview').innerHTML = `
              <img src="${userData.qualificationProofURL}" alt="Qualification Certificate" class="img-fluid mb-2" style="max-height: 200px;">
              <p class="mb-0 text-muted">Qualification Certificate</p>
            `;
          }
          
          // Load services
          loadServices(userId);
          
          // Load additional documents
          loadAdditionalDocuments(userId);
          
          // Set notification preferences
          if (userData.notificationPreferences) {
            document.getElementById('emailNotifications').checked = userData.notificationPreferences.email || true;
            document.getElementById('smsNotifications').checked = userData.notificationPreferences.sms || true;
            document.getElementById('marketingEmails').checked = userData.notificationPreferences.marketing || false;
          }
          
          // Load availability settings
          if (userData.availability) {
            document.getElementById('availabilityType').value = userData.availability.type || 'full-time';
            document.getElementById('maxTravelDistance').value = userData.availability.maxTravelDistance || 20;
            document.getElementById('advanceBookingDays').value = userData.availability.advanceBookingDays || 30;
            
            // Show/hide custom schedule based on availability type
            toggleCustomSchedule(userData.availability.type);
            
            // Load weekly schedule if available
            if (userData.availability.weeklySchedule) {
              loadWeeklySchedule(userData.availability.weeklySchedule);
            }
          }
        } else {
          // Document doesn't exist, handle error
          showAlert('Profile not found. Please contact support.', 'error');
        }
      })
      .catch((error) => {
        hideLoader();
        showAlert('Error loading profile: ' + error.message, 'error');
        console.error("Error loading profile:", error);
      });
  }
  
  // Load services from Firestore
  function loadServices(userId) {
    const servicesContainer = document.getElementById('servicesContainer');
    const loadingServices = document.getElementById('loadingServices');
    
    if (!servicesContainer || !loadingServices) return;
    
    loadingServices.classList.remove('d-none');
    servicesContainer.innerHTML = '';
    
    // Get the current user
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // First get the priest profile to check for custom pricing
    firebase.firestore().collection('priests').doc(user.uid).get()
        .then(doc => {
            if (!doc.exists) {
                showAlert('Priest profile not found', 'danger');
                return;
            }
            
            const priestData = doc.data();
            const servicesPricing = priestData.servicesPricing || {};
            
            // Now get all available services
            return firebase.firestore().collection('services').get()
                .then(snapshot => {
                    loadingServices.classList.add('d-none');
                    
                    if (snapshot.empty) {
                        servicesContainer.innerHTML = `
                            <div class="alert alert-info">No services available. Please check back later.</div>
                        `;
                        return;
                    }
                    
                    // Group services by type
                    const servicesByType = {};
                    
                    snapshot.forEach(doc => {
                        const service = doc.data();
                        service.id = doc.id;
                        
                        if (!servicesByType[service.type]) {
                            servicesByType[service.type] = [];
                        }
                        
                        servicesByType[service.type].push(service);
                    });
                    
                    // Create services HTML
                    let html = `
                        <div class="alert alert-info mb-4">
                            <h5><i class="fas fa-info-circle me-2"></i>Pricing Information</h5>
                            <p class="mb-1">You can set your base price for each service. The final price customers pay includes:</p>
                            <ul class="mb-2">
                                <li>Your base price (100% goes to you)</li>
                                <li>Platform fee (10% of your base price)</li>
                                <li>Payment gateway fee (2% of total amount)</li>
                            </ul>
                            <p class="mb-0">We use the formula: <strong>Final Price = [Base Price × (0.1 + 0.02)] / 0.98</strong> to ensure you receive your full base price after all fees.</p>
                        </div>
                        <div class="row mb-4">
                            <div class="col-md-7">
                                <h5>Price Calculator</h5>
                                <div class="input-group mb-3">
                                    <span class="input-group-text">₹</span>
                                    <input type="number" class="form-control" id="calculatorBasePrice" placeholder="Enter your base price" value="1000">
                                    <button class="btn btn-primary" type="button" id="calculatePriceBtn">Calculate</button>
                                </div>
                                <div id="priceCalculationResult"></div>
                            </div>
                        </div>
                    `;
                    
                    // Add each service type
                    for (const type in servicesByType) {
                        html += `
                            <div class="service-type mb-4">
                                <h5 class="mb-3">${type}</h5>
                                <div class="row row-cols-1 row-cols-md-2 g-4">
                        `;
                        
                        servicesByType[type].forEach(service => {
                            // Check if priest has custom pricing for this service
                            const customPrice = servicesPricing[type] && servicesPricing[type][service.name] 
                                ? servicesPricing[type][service.name] 
                                : service.basePrice || 1500;
                            
                            // Calculate customer price
                            const priceDetails = calculateFinalPrice(customPrice);
                            
                            html += `
                                <div class="col">
                                    <div class="card service-card h-100">
                                        <div class="card-body">
                                            <h5 class="card-title">${service.name}</h5>
                                            <p class="card-text small">${service.description || 'No description available.'}</p>
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <span class="text-muted">Duration:</span>
                                                    <span>${service.duration || '1-2'} hours</span>
                                                </div>
                                                <div>
                                                    <span class="text-muted">Default Price:</span>
                                                    <span>${formatCurrency(service.basePrice || 1500)}</span>
                                                </div>
                                            </div>
                                            <div class="price-setting mb-3">
                                                <div class="input-group">
                                                    <span class="input-group-text">₹</span>
                                                    <input type="number" class="form-control service-price-input" 
                                                        data-service-type="${type}" 
                                                        data-service-name="${service.name}" 
                                                        value="${customPrice}">
                                                    <button class="btn btn-primary save-price-btn" 
                                                        data-service-type="${type}" 
                                                        data-service-name="${service.name}">
                                                        Save
                                                    </button>
                                                </div>
                                                <div class="price-summary mt-2 small">
                                                    <div class="d-flex justify-content-between">
                                                        <span>Your amount:</span>
                                                        <span>${formatCurrency(priceDetails.basePrice)}</span>
                                                    </div>
                                                    <div class="d-flex justify-content-between">
                                                        <span>Customer pays:</span>
                                                        <span>${formatCurrency(priceDetails.totalAmount)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += `
                                </div>
                            </div>
                        `;
                    }
                    
                    servicesContainer.innerHTML = html;
                    
                    // Add event listeners to the save price buttons
                    document.querySelectorAll('.save-price-btn').forEach(button => {
                        button.addEventListener('click', saveServicePrice);
                    });
                    
                    // Add event listener to the price calculator button
                    const calculatePriceBtn = document.getElementById('calculatePriceBtn');
                    if (calculatePriceBtn) {
                        calculatePriceBtn.addEventListener('click', calculatePrice);
                    }
                    
                    // Add event listeners to update price summaries as user types
                    document.querySelectorAll('.service-price-input').forEach(input => {
                        input.addEventListener('input', updatePriceSummary);
                    });
                });
        })
        .catch(error => {
            loadingServices.classList.add('d-none');
            console.error("Error loading services:", error);
            servicesContainer.innerHTML = `
                <div class="alert alert-danger">Error loading services. Please try again later.</div>
            `;
        });
  }
  
  // Save personal info form
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const userId = firebase.auth().currentUser.uid;
      
      // Show spinner
      personalInfoSpinner.classList.remove('d-none');
      savePersonalInfoBtn.disabled = true;
      
      // Get form values
      const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        country: document.getElementById('country').value,
        bio: document.getElementById('bio').value,
        qualification: document.getElementById('qualification').value,
        experience: parseInt(document.getElementById('experience').value) || 0,
        languages: getSelectedLanguages(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Handle profile photo upload if selected
      const profilePhotoInput = document.getElementById('profilePhoto');
      
      if (profilePhotoInput.files.length > 0) {
        // Upload profile photo first, then update user data
        uploadProfilePhoto(userId, profilePhotoInput.files[0], userData);
      } else {
        // Just update user data without changing photo
        updateUserData(userId, userData);
      }
    });
  }
  
  // Upload profile photo to storage
  function uploadProfilePhoto(userId, file, userData) {
    const storageRef = firebase.storage().ref();
    const profilePhotoRef = storageRef.child(`priests/${userId}/profile/profile-photo.${file.name.split('.').pop()}`);
    
    profilePhotoRef.put(file).then(snapshot => {
      return snapshot.ref.getDownloadURL();
    }).then(downloadURL => {
      userData.profilePhotoURL = downloadURL;
      updateUserData(userId, userData);
    }).catch(error => {
      personalInfoSpinner.classList.add('d-none');
      savePersonalInfoBtn.disabled = false;
      showAlert('Error uploading profile photo: ' + error.message, 'error');
      console.error("Error uploading profile photo:", error);
    });
  }
  
  // Update user data in Firestore
  function updateUserData(userId, userData) {
    firebase.firestore().collection('priests').doc(userId).update(userData)
      .then(() => {
        personalInfoSpinner.classList.add('d-none');
        savePersonalInfoBtn.disabled = false;
        
        // Update displayed name and photo
        profileName.textContent = `${userData.firstName} ${userData.lastName}`;
        navUserName.textContent = `${userData.firstName} ${userData.lastName}`;
        profileQualification.textContent = userData.qualification;
        
        if (userData.profilePhotoURL) {
          profileAvatar.src = userData.profilePhotoURL;
          navProfileImage.src = userData.profilePhotoURL;
        }
        
        showAlert('Profile updated successfully!', 'success');
      })
      .catch((error) => {
        personalInfoSpinner.classList.add('d-none');
        savePersonalInfoBtn.disabled = false;
        showAlert('Error updating profile: ' + error.message, 'error');
        console.error("Error updating profile:", error);
      });
  }
  
  // Get selected languages from checkboxes
  function getSelectedLanguages() {
    const languages = [];
    document.querySelectorAll('.language-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
      languages.push(checkbox.value);
    });
    return languages;
  }
  
  // Toggle custom schedule based on availability type
  function toggleCustomSchedule(type) {
    const customScheduleCard = document.getElementById('customScheduleCard');
    if (customScheduleCard) {
      if (type === 'custom') {
        customScheduleCard.classList.remove('d-none');
      } else {
        customScheduleCard.classList.add('d-none');
      }
    }
  }
  
  // Availability type change handler
  const availabilityType = document.getElementById('availabilityType');
  if (availabilityType) {
    availabilityType.addEventListener('change', function() {
      toggleCustomSchedule(this.value);
    });
  }
  
  // Document upload form toggle
  if (addDocumentBtn) {
    addDocumentBtn.addEventListener('click', function() {
      const addDocumentForm = document.getElementById('addDocumentForm');
      addDocumentForm.classList.remove('d-none');
      this.classList.add('d-none');
    });
  }
  
  if (cancelUploadBtn) {
    cancelUploadBtn.addEventListener('click', function() {
      const addDocumentForm = document.getElementById('addDocumentForm');
      addDocumentForm.classList.add('d-none');
      addDocumentBtn.classList.remove('d-none');
    });
  }
  
  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
      }).catch((error) => {
        showAlert('Error signing out: ' + error.message, 'error');
        console.error("Error signing out:", error);
      });
    });
  }
  
  // Helper functions
  function showLoader(message) {
    const loaderEl = document.createElement('div');
    loaderEl.className = 'page-loader';
    loaderEl.innerHTML = `
      <div class="loader-content">
        <div class="spinner-border text-primary" role="status"></div>
        <p>${message || 'Loading...'}</p>
      </div>
    `;
    document.body.appendChild(loaderEl);
  }
  
  function hideLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.remove();
    }
  }
  
  function showAlert(message, type = 'info') {
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertEl.setAttribute('role', 'alert');
    alertEl.style.zIndex = '9999';
    alertEl.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertEl);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      const bootstrapAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
      bootstrapAlert.close();
    }, 5000);
  }

  /**
   * Calculate final customer price using platform's formula
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

  /**
   * Calculate and show price breakdown based on user input
   */
  function calculatePrice() {
    const basePriceInput = document.getElementById('calculatorBasePrice');
    const resultContainer = document.getElementById('priceCalculationResult');
    
    if (!basePriceInput || !resultContainer) return;
    
    const basePrice = parseFloat(basePriceInput.value) || 0;
    if (basePrice <= 0) {
      resultContainer.innerHTML = `
        <div class="alert alert-warning">Please enter a valid price greater than 0.</div>
      `;
      return;
    }
    
    const priceDetails = calculateFinalPrice(basePrice);
    
    resultContainer.innerHTML = `
      <div class="card">
        <div class="card-header bg-primary text-white">
          Price Breakdown
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between">
              <span>Your base price:</span>
              <span>${formatCurrency(priceDetails.basePrice)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Platform fee (10%):</span>
              <span>${formatCurrency(priceDetails.platformFee)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Payment gateway fee (2%):</span>
              <span>${formatCurrency(priceDetails.paymentGatewayFee)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between fw-bold">
              <span>Customer pays:</span>
              <span>${formatCurrency(priceDetails.totalAmount)}</span>
            </li>
          </ul>
          <div class="mt-3 small text-muted">
            <p class="mb-0">After all fees, you will receive ${formatCurrency(priceDetails.priestAmount)}.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update price summary as user types in price input
   */
  function updatePriceSummary(event) {
    const input = event.target;
    const basePrice = parseFloat(input.value) || 0;
    const summaryContainer = input.closest('.price-setting').querySelector('.price-summary');
    
    if (!summaryContainer) return;
    
    if (basePrice <= 0) {
      summaryContainer.innerHTML = `
        <div class="text-danger small">Please enter a valid price.</div>
      `;
      return;
    }
    
    const priceDetails = calculateFinalPrice(basePrice);
    
    summaryContainer.innerHTML = `
      <div class="d-flex justify-content-between">
        <span>Your amount:</span>
        <span>${formatCurrency(priceDetails.basePrice)}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span>Customer pays:</span>
        <span>${formatCurrency(priceDetails.totalAmount)}</span>
      </div>
    `;
  }

  /**
   * Save custom price for a service
   */
  function saveServicePrice(event) {
    const button = event.target;
    const serviceType = button.dataset.serviceType;
    const serviceName = button.dataset.serviceName;
    
    // Find the input field
    const inputSelector = `.service-price-input[data-service-type="${serviceType}"][data-service-name="${serviceName}"]`;
    const priceInput = document.querySelector(inputSelector);
    
    if (!priceInput) return;
    
    const price = parseFloat(priceInput.value);
    if (isNaN(price) || price <= 0) {
      showAlert('Please enter a valid price.', 'warning');
      return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
      showAlert('You must be signed in to save prices.', 'warning');
      return;
    }
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    // Get the current priest data first
    firebase.firestore().collection('priests').doc(user.uid).get()
      .then(doc => {
        if (!doc.exists) {
          throw new Error('Priest profile not found');
        }
        
        const priestData = doc.data();
        
        // Initialize servicesPricing if it doesn't exist
        if (!priestData.servicesPricing) {
          priestData.servicesPricing = {};
        }
        
        // Initialize service type if it doesn't exist
        if (!priestData.servicesPricing[serviceType]) {
          priestData.servicesPricing[serviceType] = {};
        }
        
        // Set the price
        priestData.servicesPricing[serviceType][serviceName] = price;
        
        // Update the priest document
        return firebase.firestore().collection('priests').doc(user.uid).update({
          servicesPricing: priestData.servicesPricing,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        // Reset button state
        button.disabled = false;
        button.textContent = 'Save';
        
        // Show success message
        showAlert('Price updated successfully!', 'success');
        
        // Update price summary
        updatePriceSummary({ target: priceInput });
      })
      .catch(error => {
        // Reset button state
        button.disabled = false;
        button.textContent = 'Save';
        
        console.error("Error saving price:", error);
        showAlert('Error saving price. Please try again.', 'danger');
      });
  }
}); 