/**
 * Test Data Seeder for Analytics Dashboard
 * 
 * This script populates Firestore with test data to verify all analytics components work correctly.
 * 
 * USAGE:
 * 1. Open your app in browser and sign in as a user
 * 2. Open browser console (F12 -> Console)
 * 3. Copy and paste this entire file into the console
 * 4. Run: seedAnalyticsTestData()
 * 5. Refresh the analytics section to see the data
 * 
 * To clear test data, run: clearAnalyticsTestData()
 */

// Test data configuration
const TEST_DATA_CONFIG = {
    // Your test user ID will be auto-detected from current session
    // Or you can hardcode it: userId: 'your-firebase-user-id'
    
    // Test coaches to create
    coaches: [
        {
            id: 'test-coach-sarah',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@testcoach.com',
            bio: 'Certified personal trainer with 8 years of experience in weight loss and HIIT.',
            specializations: ['weight_loss', 'hiit', 'general_fitness'],
            yearsExperience: 8,
            hourlyRate: 2500,
            rating: 4.9
        },
        {
            id: 'test-coach-mike',
            name: 'Mike Chen',
            email: 'mike.chen@testcoach.com',
            bio: 'Strength and conditioning specialist focused on muscle building.',
            specializations: ['muscle_gain', 'crossfit', 'endurance'],
            yearsExperience: 6,
            hourlyRate: 2000,
            rating: 4.7
        },
        {
            id: 'test-coach-emma',
            name: 'Emma Williams',
            email: 'emma.williams@testcoach.com',
            bio: 'Yoga and pilates instructor promoting holistic fitness.',
            specializations: ['yoga', 'pilates', 'general_fitness'],
            yearsExperience: 10,
            hourlyRate: 1800,
            rating: 4.8
        },
        {
            id: 'test-coach-david',
            name: 'David Kumar',
            email: 'david.kumar@testcoach.com',
            bio: 'Marathon runner and endurance coach.',
            specializations: ['endurance', 'weight_loss', 'general_fitness'],
            yearsExperience: 5,
            hourlyRate: 2200,
            rating: 4.6
        }
    ]
};

/**
 * Generate dates relative to today
 */
function getRelativeDate(daysAgo, hoursAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);
    return date;
}

/**
 * Generate booking test data spanning 6 months
 */
function generateBookingsData(userId) {
    const bookings = [];
    const coaches = TEST_DATA_CONFIG.coaches;
    const statuses = ['completed', 'completed', 'completed', 'completed', 'cancelled', 'pending'];
    const goals = ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness'];
    
    // Generate bookings for last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        // Variable number of bookings per month (more recent = more bookings)
        const bookingsThisMonth = Math.max(2, 8 - monthOffset + Math.floor(Math.random() * 3));
        
        for (let i = 0; i < bookingsThisMonth; i++) {
            const coach = coaches[Math.floor(Math.random() * coaches.length)];
            const daysAgo = monthOffset * 30 + Math.floor(Math.random() * 28);
            const status = monthOffset === 0 && i < 2 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
            
            bookings.push({
                id: `test-booking-${monthOffset}-${i}`,
                userId: userId,
                userEmail: 'testuser@example.com',
                userName: 'Test User',
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: goals[Math.floor(Math.random() * goals.length)],
                status: status,
                scheduledAt: getRelativeDate(daysAgo),
                createdAt: getRelativeDate(daysAgo + 1),
                meetingId: `test-meeting-${monthOffset}-${i}`,
                meetingLink: `https://meet.jit.si/test-meeting-${monthOffset}-${i}`
            });
        }
    }
    
    // Add some bookings in the last 7 days for weekly activity chart
    for (let day = 0; day < 7; day++) {
        // 0-2 bookings per day
        const bookingsToday = Math.floor(Math.random() * 3);
        for (let i = 0; i < bookingsToday; i++) {
            const coach = coaches[Math.floor(Math.random() * coaches.length)];
            bookings.push({
                id: `test-booking-recent-${day}-${i}`,
                userId: userId,
                userEmail: 'testuser@example.com',
                userName: 'Test User',
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: goals[Math.floor(Math.random() * goals.length)],
                status: day === 0 ? 'pending' : 'completed',
                scheduledAt: getRelativeDate(day, Math.floor(Math.random() * 12)),
                createdAt: getRelativeDate(day, Math.floor(Math.random() * 12) + 1),
                meetingId: `test-meeting-recent-${day}-${i}`,
                meetingLink: `https://meet.jit.si/test-meeting-recent-${day}-${i}`
            });
        }
    }
    
    return bookings;
}

/**
 * Generate AI workout test data
 */
function generateAiWorkoutsData(userId) {
    const workouts = [];
    const workoutTemplates = [
        {
            title: 'High Intensity Fat Burner',
            duration: 30,
            intensity: 'high',
            estimatedCalories: 350,
            exercises: [
                { name: 'Burpees', sets: 3, reps: '10-12', notes: 'Land softly' },
                { name: 'Mountain Climbers', sets: 3, reps: '20', notes: 'Keep core tight' },
                { name: 'Jump Squats', sets: 4, reps: '15', notes: 'Full depth' }
            ]
        },
        {
            title: 'Strength Builder',
            duration: 45,
            intensity: 'moderate',
            estimatedCalories: 280,
            exercises: [
                { name: 'Push-ups', sets: 4, reps: '12-15', notes: 'Chest to ground' },
                { name: 'Dumbbell Rows', sets: 3, reps: '10', notes: 'Squeeze at top' },
                { name: 'Lunges', sets: 3, reps: '12 each leg', notes: 'Keep torso upright' }
            ]
        },
        {
            title: 'Core Crusher',
            duration: 20,
            intensity: 'moderate',
            estimatedCalories: 150,
            exercises: [
                { name: 'Plank', sets: 3, reps: '45 seconds', notes: 'Keep hips level' },
                { name: 'Russian Twists', sets: 3, reps: '20', notes: 'Feet off ground' },
                { name: 'Leg Raises', sets: 3, reps: '15', notes: 'Slow controlled movement' }
            ]
        },
        {
            title: 'Full Body Blast',
            duration: 40,
            intensity: 'high',
            estimatedCalories: 400,
            exercises: [
                { name: 'Kettlebell Swings', sets: 4, reps: '15', notes: 'Hip hinge movement' },
                { name: 'Box Jumps', sets: 3, reps: '10', notes: 'Step down, dont jump' },
                { name: 'Renegade Rows', sets: 3, reps: '8 each', notes: 'Minimize hip rotation' }
            ]
        },
        {
            title: 'Endurance Builder',
            duration: 35,
            intensity: 'moderate',
            estimatedCalories: 300,
            exercises: [
                { name: 'Jump Rope', sets: 5, reps: '2 minutes', notes: 'Stay on toes' },
                { name: 'High Knees', sets: 4, reps: '30 seconds', notes: 'Drive knees up' },
                { name: 'Butt Kicks', sets: 4, reps: '30 seconds', notes: 'Quick tempo' }
            ]
        }
    ];
    
    // Generate AI workouts for last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const workoutsThisMonth = Math.max(1, 5 - monthOffset + Math.floor(Math.random() * 3));
        
        for (let i = 0; i < workoutsThisMonth; i++) {
            const template = workoutTemplates[Math.floor(Math.random() * workoutTemplates.length)];
            const daysAgo = monthOffset * 30 + Math.floor(Math.random() * 28);
            
            workouts.push({
                id: `test-ai-workout-${monthOffset}-${i}`,
                userId: userId,
                workout: {
                    ...template,
                    aiReasoning: `This workout is designed based on your fitness goals and current level. ${template.title} will help you ${monthOffset < 2 ? 'maintain momentum' : 'build foundation'}.`,
                    warmup: { description: '5 minutes dynamic stretching', checklistItems: ['Arm circles', 'Leg swings', 'Hip rotations'] },
                    cooldown: { description: '5 minutes static stretching', checklistItems: ['Quad stretch', 'Hamstring stretch', 'Shoulder stretch'] },
                    equipmentNeeded: ['Yoga mat', 'Dumbbells']
                },
                createdAt: getRelativeDate(daysAgo)
            });
        }
    }
    
    // Add some AI workouts in last 7 days
    for (let day = 0; day < 7; day++) {
        if (Math.random() > 0.4) { // ~60% chance of AI workout each day
            const template = workoutTemplates[Math.floor(Math.random() * workoutTemplates.length)];
            workouts.push({
                id: `test-ai-workout-recent-${day}`,
                userId: userId,
                workout: {
                    ...template,
                    aiReasoning: `Perfect for your ${day === 0 ? 'today' : 'recent'} training session!`,
                    warmup: { description: '5 minutes warmup', checklistItems: ['Light jog', 'Dynamic stretches'] },
                    cooldown: { description: '5 minutes cooldown', checklistItems: ['Static stretches', 'Deep breathing'] },
                    equipmentNeeded: ['Yoga mat']
                },
                createdAt: getRelativeDate(day, Math.floor(Math.random() * 8))
            });
        }
    }
    
    return workouts;
}

/**
 * Generate workout session data (completed sessions with coach notes)
 */
function generateWorkoutSessionsData(userId, bookings) {
    const sessions = [];
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    // Create workout sessions for ~70% of completed bookings
    completedBookings.forEach((booking, index) => {
        if (Math.random() > 0.3) {
            const totalItems = 5 + Math.floor(Math.random() * 4); // 5-8 exercises
            const completedItems = Math.floor(totalItems * (0.6 + Math.random() * 0.4)); // 60-100% completion
            
            const exercises = [];
            const exerciseNames = [
                'Warm-up: Dynamic stretching',
                'Squats',
                'Push-ups',
                'Lunges',
                'Plank hold',
                'Mountain climbers',
                'Burpees',
                'Cool-down stretches'
            ];
            
            for (let i = 0; i < totalItems; i++) {
                exercises.push({
                    exercise: exerciseNames[i % exerciseNames.length] + ` - Set ${Math.floor(i / exerciseNames.length) + 1}`,
                    completed: i < completedItems
                });
            }
            
            const coachNotes = [
                'Great session! Form improved significantly. Focus on breathing during heavy lifts.',
                'Excellent progress this week. Ready to increase weights next session.',
                'Good effort today. Remember to stay hydrated between sets.',
                'Strong performance! Core stability has improved noticeably.',
                'Nice work maintaining form under fatigue. Keep it up!',
                ''
            ];
            
            sessions.push({
                id: `test-session-${index}`,
                bookingId: booking.id,
                userId: userId,
                userName: booking.userName,
                userEmail: booking.userEmail,
                coachId: booking.coachId,
                coachName: booking.coachName,
                goal: booking.goal,
                totalItems: totalItems,
                completedItems: completedItems,
                allExercises: exercises,
                coachNotes: coachNotes[Math.floor(Math.random() * coachNotes.length)],
                completedAt: booking.scheduledAt
            });
        }
    });
    
    return sessions;
}

/**
 * Generate user profile test data
 */
function generateUserProfileData(userId) {
    return {
        uid: userId,
        name: 'Test User',
        email: 'testuser@example.com',
        heightCm: 175,
        weightKg: 75,
        goal: 'weight_loss', // This affects goal progress display
        requirements: 'Home workouts preferred, no equipment, knee-friendly exercises',
        createdAt: getRelativeDate(90),
        updatedAt: getRelativeDate(0)
    };
}

/**
 * Main seeding function - run this in browser console
 */
async function seedAnalyticsTestData() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase not found. Make sure you are on the app page and signed in.');
        return;
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ No user signed in. Please sign in first.');
        return;
    }
    
    const userId = user.uid;
    console.log(`🚀 Starting test data seeding for user: ${userId}`);
    
    try {
        // 1. Create test coaches
        console.log('📝 Creating test coaches...');
        for (const coach of TEST_DATA_CONFIG.coaches) {
            await db.collection('coaches').doc(coach.id).set(coach);
        }
        console.log(`✅ Created ${TEST_DATA_CONFIG.coaches.length} test coaches`);
        
        // 2. Update user profile
        console.log('📝 Updating user profile...');
        const userProfile = generateUserProfileData(userId);
        await db.collection('users').doc(userId).set(userProfile, { merge: true });
        console.log('✅ User profile updated');
        
        // 3. Create bookings
        console.log('📝 Creating test bookings...');
        const bookings = generateBookingsData(userId);
        for (const booking of bookings) {
            await db.collection('bookings').doc(booking.id).set({
                ...booking,
                scheduledAt: firebase.firestore.Timestamp.fromDate(booking.scheduledAt),
                createdAt: firebase.firestore.Timestamp.fromDate(booking.createdAt)
            });
        }
        console.log(`✅ Created ${bookings.length} test bookings`);
        
        // 4. Create AI workouts
        console.log('📝 Creating test AI workouts...');
        const aiWorkouts = generateAiWorkoutsData(userId);
        for (const workout of aiWorkouts) {
            await db.collection('ai_workouts').doc(workout.id).set({
                ...workout,
                createdAt: firebase.firestore.Timestamp.fromDate(workout.createdAt)
            });
        }
        console.log(`✅ Created ${aiWorkouts.length} test AI workouts`);
        
        // 5. Create workout sessions
        console.log('📝 Creating test workout sessions...');
        const sessions = generateWorkoutSessionsData(userId, bookings);
        for (const session of sessions) {
            await db.collection('workoutSessions').doc(session.id).set({
                ...session,
                completedAt: firebase.firestore.Timestamp.fromDate(session.completedAt)
            });
        }
        console.log(`✅ Created ${sessions.length} test workout sessions`);
        
        console.log('\n🎉 Test data seeding complete!');
        console.log('📊 Refresh the page or click "Refresh" on Analytics to see the data.');
        console.log('\n📈 Summary:');
        console.log(`   - Coaches: ${TEST_DATA_CONFIG.coaches.length}`);
        console.log(`   - Bookings: ${bookings.length}`);
        console.log(`   - AI Workouts: ${aiWorkouts.length}`);
        console.log(`   - Workout Sessions: ${sessions.length}`);
        
        return { bookings, aiWorkouts, sessions };
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    }
}

/**
 * Clear all test data - run this to clean up
 */
async function clearAnalyticsTestData() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase not found.');
        return;
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    const user = auth.currentUser;
    
    if (!user) {
        console.error('❌ No user signed in.');
        return;
    }
    
    const userId = user.uid;
    console.log(`🧹 Clearing test data for user: ${userId}`);
    
    try {
        // Delete test coaches
        console.log('🗑️ Deleting test coaches...');
        for (const coach of TEST_DATA_CONFIG.coaches) {
            await db.collection('coaches').doc(coach.id).delete();
        }
        
        // Delete test bookings (those with 'test-' prefix)
        console.log('🗑️ Deleting test bookings...');
        const bookingsSnap = await db.collection('bookings')
            .where('userId', '==', userId)
            .get();
        for (const doc of bookingsSnap.docs) {
            if (doc.id.startsWith('test-')) {
                await doc.ref.delete();
            }
        }
        
        // Delete test AI workouts
        console.log('🗑️ Deleting test AI workouts...');
        const workoutsSnap = await db.collection('ai_workouts')
            .where('userId', '==', userId)
            .get();
        for (const doc of workoutsSnap.docs) {
            if (doc.id.startsWith('test-')) {
                await doc.ref.delete();
            }
        }
        
        // Delete test workout sessions
        console.log('🗑️ Deleting test workout sessions...');
        const sessionsSnap = await db.collection('workoutSessions')
            .where('userId', '==', userId)
            .get();
        for (const doc of sessionsSnap.docs) {
            if (doc.id.startsWith('test-')) {
                await doc.ref.delete();
            }
        }
        
        console.log('✅ Test data cleared successfully!');
        console.log('📊 Refresh the page to see the updated analytics.');
        
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        throw error;
    }
}

// Export for use
console.log('📊 Analytics Test Data Seeder loaded!');
console.log('');
console.log('Available commands:');
console.log('  seedAnalyticsTestData()  - Populate test data');
console.log('  clearAnalyticsTestData() - Remove test data');
console.log('');

