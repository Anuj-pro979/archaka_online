document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase from firebase-config.js
  
  // DOM Elements
  const notificationsContainer = document.getElementById('notificationsContainer');
  const notificationSearch = document.getElementById('notificationSearch');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const notificationTypeFilter = document.getElementById('notificationTypeFilter');
  const notificationStatusFilter = document.getElementById('notificationStatusFilter');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const confirmClearAllBtn = document.getElementById('confirmClearAllBtn');
  const clearAllSpinner = document.getElementById('clearAllSpinner');
  const emptyStateCard = document.getElementById('emptyStateCard');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const currentPage = document.getElementById('currentPage');
  const totalPages = document.getElementById('totalPages');
  const totalNotifications = document.getElementById('totalNotifications');
  const notificationCount = document.getElementById('notification-count');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Modal Elements
  const modalTitle = document.getElementById('modalTitle');
  const modalType = document.getElementById('modalType');
  const modalTime = document.getElementById('modalTime');
  const modalContent = document.getElementById('modalContent');
  const modalActionBtn = document.getElementById('modalActionBtn');
  
  // Current data
  let allNotifications = [];
  let filteredNotifications = [];
  
  // Pagination
  let currentPageNum = 1;
  let pageSize = 10;
  
  // Check authentication state
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in, load data
      loadNotifications(user.uid);
      updateUserInfo(user.uid);
    } else {
      // No user is signed in, redirect to login
      window.location.href = 'login.html';
    }
  });
  
  // Load all notifications from Firestore
  function loadNotifications(userId) {
    showLoader();
    
    firebase.firestore().collection('priests').doc(userId).collection('notifications')
      .orderBy('timestamp', 'desc')
      .get()
      .then((querySnapshot) => {
        hideLoader();
        
        allNotifications = [];
        querySnapshot.forEach((doc) => {
          const notification = doc.data();
          notification.id = doc.id;
          allNotifications.push(notification);
        });
        
        filteredNotifications = [...allNotifications];
        
        // Show empty state if no notifications
        if (allNotifications.length === 0) {
          showEmptyState();
        } else {
          hideEmptyState();
          updateNotificationsDisplay();
        }
        
        // Update unread count in navbar
        updateUnreadCount();
      })
      .catch((error) => {
        hideLoader();
        showAlert('Error loading notifications: ' + error.message, 'error');
        console.error("Error loading notifications:", error);
      });
  }
  
  // Update the notifications display based on current filters and pagination
  function updateNotificationsDisplay() {
    // Update pagination info
    const totalPagesNum = Math.ceil(filteredNotifications.length / pageSize);
    totalPages.textContent = totalPagesNum || 1;
    currentPage.textContent = Math.min(currentPageNum, totalPagesNum) || 1;
    totalNotifications.textContent = filteredNotifications.length;
    
    // Update pagination buttons
    prevPageBtn.disabled = currentPageNum <= 1;
    nextPageBtn.disabled = currentPageNum >= totalPagesNum;
    
    // If current page is out of range, adjust it
    if (currentPageNum > totalPagesNum) {
      currentPageNum = totalPagesNum || 1;
      currentPage.textContent = currentPageNum;
    }
    
    // Get current page notifications
    const start = (currentPageNum - 1) * pageSize;
    const end = start + pageSize;
    const currentNotifications = filteredNotifications.slice(start, end);
    
    // Show empty state if no notifications after filtering
    if (filteredNotifications.length === 0) {
      showEmptyState();
      return;
    } else {
      hideEmptyState();
    }
    
    // Build notifications HTML
    let html = '';
    
    currentNotifications.forEach((notification) => {
      const date = notification.timestamp ? formatDate(notification.timestamp.toDate()) : 'N/A';
      const timeAgo = notification.timestamp ? getTimeAgo(notification.timestamp.toDate()) : 'N/A';
      const isUnread = !notification.read;
      const typeClass = getTypeClass(notification.type);
      
      html += `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
          <div class="row align-items-center py-3 px-2 mx-0 border-bottom notification-row">
            <div class="col-auto">
              <div class="notification-icon bg-${typeClass} text-white">
                <i class="fas fa-${getTypeIcon(notification.type)}"></i>
              </div>
            </div>
            <div class="col ps-0">
              <h6 class="mb-1 ${isUnread ? 'fw-bold' : ''}">${notification.title}</h6>
              <p class="mb-0 text-truncate small">${notification.message}</p>
              <small class="text-muted">${timeAgo} · ${date}</small>
            </div>
            <div class="col-auto">
              <button class="btn btn-sm btn-link p-0 me-2 mark-read-btn" title="Mark as ${isUnread ? 'read' : 'unread'}" data-id="${notification.id}" data-read="${!isUnread}">
                <i class="fas fa-${isUnread ? 'envelope-open' : 'envelope'}"></i>
              </button>
              <button class="btn btn-sm btn-link p-0 delete-notification-btn" title="Delete" data-id="${notification.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    notificationsContainer.innerHTML = html;
    
    // Add event listeners to notification items
    document.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', function(e) {
        // Don't trigger if clicked on one of the buttons
        if (e.target.closest('.mark-read-btn') || e.target.closest('.delete-notification-btn')) {
          return;
        }
        
        const notificationId = this.getAttribute('data-id');
        showNotificationDetail(notificationId);
      });
    });
    
    // Add event listeners to mark read/unread buttons
    document.querySelectorAll('.mark-read-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const notificationId = this.getAttribute('data-id');
        const markAsRead = this.getAttribute('data-read') === 'true';
        toggleReadStatus(notificationId, markAsRead);
      });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-notification-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const notificationId = this.getAttribute('data-id');
        deleteNotification(notificationId);
      });
    });
  }
  
  // Filter notifications based on search query and filters
  function filterNotifications() {
    const searchQuery = notificationSearch.value.toLowerCase();
    const typeFilter = notificationTypeFilter.value;
    const statusFilter = notificationStatusFilter.value;
    
    filteredNotifications = allNotifications.filter(notification => {
      // Apply search filter
      const matchesSearch = 
        !searchQuery || 
        (notification.title && notification.title.toLowerCase().includes(searchQuery)) || 
        (notification.message && notification.message.toLowerCase().includes(searchQuery));
      
      // Apply type filter
      const matchesType = 
        typeFilter === 'all' || 
        (notification.type && notification.type === typeFilter);
      
      // Apply status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'read' && notification.read) || 
        (statusFilter === 'unread' && !notification.read);
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    // Reset to first page and update display
    currentPageNum = 1;
    updateNotificationsDisplay();
  }
  
  // Show notification detail in modal
  function showNotificationDetail(notificationId) {
    const notification = allNotifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    // Update modal content
    modalTitle.textContent = notification.title;
    modalType.textContent = capitalizeFirstLetter(notification.type);
    modalType.className = `badge bg-${getTypeClass(notification.type)} mb-2`;
    modalTime.textContent = notification.timestamp ? formatDateTime(notification.timestamp.toDate()) : 'N/A';
    modalContent.innerHTML = notification.message;
    
    // Set action button URL if available
    if (notification.actionUrl) {
      modalActionBtn.href = notification.actionUrl;
      modalActionBtn.classList.remove('d-none');
      
      // Set appropriate text based on notification type
      if (notification.type === 'order') {
        modalActionBtn.textContent = 'View Order';
      } else if (notification.type === 'payment') {
        modalActionBtn.textContent = 'View Payment';
      } else {
        modalActionBtn.textContent = 'View Details';
      }
    } else {
      modalActionBtn.classList.add('d-none');
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('notificationDetailModal'));
    modal.show();
    
    // Mark as read if unread
    if (!notification.read) {
      toggleReadStatus(notificationId, true);
    }
  }
  
  // Toggle read status of a notification
  function toggleReadStatus(notificationId, markAsRead) {
    const userId = firebase.auth().currentUser.uid;
    
    firebase.firestore().collection('priests').doc(userId).collection('notifications')
      .doc(notificationId)
      .update({
        read: markAsRead
      })
      .then(() => {
        // Update local data
        const notification = allNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = markAsRead;
        }
        
        // Update display
        updateNotificationsDisplay();
        
        // Update unread count
        updateUnreadCount();
      })
      .catch((error) => {
        showAlert('Error updating notification: ' + error.message, 'error');
        console.error("Error updating notification:", error);
      });
  }
  
  // Delete a notification
  function deleteNotification(notificationId) {
    const userId = firebase.auth().currentUser.uid;
    
    firebase.firestore().collection('priests').doc(userId).collection('notifications')
      .doc(notificationId)
      .delete()
      .then(() => {
        // Remove from local data
        allNotifications = allNotifications.filter(n => n.id !== notificationId);
        filteredNotifications = filteredNotifications.filter(n => n.id !== notificationId);
        
        // Show toast
        showAlert('Notification deleted successfully', 'success');
        
        // Update display
        updateNotificationsDisplay();
        
        // Update unread count
        updateUnreadCount();
      })
      .catch((error) => {
        showAlert('Error deleting notification: ' + error.message, 'error');
        console.error("Error deleting notification:", error);
      });
  }
  
  // Mark all notifications as read
  function markAllAsRead() {
    const userId = firebase.auth().currentUser.uid;
    const batch = firebase.firestore().batch();
    const unreadNotifications = allNotifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) {
      showAlert('No unread notifications', 'info');
      return;
    }
    
    showLoader('Marking all as read...');
    
    // Update all unread notifications in the batch
    unreadNotifications.forEach(notification => {
      const notificationRef = firebase.firestore().collection('priests').doc(userId)
        .collection('notifications').doc(notification.id);
      batch.update(notificationRef, { read: true });
    });
    
    // Commit the batch
    batch.commit()
      .then(() => {
        hideLoader();
        
        // Update local data
        allNotifications.forEach(notification => {
          notification.read = true;
        });
        
        // Update display
        updateNotificationsDisplay();
        
        // Update unread count
        updateUnreadCount();
        
        // Show toast
        showAlert('All notifications marked as read', 'success');
      })
      .catch((error) => {
        hideLoader();
        showAlert('Error marking notifications as read: ' + error.message, 'error');
        console.error("Error marking notifications as read:", error);
      });
  }
  
  // Clear all notifications
  function clearAllNotifications() {
    const userId = firebase.auth().currentUser.uid;
    
    if (allNotifications.length === 0) {
      showAlert('No notifications to clear', 'info');
      return;
    }
    
    // Show spinner, disable button
    clearAllSpinner.classList.remove('d-none');
    confirmClearAllBtn.disabled = true;
    
    // Delete all notifications in the background (not using batch as there could be many)
    const notificationsRef = firebase.firestore().collection('priests').doc(userId).collection('notifications');
    const deletePromises = allNotifications.map(notification => 
      notificationsRef.doc(notification.id).delete()
    );
    
    Promise.all(deletePromises)
      .then(() => {
        // Hide modal
        const clearAllModal = bootstrap.Modal.getInstance(document.getElementById('clearAllModal'));
        clearAllModal.hide();
        
        // Clear local data
        allNotifications = [];
        filteredNotifications = [];
        
        // Update display
        updateNotificationsDisplay();
        
        // Update unread count
        updateUnreadCount();
        
        // Show empty state
        showEmptyState();
        
        // Show toast
        showAlert('All notifications cleared', 'success');
      })
      .catch((error) => {
        showAlert('Error clearing notifications: ' + error.message, 'error');
        console.error("Error clearing notifications:", error);
      })
      .finally(() => {
        // Hide spinner, enable button
        clearAllSpinner.classList.add('d-none');
        confirmClearAllBtn.disabled = false;
      });
  }
  
  // Update unread count in navbar
  function updateUnreadCount() {
    const unreadCount = allNotifications.filter(n => !n.read).length;
    notificationCount.textContent = unreadCount;
    notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
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
        }
      })
      .catch((error) => {
        console.error("Error updating user info:", error);
      });
  }
  
  // Show loader
  function showLoader(message = 'Loading...') {
    notificationsContainer.innerHTML = `
      <div class="text-center p-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">${message}</p>
      </div>
    `;
  }
  
  // Hide loader
  function hideLoader() {
    // The loader will be replaced when updateNotificationsDisplay is called
  }
  
  // Show empty state
  function showEmptyState() {
    emptyStateCard.classList.remove('d-none');
    document.querySelector('.card:not(#emptyStateCard)').classList.add('d-none');
  }
  
  // Hide empty state
  function hideEmptyState() {
    emptyStateCard.classList.add('d-none');
    document.querySelector('.card:not(#emptyStateCard)').classList.remove('d-none');
  }
  
  // Show alert toast
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
  
  // Helper functions
  
  // Format date
  function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Format date and time
  function formatDateTime(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Get time ago (e.g. "2 hours ago")
  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' years ago';
    if (interval === 1) return '1 year ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' months ago';
    if (interval === 1) return '1 month ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' days ago';
    if (interval === 1) return '1 day ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' hours ago';
    if (interval === 1) return '1 hour ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutes ago';
    if (interval === 1) return '1 minute ago';
    
    return 'just now';
  }
  
  // Get CSS class based on notification type
  function getTypeClass(type) {
    switch (type) {
      case 'order':
        return 'primary';
      case 'payment':
        return 'success';
      case 'system':
        return 'info';
      default:
        return 'secondary';
    }
  }
  
  // Get icon based on notification type
  function getTypeIcon(type) {
    switch (type) {
      case 'order':
        return 'shopping-bag';
      case 'payment':
        return 'money-bill-wave';
      case 'system':
        return 'cog';
      default:
        return 'bell';
    }
  }
  
  // Capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  // Event Listeners
  
  // Search notifications
  if (notificationSearch) {
    notificationSearch.addEventListener('input', filterNotifications);
  }
  
  // Clear search
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function() {
      notificationSearch.value = '';
      filterNotifications();
    });
  }
  
  // Type filter change
  if (notificationTypeFilter) {
    notificationTypeFilter.addEventListener('change', filterNotifications);
  }
  
  // Status filter change
  if (notificationStatusFilter) {
    notificationStatusFilter.addEventListener('change', filterNotifications);
  }
  
  // Mark all as read
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
  }
  
  // Clear all notifications - open modal confirmation
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function() {
      const clearAllModal = new bootstrap.Modal(document.getElementById('clearAllModal'));
      clearAllModal.show();
    });
  }
  
  // Confirm clear all notifications
  if (confirmClearAllBtn) {
    confirmClearAllBtn.addEventListener('click', clearAllNotifications);
  }
  
  // Pagination - previous page
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function() {
      if (currentPageNum > 1) {
        currentPageNum--;
        updateNotificationsDisplay();
      }
    });
  }
  
  // Pagination - next page
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function() {
      const totalPagesNum = Math.ceil(filteredNotifications.length / pageSize);
      if (currentPageNum < totalPagesNum) {
        currentPageNum++;
        updateNotificationsDisplay();
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
}); 