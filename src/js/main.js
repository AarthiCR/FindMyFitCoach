// Use ESM imports from Firebase CDN (no build step required)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Load Firebase configuration from a local, untracked file
import { firebaseConfig, openaiApiKey } from "../../config/config.js";
import { AIService } from "../ai/ai-service.js";

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize AI Service
const aiService = new AIService(openaiApiKey);

// UI elements
const userDisplayEl = document.getElementById("user-display");
const btnSignIn = document.getElementById("btn-sign-in");
const btnSignOut = document.getElementById("btn-sign-out");
const gateEl = document.getElementById("auth-gate");
const appEl = document.getElementById("app");
const coachAppEl = document.getElementById("coach-app");
const editProfileBtn = document.getElementById("edit-profile-btn");
const cancelEditProfileBtn = document.getElementById("cancel-edit-profile");
const profileSection = document.getElementById("profile-section");
const mainContent = document.getElementById("main-content");

// Auth gate buttons
const btnUserLogin = document.getElementById("btn-user-login");
const btnCoachLogin = document.getElementById("btn-coach-login");

// Restore userType from localStorage on page load
let userType = localStorage.getItem('userType') || null; // 'user' or 'coach'

const heightEl = document.getElementById("height");
const weightEl = document.getElementById("weight");
const goalEl = document.getElementById("goal");
const requirementsEl = document.getElementById("requirements");
const profileForm = document.getElementById("profile-form");
const profileStatus = document.getElementById("profile-status");

let isProfileComplete = false;

const workoutList = document.getElementById("workout-list");
const workoutEmpty = document.getElementById("workout-empty");
const refreshWorkouts = document.getElementById("refresh-workouts");

const coachList = document.getElementById("coach-list");
const coachEmpty = document.getElementById("coach-empty");
const refreshCoaches = document.getElementById("refresh-coaches");

const bookingList = document.getElementById("booking-list");
const bookingEmpty = document.getElementById("booking-empty");
const refreshBookings = document.getElementById("refresh-bookings");

// Coach elements
const coachProfileSetup = document.getElementById("coach-profile-setup");
const coachDashboard = document.getElementById("coach-dashboard");
const coachProfileForm = document.getElementById("coach-profile-form");
const coachProfileStatus = document.getElementById("coach-profile-status");
const coachCalendar = document.getElementById("coach-calendar");
const coachBookingsEmpty = document.getElementById("coach-bookings-empty");
const coachRefreshBookings = document.getElementById("coach-refresh-bookings");

// Coach form fields
const coachNameEl = document.getElementById("coach-name");
const coachBioEl = document.getElementById("coach-bio");
const coachExperienceEl = document.getElementById("coach-experience");
const coachRateEl = document.getElementById("coach-rate");

let currentCoachId = null;
let notificationsListener = null;
let bookingsListener = null;

// AI Workout elements
const generateWorkoutBtn = document.getElementById("generate-workout");
const aiWorkoutContainer = document.getElementById("ai-workout-container");
const aiWorkoutContent = document.getElementById("ai-workout-content");
const aiWorkoutEmpty = document.getElementById("ai-workout-empty");

// Booking modal elements
const bookingModal = document.getElementById("booking-modal");
const bookingModalCoach = document.getElementById("booking-modal-coach");
const bookingDatetime = document.getElementById("booking-datetime");
const bookingDatetimeContainer = document.getElementById("booking-datetime-container");
const bookingDatetimeError = document.getElementById("booking-datetime-error");
const bookingCancelBtn = document.getElementById("booking-cancel-btn");
const bookingConfirmBtn = document.getElementById("booking-confirm-btn");
const bookingNowBtn = document.getElementById("booking-now-btn");
const bookingLaterBtn = document.getElementById("booking-later-btn");

let pendingBookingCoach = null; // { id, name }
let pendingBookingGoal = null;
let isBookingNow = true; // Track if user wants to start now or book for later

function openBookingModal(coach, goal) {
    pendingBookingCoach = coach;
    pendingBookingGoal = goal;
    bookingModalCoach.textContent = `Coach: ${coach.name ?? coach.id}`;
    bookingDatetime.value = "";
    bookingDatetimeError.classList.add("hidden");
    bookingDatetimeContainer.classList.add("hidden");
    isBookingNow = true;
    
    // Reset button styles
    bookingNowBtn.className = "flex-1 rounded-md border-2 border-brand-500 bg-brand-50 dark:bg-brand-950 px-4 py-3 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900";
    bookingLaterBtn.className = "flex-1 rounded-md border-2 border-gray-300 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800";
    
    bookingModal.classList.remove("hidden");
}

function closeBookingModal() {
    bookingModal.classList.add("hidden");
    pendingBookingCoach = null;
    pendingBookingGoal = null;
    isBookingNow = true;
}

function toggleAuthUI(user) {
    const isSignedIn = !!user;
    
    if (!isSignedIn) {
        gateEl.classList.remove("hidden");
        appEl.classList.add("hidden");
        coachAppEl.classList.add("hidden");
        btnSignIn.classList.remove("hidden");
        btnSignOut.classList.add("hidden");
        userDisplayEl.classList.add("hidden");
        userDisplayEl.textContent = "";
    } else {
        gateEl.classList.add("hidden");
        btnSignIn.classList.add("hidden");
        btnSignOut.classList.remove("hidden");
        userDisplayEl.classList.remove("hidden");
        userDisplayEl.textContent = `${user.displayName ?? user.email}`;
        
        // Show appropriate view based on user type
        if (userType === 'coach') {
            appEl.classList.add("hidden");
            coachAppEl.classList.remove("hidden");
        } else {
            appEl.classList.remove("hidden");
            coachAppEl.classList.add("hidden");
        }
    }
}

async function loadUserProfile(userId) {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        const data = snap.data();
        heightEl.value = data.heightCm ?? "";
        weightEl.value = data.weightKg ?? "";
        goalEl.value = data.goal ?? "";
        requirementsEl.value = data.requirements ?? "";
        
        // Check if profile is complete
        isProfileComplete = !!(data.heightCm && data.weightKg && data.goal);
        
        if (isProfileComplete) {
            // Hide profile section and show edit button
            profileSection.classList.add("hidden");
            mainContent.classList.remove("hidden");
            editProfileBtn.classList.remove("hidden");
            editProfileBtn.classList.add("flex");
        } else {
            // Show profile section for first-time users
            profileSection.classList.remove("hidden");
            mainContent.classList.add("hidden");
            editProfileBtn.classList.add("hidden");
        }
    } else {
        // New user - show profile section
        profileSection.classList.remove("hidden");
        mainContent.classList.add("hidden");
        editProfileBtn.classList.add("hidden");
        isProfileComplete = false;
    }
}

async function loadCoachProfile(userEmail) {
    // Check if coach profile exists
    const q = query(
        collection(db, "coaches"),
        where("email", "==", userEmail),
        limit(1)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
        // First time coach - show profile setup
        coachProfileSetup.classList.remove("hidden");
        coachDashboard.classList.add("hidden");
        coachNameEl.value = "";
        coachBioEl.value = "";
        coachExperienceEl.value = "";
        coachRateEl.value = "";
        return null;
    } else {
        // Existing coach - show dashboard
        const coachDoc = snap.docs[0];
        currentCoachId = coachDoc.id;
        coachProfileSetup.classList.add("hidden");
        coachDashboard.classList.remove("hidden");
        
        // Listen for real-time notifications
        listenForNotifications(userEmail);
        
        return coachDoc.id;
    }
}

function listenForNotifications(coachEmail) {
    console.log('Setting up notification listener for:', coachEmail);
    
    // Clean up previous listener
    if (notificationsListener) {
        notificationsListener();
    }
    
    // Listen for new notifications
    const q = query(
        collection(db, "notifications"),
        where("recipientEmail", "==", coachEmail),
        where("read", "==", false),
        orderBy("timestamp", "desc")
    );
    
    notificationsListener = onSnapshot(q, (snapshot) => {
        console.log('Notification snapshot received, changes:', snapshot.docChanges().length);
        snapshot.docChanges().forEach((change) => {
            console.log('Notification change type:', change.type, 'data:', change.data());
            if (change.type === "added") {
                const notification = change.data();
                showNotificationToast(notification);
                // Mark as read
                updateDoc(doc(db, "notifications", change.doc.id), { read: true });
            }
        });
    }, (error) => {
        console.error('Notification listener error:', error);
    });
}

function showNotificationToast(notification) {
    console.log('Showing notification toast for:', notification);
    if (notification.type === 'session_started') {
        const message = `🔔 ${notification.userName} started a session for ${notification.goal}!`;
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in';
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span class="font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Play notification sound (optional)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSBAKQ5fZ8POMPAoXYbjr66dWFApBm+Lyv24gBSyEzvPahTYHImzB8N6UQQsUXLPo7KlYFAlDneHzwXAfBSqCzvLaikAHHGu/8OGYSRAKQpXY8fGNOwsWYLbq7KlZFAlAmN/yvnAfBCuBzfLaizsGH2vA8N+VRAsUXLPp7KpZFAlAmt/ywHEfBCx/zPLaiz0GHmu/8OCWSBEKQpPX8fCMPgsWX7bq7KpZFAlAmt/ywHEfBCx/zPLaiz0GH2q+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2q+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2q+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFAlAmt/ywHEfBCx/zPLajD0GH2m+8OCWSBEJQZLY8fCNPQsWXrbq7KlZFA==');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {
            // Ignore audio errors
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Bookings will auto-refresh via real-time listener
        console.log('Toast notification displayed, real-time listener will update bookings automatically');
    }
}

async function saveCoachProfile(user) {
    const specializations = Array.from(document.querySelectorAll('input[name="specialization"]:checked'))
        .map(cb => cb.value);
    
    if (specializations.length === 0) {
        alert('Please select at least one specialization');
        return;
    }
    
    const coachData = {
        name: coachNameEl.value.trim(),
        email: user.email,
        bio: coachBioEl.value.trim(),
        specializations: specializations,
        yearsExperience: Number(coachExperienceEl.value),
        hourlyRate: Number(coachRateEl.value),
        rating: 5.0, // Default rating
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    await addDoc(collection(db, "coaches"), coachData);
}

async function saveUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName ?? null,
        email: user.email ?? null,
        heightCm: Number(heightEl.value),
        weightKg: Number(weightEl.value),
        goal: goalEl.value,
        requirements: requirementsEl.value.trim() || null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
    }, { merge: true });
}

function renderWorkouts(items) {
    workoutList.innerHTML = "";
    if (!items.length) {
        workoutEmpty.classList.remove("hidden");
        return;
    }
    workoutEmpty.classList.add("hidden");
    for (const w of items) {
        const card = document.createElement("div");
        card.className = "rounded-lg border p-4";
        card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold">${w.title}</h3>
          <p class="text-sm text-gray-600">${w.intensity ?? ""} • ${w.durationMins ?? 0} mins</p>
        </div>
        <span class="rounded bg-gray-100 px-2 py-1 text-xs">${(w.goals ?? []).join(", ")}</span>
      </div>
      <p class="mt-2 text-sm">${w.description ?? ""}</p>
    `;
        workoutList.appendChild(card);
    }
}

async function fetchWorkoutsForGoal(goal) {
    if (!goal) {
        renderWorkouts([]);
        return;
    }
    const q = query(
        collection(db, "workouts"),
        where("goals", "array-contains", goal),
        orderBy("popularity", "desc"),
        limit(12)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderWorkouts(items);
}

function renderCoaches(items, userGoal, aiRecommendations = null) {
    coachList.innerHTML = "";
    if (!items.length) {
        coachEmpty.classList.remove("hidden");
        return;
    }
    coachEmpty.classList.add("hidden");
    
    // Create a map of AI recommendations by coach ID
    const aiScores = new Map();
    if (aiRecommendations) {
        aiRecommendations.forEach(rec => {
            aiScores.set(rec.coachId, rec);
        });
    }
    
    for (const c of items) {
        const card = document.createElement("div");
        const aiRec = aiScores.get(c.id);
        const hasAI = !!aiRec;
        
        card.className = `rounded-lg border p-4 flex flex-col gap-2 ${hasAI ? 'border-indigo-300 dark:border-indigo-700' : ''}`;
        const btnId = `book-${c.id}`;
        
        let aiSection = '';
        if (hasAI) {
            aiSection = `
                <div class="mt-2 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-md border border-indigo-200 dark:border-indigo-800">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-semibold text-indigo-700 dark:text-indigo-300">AI MATCH SCORE</span>
                        <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">${aiRec.matchScore}%</span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300 mb-2">${aiRec.reasoning}</p>
                    <div class="flex flex-wrap gap-1">
                        ${aiRec.keyStrengths.map(s => `<span class="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded">${s}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold">${c.name}</h3>
          <p class="text-sm text-gray-400">${c.yearsExperience ?? 0} yrs experience</p>
        </div>
        <span class="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-xs text-blue-300">${(c.specializations ?? []).join(", ")}</span>
      </div>
      <p class="text-sm text-gray-300">${c.bio ?? ""}</p>
      ${aiSection}
      <div class="flex items-center justify-between mt-2">
        <span class="text-sm text-gray-400">Rate: ${c.hourlyRate ? `₹${c.hourlyRate}/hr` : "On request"}</span>
        <button id="${btnId}" class="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white text-sm font-semibold hover:from-purple-500 hover:to-pink-500">Book</button>
      </div>
    `;
        coachList.appendChild(card);
        const btn = card.querySelector(`#${btnId}`);
        btn.addEventListener("click", async () => {
            // Use the user's saved goal from profile, or the filtered goal
            const bookingGoal = goalEl.value || userGoal || c.specializations?.[0] || 'general_fitness';
            openBookingModal({ id: c.id, name: c.name }, bookingGoal);
        });
    }
}

async function fetchCoachesForGoal(goal) {
    // For users: if no goal selected, show ALL coaches
    // If goal selected, filter by goal
    let q;
    if (!goal) {
        q = query(
            collection(db, "coaches"),
            orderBy("rating", "desc"),
            limit(50)
        );
    } else {
        q = query(
            collection(db, "coaches"),
            where("specializations", "array-contains", goal),
            orderBy("rating", "desc"),
            limit(12)
        );
    }
    
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Get AI recommendations if user profile exists (but don't fail if AI errors)
    const user = auth.currentUser;
    let aiRecommendations = null;
    
    if (user && items.length > 0 && goal) {
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userProfile = userSnap.data();
                aiRecommendations = await aiService.generateCoachRecommendations(userProfile, items);
                
                // Sort coaches by AI match score if available
                if (aiRecommendations && aiRecommendations.length > 0) {
                    const scoreMap = new Map(aiRecommendations.map(r => [r.coachId, r.matchScore]));
                    items.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
                }
            }
        } catch (error) {
            console.warn('AI coach matching unavailable (continuing without AI scores):', error.message);
            // Continue without AI recommendations - coaches will still display
        }
    }
    
    renderCoaches(items, goal, aiRecommendations);
}

function renderBookings(items) {
    bookingList.innerHTML = "";
    if (!items.length) {
        bookingEmpty.classList.remove("hidden");
        return;
    }
    bookingEmpty.classList.add("hidden");
    
    // Separate pending, active and past bookings
    const activeBookings = items.filter(b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'active');
    const pastBookings = items.filter(b => b.status === 'completed' || b.status === 'cancelled');
    
    // Render Active Bookings Section
    if (activeBookings.length > 0) {
        const activeSection = document.createElement("div");
        activeSection.className = "mb-4";
        activeSection.innerHTML = `
            <h3 class="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <span class="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Active Bookings (${activeBookings.length})
            </h3>
            <div id="active-bookings-list" class="space-y-3"></div>
        `;
        bookingList.appendChild(activeSection);
        
        const activeList = activeSection.querySelector("#active-bookings-list");
        for (const b of activeBookings) {
            const row = createBookingCard(b, true);
            activeList.appendChild(row);
        }
    }
    
    // Render Past Bookings Section (Collapsible)
    if (pastBookings.length > 0) {
        const pastSection = document.createElement("div");
        pastSection.className = "mt-6";
        pastSection.innerHTML = `
            <button id="toggle-past-bookings" class="w-full flex items-center justify-between text-left p-3 rounded-lg border border-gray-700/50 bg-gray-900/30 hover:bg-gray-800/50 transition-colors mb-3">
                <h3 class="text-lg font-semibold text-gray-400 flex items-center gap-2">
                    <span class="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                    Past Bookings (${pastBookings.length})
                </h3>
                <svg id="past-bookings-chevron" class="w-5 h-5 text-gray-400 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div id="past-bookings-list" class="space-y-3 hidden"></div>
        `;
        bookingList.appendChild(pastSection);
        
        const pastList = pastSection.querySelector("#past-bookings-list");
        const toggleBtn = pastSection.querySelector("#toggle-past-bookings");
        const chevron = pastSection.querySelector("#past-bookings-chevron");
        
        toggleBtn.addEventListener("click", () => {
            pastList.classList.toggle("hidden");
            chevron.classList.toggle("rotate-180");
        });
        
        for (const b of pastBookings) {
            const row = createBookingCard(b, false);
            pastList.appendChild(row);
        }
    }
}

function createBookingCard(b, isActive) {
    const row = document.createElement("div");
    const statusColors = {
        pending: 'border-yellow-500/30 bg-yellow-500/5',
        confirmed: 'border-emerald-500/30 bg-emerald-500/5',
        active: 'border-emerald-500/30 bg-emerald-500/5',
        scheduled: 'border-blue-500/30 bg-blue-500/5',
        completed: 'border-gray-700/50 bg-gray-900/30',
        cancelled: 'border-red-500/30 bg-red-500/5'
    };
    row.className = `rounded-lg border p-4 flex items-center justify-between gap-4 ${statusColors[b.status] || 'border-gray-700'}`;
    
    const cancelBtnId = `cancel-${b.id}`;
    const endBtnId = `end-${b.id}`;
    const deleteBtnId = `delete-${b.id}`;
    const joinBtnId = `join-${b.id}`;
    const statusBadges = {
        pending: '<span class="inline-block px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⏳ Pending Confirmation</span>',
        confirmed: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Confirmed</span>',
        active: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🟢 Active</span>',
        scheduled: '<span class="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">📅 Scheduled</span>',
        completed: '<span class="inline-block px-2 py-1 rounded text-xs bg-gray-700/50 text-gray-400">✓ Completed</span>',
        cancelled: '<span class="inline-block px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">✕ Cancelled</span>'
    };
    
    const showJoinButton = b.status === 'confirmed' && b.meetingLink;
    const showCancelButton = isActive && (b.status === "pending" || b.status === "confirmed");
    const showEndButton = isActive && (b.status === "confirmed" || b.status === "active");
    const showDeleteButton = !isActive && (b.status === "completed" || b.status === "cancelled");
    
    row.innerHTML = `
      <div class="flex-1">
        <p class="font-medium text-white">${b.coachName ?? b.coachId}</p>
        <p class="text-sm text-gray-400 mt-1">Goal: ${b.goal}</p>
        <p class="text-xs text-gray-500 mt-1">${new Date(b.scheduledAt?.toMillis?.() ?? Date.now()).toLocaleString()}</p>
      </div>
      <div class="flex items-center gap-3">
        ${statusBadges[b.status] || ''}
        ${showJoinButton ? `<a href="${b.meetingLink}" target="_blank" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500 inline-flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session</a>` : ''}
        ${showEndButton ? `<button id="${endBtnId}" class="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 text-blue-400 text-xs font-medium hover:bg-blue-500/20">End Session</button>` : ""}
        ${showCancelButton ? `<button id="${cancelBtnId}" class="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-red-400 text-xs font-medium hover:bg-red-500/20">Cancel</button>` : ""}
        ${showDeleteButton ? `<button id="${deleteBtnId}" class="rounded-lg border border-gray-600/50 bg-gray-800/30 px-3 py-1.5 text-gray-400 text-xs font-medium hover:bg-gray-700/50">Delete</button>` : ""}
      </div>
    `;
    
    if (showCancelButton) {
        const btn = row.querySelector(`#${cancelBtnId}`);
        btn?.addEventListener("click", async () => {
            btn.disabled = true;
            btn.textContent = "Cancelling...";
            try {
                await cancelBooking(b.id);
                await fetchBookings();
            } catch (e) {
                console.error(e);
                btn.disabled = false;
                btn.textContent = "Cancel";
            }
        });
    }
    
    if (showEndButton) {
        const btn = row.querySelector(`#${endBtnId}`);
        btn?.addEventListener("click", async () => {
            if (!confirm('Are you sure you want to end this session?')) return;
            btn.disabled = true;
            btn.textContent = "Ending...";
            try {
                await endSession(b.id);
                await fetchBookings();
            } catch (e) {
                console.error(e);
                alert('Failed to end session: ' + e.message);
                btn.disabled = false;
                btn.textContent = "End Session";
            }
        });
    }
    
    if (showDeleteButton) {
        const btn = row.querySelector(`#${deleteBtnId}`);
        btn?.addEventListener("click", async () => {
            if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
            btn.disabled = true;
            btn.textContent = "Deleting...";
            try {
                await deleteBooking(b.id);
                await fetchBookings();
            } catch (e) {
                console.error(e);
                alert('Failed to delete booking: ' + e.message);
                btn.disabled = false;
                btn.textContent = "Delete";
            }
        });
    }
    
    return row;
}

// Helper function to generate meeting room name
function generateMeetingRoom() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomString = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `fitness-session-${randomString}`;
}

async function fetchBookings() {
    const user = auth.currentUser;
    if (!user) {
        renderBookings([]);
        return;
    }
    const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBookings(items);
}

async function createBooking(coachId, goal, scheduledAt) {
    const user = auth.currentUser;
    if (!user) return;
    console.log('Creating booking for coachId:', coachId, 'goal:', goal);
    
    const coachSnap = await getDoc(doc(db, "coaches", coachId)).catch(() => null);
    const coachData = coachSnap?.exists?.() ? coachSnap.data() : null;
    const coachName = coachData?.name ?? null;
    const coachEmail = coachData?.email ?? null;
    
    console.log('Coach data:', { coachName, coachEmail });
    
    // Generate Jitsi Meet room (free, no API required)
    console.log('Using Jitsi Meet for video sessions');
    const roomName = generateMeetingRoom();
    const meetingId = roomName;
    // Add config parameters to disable waiting room and moderator requirement
    const meetingLink = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`;
    const meetingPassword = '';
    
    const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        coachId,
        coachEmail,
        goal,
        status: "pending", // Always start as pending
        coachName,
        scheduledAt: scheduledAt || serverTimestamp(),
        meetingId: meetingId,
        meetingLink: meetingLink,
        meetingPassword: meetingPassword,
        createdAt: serverTimestamp()
    };
    
    console.log('Booking data:', bookingData);
    const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
    console.log('Booking created with ID:', bookingRef.id);
    
    // Notify the coach about new booking request
    if (coachEmail) {
        await notifyCoach(coachEmail, {
            type: 'booking_request',
            bookingId: bookingRef.id,
            userName: user.displayName || user.email,
            userEmail: user.email,
            goal: goal,
            scheduledAt: scheduledAt ? scheduledAt.toISOString() : 'Now',
            timestamp: serverTimestamp()
        });
    }
    
    return bookingRef.id;
}

async function confirmBooking(bookingId, userEmail) {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { 
        status: "confirmed",
        confirmedAt: serverTimestamp()
    });
    
    // Notify user that booking is confirmed
    if (userEmail) {
        await addDoc(collection(db, "notifications"), {
            recipientEmail: userEmail,
            read: false,
            type: 'booking_confirmed',
            bookingId: bookingId,
            message: 'Your booking has been confirmed! You can now join the session.',
            timestamp: new Date()
        });
    }
}

async function notifyCoach(coachEmail, notificationData) {
    try {
        console.log('Creating notification for:', coachEmail, notificationData);
        const docRef = await addDoc(collection(db, "notifications"), {
            recipientEmail: coachEmail,
            read: false,
            type: notificationData.type,
            bookingId: notificationData.bookingId,
            userName: notificationData.userName,
            goal: notificationData.goal,
            timestamp: new Date() // Use regular Date instead of serverTimestamp for ordering
        });
        console.log('Notification created with ID:', docRef.id);
    } catch (error) {
        console.error('Failed to notify coach:', error);
    }
}

async function fetchCoachBookings() {
    const user = auth.currentUser;
    console.log('fetchCoachBookings called, user:', user?.email, 'currentCoachId:', currentCoachId);
    
    if (!user || !currentCoachId) {
        console.log('No user or coachId, rendering empty');
        renderCoachCalendar([]);
        return;
    }
    
    // Clean up previous listener
    if (bookingsListener) {
        bookingsListener();
    }
    
    // Set up real-time listener for bookings
    const q = query(
        collection(db, "bookings"),
        where("coachId", "==", currentCoachId),
        orderBy("createdAt", "desc"),
        limit(50)
    );
    
    console.log('Setting up real-time bookings listener for coachId:', currentCoachId);
    
    bookingsListener = onSnapshot(q, (snapshot) => {
        console.log('Bookings snapshot received, total docs:', snapshot.docs.length);
        const items = snapshot.docs.map(d => {
            const data = { id: d.id, ...d.data() };
            console.log('Booking item:', data);
            return data;
        });
        renderCoachCalendar(items);
    }, (error) => {
        console.error('Bookings listener error:', error);
    });
}

function renderCoachCalendar(bookings) {
    coachCalendar.innerHTML = "";
    if (!bookings.length) {
        coachBookingsEmpty.classList.remove("hidden");
        return;
    }
    coachBookingsEmpty.classList.add("hidden");
    
    const now = Date.now();
    
    // Categorize bookings
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const activeBookings = bookings.filter(b => b.status === 'active');
    const upcomingBookings = bookings.filter(b => {
        if (b.status === 'scheduled' && b.scheduledAt) {
            return b.scheduledAt.toMillis() > now;
        }
        return false;
    });
    const pastBookings = bookings.filter(b => 
        b.status === 'completed' || 
        b.status === 'cancelled' ||
        (b.scheduledAt && b.scheduledAt.toMillis() < now && b.status === 'scheduled')
    );
    
    // Render Pending Requests
    if (pendingBookings.length > 0) {
        const pendingSection = document.createElement("div");
        pendingSection.className = "mb-6";
        pendingSection.innerHTML = `
            <h3 class="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <span class="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Pending Requests (${pendingBookings.length})
            </h3>
            <div id="pending-sessions-list" class="space-y-3"></div>
        `;
        coachCalendar.appendChild(pendingSection);
        
        const pendingList = pendingSection.querySelector("#pending-sessions-list");
        pendingBookings.forEach(booking => {
            pendingList.appendChild(createCoachBookingCard(booking, 'pending'));
        });
    }
    
    // Render Confirmed & Active Sessions
    const activeAndConfirmed = [...confirmedBookings, ...activeBookings];
    if (activeAndConfirmed.length > 0) {
        const activeSection = document.createElement("div");
        activeSection.className = "mb-6";
        activeSection.innerHTML = `
            <h3 class="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <span class="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Active Sessions (${activeAndConfirmed.length})
            </h3>
            <div id="active-sessions-list" class="space-y-3"></div>
        `;
        coachCalendar.appendChild(activeSection);
        
        const activeList = activeSection.querySelector("#active-sessions-list");
        activeAndConfirmed.forEach(booking => {
            activeList.appendChild(createCoachBookingCard(booking, 'active'));
        });
    }
    
    // Render Upcoming Sessions
    if (upcomingBookings.length > 0) {
        const upcomingSection = document.createElement("div");
        upcomingSection.className = "mb-6";
        upcomingSection.innerHTML = `
            <h3 class="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <span class="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                Upcoming Sessions (${upcomingBookings.length})
            </h3>
            <div id="upcoming-sessions-list" class="space-y-3"></div>
        `;
        coachCalendar.appendChild(upcomingSection);
        
        const upcomingList = upcomingSection.querySelector("#upcoming-sessions-list");
        
        // Group upcoming by date
        const groupedUpcoming = {};
        upcomingBookings.forEach(booking => {
            const date = new Date(booking.scheduledAt.toMillis()).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            if (!groupedUpcoming[date]) groupedUpcoming[date] = [];
            groupedUpcoming[date].push(booking);
        });
        
        Object.keys(groupedUpcoming).forEach(date => {
            const dateGroup = document.createElement("div");
            dateGroup.className = "mb-3";
            dateGroup.innerHTML = `
                <div class="text-sm font-medium text-gray-400 mb-2 pl-2">${date}</div>
                <div class="space-y-2"></div>
            `;
            const dateList = dateGroup.querySelector("div:last-child");
            groupedUpcoming[date].forEach(booking => {
                dateList.appendChild(createCoachBookingCard(booking, 'upcoming'));
            });
            upcomingList.appendChild(dateGroup);
        });
    }
    
    // Render Past Sessions (Collapsible)
    if (pastBookings.length > 0) {
        const pastSection = document.createElement("div");
        pastSection.className = "mt-6";
        pastSection.innerHTML = `
            <button id="toggle-past-sessions" class="w-full flex items-center justify-between text-left p-3 rounded-lg border border-gray-700/50 bg-gray-900/30 hover:bg-gray-800/50 transition-colors mb-3">
                <h3 class="text-lg font-semibold text-gray-400 flex items-center gap-2">
                    <span class="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                    Past Sessions (${pastBookings.length})
                </h3>
                <svg id="past-sessions-chevron" class="w-5 h-5 text-gray-400 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div id="past-sessions-list" class="space-y-3 hidden"></div>
        `;
        coachCalendar.appendChild(pastSection);
        
        const pastList = pastSection.querySelector("#past-sessions-list");
        const toggleBtn = pastSection.querySelector("#toggle-past-sessions");
        const chevron = pastSection.querySelector("#past-sessions-chevron");
        
        toggleBtn.addEventListener("click", () => {
            pastList.classList.toggle("hidden");
            chevron.classList.toggle("rotate-180");
        });
        
        // Group past by date
        const groupedPast = {};
        pastBookings.forEach(booking => {
            const date = booking.scheduledAt 
                ? new Date(booking.scheduledAt.toMillis()).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                })
                : 'Unknown';
            if (!groupedPast[date]) groupedPast[date] = [];
            groupedPast[date].push(booking);
        });
        
        Object.keys(groupedPast).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB - dateA; // Most recent first
        }).forEach(date => {
            const dateGroup = document.createElement("div");
            dateGroup.className = "mb-3";
            dateGroup.innerHTML = `
                <div class="text-sm font-medium text-gray-500 mb-2 pl-2">${date}</div>
                <div class="space-y-2"></div>
            `;
            const dateList = dateGroup.querySelector("div:last-child");
            groupedPast[date].forEach(booking => {
                dateList.appendChild(createCoachBookingCard(booking, 'past'));
            });
            pastList.appendChild(dateGroup);
        });
    }
}

function createCoachBookingCard(booking, category) {
    const card = document.createElement("div");
    
    const statusStyles = {
        pending: 'border-yellow-500/30 bg-yellow-500/5',
        confirmed: 'border-emerald-500/30 bg-emerald-500/5',
        active: 'border-emerald-500/30 bg-emerald-500/5',
        scheduled: 'border-blue-500/30 bg-blue-500/5',
        completed: 'border-gray-700/50 bg-gray-900/30',
        cancelled: 'border-red-500/30 bg-red-500/5'
    };
    
    card.className = `rounded-lg border p-4 ${statusStyles[booking.status] || 'border-gray-700'}`;
    
    const time = booking.scheduledAt 
        ? new Date(booking.scheduledAt.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
        : 'In Progress';
    
    const confirmBtnId = `confirm-${booking.id}`;
    const endBtnId = `coach-end-${booking.id}`;
    const deleteBtnId = `coach-delete-${booking.id}`;
    const joinBtnId = `coach-join-${booking.id}`;
    
    const statusBadges = {
        pending: '<span class="inline-block px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⏳ Pending</span>',
        confirmed: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Confirmed</span>',
        active: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🟢 Active</span>',
        scheduled: '<span class="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">📅 Scheduled</span>',
        completed: '<span class="inline-block px-2 py-1 rounded text-xs bg-gray-700/50 text-gray-400">✓ Completed</span>',
        cancelled: '<span class="inline-block px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">✕ Cancelled</span>'
    };
    
    const showConfirmButton = booking.status === 'pending' && category !== 'past';
    const showJoinButton = booking.status === 'confirmed' && booking.meetingLink && category !== 'past';
    const showEndButton = category !== 'past' && (booking.status === 'confirmed' || booking.status === 'active');
    const showDeleteButton = category === 'past' && (booking.status === 'completed' || booking.status === 'cancelled');
    
    card.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <p class="font-medium text-white">${booking.userName || booking.userEmail || 'User'}</p>
                <p class="text-sm text-gray-400 mt-1">Goal: ${booking.goal}</p>
                ${category !== 'active' ? `<p class="text-xs text-gray-500 mt-1">🕐 ${time}</p>` : '<p class="text-xs text-emerald-400 mt-1">⚡ Session in progress</p>'}
            </div>
            <div class="flex items-center gap-2">
                ${statusBadges[booking.status] || ''}
                ${showConfirmButton ? `<button id="${confirmBtnId}" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500">Confirm Booking</button>` : ''}
                ${showJoinButton ? `<a href="${booking.meetingLink}" target="_blank" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500 inline-flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session</a>` : ''}
                ${showEndButton ? `<button id="${endBtnId}" class="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 text-blue-400 text-xs font-medium hover:bg-blue-500/20">End Session</button>` : ''}
                ${showDeleteButton ? `<button id="${deleteBtnId}" class="rounded-lg border border-gray-600/50 bg-gray-800/30 px-3 py-1.5 text-gray-400 text-xs font-medium hover:bg-gray-700/50">Delete</button>` : ''}
            </div>
        </div>
    `;
    
    // Add event listener for confirm button
    if (showConfirmButton) {
        setTimeout(() => {
            const confirmBtn = card.querySelector(`#${confirmBtnId}`);
            confirmBtn?.addEventListener('click', async () => {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Confirming...';
                try {
                    await confirmBooking(booking.id, booking.userEmail);
                    // Refresh will happen automatically via real-time listener
                } catch (e) {
                    console.error('Failed to confirm booking:', e);
                    alert('Failed to confirm booking: ' + e.message);
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Confirm Booking';
                }
            });
        }, 0);
    }
    
    // Add event listener for end button
    if (showEndButton) {
        setTimeout(() => {
            const endBtn = card.querySelector(`#${endBtnId}`);
            endBtn?.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to end this session?')) return;
                endBtn.disabled = true;
                endBtn.textContent = 'Ending...';
                try {
                    await endSession(booking.id);
                    // Refresh will happen automatically via real-time listener
                } catch (e) {
                    console.error('Failed to end session:', e);
                    alert('Failed to end session: ' + e.message);
                    endBtn.disabled = false;
                    endBtn.textContent = 'End Session';
                }
            });
        }, 0);
    }
    
    // Add event listener for delete button
    if (showDeleteButton) {
        setTimeout(() => {
            const deleteBtn = card.querySelector(`#${deleteBtnId}`);
            deleteBtn?.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Deleting...';
                try {
                    await deleteBooking(booking.id);
                    // Refresh will happen automatically via real-time listener
                } catch (e) {
                    console.error('Failed to delete booking:', e);
                    alert('Failed to delete booking: ' + e.message);
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Delete';
                }
            });
        }, 0);
    }
    
    return card;
}

async function cancelBooking(bookingId) {
    const user = auth.currentUser;
    if (!user) return;
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { status: "cancelled" });
}

async function deleteBooking(bookingId) {
    const user = auth.currentUser;
    if (!user) return;
    
    // Delete the booking from Firestore (Jitsi rooms don't need cleanup)
    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);
}

async function endSession(bookingId) {
    const user = auth.currentUser;
    if (!user) return;
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { 
        status: "completed",
        endedAt: serverTimestamp()
    });
}

// Modal event handlers
bookingNowBtn.addEventListener("click", () => {
    isBookingNow = true;
    bookingDatetimeContainer.classList.add("hidden");
    bookingDatetimeError.classList.add("hidden");
    
    // Update button styles
    bookingNowBtn.className = "flex-1 rounded-md border-2 border-brand-500 bg-brand-50 dark:bg-brand-950 px-4 py-3 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900";
    bookingLaterBtn.className = "flex-1 rounded-md border-2 border-gray-300 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800";
});

bookingLaterBtn.addEventListener("click", () => {
    isBookingNow = false;
    bookingDatetimeContainer.classList.remove("hidden");
    bookingDatetimeError.classList.add("hidden");
    
    // Update button styles
    bookingNowBtn.className = "flex-1 rounded-md border-2 border-gray-300 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800";
    bookingLaterBtn.className = "flex-1 rounded-md border-2 border-brand-500 bg-brand-50 dark:bg-brand-950 px-4 py-3 text-sm font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900";
});

bookingCancelBtn.addEventListener("click", () => {
    closeBookingModal();
});

bookingConfirmBtn.addEventListener("click", async () => {
    console.log('Confirm clicked, pendingBookingCoach:', pendingBookingCoach, 'pendingBookingGoal:', pendingBookingGoal, 'isBookingNow:', isBookingNow);
    
    if (!pendingBookingCoach || !pendingBookingGoal) {
        console.error('Missing coach or goal data');
        alert('Missing booking information. Please try again.');
        return;
    }
    
    if (isBookingNow) {
        // Start session now
        bookingConfirmBtn.disabled = true;
        bookingConfirmBtn.textContent = 'Requesting...';
        try {
            console.log('Creating immediate booking...');
            await createBooking(pendingBookingCoach.id, pendingBookingGoal, null);
            closeBookingModal();
            alert('Booking request sent! Waiting for coach confirmation. You will be notified when the coach accepts.');
            await fetchBookings();
        } catch (e) {
            console.error('Booking error:', e);
            alert('Failed to create booking: ' + e.message);
        } finally {
            bookingConfirmBtn.disabled = false;
            bookingConfirmBtn.textContent = 'Confirm';
        }
    } else {
        // Book for later
        const value = bookingDatetime.value;
        const selectedMs = value ? Date.parse(value) : NaN;
        if (!selectedMs || Number.isNaN(selectedMs) || selectedMs < Date.now()) {
            bookingDatetimeError.classList.remove("hidden");
            return;
        }
        bookingConfirmBtn.disabled = true;
        bookingConfirmBtn.textContent = 'Requesting...';
        try {
            console.log('Creating scheduled booking...');
            await createBooking(pendingBookingCoach.id, pendingBookingGoal, new Date(selectedMs));
            closeBookingModal();
            alert('Booking request sent! Waiting for coach confirmation. You will be notified when the coach accepts.');
            await fetchBookings();
            closeBookingModal();
            await fetchBookings();
        } catch (e) {
            console.error('Booking error:', e);
            alert('Failed to create booking: ' + e.message);
        } finally {
            bookingConfirmBtn.disabled = false;
            bookingConfirmBtn.textContent = 'Confirm';
        }
    }
});

// Auth handlers
btnUserLogin.addEventListener("click", () => {
    userType = 'user';
    localStorage.setItem('userType', 'user');
    signInUser();
});

btnCoachLogin.addEventListener("click", () => {
    userType = 'coach';
    localStorage.setItem('userType', 'coach');
    signInUser();
});

async function signInUser() {
    console.log(`Sign in as ${userType} clicked`);
    const provider = new GoogleAuthProvider();
    
    try {
        console.log('Attempting popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        console.log('Popup sign-in successful:', result.user);
    } catch (error) {
        console.error('Popup sign-in error:', error.code, error.message);
        
        // If popup was blocked or closed
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.log('Popup blocked, trying redirect method...');
            alert('Popup was blocked. Redirecting to Google sign-in page...');
            await signInWithRedirect(auth, provider);
        } else {
            alert(`Sign-in failed: ${error.message}`);
        }
    }
}

// Handle redirect result on page load
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log('Signed in via redirect:', result.user);
        }
    })
    .catch((error) => {
        console.error('Redirect sign-in error:', error);
        alert(`Redirect sign-in failed: ${error.message}`);
    });

btnSignOut.addEventListener("click", async () => {
    await signOut(auth);
    // Clear userType on sign out
    localStorage.removeItem('userType');
    userType = null;
});

// Profile form submit
profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    profileStatus.textContent = "Saving...";
    try {
        await saveUserProfile(user);
        profileStatus.textContent = "Saved.";
        
        // Mark profile as complete and hide form
        isProfileComplete = true;
        profileSection.classList.add("hidden");
        mainContent.classList.remove("hidden");
        editProfileBtn.classList.remove("hidden");
        editProfileBtn.classList.add("flex");
        
        // Load all coaches when profile is saved
        await Promise.all([
            fetchWorkoutsForGoal(goalEl.value),
            fetchCoachesForGoal(goalEl.value || null)
        ]);
    } catch (e) {
        profileStatus.textContent = "Failed to save.";
        console.error(e);
    } finally {
        setTimeout(() => (profileStatus.textContent = ""), 2000);
    }
});

// Edit profile button
editProfileBtn.addEventListener("click", () => {
    profileSection.classList.remove("hidden");
    mainContent.classList.add("hidden");
    cancelEditProfileBtn.classList.remove("hidden");
});

// Cancel edit profile
cancelEditProfileBtn.addEventListener("click", () => {
    profileSection.classList.add("hidden");
    mainContent.classList.remove("hidden");
    cancelEditProfileBtn.classList.add("hidden");
});

// Coach profile form submit
coachProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    coachProfileStatus.textContent = "Saving...";
    try {
        await saveCoachProfile(user);
        coachProfileStatus.textContent = "Profile saved! Loading dashboard...";
        
        // Reload coach profile to show dashboard
        const coachId = await loadCoachProfile(user.email);
        if (coachId) {
            await fetchCoachBookings();
        }
    } catch (e) {
        coachProfileStatus.textContent = "Failed to save.";
        console.error(e);
        alert('Error saving profile: ' + e.message);
    } finally {
        setTimeout(() => (coachProfileStatus.textContent = ""), 2000);
    }
});

refreshWorkouts.addEventListener("click", async () => {
    await fetchWorkoutsForGoal(goalEl.value);
});

refreshCoaches.addEventListener("click", async () => {
    await fetchCoachesForGoal(goalEl.value);
});

refreshBookings.addEventListener("click", async () => {
    await fetchBookings();
});

coachRefreshBookings.addEventListener("click", async () => {
    await fetchCoachBookings();
});

// AI Workout Generation
generateWorkoutBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Check if profile is complete
    if (!heightEl.value || !weightEl.value || !goalEl.value) {
        alert('Please complete your profile first (height, weight, and goal are required).');
        return;
    }
    
    generateWorkoutBtn.disabled = true;
    generateWorkoutBtn.textContent = 'Generating...';
    
    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            alert('Please save your profile first.');
            return;
        }
        
        const userProfile = userSnap.data();
        const workout = await aiService.generatePersonalizedWorkout(userProfile);
        
        renderAIWorkout(workout);
        
        // Save workout to Firestore
        await addDoc(collection(db, "ai_workouts"), {
            userId: user.uid,
            workout: workout,
            createdAt: serverTimestamp()
        });
        
    } catch (error) {
        console.error('Failed to generate workout:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exceeded')) {
            alert('⚠️ OpenAI API quota exceeded.\n\nYour OpenAI account has run out of credits.\n\nOptions:\n1. Add billing at https://platform.openai.com/account/billing\n2. Create a new OpenAI account with $5 free credits\n3. Continue using the app without AI features\n\nThe rest of the app still works!');
        } else if (error.message.includes('API request failed')) {
            alert('OpenAI API Error: ' + error.message + '\n\nPlease check:\n1. Your API key is correct\n2. Your OpenAI account has credits\n3. Visit https://platform.openai.com/account/billing');
        } else {
            alert('Failed to generate workout: ' + (error.message || 'Unknown error') + '\n\nCheck browser console (F12) for details.');
        }
    } finally {
        generateWorkoutBtn.disabled = false;
        generateWorkoutBtn.textContent = 'Generate My Workout';
    }
});

function renderAIWorkout(workout) {
    aiWorkoutEmpty.classList.add('hidden');
    aiWorkoutContainer.classList.remove('hidden');
    
    const exercisesList = workout.exercises.map((ex, index) => `
        <div class="border-l-4 border-indigo-500 pl-3 py-2">
            <label class="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
                <input type="checkbox" class="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" id="exercise-${index}">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 dark:text-gray-100">${ex.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        ${ex.checklistItem || `${ex.sets ? `${ex.sets} sets` : ''} ${ex.reps ? `× ${ex.reps} reps` : ''} ${ex.duration ? `• ${ex.duration}` : ''}`}
                    </p>
                    ${ex.notes ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 ${ex.notes}</p>` : ''}
                </div>
            </label>
        </div>
    `).join('');
    
    const warmupItems = workout.warmup?.checklistItems?.map((item, index) => 
        `<label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded" id="warmup-${index}">
            <span class="text-sm">${item}</span>
        </label>`
    ).join('') || `<p class="text-sm">${workout.warmup?.description || workout.warmup}</p>`;
    
    const cooldownItems = workout.cooldown?.checklistItems?.map((item, index) => 
        `<label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded" id="cooldown-${index}">
            <span class="text-sm">${item}</span>
        </label>`
    ).join('') || `<p class="text-sm">${workout.cooldown?.description || workout.cooldown}</p>`;
    
    const equipmentBadges = workout.equipmentNeeded?.map(eq => 
        `<span class="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">${eq}</span>`
    ).join(' ') || 'No equipment needed';
    
    aiWorkoutContent.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">${workout.title}</h3>
                    <div class="flex gap-2 mt-2 text-sm">
                        <span class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full font-medium">
                            ${workout.intensity} intensity
                        </span>
                        <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full font-medium">
                            ${workout.duration} mins
                        </span>
                        <span class="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-3 py-1 rounded-full font-medium">
                            ~${workout.estimatedCalories} cal
                        </span>
                    </div>
                </div>
            </div>
            
            ${workout.aiReasoning ? `
                <div class="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                    <h4 class="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Why This Workout?
                    </h4>
                    <p class="text-sm text-indigo-800 dark:text-indigo-200">${workout.aiReasoning}</p>
                </div>
            ` : ''}
            
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    🔥 Warm-up (5 mins)
                    <span class="text-xs font-normal text-gray-500">Check off as you complete</span>
                </h4>
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded space-y-2">
                    ${warmupItems}
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    💪 Main Exercises
                    <span class="text-xs font-normal text-gray-500">Check off as you complete</span>
                </h4>
                <div class="space-y-3">
                    ${exercisesList}
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    🧘 Cool-down (5 mins)
                    <span class="text-xs font-normal text-gray-500">Check off as you complete</span>
                </h4>
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded space-y-2">
                    ${cooldownItems}
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">🎯 Equipment Needed</h4>
                <div class="flex flex-wrap gap-2">
                    ${equipmentBadges}
                </div>
            </div>
        </div>
    `;
}

// Auth state changes
onAuthStateChanged(auth, async (user) => {
    toggleAuthUI(user);
    if (user) {
        if (userType === 'coach') {
            const coachId = await loadCoachProfile(user.email);
            if (coachId) {
                // Coach profile exists, load bookings
                currentCoachId = coachId;
                await fetchCoachBookings();
            }
            // Otherwise show profile setup form
        } else {
            await loadUserProfile(user.uid);
            // Load ALL coaches for users to see
            await Promise.all([
                fetchWorkoutsForGoal(goalEl.value),
                fetchCoachesForGoal(null), // null = show all coaches
                fetchBookings()
            ]);
        }
    } else {
        renderWorkouts([]);
        renderCoaches([], null);
        renderBookings([]);
        renderCoachCalendar([]);
        currentCoachId = null;
    }
});