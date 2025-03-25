document.addEventListener('DOMContentLoaded', function() {
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    // Set search term in UI
    const searchTermElement = document.getElementById('searchTerm');
    if (searchTermElement && searchQuery) {
        searchTermElement.textContent = searchQuery;
    }
    
    // Set search input value
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchQuery) {
        searchInput.value = searchQuery;
    }
    
    // Handle search input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    // Redirect to search results page with new query
                    window.location.href = `search-results.html?q=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }
    
    // Add event listeners for filters
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterResults();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            filterResults();
        });
    }
    
    // Perform search
    if (searchQuery) {
        performSearch(searchQuery);
    } else {
        showNoResults();
    }
});

// Perform search
function performSearch(query) {
    // Show loading spinner
    document.getElementById('searchSpinner').classList.remove('d-none');
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('noResults').classList.add('d-none');
    
    // For demonstration purposes, we'll use a mock delay
    // In a real implementation, this would fetch results from a database
    setTimeout(() => {
        // Check if Firebase is initialized
        if (typeof db !== 'undefined') {
            // Search in Firestore
            searchInFirestore(query);
        } else {
            // Use mock data for demonstration
            const mockResults = getMockResults(query);
            displayResults(mockResults);
        }
    }, 1000);
}

// Search in Firestore
function searchInFirestore(query) {
    // Convert query to lowercase for case-insensitive search
    const queryLower = query.toLowerCase();
    
    // In a real implementation, you would use Firestore's search capabilities
    // For simplicity, we'll fetch all ceremonies and filter client-side
    const promises = [
        db.collection('ceremonies').get(),
        db.collection('homas').get(),
        db.collection('japam').get(),
        db.collection('pujas').get()
    ];
    
    Promise.all(promises)
        .then(snapshots => {
            let results = [];
            
            // Process each collection
            snapshots.forEach((snapshot, index) => {
                const collectionNames = ['ceremonies', 'homas', 'japam', 'pujas'];
                const category = collectionNames[index];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    
                    // Check if the item matches the search query
                    const name = data.name || '';
                    const description = data.description || '';
                    const shortDescription = data.shortDescription || '';
                    
                    if (name.toLowerCase().includes(queryLower) ||
                        description.toLowerCase().includes(queryLower) ||
                        shortDescription.toLowerCase().includes(queryLower)) {
                        
                        results.push({
                            id: doc.id,
                            name: data.name,
                            description: data.shortDescription || data.description,
                            price: data.price || 0,
                            image: data.image || getDefaultImage(category),
                            category: category,
                            slug: doc.id
                        });
                    }
                });
            });
            
            displayResults(results);
        })
        .catch(error => {
            console.error('Error searching Firestore:', error);
            
            // Show no results
            document.getElementById('searchSpinner').classList.add('d-none');
            document.getElementById('noResults').classList.remove('d-none');
        });
}

// Get mock results
function getMockResults(query) {
    // Convert query to lowercase for case-insensitive search
    const queryLower = query.toLowerCase();
    
    // Mock data for demonstration
    const mockData = [
        {
            id: '1',
            name: 'Naamakaranam',
            description: 'Naming ceremony, marking the baby\'s official name.',
            price: 5499.00,
            image: 'images/naamakaranam.jpg',
            category: 'ceremonies',
            slug: 'naamakaranam'
        },
        {
            id: '2',
            name: 'Annaprasana',
            description: 'Traditional rice-feeding ceremony, marking a baby\'s first intake of solid food.',
            price: 4999.00,
            image: 'images/annaprasana.jpg',
            category: 'ceremonies',
            slug: 'annaprasana'
        },
        {
            id: '3',
            name: 'Aksharabhyasam',
            description: 'Auspicious ritual where a child is introduced to formal education.',
            price: 6499.00,
            image: 'images/aksharabhyasam.jpg',
            category: 'ceremonies',
            slug: 'aksharabhyasam'
        },
        {
            id: '4',
            name: 'Graha Pravesham',
            description: 'To bless a new home with positive energy.',
            price: 9999.00,
            image: 'images/graha-pravesham.jpg',
            category: 'ceremonies',
            slug: 'graha-pravesham'
        },
        {
            id: '5',
            name: 'Surya Namaskar Homam',
            description: 'To invoke the blessings of the Sun God for good health.',
            price: 3999.00,
            image: 'images/surya-namaskar.jpg',
            category: 'homas',
            slug: 'surya-namaskar'
        }
    ];
    
    // Filter data based on query
    return mockData.filter(item => {
        return item.name.toLowerCase().includes(queryLower) || 
               item.description.toLowerCase().includes(queryLower);
    });
}

// Display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const spinner = document.getElementById('searchSpinner');
    const noResults = document.getElementById('noResults');
    
    // Hide spinner
    spinner.classList.add('d-none');
    
    // Check if there are results
    if (results.length === 0) {
        noResults.classList.remove('d-none');
        return;
    }
    
    // Create results HTML
    let html = '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">';
    
    results.forEach(result => {
        html += `
            <div class="col search-result" data-category="${result.category}" data-price="${result.price}">
                <div class="card h-100 ceremony-card">
                    <div class="position-relative">
                        <img src="${result.image}" class="card-img-top" alt="${result.name}">
                        <div class="ceremony-overlay">
                            <p class="text-white p-3">${result.description}</p>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${result.name}</h5>
                        <p class="card-text text-primary">₹${result.price.toFixed(2)}</p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <a href="${getCategoryLink(result.category)}?ceremony=${result.slug}" class="btn btn-primary btn-sm w-100">View Details</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add result count
    html = `<p class="mb-4">Found ${results.length} results</p>` + html;
    
    // Update results container
    resultsContainer.innerHTML = html;
}

// Filter results based on category and sort options
function filterResults() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const searchResults = document.querySelectorAll('.search-result');
    
    // Filter by category
    searchResults.forEach(result => {
        const category = result.getAttribute('data-category');
        
        if (categoryFilter === 'all' || category === categoryFilter) {
            result.style.display = 'block';
        } else {
            result.style.display = 'none';
        }
    });
    
    // Sort results
    const resultsContainer = document.getElementById('searchResults').querySelector('.row');
    const resultsArray = Array.from(searchResults);
    
    if (sortFilter === 'price-low') {
        resultsArray.sort((a, b) => {
            return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
        });
    } else if (sortFilter === 'price-high') {
        resultsArray.sort((a, b) => {
            return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
        });
    }
    
    // Re-append sorted elements
    resultsArray.forEach(result => {
        resultsContainer.appendChild(result);
    });
    
    // Update count
    const visibleResults = document.querySelectorAll('.search-result[style="display: block"]').length;
    const countText = document.querySelector('#searchResults > p');
    if (countText) {
        countText.textContent = `Found ${visibleResults} results`;
    }
}

// Show no results message
function showNoResults() {
    document.getElementById('searchSpinner').classList.add('d-none');
    document.getElementById('noResults').classList.remove('d-none');
}

// Get category link
function getCategoryLink(category) {
    switch(category) {
        case 'ceremonies':
            return 'ceremony-details.html';
        case 'homas':
            return 'homa-details.html';
        case 'japam':
            return 'japam-details.html';
        case 'pujas':
            return 'puja-details.html';
        default:
            return 'ceremony-details.html';
    }
}

// Get default image for category
function getDefaultImage(category) {
    switch(category) {
        case 'ceremonies':
            return 'images/ceremony-default.jpg';
        case 'homas':
            return 'images/homa-default.jpg';
        case 'japam':
            return 'images/japam-default.jpg';
        case 'pujas':
            return 'images/puja-default.jpg';
        default:
            return 'images/ceremony-default.jpg';
    }
} 