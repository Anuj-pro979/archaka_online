// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const welcomeMessage = document.getElementById('welcomeMessage');
  const navUserName = document.getElementById('navUserName');
  const navProfileImage = document.getElementById('navProfileImage');
  const logoutBtn = document.getElementById('logoutBtn');
  const availabilityToggle = document.getElementById('availabilityToggle');
  const availabilityStatus = document.getElementById('availabilityStatus');
  
  // Stats elements
  const newOrdersCount = document.getElementById('newOrdersCount');
  const pendingOrdersCount = document.getElementById('pendingOrdersCount');
  const completedOrdersCount = document.getElementById('completedOrdersCount');
  const totalEarnings = document.getElementById('totalEarnings');
  
  // Notification count
  const notificationCount = document.getElementById('notification-count');
  
  // Recent orders table
  const recentOrdersTable = document.getElementById('recentOrdersTable');
  
  // Recent notifications
  const recentNotifications = document.getElementById('recentNotifications');
  
  // Check if user is logged in
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Show loader
        showLoader();
        
        // Get priest data
        const priestDoc = await collectionsRef.priests.doc(user.uid).get();
        
        if (priestDoc.exists) {
          const priestData = priestDoc.data();
          
          // Update welcome message and profile info
          if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${priestData.firstName}`;
          }
          
          if (navUserName) {
            navUserName.textContent = priestData.fullName;
          }
          
          if (navProfileImage && priestData.profilePhotoURL) {
            navProfileImage.src = priestData.profilePhotoURL;
          }
          
          // Set availability toggle
          if (availabilityToggle && availabilityStatus) {
            const isAvailable = priestData.availabilityStatus === 'available';
            availabilityToggle.checked = isAvailable;
            updateAvailabilityStatus(isAvailable);
            
            // Add toggle event listener
            availabilityToggle.addEventListener('change', async (e) => {
              const newStatus = e.target.checked ? 'available' : 'unavailable';
              try {
                await collectionsRef.priests.doc(user.uid).update({
                  availabilityStatus: newStatus
                });
                updateAvailabilityStatus(e.target.checked);
                showAlert(`You are now ${newStatus}`, 'success');
              } catch (error) {
                console.error('Error updating availability:', error);
                // Revert toggle
                availabilityToggle.checked = !e.target.checked;
                updateAvailabilityStatus(!e.target.checked);
                showAlert('Failed to update availability status', 'danger');
              }
            });
          }
          
          // Load dashboard data
          await loadDashboardData(user.uid);
          
        } else {
          // User is not an approved priest
          console.error('User is not an approved priest');
          auth.signOut();
          window.location.href = 'index.html';
        }
        
      } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard', 'danger');
      } finally {
        // Hide loader
        hideLoader();
      }
    } else {
      // Not logged in, redirect to login
      window.location.href = 'index.html';
    }
  });
  
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await auth.signOut();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error signing out:', error);
        showAlert('Failed to sign out', 'danger');
      }
    });
  }
  
  // Load dashboard data
  async function loadDashboardData(priestId) {
    try {
      // Get order stats
      const orders = await collectionsRef.orders
        .where('priestId', '==', priestId)
        .get();
      
      let newOrders = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      let earnings = 0;
      
      // Count orders by status
      orders.forEach(doc => {
        const order = doc.data();
        
        if (order.status === 'new') {
          newOrders++;
        } else if (order.status === 'accepted' || order.status === 'in-progress') {
          pendingOrders++;
        } else if (order.status === 'completed') {
          completedOrders++;
          earnings += order.priestEarnings || 0;
        }
      });
      
      // Update stats
      if (newOrdersCount) {
        newOrdersCount.textContent = newOrders;
      }
      
      if (pendingOrdersCount) {
        pendingOrdersCount.textContent = pendingOrders;
      }
      
      if (completedOrdersCount) {
        completedOrdersCount.textContent = completedOrders;
      }
      
      if (totalEarnings) {
        totalEarnings.textContent = formatCurrency(earnings);
      }
      
      // Get unread notifications count
      const notifications = await collectionsRef.notifications
        .where('priestId', '==', priestId)
        .where('read', '==', false)
        .get();
      
      if (notificationCount) {
        notificationCount.textContent = notifications.size;
      }
      
      // Load recent orders
      await loadRecentOrders(priestId);
      
      // Load recent notifications
      await loadRecentNotifications(priestId);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showAlert('Error loading dashboard data', 'danger');
    }
  }
  
  // Load recent orders
  async function loadRecentOrders(priestId) {
    if (!recentOrdersTable) return;
    
    try {
      const recentOrders = await collectionsRef.orders
        .where('priestId', '==', priestId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      if (recentOrders.empty) {
        recentOrdersTable.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-3">No orders found</td>
          </tr>
        `;
        return;
      }
      
      let html = '';
      
      recentOrders.forEach(doc => {
        const order = doc.data();
        const orderId = doc.id;
        const shortOrderId = orderId.substring(0, 8) + '...';
        
        // Format date
        const orderDate = order.createdAt ? formatDate(order.createdAt) : 'N/A';
        
        // Order status tag
        const statusTag = getStatusTag(order.status);
        
        // Action button based on status
        let actionButton = '';
        
        if (order.status === 'new') {
          actionButton = `
            <button class="btn btn-sm btn-success accept-order" data-id="${orderId}">Accept</button>
            <button class="btn btn-sm btn-danger reject-order" data-id="${orderId}">Reject</button>
          `;
        } else if (order.status === 'accepted') {
          actionButton = `
            <button class="btn btn-sm btn-primary start-order" data-id="${orderId}">Start</button>
          `;
        } else if (order.status === 'in-progress') {
          actionButton = `
            <button class="btn btn-sm btn-success complete-order" data-id="${orderId}">Complete</button>
          `;
        } else {
          actionButton = `
            <a href="orders.html?id=${orderId}" class="btn btn-sm btn-info">View</a>
          `;
        }
        
        html += `
          <tr>
            <td><a href="orders.html?id=${orderId}" class="text-decoration-none">${shortOrderId}</a></td>
            <td>${order.serviceName || 'N/A'}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>${orderDate}</td>
            <td>${statusTag}</td>
            <td>${actionButton}</td>
          </tr>
        `;
      });
      
      recentOrdersTable.innerHTML = html;
      
      // Add event listeners to order action buttons
      document.querySelectorAll('.accept-order').forEach(button => {
        button.addEventListener('click', (e) => acceptOrder(e.target.dataset.id));
      });
      
      document.querySelectorAll('.reject-order').forEach(button => {
        button.addEventListener('click', (e) => rejectOrder(e.target.dataset.id));
      });
      
      document.querySelectorAll('.start-order').forEach(button => {
        button.addEventListener('click', (e) => startOrder(e.target.dataset.id));
      });
      
      document.querySelectorAll('.complete-order').forEach(button => {
        button.addEventListener('click', (e) => completeOrder(e.target.dataset.id));
      });
      
    } catch (error) {
      console.error('Error loading recent orders:', error);
      recentOrdersTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-3">Error loading orders</td>
        </tr>
      `;
    }
  }
  
  // Load recent notifications
  async function loadRecentNotifications(priestId) {
    if (!recentNotifications) return;
    
    try {
      const notifications = await collectionsRef.notifications
        .where('priestId', '==', priestId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      if (notifications.empty) {
        recentNotifications.innerHTML = `
          <div class="list-group-item text-center py-3">No notifications found</div>
        `;
        return;
      }
      
      let html = '';
      
      notifications.forEach(doc => {
        const notification = doc.data();
        const notificationId = doc.id;
        
        // Format time
        const time = notification.createdAt ? formatTimestamp(notification.createdAt) : 'N/A';
        
        // Notification icon based on type
        let icon = 'fas fa-bell';
        
        switch (notification.type) {
          case 'new_order':
            icon = 'fas fa-shopping-cart';
            break;
          case 'order_update':
            icon = 'fas fa-sync-alt';
            break;
          case 'payment':
            icon = 'fas fa-rupee-sign';
            break;
          case 'system':
            icon = 'fas fa-cog';
            break;
        }
        
        // Unread class
        const unreadClass = !notification.read ? 'unread' : '';
        
        html += `
          <div class="list-group-item notification-item ${unreadClass}" data-id="${notificationId}">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <i class="${icon} fa-lg"></i>
              </div>
              <div class="flex-grow-1">
                <p class="mb-1">${notification.message}</p>
                <small class="notification-time">${time}</small>
              </div>
              ${!notification.read ? '<div class="ms-2"><span class="badge bg-primary">New</span></div>' : ''}
            </div>
          </div>
        `;
      });
      
      recentNotifications.innerHTML = html;
      
      // Mark notification as read when clicked
      document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
          const notificationId = item.dataset.id;
          
          try {
            await collectionsRef.notifications.doc(notificationId).update({
              read: true
            });
            
            // Update UI
            item.classList.remove('unread');
            const badge = item.querySelector('.badge');
            if (badge) {
              badge.remove();
            }
            
            // Update notification count
            const newCount = parseInt(notificationCount.textContent) - 1;
            notificationCount.textContent = newCount > 0 ? newCount : 0;
            
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        });
      });
      
    } catch (error) {
      console.error('Error loading recent notifications:', error);
      recentNotifications.innerHTML = `
        <div class="list-group-item text-center py-3">Error loading notifications</div>
      `;
    }
  }
  
  // Helper function to update availability status display
  function updateAvailabilityStatus(isAvailable) {
    if (availabilityStatus) {
      const statusIndicator = availabilityStatus.querySelector('.status-indicator');
      
      if (isAvailable) {
        statusIndicator.classList.remove('unavailable');
        statusIndicator.classList.add('available');
        availabilityStatus.textContent = ' Available';
        availabilityStatus.prepend(statusIndicator);
      } else {
        statusIndicator.classList.remove('available');
        statusIndicator.classList.add('unavailable');
        availabilityStatus.textContent = ' Not Available';
        availabilityStatus.prepend(statusIndicator);
      }
    }
  }
  
  // Helper function to get status tag HTML
  function getStatusTag(status) {
    let className = '';
    let label = 'Unknown';
    
    switch (status) {
      case 'new':
        className = 'status-new';
        label = 'New';
        break;
      case 'accepted':
        className = 'status-accepted';
        label = 'Accepted';
        break;
      case 'in-progress':
        className = 'status-in-progress';
        label = 'In Progress';
        break;
      case 'completed':
        className = 'status-completed';
        label = 'Completed';
        break;
      case 'cancelled':
        className = 'status-cancelled';
        label = 'Cancelled';
        break;
    }
    
    return `<span class="status-tag ${className}">${label}</span>`;
  }
  
  // Order actions
  async function acceptOrder(orderId) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await collectionsRef.orders.doc(orderId).update({
        status: 'accepted',
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Create notification for customer
      const orderDoc = await collectionsRef.orders.doc(orderId).get();
      const order = orderDoc.data();
      
      if (order && order.customerId) {
        await collectionsRef.notifications.add({
          type: 'order_update',
          priestId: user.uid,
          customerId: order.customerId,
          orderId: orderId,
          message: `Your order for ${order.serviceName} has been accepted by ${order.priestName}.`,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }
      
      // Refresh orders
      loadRecentOrders(user.uid);
      
      // Update stats
      loadDashboardData(user.uid);
      
      showAlert('Order accepted successfully', 'success');
    } catch (error) {
      console.error('Error accepting order:', error);
      showAlert('Failed to accept order', 'danger');
    }
  }
  
  async function rejectOrder(orderId) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await collectionsRef.orders.doc(orderId).update({
        status: 'cancelled',
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancellationReason: 'Rejected by priest'
      });
      
      // Create notification for customer
      const orderDoc = await collectionsRef.orders.doc(orderId).get();
      const order = orderDoc.data();
      
      if (order && order.customerId) {
        await collectionsRef.notifications.add({
          type: 'order_update',
          priestId: user.uid,
          customerId: order.customerId,
          orderId: orderId,
          message: `Your order for ${order.serviceName} has been rejected by ${order.priestName}.`,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }
      
      // Refresh orders
      loadRecentOrders(user.uid);
      
      // Update stats
      loadDashboardData(user.uid);
      
      showAlert('Order rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting order:', error);
      showAlert('Failed to reject order', 'danger');
    }
  }
  
  async function startOrder(orderId) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await collectionsRef.orders.doc(orderId).update({
        status: 'in-progress',
        startedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Create notification for customer
      const orderDoc = await collectionsRef.orders.doc(orderId).get();
      const order = orderDoc.data();
      
      if (order && order.customerId) {
        await collectionsRef.notifications.add({
          type: 'order_update',
          priestId: user.uid,
          customerId: order.customerId,
          orderId: orderId,
          message: `Your order for ${order.serviceName} has been started by ${order.priestName}.`,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }
      
      // Refresh orders
      loadRecentOrders(user.uid);
      
      // Update stats
      loadDashboardData(user.uid);
      
      showAlert('Order started successfully', 'success');
    } catch (error) {
      console.error('Error starting order:', error);
      showAlert('Failed to start order', 'danger');
    }
  }
  
  async function completeOrder(orderId) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await collectionsRef.orders.doc(orderId).update({
        status: 'completed',
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Create notification for customer
      const orderDoc = await collectionsRef.orders.doc(orderId).get();
      const order = orderDoc.data();
      
      if (order && order.customerId) {
        await collectionsRef.notifications.add({
          type: 'order_update',
          priestId: user.uid,
          customerId: order.customerId,
          orderId: orderId,
          message: `Your order for ${order.serviceName} has been completed by ${order.priestName}.`,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }
      
      // Add transaction record
      if (order) {
        await collectionsRef.transactions.add({
          orderId: orderId,
          priestId: user.uid,
          customerId: order.customerId,
          amount: order.priestEarnings || 0,
          status: 'completed',
          serviceName: order.serviceName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Refresh orders
      loadRecentOrders(user.uid);
      
      // Update stats
      loadDashboardData(user.uid);
      
      showAlert('Order completed successfully', 'success');
    } catch (error) {
      console.error('Error completing order:', error);
      showAlert('Failed to complete order', 'danger');
    }
  }
}); 