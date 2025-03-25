// Add the following functions to parse and display pricing information correctly

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Update the order details section with pricing information
 * @param {Object} order - The order object
 */
function updateOrderDetails(order) {
  // Update existing order details code to include pricing information
  
  document.getElementById('orderDetailId').textContent = order.id || 'N/A';
  document.getElementById('orderDetailService').textContent = order.serviceName || 'N/A';
  document.getElementById('orderDetailDate').textContent = formatDate(order.bookingDate);
  document.getElementById('orderDetailTime').textContent = order.bookingTime || 'N/A';
  document.getElementById('orderDetailLocation').textContent = getLocationText(order.locationType, order.location);
  document.getElementById('orderDetailStatus').innerHTML = getStatusBadge(order.status);
  
  // Format created date
  if (order.createdAt) {
    const createdDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    document.getElementById('orderDetailCreated').textContent = createdDate.toLocaleString();
  } else {
    document.getElementById('orderDetailCreated').textContent = 'N/A';
  }
  
  // Update customer information
  document.getElementById('customerName').textContent = order.customerName || 'N/A';
  document.getElementById('customerPhone').textContent = order.customerPhone || 'N/A';
  document.getElementById('customerEmail').textContent = order.userEmail || 'N/A';
  
  // Update payment information
  const paymentInfo = document.getElementById('paymentInformation');
  if (paymentInfo) {
    // Check if we have pricing details in the order
    if (order.pricing) {
      // New pricing structure
      paymentInfo.innerHTML = `
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0">Payment Information</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>Base Price:</span>
                <span>${formatCurrency(order.pricing.basePrice)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>Platform Fee (10%):</span>
                <span>${formatCurrency(order.pricing.platformFee)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>Payment Gateway Fee (2%):</span>
                <span>${formatCurrency(order.pricing.paymentGatewayFee)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center fw-bold">
                <span>Total Amount:</span>
                <span>${formatCurrency(order.pricing.totalAmount)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center text-success fw-bold">
                <span>Your Earnings:</span>
                <span>${formatCurrency(order.pricing.priestAmount || order.pricing.basePrice)}</span>
              </li>
            </ul>
            <div class="mt-3">
              <span class="badge ${order.isPaid ? 'bg-success' : 'bg-warning'}">
                ${order.isPaid ? 'Paid' : 'Payment Pending'}
              </span>
              ${order.paymentMethod ? `<span class="ms-2">via ${order.paymentMethod}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      // Legacy pricing structure with just a price field
      const price = order.price || 0;
      const platformFee = price * 0.1; // 10% platform fee
      const priestAmount = price - platformFee;
      
      paymentInfo.innerHTML = `
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0">Payment Information</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center fw-bold">
                <span>Total Amount:</span>
                <span>${formatCurrency(price)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>Platform Fee (10%):</span>
                <span>${formatCurrency(platformFee)}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center text-success fw-bold">
                <span>Your Earnings:</span>
                <span>${formatCurrency(priestAmount)}</span>
              </li>
            </ul>
            <div class="mt-3">
              <span class="badge ${order.isPaid ? 'bg-success' : 'bg-warning'}">
                ${order.isPaid ? 'Paid' : 'Payment Pending'}
              </span>
              ${order.paymentMethod ? `<span class="ms-2">via ${order.paymentMethod}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }
  }
  
  // Update the order timeline
  updateOrderTimeline(order);
  
  // Update action buttons based on order status
  updateOrderActions(order);
}

/**
 * Update the order preview in the table with pricing information
 */
function renderOrdersTable(orders) {
  const tableBody = document.getElementById('ordersTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (orders.length === 0) {
    const noOrdersRow = document.createElement('tr');
    noOrdersRow.innerHTML = `
      <td colspan="8" class="text-center py-4">
        <i class="fas fa-inbox fa-3x mb-3 text-muted"></i>
        <p>No orders match your search criteria.</p>
      </td>
    `;
    tableBody.appendChild(noOrdersRow);
    return;
  }
  
  orders.forEach(order => {
    const row = document.createElement('tr');
    row.setAttribute('data-id', order.id);
    row.classList.add('order-row');
    
    // Get price from either new pricing structure or legacy price field
    let amount = '₹0';
    if (order.pricing && order.pricing.totalAmount) {
      amount = formatCurrency(order.pricing.totalAmount);
    } else if (order.price) {
      amount = formatCurrency(order.price);
    }
    
    row.innerHTML = `
      <td>
        <span class="order-id">${order.id.substring(0, 8)}</span>
      </td>
      <td>${order.serviceName || 'N/A'}</td>
      <td>${order.customerName || 'Customer'}</td>
      <td>
        <div>${formatDate(order.bookingDate)}</div>
        <div class="small text-muted">${order.bookingTime}</div>
      </td>
      <td>${getLocationText(order.locationType, order.location, true)}</td>
      <td>${amount}</td>
      <td>${getStatusBadge(order.status)}</td>
      <td>
        <button class="btn btn-sm btn-primary view-order-btn" data-id="${order.id}">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners to view order buttons
  document.querySelectorAll('.view-order-btn').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.getAttribute('data-id');
      viewOrderDetails(orderId);
    });
  });
  
  // Add event listeners to order rows
  document.querySelectorAll('.order-row').forEach(row => {
    row.addEventListener('click', function(e) {
      // Only trigger if not clicking on a button
      if (!e.target.closest('button')) {
        const orderId = this.getAttribute('data-id');
        viewOrderDetails(orderId);
      }
    });
  });
} 