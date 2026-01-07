/**
 * FindMyFitCoach - Test Data Seeder (Firebase Admin SDK)
 * 
 * This script runs from terminal and uses Firebase Admin SDK to bypass security rules.
 * 
 * SETUP:
 * 1. Go to Firebase Console → Project Settings → Service Accounts
 * 2. Click "Generate new private key" and download the JSON file
 * 3. Save it as 'service-account.json' in this folder (test-data/)
 * 4. Run: npm install
 * 5. Run: npm run seed
 * 
 * COMMANDS:
 *   npm run seed         - Seed all test data (user + coach)
 *   npm run seed:user    - Seed only user analytics data
 *   npm run seed:coach   - Seed only coach analytics data
 *   npm run clear        - Clear all test data
 *   npm run help         - Show help
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// Configuration
// ============================================

const CONFIG = {
    // Test user ID - change this to your actual Firebase Auth UID
    testUserId: 'test-user-main',
    testUserEmail: 'testuser@findmyfitcoach.com',
    testUserName: 'Test User',
    
    // Data generation settings
    monthsOfHistory: 6,
    bookingsPerMonth: { min: 8, max: 15 },
    aiWorkoutsPerMonth: { min: 4, max: 8 },
    sessionsPerMonth: { min: 6, max: 12 },
    
    // Coach data
    clientsCount: 12,
    coachBookingsPerMonth: { min: 15, max: 25 },
};

// ============================================
// Initialize Firebase Admin
// ============================================

function initializeFirebase() {
    const serviceAccountPath = join(__dirname, 'service-account.json');
    
    if (!existsSync(serviceAccountPath)) {
        console.error('\n❌ ERROR: service-account.json not found!');
        console.log('\n📋 SETUP INSTRUCTIONS:');
        console.log('   1. Go to Firebase Console: https://console.firebase.google.com');
        console.log('   2. Select your project');
        console.log('   3. Go to Project Settings → Service Accounts');
        console.log('   4. Click "Generate new private key"');
        console.log('   5. Save the downloaded file as "service-account.json" in this folder');
        console.log(`   6. Path: ${serviceAccountPath}\n`);
        process.exit(1);
    }

    try {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        initializeApp({
            credential: cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin initialized successfully');
        console.log(`   Project: ${serviceAccount.project_id}\n`);
        
        return getFirestore();
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        process.exit(1);
    }
}

// ============================================
// Helper Functions
// ============================================

function daysAgo(days, hours = 0) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return Timestamp.fromDate(d);
}

function daysAgoAtHour(days, hour) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    return Timestamp.fromDate(d);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Peak workout hours (weighted towards common times)
const peakHours = [6, 7, 8, 9, 10, 17, 18, 19, 20, 21];
const getRandomPeakHour = () => randomChoice(peakHours);

// ============================================
// Test Data Definitions
// ============================================

const COACHES = [
    { id: 'test-coach-sarah', name: 'Sarah Johnson', email: 'sarah@fitcoach.com', specializations: ['weight_loss', 'hiit', 'nutrition'], yearsExperience: 8, hourlyRate: 2500, rating: 4.9, bio: 'Certified weight loss specialist with 8+ years of transforming lives' },
    { id: 'test-coach-mike', name: 'Mike Chen', email: 'mike@fitcoach.com', specializations: ['muscle_gain', 'crossfit', 'powerlifting'], yearsExperience: 6, hourlyRate: 2200, rating: 4.8, bio: 'Strength & conditioning coach, former competitive powerlifter' },
    { id: 'test-coach-emma', name: 'Emma Williams', email: 'emma@fitcoach.com', specializations: ['yoga', 'pilates', 'flexibility'], yearsExperience: 10, hourlyRate: 1800, rating: 4.9, bio: 'Mind-body wellness instructor specializing in yoga and pilates' },
    { id: 'test-coach-raj', name: 'Raj Patel', email: 'raj@fitcoach.com', specializations: ['endurance', 'cardio', 'marathon'], yearsExperience: 5, hourlyRate: 1600, rating: 4.7, bio: 'Marathon runner and endurance coach, 3x Boston Marathon finisher' },
    { id: 'test-coach-lisa', name: 'Lisa Martinez', email: 'lisa@fitcoach.com', specializations: ['general_fitness', 'nutrition', 'wellness'], yearsExperience: 7, hourlyRate: 2000, rating: 4.8, bio: 'Holistic fitness and nutrition coach for sustainable health' },
    { id: 'test-coach-david', name: 'David Kim', email: 'david@fitcoach.com', specializations: ['hiit', 'functional_training', 'sports'], yearsExperience: 9, hourlyRate: 2400, rating: 4.9, bio: 'Sports performance specialist and functional training expert' },
    { id: 'test-coach-anna', name: 'Anna Schmidt', email: 'anna@fitcoach.com', specializations: ['rehabilitation', 'senior_fitness', 'mobility'], yearsExperience: 12, hourlyRate: 2100, rating: 4.8, bio: 'Physical therapy background, specializing in injury prevention' }
];

const FAKE_CLIENTS = [
    { id: 'test-client-john', name: 'John Smith', email: 'john.smith@email.com', goal: 'muscle_gain' },
    { id: 'test-client-jane', name: 'Jane Doe', email: 'jane.doe@email.com', goal: 'weight_loss' },
    { id: 'test-client-bob', name: 'Bob Wilson', email: 'bob.wilson@email.com', goal: 'endurance' },
    { id: 'test-client-alice', name: 'Alice Brown', email: 'alice.brown@email.com', goal: 'general_fitness' },
    { id: 'test-client-charlie', name: 'Charlie Davis', email: 'charlie.davis@email.com', goal: 'weight_loss' },
    { id: 'test-client-diana', name: 'Diana Lee', email: 'diana.lee@email.com', goal: 'muscle_gain' },
    { id: 'test-client-evan', name: 'Evan Rogers', email: 'evan.rogers@email.com', goal: 'endurance' },
    { id: 'test-client-fiona', name: 'Fiona Grant', email: 'fiona.grant@email.com', goal: 'general_fitness' },
    { id: 'test-client-george', name: 'George Kim', email: 'george.kim@email.com', goal: 'weight_loss' },
    { id: 'test-client-helen', name: 'Helen Park', email: 'helen.park@email.com', goal: 'muscle_gain' },
    { id: 'test-client-ivan', name: 'Ivan Petrov', email: 'ivan.petrov@email.com', goal: 'endurance' },
    { id: 'test-client-inactive', name: 'Inactive User (Hannah)', email: 'hannah.inactive@email.com', goal: 'weight_loss' }
];

const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness'];
const WORKOUT_TYPES = ['hiit', 'strength', 'cardio', 'yoga', 'pilates', 'crossfit', 'flexibility', 'functional'];
const WORKOUT_TITLES = [
    'Fat Burner HIIT Blast', 'Strength Builder Pro', 'Core Crusher Challenge',
    'Full Body Power', 'Endurance Builder', 'Yoga Flow Session',
    'Quick Cardio Burn', 'Lower Body Sculpt', 'Upper Body Strength',
    'Mobility & Stretch', 'Functional Fitness', 'Athletic Performance'
];
const EXERCISES = [
    'Warm-up', 'Squats', 'Deadlifts', 'Bench Press', 'Rows', 'Pull-ups',
    'Lunges', 'Plank', 'Burpees', 'Mountain Climbers', 'Push-ups',
    'Shoulder Press', 'Bicep Curls', 'Tricep Dips', 'Leg Press',
    'Lat Pulldown', 'Cable Rows', 'Cool-down', 'Stretching'
];
const COACH_NOTES = [
    'Excellent form today! Increased weight on squats.',
    'Good session. Focus on core engagement next time.',
    'Great progress on endurance. Keep up the consistency!',
    'Worked on flexibility. Hip mobility improving significantly.',
    'Strong finish! Ready to increase intensity next session.',
    'Focused on technique today. Perfect for active recovery.',
    'Discussed nutrition goals. Making great dietary changes.',
    'New personal best on deadlifts! Amazing progress! 💪',
    'Cardio endurance is improving. Heart rate recovery faster.',
    'Balance and stability work paid off. Great coordination.',
    '',
    '',
    ''
];

// ============================================
// Seed Functions
// ============================================

async function seedCoaches(db) {
    console.log('📝 Creating test coaches...');
    const batch = db.batch();
    
    for (const coach of COACHES) {
        const ref = db.collection('coaches').doc(coach.id);
        batch.set(ref, {
            ...coach,
            availability: generateAvailability(),
            createdAt: daysAgo(randomInt(180, 365)),
            updatedAt: Timestamp.now()
        });
    }
    
    await batch.commit();
    console.log(`   ✓ ${COACHES.length} coaches created`);
    return COACHES.length;
}

function generateAvailability() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const availability = {};
    
    for (const day of days) {
        if (Math.random() > 0.2) { // 80% chance of being available
            availability[day] = {
                available: true,
                slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
                    .filter(() => Math.random() > 0.3)
            };
        } else {
            availability[day] = { available: false, slots: [] };
        }
    }
    
    return availability;
}

async function seedUserProfile(db, userId, email, name) {
    console.log('📝 Creating/updating user profile...');
    
    await db.collection('users').doc(userId).set({
        uid: userId,
        name: name,
        email: email,
        heightCm: randomInt(160, 185),
        weightKg: randomInt(60, 90),
        goal: randomChoice(GOALS),
        requirements: 'Home workouts preferred, limited equipment available',
        fitnessLevel: randomChoice(['beginner', 'intermediate', 'advanced']),
        createdAt: daysAgo(randomInt(90, 180)),
        updatedAt: Timestamp.now()
    }, { merge: true });
    
    console.log(`   ✓ User profile created/updated: ${email}`);
}

async function seedUserBookings(db, userId, userEmail, userName) {
    console.log('📝 Creating user bookings...');
    let count = 0;
    
    // Monthly bookings for 6 months with growth pattern
    for (let month = 0; month < CONFIG.monthsOfHistory; month++) {
        // More bookings in recent months (growth pattern)
        const baseCount = month === 0 ? CONFIG.bookingsPerMonth.max : 
                         Math.max(CONFIG.bookingsPerMonth.min, CONFIG.bookingsPerMonth.max - month * 2);
        const bookingsThisMonth = randomInt(baseCount - 2, baseCount + 2);
        
        const batch = db.batch();
        
        for (let i = 0; i < bookingsThisMonth; i++) {
            const coach = randomChoice(COACHES);
            const dayOffset = month * 30 + randomInt(1, 28);
            const hour = getRandomPeakHour();
            
            let status;
            if (month === 0 && i < 3) {
                status = 'pending';
            } else if (Math.random() > 0.12) {
                status = 'completed';
            } else {
                status = 'cancelled';
            }
            
            const ref = db.collection('bookings').doc(`test-user-booking-${month}-${i}`);
            batch.set(ref, {
                userId,
                userEmail,
                userName,
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: randomChoice(GOALS),
                status,
                duration: randomChoice([45, 60, 60, 45, 50]),
                scheduledAt: daysAgoAtHour(dayOffset, hour),
                createdAt: daysAgo(dayOffset + 1),
                meetingId: `mtg-user-${month}-${i}`,
                meetingLink: `https://meet.jit.si/fmc-user-${month}-${i}`,
                notes: status === 'completed' ? randomChoice(['Great session!', 'Felt challenging', 'Good workout', '']) : ''
            });
            count++;
        }
        
        await batch.commit();
    }
    
    // Recent daily bookings for weekly chart (activity streak)
    const recentBatch = db.batch();
    for (let day = 0; day < 7; day++) {
        const sessionsToday = day < 5 ? randomInt(1, 2) : randomInt(0, 1);
        
        for (let s = 0; s < sessionsToday; s++) {
            const coach = COACHES[(day + s) % COACHES.length];
            const ref = db.collection('bookings').doc(`test-user-booking-recent-${day}-${s}`);
            
            recentBatch.set(ref, {
                userId,
                userEmail,
                userName,
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: GOALS[day % GOALS.length],
                status: day === 0 && s === 0 ? 'pending' : 'completed',
                duration: randomChoice([45, 60]),
                scheduledAt: daysAgoAtHour(day, getRandomPeakHour()),
                createdAt: daysAgo(day, 10),
                meetingId: `mtg-user-recent-${day}-${s}`,
                meetingLink: `https://meet.jit.si/fmc-recent-${day}-${s}`
            });
            count++;
        }
    }
    await recentBatch.commit();
    
    console.log(`   ✓ ${count} user bookings created`);
    return count;
}

async function seedAIWorkouts(db, userId) {
    console.log('📝 Creating AI workouts...');
    let count = 0;
    
    // Monthly AI workouts
    for (let month = 0; month < CONFIG.monthsOfHistory; month++) {
        const workoutsThisMonth = randomInt(CONFIG.aiWorkoutsPerMonth.min, CONFIG.aiWorkoutsPerMonth.max);
        const batch = db.batch();
        
        for (let i = 0; i < workoutsThisMonth; i++) {
            const dayOffset = month * 30 + randomInt(1, 28);
            const workoutType = randomChoice(WORKOUT_TYPES);
            const exerciseCount = randomInt(5, 8);
            
            const ref = db.collection('ai_workouts').doc(`test-ai-workout-${month}-${i}`);
            batch.set(ref, {
                userId,
                workoutType,
                goal: randomChoice(GOALS),
                workout: {
                    title: randomChoice(WORKOUT_TITLES),
                    duration: randomInt(25, 50),
                    intensity: randomChoice(['low', 'moderate', 'high']),
                    estimatedCalories: randomInt(150, 400),
                    exercises: Array.from({ length: exerciseCount }, (_, j) => ({
                        name: EXERCISES[j % EXERCISES.length],
                        sets: randomInt(2, 4),
                        reps: j === 0 || j === exerciseCount - 1 ? '5 min' : `${randomInt(8, 15)}`,
                        completed: Math.random() > 0.2
                    })),
                    equipmentNeeded: randomChoice([
                        ['None'],
                        ['Yoga mat'],
                        ['Dumbbells'],
                        ['Resistance bands'],
                        ['Yoga mat', 'Dumbbells']
                    ]),
                    aiReasoning: 'Personalized based on your fitness goals and available equipment'
                },
                createdAt: daysAgo(dayOffset)
            });
            count++;
        }
        
        await batch.commit();
    }
    
    // Recent AI workouts for weekly activity
    const recentBatch = db.batch();
    for (let day = 0; day < 7; day++) {
        if (Math.random() > 0.25) {
            const ref = db.collection('ai_workouts').doc(`test-ai-workout-recent-${day}`);
            recentBatch.set(ref, {
                userId,
                workoutType: WORKOUT_TYPES[day % WORKOUT_TYPES.length],
                goal: GOALS[day % GOALS.length],
                workout: {
                    title: WORKOUT_TITLES[day % WORKOUT_TITLES.length],
                    duration: randomInt(25, 40),
                    intensity: 'moderate',
                    estimatedCalories: randomInt(180, 280),
                    exercises: [
                        { name: 'Quick Warm-up', sets: 1, reps: '3 min', completed: true },
                        { name: randomChoice(EXERCISES), sets: 3, reps: '12', completed: true },
                        { name: randomChoice(EXERCISES), sets: 3, reps: '10', completed: Math.random() > 0.3 }
                    ],
                    equipmentNeeded: ['None']
                },
                createdAt: daysAgoAtHour(day, randomInt(6, 10))
            });
            count++;
        }
    }
    await recentBatch.commit();
    
    console.log(`   ✓ ${count} AI workouts created`);
    return count;
}

async function seedWorkoutSessions(db, userId, userName, userEmail) {
    console.log('📝 Creating workout sessions...');
    let count = 0;
    
    const batch = db.batch();
    const sessionsCount = randomInt(18, 25);
    
    for (let i = 0; i < sessionsCount; i++) {
        const coach = COACHES[i % COACHES.length];
        const dayOffset = Math.floor(i * 2.5) + randomInt(0, 2);
        const total = randomInt(5, 9);
        const completed = Math.floor(total * (0.65 + Math.random() * 0.35));
        const duration = randomChoice([45, 50, 55, 60]);
        
        const ref = db.collection('workoutSessions').doc(`test-user-session-${i}`);
        batch.set(ref, {
            bookingId: `test-user-booking-${Math.floor(i / 4)}-${i % 4}`,
            userId,
            userName,
            userEmail,
            coachId: coach.id,
            coachName: coach.name,
            goal: GOALS[i % GOALS.length],
            totalItems: total,
            completedItems: completed,
            duration,
            allExercises: Array.from({ length: total }, (_, j) => ({
                exercise: EXERCISES[j % EXERCISES.length],
                completed: j < completed,
                sets: 3,
                reps: j === 0 || j === total - 1 ? '5 min' : `${randomInt(10, 15)}`
            })),
            coachNotes: randomChoice(COACH_NOTES),
            rating: Math.random() > 0.3 ? randomInt(4, 5) : null,
            completedAt: daysAgo(dayOffset)
        });
        count++;
    }
    
    await batch.commit();
    console.log(`   ✓ ${count} workout sessions created`);
    return count;
}

async function seedFakeClients(db) {
    console.log('📝 Creating fake clients for coach analytics...');
    const batch = db.batch();
    
    for (const client of FAKE_CLIENTS) {
        const ref = db.collection('users').doc(client.id);
        batch.set(ref, {
            uid: client.id,
            name: client.name,
            email: client.email,
            heightCm: randomInt(155, 190),
            weightKg: randomInt(50, 95),
            goal: client.goal,
            fitnessLevel: randomChoice(['beginner', 'intermediate', 'advanced']),
            requirements: 'Test client for analytics',
            createdAt: daysAgo(randomInt(60, 150)),
            updatedAt: Timestamp.now()
        });
    }
    
    await batch.commit();
    console.log(`   ✓ ${FAKE_CLIENTS.length} fake clients created`);
    return FAKE_CLIENTS.length;
}

async function seedCoachBookings(db) {
    console.log('📝 Creating coach bookings (from clients)...');
    let count = 0;
    
    // Exclude inactive client from regular bookings
    const activeClients = FAKE_CLIENTS.filter(c => c.id !== 'test-client-inactive');
    
    // Monthly bookings with growth pattern
    for (let month = 0; month < CONFIG.monthsOfHistory; month++) {
        const baseBookings = month === 0 ? CONFIG.coachBookingsPerMonth.max : 
                           Math.max(CONFIG.coachBookingsPerMonth.min, CONFIG.coachBookingsPerMonth.max - month * 3);
        const bookingsThisMonth = randomInt(baseBookings - 3, baseBookings + 3);
        
        const batch = db.batch();
        
        for (let i = 0; i < bookingsThisMonth; i++) {
            const client = activeClients[i % activeClients.length];
            const coach = COACHES[i % COACHES.length];
            const dayOffset = month * 30 + randomInt(1, 28);
            const hour = getRandomPeakHour();
            
            let status;
            if (month === 0 && i < 4) {
                status = 'pending';
            } else if (Math.random() > 0.10) {
                status = 'completed';
            } else {
                status = 'cancelled';
            }
            
            const ref = db.collection('bookings').doc(`test-coach-booking-${month}-${i}`);
            batch.set(ref, {
                userId: client.id,
                userEmail: client.email,
                userName: client.name,
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: client.goal,
                status,
                duration: randomChoice([45, 50, 55, 60]),
                scheduledAt: daysAgoAtHour(dayOffset, hour),
                createdAt: daysAgo(dayOffset + 1),
                meetingId: `coach-mtg-${month}-${i}`,
                meetingLink: `https://meet.jit.si/fmc-coach-${month}-${i}`
            });
            count++;
        }
        
        await batch.commit();
    }
    
    // Recent daily bookings for coach weekly chart
    const recentBatch = db.batch();
    for (let day = 0; day < 7; day++) {
        const sessionsToday = randomInt(2, 4);
        
        for (let s = 0; s < sessionsToday; s++) {
            const client = activeClients[(day + s) % activeClients.length];
            const coach = COACHES[(day + s) % COACHES.length];
            
            const ref = db.collection('bookings').doc(`test-coach-recent-${day}-${s}`);
            recentBatch.set(ref, {
                userId: client.id,
                userEmail: client.email,
                userName: client.name,
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: client.goal,
                status: 'completed',
                duration: randomChoice([45, 60]),
                scheduledAt: daysAgoAtHour(day, getRandomPeakHour()),
                createdAt: daysAgo(day, 14),
                meetingId: `coach-recent-${day}-${s}`,
                meetingLink: `https://meet.jit.si/fmc-recent-${day}-${s}`
            });
            count++;
        }
    }
    await recentBatch.commit();
    
    // Inactive client bookings (for "needs attention" alert)
    const inactiveClient = FAKE_CLIENTS.find(c => c.id === 'test-client-inactive');
    const inactiveBatch = db.batch();
    
    for (let i = 0; i < 4; i++) {
        const coach = COACHES[i % COACHES.length];
        const ref = db.collection('bookings').doc(`test-inactive-booking-${i}`);
        
        inactiveBatch.set(ref, {
            userId: inactiveClient.id,
            userEmail: inactiveClient.email,
            userName: inactiveClient.name,
            coachId: coach.id,
            coachName: coach.name,
            coachEmail: coach.email,
            goal: inactiveClient.goal,
            status: 'completed',
            duration: 45,
            scheduledAt: daysAgo(18 + i * 5), // 18-33 days ago (inactive)
            createdAt: daysAgo(19 + i * 5),
            meetingId: `inactive-mtg-${i}`,
            meetingLink: `https://meet.jit.si/fmc-inactive-${i}`
        });
        count++;
    }
    await inactiveBatch.commit();
    
    console.log(`   ✓ ${count} coach bookings created`);
    return count;
}

async function seedCoachSessions(db) {
    console.log('📝 Creating coach workout sessions...');
    let count = 0;
    
    const activeClients = FAKE_CLIENTS.filter(c => c.id !== 'test-client-inactive');
    const sessionsCount = randomInt(40, 55);
    
    // Split into batches of 500 (Firestore limit)
    for (let batchStart = 0; batchStart < sessionsCount; batchStart += 400) {
        const batch = db.batch();
        const batchEnd = Math.min(batchStart + 400, sessionsCount);
        
        for (let i = batchStart; i < batchEnd; i++) {
            const client = activeClients[i % activeClients.length];
            const coach = COACHES[i % COACHES.length];
            const dayOffset = Math.floor(i * 1.8) + randomInt(0, 2);
            const total = randomInt(5, 9);
            const completed = Math.floor(total * (0.55 + Math.random() * 0.45));
            const duration = randomChoice([45, 50, 55, 60]);
            
            const ref = db.collection('workoutSessions').doc(`test-coach-session-${i}`);
            batch.set(ref, {
                bookingId: `test-coach-booking-${Math.floor(i / 5)}-${i % 5}`,
                userId: client.id,
                userName: client.name,
                userEmail: client.email,
                coachId: coach.id,
                coachName: coach.name,
                goal: client.goal,
                totalItems: total,
                completedItems: completed,
                duration,
                allExercises: Array.from({ length: total }, (_, j) => ({
                    exercise: EXERCISES[j % EXERCISES.length],
                    completed: j < completed,
                    sets: randomInt(2, 4),
                    reps: j === 0 || j === total - 1 ? '5 min' : `${randomInt(8, 15)}`
                })),
                coachNotes: randomChoice(COACH_NOTES),
                rating: Math.random() > 0.4 ? randomInt(4, 5) : null,
                completedAt: daysAgo(dayOffset)
            });
            count++;
        }
        
        await batch.commit();
    }
    
    console.log(`   ✓ ${count} coach workout sessions created`);
    return count;
}

// ============================================
// Clear Functions
// ============================================

async function clearTestData(db) {
    console.log('\n🧹 Clearing all test data...\n');
    
    const collections = ['coaches', 'users', 'bookings', 'ai_workouts', 'workoutSessions'];
    const stats = {};
    
    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        let deleted = 0;
        
        // Delete in batches
        const batchSize = 400;
        const docs = snapshot.docs.filter(doc => doc.id.startsWith('test-'));
        
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = db.batch();
            const batchDocs = docs.slice(i, i + batchSize);
            
            for (const doc of batchDocs) {
                batch.delete(doc.ref);
                deleted++;
            }
            
            await batch.commit();
        }
        
        stats[collectionName] = deleted;
        console.log(`   ✓ ${collectionName}: ${deleted} documents deleted`);
    }
    
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    console.log(`\n✅ Cleared ${total} test documents total\n`);
    
    return stats;
}

// ============================================
// Main Execution
// ============================================

async function seedAll(db) {
    console.log('\n' + '═'.repeat(60));
    console.log('🚀 SEEDING ALL TEST DATA');
    console.log('═'.repeat(60) + '\n');
    
    const stats = {
        coaches: 0,
        userBookings: 0,
        aiWorkouts: 0,
        userSessions: 0,
        fakeClients: 0,
        coachBookings: 0,
        coachSessions: 0
    };
    
    // Seed coaches first
    stats.coaches = await seedCoaches(db);
    
    // Seed user data
    console.log('\n--- USER ANALYTICS DATA ---');
    await seedUserProfile(db, CONFIG.testUserId, CONFIG.testUserEmail, CONFIG.testUserName);
    stats.userBookings = await seedUserBookings(db, CONFIG.testUserId, CONFIG.testUserEmail, CONFIG.testUserName);
    stats.aiWorkouts = await seedAIWorkouts(db, CONFIG.testUserId);
    stats.userSessions = await seedWorkoutSessions(db, CONFIG.testUserId, CONFIG.testUserName, CONFIG.testUserEmail);
    
    // Seed coach data
    console.log('\n--- COACH ANALYTICS DATA ---');
    stats.fakeClients = await seedFakeClients(db);
    stats.coachBookings = await seedCoachBookings(db);
    stats.coachSessions = await seedCoachSessions(db);
    
    // Summary
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 TEST DATA SEEDING COMPLETE!');
    console.log('═'.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log(`   • Coaches: ${stats.coaches}`);
    console.log(`   • User Bookings: ${stats.userBookings}`);
    console.log(`   • AI Workouts: ${stats.aiWorkouts}`);
    console.log(`   • User Sessions: ${stats.userSessions}`);
    console.log(`   • Fake Clients: ${stats.fakeClients}`);
    console.log(`   • Coach Bookings: ${stats.coachBookings}`);
    console.log(`   • Coach Sessions: ${stats.coachSessions}`);
    console.log(`   ────────────────────────`);
    console.log(`   📈 Total Records: ${total}`);
    console.log('\n💡 TIPS:');
    console.log(`   • Test User ID: ${CONFIG.testUserId}`);
    console.log(`   • Test User Email: ${CONFIG.testUserEmail}`);
    console.log('   • Sign in with test coaches to see coach analytics');
    console.log('   • Coach emails: sarah@fitcoach.com, mike@fitcoach.com, etc.');
    console.log('\n🧹 To clear: npm run clear\n');
}

async function seedUserOnly(db) {
    console.log('\n--- SEEDING USER DATA ONLY ---\n');
    
    await seedCoaches(db);
    await seedUserProfile(db, CONFIG.testUserId, CONFIG.testUserEmail, CONFIG.testUserName);
    await seedUserBookings(db, CONFIG.testUserId, CONFIG.testUserEmail, CONFIG.testUserName);
    await seedAIWorkouts(db, CONFIG.testUserId);
    await seedWorkoutSessions(db, CONFIG.testUserId, CONFIG.testUserName, CONFIG.testUserEmail);
    
    console.log('\n✅ User analytics data seeded!\n');
}

async function seedCoachOnly(db) {
    console.log('\n--- SEEDING COACH DATA ONLY ---\n');
    
    await seedCoaches(db);
    await seedFakeClients(db);
    await seedCoachBookings(db);
    await seedCoachSessions(db);
    
    console.log('\n✅ Coach analytics data seeded!\n');
}

function showHelp() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     FindMyFitCoach - Test Data Seeder                      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  COMMANDS:                                                 ║
║    npm run seed        Seed all test data                  ║
║    npm run seed:user   Seed user analytics data only       ║
║    npm run seed:coach  Seed coach analytics data only      ║
║    npm run clear       Clear all test data                 ║
║    npm run help        Show this help message              ║
║                                                            ║
║  SETUP:                                                    ║
║    1. Get service account key from Firebase Console        ║
║    2. Save as service-account.json in test-data folder     ║
║    3. Run: npm install                                     ║
║    4. Run: npm run seed                                    ║
║                                                            ║
║  TEST ACCOUNTS:                                            ║
║    User: ${CONFIG.testUserEmail.padEnd(32)}         ║
║    Coaches: sarah@fitcoach.com, mike@fitcoach.com, etc.    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
}

// Main
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    const db = initializeFirebase();
    
    try {
        if (args.includes('--clear')) {
            await clearTestData(db);
        } else if (args.includes('--user-only')) {
            await seedUserOnly(db);
        } else if (args.includes('--coach-only')) {
            await seedCoachOnly(db);
        } else {
            await seedAll(db);
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();

