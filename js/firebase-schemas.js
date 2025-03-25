/**
 * Firebase Firestore Schema Documentation
 * 
 * This file documents the database schema for the application's Firestore collections.
 * It serves as a reference for developers working with the data model.
 */

/**
 * Priests Collection (/priests/{priestId})
 * 
 * Schema:
 * {
 *   id: string,                      // Firestore document ID
 *   name: string,                    // Full name of the priest
 *   photo: string,                   // URL to priest's profile photo
 *   description: string,             // Short bio or description
 *   experience: number,              // Years of experience
 *   rating: number,                  // Average rating (0-5)
 *   reviewCount: number,             // Number of reviews received
 *   languages: array<string>,        // Languages spoken ["English", "Hindi", "Tamil", etc.]
 *   specializations: array<string>,  // Service types ["Ceremonies", "Pujas", "Homas", "Japa"]
 *   availability: {                  // General availability pattern
 *     weekdays: boolean,             // Available on weekdays
 *     weekends: boolean,             // Available on weekends
 *     evenings: boolean,             // Available in evenings
 *     timeSlots: array<string>       // ["Morning", "Afternoon", "Evening"]
 *   },
 *   locationPreferences: {           // Where priest is willing to travel
 *     remote: boolean,               // Available for remote services
 *     inPerson: boolean,             // Available for in-person services
 *     travelRadius: number,          // Maximum travel distance in miles
 *     preferredLocations: array<string> // List of preferred areas/cities
 *   },
 *   testimonials: array<{           // Featured testimonials
 *     text: string,                  // Testimonial content
 *     author: string,                // Name of person who gave testimonial
 *     date: timestamp                // When testimonial was given
 *   }>,
 *   contactInfo: {                   // Private contact information (admin use only)
 *     email: string,                 // Email address
 *     phone: string,                 // Phone number
 *     address: string                // Physical address
 *   },
 *   certifications: array<string>,   // List of certifications or qualifications
 *   bio: string,                     // Longer detailed biography
 *   active: boolean,                 // Whether priest is currently accepting bookings
 *   createdAt: timestamp,            // When record was created
 *   updatedAt: timestamp             // When record was last updated
 * }
 */

/**
 * Bookings Collection (/bookings/{bookingId})
 * 
 * Schema:
 * {
 *   id: string,                      // Firestore document ID
 *   userId: string,                  // ID of user who made booking
 *   userEmail: string,               // Email of user who made booking
 *   priestId: string,                // ID of priest being booked
 *   priestName: string,              // Name of priest (for display)
 *   serviceType: string,             // Type of service ("Ceremonies", "Pujas", etc.)
 *   serviceName: string,             // Specific service name
 *   bookingDate: string,             // Date of service (YYYY-MM-DD)
 *   bookingTime: string,             // Time of service (HH:MM)
 *   locationType: string,            // "Remote" or "In-Person"
 *   location: string,                // Address or description of location
 *   coordinates: {                   // Geographic coordinates for in-person bookings
 *     lat: number,                   // Latitude
 *     lng: number                    // Longitude
 *   },
 *   status: string,                  // "pending", "confirmed", "completed", "cancelled"
 *   paymentStatus: string,           // "pending", "paid", "refunded"
 *   paymentAmount: number,           // Amount paid for service
 *   paymentId: string,               // Payment transaction ID
 *   specialRequests: string,         // Any special notes or requests from client
 *   adminNotes: string,              // Private notes for administrators
 *   createdAt: timestamp,            // When booking was created
 *   updatedAt: timestamp,            // When booking was last updated
 *   completedAt: timestamp,          // When service was completed
 *   cancelledAt: timestamp,          // When booking was cancelled (if applicable)
 *   cancellationReason: string       // Reason for cancellation (if applicable)
 * }
 */

/**
 * Priest Availability Collection (/priestAvailability/{availabilityId})
 * 
 * Schema:
 * {
 *   id: string,                      // Firestore document ID
 *   priestId: string,                // ID of priest
 *   bookingId: string,               // Related booking ID (if booked)
 *   bookingDate: string,             // Date (YYYY-MM-DD)
 *   bookingTime: string,             // Time slot (HH:MM)
 *   isAvailable: boolean,            // Whether the slot is available (false if booked)
 *   createdAt: timestamp,            // When record was created
 *   updatedAt: timestamp             // When record was last updated
 * }
 */

/**
 * User Profiles Collection (/users/{userId})
 * 
 * Schema:
 * {
 *   id: string,                      // Firestore document ID (same as auth uid)
 *   email: string,                   // User's email address
 *   displayName: string,             // User's display name
 *   phoneNumber: string,             // User's phone number
 *   address: {                       // User's default address
 *     street: string,                // Street address
 *     city: string,                  // City
 *     state: string,                 // State/province
 *     zipCode: string,               // Postal/zip code
 *     country: string                // Country
 *   },
 *   preferences: {                   // User preferences
 *     language: string,              // Preferred language
 *     notifications: boolean,        // Whether to receive notifications
 *     communicationEmail: boolean,   // Whether to receive emails
 *     communicationSMS: boolean      // Whether to receive SMS
 *   },
 *   bookingHistory: array<string>,   // List of booking IDs
 *   createdAt: timestamp,            // When profile was created
 *   updatedAt: timestamp             // When profile was last updated
 * }
 */ 