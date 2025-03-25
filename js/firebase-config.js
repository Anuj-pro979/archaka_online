// Firebase Configuration
// This file contains the Firebase project configuration
console.log('Loading Firebase configuration...');

// Initialize Firebase with your project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCadZIoYzIc_QhEkGjv86G4rjFwMASd5ig",
  authDomain: "nothing-d3af4.firebaseapp.com",
  databaseURL: "https://nothing-d3af4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nothing-d3af4",
  storageBucket: "nothing-d3af4.firebasestorage.app",
  messagingSenderId: "7155955115",
  appId: "1:7155955115:web:3bd80618f9aff1a4dc8eee",
  measurementId: "G-XSVGL2M8LL"
};

console.log('Firebase config loaded, attempting to initialize Firebase...');

// Initialize Firebase app
try {
  if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    console.log('Firebase already initialized, using existing instance');
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

// Initialize Firestore with settings
try {
  // Database reference
  const db = firebase.firestore();
  console.log('Firestore initialized');
  
  // Enable offline persistence if supported
  db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
      console.log('Firestore persistence enabled');
    })
    .catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
      } else {
        console.error('Firestore persistence error:', err);
      }
    });
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
}

// Initialize Authentication
try {
  const auth = firebase.auth();
  console.log('Firebase Authentication initialized');
} catch (error) {
  console.error('Failed to initialize Firebase Authentication:', error);
}

// Check Firebase connection
function checkFirebaseConnection() {
  console.log("Checking Firebase connection...");
  
  if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded!");
    return false;
  }
  
  try {
    // Try to access Firestore
    const firestoreTest = firebase.firestore();
    console.log("Firebase Firestore initialized successfully");
    
    // Try to access Auth
    const authTest = firebase.auth();
    console.log("Firebase Auth initialized successfully");
    
    return true;
  } catch (error) {
    console.error("Firebase connection error:", error);
    return false;
  }
}

// Log connection status when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking Firebase connection status...');
  const isConnected = checkFirebaseConnection();
  console.log("Firebase connection status:", isConnected ? "Connected" : "Disconnected");
  
  // If not connected, attempt to reinitialize
  if (!isConnected && typeof firebase !== 'undefined') {
    try {
      console.log('Attempting to reinitialize Firebase...');
      firebase.initializeApp(firebaseConfig);
      console.log("Firebase reinitialized");
    } catch (error) {
      console.error("Firebase reinitialization failed:", error);
    }
  }
  
  // Initialize debugging tools
  if (window.location.href.includes('firebase-debug.html')) {
    console.log("Debug mode activated");
  }
});

// Export functions for use in other scripts
window.firebaseHelpers = {
  checkConnection: checkFirebaseConnection,
  getFirestore: () => firebase.firestore(),
  getAuth: () => firebase.auth()
};

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider(); 