/**
 * Firebase Seed Data Script
 * 
 * This script provides sample data to populate the Firestore database.
 * Note: Run this script manually from the browser console on your local development
 * environment only. It should not be included in production code.
 */

// Function to seed Firestore with sample data
function seedFirestoreData() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase not initialized!");
        return;
    }
    
    const db = firebase.firestore();
    
    // Sample priest data
    const priests = [
        {
            name: "Pandit Rajesh Sharma",
            photo: "img/priests/priest1.jpg",
            description: "Experienced priest specializing in traditional Vedic ceremonies with over 15 years of practice.",
            experience: 15,
            rating: 4.8,
            reviewCount: 124,
            languages: ["English", "Hindi", "Sanskrit"],
            specializations: ["Ceremonies", "Pujas", "Homas"],
            availability: {
                weekdays: true,
                weekends: true,
                evenings: true,
                timeSlots: ["Morning", "Afternoon", "Evening"]
            },
            locationPreferences: {
                remote: true,
                inPerson: true,
                travelRadius: 25,
                preferredLocations: ["Mumbai", "Pune", "Thane"]
            },
            testimonials: [
                {
                    text: "Pandit Rajesh conducted our house warming ceremony with great precision and explained each ritual thoroughly.",
                    author: "Suresh Patel",
                    date: new Date(2023, 5, 15)
                }
            ],
            certifications: ["Vedic Studies", "Pandit Certification from Kashi Vishwanath"],
            bio: "Pandit Rajesh Sharma comes from a lineage of priests serving communities for generations. He completed his Vedic education at Kashi Vishwanath and has been serving families across the country for over 15 years.",
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "Acharya Venkatesh Iyer",
            photo: "img/priests/priest2.jpg",
            description: "South Indian priest specializing in traditional Tamil and Telugu ceremonies and rituals.",
            experience: 22,
            rating: 4.9,
            reviewCount: 167,
            languages: ["English", "Tamil", "Telugu", "Sanskrit"],
            specializations: ["Ceremonies", "Pujas", "Homas", "Japa"],
            availability: {
                weekdays: true,
                weekends: true,
                evenings: false,
                timeSlots: ["Morning", "Afternoon"]
            },
            locationPreferences: {
                remote: true,
                inPerson: true,
                travelRadius: 30,
                preferredLocations: ["Chennai", "Bangalore", "Hyderabad"]
            },
            testimonials: [
                {
                    text: "Acharya Venkatesh performed our son's thread ceremony perfectly. His knowledge of mantras and rituals is exceptional.",
                    author: "Ramesh Krishnan",
                    date: new Date(2023, 3, 22)
                }
            ],
            certifications: ["Agama Shastra", "Vedic Studies from Tirupati"],
            bio: "Acharya Venkatesh Iyer is a highly respected priest from Tamil Nadu with over 22 years of experience in conducting various ceremonies. He has served in temples across South India before dedicating himself to helping families maintain their spiritual traditions.",
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "Pandit Srinivas Joshi",
            photo: "img/priests/priest3.jpg",
            description: "Expert in Maharashtrian wedding ceremonies and traditional Ganesh puja with 12 years experience.",
            experience: 12,
            rating: 4.6,
            reviewCount: 97,
            languages: ["English", "Marathi", "Hindi", "Sanskrit"],
            specializations: ["Ceremonies", "Pujas"],
            availability: {
                weekdays: true,
                weekends: true,
                evenings: true,
                timeSlots: ["Morning", "Afternoon", "Evening"]
            },
            locationPreferences: {
                remote: true,
                inPerson: true,
                travelRadius: 20,
                preferredLocations: ["Pune", "Mumbai", "Nagpur"]
            },
            testimonials: [
                {
                    text: "Our wedding ceremony was conducted beautifully by Pandit Joshi. He made everything easy to understand for our non-Marathi speaking relatives.",
                    author: "Amit and Priya Deshmukh",
                    date: new Date(2023, 1, 8)
                }
            ],
            certifications: ["Vedic Studies from Pune Sanskrit Pathshala"],
            bio: "Pandit Srinivas Joshi has been practicing as a priest for 12 years, with special expertise in Maharashtrian wedding rituals and Ganesh puja. He is known for his clear explanations and inclusive approach that helps everyone participate in the ceremonies.",
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "Acharya Ravi Kumar",
            photo: "img/priests/priest4.jpg",
            description: "Specializes in Homas and Yagnas with deep knowledge of fire rituals for various purposes.",
            experience: 18,
            rating: 4.7,
            reviewCount: 112,
            languages: ["English", "Kannada", "Hindi", "Sanskrit"],
            specializations: ["Homas", "Pujas"],
            availability: {
                weekdays: true,
                weekends: true,
                evenings: false,
                timeSlots: ["Morning", "Afternoon"]
            },
            locationPreferences: {
                remote: false,
                inPerson: true,
                travelRadius: 35,
                preferredLocations: ["Bangalore", "Mysore", "Hubli"]
            },
            testimonials: [
                {
                    text: "Acharya Ravi conducted a Rudra Homa for our family that was truly transformative. His precision with the rituals was impressive.",
                    author: "Karthik Narayanan",
                    date: new Date(2023, 7, 3)
                }
            ],
            certifications: ["Fire Ritual Specialist", "Agni Vidya from Sringeri"],
            bio: "Acharya Ravi Kumar has 18 years of experience specializing in Homas (fire rituals). He has conducted various types of homas including Ganapati Homa, Navagraha Homa, Rudra Homa, and Maha Mrityunjaya Homa. His precise execution of these sacred fire rituals has earned him respect throughout Karnataka.",
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "Pandit Mukesh Trivedi",
            photo: "img/priests/priest5.jpg",
            description: "Expert in performing Japa and mantra recitation rituals with perfect pronunciation and rhythm.",
            experience: 25,
            rating: 4.9,
            reviewCount: 143,
            languages: ["English", "Hindi", "Gujarati", "Sanskrit"],
            specializations: ["Japa", "Pujas"],
            availability: {
                weekdays: true,
                weekends: true,
                evenings: true,
                timeSlots: ["Morning", "Afternoon", "Evening"]
            },
            locationPreferences: {
                remote: true,
                inPerson: true,
                travelRadius: 15,
                preferredLocations: ["Delhi", "Gurgaon", "Noida"]
            },
            testimonials: [
                {
                    text: "Pandit Mukesh's Gayatri Japa session was incredible. His Sanskrit pronunciation is flawless and the energy he brings is remarkable.",
                    author: "Vijay Mehra",
                    date: new Date(2023, 2, 17)
                }
            ],
            certifications: ["Mantra Shastra", "Advanced Sanskrit from Delhi University"],
            bio: "Pandit Mukesh Trivedi has devoted 25 years to the study and practice of sacred mantras. He is considered one of the foremost experts in Japa rituals, specializing in Gayatri Mantra, Maha Mrityunjaya Mantra, and other powerful Sanskrit recitations. His perfect pronunciation and rhythmic chanting create a profound spiritual atmosphere.",
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            name: "Acharya Subramaniam",
            photo: "img/priests/priest6.jpg",
            description: "South Indian priest specializing in traditional Kerala-style ceremonies and rituals.",
            experience: 20,
            rating: 4.8,
            reviewCount: 109,
            languages: ["English", "Malayalam", "Tamil", "Sanskrit"],
            specializations: ["Ceremonies", "Pujas"],
            availability: {
                weekdays: false,
                weekends: true,
                evenings: true,
                timeSlots: ["Morning", "Evening"]
            },
            locationPreferences: {
                remote: true,
                inPerson: true,
                travelRadius: 25,
                preferredLocations: ["Kochi", "Trivandrum", "Chennai"]
            },
            testimonials: [
                {
                    text: "Acharya Subramaniam conducted our daughter's naming ceremony according to traditional Kerala customs. It was a beautiful and meaningful experience.",
                    author: "Priya Thomas",
                    date: new Date(2023, 4, 12)
                }
            ],
            certifications: ["Kerala Tantric Traditions", "Temple Rituals from Guruvayur"],
            bio: "Acharya Subramaniam brings 20 years of experience in traditional Kerala-style ceremonies. He was trained in the temple town of Guruvayur and has deep knowledge of unique Malayalam rituals and practices. He is particularly sought after for naming ceremonies, house warmings, and temple consecrations.",
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
    ];
    
    // Add priests to Firestore
    const batch = db.batch();
    
    priests.forEach(priest => {
        const priestRef = db.collection('priests').doc(); // Auto-generate ID
        batch.set(priestRef, priest);
        console.log(`Adding priest: ${priest.name} with ID: ${priestRef.id}`);
    });
    
    // Commit the batch
    return batch.commit()
        .then(() => {
            console.log("✅ Sample priest data added successfully!");
            return true;
        })
        .catch(error => {
            console.error("❌ Error adding sample data: ", error);
            return false;
        });
}

// Function to clear all priest data
function clearPriestData() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase not initialized!");
        return;
    }
    
    const db = firebase.firestore();
    
    // Get all priest documents
    return db.collection('priests').get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log("No priests to delete");
                return;
            }
            
            // Create a batch to delete documents
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                console.log(`Deleting priest with ID: ${doc.id}`);
            });
            
            // Commit the batch
            return batch.commit();
        })
        .then(() => {
            console.log("✅ All priest data cleared successfully!");
            return true;
        })
        .catch(error => {
            console.error("❌ Error clearing priest data: ", error);
            return false;
        });
}

// Usage instructions (for browser console):
console.log(`
Firebase Seed Data Utility

To seed the database with sample priests:
> seedFirestoreData()

To clear all priest data:
> clearPriestData()

Note: Make sure you are logged in with admin credentials before running these functions.
`); 