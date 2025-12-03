# FindMyFitCoach - AI-Powered Fitness Platform

An AI-driven web platform that connects busy individuals and fitness-conscious users with certified coaches for on-demand sessions. The system uses Google's Gemini AI to create personalized daily workouts based on user goals, fitness level, and availability.

## 🌟 Key Features

### AI-Powered Features
- **🤖 Personalized Workout Generation**: Uses Google Gemini AI to create custom daily workouts tailored to:
  - User's height, weight, and BMI
  - Fitness goals (weight loss, muscle gain, endurance, general fitness)
  - Personal constraints and requirements
  - Fitness level assessment
  
- **🎯 Intelligent Coach Matching**: AI analyzes user profiles and provides:
  - Match scores (0-100%) for each coach
  - Detailed reasoning for recommendations
  - Key strengths highlighting
  - Suggested focus areas

- **📊 Smart Session Recommendations**: AI suggests optimal:
  - Session types and focus areas
  - Duration and intensity levels
  - Expected benefits
  - Priority ranking

- **📈 Progress Analysis**: Adaptive recommendations based on:
  - Workout history
  - Progress metrics
  - Achievement tracking
  - Motivational insights

### Core Platform Features
- **🔐 Google Authentication**: Secure sign-in with Firebase
- **👤 User Profiles**: Comprehensive health and fitness profiles
- **💪 Workout Library**: Browse and filter workout suggestions
- **👨‍🏫 Coach Directory**: Find coaches by specialization
- **📅 Booking System**: Schedule virtual or in-person sessions
- **📱 Responsive Design**: Works seamlessly on all devices
- **🌙 Dark Mode**: Automatic dark/light theme support

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (free tier works)
- Google Gemini API key (free tier available)

### Setup Instructions

#### 1. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Google Authentication**:
   - Go to Authentication > Sign-in method
   - Enable Google provider
4. Create a **Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode
   - Start in test mode for development

5. Get your Firebase config:
   - Go to Project Settings > Your apps
   - Copy the Firebase configuration

#### 2. Google Gemini AI Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key or use existing one
4. Copy the API key

#### 3. Configure the Application
1. Open `config.js`
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key:
```javascript
export const geminiApiKey = "YOUR_ACTUAL_API_KEY_HERE";
```

#### 4. Firestore Database Structure

Create these collections in Firestore:

**users** collection:
```javascript
{
  uid: "user_id",
  name: "User Name",
  email: "user@example.com",
  heightCm: 175,
  weightKg: 70,
  goal: "weight_loss",
  requirements: "Home workouts only",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**coaches** collection:
```javascript
{
  name: "Coach Name",
  bio: "Experienced fitness coach...",
  specializations: ["weight_loss", "muscle_gain"],
  yearsExperience: 5,
  hourlyRate: 2000,
  rating: 4.8
}
```

**workouts** collection:
```javascript
{
  title: "Full Body HIIT",
  description: "High intensity workout...",
  intensity: "high",
  durationMins: 30,
  goals: ["weight_loss", "endurance"],
  popularity: 100
}
```

**bookings** collection:
```javascript
{
  userId: "user_id",
  coachId: "coach_id",
  coachName: "Coach Name",
  goal: "weight_loss",
  status: "pending",
  scheduledAt: timestamp,
  createdAt: timestamp
}
```

**ai_workouts** collection (auto-created):
```javascript
{
  userId: "user_id",
  workout: { /* AI generated workout object */ },
  createdAt: timestamp
}
```

#### 5. Run the Application

**Option 1: Local Development Server**
```powershell
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using VS Code Live Server extension
# Right-click index.html > Open with Live Server
```

**Option 2: Deploy to Firebase Hosting**
```powershell
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy
```

Then open `http://localhost:8000` in your browser.

## 🎯 How to Use

### For Users

1. **Sign In**
   - Click "Sign in with Google"
   - Authorize the application

2. **Complete Your Profile**
   - Enter height and weight
   - Select your fitness goal
   - Add any requirements or constraints
   - Click "Save Profile"

3. **Generate AI Workout**
   - Click "Generate My Workout" button
   - AI will create a personalized daily workout plan
   - View exercises, duration, intensity, and equipment needed

4. **Find Coaches**
   - Browse AI-matched coaches
   - View match scores and reasoning
   - See coach specializations and experience

5. **Book Sessions**
   - Click "Book" on any coach
   - Select date and time
   - Confirm booking

6. **Track Bookings**
   - View all your bookings
   - See scheduled times
   - Cancel if needed

### For Coaches (Admin Setup Required)

Add coach profiles to Firestore manually or via admin panel:

```javascript
// Example coach document
{
  name: "Sarah Johnson",
  bio: "Certified personal trainer with 8 years of experience specializing in weight loss and functional fitness.",
  specializations: ["weight_loss", "general_fitness"],
  yearsExperience: 8,
  hourlyRate: 3000,
  rating: 4.9
}
```

## 🤖 AI Features Deep Dive

### Workout Generation Algorithm

The AI considers:
- **Anthropometrics**: Height, weight, BMI calculation
- **Goals**: Specific training objectives
- **Constraints**: Equipment availability, space, injuries
- **Fitness Level**: Automatic assessment based on profile
- **Progressive Overload**: Appropriate intensity for user

Output includes:
- Complete exercise list with sets/reps/duration
- Warmup and cooldown routines
- Calorie estimates
- Equipment requirements
- Reasoning for workout selection

### Coach Matching Algorithm

The AI evaluates:
- **Specialization Alignment**: Coach expertise vs user goals
- **Experience Level**: Years of experience and ratings
- **User Requirements**: Special needs or constraints
- **Success Indicators**: Historical performance metrics

Provides:
- Match score (0-100%)
- Detailed reasoning
- Key strengths
- Suggested focus areas

## 🛠️ Technology Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore)
- **AI**: Google Gemini 1.5 Flash API
- **Hosting**: Firebase Hosting (recommended)
- **Auth**: Google OAuth 2.0

## 📊 Database Indexes (Firestore)

Create these composite indexes in Firestore:

```javascript
// workouts collection
fields: ["goals", "popularity"]
query scopes: Collection

// coaches collection
fields: ["specializations", "rating"]
query scopes: Collection

// bookings collection
fields: ["userId", "createdAt"]
query scopes: Collection
```

## 🔒 Security Considerations

1. **API Key Security**:
   - Never commit `config.js` to version control
   - Use environment variables in production
   - Restrict API key usage in Google Cloud Console

2. **Firestore Rules** (update your `firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read coaches and workouts
    match /coaches/{coachId} {
      allow read: if request.auth != null;
    }
    
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
    }
    
    // Users can only access their own bookings
    match /bookings/{bookingId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Users can only access their own AI workouts
    match /ai_workouts/{workoutId} {
      allow read, create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🎨 Customization

### Styling
- Edit Tailwind configuration in `index.html` `<script>` tag
- Modify brand colors in the `theme.extend.colors.brand` object
- Adjust dark mode behavior with `darkMode` setting

### AI Prompts
- Customize prompts in `ai-service.js`
- Adjust temperature and token limits in `_callGeminiAPI()`
- Modify fitness level calculations in `_calculateFitnessLevel()`

## 🐛 Troubleshooting

### AI Workout Generation Fails
- Check if Gemini API key is correctly set in `config.js`
- Verify API key has proper permissions in Google Cloud Console
- Check browser console for detailed error messages
- Ensure user profile is complete (height, weight, goal)

### Coach Matching Doesn't Show Scores
- Verify coaches have `specializations` array in Firestore
- Check if user profile is saved before matching
- Look for errors in browser console

### Bookings Don't Save
- Ensure Firestore rules allow bookings creation
- Check if user is authenticated
- Verify `bookings` collection exists

### Authentication Issues
- Verify Firebase config in `config.js`
- Check if Google Auth is enabled in Firebase Console
- Ensure correct authorized domains in Firebase Auth settings

## 📈 Future Enhancements

- [ ] Real-time chat with coaches
- [ ] Video session integration
- [ ] Progress photos and measurements tracking
- [ ] Nutrition planning with AI
- [ ] Community features and challenges
- [ ] Wearable device integration
- [ ] Payment processing
- [ ] Coach dashboard
- [ ] Advanced analytics
- [ ] Mobile apps (iOS/Android)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review browser console for errors
3. Verify Firebase and API configurations
4. Open an issue on GitHub

## 🙏 Acknowledgments

- Google Gemini AI for workout generation
- Firebase for backend infrastructure
- Tailwind CSS for styling
- The fitness community for inspiration

---

**Built with ❤️ for fitness enthusiasts worldwide**
