document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const cartItemsBody = document.getElementById('cartItemsBody');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSpinner = document.getElementById('cartSpinner');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const subtotalElement = document.getElementById('subtotal');
    const serviceFeeElement = document.getElementById('serviceFee');
    const taxAmountElement = document.getElementById('taxAmount');
    const discountRow = document.getElementById('discountRow');
    const discountAmountElement = document.getElementById('discountAmount');
    const totalAmountElement = document.getElementById('totalAmount');
    const cartCountElement = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponMessage = document.getElementById('couponMessage');
    const recommendedItems = document.getElementById('recommendedItems');
    
    // Remove Item Modal
    const removeItemModal = new bootstrap.Modal(document.getElementById('removeItemModal'));
    const confirmRemoveBtn = document.getElementById('confirmRemoveBtn');
    let itemToRemove = null;
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.location.href = `search-results.html?q=${encodeURIComponent(searchInput.value)}`;
        }
    });
    
    // Cart data
    let cartItems = [];
    let discount = 0;
    
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> My Account';
            document.getElementById('accountBtn').href = 'profile.html';
            loadCartItems(user.uid);
        } else {
            // User is not signed in
            document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> Login';
            document.getElementById('accountBtn').href = 'login.html';
            loadCartFromLocalStorage();
        }
    });
    
    // Function to load cart items for authenticated users
    function loadCartItems(userId) {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            firebase.firestore().collection('users').doc(userId)
                .collection('cart').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        // No items in cart, use local storage or show empty message
                        const localCart = getCartFromLocalStorage();
                        if (localCart && localCart.length > 0) {
                            cartItems = localCart;
                            displayCartItems();
                        } else {
                            showEmptyCart();
                        }
                    } else {
                        // Items found in Firestore cart
                        cartItems = querySnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data
                            };
                        });
                        displayCartItems();
                    }
                })
                .catch((error) => {
                    console.error("Error getting cart items: ", error);
                    loadCartFromLocalStorage();
                });
        } else {
            loadCartFromLocalStorage();
        }
    }
    
    // Function to load cart from local storage
    function loadCartFromLocalStorage() {
        const localCart = getCartFromLocalStorage();
        if (localCart && localCart.length > 0) {
            cartItems = localCart;
            displayCartItems();
        } else {
            showEmptyCart();
        }
    }
    
    // Function to get cart from local storage
    function getCartFromLocalStorage() {
        const cartData = localStorage.getItem('priestServicesCart');
        return cartData ? JSON.parse(cartData) : [];
    }
    
    // Function to display cart items
    function displayCartItems() {
        // Hide spinner
        cartSpinner.classList.add('d-none');
        
        // Update cart count
        cartCountElement.textContent = cartItems.length;
        
        if (cartItems.length === 0) {
            showEmptyCart();
            return;
        }
        
        // Show cart items
        emptyCartMessage.classList.add('d-none');
        cartItemsList.classList.remove('d-none');
        
        // Clear existing items
        cartItemsBody.innerHTML = '';
        
        // Add each item to the cart
        cartItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Format date if available
            let formattedDate = 'Not selected';
            if (item.date) {
                const date = new Date(item.date);
                formattedDate = date.toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                if (item.time) {
                    formattedDate += ' at ' + item.time;
                }
            }
            
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.image || 'images/ceremony-placeholder.jpg'}" alt="${item.name}" class="img-fluid rounded" style="width: 80px; height: 60px; object-fit: cover;">
                        <div class="ms-3">
                            <h6 class="mb-1">${item.name}</h6>
                            <span class="text-muted small">${item.category || 'Ceremony'}</span>
                        </div>
                    </div>
                </td>
                <td class="text-center">${item.priestName || 'Not selected'}</td>
                <td class="text-center">${formattedDate}</td>
                <td class="text-end">₹${item.price ? item.price.toFixed(2) : '0.00'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            cartItemsBody.appendChild(row);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                itemToRemove = parseInt(this.getAttribute('data-index'));
                removeItemModal.show();
            });
        });
        
        // Calculate and display totals
        updateCartTotals();
        
        // Load recommended items
        loadRecommendedItems();
    }
    
    // Function to show empty cart message
    function showEmptyCart() {
        cartSpinner.classList.add('d-none');
        cartItemsList.classList.add('d-none');
        emptyCartMessage.classList.remove('d-none');
        cartCountElement.textContent = '0';
    }
    
    // Function to update cart totals
    function updateCartTotals() {
        let subtotal = 0;
        
        // Calculate subtotal
        cartItems.forEach(item => {
            subtotal += item.price || 0;
        });
        
        // Calculate fees and taxes
        const serviceFee = subtotal * 0.05; // 5% service fee
        const taxAmount = (subtotal + serviceFee) * 0.18; // 18% GST
        let totalAmount = subtotal + serviceFee + taxAmount - discount;
        
        // Update UI
        subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
        serviceFeeElement.textContent = `₹${serviceFee.toFixed(2)}`;
        taxAmountElement.textContent = `₹${taxAmount.toFixed(2)}`;
        
        // Show/hide discount row
        if (discount > 0) {
            discountRow.classList.remove('d-none');
            discountAmountElement.textContent = `-₹${discount.toFixed(2)}`;
        } else {
            discountRow.classList.add('d-none');
        }
        
        totalAmountElement.textContent = `₹${totalAmount.toFixed(2)}`;
    }
    
    // Confirm remove item button
    confirmRemoveBtn.addEventListener('click', function() {
        if (itemToRemove !== null) {
            removeCartItem(itemToRemove);
            removeItemModal.hide();
            itemToRemove = null;
        }
    });
    
    // Function to remove an item from the cart
    function removeCartItem(index) {
        // Get the item to be removed
        const removedItem = cartItems[index];
        
        // Remove the item from the array
        cartItems.splice(index, 1);
        
        // Update local storage
        localStorage.setItem('priestServicesCart', JSON.stringify(cartItems));
        
        // If user is authenticated, update Firestore
        const user = firebase.auth().currentUser;
        if (user && removedItem.id && typeof firebase !== 'undefined' && firebase.firestore) {
            firebase.firestore().collection('users').doc(user.uid)
                .collection('cart').doc(removedItem.id)
                .delete()
                .catch((error) => {
                    console.error("Error removing item from Firestore: ", error);
                });
        }
        
        // Refresh the cart display
        displayCartItems();
    }
    
    // Apply coupon button
    applyCouponBtn.addEventListener('click', function() {
        const couponCode = document.getElementById('couponCode').value.trim();
        
        if (!couponCode) {
            return;
        }
        
        // Validate coupon code
        if (couponCode.toUpperCase() === 'WELCOME10') {
            // Calculate discount (10% of subtotal)
            const subtotal = parseFloat(subtotalElement.textContent.replace('₹', ''));
            discount = subtotal * 0.1;
            
            // Show success message
            couponMessage.textContent = 'Coupon applied successfully! 10% discount added.';
            couponMessage.classList.remove('d-none');
            couponMessage.classList.add('text-success');
            
            // Update totals
            updateCartTotals();
        } else if (couponCode.toUpperCase() === 'FESTIVAL20') {
            // Calculate discount (20% of subtotal)
            const subtotal = parseFloat(subtotalElement.textContent.replace('₹', ''));
            discount = subtotal * 0.2;
            
            // Show success message
            couponMessage.textContent = 'Festival coupon applied successfully! 20% discount added.';
            couponMessage.classList.remove('d-none');
            couponMessage.classList.add('text-success');
            
            // Update totals
            updateCartTotals();
        } else {
            // Show error message
            couponMessage.textContent = 'Invalid coupon code. Please try again.';
            couponMessage.classList.remove('d-none');
            couponMessage.classList.remove('text-success');
            couponMessage.classList.add('text-danger');
        }
    });
    
    // Checkout button
    checkoutBtn.addEventListener('click', function() {
        if (cartItems.length === 0) {
            return;
        }
        
        // Redirect to checkout page with the first item's details
        // In a real implementation, you would pass all items or a cart ID
        const firstItem = cartItems[0];
        window.location.href = `checkout.html?ceremonyId=${firstItem.id || ''}&priestId=${firstItem.priestId || ''}&date=${firstItem.date || ''}&time=${encodeURIComponent(firstItem.time || '')}`;
    });
    
    // Function to load recommended items
    function loadRecommendedItems() {
        const categories = new Set();
        
        // Collect categories from cart items
        cartItems.forEach(item => {
            if (item.category) {
                categories.add(item.category);
            }
        });
        
        // If no categories or Firebase is not available, use mock data
        if (categories.size === 0 || typeof firebase === 'undefined' || !firebase.firestore) {
            displayRecommendedItems(getMockRecommendedItems());
            return;
        }
        
        // Get first category to search for similar items
        const firstCategory = Array.from(categories)[0];
        
        // Query Firestore for items in the same category
        firebase.firestore().collection(firstCategory)
            .limit(3)
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    displayRecommendedItems(getMockRecommendedItems());
                } else {
                    const recommendedItems = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            category: firstCategory
                        };
                    });
                    displayRecommendedItems(recommendedItems);
                }
            })
            .catch((error) => {
                console.error("Error getting recommended items: ", error);
                displayRecommendedItems(getMockRecommendedItems());
            });
    }
    
    // Function to display recommended items
    function displayRecommendedItems(items) {
        recommendedItems.innerHTML = '';
        
        items.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col';
            
            col.innerHTML = `
                <div class="card h-100 shadow-sm hover-effect">
                    <img src="${item.image || 'images/ceremony-placeholder.jpg'}" class="card-img-top" alt="${item.name}" style="height: 180px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text text-muted small">${item.shortDescription || 'Authentic vedic ceremony performed by experienced priests.'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold">₹${item.price ? item.price.toFixed(2) : '0.00'}</span>
                            <a href="ceremony-details.html?type=${item.id}" class="btn btn-outline-primary btn-sm">View Details</a>
                        </div>
                    </div>
                </div>
            `;
            
            recommendedItems.appendChild(col);
        });
    }
    
    // Function to get mock recommended items
    function getMockRecommendedItems() {
        return [
            {
                id: 'satyanarayan-puja',
                name: 'Satyanarayan Puja',
                image: 'images/satyanarayan-puja.jpg',
                price: 5000,
                category: 'pujas',
                shortDescription: 'Sacred puja to Lord Vishnu that brings prosperity and happiness.'
            },
            {
                id: 'gruhapravesam',
                name: 'Gruhapravesam',
                image: 'images/gruhapravesam.jpg',
                price: 12000,
                category: 'ceremonies',
                shortDescription: 'Traditional house warming ceremony for your new home.'
            },
            {
                id: 'navagraha-homa',
                name: 'Navagraha Homa',
                image: 'images/navagraha-homa.jpg',
                price: 8000,
                category: 'homas',
                shortDescription: 'Powerful ritual to pacify the nine planetary deities.'
            }
        ];
    }
}); 