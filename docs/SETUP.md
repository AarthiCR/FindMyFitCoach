# Quick Setup Guide - FindMyFitCoach

This guide will get you up and running in 10 minutes!

## Step 1: Get Your API Keys (5 minutes)

### Google Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Get API Key" or "Create API Key"
3. Copy the key (starts with "AIza...")
4. Save it somewhere safe

### Firebase Setup
1. Go to: https://console.firebase.google.com/
2. Click "Create a project" or select existing project
3. Enter project name: `find-my-fit-coach`
4. Follow the prompts (Google Analytics optional)

## Step 2: Enable Firebase Services (3 minutes)

### Enable Authentication
1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Click "Google" provider
5. Toggle "Enable"
6. Select support email
7. Click "Save"

### Create Firestore Database
1. Click "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your region (closest to you)
5. Click "Enable"

## Step 3: Configure Your App (2 minutes)

### Get Firebase Config
1. In Firebase Console, click the gear icon ⚙️ (Settings)
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon "</>" to create a web app
5. Enter app nickname: `FindMyFitCoach`
6. Don't check "Firebase Hosting"
7. Click "Register app"
8. Copy the `firebaseConfig` object

### Update config.js
1. Open `config.js` in your project
2. Replace the `firebaseConfig` values with yours
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your Gemini API key
4. Save the file

Example:
```javascript
export const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_FIREBASE_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

export const geminiApiKey = "AIzaSy...your-actual-gemini-key";
```

## Step 4: Add Sample Data (3 minutes)

### Option A: Manual (Easier)
1. In Firebase Console, go to Firestore Database
2. Click "Start collection"
3. Collection ID: `coaches`
4. Click "Next"
5. Click "Add document"
6. Document ID: (auto-generate)
7. Add these fields:

```
name: "Sarah Johnson" (string)
bio: "Certified personal trainer..." (string)
specializations: ["weight_loss", "general_fitness"] (array)
yearsExperience: 8 (number)
hourlyRate: 3000 (number)
rating: 4.9 (number)
```

8. Click "Save"
9. Repeat for more coaches (see sample-data.js for examples)
10. Create another collection: `workouts` and add sample workouts

### Option B: Quick (Recommended)
1. Copy data from `sample-data.js`
2. In Firestore Console, use "Import" feature
3. Or use the Firebase Admin SDK script (see sample-data.js)

## Step 5: Run the App (1 minute)

### Option 1: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"
4. Browser opens automatically

### Option 2: Python HTTP Server
```powershell
python -m http.server 8000
```
Then open: http://localhost:8000

### Option 3: Node.js HTTP Server
```powershell
npx http-server -p 8000
```
Then open: http://localhost:8000

## Step 6: Test the App

1. Click "Sign in with Google"
2. Select your Google account
3. Fill in your profile:
   - Height: e.g., 175 cm
   - Weight: e.g., 70 kg
   - Goal: Select "Weight loss"
   - Requirements: "Home workouts only"
4. Click "Save Profile"
5. Click "Generate My Workout"
6. Wait 5-10 seconds for AI to generate your workout
7. Scroll down to see AI-matched coaches
8. Click "Book" on any coach to test booking

## Troubleshooting

### "Failed to generate workout"
- Check if Gemini API key is correct in config.js
- Make sure you copied the full key (starts with AIza)
- Check browser console for specific errors
- Verify your profile is saved (height, weight, goal filled)

### "Sign in failed"
- Verify Firebase config is correct in config.js
- Check if Google Auth is enabled in Firebase Console
- Try a different browser or incognito mode
- Make sure localhost is in authorized domains (Firebase > Authentication > Settings)

### "No coaches found"
- Add sample coaches to Firestore (see Step 4)
- Check Firestore rules allow read access
- Verify coaches have 'specializations' array field

### AI Match doesn't show scores
- This is normal if there's an error
- Check browser console for AI errors
- The coaches will still display, just without AI scores
- Verify Gemini API key has proper permissions

## Next Steps

1. ✅ Customize your profile
2. ✅ Generate multiple workouts
3. ✅ Browse coaches
4. ✅ Test booking system
5. 📖 Read the full README.md for advanced features
6. 🎨 Customize the styling
7. 🚀 Deploy to Firebase Hosting (optional)

## Quick Reference

### Important URLs
- Firebase Console: https://console.firebase.google.com/
- Google AI Studio: https://makersuite.google.com/
- Application: http://localhost:8000 (when running locally)

### Important Files
- `config.js` - API keys and Firebase config
- `index.html` - Main UI
- `main.js` - Application logic
- `ai-service.js` - AI integration
- `sample-data.js` - Sample coaches and workouts

### Firebase Collections
- `users` - User profiles (auto-created on first login)
- `coaches` - Coach profiles (add manually)
- `workouts` - Workout library (add manually)
- `bookings` - User bookings (created when users book)
- `ai_workouts` - AI-generated workouts (auto-created)

## Support

Need help? Check:
1. Browser console (F12) for error messages
2. Firebase Console > Firestore for data
3. README.md for detailed documentation
4. Sample files for reference data

---

**You're all set! Enjoy your AI-powered fitness journey! 💪**
