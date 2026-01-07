/**
 * Create Firebase Auth Test Users
 * 
 * This script creates test user accounts in Firebase Authentication
 * so you can log in with email/password for testing.
 * 
 * RUN: node create-auth-users.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test password for all accounts
const TEST_PASSWORD = 'test123456';

// Test users to create
const TEST_USERS = [
    // Main test user
    {
        uid: 'test-user-main',
        email: 'testuser@findmyfitcoach.com',
        displayName: 'Test User',
        password: TEST_PASSWORD,
        type: 'user'
    },
    // Test coaches (matching seed.js COACHES)
    {
        uid: 'test-coach-sarah',
        email: 'sarah@fitcoach.com',
        displayName: 'Sarah Johnson',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    {
        uid: 'test-coach-mike',
        email: 'mike@fitcoach.com',
        displayName: 'Mike Chen',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    {
        uid: 'test-coach-emma',
        email: 'emma@fitcoach.com',
        displayName: 'Emma Williams',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    {
        uid: 'test-coach-raj',
        email: 'raj@fitcoach.com',
        displayName: 'Raj Patel',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    {
        uid: 'test-coach-lisa',
        email: 'lisa@fitcoach.com',
        displayName: 'Lisa Martinez',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    {
        uid: 'test-coach-david',
        email: 'david@fitcoach.com',
        displayName: 'David Kim',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    {
        uid: 'test-coach-anna',
        email: 'anna@fitcoach.com',
        displayName: 'Anna Schmidt',
        password: TEST_PASSWORD,
        type: 'coach'
    },
    // Additional test clients (for coach analytics)
    {
        uid: 'test-client-john',
        email: 'john.smith@email.com',
        displayName: 'John Smith',
        password: TEST_PASSWORD,
        type: 'user'
    },
    {
        uid: 'test-client-jane',
        email: 'jane.doe@email.com',
        displayName: 'Jane Doe',
        password: TEST_PASSWORD,
        type: 'user'
    }
];

// Initialize Firebase Admin
function initializeFirebase() {
    const serviceAccountPath = join(__dirname, 'service-account.json');
    
    if (!existsSync(serviceAccountPath)) {
        console.error('\n❌ ERROR: service-account.json not found!');
        console.log('\n📋 SETUP INSTRUCTIONS:');
        console.log('   1. Go to Firebase Console: https://console.firebase.google.com');
        console.log('   2. Select your project');
        console.log('   3. Go to Project Settings → Service Accounts');
        console.log('   4. Click "Generate new private key"');
        console.log('   5. Save the downloaded file as "service-account.json" in this folder\n');
        process.exit(1);
    }

    try {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        initializeApp({
            credential: cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin initialized');
        console.log(`   Project: ${serviceAccount.project_id}\n`);
        
        return getAuth();
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        process.exit(1);
    }
}

async function createOrUpdateUser(auth, userData) {
    try {
        // Try to get existing user
        try {
            const existingUser = await auth.getUserByEmail(userData.email);
            console.log(`   ⏭️  User exists: ${userData.email} (${existingUser.uid})`);
            
            // Update the user to ensure correct UID and display name
            await auth.updateUser(existingUser.uid, {
                displayName: userData.displayName,
                password: userData.password
            });
            console.log(`      Updated password and display name`);
            
            return { ...existingUser, updated: true };
        } catch (e) {
            if (e.code !== 'auth/user-not-found') {
                throw e;
            }
        }
        
        // Create new user
        const userRecord = await auth.createUser({
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            password: userData.password,
            emailVerified: true // Skip email verification for test accounts
        });
        
        console.log(`   ✅ Created: ${userData.email} (${userRecord.uid})`);
        return { ...userRecord, created: true };
        
    } catch (error) {
        if (error.code === 'auth/uid-already-exists') {
            console.log(`   ⚠️  UID conflict for ${userData.email}, creating with auto-generated UID`);
            
            const userRecord = await auth.createUser({
                email: userData.email,
                displayName: userData.displayName,
                password: userData.password,
                emailVerified: true
            });
            
            console.log(`   ✅ Created: ${userData.email} (${userRecord.uid})`);
            return { ...userRecord, created: true };
        }
        
        console.error(`   ❌ Failed to create ${userData.email}: ${error.message}`);
        return null;
    }
}

async function deleteTestUsers(auth) {
    console.log('\n🧹 Deleting existing test users...\n');
    
    let deleted = 0;
    
    for (const userData of TEST_USERS) {
        try {
            const user = await auth.getUserByEmail(userData.email);
            await auth.deleteUser(user.uid);
            console.log(`   🗑️  Deleted: ${userData.email}`);
            deleted++;
        } catch (e) {
            if (e.code !== 'auth/user-not-found') {
                console.error(`   ❌ Failed to delete ${userData.email}: ${e.message}`);
            }
        }
    }
    
    console.log(`\n   Deleted ${deleted} users\n`);
    return deleted;
}

async function main() {
    const args = process.argv.slice(2);
    const auth = initializeFirebase();
    
    if (args.includes('--delete')) {
        await deleteTestUsers(auth);
        return;
    }
    
    console.log('═'.repeat(55));
    console.log('🔐 Creating Firebase Auth Test Users');
    console.log('═'.repeat(55));
    console.log(`\n📋 Password for all accounts: ${TEST_PASSWORD}\n`);
    
    const users = [];
    const coaches = [];
    
    console.log('📝 Creating users...\n');
    
    for (const userData of TEST_USERS) {
        const result = await createOrUpdateUser(auth, userData);
        if (result) {
            if (userData.type === 'coach') {
                coaches.push(userData);
            } else {
                users.push(userData);
            }
        }
    }
    
    console.log('\n' + '═'.repeat(55));
    console.log('🎉 TEST USERS READY!');
    console.log('═'.repeat(55));
    
    console.log('\n📧 USER ACCOUNTS:');
    console.log('─'.repeat(40));
    users.forEach(u => {
        console.log(`   ${u.email}`);
        console.log(`   Password: ${TEST_PASSWORD}`);
        console.log('');
    });
    
    console.log('🏋️ COACH ACCOUNTS:');
    console.log('─'.repeat(40));
    coaches.forEach(c => {
        console.log(`   ${c.email}`);
    });
    console.log(`   Password (all): ${TEST_PASSWORD}\n`);
    
    console.log('💡 NEXT STEPS:');
    console.log('   1. Go to your app and select "Email & Password" login');
    console.log('   2. Use any of the above email/password combinations');
    console.log('   3. Run "npm run seed" to populate test data\n');
    
    console.log('🧹 To delete test users: node create-auth-users.js --delete\n');
}

main().catch(console.error);

