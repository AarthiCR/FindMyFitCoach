/**
 * Sample data for FindMyFitCoach
 * Use this to populate your Firestore database with initial data
 * 
 * To use:
 * 1. Go to Firebase Console > Firestore Database
 * 2. Create collections manually and add these documents
 * OR
 * 3. Use Firebase Admin SDK to bulk import this data
 */

export const sampleCoaches = [
    {
        name: "Sarah Johnson",
        bio: "Certified personal trainer with 8 years of experience specializing in weight loss and functional fitness. I believe in sustainable lifestyle changes over quick fixes.",
        specializations: ["weight_loss", "general_fitness"],
        yearsExperience: 8,
        hourlyRate: 3000,
        rating: 4.9
    },
    {
        name: "Mike Rodriguez",
        bio: "Former professional athlete turned strength coach. Specializing in muscle building and athletic performance enhancement.",
        specializations: ["muscle_gain", "endurance"],
        yearsExperience: 12,
        hourlyRate: 4500,
        rating: 4.8
    },
    {
        name: "Emily Chen",
        bio: "Yoga instructor and endurance coach with a holistic approach to fitness. Perfect for beginners and those seeking mind-body connection.",
        specializations: ["endurance", "general_fitness"],
        yearsExperience: 6,
        hourlyRate: 2500,
        rating: 4.7
    },
    {
        name: "David Thompson",
        bio: "CrossFit Level 3 trainer with expertise in high-intensity functional training. I help clients push their limits safely.",
        specializations: ["muscle_gain", "weight_loss"],
        yearsExperience: 10,
        hourlyRate: 3500,
        rating: 4.9
    },
    {
        name: "Lisa Martinez",
        bio: "Nutrition and fitness coach specializing in sustainable weight loss. Certified nutritionist with a focus on women's health.",
        specializations: ["weight_loss", "general_fitness"],
        yearsExperience: 7,
        hourlyRate: 3200,
        rating: 4.8
    },
    {
        name: "James Wilson",
        bio: "Marathon runner and endurance specialist. I help clients build stamina and achieve their running goals.",
        specializations: ["endurance"],
        yearsExperience: 9,
        hourlyRate: 2800,
        rating: 4.6
    }
];

export const sampleWorkouts = [
    {
        title: "Full Body HIIT Blast",
        description: "High-intensity interval training targeting all major muscle groups. Great for fat burning and cardiovascular health.",
        intensity: "high",
        durationMins: 30,
        goals: ["weight_loss", "endurance"],
        popularity: 95
    },
    {
        title: "Strength Training Fundamentals",
        description: "Build foundational strength with compound movements. Focus on proper form and progressive overload.",
        intensity: "moderate",
        durationMins: 45,
        goals: ["muscle_gain", "general_fitness"],
        popularity: 88
    },
    {
        title: "Beginner's Cardio Circuit",
        description: "Low-impact cardio exercises perfect for beginners. Improve your cardiovascular health at your own pace.",
        intensity: "low",
        durationMins: 25,
        goals: ["weight_loss", "general_fitness"],
        popularity: 82
    },
    {
        title: "Advanced Powerlifting",
        description: "Heavy compound lifts for serious strength gains. Includes squat, bench press, and deadlift variations.",
        intensity: "high",
        durationMins: 60,
        goals: ["muscle_gain"],
        popularity: 76
    },
    {
        title: "Yoga Flow for Flexibility",
        description: "Dynamic yoga sequence to improve flexibility and reduce stress. Suitable for all fitness levels.",
        intensity: "low",
        durationMins: 40,
        goals: ["general_fitness"],
        popularity: 90
    },
    {
        title: "Sprint Interval Training",
        description: "Explosive sprint intervals to boost speed and endurance. Perfect for athletes and runners.",
        intensity: "high",
        durationMins: 20,
        goals: ["endurance"],
        popularity: 85
    },
    {
        title: "Home Bodyweight Workout",
        description: "No equipment needed! Effective bodyweight exercises you can do anywhere.",
        intensity: "moderate",
        durationMins: 35,
        goals: ["weight_loss", "general_fitness"],
        popularity: 92
    },
    {
        title: "Core Strength Builder",
        description: "Targeted ab and core exercises for a strong, stable midsection.",
        intensity: "moderate",
        durationMins: 25,
        goals: ["muscle_gain", "general_fitness"],
        popularity: 87
    },
    {
        title: "Long Distance Run Training",
        description: "Structured running program to build endurance for half marathons and beyond.",
        intensity: "moderate",
        durationMins: 50,
        goals: ["endurance"],
        popularity: 79
    },
    {
        title: "Quick Morning Energizer",
        description: "Wake up and energize with this quick full-body routine. Perfect for busy mornings.",
        intensity: "low",
        durationMins: 15,
        goals: ["general_fitness"],
        popularity: 94
    }
];

/**
 * How to import this data to Firestore:
 * 
 * Method 1: Manual (for small datasets)
 * 1. Go to Firebase Console
 * 2. Navigate to Firestore Database
 * 3. Create 'coaches' collection
 * 4. Click "Add Document"
 * 5. Use auto-generated ID
 * 6. Copy and paste each coach object's fields
 * 7. Repeat for 'workouts' collection
 * 
 * Method 2: Using Firebase Admin SDK (recommended for larger datasets)
 * 
 * Create a script file (import-data.js):
 * 
 * const admin = require('firebase-admin');
 * const serviceAccount = require('./serviceAccountKey.json');
 * const { sampleCoaches, sampleWorkouts } = require('./sample-data.js');
 * 
 * admin.initializeApp({
 *   credential: admin.credential.cert(serviceAccount)
 * });
 * 
 * const db = admin.firestore();
 * 
 * async function importData() {
 *   // Import coaches
 *   for (const coach of sampleCoaches) {
 *     await db.collection('coaches').add(coach);
 *     console.log(`Added coach: ${coach.name}`);
 *   }
 *   
 *   // Import workouts
 *   for (const workout of sampleWorkouts) {
 *     await db.collection('workouts').add(workout);
 *     console.log(`Added workout: ${workout.title}`);
 *   }
 *   
 *   console.log('Data import complete!');
 * }
 * 
 * importData().catch(console.error);
 * 
 * Run with: node import-data.js
 */

console.log('Sample coaches:', sampleCoaches.length);
console.log('Sample workouts:', sampleWorkouts.length);
