# FindMyFitCoach — Function Pocket Notes

> **For a JS beginner:** A **function** is a named block of code that does one specific job.  
> You call it by name to run it.  
> - A **regular function** (`function foo() {}`) runs immediately when called.  
> - An **async function** (`async function foo() {}`) does its job in the background (usually talking to a database or an API) and you have to *wait* for it to finish before using the result.  
> - A **method** is a function that lives inside a class (like `AIService`).  
> - A **private method** (name starts with `_`) is an internal helper — it is only meant to be called by other methods inside the same class, not from outside.  
> - An **IIFE** (Immediately Invoked Function Expression) is a function that runs itself automatically the moment the page loads.

---

## FILE 1 — `src/ai/ai-service.js`

This file defines the `AIService` **class** — a self-contained AI brain for the app.  
A *class* is like a blueprint. `new AIService(key)` creates one working copy (instance) of it.

---

### `constructor(apiKey)`
**Type:** Class constructor (runs automatically when you create `new AIService(...)`)  
**What it does:** Saves the OpenAI API key, the API URL endpoint, and the model name (`gpt-4o-mini`) into the service object so every other method can use them.

---

### `generatePersonalizedWorkout(userProfile)` ✦ async
**Type:** Public async method  
**What it does:** Takes the user's height, weight, goal, and any special requirements, then asks OpenAI to create a full workout plan as a structured JSON object. The JSON includes exercises with sets/reps, a warm-up, a cool-down, estimated calories, and an AI explanation. Calls `_callOpenAI` internally, then calls `_parseWorkoutResponse` to clean and validate the result.

---

### `generateCoachRecommendations(userProfile, availableCoaches)` ✦ async
**Type:** Public async method  
**What it does:** Given a user's profile and a list of available coaches, it asks OpenAI to rank the coaches by how well they match the user. Returns a list sorted by "match score" (0–100), with reasoning and key strengths for each coach.

---

### `generateSessionRecommendations(userProfile, coachProfile, userHistory)` ✦ async
**Type:** Public async method  
**What it does:** Combines the user's profile, the chosen coach's expertise, and recent workout history to recommend 3–5 session types (e.g., HIIT, strength) with priority rankings and expected benefits.

---

### `analyzeProgress(userProfile, workoutHistory, metrics)` ✦ async
**Type:** Public async method  
**What it does:** Sends the user's workout history and weight changes to OpenAI to get a "progress score" (0–100), insights, achievements, areas to improve, and a motivational message.

---

### `generateWorkoutFromAnalysis(userProfile, savedAnalysis)` ✦ async
**Type:** Public async method  
**What it does:** A smarter version of workout generation. It takes the coach's pre-session AI analysis (saved earlier) and the user's previous exercise history to create a **unique** workout that avoids repeating past exercises. Uses a random "variation seed" to ensure freshness. Delegates to `generateWorkoutPlan` at the end.

---

### `generatePersonalizedWorkoutWithHistory(userProfile, recentWorkouts)` ✦ async
**Type:** Public async method  
**What it does:** The main workout generator used in the user's "AI Workout" tab. It looks at the last 2–3 workouts to avoid repetition, factors in the time of day and day of week, and returns a simple list (array) of 5–7 exercise strings. If the API fails for any reason, it returns a built-in **fallback workout** based on the user's goal (weight loss, muscle gain, etc.).

---

### `generateCoachingInsights({ prompt, userProfile, workoutHistory, sessionGoal })` ✦ async
**Type:** Public async method  
**What it does:** Used during the coach's pre-session review screen. Takes a pre-written prompt and sends it to OpenAI to get a human-readable (not JSON) coaching brief — session focus, progress review, key considerations, and session strategy. Returns HTML-formatted text. Has a built-in fallback response if the API fails.

---

### `_callOpenAIText(prompt, model, temperature, maxTokens)` ✦ async
**Type:** Private async method (internal helper)  
**What it does:** Makes a direct HTTP call to the OpenAI API and asks for a **plain text** response (no JSON formatting). Used by `generateCoachingInsights`. Returns the raw text from OpenAI.

---

### `_callOpenAI(prompt, model, temperature, maxTokens)` ✦ async
**Type:** Private async method (internal helper)  
**What it does:** Makes a direct HTTP call to the OpenAI API and forces the response to be **valid JSON**. Used by most other generation methods. Has detailed error logging and throws helpful messages for 401 (bad API key) and 429 (quota exceeded) errors.

---

### `_parseWorkoutResponse(response)` 
**Type:** Private method  
**What it does:** Takes the raw text from OpenAI, strips out any markdown code-block wrappers (like ` ```json `), parses it as JSON, and checks it has `title` and `exercises` fields. Throws an error if the structure is wrong.

---

### `_parseCoachRecommendations(response)`
**Type:** Private method  
**What it does:** Same clean-and-parse pattern as above, but extracts the `recommendations` array from the response.

---

### `_parseSessionRecommendations(response)`
**Type:** Private method  
**What it does:** Same pattern — strips markdown, parses JSON, and returns the full parsed object.

---

### `_parseProgressAnalysis(response)`
**Type:** Private method  
**What it does:** Same pattern — parses the progress analysis JSON.

---

### `generateWorkoutPlan(userProfile, customPrompt)` ✦ async
**Type:** Public async method  
**What it does:** A simpler, more direct workout generator that asks OpenAI for a JSON array of 5–7 exercise strings. Injects variety by using the day of week, time of day, and a random seed. If no `customPrompt` is provided it builds its own. Has a clean fallback array if the AI fails.

---

### `_calculateFitnessLevel(userProfile)`
**Type:** Private method  
**What it does:** Calculates the user's BMI from their height and weight, then maps it to a descriptive fitness level string like `"intermediate (healthy weight)"` or `"beginner (overweight)"`. This text is injected into AI prompts so OpenAI tailors advice appropriately.

---
---

## FILE 2 — `src/js/main.js`

This is the main application file. It handles everything: authentication, UI, bookings, video calls, notifications, analytics, and more.

> **Key JS concept — `async/await`:** When a function is `async`, it can use `await` to pause and wait for something (like a database read) before continuing. This prevents the page from freezing.  
> **Key JS concept — Event Listeners:** `element.addEventListener("click", function)` — this says "when this button is clicked, run this function."

---

## IMMEDIATELY INVOKED FUNCTION

### `testAIService()` — IIFE ✦ async
**Type:** Self-running async function (runs once on page load)  
**What it does:** Makes a quick call to the OpenAI `/v1/models` endpoint just to check if the API key works. Logs a success or failure message to the browser console with specific help for 401 (invalid key) and 429 (no credits) errors. Does NOT generate any workout — it's purely a health check.

---

## MODAL FUNCTIONS
*(Modals are popup windows that appear over the page)*

### `openBookingModal(coach, goal)`
**Type:** Regular function  
**What it does:** Opens the "Book a Coach" confirmation popup. Saves the chosen coach and goal into memory (`pendingBookingCoach`, `pendingBookingGoal`) and displays the coach's name in the modal.

### `closeBookingModal()`
**Type:** Regular function  
**What it does:** Hides the booking modal and clears out the saved coach and goal from memory.

### `openScheduleAheadModal()`
**Type:** Regular function  
**What it does:** Opens the "Schedule Ahead" popup (for broadcasting a booking request to all coaches). Resets the form fields and hides any previous error message.

### `closeScheduleAheadModal()`
**Type:** Regular function  
**What it does:** Hides the schedule-ahead modal and clears its form fields.

---

## VIDEO CALL FUNCTIONS

### `startEmbeddedVideoCall(bookingId, roomName, title, isModerator)`
**Type:** Regular function  
**What it does:** This is a big function that launches a Jitsi Meet video call embedded directly in the page. It:
1. Disposes of any existing call first.
2. Decides the layout — coaches see a split screen (video + user profile panel); users see a full screen (video + workout checklist panel).
3. Loads the relevant data panel (coach loads user profile; user loads their own workout).
4. Configures Jitsi with custom settings (no lobby, no watermarks, specific toolbar buttons).
5. Attaches event listeners to track when participants join/leave and when the call ends.

### `handleVideoCallEnd()` ✦ async
**Type:** Async function  
**What it does:** Called automatically when someone leaves the video call. It marks the session as "completed" in the database, then shows the feedback/rating modal. Triggers `closeVideoCall()` at the end.

### `closeVideoCall()`
**Type:** Regular function  
**What it does:** The cleanup function. It disposes of the Jitsi API object, cleans up the real-time workout progress listener, hides the video modal, resets all layout styles, clears the video container HTML, and resets all session tracking variables.

---

## SESSION VISIBILITY HELPERS

### `hidePastSessionsDuringCall()`
**Type:** Regular function  
**What it does:** Hides the "past sessions" sections on both coach and user views. Called during video calls to give a cleaner interface.

### `showPastSessionsWhenNotInCall()`
**Type:** Regular function  
**What it does:** Unhides those same past-session sections when no call is active.

---

## COACH SIDE-PANEL DURING SESSION

### `loadUserProfileForSession(bookingId)` ✦ async
**Type:** Async function  
**What it does:** Fetches the booking record from the database to find the user's ID, then fetches that user's profile (height, weight, goal, requirements) and populates the coach's side panel during a call. Also triggers `loadPastWorkouts` and `generateWorkoutPlan` to fill in the rest of the panel.

### `setupUserNameTooltip(nameElement, userId, coachId)`
**Type:** Regular function  
**What it does:** Attaches a hover tooltip to the user's name in the coach's side panel. When the coach hovers over the name for 300ms, it queries the `workoutSessions` database collection and shows mini-cards of the last 5 sessions — including completion rate and coach notes.

### `loadPastWorkouts(userId)` ✦ async
**Type:** Async function  
**What it does:** Fetches past workout sessions for a user from the `workoutSessions` collection (or falls back to completed bookings if that's empty), then renders them as detailed summary cards in the coach's side panel. Handles missing database indexes gracefully.

### `generateWorkoutPlan(userData)` ✦ async
**Type:** Async function  
**What it does:** Calls `aiService.generateWorkoutPlan()` to get a list of exercises for the current session, then builds an internal `workoutChecklist` array (each item has an `id`, `exercise` text, and `completed: false`). Calls `renderWorkoutChecklist()` to display it.

### `renderWorkoutChecklist()`
**Type:** Regular function  
**What it does:** Takes the `workoutChecklist` array and draws it in the coach's side panel as interactive checkboxes. Checked items get a strikethrough style. Calls `attachCheckboxListeners()` after rendering.

### `attachCheckboxListeners()`
**Type:** Regular function  
**What it does:** Finds every checkbox in the workout list and adds a `change` event listener. When a coach checks or unchecks an exercise, it updates the `workoutChecklist` array, re-renders the list, and calls `updateWorkoutProgress()` to sync the change to the database in real time.

### `updateWorkoutProgress(bookingId, checklist)` ✦ async
**Type:** Async function  
**What it does:** Writes the current state of the workout checklist into a special `activeWorkoutSessions` Firestore document. This is how the user's screen updates in real time as the coach checks off exercises.

---

## USER SIDE-PANEL DURING SESSION

### `loadUserWorkoutForSession(bookingId)` ✦ async
**Type:** Async function  
**What it does:** The user-side equivalent of the coach's workout loader. Fetches the booking, displays the session goal, generates an AI workout plan for the user, and sets up a real-time listener (`setupWorkoutProgressListener`) to watch for updates from the coach.

### `setupWorkoutProgressListener(bookingId)`
**Type:** Regular function  
**What it does:** Uses Firestore's `onSnapshot` to create a live connection to the `activeWorkoutSessions` document. Every time the coach checks off an exercise, this listener fires and calls `renderUserWorkoutChecklist()` to update the user's screen instantly.

### `renderUserWorkoutChecklist()`
**Type:** Regular function  
**What it does:** Draws the workout list on the *user's* screen as read-only items (no checkboxes to click). Completed items show a green checkmark SVG icon; pending items show an empty circle. Calls `updateUserProgress()` after rendering.

### `updateUserProgress()`
**Type:** Regular function  
**What it does:** Counts how many checklist items are completed and updates the progress bar percentage and the "X / Y" counter text in the user's panel. Also calls `showProgressCheer()` to trigger motivational messages.

### `showProgressCheer(completedCount, totalCount, percentage)`
**Type:** Regular function  
**What it does:** Shows animated floating text messages when the user completes exercises. Uses milestone messages ("50% done! You're unstoppable!", "INCREDIBLE! Full completion!"). Also fires `createConfetti()` when the workout is 100% done.

### `createConfetti()`
**Type:** Regular function  
**What it does:** Creates 50 small coloured squares/circles that fall from the top of the screen using CSS animations — a fun visual celebration for completing the entire workout.

---

## SESSION DATA SAVING

### `saveWorkoutSession(bookingId, userId, checklist, coachNotes)` ✦ async
**Type:** Async function  
**What it does:** Saves a completed workout session as a new document in the `workoutSessions` Firestore collection. Records which exercises were completed, coach's notes, the goal, the user and coach IDs, and timestamps.

### `saveSessionNotes(bookingId, userId, checklist)` ✦ async
**Type:** Async function  
**What it does:** Reads the coach's notes from the text area, validates there is something to save, then calls `saveWorkoutSession()`. Updates the status label to show "Saving..." → "Saved!" or an error.

### `createSummaryCard(summary)`
**Type:** Regular function  
**What it does:** Builds and returns a styled HTML card element showing one session's summary — the user's name, completion rate (with a progress bar), coach notes in a highlighted box, and a collapsible list of all exercises. Used in both the coach side panel and the user's past sessions view.

### `fetchUserWorkoutSummaries(userId, coachId)` ✦ async
**Type:** Async function  
**What it does:** Queries the `workoutSessions` collection for sessions shared between a specific user and coach, then renders each one as a summary card in the user's session panel.

---

## AUTH UI

### `toggleAuthUI(user)`
**Type:** Regular function  
**What it does:** The master UI switcher. If no user is logged in, it shows the landing page and auth gate and hides both app panels. If logged in, it hides the landing page and shows either the "user app" or the "coach app" depending on the `userType` variable.

---

## PROFILE FUNCTIONS

### `loadUserProfile(userId)` ✦ async
**Type:** Async function  
**What it does:** Reads the user's profile document from Firestore and populates the profile form fields (height, weight, goal, requirements). Also checks if the profile is "complete" (has all required fields) and shows/hides the main content accordingly.

### `loadCoachProfile(userEmail)` ✦ async
**Type:** Async function  
**What it does:** Searches the `coaches` Firestore collection by email. If a profile exists, it populates the coach form, saves the coach's Firestore document ID globally, shows the dashboard, and starts the notification listener. If not, it shows the profile setup form.

### `saveCoachProfile(user)` ✦ async
**Type:** Async function  
**What it does:** Reads all coach form fields (name, bio, years experience, hourly rate, specializations checkboxes), then either updates the existing coach document or creates a new one in Firestore. Starts presence tracking afterwards.

### `saveUserProfile(user)` ✦ async
**Type:** Async function  
**What it does:** Saves the user's height, weight, goal, and requirements to their Firestore `users` document using `setDoc` with `merge: true` (meaning it updates without deleting other fields).

---

## NOTIFICATION FUNCTIONS

### `listenForNotifications(coachEmail)`
**Type:** Regular function  
**What it does:** Uses Firestore's `onSnapshot` to listen for unread notifications addressed to this coach. Whenever a new one arrives (type `"added"`), it shows a toast popup and marks it as read immediately.

### `showNotificationToast(notification)`
**Type:** Regular function  
**What it does:** Creates a green floating "toast" div that appears in the top-right corner of the page with a notification message and a bell icon. Auto-disappears after 5 seconds with a fade-out. Also plays a short audio notification sound.

---

## WORKOUT & COACH DISPLAY

### `renderWorkouts(items)`
**Type:** Regular function  
**What it does:** Takes an array of workout objects and draws cards in the "Workouts" section. Each card shows the title, intensity, duration, and goals tags. If the array is empty, it shows the "No workouts found" empty state.

### `fetchWorkoutsForGoal(goal)` ✦ async
**Type:** Async function  
**What it does:** Queries Firestore's `workouts` collection for workouts matching the user's selected goal, ordered by popularity. Then calls `renderWorkouts()` to display them.

### `checkCoachAvailability(coachId)` ✦ async
**Type:** Async function  
**What it does:** Checks if a coach is currently busy by looking at their active bookings. It accounts for a 30-minute buffer around session times. Returns an object like `{ available: true/false, bookingInfo: "Next session at 3 PM", nextAvailableTime: Date }`.

### `getCoachRating(coachId)` ✦ async
**Type:** Async function  
**What it does:** Queries the `feedback` collection for all ratings given *to* a specific coach, then calculates and returns the average rating and total number of ratings.

### `renderCoaches(items, userGoal, aiRecommendations)` ✦ async
**Type:** Async function  
**What it does:** A large function that renders the list of coach cards. For each coach it:
1. Checks their current availability and real-time ratings in parallel.
2. Determines their online/offline status with a coloured dot.
3. Shows an "AI Match Score" badge if recommendations are available.
4. Shows a "Book" button only if the coach is online AND available.
5. Attaches the click handler to open the booking modal.

### `fetchCoachesForGoal(goal)` ✦ async
**Type:** Async function  
**What it does:** Queries Firestore for approved coaches (filtered by specialization if a goal is selected), deduplicates coaches by email, sorts online coaches first, then tries to get AI match scores from `aiService.generateCoachRecommendations()`. Finally calls `renderCoaches()`.

---

## USER BOOKING FUNCTIONS

### `renderBookings(items)`
**Type:** Regular function  
**What it does:** Renders a user's bookings, split into two sections: "Active Bookings" (pending, confirmed, active) and a collapsible "Past Bookings" section. Calls `createBookingCard()` for each item and `startCountdownTimers()` at the end.

### `startCountdownTimers()`
**Type:** Regular function  
**What it does:** Finds all elements with a `countdown-timer` CSS class and starts a live 1-second interval for each. The timer counts down to the session start time. When 5 minutes or less remain, it replaces the countdown with a pulsing green "Join Session Now!" button.

### `createBookingCard(b, isActive)`
**Type:** Regular function  
**What it does:** Builds and returns a single booking card element. Decides which action buttons to show (Join, Cancel, End, Delete) based on the booking status and timing. Attaches click handlers directly to each button.

### `generateMeetingRoom()`
**Type:** Regular function  
**What it does:** Creates a unique random room name string (e.g., `fitness-session-abc123def456`) for a new Jitsi Meet video room.

### `fetchBookings()` ✦ async
**Type:** Async function  
**What it does:** Sets up a real-time Firestore `onSnapshot` listener for all of the current user's bookings, ordered by date. Every time a booking changes, it re-renders the list. Also triggers a sound notification when a booking status changes to "confirmed".

### `setupCoachAvailabilityListener()`
**Type:** Regular function  
**What it does:** Listens to changes across ALL bookings in the database. When any booking status changes (e.g., a session ends), it triggers a refresh of the coaches list so availability indicators update automatically.

---

## USER ANALYTICS

### `showAnalyticsLoading()`
**Type:** Regular function  
**What it does:** Shows the loading spinner and hides the content and empty-state elements in the analytics section.

### `showAnalyticsEmpty()`
**Type:** Regular function  
**What it does:** Shows the "No data yet" empty state and hides loading and content.

### `loadAnalytics()` ✦ async
**Type:** Async function  
**What it does:** The main entry point for user analytics. Fetches all bookings, workout sessions, and AI-generated workouts for the current user from Firestore, then passes them to `calculateAnalytics()` and `renderAnalytics()`.

### `calculateAnalytics(bookings, sessions, aiWorkouts, userProfile)`
**Type:** Regular function  
**What it does:** A pure data-crunching function. Takes raw data arrays and calculates all the metrics: sessions this month, monthly change %, completion rate, weekly average, monthly trend over 6 months, weekly activity for 7 days, top coaches by sessions, goal progress, activity streak, cancellation rate, average session duration, and favourite workout time.

### `calculateGoalProgress(userProfile, bookings, sessions, aiWorkouts)`
**Type:** Regular function  
**What it does:** Looks at the user's stated goal (e.g., `"weight_loss"`) and determines a progress percentage based on total activities vs. a target milestone (e.g., 20 sessions for weight loss). Returns an object with progress %, a colour, and a motivational message.

### `generateActivitySummary(bookings, aiWorkouts, sessions)`
**Type:** Regular function  
**What it does:** Combines the most recent bookings and AI workouts into a single chronological "recent activity" list with icons (✅ completed, ❌ cancelled, 🤖 AI workout). Returns the top 5 most recent.

### `calculateStreak(bookings, aiWorkouts)`
**Type:** Regular function  
**What it does:** Counts consecutive days of activity going backwards from today. Any day with at least one booking or AI workout counts. Returns the streak length in days.

### `renderAnalytics(data)`
**Type:** Regular function  
**What it does:** Takes the analytics data object and updates all the number display elements on screen. Then calls all the sub-render functions: `renderMonthlyTrendChart`, `renderWeeklyActivityChart`, `renderTopCoaches`, `renderGoalProgress`, and `renderActivitySummary`.

### `renderMonthlyTrendChart(monthlyTrend)`
**Type:** Regular function  
**What it does:** Renders a pure CSS/HTML bar chart showing the last 6 months of activity. Blue bars = coach sessions; purple bars = AI workouts.

### `renderWeeklyActivityChart(weeklyActivity)`
**Type:** Regular function  
**What it does:** Renders a bar chart of the last 7 days. Today's bar is highlighted with a darker colour.

### `renderTopCoaches(topCoaches)`
**Type:** Regular function  
**What it does:** Renders a ranked list of the user's most-booked coaches with medal icons (🥇🥈🥉) and horizontal progress bars.

### `renderGoalProgress(goalProgress)`
**Type:** Regular function  
**What it does:** Renders the goal progress section with a big progress bar, percentage number, and motivational message. Adds a bouncing 🎉 emoji when at 100%.

### `renderActivitySummary(recentActivity, streak, totalAiWorkouts)`
**Type:** Regular function  
**What it does:** Renders the "Current Streak" card, the "AI Workouts Generated" card, and a scrollable list of recent activity items with status badges.

---

## COACH ANALYTICS

### `showCoachAnalyticsLoading()`
**Type:** Regular function  
**What it does:** Shows loading state for coach analytics panel.

### `showCoachAnalyticsEmpty()`
**Type:** Regular function  
**What it does:** Shows empty state for coach analytics panel.

### `loadCoachAnalytics()` ✦ async
**Type:** Async function  
**What it does:** Fetches all bookings and workout sessions for the current coach, plus the coach's own profile (for the hourly rate). Passes data to `calculateCoachAnalytics()` and `renderCoachAnalytics()`.

### `calculateCoachAnalytics(bookings, sessions, coachProfile)`
**Type:** Regular function  
**What it does:** Calculates coach-specific business metrics: active clients (seen in last 30 days), new clients this month, session counts, revenue calculations (sessions × hourly rate), average workout completion rate, revenue trend for 6 months, top clients, goal distribution across clients, clients who need attention (2+ weeks inactive), client retention rate, cancellation rate, and peak booking hour.

### `renderCoachAnalytics(data)`
**Type:** Regular function  
**What it does:** Updates all the number display elements in the coach analytics panel, then calls all the sub-render functions for charts and lists.

### `renderCoachRevenueChart(revenueTrend)`
**Type:** Regular function  
**What it does:** Renders a gold-coloured bar chart of monthly revenue over 6 months. The current month's bar is highlighted.

### `renderCoachWeeklyChart(weeklyActivity)`
**Type:** Regular function  
**What it does:** Renders a bar chart of sessions per day for the last 7 days, with today highlighted.

### `renderCoachTopClients(topClients)`
**Type:** Regular function  
**What it does:** Renders a ranked list of the coach's most active clients with session counts and horizontal progress bars.

### `renderCoachGoalsDistribution(goalsDistribution)`
**Type:** Regular function  
**What it does:** Renders horizontal progress bars showing what percentage of client sessions are for each goal type (Weight Loss, Muscle Gain, etc.), with colour-coded bars and icons.

### `renderCoachPerformanceSummary(data)`
**Type:** Regular function  
**What it does:** Renders a simple list of key coach performance numbers: total sessions, total clients, average sessions per client, cancellation rate, and hourly rate.

### `renderClientsNeedingAttention(clients)`
**Type:** Regular function  
**What it does:** Renders a list of clients who have had 2+ sessions but haven't booked in 14+ days, showing how many days ago their last session was. Helps coaches do outreach.

---

## BOOKING CRUD (Create, Read, Update, Delete)

### `createBooking(coachId, goal, scheduledAt)` ✦ async
**Type:** Async function  
**What it does:** Creates a new booking document in Firestore. If `coachId` is `null`, it's a **broadcast request** (sent to all coaches). Otherwise it first checks if the specific coach has a time conflict (with a 30-minute buffer). Generates a Jitsi Meet room name, stores all booking data, and then calls `notifyCoach()` or `notifyAllCoaches()`.

### `confirmBooking(bookingId, userEmail)` ✦ async
**Type:** Async function  
**What it does:** Used by coaches to confirm a pending booking. Changes the status to `"confirmed"`. If it was a broadcast request, it also assigns the confirming coach's name and ID to the booking. Then sends a notification to the user.

### `notifyCoach(coachEmail, notificationData)` ✦ async
**Type:** Async function  
**What it does:** Creates a new document in the `notifications` Firestore collection addressed to a specific coach's email. This is how in-app notifications are delivered.

### `notifyAllCoaches(notificationData)` ✦ async
**Type:** Async function  
**What it does:** Fetches all coaches from the database and creates a separate notification document for each one simultaneously (using `Promise.all`). Used for broadcast booking requests.

### `cancelBooking(bookingId)` ✦ async
**Type:** Async function  
**What it does:** Updates the booking's `status` field to `"cancelled"` in Firestore.

### `deleteBooking(bookingId)` ✦ async
**Type:** Async function  
**What it does:** Permanently deletes the booking document from Firestore using `deleteDoc`.

### `endSession(bookingId)` ✦ async
**Type:** Async function  
**What it does:** Marks the booking as `"completed"` and records an `endedAt` timestamp. Then calls `showFeedbackModal()` to prompt for a rating.

---

## SESSION REMINDER SYSTEM

### `startSessionReminderSystem()`
**Type:** Regular function  
**What it does:** Sets up a `setInterval` that runs `checkUpcomingSessions()` every 60 seconds for coaches. Also runs it once immediately.

### `startUserSessionReminderSystem()`
**Type:** Regular function  
**What it does:** Same as above but runs `checkUpcomingUserSessions()` for regular users.

### `stopSessionReminderSystem()`
**Type:** Regular function  
**What it does:** Clears both reminder intervals and empties the "already notified" tracking sets, preventing duplicate reminders.

### `checkUpcomingSessions()` ✦ async
**Type:** Async function  
**What it does:** Called every minute for coaches. Queries upcoming confirmed bookings and checks if any are 4–5 minutes away. If so, calls `sendSessionReminder()` and marks the booking as "notified" so it won't trigger again.

### `sendSessionReminder(booking, scheduledTime)` ✦ async
**Type:** Async function  
**What it does:** Fires when a coach's session is 5 minutes away. It: shows the "Join Session" popup modal, plays a notification sound, saves a reminder email to the `mail` Firestore collection (for email delivery), and adds an in-app notification.

### `checkUpcomingUserSessions()` ✦ async
**Type:** Async function  
**What it does:** Same as `checkUpcomingSessions` but for users — checks the user's confirmed/active bookings.

### `sendUserSessionReminder(booking, scheduledTime)` ✦ async
**Type:** Async function  
**What it does:** Shows a "Join Session" popup and plays a notification sound for the user when their session is about to start.

### `showSessionJoinModal(booking, timeStr)`
**Type:** Regular function  
**What it does:** Populates and shows the "Your session with [Client] is starting at [Time]" popup for coaches.

### `showUserSessionJoinModal(booking, timeStr)`
**Type:** Regular function  
**What it does:** Same popup but for users — shows "Your session with [Coach] is starting at [Time]".

---

## COACH BOOKINGS & CALENDAR

### `fetchCoachBookings()` ✦ async
**Type:** Async function  
**What it does:** Sets up **two** real-time Firestore listeners: one for bookings assigned directly to this coach, and one for broadcast (open) requests. Combines the results and calls `renderCoachCalendar()`. Also plays a notification sound when a new booking arrives.

### `renderCoachCalendar(bookings)`
**Type:** Regular function  
**What it does:** A large rendering function that sorts bookings into categories (Active, Pending, Confirmed, Upcoming, Past) and renders each category as a coloured, styled section. Past sessions are in a collapsible section. Calls `createCoachBookingCard()` for each booking.

### `createCoachBookingCard(booking, category)`
**Type:** Regular function  
**What it does:** Builds a booking card for the coach's view. Shows the client's name, goal, time, and status badge. Shows action buttons: "Confirm Booking", "Join Session" (which opens the pre-session review), "End Session", or "Delete". Attaches all event handlers with `setTimeout(..., 0)` to ensure the button is in the DOM first.

---

## FEEDBACK SYSTEM

### `showFeedbackModal(bookingId, bookingData)`
**Type:** Regular function  
**What it does:** Opens the star-rating feedback modal after a session ends. Resets the stars and text, sets the "other person's name" text (coach or user depending on role), and stores the booking context.

### `closeFeedbackModal()`
**Type:** Regular function  
**What it does:** Hides the feedback modal and resets all state variables.

### `submitFeedback()` ✦ async
**Type:** Async function  
**What it does:** Saves the selected star rating and optional notes to the `feedback` Firestore collection. Also updates the booking document to flag that feedback was given (prevents showing the prompt again). Closes the modal and optionally refreshes the coach list.

---

## AUTH UI HELPERS

### `showLoginOptions(type)`
**Type:** Regular function  
**What it does:** When user clicks "I'm a User" or "I'm a Coach", this saves their choice, updates the icon/text indicator, then shows the login panel and hides the type-selection panel.

### `hideLoginOptions()`
**Type:** Regular function  
**What it does:** Goes back to the account-type selection screen, resets to the Google tab, and clears all form fields.

### `clearAuthForms()`
**Type:** Regular function  
**What it does:** Empties all email, password, and name fields in the login and signup forms. Also hides any error messages.

### `showGooglePanel()`
**Type:** Regular function  
**What it does:** Activates the "Google" tab and shows the Google sign-in panel, hiding the email/password panel.

### `showEmailPanel()`
**Type:** Regular function  
**What it does:** Activates the "Email" tab and shows the email/password panel, hiding the Google panel.

### `showLoginForm()`
**Type:** Regular function  
**What it does:** Switches between the Login form and Signup form — shows Login, hides Signup, updates the tab button styles.

### `showSignupForm()`
**Type:** Regular function  
**What it does:** Shows the Signup form, hides the Login form, updates tab button styles.

### `showAuthError(element, message)`
**Type:** Regular function  
**What it does:** Takes an error message element and a text string, sets the text, and makes it visible. Used to show "wrong password", "email already in use" etc. under auth forms.

---

## DASHBOARD HELPER FUNCTIONS

### `updateUserWelcomeData()`
**Type:** Regular function  
**What it does:** Updates the user dashboard's greeting text based on the current time of day ("Good morning!", "Good afternoon!", etc.). Also attempts to show the user's current goal.

### `updateUserStats()`
**Type:** Regular function  
**What it does:** Updates the quick-stat numbers on the user dashboard (sessions count, week sessions, streak, progress). Note: currently uses some hardcoded/mock numbers. Also calls `updateMotivationalQuote()`.

### `updateMotivationalQuote()`
**Type:** Regular function  
**What it does:** Picks a random motivational quote from a hardcoded list and inserts it into the "quote" element on the dashboard.

### `updateRecentAchievements()`
**Type:** Regular function  
**What it does:** Renders hardcoded achievement badges ("Completed 10 sessions", "5-day streak"). Note: placeholder data, not yet connected to real achievements.

### `updateCoachWelcomeData()`
**Type:** Regular function  
**What it does:** Updates the coach dashboard's greeting. Also attempts to show the coach's specialization and rating.

### `updateCoachStats()`
**Type:** Regular function  
**What it does:** Updates the coach's quick-stat numbers. Note: currently uses hardcoded mock data.

### `filterBookingsByStatus(status)`
**Type:** Regular function  
**What it does:** Shows or hides booking items based on a status filter (upcoming/completed/cancelled). Reads `data-status` attributes on DOM elements.

### `loadCoachSchedule(view)`
**Type:** Regular function  
**What it does:** Renders a placeholder schedule based on the selected view (today/week/month/availability). Currently uses hardcoded mock session data. Intended to be replaced with real data.

### `loadUserWorkouts()`
**Type:** Regular function (placeholder)  
**What it does:** Placeholder function — logs a message. Not yet implemented.

### `showProfileForm()`
**Type:** Regular function  
**What it does:** Shows the profile edit section and hides the main content area.

### `loadCoachClients()`
**Type:** Regular function (placeholder)  
**What it does:** Placeholder function — logs a message. Not yet implemented.

### `showCoachProfileForm()`
**Type:** Regular function  
**What it does:** Shows the coach profile edit section and smoothly scrolls to it.

### `openAvailabilityModal()`
**Type:** Regular function (placeholder)  
**What it does:** Placeholder — not yet implemented.

### `initializeTabs()`
**Type:** Regular function  
**What it does:** Finds all elements with the class `tab-button` and adds click handlers to them. When a tab is clicked, it removes the active style from all tabs, adds it to the clicked one, hides all tab panels, and shows the target panel. Also calls `updateQuickActions()`.

### `updateQuickActions(activeTab)`
**Type:** Regular function  
**What it does:** Attaches click event listeners to "quick action" shortcut buttons on the dashboard (like "Book a Session" or "View Workouts") that switch to the appropriate tab when clicked.

### `initializeEnhancedDashboard()`
**Type:** Regular function  
**What it does:** The master dashboard setup function. Calls `initializeTabs()`, sets up all quick-action button handlers, sets up session filter buttons, and sets up the coach schedule tab buttons. Also calls the initial welcome/stats functions based on whether the user is a user or a coach.

---

## AUTH FUNCTIONS

### `signInWithGoogle()` ✦ async
**Type:** Async function  
**What it does:** Tries to sign in with Google using a popup window. If the popup is blocked by the browser, it falls back to a full-page redirect. Requires `userType` to be set first.

### `signInUser()` ✦ async
**Type:** Async function  
**What it does:** Legacy wrapper function — simply calls `signInWithGoogle()`. Kept for backwards compatibility.

---

## TAB NAVIGATION

### `switchTab(activeTabId)`
**Type:** Regular function  
**What it does:** Switches the active tab in the user view. Makes the clicked tab button gradient blue/purple and shows its content panel. Makes all other tabs grey and hides their panels.

### `switchCoachTab(activeTabId)`
**Type:** Regular function  
**What it does:** Same as `switchTab` but for the coach view (Schedule vs Analytics tabs).

---

## AI WORKOUT RENDERING (User's Main View)

### `renderAIWorkout(workout)`
**Type:** Regular function  
**What it does:** Takes a workout object (or array of strings) from the AI service and renders the full workout UI in the user's "AI Workout" section. Shows the workout title, intensity/duration/calorie badges, AI reasoning explanation, warm-up steps, main exercises (with individual checkboxes), cool-down steps, and equipment needed. Handles both simple string arrays and rich object formats.

---

## PRESENCE TRACKING

### `updatePresence(isOnline)` ✦ async
**Type:** Async function  
**What it does:** Updates the `isOnline` flag and `lastSeen` timestamp on the coach's Firestore document. Only runs if the current user is a coach.

### `startPresenceTracking()`
**Type:** Regular function  
**What it does:** Immediately marks the coach as online, then sets up a heartbeat interval (`setInterval`) to call `updatePresence(true)` every 30 seconds. Also listens for the browser tab closing to mark the coach offline.

### `stopPresenceTracking()`
**Type:** Regular function  
**What it does:** Clears the heartbeat interval and marks the coach offline.

### `startCoachPresenceListener()`
**Type:** Regular function  
**What it does:** For users only. Sets up a real-time Firestore listener on all coach documents. When any coach's data changes (e.g., they go online), calls `updateCoachPresenceUI()` to update their indicator dot without re-fetching all coaches.

### `updateCoachPresenceUI(coachData)`
**Type:** Regular function  
**What it does:** Finds the coach's card in the DOM by its `data-coach-id` attribute and updates the small presence indicator dot — green if online, grey if offline. Also updates the hover tooltip text.

### `isCoachOnline(coachData)`
**Type:** Regular function  
**What it does:** Returns `true` or `false` for whether a coach is currently online. Uses a 90-second timeout — if the coach was last seen within 90 seconds, they're considered online regardless of the `isOnline` flag (handles delays). If they have no presence data at all, defaults to `true` (so they can still be booked).

### `getLastSeenText(lastSeen)`
**Type:** Regular function  
**What it does:** Takes a Firestore timestamp and converts it to a human-friendly string like "Last seen: 5m ago", "Last seen: 2h ago", or "Last seen: 3d ago".

---

## NOTIFICATION SOUNDS

### `notificationSounds.newBooking()`
**Type:** Regular function (object property)  
**What it does:** Uses the browser's Web Audio API to generate a soft single-tone chime sound for new booking events.

### `notificationSounds.bookingConfirmed()`
**Type:** Regular function (object property)  
**What it does:** Generates a gentle two-note ascending chime (C5 → E5) to signal a booking confirmation.

### `notificationSounds.sessionReminder()`
**Type:** Regular function (object property)  
**What it does:** Generates a two-tone descending reminder sound (like a phone notification) for upcoming session alerts.

### `showNotificationWithSound(title, message, soundType)`
**Type:** Regular function  
**What it does:** Plays the requested notification sound and, if the browser has notification permission, shows a native OS browser notification popup with the given title and message.

---

## PRE-SESSION REVIEW (Coach)

### `showPreSessionReview(booking)` ✦ async
**Type:** Async function  
**What it does:** Shows the coach a pre-session review popup before starting the video call. Fills in the client's name and goal, then runs three async operations: loading user profile data, generating an AI coaching analysis, and loading past session history.

### `loadUserDataForReview(booking)` ✦ async
**Type:** Async function  
**What it does:** Fetches the client's profile from Firestore and displays their height, weight, and special requirements in the pre-session modal.

### `generateAISessionAnalysis(booking)` ✦ async
**Type:** Async function  
**What it does:** Builds a detailed coaching prompt including the user's profile and all past session notes, then calls `aiService.generateCoachingInsights()` to get AI coaching advice. Saves the result as `savedAIAnalysis` (used later for workout generation). Displays the analysis as formatted HTML in the modal.

### `loadSessionHistoryForReview(booking)` ✦ async
**Type:** Async function  
**What it does:** Fetches past completed bookings between this coach and user and renders them in the pre-session modal as a timeline, including dates, goals, and the coach's previous notes.

### `completeReviewAndJoinSession()` ✦ async
**Type:** Async function  
**What it does:** The "Complete Review & Join Session" button handler. Saves any notes the coach has written, updates the booking status to `"active"`, hides the review modal, then calls `startEmbeddedVideoCall()` to begin the actual video call.

### `closePreSessionReview()`
**Type:** Regular function  
**What it does:** Cancels the pre-session review without starting the call. Resets the booking status back to `"confirmed"`, hides the modal, and clears the notes field.

---

## MISCELLANEOUS

### `requestNotificationPermission()`
**Type:** Regular function  
**What it does:** Asks the browser (via the Notifications API) for permission to show desktop notifications. Only asks if permission hasn't already been granted or denied.

### `showToast(message, type)`
**Type:** Regular function  
**What it does:** Shows a temporary toast notification at the bottom of the screen (error or info). Used for inline messages like "This coach is currently busy".

---

## MAIN AUTH STATE WATCHER — `onAuthStateChanged` callback

**Type:** Async event callback (not a named function, but the most important block in the file)  
**What it does:** Firebase calls this automatically every time the user's login state changes. When a user **logs in**:
- Coaches: loads their profile, starts presence tracking and session reminders, fetches bookings and analytics.
- Users: loads their profile, starts coach presence and availability listeners, fetches workouts, coaches, bookings, and analytics.

When a user **logs out**: clears all data, stops all listeners, stops presence tracking and reminders, and resets global variables.

---

*End of pocket notes. Good luck in your interview!*
