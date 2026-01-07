# Test Data Seeder

This folder contains tools to seed test data for the FindMyFitCoach analytics system.

## Quick Start

### 1. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file
6. Save it as `service-account.json` in this folder

### 2. Install Dependencies

```powershell
cd test-data
npm install
```

### 3. Run the Seeder

```powershell
# Seed all test data (recommended)
npm run seed

# Or seed specific data
npm run seed:user    # Only user analytics data
npm run seed:coach   # Only coach analytics data

# Clear all test data
npm run clear

# Show help
npm run help
```

## What Gets Created

### User Analytics Data
| Collection | Records | Description |
|------------|---------|-------------|
| `coaches` | 7 | Test coach profiles |
| `bookings` | ~60-80 | User's coaching session bookings |
| `ai_workouts` | ~35-50 | AI-generated workout plans |
| `workoutSessions` | ~20-25 | Completed session records |

### Coach Analytics Data
| Collection | Records | Description |
|------------|---------|-------------|
| `users` (fake clients) | 12 | Simulated client profiles |
| `bookings` | ~100-130 | Client bookings to coaches |
| `workoutSessions` | ~40-55 | Coach session records |

### Total: ~280-350 test records

## Test Accounts

### Test User
- **User ID**: `test-user-main`
- **Email**: `testuser@findmyfitcoach.com`

### Test Coaches
| Name | Email | Specialization | Rate |
|------|-------|----------------|------|
| Sarah Johnson | sarah@fitcoach.com | Weight Loss, HIIT | ₹2,500/hr |
| Mike Chen | mike@fitcoach.com | Muscle Gain, CrossFit | ₹2,200/hr |
| Emma Williams | emma@fitcoach.com | Yoga, Pilates | ₹1,800/hr |
| Raj Patel | raj@fitcoach.com | Endurance, Cardio | ₹1,600/hr |
| Lisa Martinez | lisa@fitcoach.com | General Fitness | ₹2,000/hr |
| David Kim | david@fitcoach.com | HIIT, Sports | ₹2,400/hr |
| Anna Schmidt | anna@fitcoach.com | Rehabilitation | ₹2,100/hr |

## Data Patterns

The seeder creates realistic patterns for analytics testing:

### Growth Trend
- More bookings in recent months (simulates business growth)
- Older months have 40-60% fewer records

### Activity Streak
- Last 5 days have consistent activity (for streak calculation)
- Random gaps in days 6-7

### Peak Hours
- Sessions clustered around 6-10 AM and 5-9 PM
- Matches realistic workout patterns

### Completion Rates
- 60-95% exercise completion per session
- Varies by session to show realistic averages

### Client Retention
- Some clients have 1 session (new)
- Most clients have 3-8 sessions (retained)
- 1 inactive client (for "needs attention" alert)

## Configuration

Edit `seed.js` to customize:

```javascript
const CONFIG = {
    testUserId: 'test-user-main',
    testUserEmail: 'testuser@findmyfitcoach.com',
    monthsOfHistory: 6,
    bookingsPerMonth: { min: 8, max: 15 },
    // ... more options
};
```

## Clearing Data

All test documents have IDs prefixed with `test-`. To clear:

```powershell
npm run clear
```

This only removes documents with `test-` prefix, preserving real data.

## Troubleshooting

### "service-account.json not found"
- Make sure you downloaded the service account key from Firebase Console
- Save it as exactly `service-account.json` in this folder

### "Permission denied"
- Your service account might not have write permissions
- Go to Firebase Console → IAM & Admin → ensure the service account has "Editor" role

### "Module not found"
- Run `npm install` first
- Make sure you're in the `test-data` folder

## Files

```
test-data/
├── package.json           # NPM configuration
├── seed.js                # Main seeder script (Admin SDK)
├── seed-analytics-esm.js  # Browser console version (legacy)
├── service-account.json   # YOUR Firebase service account (not committed)
├── sample-data-structure.json
└── README.md              # This file
```

## Security Note

⚠️ **Never commit `service-account.json` to version control!**

The `.gitignore` file should already exclude it. This file contains sensitive credentials that grant full access to your Firebase project.
