// Registration form handling
document.addEventListener('DOMContentLoaded', function() {
  // Registration form elements
  const registrationForm = document.getElementById('registrationForm');
  const registrationAlert = document.getElementById('registration-alert');
  
  // Step navigation
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');
  
  const step1Indicator = document.getElementById('step1-indicator');
  const step2Indicator = document.getElementById('step2-indicator');
  const step3Indicator = document.getElementById('step3-indicator');
  const step4Indicator = document.getElementById('step4-indicator');
  
  const step1Next = document.getElementById('step1Next');
  const step2Prev = document.getElementById('step2Prev');
  const step2Next = document.getElementById('step2Next');
  const step3Prev = document.getElementById('step3Prev');
  const step3Next = document.getElementById('step3Next');
  const step4Prev = document.getElementById('step4Prev');
  const registerBtn = document.getElementById('registerBtn');
  const registerSpinner = document.getElementById('registerSpinner');
  
  // Step navigation functions
  if (step1Next) {
    step1Next.addEventListener('click', function() {
      // Validate step 1
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const password = document.getElementById('password');
      const confirmPassword = document.getElementById('confirmPassword');
      
      // Reset validation messages
      email.classList.remove('is-invalid');
      phone.classList.remove('is-invalid');
      password.classList.remove('is-invalid');
      confirmPassword.classList.remove('is-invalid');
      
      let isValid = true;
      
      // Email validation
      if (!email.value || !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        email.classList.add('is-invalid');
        isValid = false;
      }
      
      // Phone validation
      if (!phone.value || !phone.value.match(/^[0-9]{10}$/)) {
        phone.classList.add('is-invalid');
        isValid = false;
      }
      
      // Password validation
      if (!password.value || password.value.length < 8) {
        password.classList.add('is-invalid');
        isValid = false;
      }
      
      // Confirm password validation
      if (password.value !== confirmPassword.value) {
        confirmPassword.classList.add('is-invalid');
        isValid = false;
      }
      
      if (isValid) {
        step1.classList.add('d-none');
        step2.classList.remove('d-none');
        step1Indicator.classList.remove('active');
        step1Indicator.classList.add('complete');
        step2Indicator.classList.add('active');
      }
    });
  }
  
  if (step2Prev) {
    step2Prev.addEventListener('click', function() {
      step2.classList.add('d-none');
      step1.classList.remove('d-none');
      step2Indicator.classList.remove('active');
      step1Indicator.classList.remove('complete');
      step1Indicator.classList.add('active');
    });
  }
  
  if (step2Next) {
    step2Next.addEventListener('click', function() {
      // Validate step 2
      const firstName = document.getElementById('firstName');
      const lastName = document.getElementById('lastName');
      const dob = document.getElementById('dob');
      const gender = document.getElementById('gender');
      const address = document.getElementById('address');
      const city = document.getElementById('city');
      const state = document.getElementById('state');
      const country = document.getElementById('country');
      
      // Reset validation messages
      firstName.classList.remove('is-invalid');
      lastName.classList.remove('is-invalid');
      dob.classList.remove('is-invalid');
      gender.classList.remove('is-invalid');
      address.classList.remove('is-invalid');
      city.classList.remove('is-invalid');
      state.classList.remove('is-invalid');
      country.classList.remove('is-invalid');
      
      let isValid = true;
      
      // Basic validation
      if (!firstName.value) {
        firstName.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!lastName.value) {
        lastName.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!dob.value) {
        dob.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!gender.value) {
        gender.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!address.value) {
        address.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!city.value) {
        city.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!state.value) {
        state.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!country.value) {
        country.classList.add('is-invalid');
        isValid = false;
      }
      
      if (isValid) {
        step2.classList.add('d-none');
        step3.classList.remove('d-none');
        step2Indicator.classList.remove('active');
        step2Indicator.classList.add('complete');
        step3Indicator.classList.add('active');
      }
    });
  }
  
  if (step3Prev) {
    step3Prev.addEventListener('click', function() {
      step3.classList.add('d-none');
      step2.classList.remove('d-none');
      step3Indicator.classList.remove('active');
      step2Indicator.classList.remove('complete');
      step2Indicator.classList.add('active');
    });
  }
  
  if (step3Next) {
    step3Next.addEventListener('click', function() {
      // Validate step 3
      const qualification = document.getElementById('qualification');
      const experience = document.getElementById('experience');
      const bio = document.getElementById('bio');
      const availability = document.getElementById('availability');
      const travelDistance = document.getElementById('travelDistance');
      
      // Language checkboxes
      const languageCheckboxes = document.querySelectorAll('input[id^="lang"]');
      
      // Specialization checkboxes
      const specializationCheckboxes = document.querySelectorAll('input[id^="spec"]');
      
      // Reset validation messages
      qualification.classList.remove('is-invalid');
      experience.classList.remove('is-invalid');
      bio.classList.remove('is-invalid');
      availability.classList.remove('is-invalid');
      travelDistance.classList.remove('is-invalid');
      
      let isValid = true;
      
      // Basic validation
      if (!qualification.value) {
        qualification.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!experience.value) {
        experience.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!bio.value) {
        bio.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!availability.value) {
        availability.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!travelDistance.value) {
        travelDistance.classList.add('is-invalid');
        isValid = false;
      }
      
      // Check if at least one language is selected
      let languageSelected = false;
      languageCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          languageSelected = true;
        }
      });
      
      if (!languageSelected) {
        document.querySelector('.language-checkboxes').nextElementSibling.style.display = 'block';
        isValid = false;
      } else {
        document.querySelector('.language-checkboxes').nextElementSibling.style.display = 'none';
      }
      
      // Check if at least one specialization is selected
      let specializationSelected = false;
      specializationCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          specializationSelected = true;
        }
      });
      
      if (!specializationSelected) {
        document.querySelector('.specialization-checkboxes').nextElementSibling.style.display = 'block';
        isValid = false;
      } else {
        document.querySelector('.specialization-checkboxes').nextElementSibling.style.display = 'none';
      }
      
      if (isValid) {
        step3.classList.add('d-none');
        step4.classList.remove('d-none');
        step3Indicator.classList.remove('active');
        step3Indicator.classList.add('complete');
        step4Indicator.classList.add('active');
      }
    });
  }
  
  if (step4Prev) {
    step4Prev.addEventListener('click', function() {
      step4.classList.add('d-none');
      step3.classList.remove('d-none');
      step4Indicator.classList.remove('active');
      step3Indicator.classList.remove('complete');
      step3Indicator.classList.add('active');
    });
  }
  
  // Handle form submission
  if (registrationForm) {
    registrationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validate final step
      const profilePhoto = document.getElementById('profilePhoto');
      const idProof = document.getElementById('idProof');
      const qualificationProof = document.getElementById('qualificationProof');
      const termsCheckbox = document.getElementById('termsCheckbox');
      
      // Reset validation messages
      profilePhoto.classList.remove('is-invalid');
      idProof.classList.remove('is-invalid');
      qualificationProof.classList.remove('is-invalid');
      termsCheckbox.classList.remove('is-invalid');
      
      let isValid = true;
      
      // Basic validation
      if (!profilePhoto.files || profilePhoto.files.length === 0) {
        profilePhoto.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!idProof.files || idProof.files.length === 0) {
        idProof.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!qualificationProof.files || qualificationProof.files.length === 0) {
        qualificationProof.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!termsCheckbox.checked) {
        termsCheckbox.classList.add('is-invalid');
        isValid = false;
      }
      
      if (!isValid) {
        return;
      }
      
      // Disable submit button and show spinner
      registerBtn.disabled = true;
      registerSpinner.classList.remove('d-none');
      
      // Clear previous alert messages
      if (registrationAlert) {
        registrationAlert.classList.add('d-none');
      }
      
      try {
        // Generate a unique registration ID
        const registrationId = Math.floor(100000 + Math.random() * 900000); // 6-digit number
        
        // Format registration date for email
        const registrationDate = new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Gather form data directly
        const email = document.getElementById('email').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const fullName = `${firstName} ${lastName}`;
        const phone = document.getElementById('phone').value;
        const dob = document.getElementById('dob').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const country = document.getElementById('country').value;
        const gender = document.getElementById('gender').value;
        
        // Get selected languages
        const languageCheckboxes = document.querySelectorAll('input[id^="lang"]');
        const languages = [];
        languageCheckboxes.forEach(checkbox => {
          if (checkbox.checked) {
            languages.push(checkbox.value);
          }
        });
        
        // Get selected specializations
        const specializationCheckboxes = document.querySelectorAll('input[id^="spec"]');
        const specializations = [];
        specializationCheckboxes.forEach(checkbox => {
          if (checkbox.checked) {
            specializations.push(checkbox.value);
          }
        });
        
        const qualification = document.getElementById('qualification').value;
        const experience = document.getElementById('experience').value;
        const bio = document.getElementById('bio').value;
        const availability = document.getElementById('availability').value;
        const travelDistance = document.getElementById('travelDistance').value;
        
        // Prepare email template parameters
        const templateParams = {
          registration_date: registrationDate,
          full_name: fullName,
          from_email: email,
          phone: phone,
          dob: dob,
          address: address,
          city_state: `${city}, ${state}`,
          country: country,
          experience: experience,
          qualification: qualification,
          languages: languages.join(', '),
          specializations: specializations.join(', '),
          availability: availability,
          travel_distance: travelDistance,
          bio: bio,
          registration_id: registrationId,
          email: email,
          name: fullName
        };
        
        console.log("Sending registration notification email...");
        
        // Send the email directly using EmailJS
        await emailjs.send("service_s96mtoa", "template_5shmzra", templateParams)
          .then(function(response) {
            console.log("Email sent successfully:", response);
          }, function(error) {
            console.error("Email sending failed:", error);
            throw new Error("Failed to send registration notification. Please try again.");
          });
        
        // Registration successful
        console.log("Registration process completed successfully!");
        
        // Hide the register modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();
        
        // Show success modal
        const successModal = new bootstrap.Modal(document.getElementById('registerSuccessModal'));
        successModal.show();
        
        // Reset form
        registrationForm.reset();
        
      } catch (error) {
        console.error('Registration error:', error);
        
        // Show error message
        if (registrationAlert) {
          registrationAlert.classList.remove('d-none');
          registrationAlert.classList.remove('alert-info');
          registrationAlert.classList.add('alert-danger');
          registrationAlert.textContent = `Registration failed: ${error.message}`;
        } else {
          showAlert(`Registration failed: ${error.message}`, 'danger');
        }
      } finally {
        // Enable submit button and hide spinner
        registerBtn.disabled = false;
        registerSpinner.classList.add('d-none');
      }
    });
  }
});

// Helper function to generate a random token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to show alerts
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.querySelector('.container').prepend(alertDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
} 