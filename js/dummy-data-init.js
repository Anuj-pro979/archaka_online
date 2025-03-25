// dummy-data-init.js - Script to initialize Firebase with dummy priest data for testing

document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error('Firebase not initialized. Make sure firebase-config.js is loaded first.');
        return;
    }

    // Reference to the priests collection
    const priestsRef = firebase.firestore().collection('priests');

    // Sample priest data
    const dummyPriests = [
        {
            id: 'priest1',
            name: 'Pandit Sharma',
            experience: 20,
            rating: 4.8,
            languages: ['Hindi', 'Sanskrit', 'English'],
            specializations: ['Ceremonies', 'Pujas', 'Homas'],
            location: {
                city: 'Delhi',
                state: 'Delhi',
                coordinates: {
                    latitude: 28.6139,
                    longitude: 77.2090
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Expert in traditional Vedic ceremonies with over 20 years of experience. Specializes in marriage ceremonies and Satyanarayan Puja.',
            price: {
                ceremonies: 5000,
                pujas: 3500,
                homas: 7500,
                japam: 2500
            },
            availability: {
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                timeSlots: ['Morning', 'Afternoon', 'Evening']
            },
            reviews: [
                {
                    user: 'Ramesh',
                    rating: 5,
                    comment: 'Excellent service, performed the ceremony with great dedication.'
                },
                {
                    user: 'Priya',
                    rating: 4.5,
                    comment: 'Very knowledgeable and explained every ritual thoroughly.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest2',
            name: 'Acharya Trivedi',
            experience: 15,
            rating: 4.7,
            languages: ['Hindi', 'Sanskrit', 'Gujarati'],
            specializations: ['Pujas', 'Homas'],
            location: {
                city: 'Mumbai',
                state: 'Maharashtra',
                coordinates: {
                    latitude: 19.0760,
                    longitude: 72.8777
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Well-versed in traditional Homa rituals and specialized pujas for prosperity and well-being.',
            price: {
                ceremonies: 4500,
                pujas: 3000,
                homas: 6500,
                japam: 2000
            },
            availability: {
                days: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
                timeSlots: ['Morning', 'Evening']
            },
            reviews: [
                {
                    user: 'Suresh',
                    rating: 5,
                    comment: 'The Navagraha Homa was performed perfectly.'
                },
                {
                    user: 'Anjali',
                    rating: 4.5,
                    comment: 'Very punctual and respectful. Excellent guidance.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest3',
            name: 'Pandit Iyengar',
            experience: 25,
            rating: 4.9,
            languages: ['Tamil', 'Sanskrit', 'English'],
            specializations: ['Ceremonies', 'Japam'],
            location: {
                city: 'Chennai',
                state: 'Tamil Nadu',
                coordinates: {
                    latitude: 13.0827,
                    longitude: 80.2707
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Expert in Tamil Vedic traditions, specialized in Japam and traditional South Indian ceremonies.',
            price: {
                ceremonies: 5500,
                pujas: 4000,
                homas: 8000,
                japam: 3000
            },
            availability: {
                days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
                timeSlots: ['Morning', 'Afternoon', 'Evening']
            },
            reviews: [
                {
                    user: 'Karthik',
                    rating: 5,
                    comment: 'Exceptional knowledge of mantras and rituals.'
                },
                {
                    user: 'Lakshmi',
                    rating: 5,
                    comment: 'The Japam session was very powerful and effective.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest4',
            name: 'Pandit Joshi',
            experience: 18,
            rating: 4.6,
            languages: ['Hindi', 'Sanskrit', 'Marathi'],
            specializations: ['Homas', 'Pujas'],
            location: {
                city: 'Pune',
                state: 'Maharashtra',
                coordinates: {
                    latitude: 18.5204,
                    longitude: 73.8567
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Specializes in fire rituals (Homas) and traditional Maharashtrian ceremonies.',
            price: {
                ceremonies: 4200,
                pujas: 3200,
                homas: 7000,
                japam: 2200
            },
            availability: {
                days: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
                timeSlots: ['Morning', 'Evening']
            },
            reviews: [
                {
                    user: 'Vijay',
                    rating: 4.5,
                    comment: 'Very thorough with the rituals, great experience.'
                },
                {
                    user: 'Neha',
                    rating: 4.7,
                    comment: 'The Ganapati Homa was conducted with precision.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest5',
            name: 'Swami Krishnanand',
            experience: 30,
            rating: 5.0,
            languages: ['Hindi', 'Sanskrit', 'English', 'Bengali'],
            specializations: ['Japam', 'Ceremonies', 'Pujas'],
            location: {
                city: 'Kolkata',
                state: 'West Bengal',
                coordinates: {
                    latitude: 22.5726,
                    longitude: 88.3639
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Highly experienced in spiritual practices, mantras, and traditional Bengali ceremonies.',
            price: {
                ceremonies: 6000,
                pujas: 4500,
                homas: 8500,
                japam: 3500
            },
            availability: {
                days: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
                timeSlots: ['Morning', 'Afternoon']
            },
            reviews: [
                {
                    user: 'Debashish',
                    rating: 5,
                    comment: 'The most authentic experience, deeply spiritual.'
                },
                {
                    user: 'Ritu',
                    rating: 5,
                    comment: 'His Japam sessions are transformative.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest6',
            name: 'Acharya Shastri',
            experience: 22,
            rating: 4.8,
            languages: ['Hindi', 'Sanskrit', 'Kannada'],
            specializations: ['Ceremonies', 'Homas', 'Pujas'],
            location: {
                city: 'Bangalore',
                state: 'Karnataka',
                coordinates: {
                    latitude: 12.9716,
                    longitude: 77.5946
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Specialized in traditional Kannada ceremonies, Vastu pujas, and prosperity homas.',
            price: {
                ceremonies: 5200,
                pujas: 3800,
                homas: 7800,
                japam: 2800
            },
            availability: {
                days: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
                timeSlots: ['Morning', 'Evening']
            },
            reviews: [
                {
                    user: 'Sunil',
                    rating: 4.8,
                    comment: 'The Griha Pravesha ceremony was perfect in every way.'
                },
                {
                    user: 'Meena',
                    rating: 4.7,
                    comment: 'Very knowledgeable and patient with all our questions.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest7',
            name: 'Pandit Acharya',
            experience: 12,
            rating: 4.5,
            languages: ['Hindi', 'Sanskrit', 'Telugu'],
            specializations: ['Pujas', 'Japam'],
            location: {
                city: 'Hyderabad',
                state: 'Telangana',
                coordinates: {
                    latitude: 17.3850,
                    longitude: 78.4867
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Specialized in traditional Telugu ceremonies and Japam practices.',
            price: {
                ceremonies: 4000,
                pujas: 2800,
                homas: 6000,
                japam: 2000
            },
            availability: {
                days: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
                timeSlots: ['Morning', 'Afternoon', 'Evening']
            },
            reviews: [
                {
                    user: 'Venkat',
                    rating: 4.5,
                    comment: 'The puja was conducted with great attention to detail.'
                },
                {
                    user: 'Sudha',
                    rating: 4.5,
                    comment: 'His explanation of each ritual was very enlightening.'
                }
            ],
            isAvailable: true
        },
        {
            id: 'priest8',
            name: 'Acharya Dwivedi',
            experience: 28,
            rating: 4.9,
            languages: ['Hindi', 'Sanskrit', 'English', 'Gujarati'],
            specializations: ['Ceremonies', 'Homas', 'Pujas', 'Japam'],
            location: {
                city: 'Ahmedabad',
                state: 'Gujarat',
                coordinates: {
                    latitude: 23.0225,
                    longitude: 72.5714
                }
            },
            photo: 'images/services/priest.jpg',
            description: 'Highly experienced in all Vedic rituals with deep knowledge of scriptures.',
            price: {
                ceremonies: 5500,
                pujas: 4000,
                homas: 8500,
                japam: 3000
            },
            availability: {
                days: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
                timeSlots: ['Morning', 'Afternoon']
            },
            reviews: [
                {
                    user: 'Paresh',
                    rating: 5,
                    comment: 'The most authentic and spiritual experience we\'ve had.'
                },
                {
                    user: 'Hetal',
                    rating: 4.8,
                    comment: 'His knowledge and dedication is exceptional.'
                }
            ],
            isAvailable: true
        }
    ];

    // Function to add dummy data to Firestore
    function addDummyPriests() {
        // Check if data already exists
        priestsRef.get().then((snapshot) => {
            if (!snapshot.empty) {
                console.log('Priest data already exists in the database. Skipping initialization.');
                displayInitStatus('Priest data already exists in Firebase.');
                return;
            }

            // Add each priest document
            const batch = firebase.firestore().batch();
            
            dummyPriests.forEach((priest) => {
                const priestId = priest.id;
                delete priest.id; // Remove id from data object as it will be the document ID
                const priestDocRef = priestsRef.doc(priestId);
                batch.set(priestDocRef, priest);
            });

            // Commit the batch
            return batch.commit().then(() => {
                console.log('Successfully added dummy priests data!');
                displayInitStatus('Successfully added dummy priests data to Firebase!');
            }).catch((error) => {
                console.error('Error adding dummy data: ', error);
                displayInitStatus('Error adding dummy data: ' + error.message);
            });
        }).catch((error) => {
            console.error('Error checking existing data: ', error);
            displayInitStatus('Error checking existing data: ' + error.message);
        });
    }

    // Display status on the page
    function displayInitStatus(message) {
        const statusDiv = document.createElement('div');
        statusDiv.classList.add('alert', message.includes('Error') ? 'alert-danger' : 'alert-success', 'mt-3');
        statusDiv.textContent = message;
        document.body.appendChild(statusDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            statusDiv.remove();
        }, 5000);
    }

    // Add a button to initialize dummy data
    const initButton = document.createElement('button');
    initButton.textContent = 'Initialize Dummy Priest Data';
    initButton.classList.add('btn', 'btn-primary', 'mt-3', 'ms-3');
    initButton.addEventListener('click', addDummyPriests);
    
    // Add the button to the page
    const navContainer = document.querySelector('.navbar > .container');
    if (navContainer) {
        navContainer.appendChild(initButton);
    } else {
        document.body.insertBefore(initButton, document.body.firstChild);
    }
}); 