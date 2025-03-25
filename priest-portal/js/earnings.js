document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase from firebase-config.js
  
  // DOM Elements - Balances
  const availableBalance = document.getElementById('availableBalance');
  const pendingBalance = document.getElementById('pendingBalance');
  const totalEarnings = document.getElementById('totalEarnings');
  const totalWithdrawn = document.getElementById('totalWithdrawn');
  const modalAvailableBalance = document.getElementById('modalAvailableBalance');
  
  // DOM Elements - Chart
  const earningsChart = document.getElementById('earningsChart');
  const periodButtons = document.querySelectorAll('.btn-group .btn[data-period]');
  
  // DOM Elements - Transactions
  const transactionsTable = document.getElementById('transactionsTable');
  const transactionSearch = document.getElementById('transactionSearch');
  const clearTransactionSearch = document.getElementById('clearTransactionSearch');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const currentPage = document.getElementById('currentPage');
  const totalPages = document.getElementById('totalPages');
  const totalTransactions = document.getElementById('totalTransactions');
  
  // DOM Elements - Payment Methods
  const paymentMethodsTable = document.getElementById('paymentMethodsTable');
  const paymentType = document.getElementById('paymentType');
  const bankFields = document.getElementById('bankFields');
  const upiFields = document.getElementById('upiFields');
  
  // DOM Elements - Forms and Buttons
  const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
  const withdrawSpinner = document.getElementById('withdrawSpinner');
  const withdrawAmount = document.getElementById('withdrawAmount');
  const savePaymentMethodBtn = document.getElementById('savePaymentMethodBtn');
  const paymentMethodSpinner = document.getElementById('paymentMethodSpinner');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Chart instance
  let myChart = null;
  
  // Current data
  let userData = null;
  let transactions = [];
  let currentPeriod = 'month';
  
  // Pagination
  let pageSize = 10;
  let currentPageNum = 1;
  let filteredTransactions = [];
  
  // Check authentication state
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in, load data
      loadUserData(user.uid);
      loadTransactions(user.uid);
      loadPaymentMethods(user.uid);
      
      // Set up header user info
      updateUserInfo(user.uid);
    } else {
      // No user is signed in, redirect to login
      window.location.href = 'login.html';
    }
  });
  
  // Load and display user data
  function loadUserData(userId) {
    showLoader('Loading earnings data...');
    
    firebase.firestore().collection('priests').doc(userId).get()
      .then((doc) => {
        if (doc.exists) {
          userData = doc.data();
          
          // Update balance displays
          const availableBalanceValue = userData.earnings?.availableBalance || 0;
          const pendingBalanceValue = userData.earnings?.pendingBalance || 0;
          const totalEarningsValue = userData.earnings?.totalEarnings || 0;
          const totalWithdrawnValue = userData.earnings?.totalWithdrawn || 0;
          
          availableBalance.textContent = formatCurrency(availableBalanceValue);
          pendingBalance.textContent = formatCurrency(pendingBalanceValue);
          totalEarnings.textContent = formatCurrency(totalEarningsValue);
          totalWithdrawn.textContent = formatCurrency(totalWithdrawnValue);
          
          if (modalAvailableBalance) {
            modalAvailableBalance.textContent = formatCurrency(availableBalanceValue);
          }
          
          if (withdrawAmount) {
            withdrawAmount.max = availableBalanceValue;
          }
          
          // Load earnings chart
          loadEarningsChart(userId, currentPeriod);
        } else {
          showAlert('User data not found. Please contact support.', 'error');
        }
        
        hideLoader();
      })
      .catch((error) => {
        hideLoader();
        showAlert('Error loading user data: ' + error.message, 'error');
        console.error("Error loading user data:", error);
      });
  }
  
  // Load and display transactions
  function loadTransactions(userId) {
    const tableBody = document.getElementById('transactionsTableBody');
    const loadingElement = document.getElementById('loadingTransactions');
    
    if (loadingElement) loadingElement.classList.remove('d-none');
    if (tableBody) tableBody.innerHTML = '';
    
    // Combine booking transactions and withdrawal transactions
    Promise.all([
      // Get booking transactions
      firebase.firestore().collection('bookings')
        .where('priestId', '==', userId)
        .where('status', '==', 'completed')
        .orderBy('updatedAt', 'desc')
        .limit(50)
        .get(),
      
      // Get withdrawal transactions
      firebase.firestore().collection('withdrawals')
        .where('priestId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get()
    ])
    .then(([bookingsSnapshot, withdrawalsSnapshot]) => {
      const transactions = [];
      
      // Process booking transactions
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        booking.id = doc.id;
        
        // Calculate priest's earnings using our helper function
        const priestEarnings = getPriestEarnings(booking);
        
        transactions.push({
          id: doc.id,
          type: 'booking',
          description: `Payment for ${booking.serviceName}`,
          amount: priestEarnings,
          date: booking.updatedAt || booking.createdAt,
          status: booking.paidToPriest ? 'Paid' : 'Pending',
          reference: `Order #${doc.id.substring(0, 8)}`,
          details: booking
        });
      });
      
      // Process withdrawal transactions
      withdrawalsSnapshot.forEach(doc => {
        const withdrawal = doc.data();
        withdrawal.id = doc.id;
        
        transactions.push({
          id: doc.id,
          type: 'withdrawal',
          description: `Withdrawal to ${withdrawal.paymentMethod || 'bank account'}`,
          amount: withdrawal.amount || 0,
          date: withdrawal.timestamp || withdrawal.createdAt,
          status: withdrawal.status || 'Pending',
          reference: `WTH${doc.id.substring(0, 8)}`,
          details: withdrawal
        });
      });
      
      // Sort transactions by date (most recent first)
      transactions.sort((a, b) => {
        const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date();
        const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date();
        return dateB - dateA;
      });
      
      // Update the transactions table
      if (loadingElement) loadingElement.classList.add('d-none');
      updateTransactionsTable(transactions);
    })
    .catch(error => {
      console.error("Error loading transactions:", error);
      if (loadingElement) loadingElement.classList.add('d-none');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-4">
              <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error loading transactions. Please try again later.
              </div>
            </td>
          </tr>
        `;
      }
    });
  }
  
  // Load and display payment methods
  function loadPaymentMethods(userId) {
    firebase.firestore().collection('priests').doc(userId).collection('paymentMethods')
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          paymentMethodsTable.innerHTML = '<tr><td colspan="5" class="text-center">No payment methods found. Add a payment method to request withdrawals.</td></tr>';
          return;
        }
        
        let paymentMethodsHTML = '';
        let paymentMethodSelectHTML = '<option value="">Select payment method</option>';
        
        querySnapshot.forEach((doc) => {
          const method = doc.data();
          let icon, details, selectText;
          
          if (method.type === 'bank') {
            icon = '<i class="fas fa-university me-2"></i> Bank Account';
            details = `${method.bankName} ****${method.accountNumber.slice(-4)}`;
            selectText = `${method.bankName} ****${method.accountNumber.slice(-4)}`;
          } else if (method.type === 'upi') {
            icon = '<i class="fas fa-wallet me-2"></i> UPI';
            details = method.upiId;
            selectText = `UPI: ${method.upiId}`;
          }
          
          paymentMethodsHTML += `
            <tr>
              <td>${icon}</td>
              <td>${details}</td>
              <td><span class="badge bg-${method.verified ? 'success' : 'warning'}">${method.verified ? 'Verified' : 'Pending'}</span></td>
              <td><i class="fas fa-${method.isDefault ? 'check' : 'times'}-circle ${method.isDefault ? 'text-success' : 'text-muted'}"></i></td>
              <td>
                <button type="button" class="btn btn-sm btn-outline-primary me-1 edit-payment" data-id="${doc.id}">
                  <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger delete-payment" data-id="${doc.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
          
          paymentMethodSelectHTML += `<option value="${doc.id}">${selectText}</option>`;
        });
        
        paymentMethodsTable.innerHTML = paymentMethodsHTML;
        
        // Set payment method select options
        const paymentMethodSelect = document.getElementById('paymentMethodSelect');
        if (paymentMethodSelect) {
          paymentMethodSelect.innerHTML = paymentMethodSelectHTML;
        }
        
        // Add event listeners for payment method buttons
        document.querySelectorAll('.edit-payment').forEach(button => {
          button.addEventListener('click', function() {
            editPaymentMethod(this.getAttribute('data-id'));
          });
        });
        
        document.querySelectorAll('.delete-payment').forEach(button => {
          button.addEventListener('click', function() {
            deletePaymentMethod(this.getAttribute('data-id'));
          });
        });
      })
      .catch((error) => {
        showAlert('Error loading payment methods: ' + error.message, 'error');
        console.error("Error loading payment methods:", error);
      });
  }
  
  // Update user info in header
  function updateUserInfo(userId) {
    firebase.firestore().collection('priests').doc(userId).get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          
          // Update navbar user info
          const navUserName = document.getElementById('navUserName');
          const navProfileImage = document.getElementById('navProfileImage');
          
          if (navUserName) {
            navUserName.textContent = `${data.firstName} ${data.lastName}`;
          }
          
          if (navProfileImage && data.profilePhotoURL) {
            navProfileImage.src = data.profilePhotoURL;
          }
          
          // Update notification count
          updateNotificationCount(userId);
        }
      })
      .catch((error) => {
        console.error("Error updating user info:", error);
      });
  }
  
  // Update notification count
  function updateNotificationCount(userId) {
    const notificationCount = document.getElementById('notification-count');
    if (!notificationCount) return;
    
    firebase.firestore().collection('priests').doc(userId).collection('notifications')
      .where('read', '==', false)
      .get()
      .then((querySnapshot) => {
        notificationCount.textContent = querySnapshot.size;
        notificationCount.style.display = querySnapshot.size > 0 ? 'flex' : 'none';
      })
      .catch((error) => {
        console.error("Error getting notifications:", error);
      });
  }
  
  // Load and render earnings chart
  function loadEarningsChart(userId, period) {
    if (!earningsChart) return;
    
    let queryPeriod, format, label;
    
    switch(period) {
      case 'week':
        queryPeriod = 7;
        format = 'ddd';
        label = 'Last 7 Days';
        break;
      case 'year':
        queryPeriod = 12;
        format = 'MMM';
        label = 'Last 12 Months';
        break;
      case 'month':
      default:
        queryPeriod = 30;
        format = 'D MMM';
        label = 'Last 30 Days';
        break;
    }
    
    // Get start date for query
    const startDate = new Date();
    if (period === 'year') {
      startDate.setMonth(startDate.getMonth() - queryPeriod + 1);
      startDate.setDate(1);
    } else {
      startDate.setDate(startDate.getDate() - queryPeriod + 1);
    }
    startDate.setHours(0, 0, 0, 0);
    
    firebase.firestore().collection('priests').doc(userId).collection('transactions')
      .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
      .where('type', '==', 'earning')
      .orderBy('timestamp', 'asc')
      .get()
      .then((querySnapshot) => {
        let chartData = {};
        
        // Initialize all dates in the period with zero values
        if (period === 'year') {
          for (let i = 0; i < queryPeriod; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - queryPeriod + i + 1);
            date.setDate(1);
            const formattedDate = formatDate(date, format);
            chartData[formattedDate] = 0;
          }
        } else {
          for (let i = 0; i < queryPeriod; i++) {
            const date = new Date();
            date.setDate(date.getDate() - queryPeriod + i + 1);
            const formattedDate = formatDate(date, format);
            chartData[formattedDate] = 0;
          }
        }
        
        // Fill in actual values
        querySnapshot.forEach((doc) => {
          const transaction = doc.data();
          const date = transaction.timestamp.toDate();
          const formattedDate = formatDate(date, format);
          
          if (chartData[formattedDate] !== undefined) {
            chartData[formattedDate] += transaction.amount;
          }
        });
        
        // Convert to arrays for Chart.js
        const labels = Object.keys(chartData);
        const data = Object.values(chartData);
        
        // Create or update chart
        createOrUpdateChart(labels, data, label);
      })
      .catch((error) => {
        showAlert('Error loading earnings data: ' + error.message, 'error');
        console.error("Error loading earnings data:", error);
      });
  }
  
  // Create or update the chart
  function createOrUpdateChart(labels, data, label) {
    const ctx = earningsChart.getContext('2d');
    
    // Destroy previous chart if it exists
    if (myChart) {
      myChart.destroy();
    }
    
    // Create new chart
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          backgroundColor: 'rgba(13, 110, 253, 0.5)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return '₹' + context.formattedValue;
              }
            }
          }
        }
      }
    });
  }
  
  // Update transactions table with filtered/paginated results
  function updateTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactionsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (transactions.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <div class="empty-state">
              <i class="fas fa-receipt text-muted mb-3" style="font-size: 2.5rem;"></i>
              <p>No transactions found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    transactions.forEach(transaction => {
      const row = document.createElement('tr');
      
      // Determine transaction type icon and color
      let typeIcon = 'fa-question';
      let typeClass = 'text-secondary';
      
      switch (transaction.type) {
        case 'booking':
          typeIcon = 'fa-calendar-check';
          typeClass = 'text-primary';
          break;
        case 'withdrawal':
          typeIcon = 'fa-money-bill-wave';
          typeClass = 'text-danger';
          break;
        case 'refund':
          typeIcon = 'fa-undo-alt';
          typeClass = 'text-warning';
          break;
        case 'adjustment':
          typeIcon = 'fa-balance-scale';
          typeClass = 'text-info';
          break;
      }
      
      // Format date
      const date = transaction.date ? 
        (transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date)) : 
        new Date();
      
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Format amount with plus/minus sign
      const isNegative = ['withdrawal', 'refund'].includes(transaction.type);
      const formattedAmount = `${isNegative ? '-' : '+'} ${formatCurrency(transaction.amount)}`;
      const amountClass = isNegative ? 'text-danger' : 'text-success';
      
      row.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <div class="transaction-icon me-2 ${typeClass}">
              <i class="fas ${typeIcon}"></i>
            </div>
            <div>
              <div>${transaction.description}</div>
              <div class="small text-muted">${transaction.reference}</div>
            </div>
          </div>
        </td>
        <td>${formattedDate}</td>
        <td>
          <span class="${amountClass}">${formattedAmount}</span>
        </td>
        <td>
          <span class="badge ${getStatusBadgeClass(transaction.status)}">${transaction.status}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-secondary view-transaction-btn" data-id="${transaction.id}" data-type="${transaction.type}">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to view transaction buttons
    document.querySelectorAll('.view-transaction-btn').forEach(button => {
      button.addEventListener('click', function() {
        const transactionId = this.getAttribute('data-id');
        const transactionType = this.getAttribute('data-type');
        viewTransactionDetails(transactionId, transactionType);
      });
    });
  }
  
  // Filter transactions based on search query
  function filterTransactions(query) {
    if (!query || query.trim() === '') {
      filteredTransactions = [...transactions];
    } else {
      query = query.toLowerCase().trim();
      filteredTransactions = transactions.filter(transaction => {
        return (
          (transaction.description && transaction.description.toLowerCase().includes(query)) ||
          (transaction.status && transaction.status.toLowerCase().includes(query)) ||
          (transaction.type && transaction.type.toLowerCase().includes(query)) ||
          (transaction.id && transaction.id.toLowerCase().includes(query))
        );
      });
    }
    
    // Reset to first page and update table
    currentPageNum = 1;
    updateTransactionsTable();
  }
  
  // Event Listeners
  
  // Payment type change
  if (paymentType) {
    paymentType.addEventListener('change', function() {
      if (this.value === 'bank') {
        bankFields.classList.remove('d-none');
        upiFields.classList.add('d-none');
      } else if (this.value === 'upi') {
        bankFields.classList.add('d-none');
        upiFields.classList.remove('d-none');
      } else {
        bankFields.classList.add('d-none');
        upiFields.classList.add('d-none');
      }
    });
  }
  
  // Period change for chart
  if (periodButtons) {
    periodButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active button
        periodButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Update chart
        currentPeriod = this.getAttribute('data-period');
        loadEarningsChart(firebase.auth().currentUser.uid, currentPeriod);
      });
    });
  }
  
  // Transaction search
  if (transactionSearch) {
    transactionSearch.addEventListener('input', function() {
      filterTransactions(this.value);
    });
  }
  
  // Clear search
  if (clearTransactionSearch) {
    clearTransactionSearch.addEventListener('click', function() {
      transactionSearch.value = '';
      filterTransactions('');
    });
  }
  
  // Pagination
  if (prevPage) {
    prevPage.addEventListener('click', function() {
      if (currentPageNum > 1) {
        currentPageNum--;
        updateTransactionsTable();
      }
    });
  }
  
  if (nextPage) {
    nextPage.addEventListener('click', function() {
      const totalPagesNum = Math.ceil(filteredTransactions.length / pageSize);
      if (currentPageNum < totalPagesNum) {
        currentPageNum++;
        updateTransactionsTable();
      }
    });
  }
  
  // Withdraw confirmation
  if (confirmWithdrawBtn) {
    confirmWithdrawBtn.addEventListener('click', function() {
      const amount = parseFloat(withdrawAmount.value);
      const methodId = document.getElementById('paymentMethodSelect').value;
      const notes = document.getElementById('withdrawNotes').value;
      const userId = firebase.auth().currentUser.uid;
      
      if (!amount || amount <= 0) {
        showAlert('Please enter a valid amount', 'warning');
        return;
      }
      
      if (!methodId) {
        showAlert('Please select a payment method', 'warning');
        return;
      }
      
      // Check if amount is greater than available balance
      if (amount > userData.earnings?.availableBalance) {
        showAlert('Withdrawal amount cannot exceed available balance', 'warning');
        return;
      }
      
      // Show spinner, disable button
      withdrawSpinner.classList.remove('d-none');
      confirmWithdrawBtn.disabled = true;
      
      // Get payment method details
      firebase.firestore().collection('priests').doc(userId).collection('paymentMethods').doc(methodId).get()
        .then((doc) => {
          if (!doc.exists) {
            throw new Error('Payment method not found');
          }
          
          const paymentMethod = doc.data();
          let methodDetails;
          
          if (paymentMethod.type === 'bank') {
            methodDetails = `${paymentMethod.bankName} ****${paymentMethod.accountNumber.slice(-4)}`;
          } else if (paymentMethod.type === 'upi') {
            methodDetails = `UPI: ${paymentMethod.upiId}`;
          }
          
          // Create withdrawal transaction
          const withdrawal = {
            type: 'withdrawal',
            amount: amount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            description: `Withdrawal to ${methodDetails}`,
            status: 'pending',
            paymentMethod: {
              id: methodId,
              type: paymentMethod.type,
              details: methodDetails
            },
            notes: notes || ''
          };
          
          // Add transaction
          return firebase.firestore().collection('priests').doc(userId).collection('transactions').add(withdrawal);
        })
        .then((docRef) => {
          // Update balance
          return firebase.firestore().collection('priests').doc(userId).update({
            'earnings.availableBalance': firebase.firestore.FieldValue.increment(-amount),
            'earnings.totalWithdrawn': firebase.firestore.FieldValue.increment(amount)
          });
        })
        .then(() => {
          // Hide modal, reload data
          const withdrawModal = document.getElementById('withdrawModal');
          const modal = bootstrap.Modal.getInstance(withdrawModal);
          modal.hide();
          
          // Show success message
          showAlert('Withdrawal request submitted successfully', 'success');
          
          // Reload data
          loadUserData(userId);
          loadTransactions(userId);
          
          // Reset form
          document.getElementById('withdrawForm').reset();
        })
        .catch((error) => {
          showAlert('Error requesting withdrawal: ' + error.message, 'error');
          console.error("Error requesting withdrawal:", error);
        })
        .finally(() => {
          // Hide spinner, enable button
          withdrawSpinner.classList.add('d-none');
          confirmWithdrawBtn.disabled = false;
        });
    });
  }
  
  // Save payment method
  if (savePaymentMethodBtn) {
    savePaymentMethodBtn.addEventListener('click', function() {
      const type = paymentType.value;
      const userId = firebase.auth().currentUser.uid;
      const isDefault = document.getElementById('defaultPaymentMethod').checked;
      
      if (!type) {
        showAlert('Please select a payment type', 'warning');
        return;
      }
      
      let paymentData = {
        type: type,
        isDefault: isDefault,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        verified: false // Will be verified by admin
      };
      
      // Add type-specific fields
      if (type === 'bank') {
        paymentData.bankName = document.getElementById('bankName').value;
        paymentData.accountName = document.getElementById('accountName').value;
        paymentData.accountNumber = document.getElementById('accountNumber').value;
        paymentData.ifscCode = document.getElementById('ifscCode').value;
        paymentData.accountType = document.getElementById('accountType').value;
        
        if (!paymentData.bankName || !paymentData.accountName || !paymentData.accountNumber || !paymentData.ifscCode) {
          showAlert('Please fill all the bank account fields', 'warning');
          return;
        }
      } else if (type === 'upi') {
        paymentData.upiId = document.getElementById('upiId').value;
        
        if (!paymentData.upiId) {
          showAlert('Please enter UPI ID', 'warning');
          return;
        }
      }
      
      // Show spinner, disable button
      paymentMethodSpinner.classList.remove('d-none');
      savePaymentMethodBtn.disabled = true;
      
      // If this is set as default, need to unset any existing default
      const batch = firebase.firestore().batch();
      const paymentMethodsRef = firebase.firestore().collection('priests').doc(userId).collection('paymentMethods');
      
      if (isDefault) {
        paymentMethodsRef.where('isDefault', '==', true).get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              batch.update(doc.ref, { isDefault: false });
            });
            
            // Add new payment method
            return paymentMethodsRef.add(paymentData);
          })
          .then((docRef) => {
            // Commit batch if needed
            if (batch._mutations.length > 0) {
              return batch.commit().then(() => docRef);
            }
            return docRef;
          })
          .then(() => {
            // Hide modal, reload data
            const addPaymentMethodModal = document.getElementById('addPaymentMethodModal');
            const modal = bootstrap.Modal.getInstance(addPaymentMethodModal);
            modal.hide();
            
            // Show success message
            showAlert('Payment method added successfully', 'success');
            
            // Reload payment methods
            loadPaymentMethods(userId);
            
            // Reset form
            document.getElementById('paymentMethodForm').reset();
            bankFields.classList.add('d-none');
            upiFields.classList.add('d-none');
          })
          .catch((error) => {
            showAlert('Error adding payment method: ' + error.message, 'error');
            console.error("Error adding payment method:", error);
          })
          .finally(() => {
            // Hide spinner, enable button
            paymentMethodSpinner.classList.add('d-none');
            savePaymentMethodBtn.disabled = false;
          });
      } else {
        // Just add payment method without batch for default
        paymentMethodsRef.add(paymentData)
          .then(() => {
            // Hide modal, reload data
            const addPaymentMethodModal = document.getElementById('addPaymentMethodModal');
            const modal = bootstrap.Modal.getInstance(addPaymentMethodModal);
            modal.hide();
            
            // Show success message
            showAlert('Payment method added successfully', 'success');
            
            // Reload payment methods
            loadPaymentMethods(userId);
            
            // Reset form
            document.getElementById('paymentMethodForm').reset();
            bankFields.classList.add('d-none');
            upiFields.classList.add('d-none');
          })
          .catch((error) => {
            showAlert('Error adding payment method: ' + error.message, 'error');
            console.error("Error adding payment method:", error);
          })
          .finally(() => {
            // Hide spinner, enable button
            paymentMethodSpinner.classList.add('d-none');
            savePaymentMethodBtn.disabled = false;
          });
      }
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
  
  // Helper Functions
  
  // Format currency
  function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  // Format date
  function formatDate(date, format) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (format === 'D MMM YYYY') {
      return `${day} ${months[month]} ${year}`;
    } else if (format === 'D MMM') {
      return `${day} ${months[month]}`;
    } else if (format === 'MMM') {
      return months[month];
    } else if (format === 'ddd') {
      return days[dayOfWeek];
    }
    
    return `${day} ${months[month]} ${year}`;
  }
  
  // Get status class for badges
  function getStatusClass(status) {
    switch(status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      default:
        return 'info';
    }
  }
  
  // Capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  // Show loader
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
  
  // Hide loader
  function hideLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.remove();
    }
  }
  
  // Show alert
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
   * Get priest's earnings from a booking
   * @param {Object} booking - The booking object
   * @returns {number} - The priest's earnings
   */
  function getPriestEarnings(booking) {
    if (!booking) return 0;
    
    // Check if we have the new pricing structure
    if (booking.pricing && booking.pricing.priestAmount) {
      return booking.pricing.priestAmount;
    } else if (booking.pricing && booking.pricing.basePrice) {
      return booking.pricing.basePrice;
    } else if (booking.price) {
      // Legacy pricing: priest gets 90% of the order price
      return booking.price * 0.9;
    }
    
    return 0;
  }
  
  /**
   * Calculate the platform fee from a booking
   * @param {Object} booking - The booking object
   * @returns {number} - The platform fee
   */
  function getPlatformFee(booking) {
    if (!booking) return 0;
    
    // Check if we have the new pricing structure
    if (booking.pricing && booking.pricing.platformFee) {
      return booking.pricing.platformFee;
    } else if (booking.price) {
      // Legacy pricing: platform takes 10% of the price
      return booking.price * 0.1;
    }
    
    return 0;
  }

  // Find the loadEarningsSummary function and replace it with this code
  function loadEarningsSummary() {
    const userId = firebase.auth().currentUser.uid;
    showLoader('earningsSummary');
    
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    // Get all completed bookings for the priest
    firebase.firestore().collection('bookings')
      .where('priestId', '==', userId)
      .where('status', '==', 'completed')
      .get()
      .then(snapshot => {
        let totalEarnings = 0;
        let pendingBalance = 0;
        let thisMonthEarnings = 0;
        
        snapshot.forEach(doc => {
          const booking = doc.data();
          const bookingDate = booking.updatedAt ? 
            (booking.updatedAt.toDate ? booking.updatedAt.toDate() : new Date(booking.updatedAt)) : 
            new Date();
          
          const priestEarnings = getPriestEarnings(booking);
          
          // Add to total earnings
          totalEarnings += priestEarnings;
          
          // Add to pending balance if not marked as paid to priest
          if (!booking.paidToPriest) {
            pendingBalance += priestEarnings;
          }
          
          // Add to this month's earnings if within the last 30 days
          if (bookingDate >= thirtyDaysAgo) {
            thisMonthEarnings += priestEarnings;
          }
        });
        
        // Get the withdrawal total
        return firebase.firestore().collection('withdrawals')
          .where('priestId', '==', userId)
          .where('status', 'in', ['completed', 'processed'])
          .get()
          .then(withdrawalsSnapshot => {
            let totalWithdrawn = 0;
            
            withdrawalsSnapshot.forEach(doc => {
              const withdrawal = doc.data();
              totalWithdrawn += withdrawal.amount || 0;
            });
            
            // Update the UI with the calculated values
            document.getElementById('availableBalance').textContent = formatCurrency(pendingBalance);
            document.getElementById('pendingBalance').textContent = formatCurrency(thisMonthEarnings - pendingBalance);
            document.getElementById('totalEarnings').textContent = formatCurrency(totalEarnings);
            document.getElementById('totalWithdrawn').textContent = formatCurrency(totalWithdrawn);
            
            // Load chart data after we have the values
            loadEarningsChart(userId);
            hideLoader('earningsSummary');
          });
      })
      .catch(error => {
        console.error("Error loading earnings summary:", error);
        hideLoader('earningsSummary');
        showAlert('Error loading earnings summary. Please try again later.', 'danger');
      });
  }

  // Helper function to get the appropriate badge class for transaction status
  function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
        return 'bg-success';
      case 'pending':
      case 'processing':
        return 'bg-warning';
      case 'failed':
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  // Add function to view transaction details
  function viewTransactionDetails(transactionId, transactionType) {
    // Determine collection based on transaction type
    const collection = transactionType === 'withdrawal' ? 'withdrawals' : 'bookings';
    
    firebase.firestore().collection(collection).doc(transactionId).get()
      .then(doc => {
        if (!doc.exists) {
          showAlert('Transaction not found', 'warning');
          return;
        }
        
        const transaction = doc.data();
        transaction.id = doc.id;
        
        // Build the modal content based on transaction type
        let modalBody = '';
        if (transactionType === 'booking') {
          // Calculate priest's earnings
          const priestEarnings = getPriestEarnings(transaction);
          const platformFee = getPlatformFee(transaction);
          const totalAmount = transaction.pricing?.totalAmount || transaction.price || 0;
          
          modalBody = `
            <div class="transaction-details">
              <div class="row mb-4">
                <div class="col-md-6">
                  <h6>Booking Details</h6>
                  <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Service:</span>
                      <span>${transaction.serviceName || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Date & Time:</span>
                      <span>${formatDate(transaction.bookingDate)} ${transaction.bookingTime || ''}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Customer:</span>
                      <span>${transaction.customerName || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Status:</span>
                      <span>${transaction.status || 'N/A'}</span>
                    </li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <h6>Payment Details</h6>
                  <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Total Amount:</span>
                      <span>${formatCurrency(totalAmount)}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Platform Fee:</span>
                      <span>- ${formatCurrency(platformFee)}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between fw-bold">
                      <span>Your Earnings:</span>
                      <span>${formatCurrency(priestEarnings)}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Payment Status:</span>
                      <span>${transaction.paidToPriest ? 'Paid' : 'Pending'}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="text-center">
                <a href="orders.html?id=${transaction.id}" class="btn btn-primary">View Full Order Details</a>
              </div>
            </div>
          `;
        } else if (transactionType === 'withdrawal') {
          // Format date
          const timestamp = transaction.timestamp ? 
            (transaction.timestamp.toDate ? transaction.timestamp.toDate() : new Date(transaction.timestamp)) : 
            new Date();
          
          const formattedDate = timestamp.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          modalBody = `
            <div class="transaction-details">
              <div class="row mb-4">
                <div class="col-12">
                  <h6>Withdrawal Details</h6>
                  <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Reference ID:</span>
                      <span>${transaction.id}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Amount:</span>
                      <span>${formatCurrency(transaction.amount || 0)}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Payment Method:</span>
                      <span>${transaction.paymentMethod || 'Bank Transfer'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Date:</span>
                      <span>${formattedDate}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                      <span>Status:</span>
                      <span>
                        <span class="badge ${getStatusBadgeClass(transaction.status)}">${transaction.status || 'Processing'}</span>
                      </span>
                    </li>
                    ${transaction.notes ? `
                      <li class="list-group-item">
                        <div class="fw-bold mb-1">Notes:</div>
                        <div>${transaction.notes}</div>
                      </li>
                    ` : ''}
                  </ul>
                </div>
              </div>
            </div>
          `;
        }
        
        // Create the modal
        const modal = `
          <div class="modal fade" id="transactionDetailsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Transaction Details</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  ${modalBody}
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Add modal to document
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modal;
        document.body.appendChild(modalElement);
        
        // Show modal
        const bsModal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
        bsModal.show();
        
        // Remove modal from DOM after it's hidden
        document.getElementById('transactionDetailsModal').addEventListener('hidden.bs.modal', function() {
          document.body.removeChild(modalElement);
        });
      })
      .catch(error => {
        console.error("Error loading transaction details:", error);
        showAlert('Error loading transaction details. Please try again later.', 'danger');
      });
  }
}); 