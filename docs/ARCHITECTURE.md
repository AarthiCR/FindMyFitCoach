# System Architecture - FindMyFitCoach AI Platform

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  (index.html + Tailwind CSS - Responsive, Dark Mode)            │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ User Interactions
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                       (main.js)                                  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Manager │  │Profile Mgmt  │  │Booking System│         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                   │                 │                  │
│         └───────────────────┴─────────────────┘                 │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌────────────────────────────┐  ┌────────────────────────────┐
│      FIREBASE SERVICES     │  │      AI SERVICE LAYER      │
│     (Firebase SDK)         │  │      (ai-service.js)       │
│                            │  │                            │
│  ┌──────────────────────┐ │  │  ┌──────────────────────┐ │
│  │   Authentication      │ │  │  │ Workout Generator    │ │
│  │   (Google OAuth)      │ │  │  │                      │ │
│  └──────────────────────┘ │  │  └─────────┬────────────┘ │
│                            │  │            │              │
│  ┌──────────────────────┐ │  │  ┌─────────▼────────────┐ │
│  │   Firestore DB       │ │  │  │ Coach Matcher        │ │
│  │   - users            │ │  │  │                      │ │
│  │   - coaches          │ │  │  └─────────┬────────────┘ │
│  │   - workouts         │ │  │            │              │
│  │   - bookings         │ │  │  ┌─────────▼────────────┐ │
│  │   - ai_workouts      │ │  │  │ Session Planner      │ │
│  └──────────────────────┘ │  │  │                      │ │
│                            │  │  └─────────┬────────────┘ │
│  ┌──────────────────────┐ │  │            │              │
│  │   Cloud Storage      │ │  │  ┌─────────▼────────────┐ │
│  │   (Future: Photos)   │ │  │  │ Progress Analyzer    │ │
│  └──────────────────────┘ │  │  └──────────────────────┘ │
└────────────────────────────┘  └───────────┬──────────────┘
                                            │
                                            ▼
                                ┌──────────────────────┐
                                │   GOOGLE GEMINI API  │
                                │   (AI Processing)    │
                                │                      │
                                │  - GPT-4 level AI    │
                                │  - JSON responses    │
                                │  - Fast processing   │
                                └──────────────────────┘
```

## Data Flow Diagrams

### 1. User Onboarding & Profile Creation

```
User Opens App
     │
     ▼
┌────────────────┐
│  Sign In with  │
│     Google     │
└────────┬───────┘
         │
         ▼
   ┌──────────┐        ┌──────────────┐
   │Firebase  │───────▶│Create User   │
   │  Auth    │        │Document in   │
   └──────────┘        │Firestore     │
                       └──────┬───────┘
                              │
         ┌────────────────────┘
         │
         ▼
┌────────────────────┐
│ User Fills Profile │
│ - Height           │
│ - Weight           │
│ - Goal             │
│ - Requirements     │
└────────┬───────────┘
         │
         ▼
   ┌────────────┐
   │   Save to  │
   │ Firestore  │
   └────────┬───┘
            │
            ▼
    Profile Complete!
```

### 2. AI Workout Generation Flow

```
User Clicks "Generate Workout"
            │
            ▼
    ┌───────────────┐
    │Check Profile  │
    │ Complete?     │
    └───────┬───────┘
            │
            ▼
    ┌───────────────────┐
    │Fetch User Profile │
    │   from Firestore  │
    └───────┬───────────┘
            │
            ▼
    ┌────────────────────────────┐
    │   AI Service Processing    │
    │                            │
    │ 1. Analyze user stats      │
    │ 2. Calculate fitness level │
    │ 3. Build AI prompt         │
    │ 4. Call Gemini API         │
    │ 5. Parse JSON response     │
    │ 6. Validate data           │
    └────────┬───────────────────┘
             │
             ▼
     ┌──────────────┐      ┌──────────────┐
     │ Display      │      │  Save to     │
     │ Workout on   │◀─────│  Firestore   │
     │ UI (Rich     │      │  (History)   │
     │ Formatting)  │      └──────────────┘
     └──────────────┘
             │
             ▼
    User Views Personalized Plan
```

### 3. AI Coach Matching Flow

```
User Saves Profile / Clicks "AI Match"
            │
            ▼
    ┌─────────────────┐
    │ Fetch Coaches   │
    │ matching goal   │
    │ (Firestore)     │
    └────────┬────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  AI Service Processing     │
    │                            │
    │ 1. Get user profile        │
    │ 2. Get all coaches         │
    │ 3. Build comparison prompt │
    │ 4. Call Gemini API         │
    │ 5. Parse match scores      │
    │ 6. Sort by compatibility   │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Re-render Coach    │
    │ List with:         │
    │ - Match scores     │
    │ - AI reasoning     │
    │ - Key strengths    │
    │ - Sorted by score  │
    └────────────────────┘
```

### 4. Booking Session Flow

```
User Clicks "Book" on Coach
            │
            ▼
    ┌───────────────┐
    │  Show Modal   │
    │  with Coach   │
    │    Details    │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ User Selects  │
    │ Date & Time   │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐     ┌──────────────┐
    │  Validate     │────▶│ Show Error   │
    │  Future Date? │     │  if Invalid  │
    └───────┬───────┘     └──────────────┘
            │ Valid
            ▼
    ┌───────────────────┐
    │ Create Booking    │
    │ Document:         │
    │ - userId          │
    │ - coachId         │
    │ - goal            │
    │ - scheduledAt     │
    │ - status: pending │
    └────────┬──────────┘
             │
             ▼
    ┌────────────────┐
    │  Save to       │
    │  Firestore     │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ Show in "My    │
    │ Bookings" List │
    └────────────────┘
```

## Component Breakdown

### Frontend Components (index.html)

```
┌─────────────────────────────────────────┐
│            Header Bar                    │
│  - Logo                                  │
│  - User Display                          │
│  - Sign In/Out Buttons                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      AI Workout Generator Section        │
│  ┌──────────────────────────────────┐   │
│  │  Title + AI Icon                 │   │
│  │  "Generate Workout" Button       │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Workout Display Area            │   │
│  │  - Title & Stats                 │   │
│  │  - AI Reasoning                  │   │
│  │  - Warmup                        │   │
│  │  - Exercise List                 │   │
│  │  - Cooldown                      │   │
│  │  - Equipment                     │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         User Profile Section             │
│  - Height Input                          │
│  - Weight Input                          │
│  - Goal Select                           │
│  - Requirements Textarea                 │
│  - Save Button                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Suggested Workouts Section          │
│  - Grid of workout cards                 │
│  - Refresh button                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     AI-Matched Coaches Section           │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ Coach Card 1 │ │ Coach Card 2 │     │
│  │ - Match: 95% │ │ - Match: 87% │     │
│  │ - Reasoning  │ │ - Reasoning  │     │
│  │ - Strengths  │ │ - Strengths  │     │
│  │ - Book Btn   │ │ - Book Btn   │     │
│  └──────────────┘ └──────────────┘     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         My Bookings Section              │
│  - List of bookings                      │
│  - Status indicators                     │
│  - Cancel buttons                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         Booking Modal (Overlay)          │
│  - Coach name                            │
│  - Date/time picker                      │
│  - Confirm/Cancel buttons                │
└─────────────────────────────────────────┘
```

### Backend Services (main.js + ai-service.js)

```
main.js
├── Auth Management
│   ├── signInWithPopup()
│   ├── signOut()
│   └── onAuthStateChanged()
│
├── Profile Management
│   ├── loadUserProfile()
│   ├── saveUserProfile()
│   └── toggleAuthUI()
│
├── Workout Management
│   ├── fetchWorkoutsForGoal()
│   ├── renderWorkouts()
│   └── generateAIWorkout() ──┐
│                              │
├── Coach Management           │
│   ├── fetchCoachesForGoal()─┼──┐
│   └── renderCoaches()        │  │
│                              │  │
├── Booking Management         │  │
│   ├── createBooking()        │  │
│   ├── fetchBookings()        │  │
│   ├── cancelBooking()        │  │
│   └── renderBookings()       │  │
│                              │  │
└── Event Listeners            │  │
    ├── Profile form submit    │  │
    ├── Generate workout ──────┘  │
    ├── Book coach                │
    └── Refresh buttons            │
                                   │
ai-service.js                      │
├── AIService Class ◀──────────────┘
│   │
│   ├── generatePersonalizedWorkout()
│   │   ├── Build prompt with user data
│   │   ├── Call Gemini API
│   │   └── Parse & validate response
│   │
│   ├── generateCoachRecommendations()
│   │   ├── Analyze user + coaches
│   │   ├── Call Gemini API
│   │   └── Return match scores
│   │
│   ├── generateSessionRecommendations()
│   │   └── (Ready for implementation)
│   │
│   ├── analyzeProgress()
│   │   └── (Ready for implementation)
│   │
│   └── Helper Methods
│       ├── _callGeminiAPI()
│       ├── _parseWorkoutResponse()
│       ├── _parseCoachRecommendations()
│       └── _calculateFitnessLevel()
```

## Database Schema (Firestore)

```
Firestore Database
│
├── users (collection)
│   └── {userId} (document)
│       ├── uid: string
│       ├── name: string
│       ├── email: string
│       ├── heightCm: number
│       ├── weightKg: number
│       ├── goal: string
│       ├── requirements: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── coaches (collection)
│   └── {coachId} (document)
│       ├── name: string
│       ├── bio: string
│       ├── specializations: array<string>
│       ├── yearsExperience: number
│       ├── hourlyRate: number
│       └── rating: number
│
├── workouts (collection)
│   └── {workoutId} (document)
│       ├── title: string
│       ├── description: string
│       ├── intensity: string
│       ├── durationMins: number
│       ├── goals: array<string>
│       └── popularity: number
│
├── bookings (collection)
│   └── {bookingId} (document)
│       ├── userId: string
│       ├── coachId: string
│       ├── coachName: string
│       ├── goal: string
│       ├── status: string
│       ├── scheduledAt: timestamp
│       └── createdAt: timestamp
│
└── ai_workouts (collection)
    └── {workoutId} (document)
        ├── userId: string
        ├── workout: object
        │   ├── title: string
        │   ├── duration: number
        │   ├── intensity: string
        │   ├── exercises: array
        │   ├── warmup: string
        │   ├── cooldown: string
        │   ├── estimatedCalories: number
        │   ├── equipmentNeeded: array
        │   └── aiReasoning: string
        └── createdAt: timestamp
```

## Technology Stack Details

```
┌─────────────────────────────────────────┐
│           FRONTEND STACK                 │
├─────────────────────────────────────────┤
│ HTML5                                    │
│ - Semantic markup                        │
│ - Accessibility features                 │
│                                          │
│ Tailwind CSS v3                          │
│ - Utility-first styling                  │
│ - Responsive design                      │
│ - Dark mode support                      │
│ - Custom brand colors                    │
│                                          │
│ Vanilla JavaScript (ES6+)                │
│ - Modules (import/export)                │
│ - Async/await                            │
│ - Arrow functions                        │
│ - Template literals                      │
│ - Destructuring                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          BACKEND SERVICES                │
├─────────────────────────────────────────┤
│ Firebase v10.14.1                        │
│ - Authentication                         │
│   └── Google OAuth 2.0                   │
│ - Cloud Firestore                        │
│   └── NoSQL database                     │
│ - Hosting (optional)                     │
│   └── CDN + SSL                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             AI SERVICES                  │
├─────────────────────────────────────────┤
│ Google Gemini 1.5 Flash                  │
│ - Model: gemini-1.5-flash                │
│ - Temperature: 0.7                       │
│ - Max tokens: 2048                       │
│ - Response format: JSON                  │
│                                          │
│ API Endpoint:                            │
│ generativelanguage.googleapis.com        │
└─────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│          AUTHENTICATION                  │
├─────────────────────────────────────────┤
│ Google OAuth 2.0                         │
│ └── Handled by Firebase Auth             │
│                                          │
│ JWT Tokens                               │
│ - Automatic refresh                      │
│ - Secure HTTP-only                       │
│ - Short expiration                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        AUTHORIZATION RULES               │
├─────────────────────────────────────────┤
│ Firestore Security Rules:                │
│                                          │
│ users/{userId}                           │
│ - Read/Write: Only if auth.uid matches   │
│                                          │
│ coaches, workouts                        │
│ - Read: Any authenticated user           │
│ - Write: Admin only (via console)       │
│                                          │
│ bookings/{bookingId}                     │
│ - Read: Only own bookings                │
│ - Create: Authenticated users            │
│ - Update: Only if userId matches         │
│                                          │
│ ai_workouts/{workoutId}                  │
│ - Read/Create: Only own workouts         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            API SECURITY                  │
├─────────────────────────────────────────┤
│ Gemini API Key                           │
│ - Stored in config.js (not committed)    │
│ - Restricted by referrer in console      │
│ - Rate limited by Google                 │
│                                          │
│ Firebase API Key                         │
│ - Public by design                       │
│ - Protected by security rules            │
│ - Domain restrictions available          │
└─────────────────────────────────────────┘
```

## Deployment Options

```
Option 1: Static Hosting (Simple)
┌────────────────────────────┐
│  Any Web Server            │
│  - GitHub Pages            │
│  - Netlify                 │
│  - Vercel                  │
│  - AWS S3 + CloudFront     │
└────────────────────────────┘

Option 2: Firebase Hosting (Recommended)
┌────────────────────────────┐
│  Firebase Hosting          │
│  - Integrated with Auth    │
│  - Global CDN              │
│  - Auto SSL                │
│  - Easy deploy             │
└────────────────────────────┘

Option 3: Custom Server
┌────────────────────────────┐
│  Node.js / Python Server   │
│  - More control            │
│  - Custom middleware       │
│  - Backend processing      │
└────────────────────────────┘
```

---

**This architecture provides:**
- ✅ Scalability (serverless)
- ✅ Security (Firebase rules)
- ✅ Performance (CDN + caching)
- ✅ Intelligence (AI integration)
- ✅ Maintainability (modular code)
