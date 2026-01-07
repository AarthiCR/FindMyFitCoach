/**
 * Analytics Test Data Seeder (User + Coach) - Enhanced Version
 * 
 * HOW TO USE:
 * 1. First deploy Firestore rules: firebase deploy --only firestore:rules
 * 2. Open your app in browser and SIGN IN (as user OR coach)
 * 3. Open DevTools (F12) → Console tab
 * 4. Type "allow pasting" and press Enter (if prompted)
 * 5. Copy ALL code below and paste into console
 * 6. Press Enter - it will run automatically
 * 7. Refresh your Analytics section to see data
 * 
 * This seeder creates comprehensive data for BOTH user analytics AND coach analytics!
 */

// Self-executing async function
(async () => {
    console.log('🚀 Analytics Test Data Seeder Starting...\n');

    // Import Firebase modules
    const { initializeApp, getApps, getApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
    const {
        getFirestore,
        doc,
        setDoc,
        getDoc,
        deleteDoc,
        collection,
        getDocs,
        Timestamp
    } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

    // Try to get existing Firebase app or create new one
    let app, db, auth;

    try {
        // Check if app already exists (from main.js)
        if (getApps().length > 0) {
            app = getApp();
            console.log('✅ Using existing Firebase app');
        } else {
            // Need to initialize - import config
            const configModule = await import('../../config/config.js');
            app = initializeApp(configModule.firebaseConfig);
            console.log('✅ Initialized new Firebase app');
        }

        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error('❌ Firebase initialization failed:', e.message);
        console.log('\n💡 Make sure you are on your app page (not a blank page)');
        return;
    }

    // Check for signed in user
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ No user signed in!');
        console.log('\n💡 Please sign in to your app first, then run this script again.');
        return;
    }

    const userId = user.uid;
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   User ID: ${userId}\n`);

    // Helper function to create timestamps
    const daysAgo = (days, hours = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        d.setHours(d.getHours() - hours);
        return Timestamp.fromDate(d);
    };

    // Helper to create timestamp at specific hour
    const daysAgoAtHour = (days, hour) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        return Timestamp.fromDate(d);
    };

    // Test data - Enhanced with more variety
    const coaches = [
        { id: 'test-coach-sarah', name: 'Sarah Johnson', email: 'sarah@test.com', specializations: ['weight_loss', 'hiit'], yearsExperience: 8, hourlyRate: 2500, rating: 4.9, bio: 'Weight loss specialist with 8 years of experience' },
        { id: 'test-coach-mike', name: 'Mike Chen', email: 'mike@test.com', specializations: ['muscle_gain', 'crossfit'], yearsExperience: 6, hourlyRate: 2000, rating: 4.7, bio: 'Certified strength and conditioning coach' },
        { id: 'test-coach-emma', name: 'Emma Williams', email: 'emma@test.com', specializations: ['yoga', 'pilates'], yearsExperience: 10, hourlyRate: 1800, rating: 4.8, bio: 'Mind-body wellness instructor' },
        { id: 'test-coach-raj', name: 'Raj Patel', email: 'raj@test.com', specializations: ['endurance', 'cardio'], yearsExperience: 5, hourlyRate: 1500, rating: 4.6, bio: 'Marathon runner and cardio specialist' },
        { id: 'test-coach-lisa', name: 'Lisa Martinez', email: 'lisa@test.com', specializations: ['general_fitness', 'nutrition'], yearsExperience: 7, hourlyRate: 2200, rating: 4.8, bio: 'Holistic fitness and nutrition coach' }
    ];

    const goals = ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness'];
    const workoutTypes = ['hiit', 'strength', 'cardio', 'yoga', 'pilates', 'crossfit', 'flexibility'];

    // Peak workout hours distribution (weighted towards common times)
    const peakHours = [6, 7, 8, 9, 17, 18, 19, 20]; // Morning and evening peaks
    const getRandomPeakHour = () => peakHours[Math.floor(Math.random() * peakHours.length)];

    let stats = {
        coaches: 0,
        bookings: 0,
        aiWorkouts: 0,
        sessions: 0,
        fakeClients: 0,
        coachBookings: 0,
        coachSessions: 0
    };

    try {
        // 1. Create test coaches
        console.log('📝 Creating test coaches...');
        for (const coach of coaches) {
            await setDoc(doc(db, 'coaches', coach.id), {
                ...coach,
                createdAt: daysAgo(180 + Math.floor(Math.random() * 30))
            });
            stats.coaches++;
        }
        console.log(`   ✓ ${stats.coaches} coaches created`);

        // 2. Update user profile with goal
        console.log('📝 Updating user profile...');
        await setDoc(doc(db, 'users', userId), {
            uid: userId,
            name: user.displayName || 'Test User',
            email: user.email,
            heightCm: 175,
            weightKg: 75,
            goal: 'weight_loss',
            requirements: 'Home workouts preferred, limited equipment',
            updatedAt: Timestamp.now()
        }, { merge: true });
        console.log('   ✓ Profile updated with goal: weight_loss');

        // 3. Create comprehensive bookings for 6 months with varied times
        console.log('📝 Creating test bookings...');

        // Monthly bookings (6 months back) - more bookings in recent months
        for (let month = 0; month < 6; month++) {
            // Increasing activity trend: older months have fewer sessions
            const baseCount = month === 0 ? 10 : Math.max(4, 12 - month * 1.5);
            const count = Math.floor(baseCount + Math.random() * 3);

            for (let i = 0; i < count; i++) {
                const coach = coaches[i % coaches.length];
                const dayOffset = month * 30 + Math.floor(Math.random() * 28);
                const hour = getRandomPeakHour();

                // More completed sessions in older months, some pending in current month
                let status;
                if (month === 0 && i < 3) {
                    status = 'pending';
                } else if (Math.random() > 0.12) {
                    status = 'completed';
                } else {
                    status = 'cancelled';
                }

                await setDoc(doc(db, 'bookings', `test-booking-${month}-${i}`), {
                    userId,
                    userEmail: user.email,
                    userName: user.displayName || 'Test User',
                    coachId: coach.id,
                    coachName: coach.name,
                    coachEmail: coach.email,
                    goal: goals[i % goals.length],
                    status,
                    duration: [45, 60, 60, 45][i % 4], // Session duration in minutes
                    scheduledAt: daysAgoAtHour(dayOffset, hour),
                    createdAt: daysAgo(dayOffset + 1),
                    meetingId: `mtg-${month}-${i}`,
                    meetingLink: `https://meet.jit.si/test-${month}-${i}`
                });
                stats.bookings++;
            }
        }

        // Recent bookings (last 7 days) for weekly chart - create activity streak
        for (let day = 0; day < 7; day++) {
            // Create 1-2 bookings most days (for streak effect)
            const sessionsToday = day < 5 ? Math.floor(1 + Math.random() * 2) : Math.floor(Math.random() * 2);

            for (let s = 0; s < sessionsToday; s++) {
                const coach = coaches[(day + s) % coaches.length];
                await setDoc(doc(db, 'bookings', `test-booking-recent-${day}-${s}`), {
                    userId,
                    userEmail: user.email,
                    userName: user.displayName || 'Test User',
                    coachId: coach.id,
                    coachName: coach.name,
                    coachEmail: coach.email,
                    goal: goals[day % goals.length],
                    status: day === 0 && s === 0 ? 'pending' : 'completed',
                    duration: [45, 60][s % 2],
                    scheduledAt: daysAgoAtHour(day, getRandomPeakHour()),
                    createdAt: daysAgo(day, 10),
                    meetingId: `mtg-recent-${day}-${s}`,
                    meetingLink: `https://meet.jit.si/recent-${day}-${s}`
                });
                stats.bookings++;
            }
        }
        console.log(`   ✓ ${stats.bookings} bookings created`);

        // 4. Create AI workouts with workout types
        console.log('📝 Creating test AI workouts...');
        const workoutTitles = [
            'Fat Burner HIIT Blast',
            'Strength Builder Pro',
            'Core Crusher Challenge',
            'Full Body Power',
            'Endurance Builder',
            'Yoga Flow Session',
            'Quick Cardio Burn',
            'Lower Body Sculpt'
        ];

        // Monthly AI workouts
        for (let month = 0; month < 6; month++) {
            // More AI workouts in recent months
            const count = Math.max(3, 7 - month);
            for (let i = 0; i < count; i++) {
                const dayOffset = month * 30 + Math.floor(Math.random() * 28);
                const wType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];

                await setDoc(doc(db, 'ai_workouts', `test-ai-workout-${month}-${i}`), {
                    userId,
                    workoutType: wType,
                    goal: goals[i % goals.length],
                    workout: {
                        title: workoutTitles[(month + i) % workoutTitles.length],
                        duration: 25 + Math.floor(Math.random() * 25),
                        intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
                        estimatedCalories: 150 + Math.floor(Math.random() * 250),
                        exercises: [
                            { name: 'Warm-up', sets: 1, reps: '5 min', completed: true },
                            { name: 'Squats', sets: 3, reps: '12', completed: true },
                            { name: 'Push-ups', sets: 3, reps: '10', completed: true },
                            { name: 'Lunges', sets: 3, reps: '10 each', completed: Math.random() > 0.3 },
                            { name: 'Plank', sets: 3, reps: '30 sec', completed: Math.random() > 0.3 },
                            { name: 'Cool-down', sets: 1, reps: '5 min', completed: true }
                        ],
                        equipmentNeeded: ['Yoga mat', 'Dumbbells (optional)'],
                        aiReasoning: 'Personalized based on your weight loss goal and available equipment'
                    },
                    createdAt: daysAgo(dayOffset)
                });
                stats.aiWorkouts++;
            }
        }

        // Recent AI workouts for streak (last 7 days)
        for (let day = 0; day < 7; day++) {
            // Create AI workouts on days without coach sessions (or in addition)
            if (Math.random() > 0.25) {
                await setDoc(doc(db, 'ai_workouts', `test-ai-workout-recent-${day}`), {
                    userId,
                    workoutType: workoutTypes[day % workoutTypes.length],
                    goal: goals[day % goals.length],
                    workout: {
                        title: workoutTitles[day % workoutTitles.length],
                        duration: 30 + Math.floor(Math.random() * 15),
                        intensity: 'moderate',
                        estimatedCalories: 200 + Math.floor(Math.random() * 100),
                        exercises: [
                            { name: 'Quick Cardio', sets: 2, reps: '5 min', completed: true },
                            { name: 'Mixed Exercises', sets: 3, reps: '10', completed: true }
                        ],
                        equipmentNeeded: ['None']
                    },
                    createdAt: daysAgoAtHour(day, 8 + Math.floor(Math.random() * 4))
                });
                stats.aiWorkouts++;
            }
        }
        console.log(`   ✓ ${stats.aiWorkouts} AI workouts created`);

        // 5. Create workout sessions (from coach bookings)
        console.log('📝 Creating workout sessions...');
        for (let i = 0; i < 18; i++) {
            const coach = coaches[i % coaches.length];
            const dayOffset = Math.floor(i * 3) + Math.floor(Math.random() * 2);
            const total = 5 + Math.floor(Math.random() * 4);
            const completed = Math.floor(total * (0.65 + Math.random() * 0.35));
            const duration = [45, 60, 45, 60, 50][i % 5];

            await setDoc(doc(db, 'workoutSessions', `test-session-${i}`), {
                bookingId: `test-booking-${Math.floor(i / 4)}-${i % 4}`,
                userId,
                userName: user.displayName || 'Test User',
                userEmail: user.email,
                coachId: coach.id,
                coachName: coach.name,
                goal: goals[i % goals.length],
                totalItems: total,
                completedItems: completed,
                duration,
                allExercises: Array.from({ length: total }, (_, j) => ({
                    exercise: ['Warm-up', 'Squats', 'Deadlifts', 'Bench Press', 'Rows', 'Lunges', 'Plank', 'Cool-down'][j % 8],
                    completed: j < completed,
                    sets: 3,
                    reps: j === 0 || j === total - 1 ? '5 min' : '10-12'
                })),
                coachNotes: i % 3 === 0 ? 'Great session! Form is improving.' : (i % 3 === 1 ? 'Increase weight next session.' : ''),
                completedAt: daysAgo(dayOffset)
            });
            stats.sessions++;
        }
        console.log(`   ✓ ${stats.sessions} workout sessions created`);

        // ========================================
        // 6. COACH ANALYTICS DATA
        // ========================================
        console.log('\n📝 Creating coach analytics data...');

        // Create multiple fake users/clients for coach analytics
        const fakeClients = [
            { id: 'test-client-john', name: 'John Smith', email: 'john@test.com', goal: 'muscle_gain' },
            { id: 'test-client-jane', name: 'Jane Doe', email: 'jane@test.com', goal: 'weight_loss' },
            { id: 'test-client-bob', name: 'Bob Wilson', email: 'bob@test.com', goal: 'endurance' },
            { id: 'test-client-alice', name: 'Alice Brown', email: 'alice@test.com', goal: 'general_fitness' },
            { id: 'test-client-charlie', name: 'Charlie Davis', email: 'charlie@test.com', goal: 'weight_loss' },
            { id: 'test-client-diana', name: 'Diana Lee', email: 'diana@test.com', goal: 'muscle_gain' },
            { id: 'test-client-evan', name: 'Evan Rogers', email: 'evan@test.com', goal: 'endurance' },
            { id: 'test-client-fiona', name: 'Fiona Grant', email: 'fiona@test.com', goal: 'general_fitness' },
            { id: 'test-client-george', name: 'George Kim', email: 'george@test.com', goal: 'weight_loss' },
            { id: 'test-client-inactive', name: 'Hannah (Inactive)', email: 'hannah@test.com', goal: 'weight_loss' }
        ];

        // Create fake client profiles
        for (const client of fakeClients) {
            await setDoc(doc(db, 'users', client.id), {
                uid: client.id,
                name: client.name,
                email: client.email,
                heightCm: 160 + Math.floor(Math.random() * 25),
                weightKg: 55 + Math.floor(Math.random() * 35),
                goal: client.goal,
                requirements: 'Test client for analytics',
                createdAt: daysAgo(90 + Math.floor(Math.random() * 60))
            });
            stats.fakeClients++;
        }
        console.log(`   ✓ ${stats.fakeClients} fake clients created`);

        // Create bookings FROM clients TO coaches (shows in coach analytics)
        // More bookings in recent months (growth pattern)
        for (let month = 0; month < 6; month++) {
            // Growth pattern: fewer in old months, more in recent
            const baseBookings = month === 0 ? 20 : 25 - (month * 3);
            const bookingsThisMonth = Math.max(8, baseBookings + Math.floor(Math.random() * 5));

            for (let i = 0; i < bookingsThisMonth; i++) {
                // Exclude inactive client from regular bookings
                const clientIdx = i % (fakeClients.length - 1);
                const client = fakeClients[clientIdx];
                const coach = coaches[i % coaches.length];
                const dayOffset = month * 30 + Math.floor(Math.random() * 28);
                const hour = getRandomPeakHour();

                let status;
                if (month === 0 && i < 4) {
                    status = 'pending';
                } else if (Math.random() > 0.10) {
                    status = 'completed';
                } else {
                    status = 'cancelled';
                }

                await setDoc(doc(db, 'bookings', `test-coach-booking-${month}-${i}`), {
                    userId: client.id,
                    userEmail: client.email,
                    userName: client.name,
                    coachId: coach.id,
                    coachName: coach.name,
                    coachEmail: coach.email,
                    goal: client.goal,
                    status,
                    duration: [45, 60, 60, 45, 50][i % 5],
                    scheduledAt: daysAgoAtHour(dayOffset, hour),
                    createdAt: daysAgo(dayOffset + 1),
                    meetingId: `coach-mtg-${month}-${i}`,
                    meetingLink: `https://meet.jit.si/coach-test-${month}-${i}`
                });
                stats.coachBookings++;
            }
        }

        // Add recent bookings for coach weekly chart (last 7 days)
        for (let day = 0; day < 7; day++) {
            // 2-4 sessions per day for coaches
            const sessionsToday = 2 + Math.floor(Math.random() * 3);

            for (let s = 0; s < sessionsToday; s++) {
                const clientIdx = (day + s) % (fakeClients.length - 1);
                const client = fakeClients[clientIdx];
                const coachIdx = (day + s) % coaches.length;
                const coach = coaches[coachIdx];

                await setDoc(doc(db, 'bookings', `test-coach-recent-${day}-${s}`), {
                    userId: client.id,
                    userEmail: client.email,
                    userName: client.name,
                    coachId: coach.id,
                    coachName: coach.name,
                    coachEmail: coach.email,
                    goal: client.goal,
                    status: 'completed',
                    duration: [45, 60][s % 2],
                    scheduledAt: daysAgoAtHour(day, getRandomPeakHour()),
                    createdAt: daysAgo(day, 14),
                    meetingId: `coach-recent-${day}-${s}`,
                    meetingLink: `https://meet.jit.si/recent-${day}-${s}`
                });
                stats.coachBookings++;
            }
        }
        console.log(`   ✓ ${stats.coachBookings} coach bookings created`);

        // Create workout sessions for coaches (with completion and notes data)
        const coachNotes = [
            'Excellent form today! Increased weight on squats.',
            'Good session. Focus on core engagement next time.',
            'Great progress on endurance. Keep up the consistency!',
            'Worked on flexibility. Hip mobility improving.',
            'Strong finish! Ready to increase intensity.',
            'Focused on technique today. Perfect for recovery.',
            '',
            'Discussed nutrition goals. Making good dietary changes.',
            'New personal best on deadlifts! 💪',
            ''
        ];

        for (let i = 0; i < 35; i++) {
            const clientIdx = i % (fakeClients.length - 1);
            const client = fakeClients[clientIdx];
            const coachIdx = i % coaches.length;
            const coach = coaches[coachIdx];
            const dayOffset = Math.floor(i * 2) + Math.floor(Math.random() * 2);
            const total = 5 + Math.floor(Math.random() * 4);
            const completed = Math.floor(total * (0.60 + Math.random() * 0.40));
            const duration = [45, 60, 50, 55, 60][i % 5];

            await setDoc(doc(db, 'workoutSessions', `test-coach-session-${i}`), {
                bookingId: `test-coach-booking-${Math.floor(i / 6)}-${i % 6}`,
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
                    exercise: ['Warm-up', 'Squats', 'Push-ups', 'Lunges', 'Plank', 'Burpees', 'Deadlifts', 'Cool-down'][j % 8],
                    completed: j < completed,
                    sets: 3,
                    reps: j === 0 || j === total - 1 ? '5 min' : '10-12'
                })),
                coachNotes: coachNotes[i % coachNotes.length],
                completedAt: daysAgo(dayOffset)
            });
            stats.coachSessions++;
        }
        console.log(`   ✓ ${stats.coachSessions} coach workout sessions created`);

        // Add bookings for the "inactive" client (triggers attention alerts)
        const inactiveClient = fakeClients[fakeClients.length - 1];
        for (let i = 0; i < 4; i++) {
            const coach = coaches[i % coaches.length];
            await setDoc(doc(db, 'bookings', `test-inactive-booking-${i}`), {
                userId: inactiveClient.id,
                userEmail: inactiveClient.email,
                userName: inactiveClient.name,
                coachId: coach.id,
                coachName: coach.name,
                coachEmail: coach.email,
                goal: inactiveClient.goal,
                status: 'completed',
                duration: 45,
                scheduledAt: daysAgo(18 + i * 4), // 18-30 days ago (inactive threshold is 14 days)
                createdAt: daysAgo(19 + i * 4),
                meetingId: `inactive-mtg-${i}`,
                meetingLink: `https://meet.jit.si/inactive-${i}`
            });
            stats.coachBookings++;
        }
        console.log('   ✓ Created inactive client data (for attention alerts)');

        // ========================================
        // Success Summary
        // ========================================
        console.log('\n' + '═'.repeat(55));
        console.log('🎉 TEST DATA SEEDING COMPLETE!');
        console.log('═'.repeat(55));
        console.log('\n📊 USER ANALYTICS DATA:');
        console.log(`   • Bookings: ${stats.bookings}`);
        console.log(`   • AI Workouts: ${stats.aiWorkouts}`);
        console.log(`   • Workout Sessions: ${stats.sessions}`);
        console.log('\n📊 COACH ANALYTICS DATA:');
        console.log(`   • Test Coaches: ${stats.coaches}`);
        console.log(`   • Fake Clients: ${stats.fakeClients}`);
        console.log(`   • Client Bookings: ${stats.coachBookings}`);
        console.log(`   • Client Sessions: ${stats.coachSessions}`);

        const totalRecords = stats.bookings + stats.aiWorkouts + stats.sessions +
            stats.coaches + stats.fakeClients + stats.coachBookings + stats.coachSessions;
        console.log(`\n   📈 Total records created: ${totalRecords}`);

        console.log('\n👉 NEXT STEPS:');
        console.log('   1. Refresh your page (or click Analytics refresh button)');
        console.log('   2. Check the Analytics section for user data');
        console.log('   3. Sign in as a coach to see coach analytics');
        console.log('\n💡 TEST COACH EMAILS (use any for coach login):');
        coaches.forEach(c => console.log(`   • ${c.email}`));
        console.log('\n🧹 To CLEAR all test data, run: clearTestData()');

        // Define global clear function
        window.clearTestData = async () => {
            console.log('🧹 Clearing ALL test data...');

            let deleted = { coaches: 0, clients: 0, bookings: 0, workouts: 0, sessions: 0 };

            // Delete test coaches
            for (const c of coaches) {
                try { await deleteDoc(doc(db, 'coaches', c.id)); deleted.coaches++; } catch { }
            }
            console.log(`   ✓ ${deleted.coaches} coaches deleted`);

            // Delete fake clients
            for (const client of fakeClients) {
                try { await deleteDoc(doc(db, 'users', client.id)); deleted.clients++; } catch { }
            }
            console.log(`   ✓ ${deleted.clients} fake clients deleted`);

            // Delete test bookings
            const bSnap = await getDocs(collection(db, 'bookings'));
            for (const d of bSnap.docs) {
                if (d.id.startsWith('test-')) {
                    await deleteDoc(d.ref);
                    deleted.bookings++;
                }
            }
            console.log(`   ✓ ${deleted.bookings} test bookings deleted`);

            // Delete AI workouts
            const wSnap = await getDocs(collection(db, 'ai_workouts'));
            for (const d of wSnap.docs) {
                if (d.id.startsWith('test-')) {
                    await deleteDoc(d.ref);
                    deleted.workouts++;
                }
            }
            console.log(`   ✓ ${deleted.workouts} test AI workouts deleted`);

            // Delete test sessions
            const sSnap = await getDocs(collection(db, 'workoutSessions'));
            for (const d of sSnap.docs) {
                if (d.id.startsWith('test-')) {
                    await deleteDoc(d.ref);
                    deleted.sessions++;
                }
            }
            console.log(`   ✓ ${deleted.sessions} test sessions deleted`);

            const totalDeleted = deleted.coaches + deleted.clients + deleted.bookings + deleted.workouts + deleted.sessions;
            console.log(`\n✅ Cleared ${totalDeleted} test records! Refresh the page.`);
        };

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
        console.log('\n💡 TROUBLESHOOTING:');
        console.log('   1. Make sure you are signed in');
        console.log('   2. Deploy Firestore rules: firebase deploy --only firestore:rules');
        console.log('   3. Check the error message above for specific issues');
        console.log('   4. Try running clearTestData() first if data exists');
    }
})();
