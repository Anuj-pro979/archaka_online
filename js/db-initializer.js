// Database Initializer for Archaka Platform
// This script initializes Firestore with sample data for testing

document.addEventListener('DOMContentLoaded', function() {
    // Check for Firebase
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        displayStatus('error', 'Firebase SDK not loaded properly');
        return;
    }

    // Initialize UI elements
    const initializeBtn = document.getElementById('initializeDbBtn');
    const statusDiv = document.getElementById('statusMessages');
    const progressBar = document.getElementById('progressBar');
    
    if (initializeBtn) {
        initializeBtn.addEventListener('click', initializeDatabase);
    }
    
    // Initialize success count
    let successCount = 0;
    
    /**
     * Initialize the database with sample data
     */
    function initializeDatabase() {
        displayStatus('info', 'Starting database initialization...');
        updateProgress(5);
        
        // Reset success counter
        successCount = 0;
        
        // Check if priests collection exists
        firebase.firestore().collection('priests').limit(1).get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    if (confirm('Priest data already exists. Do you want to clear it and reinitialize?')) {
                        clearExistingData().then(() => {
                            createPriestData();
                        });
                    } else {
                        displayStatus('warning', 'Database initialization cancelled by user');
                        updateProgress(0);
                    }
                } else {
                    createPriestData();
                }
            })
            .catch(error => {
                displayStatus('error', 'Error checking existing data: ' + error.message);
                console.error('Error checking existing data:', error);
                updateProgress(0);
            });
    }
    
    /**
     * Clear existing priest data
     */
    function clearExistingData() {
        displayStatus('info', 'Clearing existing priest data...');
        updateProgress(10);
        
        return firebase.firestore().collection('priests').get()
            .then(snapshot => {
                const batch = firebase.firestore().batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            })
            .then(() => {
                displayStatus('success', 'Existing priest data cleared successfully');
                updateProgress(20);
            })
            .catch(error => {
                displayStatus('error', 'Error clearing existing data: ' + error.message);
                console.error('Error clearing data:', error);
                updateProgress(0);
            });
    }
    
    /**
     * Create sample priest data
     */
    function createPriestData() {
        displayStatus('info', 'Creating sample priest data...');
        updateProgress(30);
        
        const priests = getSamplePriestData();
        const total = priests.length;
        
        // Use batched writes for better performance
        const batch = firebase.firestore().batch();
        
        priests.forEach(priest => {
            const docRef = firebase.firestore().collection('priests').doc();
            batch.set(docRef, {
                ...priest,
                isAvailable: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        // Commit the batch
        batch.commit()
            .then(() => {
                successCount = total;
                displayStatus('success', `Successfully added ${successCount} priests to the database`);
                updateProgress(100);
            })
            .catch(error => {
                displayStatus('error', 'Error adding priest data: ' + error.message);
                console.error('Error adding priest data:', error);
                updateProgress(0);
            });
    }
    
    /**
     * Display status message
     */
    function displayStatus(type, message) {
        if (!statusDiv) return;
        
        const statusClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const statusIcon = type === 'error' ? 'fa-exclamation-circle' : 
                         type === 'success' ? 'fa-check-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        const timestamp = new Date().toLocaleTimeString();
        
        const statusHtml = `
            <div class="alert ${statusClass} mb-2">
                <i class="fas ${statusIcon} me-2"></i>
                <strong>[${timestamp}]</strong> ${message}
            </div>
        `;
        
        // Add status message at the top
        statusDiv.innerHTML = statusHtml + statusDiv.innerHTML;
    }
    
    /**
     * Update progress bar
     */
    function updateProgress(percent) {
        if (!progressBar) return;
        
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
        progressBar.textContent = `${Math.round(percent)}%`;
    }
    
    /**
     * Get sample priest data
     */
    function getSamplePriestData() {
        return [
            {
                name: 'Pandit Ramesh Sharma',
                photo: 'images/services/priest.jpg',
                rating: 4.8,
                reviewCount: 156,
                experience: 25,
                location: 'Delhi, India',
                languages: ['Hindi', 'English', 'Sanskrit'],
                specializations: ['Ceremonies', 'Pujas'],
                description: 'Pandit Ramesh Sharma has been serving devotees for over 25 years. He specializes in traditional ceremonies and pujas with authentic Vedic rituals.',
                price: 5000,
                availability: {
                    monday: { start: '08:00', end: '18:00' },
                    tuesday: { start: '08:00', end: '18:00' },
                    wednesday: { start: '08:00', end: '18:00' },
                    thursday: { start: '08:00', end: '18:00' },
                    friday: { start: '08:00', end: '18:00' },
                    saturday: { start: '09:00', end: '15:00' },
                    sunday: { start: '10:00', end: '14:00' }
                },
                reviews: [
                    {
                        name: 'Suresh K.',
                        rating: 5,
                        date: '2023-05-15',
                        comment: 'Pandit ji performed Grihapravesh puja for our new home. The ceremony was beautiful, and he explained each step clearly.'
                    }
                ]
            },
            {
                name: 'Acharya Vijay Kumar',
                photo: 'images/services/priest.jpg',
                rating: 4.7,
                reviewCount: 124,
                experience: 20,
                location: 'Mumbai, India',
                languages: ['Hindi', 'English', 'Marathi', 'Sanskrit'],
                specializations: ['Homas', 'Pujas', 'Ceremonies'],
                description: 'Acharya Vijay Kumar is an experienced priest specializing in fire rituals (homas) and traditional ceremonies.',
                price: 4500,
                availability: {
                    monday: { start: '07:00', end: '19:00' },
                    tuesday: { start: '07:00', end: '19:00' },
                    wednesday: { start: '07:00', end: '19:00' },
                    thursday: { start: '07:00', end: '19:00' },
                    friday: { start: '07:00', end: '19:00' },
                    saturday: { start: '08:00', end: '16:00' },
                    sunday: { start: '09:00', end: '15:00' }
                },
                reviews: [
                    {
                        name: 'Rajesh T.',
                        rating: 5,
                        date: '2023-06-10',
                        comment: 'Acharya ji performed Satyanarayan Puja at our home. His knowledge and devotion made the ceremony very special.'
                    }
                ]
            },
            {
                name: 'Pandit Krishna Murthy',
                photo: 'images/services/priest.jpg',
                rating: 4.9,
                reviewCount: 208,
                experience: 30,
                location: 'Bangalore, India',
                languages: ['English', 'Tamil', 'Telugu', 'Sanskrit', 'Kannada'],
                specializations: ['Ceremonies', 'Homas', 'Japam'],
                description: 'Pandit Krishna Murthy is a highly respected priest with three decades of experience performing traditional South Indian rituals.',
                price: 6000,
                availability: {
                    monday: { start: '06:00', end: '18:00' },
                    tuesday: { start: '06:00', end: '18:00' },
                    wednesday: { start: '06:00', end: '18:00' },
                    thursday: { start: '06:00', end: '18:00' },
                    friday: { start: '06:00', end: '18:00' },
                    saturday: { start: '07:00', end: '14:00' },
                    sunday: { start: '08:00', end: '12:00' }
                },
                reviews: [
                    {
                        name: 'Venkat R.',
                        rating: 5,
                        date: '2023-04-25',
                        comment: 'Excellent service. Pandit ji\'s mantras and rituals were performed with utmost devotion and precision.'
                    }
                ]
            },
            {
                name: 'Acharya Sunil Shastri',
                photo: 'images/services/priest.jpg',
                rating: 4.6,
                reviewCount: 98,
                experience: 18,
                location: 'Pune, India',
                languages: ['Hindi', 'Marathi', 'Sanskrit'],
                specializations: ['Pujas', 'Homas'],
                description: 'Acharya Sunil Shastri specializes in traditional Maharashtrian rituals and is known for his devotion and attention to detail.',
                price: 4000,
                availability: {
                    monday: { start: '08:00', end: '17:00' },
                    tuesday: { start: '08:00', end: '17:00' },
                    wednesday: { start: '08:00', end: '17:00' },
                    thursday: { start: '08:00', end: '17:00' },
                    friday: { start: '08:00', end: '17:00' },
                    saturday: { start: '09:00', end: '15:00' },
                    sunday: { start: '10:00', end: '13:00' }
                },
                reviews: [
                    {
                        name: 'Priya M.',
                        rating: 4.5,
                        date: '2023-07-05',
                        comment: 'Acharya ji performed our son\'s thread ceremony with great care and explained all rituals clearly.'
                    }
                ]
            },
            {
                name: 'Swami Dayananda',
                photo: 'images/services/priest.jpg',
                rating: 5.0,
                reviewCount: 187,
                experience: 35,
                location: 'Chennai, India',
                languages: ['Tamil', 'Sanskrit', 'English'],
                specializations: ['Japam', 'Ceremonies'],
                description: 'Swami Dayananda is renowned for his deep knowledge of Vedanta and expertise in various spiritual practices and ceremonies.',
                price: 7500,
                availability: {
                    monday: { start: '05:00', end: '11:00' },
                    tuesday: { start: '05:00', end: '11:00' },
                    wednesday: { start: '05:00', end: '11:00' },
                    thursday: { start: '05:00', end: '11:00' },
                    friday: { start: '05:00', end: '11:00' },
                    saturday: { start: '05:00', end: '11:00' },
                    sunday: { start: '05:00', end: '11:00' }
                },
                reviews: [
                    {
                        name: 'Karthik S.',
                        rating: 5,
                        date: '2023-03-15',
                        comment: 'Swamiji\'s guidance during our family\'s spiritual retreat was transformative. His knowledge of scriptures is exceptional.'
                    }
                ]
            },
            {
                name: 'Pandit Ravi Iyer',
                photo: 'images/services/priest.jpg',
                rating: 4.8,
                reviewCount: 142,
                experience: 22,
                location: 'Hyderabad, India',
                languages: ['Telugu', 'Sanskrit', 'English'],
                specializations: ['Ceremonies', 'Pujas', 'Homas'],
                description: 'Pandit Ravi Iyer brings depth and authenticity to traditional Telugu ceremonies with his extensive knowledge and experience.',
                price: 5500,
                availability: {
                    monday: { start: '07:00', end: '19:00' },
                    tuesday: { start: '07:00', end: '19:00' },
                    wednesday: { start: '07:00', end: '19:00' },
                    thursday: { start: '07:00', end: '19:00' },
                    friday: { start: '07:00', end: '19:00' },
                    saturday: { start: '08:00', end: '17:00' },
                    sunday: { start: '09:00', end: '14:00' }
                },
                reviews: [
                    {
                        name: 'Srinivas P.',
                        rating: 5,
                        date: '2023-08-02',
                        comment: 'Pandit ji conducted my daughter\'s wedding with great precision. Every ritual was performed perfectly.'
                    }
                ]
            }
        ];
    }
}); 