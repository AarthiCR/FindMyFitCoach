// Use ESM imports from Firebase CDN (no build step required)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
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
console.log('🤖 AI Service initialized:', {
    hasApiKey: !!openaiApiKey,
    apiKeyLength: openaiApiKey?.length || 0,
    apiKeyPreview: openaiApiKey ? openaiApiKey.substring(0, 20) + '...' : 'None'
});

// Test AI service on page load
(async function testAIService() {
    if (!openaiApiKey) {
        console.error('❌ No OpenAI API key found! AI features will not work.');
        console.error('Please add your OpenAI API key to config/config.js');
        return;
    }
    
    console.log('🧪 Testing AI service connection...');
    try {
        // Simple test call with minimal tokens
        const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`
            }
        });
        
        if (testResponse.ok) {
            console.log('✅ OpenAI API connection successful!');
        } else {
            const errorData = await testResponse.json().catch(() => ({}));
            console.error('❌ OpenAI API test failed:', {
                status: testResponse.status,
                error: errorData
            });
            
            if (testResponse.status === 401) {
                console.error('🔑 API KEY IS INVALID! Please update your OpenAI API key in config/config.js');
            } else if (testResponse.status === 429) {
                console.error('💳 API QUOTA EXCEEDED! Your OpenAI account has no credits. Add billing at https://platform.openai.com/account/billing');
            }
        }
    } catch (error) {
        console.error('❌ AI service test error:', error);
    }
})();

// UI elements
const userMenu = document.getElementById("user-menu");
const userDisplayEl = document.getElementById("user-display");
const userDisplayName = document.getElementById("user-display-name");
const userDropdown = document.getElementById("user-dropdown");
const btnSignInUser = document.getElementById("btn-sign-in-user");
const btnSignInCoach = document.getElementById("btn-sign-in-coach");
const btnSignOut = document.getElementById("btn-sign-out");
const landingHero = document.getElementById("landing-hero");
const gateEl = document.getElementById("auth-gate");
const appEl = document.getElementById("app");
const coachAppEl = document.getElementById("coach-app");
const editProfileBtn = document.getElementById("edit-profile-btn");
const cancelEditProfileBtn = document.getElementById("cancel-edit-profile");
const profileSection = document.getElementById("profile-section");
const mainContent = document.getElementById("main-content");

// Auth gate elements - Account type selection
const accountTypeSelection = document.getElementById("account-type-selection");
const loginOptions = document.getElementById("login-options");
const btnSelectUser = document.getElementById("btn-select-user");
const btnSelectCoach = document.getElementById("btn-select-coach");
const btnChangeType = document.getElementById("btn-change-type");
const selectedTypeIcon = document.getElementById("selected-type-icon");
const selectedTypeText = document.getElementById("selected-type-text");

// Auth gate elements - Auth method tabs
const tabGoogle = document.getElementById("tab-google");
const tabEmail = document.getElementById("tab-email");
const panelGoogle = document.getElementById("panel-google");
const panelEmail = document.getElementById("panel-email");
const btnGoogleSignin = document.getElementById("btn-google-signin");

// Auth gate elements - Email/Password forms
const btnShowLogin = document.getElementById("btn-show-login");
const btnShowSignup = document.getElementById("btn-show-signup");
const emailLoginForm = document.getElementById("email-login-form");
const emailSignupForm = document.getElementById("email-signup-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupPasswordConfirm = document.getElementById("signup-password-confirm");
const signupError = document.getElementById("signup-error");

// Legacy button references (for backward compatibility if needed)
const btnUserLogin = btnSelectUser;
const btnCoachLogin = btnSelectCoach;

// Restore userType from localStorage on page load
let userType = localStorage.getItem('userType') || null; // 'user' or 'coach'
console.log('🚀 Script loaded. userType from localStorage:', userType);

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

// Analytics elements
const refreshAnalytics = document.getElementById("refresh-analytics");
const analyticsLoading = document.getElementById("analytics-loading");
const analyticsContent = document.getElementById("analytics-content");
const analyticsEmpty = document.getElementById("analytics-empty");

// Coach elements
const coachMenu = document.getElementById("coach-menu");
const coachDisplayEl = document.getElementById("coach-display");
const coachDisplayName = document.getElementById("coach-display-name");
const coachDropdown = document.getElementById("coach-dropdown");
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

let currentUserId = null; // Track current user ID
let currentCoachId = null;
let notificationsListener = null;
let bookingsListener = null;
let userBookingsListener = null; // Separate listener for user bookings
let allBookingsListener = null; // Listener for all bookings to update coach availability
let broadcastBookingsListener = null; // Listener for broadcast booking requests

// Presence tracking variables
const ONLINE_PRESENCE_INTERVAL = 30000; // 30 seconds
const OFFLINE_TIMEOUT = 90000; // 90 seconds offline threshold
let presenceHeartbeat = null;
let coachPresenceListener = null;

// AI Workout elements
const generateWorkoutBtn = document.getElementById("generate-workout");
const aiWorkoutContainer = document.getElementById("ai-workout-container");
const aiWorkoutContent = document.getElementById("ai-workout-content");
const aiWorkoutEmpty = document.getElementById("ai-workout-empty");

// Booking modal elements (for immediate booking with specific coach)
const bookingModal = document.getElementById("booking-modal");
const bookingModalCoach = document.getElementById("booking-modal-coach");
const bookingCancelBtn = document.getElementById("booking-cancel-btn");
const bookingConfirmBtn = document.getElementById("booking-confirm-btn");

// Schedule ahead modal elements (broadcast to all coaches)
const scheduleAheadModal = document.getElementById("schedule-ahead-modal");
const scheduleGoal = document.getElementById("schedule-goal");
const scheduleDatetime = document.getElementById("schedule-datetime");
const scheduleDatetimeError = document.getElementById("schedule-datetime-error");
const scheduleCancelBtn = document.getElementById("schedule-cancel-btn");
const scheduleConfirmBtn = document.getElementById("schedule-confirm-btn");
const btnScheduleAhead = document.getElementById("btn-schedule-ahead");

let pendingBookingCoach = null; // { id, name }
let pendingBookingGoal = null;

// Video call elements
const videoCallModal = document.getElementById("video-call-modal");
const videoCallTitle = document.getElementById("video-call-title");
const closeVideoCallBtn = document.getElementById("close-video-call");
const jitsiContainer = document.getElementById("jitsi-container");
const userProfilePanel = document.getElementById("user-profile-panel");
const userWorkoutPanel = document.getElementById("user-workout-panel");

// Pre-session review modal elements
const preSessionModal = document.getElementById("pre-session-modal");
const closePreSessionBtn = document.getElementById("close-pre-session");
const completeReviewBtn = document.getElementById("complete-review-btn");
const saveNotesBtn = document.getElementById("save-notes-btn");
const coachSessionNotes = document.getElementById("coach-session-notes");
const aiAnalysisLoading = document.getElementById("ai-analysis-loading");
const aiAnalysisContent = document.getElementById("ai-analysis-content");

// Session join reminder modal elements
const sessionJoinModal = document.getElementById("session-join-modal");
const joinSessionBtn = document.getElementById("join-session-btn");
const dismissJoinModalBtn = document.getElementById("dismiss-join-modal-btn");
const joinModalClientName = document.getElementById("join-modal-client-name");
const joinModalGoal = document.getElementById("join-modal-goal");
const joinModalTime = document.getElementById("join-modal-time");
let pendingJoinBooking = null;

// Feedback modal elements
const feedbackModal = document.getElementById("feedback-modal");
const starRatingContainer = document.getElementById("star-rating");
const starButtons = document.querySelectorAll(".star-btn");
const ratingText = document.getElementById("rating-text");
const feedbackOtherName = document.getElementById("feedback-other-name");
const feedbackNotes = document.getElementById("feedback-notes");
const submitFeedbackBtn = document.getElementById("submit-feedback-btn");
const skipFeedbackBtn = document.getElementById("skip-feedback-btn");
let currentFeedbackBooking = null;
let selectedRating = 0;

// Global variables for current review session
let currentReviewBooking = null;
let savedAIAnalysis = null; // Store AI analysis for workout generation
const sessionNotesTextarea = document.getElementById("session-notes");
const saveSessionNotesBtn = document.getElementById("save-session-notes");
const notesStatus = document.getElementById("notes-status");
let jitsiApi = null;
let currentCallBookingId = null;
let callStarted = false; // Track if the call has actually started
let participantCount = 0; // Track number of participants
let currentSessionUserId = null; // Track the user in current session
let workoutChecklist = []; // Track workout items for the session

// User workout summaries elements (for user's view in video session)
const userPastSummariesList = document.getElementById("user-past-summaries-list");
const userSummariesEmpty = document.getElementById("user-summaries-empty");

function openBookingModal(coach, goal) {
    pendingBookingCoach = coach;
    pendingBookingGoal = goal;
    bookingModalCoach.textContent = `Coach: ${coach.name ?? coach.id}`;
    bookingModal.classList.remove("hidden");
}

function closeBookingModal() {
    bookingModal.classList.add("hidden");
    pendingBookingCoach = null;
    pendingBookingGoal = null;
}

function openScheduleAheadModal() {
    scheduleGoal.value = "";
    scheduleDatetime.value = "";
    scheduleDatetimeError.classList.add("hidden");
    scheduleAheadModal.classList.remove("hidden");
}

function closeScheduleAheadModal() {
    scheduleAheadModal.classList.add("hidden");
    scheduleGoal.value = "";
    scheduleDatetime.value = "";
}

function startEmbeddedVideoCall(bookingId, roomName, title, isModerator = false) {
    // Clean up any existing Jitsi instance first
    if (jitsiApi) {
        console.log('Disposing existing Jitsi instance');
        jitsiApi.dispose();
        jitsiApi = null;
        jitsiContainer.innerHTML = '';
    }
    
    currentCallBookingId = bookingId;
    videoCallTitle.textContent = title;
    
    // Apply split-screen layout for coaches only
    const isCoach = userType === 'coach';
    if (isCoach) {
        // Split mode: video on left, user profile panel on right
        videoCallModal.style.width = '100%';
        videoCallModal.style.left = '0';
        videoCallModal.style.right = '0';
        videoCallModal.style.inset = '0';
        videoCallModal.style.height = '';
        videoCallModal.style.top = '';
        videoCallModal.style.bottom = '';
        
        // Show user profile panel for coaches
        userProfilePanel.classList.remove('hidden');
        userWorkoutPanel.classList.add('hidden');
        
        // Load user data for the session
        loadUserProfileForSession(bookingId);
    } else {
        // Full screen for users with workout panel
        videoCallModal.style.width = '';
        videoCallModal.style.left = '';
        videoCallModal.style.right = '';
        videoCallModal.style.inset = '0';
        videoCallModal.style.height = '';
        videoCallModal.style.top = '';
        videoCallModal.style.bottom = '';
        
        // Show workout panel for users, hide profile panel
        console.log('👤 User view - showing workout panel');
        userProfilePanel.classList.add('hidden');
        userWorkoutPanel.classList.remove('hidden');
        console.log('User workout panel hidden class:', userWorkoutPanel.classList.contains('hidden'));
        
        // Load user's own workout data
        loadUserWorkoutForSession(bookingId);
    }
    
    videoCallModal.classList.remove("hidden");
    
    // Hide past sessions during active call for cleaner interface
    const coachPastSections = document.getElementById('coach-past-sessions-section');
    const userPastSections = document.getElementById('user-past-sessions-section');
    if (coachPastSections) coachPastSections.classList.add('hidden');
    if (userPastSections) userPastSections.classList.add('hidden');
    
    callStarted = false; // Reset flag
    participantCount = 0; // Reset participant count
    
    // Initialize Jitsi Meet with proper config
    const domain = 'meet.jit.si';
    const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainer,
        configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            requireDisplayName: false,
            // Fit video to container properly
            resolution: 720,
            constraints: {
                video: {
                    aspectRatio: 16 / 9,
                    height: {
                        ideal: 720,
                        max: 720,
                        min: 360
                    }
                }
            },
            // Completely disable lobby/waiting room/authentication
            enableLobbyChat: false,
            lobby: {
                autoKnock: false,
                enableChat: false
            },
            // Disable all authentication and moderation prompts
            disableModeratorIndicator: true,
            disableProfile: true,
            hideConferenceSubject: false,
            // Allow everyone to join without authentication
            enableUserRolesBasedOnToken: false,
            enableFeaturesBasedOnToken: false
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#1f2937',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
            // Hide authentication-related UI elements
            AUTHENTICATION_ENABLE: false,
            FILM_STRIP_MAX_HEIGHT: 90,
            VERTICAL_FILMSTRIP: false,
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ]
        },
        userInfo: {
            displayName: title.replace('Session with ', '')
        }
    };
    
    console.log('Starting Jitsi call with room:', roomName, 'Role:', isModerator ? 'Coach (first to join will be moderator)' : 'User');
    
    // Check if Jitsi API is available
    if (typeof window.JitsiMeetExternalAPI === 'undefined') {
        console.error('Jitsi Meet External API not loaded');
        alert('Video call service is not available. Please refresh the page and try again.');
        closeVideoCall();
        return;
    }
    
    jitsiApi = new window.JitsiMeetExternalAPI(domain, options);
    
    // Track when the conference actually starts (user joins successfully)
    jitsiApi.addEventListener('videoConferenceJoined', () => {
        console.log('User successfully joined video conference');
        callStarted = true;
    });
    
    // Track participant count to avoid ending call prematurely
    jitsiApi.addEventListener('participantJoined', () => {
        participantCount++;
        console.log('Participant joined, total:', participantCount);
    });
    
    jitsiApi.addEventListener('participantLeft', () => {
        participantCount--;
        console.log('Participant left, remaining:', participantCount);
    });
    
    // Listen for when user leaves the call - but only if call has started
    jitsiApi.addEventListener('videoConferenceLeft', async () => {
        console.log('videoConferenceLeft event fired, callStarted:', callStarted);
        // Only end session if the call had actually started (avoid auth dialog triggers)
        if (callStarted) {
            // Add a small delay to ensure it's a real leave event, not a UI interaction
            setTimeout(async () => {
                if (!jitsiApi) return; // Already closed
                console.log('User left video conference after delay check');
                await handleVideoCallEnd();
            }, 500);
        }
    });
    
    // Listen for when conference ends
    jitsiApi.addEventListener('readyToClose', async () => {
        console.log('Video conference ready to close');
        if (callStarted) {
            await handleVideoCallEnd();
        }
    });
}

async function handleVideoCallEnd() {
    if (currentCallBookingId) {
        try {
            // Don't auto-save workout session - let coach add notes manually
            // The coach can use the "Save Session Summary" button to save with notes
            
            // Automatically mark session as completed
            await endSession(currentCallBookingId);
            console.log('Session automatically ended:', currentCallBookingId);
            
            // Remind coach to save notes if they haven't
            if (userType === 'coach' && workoutChecklist.length > 0) {
                const hasNotes = sessionNotesTextarea?.value.trim();
                if (!hasNotes) {
                    console.log('💡 Reminder: Add session notes before closing');
                }
            }
        } catch (e) {
            console.error('Failed to auto-end session:', e);
        }
    }
    closeVideoCall();
}

function closeVideoCall() {
    if (jitsiApi) {
        jitsiApi.dispose();
        jitsiApi = null;
    }
    
    // Cleanup workout progress listener
    if (workoutProgressListener) {
        workoutProgressListener();
        workoutProgressListener = null;
        console.log('🔌 Workout progress listener disconnected');
    }
    
    videoCallModal.classList.add("hidden");
    userProfilePanel.classList.add("hidden");
    userWorkoutPanel.classList.add("hidden");
    // Reset inline styles
    videoCallModal.style.width = '';
    videoCallModal.style.left = '';
    videoCallModal.style.right = '';
    videoCallModal.style.inset = '';
    videoCallModal.style.height = '';
    videoCallModal.style.top = '';
    videoCallModal.style.bottom = '';
    jitsiContainer.innerHTML = '';
    currentCallBookingId = null;
    currentSessionUserId = null;
    workoutChecklist = [];
    callStarted = false; // Reset flag
    participantCount = 0; // Reset count
}

// Close video call button handler
closeVideoCallBtn.addEventListener("click", async () => {
    if (currentCallBookingId && confirm('Are you sure you want to end this session?')) {
        await handleVideoCallEnd();
    }
});

// Pre-session modal event listeners
closePreSessionBtn?.addEventListener("click", () => {
    closePreSessionReview();
});

completeReviewBtn?.addEventListener("click", async () => {
    completeReviewBtn.disabled = true;
    completeReviewBtn.innerHTML = 'Starting Session...';
    try {
        await completeReviewAndJoinSession();
    } catch (error) {
        console.error('Error completing review:', error);
        alert('Failed to start session: ' + error.message);
    } finally {
        completeReviewBtn.disabled = false;
        completeReviewBtn.innerHTML = 'Complete Review & Join Session';
    }
});

// Session join modal event listeners
joinSessionBtn?.addEventListener("click", async () => {
    if (!pendingJoinBooking) return;
    
    // Hide the modal
    sessionJoinModal?.classList.add('hidden');
    
    // Start the session
    const roomName = pendingJoinBooking.meetingId || pendingJoinBooking.meetingLink.split('/').pop().split('#')[0];
    
    // Determine if this is coach or user based on userType
    const isCoach = userType === 'coach';
    const title = isCoach 
        ? `Session with ${pendingJoinBooking.userName || 'User'}` 
        : `Session with ${pendingJoinBooking.coachName || 'Coach'}`;
    
    // Update booking status to active and join
    try {
        await updateDoc(doc(db, 'bookings', pendingJoinBooking.id), {
            status: 'active',
            joinedAt: serverTimestamp()
        });
        
        startEmbeddedVideoCall(pendingJoinBooking.id, roomName, title, isCoach);
        pendingJoinBooking = null;
    } catch (error) {
        console.error('Error joining session:', error);
        alert('Failed to join session: ' + error.message);
    }
});

dismissJoinModalBtn?.addEventListener("click", () => {
    sessionJoinModal?.classList.add('hidden');
    pendingJoinBooking = null;
});

// Feedback modal event listeners
skipFeedbackBtn?.addEventListener("click", () => {
    closeFeedbackModal();
});

submitFeedbackBtn?.addEventListener("click", async () => {
    await submitFeedback();
});

// Star rating interaction
document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const rating = parseInt(this.getAttribute('data-rating'));
        selectedRating = rating;
        
        // Update visual state
        document.querySelectorAll('.star-btn').forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
        
        // Update text and enable submit button
        const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        ratingText.textContent = ratingLabels[rating];
        submitFeedbackBtn.disabled = false;
    });
    
    // Hover effect
    btn.addEventListener('mouseenter', function() {
        const rating = parseInt(this.getAttribute('data-rating'));
        document.querySelectorAll('.star-btn').forEach((star, index) => {
            if (index < rating) {
                star.style.transform = 'scale(1.1)';
            }
        });
    });
    
    btn.addEventListener('mouseleave', function() {
        document.querySelectorAll('.star-btn').forEach(star => {
            star.style.transform = 'scale(1)';
        });
    });
});

saveNotesBtn?.addEventListener("click", async () => {
    if (!currentReviewBooking) return;
    
    const notes = coachSessionNotes.value.trim();
    if (!notes) {
        alert('Please enter some notes before saving.');
        return;
    }
    
    try {
        saveNotesBtn.disabled = true;
        saveNotesBtn.innerHTML = 'Saving...';
        
        await updateDoc(doc(db, 'bookings', currentReviewBooking.id), {
            coachNotes: notes,
            notesUpdatedAt: serverTimestamp()
        });
        
        saveNotesBtn.innerHTML = '✓ Saved';
        setTimeout(() => {
            saveNotesBtn.innerHTML = 'Save Notes';
            saveNotesBtn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Error saving notes:', error);
        alert('Failed to save notes: ' + error.message);
        saveNotesBtn.innerHTML = 'Save Notes';
        saveNotesBtn.disabled = false;
    }
});

// Past sessions toggle event listener
document.getElementById('past-sessions-toggle')?.addEventListener('click', () => {
    const content = document.getElementById('past-sessions-content');
    const arrow = document.getElementById('past-sessions-arrow');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.classList.add('rotate-180');
    } else {
        content.classList.add('hidden');
        arrow.classList.remove('rotate-180');
    }
});

// Hide past sessions during video calls for cleaner interface
function hidePastSessionsDuringCall() {
    const coachPastSections = document.getElementById('coach-past-sessions-section');
    const userPastSections = document.getElementById('user-past-sessions-section');
    
    if (coachPastSections) {
        coachPastSections.classList.add('hidden');
    }
    if (userPastSections) {
        userPastSections.classList.add('hidden');
    }
}

// Show past sessions when not in call
function showPastSessionsWhenNotInCall() {
    const coachPastSections = document.getElementById('coach-past-sessions-section');
    const userPastSections = document.getElementById('user-past-sessions-section');
    
    if (coachPastSections) {
        coachPastSections.classList.remove('hidden');
    }
    if (userPastSections) {
        userPastSections.classList.remove('hidden');
    }
}

// Load user profile data for the coaching session
async function loadUserProfileForSession(bookingId) {
    try {
        // Get booking details
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (!bookingSnap.exists()) {
            console.error('Booking not found');
            return;
        }
        
        const booking = bookingSnap.data();
        currentSessionUserId = booking.userId;
        
        // Load user profile
        const userRef = doc(db, "users", booking.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Populate profile summary
            const profileNameEl = document.getElementById('profile-name');
            const userName = userData.name || booking.userName || 'User';
            profileNameEl.textContent = userName;
            
            // Setup hover tooltip for past sessions
            setupUserNameTooltip(profileNameEl, booking.userId, currentCoachId);
            
            document.getElementById('profile-goal').textContent = userData.goal || booking.goal || '-';
            document.getElementById('profile-height').textContent = userData.heightCm ? `${userData.heightCm} cm` : '-';
            document.getElementById('profile-weight').textContent = userData.weightKg ? `${userData.weightKg} kg` : '-';
            document.getElementById('profile-requirements').textContent = userData.requirements || 'No specific requirements';
            
            // Load past workout sessions
            await loadPastWorkouts(booking.userId);
            
            // Generate AI workout plan
            await generateWorkoutPlan(userData);
        }
    } catch (error) {
        console.error('Error loading user profile for session:', error);
    }
}

// Setup hover tooltip for user name showing past summaries
function setupUserNameTooltip(nameElement, userId, coachId) {
    const tooltip = document.getElementById('profile-name-tooltip');
    const tooltipContent = document.getElementById('tooltip-summaries-content');
    
    if (!tooltip || !tooltipContent) return;
    
    let isHovering = false;
    let summariesLoaded = false;
    let loadTimeout = null;
    
    // Show tooltip on hover
    nameElement.addEventListener('mouseenter', async () => {
        isHovering = true;
        
        // Delay loading to avoid unnecessary queries on quick hovers
        loadTimeout = setTimeout(async () => {
            if (!isHovering) return;
            
            tooltip.classList.remove('hidden');
            
            // Load summaries only once
            if (!summariesLoaded) {
                tooltipContent.innerHTML = '<p class="text-gray-400 italic text-xs">Loading...</p>';
                
                try {
                    const q = query(
                        collection(db, "workoutSessions"),
                        where("userId", "==", userId),
                        where("coachId", "==", coachId),
                        orderBy("completedAt", "desc"),
                        limit(5)
                    );
                    
                    const snapshot = await getDocs(q);
                    
                    if (snapshot.empty) {
                        tooltipContent.innerHTML = '<p class="text-slate-600 italic text-xs">No past sessions with this user</p>';
                    } else {
                        tooltipContent.innerHTML = '';
                        
                        snapshot.docs.forEach(doc => {
                            const session = doc.data();
                            const date = session.completedAt?.toDate?.() || new Date();
                            const completionRate = Math.round((session.completedItems / session.totalItems) * 100);
                            
                            const miniCard = document.createElement('div');
                            miniCard.className = 'bg-gray-900/70 rounded p-2 border border-gray-700/50 mb-2';
                            miniCard.innerHTML = `
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-white font-medium text-xs">${date.toLocaleDateString()}</span>
                                    <span class="text-xs ${
                                        completionRate >= 80 ? 'text-green-400' : 
                                        completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                                    }">${completionRate}%</span>
                                </div>
                                <p class="text-gray-400 text-xs mb-1">${session.goal || 'General Fitness'}</p>
                                ${session.coachNotes ? `
                                    <div class="bg-yellow-900/20 border border-yellow-700/30 rounded p-1 mt-1">
                                        <p class="text-yellow-300 text-xs line-clamp-2">${session.coachNotes}</p>
                                    </div>
                                ` : ''}
                            `;
                            tooltipContent.appendChild(miniCard);
                        });
                        
                        summariesLoaded = true;
                    }
                } catch (error) {
                    console.error('Error loading tooltip summaries:', error);
                    tooltipContent.innerHTML = '<p class="text-red-400 text-xs">Error loading summaries</p>';
                }
            }
        }, 300); // 300ms delay before showing
    });
    
    // Hide tooltip on mouse leave
    nameElement.addEventListener('mouseleave', () => {
        isHovering = false;
        clearTimeout(loadTimeout);
        
        // Small delay before hiding to allow moving to tooltip
        setTimeout(() => {
            if (!isHovering) {
                tooltip.classList.add('hidden');
            }
        }, 200);
    });
    
    // Keep tooltip visible when hovering over it
    tooltip.addEventListener('mouseenter', () => {
        isHovering = true;
    });
    
    tooltip.addEventListener('mouseleave', () => {
        isHovering = false;
        tooltip.classList.add('hidden');
    });
}

// Load past workout sessions for the user
async function loadPastWorkouts(userId) {
    console.log('📚 Loading past workouts for user:', userId);
    const pastWorkoutsList = document.getElementById('past-workouts-list');
    
    if (!pastWorkoutsList) {
        console.error('❌ Past workouts list element not found');
        return;
    }
    
    try {
        pastWorkoutsList.innerHTML = '<p class="text-gray-400 italic text-xs">Loading...</p>';
        
        // First try to get from workoutSessions collection
        console.log('🔍 Querying workoutSessions collection...');
        let q = query(
            collection(db, "workoutSessions"),
            where("userId", "==", userId),
            orderBy("completedAt", "desc"),
            limit(5)
        );
        
        let snapshot = await getDocs(q);
        console.log('Workout sessions found:', snapshot.size);
        
        // If no workout sessions, fall back to completed bookings
        if (snapshot.empty) {
            console.log('⚠️ No workout sessions, trying completed bookings...');
            try {
                q = query(
                    collection(db, "bookings"),
                    where("userId", "==", userId),
                    where("status", "==", "completed"),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                
                snapshot = await getDocs(q);
                console.log('Completed bookings found:', snapshot.size);
            } catch (bookingError) {
                console.warn('⚠️ Booking query failed (may need composite index):', bookingError.message);
                // Try simple query without orderBy
                q = query(
                    collection(db, "bookings"),
                    where("userId", "==", userId),
                    where("status", "==", "completed"),
                    limit(5)
                );
                snapshot = await getDocs(q);
                console.log('Completed bookings (no order) found:', snapshot.size);
            }
        }
        
        if (snapshot.empty) {
            console.log('ℹ️ No past sessions found');
            pastWorkoutsList.innerHTML = '<p class="text-slate-600 italic text-xs">No past sessions</p>';
            return;
        }
        
        pastWorkoutsList.innerHTML = '';
        const sessions = [];
        snapshot.forEach(doc => {
            sessions.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('✅ Rendering', sessions.length, 'detailed past sessions');
        
        // Display detailed summary cards with coach notes
        sessions.forEach(session => {
            // Only show if it has exercise data (from workoutSessions collection)
            if (session.allExercises && session.totalItems) {
                const card = createSummaryCard(session);
                // Adjust styling for the side panel
                card.className = 'bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 hover:border-blue-600/50 transition-colors';
                pastWorkoutsList.appendChild(card);
            } else {
                // Fallback for old bookings without detailed data
                const date = session.completedAt?.toDate?.() || session.endedAt?.toDate?.() || session.createdAt?.toDate?.() || new Date();
                const div = document.createElement('div');
                div.className = 'bg-gray-900/50 rounded p-2 border border-gray-700/30';
                div.innerHTML = `
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-white font-medium text-xs">${date.toLocaleDateString()}</span>
                        <span class="text-emerald-400 text-xs">Completed</span>
                    </div>
                    <p class="text-gray-400 text-xs">${session.goal || 'Session'}</p>
                `;
                pastWorkoutsList.appendChild(div);
            }
        });
        
        console.log('✅ Past sessions rendered successfully');
    } catch (error) {
        console.error('❌ Error loading past workouts:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        
        if (pastWorkoutsList) {
            if (error.code === 'failed-precondition' || error.message?.includes('index')) {
                pastWorkoutsList.innerHTML = '<p class="text-yellow-400 italic text-xs">Database index required. Check console.</p>';
                console.error('🔥 FIRESTORE INDEX REQUIRED! Click the link in the error above or check Firebase Console.');
            } else {
                pastWorkoutsList.innerHTML = '<p class="text-red-600 italic text-xs">Unable to load past sessions</p>';
            }
        }
    }
}

// Generate AI workout plan and display as checklist
async function generateWorkoutPlan(userData) {
    const checklistContainer = document.getElementById('workout-checklist');
    
    try {
        checklistContainer.innerHTML = '<p class="text-gray-400 italic text-xs">Generating workout plan...</p>';
        
        // Generate AI workout plan based on user profile
        let plan = [];
        
        try {
            plan = await aiService.generateWorkoutPlan(userData);
        } catch (aiError) {
            console.warn('AI generation failed, using default plan:', aiError);
        }
        
        // Use default plan if AI fails or returns empty
        if (!plan || plan.length === 0) {
            const goal = userData.goal || 'general fitness';
            plan = [
                'Warm-up: 5 minutes light cardio (jogging or jumping jacks)',
                `${goal === 'weight_loss' ? 'HIIT intervals: 20 minutes' : goal === 'muscle_gain' ? 'Strength training: 3 sets compound exercises' : goal === 'flexibility' ? 'Dynamic stretching: 15 minutes' : 'Mixed cardio: 20 minutes'}`,
                'Core work: Planks 3x30 seconds',
                'Strength exercise: Push-ups 3 sets of 10-15 reps',
                'Lower body: Squats 3 sets of 15 reps',
                'Cardio burst: 5 minutes moderate intensity',
                'Cool-down: 5 minutes stretching and deep breathing'
            ];
        }
        
        workoutChecklist = plan.map((item, index) => ({
            id: index,
            exercise: item,
            completed: false
        }));
        
        renderWorkoutChecklist();
    } catch (error) {
        console.error('Error generating workout plan:', error);
        
        // Fallback to basic default plan
        workoutChecklist = [
            { id: 0, exercise: 'Warm-up: 5 minutes cardio', completed: false },
            { id: 1, exercise: 'Main exercise (customize based on goal)', completed: false },
            { id: 2, exercise: 'Cool-down: 5 minutes stretching', completed: false }
        ];
        
        renderWorkoutChecklist();
    }
}

// Render workout checklist
function renderWorkoutChecklist() {
    const checklistContainer = document.getElementById('workout-checklist');
    
    if (!checklistContainer) {
        console.error('Workout checklist container not found');
        return;
    }
    
    checklistContainer.innerHTML = '';
    
    if (!workoutChecklist || workoutChecklist.length === 0) {
        checklistContainer.innerHTML = '<p class="text-gray-600 italic text-xs">No workout plan available</p>';
        return;
    }
    
    const div = document.createElement('div');
    div.className = 'space-y-2';
    
    workoutChecklist.forEach(item => {
        const label = document.createElement('label');
        label.className = 'flex items-start gap-2 text-xs cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors';
        label.innerHTML = `
            <input type="checkbox" class="mt-0.5 workout-item rounded" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
            <span class="${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}">${item.exercise}</span>
        `;
        div.appendChild(label);
    });
    
    checklistContainer.appendChild(div);
    attachCheckboxListeners();
}

// Attach checkbox event listeners
function attachCheckboxListeners() {
    document.querySelectorAll('.workout-item').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const itemId = parseInt(e.target.dataset.id);
            const item = workoutChecklist.find(w => w.id === itemId);
            if (item) {
                item.completed = e.target.checked;
                renderWorkoutChecklist();
                
                // Update in Firestore in real-time for syncing with user view
                if (currentCallBookingId) {
                    await updateWorkoutProgress(currentCallBookingId, workoutChecklist);
                }
            }
        });
    });
}

// Update workout progress in real-time (for syncing between coach and user)
async function updateWorkoutProgress(bookingId, checklist) {
    try {
        const sessionRef = doc(db, "activeWorkoutSessions", bookingId);
        await setDoc(sessionRef, {
            bookingId: bookingId,
            userId: currentSessionUserId,
            coachId: currentCoachId,
            checklist: checklist,
            updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('✅ Workout progress updated in real-time');
    } catch (error) {
        console.error('❌ Error updating workout progress:', error);
    }
}

// Save workout session to database
// Load user's own workout data for their panel
async function loadUserWorkoutForSession(bookingId) {
    console.log('🏋️ Loading user workout for session:', bookingId);
    console.log('Current user ID:', currentUserId);
    
    try {
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (!bookingSnap.exists()) {
            console.error('❌ Booking not found:', bookingId);
            return;
        }
        
        const booking = bookingSnap.data();
        console.log('✅ Booking data:', booking);
        currentSessionUserId = currentUserId; // User viewing their own data
        
        // Display goal
        const goalElement = document.getElementById('user-session-goal');
        console.log('Goal element found:', !!goalElement);
        if (goalElement) {
            goalElement.textContent = booking.goal || 'General Fitness';
            console.log('✅ Goal set to:', goalElement.textContent);
        }
        
        // Generate workout plan for user
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);
        const userProfile = userSnap.exists() ? userSnap.data() : { goal: booking.goal };
        console.log('User profile:', userProfile);
        
        // Generate AI workout plan
        console.log('🤖 Generating AI workout plan...');
        let plan = [];
        try {
            plan = await aiService.generateWorkoutPlan(userProfile);
            console.log('✅ AI plan generated:', plan);
        } catch (aiError) {
            console.warn('⚠️ AI generation failed for user, using default plan:', aiError);
        }
        
        // Use default plan if AI fails or returns empty
        if (!plan || plan.length === 0) {
            console.log('Using default workout plan');
            const goal = userProfile.goal || booking.goal || 'general fitness';
            plan = [
                'Warm-up: 5 minutes light cardio (jogging or jumping jacks)',
                `${goal === 'weight_loss' ? 'HIIT intervals: 20 minutes' : goal === 'muscle_gain' ? 'Strength training: 3 sets compound exercises' : goal === 'flexibility' ? 'Dynamic stretching: 15 minutes' : 'Mixed cardio: 20 minutes'}`,
                'Core work: Planks 3x30 seconds',
                'Strength exercise: Push-ups 3 sets of 10-15 reps',
                'Lower body: Squats 3 sets of 15 reps',
                'Cardio burst: 5 minutes moderate intensity',
                'Cool-down: 5 minutes stretching and deep breathing'
            ];
            console.log('Default plan:', plan);
        }
        
        // Map to consistent structure with exercise property
        workoutChecklist = plan.map((exercise, index) => ({
            id: index,
            exercise: exercise,
            completed: false
        }));
        
        console.log('📋 Workout checklist created:', workoutChecklist);
        console.log('Calling renderUserWorkoutChecklist...');
        renderUserWorkoutChecklist();
        
        // Load past workout summaries with this coach
        if (booking.coachId) {
            console.log('📊 Loading past workout summaries with coach:', booking.coachId);
            await fetchUserWorkoutSummaries(currentUserId, booking.coachId);
        }
        
        // Setup real-time listener for coach updates
        setupWorkoutProgressListener(bookingId);
        
    } catch (error) {
        console.error('❌ Error loading user workout:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Setup real-time listener for workout progress updates (user view)
let workoutProgressListener = null;
function setupWorkoutProgressListener(bookingId) {
    console.log('🔄 Setting up real-time workout progress listener for booking:', bookingId);
    
    const sessionRef = doc(db, "activeWorkoutSessions", bookingId);
    workoutProgressListener = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('📡 Real-time update received:', data);
            
            if (data.checklist) {
                workoutChecklist = data.checklist;
                renderUserWorkoutChecklist();
                console.log('✅ User view updated with coach progress');
            }
        }
    }, (error) => {
        console.error('❌ Error in workout progress listener:', error);
    });
}

// Render workout checklist for users (read-only, no checkboxes)
function renderUserWorkoutChecklist() {
    console.log('📝 Rendering user workout checklist (read-only)...');
    const container = document.getElementById('user-workout-checklist');
    console.log('Container element:', container);
    
    if (!container) {
        console.error('❌ User workout checklist container not found!');
        return;
    }
    
    console.log('Workout checklist length:', workoutChecklist.length);
    console.log('Workout checklist data:', workoutChecklist);
    
    if (workoutChecklist.length === 0) {
        console.log('⚠️ Empty checklist, showing placeholder');
        container.innerHTML = '<p class="text-gray-400 italic text-xs">Waiting for coach to start session...</p>';
        updateUserProgress();
        return;
    }
    
    const html = workoutChecklist.map((item, index) => `
        <div class="flex items-start gap-2 text-sm transition-colors py-2 border-b border-gray-700/30 last:border-0">
            <div class="mt-0.5 flex-shrink-0">
                ${item.completed 
                    ? '<svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
                    : '<svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" fill="none"></circle></svg>'
                }
            </div>
            <span class="${item.completed ? 'line-through text-gray-500' : 'text-gray-300'} flex-1">
                ${item.exercise}
            </span>
        </div>
    `).join('');
    
    console.log('Generated HTML length:', html.length);
    container.innerHTML = html;
    console.log('✅ HTML injected into container');
    
    updateUserProgress();
}

// Update user progress bar
function updateUserProgress() {
    const completedCount = workoutChecklist.filter(item => item.completed).length;
    const totalCount = workoutChecklist.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    console.log('📊 Progress update:', completedCount, '/', totalCount, '=', percentage.toFixed(1) + '%');
    
    const progressText = document.getElementById('user-progress-text');
    const progressBar = document.getElementById('user-progress-bar');
    
    console.log('Progress text element:', !!progressText, 'Progress bar element:', !!progressBar);
    
    if (progressText) {
        progressText.textContent = `${completedCount} / ${totalCount}`;
        console.log('✅ Progress text updated:', progressText.textContent);
    }
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        console.log('✅ Progress bar width updated:', progressBar.style.width);
    }
    
    // Cheer the user on progress! 🎉
    showProgressCheer(completedCount, totalCount, percentage);
}

// Show encouraging messages as user makes progress
let lastCheerCount = 0;
function showProgressCheer(completedCount, totalCount, percentage) {
    // Only show cheer when count increases (not on decreases)
    if (completedCount <= lastCheerCount || completedCount === 0) {
        lastCheerCount = completedCount;
        return;
    }
    
    lastCheerCount = completedCount;
    
    const cheerMessages = [
        "💪 Great job! Keep going!",
        "🔥 You're on fire!",
        "⭐ Awesome work!",
        "🚀 Keep pushing!",
        "💯 You're crushing it!",
        "🎯 Nailed it!",
        "✨ Fantastic effort!",
        "🏆 Champion mindset!",
        "💥 Boom! One more down!",
        "🌟 You're amazing!"
    ];
    
    // Special messages for milestones
    let message = '';
    if (percentage === 100) {
        message = "🎉🎊 INCREDIBLE! You completed the entire workout! 🏆💪";
    } else if (percentage >= 75) {
        message = "🔥💪 Almost there! Final push! You've got this! 🚀";
    } else if (percentage >= 50) {
        message = "⭐ Halfway done! You're unstoppable! 💪";
    } else if (percentage >= 25) {
        message = "🌟 Great start! Keep that momentum going! 🔥";
    } else {
        message = cheerMessages[Math.floor(Math.random() * cheerMessages.length)];
    }
    
    // Create floating cheer notification
    const cheer = document.createElement('div');
    cheer.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-lg z-50 animate-bounce';
    cheer.style.animation = 'slideInDown 0.5s ease-out, fadeOut 0.5s ease-in 2.5s';
    cheer.textContent = message;
    
    // Add custom animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInDown {
            from { transform: translate(-50%, -100px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    
    if (!document.querySelector('#cheer-animations')) {
        style.id = 'cheer-animations';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(cheer);
    
    // Remove after 3 seconds
    setTimeout(() => {
        cheer.remove();
    }, 3000);
    
    // Add confetti effect on completion
    if (percentage === 100) {
        createConfetti();
    }
}

// Create confetti effect for workout completion
function createConfetti() {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.opacity = '0.8';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        
        const duration = 2000 + Math.random() * 1000;
        const rotation = Math.random() * 360;
        const drift = (Math.random() - 0.5) * 200;
        
        confetti.animate([
            { transform: 'translateY(0) rotate(0deg) translateX(0)', opacity: 0.8 },
            { transform: `translateY(100vh) rotate(${rotation}deg) translateX(${drift}px)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        setTimeout(() => confetti.remove(), duration);
    }
}

async function saveWorkoutSession(bookingId, userId, checklist, coachNotes = '') {
    try {
        const completedItems = checklist.filter(item => item.completed);
        
        if (completedItems.length === 0) {
            console.log('No items completed, skipping save');
            return null;
        }
        
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        const booking = bookingSnap.data();
        
        const sessionData = {
            userId: userId,
            bookingId: bookingId,
            coachId: currentCoachId,
            coachName: booking.coachName || 'Coach',
            userName: booking.userName || 'User',
            userEmail: booking.userEmail || '',
            goal: booking.goal,
            completedItems: completedItems.length,
            totalItems: checklist.length,
            exercises: completedItems.map(item => item.exercise),
            allExercises: checklist.map(item => ({ exercise: item.exercise, completed: item.completed })),
            coachNotes: coachNotes,
            completedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, "workoutSessions"), sessionData);
        console.log('Workout session saved successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving workout session:', error);
        return null;
    }
}

// Save session notes separately (can be called independently)
async function saveSessionNotes(bookingId, userId, checklist) {
    const notes = sessionNotesTextarea?.value.trim() || '';
    
    if (!notes && checklist.filter(item => item.completed).length === 0) {
        alert('Please add session notes or complete at least one exercise before saving.');
        return;
    }
    
    if (!saveSessionNotesBtn) return;
    
    saveSessionNotesBtn.disabled = true;
    notesStatus.textContent = 'Saving...';
    notesStatus.classList.remove('hidden', 'text-red-400', 'text-green-400');
    notesStatus.classList.add('text-yellow-400');
    
    try {
        const sessionId = await saveWorkoutSession(bookingId, userId, checklist, notes);
        
        if (sessionId) {
            notesStatus.textContent = '✅ Session summary saved successfully!';
            notesStatus.classList.remove('text-yellow-400');
            notesStatus.classList.add('text-green-400');
            
            // Clear the notes
            if (sessionNotesTextarea) sessionNotesTextarea.value = '';
            
            setTimeout(() => {
                notesStatus.classList.add('hidden');
            }, 3000);
        } else {
            throw new Error('Failed to save session');
        }
    } catch (error) {
        console.error('Error saving session notes:', error);
        notesStatus.textContent = '❌ Failed to save. Please try again.';
        notesStatus.classList.remove('text-yellow-400');
        notesStatus.classList.add('text-red-400');
    } finally {
        saveSessionNotesBtn.disabled = false;
    }
}

// Note: fetchWorkoutSummaries and renderWorkoutSummaries removed
// Summaries now shown in video session "Past Sessions" panel using createSummaryCard

// Create a summary card element (shared between coach and user views)
function createSummaryCard(summary) {
    const card = document.createElement('div');
    card.className = 'bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600/50 transition-colors';
    
    const date = summary.completedAt?.toDate?.() || new Date();
    const completionRate = Math.round((summary.completedItems / summary.totalItems) * 100);
    
    card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white text-sm">${summary.userName}</h4>
                    <p class="text-xs text-gray-600 dark:text-gray-400">${summary.userEmail || ''}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-500 dark:text-gray-400">${date.toLocaleDateString()}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${date.toLocaleTimeString()}</p>
                </div>
            </div>
            
            <div class="mb-2">
                <span class="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    ${summary.goal || 'General Fitness'}
                </span>
            </div>
            
            <div class="mb-3">
                <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-gray-600 dark:text-gray-400">Completion</span>
                    <span class="font-semibold ${completionRate >= 80 ? 'text-green-600 dark:text-green-400' : completionRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">
                        ${summary.completedItems}/${summary.totalItems} (${completionRate}%)
                    </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}" 
                         style="width: ${completionRate}%"></div>
                </div>
            </div>
            
            ${summary.coachNotes ? `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded p-3 mb-3">
                    <p class="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Coach Notes:
                    </p>
                    <p class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${summary.coachNotes}</p>
                </div>
            ` : ''}
            
            <details class="mt-2">
                <summary class="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    View Exercises (${summary.completedItems} completed)
                </summary>
                <ul class="mt-2 space-y-1 pl-4">
                    ${summary.allExercises.map(ex => `
                        <li class="text-xs ${ex.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 line-through'}">
                            ${ex.completed ? '✓' : '○'} ${ex.exercise}
                        </li>
                    `).join('')}
                </ul>
            </details>
    `;
    
    return card;
}

// Fetch and display workout summaries for a specific user with current coach
async function fetchUserWorkoutSummaries(userId, coachId) {
    if (!userId || !coachId || !userPastSummariesList) {
        return;
    }
    
    try {
        console.log('📊 Fetching workout summaries for user:', userId, 'with coach:', coachId);
        
        const q = query(
            collection(db, "workoutSessions"),
            where("userId", "==", userId),
            where("coachId", "==", coachId),
            orderBy("completedAt", "desc"),
            limit(10)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            userPastSummariesList.innerHTML = '';
            userSummariesEmpty.classList.remove('hidden');
            return;
        }
        
        userSummariesEmpty.classList.add('hidden');
        userPastSummariesList.innerHTML = '';
        
        snapshot.docs.forEach(doc => {
            const summary = { id: doc.id, ...doc.data() };
            const card = createSummaryCard(summary);
            userPastSummariesList.appendChild(card);
        });
        
        console.log('✅ Loaded', snapshot.size, 'past sessions for user');
        
    } catch (error) {
        console.error('❌ Error fetching user workout summaries:', error);
        userPastSummariesList.innerHTML = '<p class="text-red-400 text-sm">Error loading past sessions. Check console.</p>';
    }
}

function toggleAuthUI(user) {
    const isSignedIn = !!user;
    console.log('🎨 toggleAuthUI called. isSignedIn:', isSignedIn, 'userType:', userType);
    console.log('🎨 Elements check:', {
        landingHero: !!landingHero,
        gateEl: !!gateEl,
        appEl: !!appEl,
        coachAppEl: !!coachAppEl
    });
    
    if (!isSignedIn) {
        console.log('🎨 Showing auth gate and landing page');
        // Show landing page and auth gate, hide apps
        if (landingHero) {
            landingHero.classList.remove("hidden");
            console.log('🎨 Landing page shown');
        } else {
            console.error('🔴 landingHero element not found!');
        }
        gateEl.classList.remove("hidden");
        appEl.classList.add("hidden");
        coachAppEl.classList.add("hidden");
        btnSignInUser.classList.remove("hidden");
        btnSignInCoach.classList.remove("hidden");
        btnSignOut.classList.add("hidden");
        userMenu.classList.add("hidden");
        coachMenu.classList.add("hidden");
        userDisplayName.textContent = "";
        coachDisplayName.textContent = "";
    } else {
        console.log('🎨 User signed in, hiding landing/auth, showing app');
        // Hide landing page and auth gate when signed in
        if (landingHero) {
            landingHero.classList.add("hidden");
            console.log('🎨 Landing page HIDDEN');
        } else {
            console.error('🔴 landingHero element not found!');
        }
        gateEl.classList.add("hidden");
        btnSignInUser.classList.add("hidden");
        btnSignInCoach.classList.add("hidden");
        btnSignOut.classList.remove("hidden");
        
        // Show appropriate view based on user type
        if (userType === 'coach') {
            console.log('🎨 Showing COACH app');
            appEl.classList.add("hidden");
            coachAppEl.classList.remove("hidden");
            userMenu.classList.add("hidden");
            coachMenu.classList.remove("hidden");
            coachDisplayName.textContent = `${user.displayName ?? user.email}`;
            console.log('🎨 Coach app should now be visible');
        } else {
            console.log('🎨 Showing USER app');
            appEl.classList.remove("hidden");
            coachAppEl.classList.add("hidden");
            userMenu.classList.remove("hidden");
            coachMenu.classList.add("hidden");
            userDisplayName.textContent = `${user.displayName ?? user.email}`;
            console.log('🎨 User app should now be visible');
        }
        
        // Scroll to top to show the app
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function loadUserProfile(userId) {
    if (!userId) {
        console.error('🔴 loadUserProfile called with undefined userId');
        return;
    }
    
    console.log('👤 Loading user profile for:', userId);
    
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const data = snap.data();
            if (heightEl) heightEl.value = data.heightCm ?? "";
            if (weightEl) weightEl.value = data.weightKg ?? "";
            if (goalEl) goalEl.value = data.goal ?? "";
            if (requirementsEl) requirementsEl.value = data.requirements ?? "";
            
            // Check if profile is complete
            isProfileComplete = !!(data.heightCm && data.weightKg && data.goal);
            console.log('👤 Profile loaded. Complete:', isProfileComplete);
        } else {
            // New user - no profile data yet, clear form fields
            if (heightEl) heightEl.value = "";
            if (weightEl) weightEl.value = "";
            if (goalEl) goalEl.value = "";
            if (requirementsEl) requirementsEl.value = "";
            isProfileComplete = false;
            console.log('👤 New user - no profile yet');
        }
        
        // Update UI based on profile completion status
        if (isProfileComplete) {
            // Hide profile section and show main content
            if (profileSection) profileSection.classList.add("hidden");
            if (mainContent) mainContent.classList.remove("hidden");
        } else {
            // Show profile section for first-time or incomplete users
            if (profileSection) profileSection.classList.remove("hidden");
            if (mainContent) mainContent.classList.add("hidden");
        }
    } catch (error) {
        console.error('🔴 Error loading user profile:', error);
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
    
    const hasProfile = !snap.empty;
    
    if (hasProfile) {
        // Existing coach - load data and show dashboard
        const coachDoc = snap.docs[0];
        const coachData = coachDoc.data();
        currentCoachId = coachDoc.id;
        
        // Populate form fields for editing
        coachNameEl.value = coachData.name || "";
        coachBioEl.value = coachData.bio || "";
        coachExperienceEl.value = coachData.yearsExperience || "";
        coachRateEl.value = coachData.hourlyRate || "";
        
        // Check specializations
        document.querySelectorAll('input[name="specialization"]').forEach(checkbox => {
            checkbox.checked = coachData.specializations?.includes(checkbox.value) || false;
        });
        
        // Set coach display name in dropdown
        if (coachDisplayName) {
            coachDisplayName.textContent = coachData.name || userEmail;
        }
        
        // Show dashboard, hide setup
        coachProfileSetup.classList.add("hidden");
        coachDashboard.classList.remove("hidden");
        
        // Listen for real-time notifications
        listenForNotifications(userEmail);
        
        return coachDoc.id;
    } else {
        // First time coach - show profile setup
        coachNameEl.value = "";
        coachBioEl.value = "";
        coachExperienceEl.value = "";
        coachRateEl.value = "";
        document.querySelectorAll('input[name="specialization"]').forEach(cb => cb.checked = false);
        
        coachProfileSetup.classList.remove("hidden");
        coachDashboard.classList.add("hidden");
        return null;
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
            console.log('Notification change type:', change.type, 'data:', change.doc.data());
            if (change.type === "added") {
                const notification = change.doc.data();
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
        approved: false, // Requires admin approval
        isOnline: false, // Initial presence status
        lastSeen: serverTimestamp(), // Initial last seen timestamp
        updatedAt: serverTimestamp()
    };
    
    // Check if coach profile already exists
    const q = query(
        collection(db, "coaches"),
        where("email", "==", user.email),
        limit(1)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        // Update existing profile
        const coachDoc = snap.docs[0];
        currentCoachId = coachDoc.id;
        await updateDoc(doc(db, "coaches", coachDoc.id), coachData);
    } else {
        // Create new profile
        coachData.createdAt = serverTimestamp();
        const newDocRef = await addDoc(collection(db, "coaches"), coachData);
        currentCoachId = newDocRef.id;
    }
    
    // Start presence tracking for the newly created or updated coach profile
    startPresenceTracking();
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

/**
 * Check if a coach is currently available or has active bookings
 * @param {string} coachId - The ID of the coach to check
 * @returns {Promise<{available: boolean, bookingInfo: string|null, nextAvailableTime: Date|null}>}
 */
async function checkCoachAvailability(coachId) {
    try {
        // Query for active bookings (pending, confirmed, reviewing, active)
        const activeBookingsQuery = query(
            collection(db, "bookings"),
            where("coachId", "==", coachId),
            where("status", "in", ["pending", "confirmed", "reviewing", "active"])
        );
        
        const bookingsSnap = await getDocs(activeBookingsQuery);
        
        console.log(`🔍 Checking availability for coach ${coachId}: ${bookingsSnap.docs.length} active bookings found`);
        
        if (bookingsSnap.empty) {
            return { available: true, bookingInfo: null, nextAvailableTime: null };
        }
        
        const now = new Date();
        const currentTime = now.getTime();
        
        // Check if any booking is currently active or soon
        for (const bookingDoc of bookingsSnap.docs) {
            const booking = bookingDoc.data();
            
            // Handle serverTimestamp or null scheduledAt (immediate bookings)
            let scheduledAt;
            if (!booking.scheduledAt) {
                // If no scheduledAt, use createdAt as it's an immediate booking
                scheduledAt = booking.createdAt?.toDate ? booking.createdAt.toDate() : now;
            } else if (booking.scheduledAt.toDate) {
                scheduledAt = booking.scheduledAt.toDate();
            } else {
                scheduledAt = new Date(booking.scheduledAt);
            }
            
            const bookingStart = scheduledAt.getTime();
            let bookingEnd = bookingStart + (60 * 60 * 1000); // 1-hour sessions
            
            // If session has been ended manually, use the actual end time
            if (booking.endedAt) {
                const endedAt = booking.endedAt.toDate ? booking.endedAt.toDate() : new Date(booking.endedAt);
                bookingEnd = endedAt.getTime();
                console.log(`  ✅ Session was ended manually at ${endedAt.toLocaleString()}`);
                
                // If ended in the past, skip this booking (coach is available)
                if (currentTime > bookingEnd) {
                    console.log(`  ✅ Session ended - coach is now available`);
                    continue;
                }
            }
            
            const bufferMs = 30 * 60 * 1000; // 30-minute buffer
            
            console.log(`  📅 Booking ${bookingDoc.id}: scheduled at ${scheduledAt.toLocaleString()}, status: ${booking.status}`);
            console.log(`  ⏰ Current: ${now.toLocaleString()}, Start: ${new Date(bookingStart - bufferMs).toLocaleString()}, End: ${new Date(bookingEnd + bufferMs).toLocaleString()}`);
            
            // Check if booking is currently active or within the buffer period
            if (currentTime >= (bookingStart - bufferMs) && currentTime <= (bookingEnd + bufferMs)) {
                console.log(`  ❌ Coach is BUSY - booking overlaps with current time`);
                return {
                    available: false,
                    bookingInfo: `In session until ${new Date(bookingEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
                    nextAvailableTime: new Date(bookingEnd + bufferMs)
                };
            }
        }
        
        // Find the next upcoming booking
        const futureBookings = bookingsSnap.docs
            .map(doc => {
                const booking = doc.data();
                let scheduledAt;
                if (!booking.scheduledAt) {
                    scheduledAt = booking.createdAt?.toDate ? booking.createdAt.toDate() : now;
                } else if (booking.scheduledAt.toDate) {
                    scheduledAt = booking.scheduledAt.toDate();
                } else {
                    scheduledAt = new Date(booking.scheduledAt);
                }
                return {
                    id: doc.id,
                    ...booking,
                    scheduledAt
                };
            })
            .filter(b => b.scheduledAt.getTime() > currentTime)
            .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
        
        if (futureBookings.length > 0) {
            const nextBooking = futureBookings[0];
            console.log(`  ✅ Coach is available now, next booking at ${nextBooking.scheduledAt.toLocaleString()}`);
            return {
                available: true,
                bookingInfo: `Next booking at ${nextBooking.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
                nextAvailableTime: null
            };
        }
        
        console.log(`  ✅ Coach is available with no upcoming bookings`);
        return { available: true, bookingInfo: null, nextAvailableTime: null };
        
    } catch (error) {
        console.warn('❌ Error checking coach availability:', error);
        // If there's an error, assume available to not block bookings
        return { available: true, bookingInfo: null, nextAvailableTime: null };
    }
}

async function getCoachRating(coachId) {
    try {
        const feedbackQuery = query(
            collection(db, 'feedback'),
            where('coachId', '==', coachId),
            where('ratingFor', '==', 'coach')
        );
        
        const snapshot = await getDocs(feedbackQuery);
        
        if (snapshot.empty) {
            return { avgRating: 0, totalRatings: 0 };
        }
        
        let totalRating = 0;
        snapshot.forEach(doc => {
            totalRating += doc.data().rating;
        });
        
        const avgRating = totalRating / snapshot.size;
        return { 
            avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            totalRatings: snapshot.size 
        };
    } catch (error) {
        console.error('Error fetching coach rating:', error);
        return { avgRating: 0, totalRatings: 0 };
    }
}

async function renderCoaches(items, userGoal, aiRecommendations = null) {
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
    
    // Check availability for all coaches in parallel
    const availabilityPromises = items.map(c => checkCoachAvailability(c.id));
    const ratingPromises = items.map(c => getCoachRating(c.id));
    const availabilityResults = await Promise.all(availabilityPromises);
    const ratingResults = await Promise.all(ratingPromises);
    const availabilityMap = new Map();
    const ratingMap = new Map();
    items.forEach((c, index) => {
        availabilityMap.set(c.id, availabilityResults[index]);
        ratingMap.set(c.id, ratingResults[index]);
    });
    
    for (const c of items) {
        const card = document.createElement("div");
        const aiRec = aiScores.get(c.id);
        const hasAI = !!aiRec;
        const availability = availabilityMap.get(c.id);
        const isAvailable = availability.available;
        const rating = ratingMap.get(c.id);
        
        card.className = `rounded-lg border p-4 flex flex-col gap-2 ${hasAI ? 'border-indigo-300 dark:border-indigo-700' : ''}`;
        card.setAttribute('data-coach-id', c.id); // Add data attribute for presence updates
        const btnId = `book-${c.id}`;
        
        // Check if coach is online
        const onlineStatus = isCoachOnline(c);
        let presenceClass, presenceTitle;
        
        if (onlineStatus === null) {
            // No presence data available
            presenceClass = 'bg-yellow-400';
            presenceTitle = 'Status: N/A';
        } else if (onlineStatus === true) {
            // Online
            presenceClass = 'bg-green-500';
            presenceTitle = 'Online now';
        } else {
            // Offline
            presenceClass = 'bg-gray-400';
            presenceTitle = getLastSeenText(c.lastSeen);
        }
        
        // Rating display
        let ratingSection = '';
        if (rating.totalRatings > 0) {
            const fullStars = Math.floor(rating.avgRating);
            const hasHalfStar = rating.avgRating % 1 >= 0.5;
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < fullStars) {
                    starsHtml += '<span class="text-yellow-400">★</span>';
                } else if (i === fullStars && hasHalfStar) {
                    starsHtml += '<span class="text-yellow-400">⯨</span>';
                } else {
                    starsHtml += '<span class="text-gray-300">★</span>';
                }
            }
            ratingSection = `<div class="flex items-center gap-1 text-sm">${starsHtml}<span class="text-gray-600 ml-1">${rating.avgRating} (${rating.totalRatings})</span></div>`;
        } else {
            ratingSection = `<div class="flex items-center gap-1 text-sm text-gray-500 italic">No ratings yet - Be the first to rate!</div>`;
        }
        
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
        
        // Availability badge or button - only show button when coach is online
        let bookingSection;
        if (onlineStatus === true && isAvailable) {
            // Coach is online and available - show Book button
            bookingSection = `<button id="${btnId}" class="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white text-sm font-semibold hover:from-purple-500 hover:to-pink-500">Book</button>`;
        } else if (onlineStatus === true && !isAvailable) {
            // Coach is online but busy - show next available time
            const nextAvailableText = availability.nextAvailableTime 
                ? `Available: ${new Date(availability.nextAvailableTime).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit'
                  })}`
                : 'Currently Booked';
            bookingSection = `<span class="rounded-lg bg-gray-400 px-4 py-2 text-white text-sm font-semibold cursor-not-allowed" title="${availability.bookingInfo || 'Coach has an active booking'}">${nextAvailableText}</span>`;
        } else {
            // Coach is offline - don't show any button
            bookingSection = '';
        }
        
        card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold">${c.name}</h3>
            <div class="presence-indicator w-2 h-2 rounded-full ${presenceClass}" title="${presenceTitle}"></div>
          </div>
          ${ratingSection}
          <p class="text-sm text-gray-600">${c.yearsExperience ?? 0} yrs experience</p>
        </div>
        <span class="rounded bg-blue-100 border border-blue-300 px-2 py-1 text-xs text-blue-700">${(c.specializations ?? []).join(", ")}</span>
      </div>
      <p class="text-sm text-gray-700">${c.bio ?? ""}</p>
      ${aiSection}
      <div class="flex items-center justify-between mt-2">
        <span class="text-sm text-gray-600">Rate: ${c.hourlyRate ? `₹${c.hourlyRate}/hr` : "On request"}</span>
        ${bookingSection}
      </div>
    `;
        coachList.appendChild(card);
        
        // Only add click handler if coach is online and available
        if (onlineStatus === true && isAvailable) {
            const btn = card.querySelector(`#${btnId}`);
            btn.addEventListener("click", async () => {
                // Use the user's saved goal from profile, or the filtered goal
                const bookingGoal = goalEl.value || userGoal || c.specializations?.[0] || 'general_fitness';
                openBookingModal({ id: c.id, name: c.name }, bookingGoal);
            });
        }
    }
}

async function fetchCoachesForGoal(goal) {
    // For users: if no goal selected, show ALL approved coaches
    // If goal selected, filter by goal and approved status
    let q;
    if (!goal) {
        q = query(
            collection(db, "coaches"),
            where("approved", "==", true), // Only show approved coaches
            orderBy("rating", "desc"),
            limit(50)
        );
    } else {
        q = query(
            collection(db, "coaches"),
            where("approved", "==", true), // Only show approved coaches
            where("specializations", "array-contains", goal),
            orderBy("rating", "desc"),
            limit(12)
        );
    }
    
    const snap = await getDocs(q);
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Remove duplicate coaches by email (keep the most recent one)
    const uniqueCoaches = new Map();
    items.forEach(coach => {
        const email = coach.email;
        if (!uniqueCoaches.has(email) || 
            (coach.updatedAt && (!uniqueCoaches.get(email).updatedAt || 
             coach.updatedAt.toMillis() > uniqueCoaches.get(email).updatedAt.toMillis()))) {
            uniqueCoaches.set(email, coach);
        }
    });
    items = Array.from(uniqueCoaches.values());
    
    // Sort by online status first, then by rating
    items.sort((a, b) => {
        const aOnline = isCoachOnline(a) ? 1 : 0;
        const bOnline = isCoachOnline(b) ? 1 : 0;
        
        if (aOnline !== bOnline) {
            return bOnline - aOnline; // Online coaches first
        }
        
        return (b.rating || 0) - (a.rating || 0); // Then by rating
    });
    
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
                
                // Sort coaches by AI match score if available, but keep online status priority
                if (aiRecommendations && aiRecommendations.length > 0) {
                    const scoreMap = new Map(aiRecommendations.map(r => [r.coachId, r.matchScore]));
                    items.sort((a, b) => {
                        const aOnline = isCoachOnline(a) ? 1 : 0;
                        const bOnline = isCoachOnline(b) ? 1 : 0;
                        
                        if (aOnline !== bOnline) {
                            return bOnline - aOnline; // Online coaches first
                        }
                        
                        return (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0); // Then by AI score
                    });
                }
            }
        } catch (error) {
            console.warn('AI coach matching unavailable (continuing without AI scores):', error.message);
            // Continue without AI recommendations - coaches will still display
        }
    }
    
    await renderCoaches(items, goal, aiRecommendations);
}

function renderBookings(items) {
    bookingList.innerHTML = "";
    if (!items.length) {
        bookingEmpty.classList.remove("hidden");
        return;
    }
    bookingEmpty.classList.add("hidden");
    
    // Separate pending, active and past bookings
    const activeBookings = items.filter(b => b.status === 'pending' || b.status === 'confirmed' || b.status === 'reviewing' || b.status === 'active');
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
            <button id="toggle-past-bookings" class="w-full flex items-center justify-between text-left p-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors mb-3">
                <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <span class="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                    Past Bookings (${pastBookings.length})
                </h3>
                <svg id="past-bookings-chevron" class="w-5 h-5 text-gray-600 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    
    // Start countdown timers for all visible bookings
    startCountdownTimers();
}

// Countdown timer system
let countdownIntervals = [];

function startCountdownTimers() {
    // Clear any existing intervals
    countdownIntervals.forEach(interval => clearInterval(interval));
    countdownIntervals = [];
    
    // Find all countdown timer elements
    const timers = document.querySelectorAll('.countdown-timer');
    
    timers.forEach(timer => {
        const scheduledTime = parseInt(timer.dataset.scheduled);
        const bookingId = timer.dataset.bookingId;
        const meetingLink = timer.dataset.meetingLink;
        const textElement = timer.querySelector('.countdown-text');
        
        if (!textElement) return;
        
        // Update function
        const updateCountdown = () => {
            const now = Date.now();
            const timeLeft = scheduledTime - now;
            
            if (timeLeft <= 0 || timeLeft <= (5 * 60 * 1000)) {
                // Time to join! Convert to Join button
                timer.outerHTML = `<button id="join-${bookingId}" data-meeting-link="${meetingLink}" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500 inline-flex items-center gap-2 animate-pulse">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    Join Session Now!
                </button>`;
                
                // Add event listener to the new button
                const joinBtn = document.getElementById(`join-${bookingId}`);
                if (joinBtn) {
                    joinBtn.addEventListener('click', async () => {
                        joinBtn.disabled = true;
                        joinBtn.innerHTML = 'Joining...';
                        try {
                            await updateDoc(doc(db, "bookings", bookingId), { 
                                status: "active",
                                joinedAt: serverTimestamp()
                            });
                            const roomName = meetingLink.split('/').pop().split('#')[0];
                            startEmbeddedVideoCall(bookingId, roomName, 'Session', false);
                        } catch (e) {
                            console.error('Failed to join:', e);
                            alert('Failed to join session: ' + e.message);
                            joinBtn.disabled = false;
                            joinBtn.innerHTML = 'Join Session Now!';
                        }
                    });
                }
                
                // Stop this countdown
                return true;
            }
            
            // Calculate time components
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            // Format countdown text
            if (hours > 0) {
                textElement.textContent = `Starts in ${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                textElement.textContent = `Starts in ${minutes}m ${seconds}s`;
            } else {
                textElement.textContent = `Starts in ${seconds}s`;
                timer.classList.add('animate-pulse');
            }
            
            return false;
        };
        
        // Update immediately
        if (!updateCountdown()) {
            // Set up interval to update every second
            const interval = setInterval(() => {
                if (updateCountdown()) {
                    clearInterval(interval);
                }
            }, 1000);
            
            countdownIntervals.push(interval);
        }
    });
}

function createBookingCard(b, isActive) {
    const row = document.createElement("div");
    const statusColors = {
        pending: 'border-yellow-500/30 bg-yellow-500/5',
        confirmed: 'border-emerald-500/30 bg-emerald-500/5',
        active: 'border-emerald-500/30 bg-emerald-500/5',
        scheduled: 'border-blue-500/30 bg-blue-500/5',
        completed: 'border-gray-300 bg-gray-50',
        cancelled: 'border-red-500/30 bg-red-500/5'
    };
    row.className = `rounded-lg border p-4 flex items-center justify-between gap-4 ${statusColors[b.status] || 'border-gray-700'}`;
    
    const cancelBtnId = `cancel-${b.id}`;
    const endBtnId = `end-${b.id}`;
    const deleteBtnId = `delete-${b.id}`;
    const joinBtnId = `join-${b.id}`;
    const statusBadges = {
        pending: '<span class="inline-block px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">⏳ Pending Confirmation</span>',
        confirmed: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">✓ Confirmed</span>',
        reviewing: '<span class="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600 border border-blue-500/30">👁️ Coach Reviewing</span>',
        active: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">🟢 Active</span>',
        scheduled: '<span class="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600 border border-blue-500/30">📅 Scheduled</span>',
        completed: '<span class="inline-block px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">✓ Completed</span>',
        cancelled: '<span class="inline-block px-2 py-1 rounded text-xs bg-red-500/20 text-red-600 border border-red-500/30">✕ Cancelled</span>'
    };
    
    // Check if scheduled time has arrived (allow joining 5 minutes early)
    const now = Date.now();
    const scheduledTime = b.scheduledAt?.toMillis?.() ?? now;
    const canJoinYet = (scheduledTime - now) <= (5 * 60 * 1000); // 5 minutes early grace period
    const timeUntilSession = scheduledTime - now;
    const showCountdown = (b.status === 'confirmed' || b.status === 'pending') && timeUntilSession > 0 && timeUntilSession < (24 * 60 * 60 * 1000); // Show countdown if within 24 hours
    
    // Show Join button if confirmed OR active OR reviewing (so both user and coach can join), has link, and time has arrived
    const showJoinButton = (b.status === 'confirmed' || b.status === 'active' || b.status === 'reviewing') && b.meetingLink && canJoinYet;
    const showCancelButton = isActive && b.status === "pending";
    // Show End button only if time has arrived (canJoinYet) and status is confirmed/reviewing/active
    const showEndButton = isActive && (b.status === "confirmed" || b.status === "reviewing" || b.status === "active") && canJoinYet;
    const showDeleteButton = !isActive && (b.status === "completed" || b.status === "cancelled");
    
    // Handle coach display for broadcast bookings
    const coachDisplay = b.coachName 
        ? b.coachName 
        : (b.isBroadcast && !b.coachId) 
            ? '<span class="text-purple-600">⏳ Waiting for coach to accept...</span>' 
            : (b.coachId || 'Unknown Coach');
    
    // Feedback/rating display for completed sessions
    let feedbackSection = '';
    if (b.status === 'completed') {
        const feedbackGiven = userType === 'coach' ? b.coachFeedbackGiven : b.userFeedbackGiven;
        if (feedbackGiven) {
            feedbackSection = '<span class="text-xs text-gray-500 italic">✓ Feedback submitted</span>';
        } else {
            feedbackSection = '<span class="text-xs text-amber-600 italic">⚠ Feedback pending</span>';
        }
    }
    
    row.innerHTML = `
      <div class="flex-1">
        <p class="font-medium text-gray-900">${coachDisplay}</p>
        <p class="text-sm text-gray-600 mt-1">Goal: ${b.goal}</p>
        ${b.status === 'active' ? '<p class="text-xs text-emerald-600 mt-1">⚡ Session in progress</p>' : `<p class="text-xs text-gray-600 mt-1">${new Date(b.scheduledAt?.toMillis?.() ?? Date.now()).toLocaleString()}</p>`}
        ${feedbackSection}
      </div>
      <div class="flex items-center gap-3">
        ${statusBadges[b.status] || ''}
        ${showCountdown ? `<div id="countdown-${b.id}" class="countdown-timer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-semibold text-sm" data-scheduled="${scheduledTime}" data-booking-id="${b.id}" data-meeting-link="${b.meetingLink || ''}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="countdown-text">Calculating...</span>
        </div>` : ''}
        ${showJoinButton ? `<button id="${joinBtnId}" data-meeting-link="${b.meetingLink}" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500 inline-flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session</button>` : ''}
        ${showEndButton ? `<button id="${endBtnId}" class="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 text-blue-400 text-xs font-medium hover:bg-blue-500/20">End Session</button>` : ""}
        ${showCancelButton ? `<button id="${cancelBtnId}" class="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-red-400 text-xs font-medium hover:bg-red-500/20">Cancel</button>` : ""}
        ${showDeleteButton ? `<button id="${deleteBtnId}" class="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-gray-600 text-xs font-medium hover:bg-gray-100">Delete</button>` : ""}
      </div>
    `;
    
    if (showJoinButton) {
        const btn = row.querySelector(`#${joinBtnId}`);
        btn?.addEventListener("click", async () => {
            btn.disabled = true;
            btn.innerHTML = 'Joining...';
            try {
                // Only mark session as active if it's not already active
                if (b.status !== 'active') {
                    await updateDoc(doc(db, "bookings", b.id), { 
                        status: "active",
                        joinedAt: serverTimestamp()
                    });
                }
                // Start embedded video call (user joins as participant)
                const roomName = b.meetingId || b.meetingLink.split('/').pop().split('#')[0];
                const title = `Session with ${b.coachName || 'Coach'}`;
                startEmbeddedVideoCall(b.id, roomName, title, false);
            } catch (e) {
                console.error('Failed to join session:', e);
                alert('Failed to join session: ' + e.message);
                btn.disabled = false;
                btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session';
            }
        });
    }
    
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
    
    // Clean up previous listener
    if (userBookingsListener) {
        userBookingsListener();
    }
    
    // Set up real-time listener for user bookings
    const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    
    userBookingsListener = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderBookings(items);
        
        // Check for newly confirmed bookings (sound notification for user)
        snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
                const booking = { id: change.doc.id, ...change.doc.data() };
                if (booking.status === 'confirmed' && booking.userId === user.uid) {
                    showNotificationWithSound(
                        '🎉 Booking Confirmed!',
                        `Your session with ${booking.coachName || 'your coach'} has been confirmed!`,
                        'bookingConfirmed'
                    );
                }
            }
        });
    }, (error) => {
        console.error('User bookings listener error:', error);
    });
}

/**
 * Set up real-time listener for all bookings to update coach availability
 * This refreshes the coach list whenever a booking status changes
 */
function setupCoachAvailabilityListener() {
    // Clean up previous listener
    if (allBookingsListener) {
        allBookingsListener();
    }
    
    // Listen to all bookings (including completed ones to detect when sessions end)
    const q = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc"),
        limit(100)
    );
    
    allBookingsListener = onSnapshot(q, async (snapshot) => {
        // Check if any booking changed status to/from active states or completed
        let shouldRefresh = false;
        
        snapshot.docChanges().forEach((change) => {
            const booking = change.doc.data();
            const relevantStatuses = ["pending", "confirmed", "reviewing", "active", "completed"];
            
            if (change.type === "modified" && relevantStatuses.includes(booking.status)) {
                shouldRefresh = true;
            }
        });
        
        if (shouldRefresh) {
            console.log('📡 Booking status changed, refreshing coach availability...');
            
            // Only refresh if we're currently showing coaches
            if (coachSection && !coachSection.classList.contains('hidden')) {
                await fetchCoachesForGoal(goalEl?.value || null);
            }
        }
    }, (error) => {
        console.warn('All bookings listener error:', error);
    });
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Show analytics loading state
 */
function showAnalyticsLoading() {
    if (analyticsLoading) analyticsLoading.classList.remove('hidden');
    if (analyticsContent) analyticsContent.classList.add('hidden');
    if (analyticsEmpty) analyticsEmpty.classList.add('hidden');
}

/**
 * Show analytics empty state
 */
function showAnalyticsEmpty() {
    if (analyticsLoading) analyticsLoading.classList.add('hidden');
    if (analyticsContent) analyticsContent.classList.add('hidden');
    if (analyticsEmpty) analyticsEmpty.classList.remove('hidden');
}

/**
 * Load and display user analytics data
 */
async function loadAnalytics() {
    const user = auth.currentUser;
    if (!user) {
        showAnalyticsEmpty();
        return;
    }

    showAnalyticsLoading();

    try {
        // Fetch all booking data for this user
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const allBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch workout sessions (completed sessions with coach)
        const sessionsQuery = query(
            collection(db, "workoutSessions"),
            where("userId", "==", user.uid),
            orderBy("completedAt", "desc")
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const allSessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch AI generated workouts
        const aiWorkoutsQuery = query(
            collection(db, "ai_workouts"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );
        const aiWorkoutsSnap = await getDocs(aiWorkoutsQuery);
        const allAiWorkouts = aiWorkoutsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Get user profile for goal progress
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userProfile = userSnap.exists() ? userSnap.data() : null;

        // Calculate and render analytics
        const analyticsData = calculateAnalytics(allBookings, allSessions, allAiWorkouts, userProfile);
        renderAnalytics(analyticsData);

    } catch (error) {
        console.error('Failed to load analytics:', error);
        showAnalyticsEmpty();
    }
}

/**
 * Calculate analytics metrics from raw data
 */
function calculateAnalytics(bookings, sessions, aiWorkouts, userProfile) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter completed/active sessions
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    // Sessions this month
    const sessionsThisMonth = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Sessions last month (for comparison)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const sessionsLastMonth = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    // Monthly change calculation
    const monthlyChange = sessionsLastMonth.length > 0
        ? Math.round(((sessionsThisMonth.length - sessionsLastMonth.length) / sessionsLastMonth.length) * 100)
        : (sessionsThisMonth.length > 0 ? 100 : 0);

    // Total sessions
    const totalSessions = completedBookings.length;

    // Completion rate
    const totalBookings = bookings.length;
    const completionRate = totalBookings > 0 
        ? Math.round((completedBookings.length / totalBookings) * 100) 
        : 0;

    // Weekly average (over last 4 weeks)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const recentSessions = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date >= fourWeeksAgo;
    });
    const weeklyAverage = (recentSessions.length / 4).toFixed(1);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        const targetMonth = new Date(currentYear, currentMonth - i, 1);
        const monthSessions = completedBookings.filter(b => {
            const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return date.getMonth() === targetMonth.getMonth() && 
                   date.getFullYear() === targetMonth.getFullYear();
        });
        const monthAiWorkouts = aiWorkouts.filter(w => {
            const date = w.createdAt?.toDate?.() || new Date(0);
            return date.getMonth() === targetMonth.getMonth() && 
                   date.getFullYear() === targetMonth.getFullYear();
        });
        monthlyTrend.push({
            month: targetMonth.toLocaleDateString('en-US', { month: 'short' }),
            sessions: monthSessions.length,
            aiWorkouts: monthAiWorkouts.length,
            total: monthSessions.length + monthAiWorkouts.length
        });
    }

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
        
        // Count bookings for the day
        const dayBookings = completedBookings.filter(b => {
            const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return date >= dayStart && date <= dayEnd;
        });
        // Count AI workouts for the day
        const dayAiWorkouts = aiWorkouts.filter(w => {
            const date = w.createdAt?.toDate?.() || new Date(0);
            return date >= dayStart && date <= dayEnd;
        });
        
        weeklyActivity.push({
            day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
            date: targetDate.getDate(),
            sessions: dayBookings.length,
            aiWorkouts: dayAiWorkouts.length,
            total: dayBookings.length + dayAiWorkouts.length
        });
    }

    // Top coaches (by booking count)
    const coachCounts = {};
    completedBookings.forEach(b => {
        const coachId = b.coachId;
        const coachName = b.coachName || 'Unknown Coach';
        if (!coachCounts[coachId]) {
            coachCounts[coachId] = { name: coachName, count: 0, coachId };
        }
        coachCounts[coachId].count++;
    });
    const topCoaches = Object.values(coachCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Goal progress (based on sessions and user goal)
    const goalProgress = calculateGoalProgress(userProfile, completedBookings, sessions, aiWorkouts);

    // Activity summary (recent events)
    const recentActivity = generateActivitySummary(bookings, aiWorkouts, sessions);

    // Streak calculation
    const currentStreak = calculateStreak(completedBookings, aiWorkouts);

    // Unique coaches count
    const uniqueCoachIds = new Set(completedBookings.map(b => b.coachId).filter(id => id));
    const uniqueCoachesCount = uniqueCoachIds.size;

    // Cancellation rate
    const cancellationRate = bookings.length > 0 
        ? Math.round((cancelledBookings.length / bookings.length) * 100) 
        : 0;

    // Average session duration (from workout sessions)
    let avgDuration = 0;
    if (sessions.length > 0) {
        const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 45), 0);
        avgDuration = Math.round(totalDuration / sessions.length);
    }

    // Favorite workout time (most common hour)
    const hourCounts = {};
    completedBookings.forEach(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.();
        if (date) {
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
    });
    let favoriteTime = '-';
    const maxHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (maxHourEntry) {
        const hour = parseInt(maxHourEntry[0]);
        favoriteTime = hour < 12 ? `${hour || 12} AM` : `${hour === 12 ? 12 : hour - 12} PM`;
    }

    // Workout type distribution (from AI workouts)
    const workoutTypes = {};
    aiWorkouts.forEach(w => {
        const type = w.workoutType || w.goal || 'general';
        workoutTypes[type] = (workoutTypes[type] || 0) + 1;
    });
    const workoutTypeDistribution = Object.entries(workoutTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

    return {
        sessionsThisMonth: sessionsThisMonth.length,
        monthlyChange,
        totalSessions,
        completionRate,
        completedBookings: completedBookings.length,
        cancelledBookings: cancelledBookings.length,
        weeklyAverage,
        monthlyTrend,
        weeklyActivity,
        topCoaches,
        goalProgress,
        recentActivity,
        currentStreak,
        totalAiWorkouts: aiWorkouts.length,
        totalBookings: bookings.length,
        uniqueCoachesCount,
        cancellationRate,
        avgDuration,
        favoriteTime,
        workoutTypeDistribution
    };
}

/**
 * Calculate goal progress based on user's stated goal
 */
function calculateGoalProgress(userProfile, bookings, sessions, aiWorkouts) {
    if (!userProfile || !userProfile.goal) {
        return { goal: 'Not set', progress: 0, message: 'Set your fitness goal in your profile', color: 'gray' };
    }

    const goal = userProfile.goal;
    const totalActivities = bookings.length + aiWorkouts.length;
    
    // Define milestones based on goal
    const milestones = {
        weight_loss: { target: 20, name: 'Weight Loss', color: 'pink', icon: '🔥' },
        muscle_gain: { target: 24, name: 'Muscle Gain', color: 'blue', icon: '💪' },
        endurance: { target: 30, name: 'Endurance', color: 'green', icon: '🏃' },
        general_fitness: { target: 16, name: 'General Fitness', color: 'purple', icon: '⭐' }
    };

    const milestone = milestones[goal] || milestones.general_fitness;
    const progress = Math.min(Math.round((totalActivities / milestone.target) * 100), 100);

    let message;
    if (progress < 25) {
        message = 'Just getting started! Keep it up!';
    } else if (progress < 50) {
        message = 'Making progress! Stay consistent!';
    } else if (progress < 75) {
        message = 'Doing great! You\'re past halfway!';
    } else if (progress < 100) {
        message = 'Almost there! Push through!';
    } else {
        message = '🎉 Goal achieved! Time for a new challenge!';
    }

    return {
        goal: milestone.name,
        goalKey: goal,
        progress,
        target: milestone.target,
        current: totalActivities,
        message,
        color: milestone.color,
        icon: milestone.icon
    };
}

/**
 * Generate activity summary from recent events
 */
function generateActivitySummary(bookings, aiWorkouts, sessions) {
    const activities = [];
    
    // Add recent bookings
    bookings.slice(0, 5).forEach(b => {
        const date = b.createdAt?.toDate?.() || new Date();
        activities.push({
            type: 'booking',
            date,
            title: `Session with ${b.coachName || 'Coach'}`,
            status: b.status,
            icon: b.status === 'completed' ? '✅' : b.status === 'cancelled' ? '❌' : '📅'
        });
    });

    // Add recent AI workouts
    aiWorkouts.slice(0, 5).forEach(w => {
        const date = w.createdAt?.toDate?.() || new Date();
        activities.push({
            type: 'ai_workout',
            date,
            title: w.workout?.title || 'AI Workout Generated',
            status: 'generated',
            icon: '🤖'
        });
    });

    // Sort by date and take top 5
    return activities
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);
}

/**
 * Calculate current activity streak
 */
function calculateStreak(bookings, aiWorkouts) {
    // Combine all activity dates
    const activityDates = new Set();
    
    bookings.forEach(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.();
        if (date) {
            activityDates.add(date.toDateString());
        }
    });
    
    aiWorkouts.forEach(w => {
        const date = w.createdAt?.toDate?.();
        if (date) {
            activityDates.add(date.toDateString());
        }
    });

    // Calculate streak
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        if (activityDates.has(checkDate.toDateString())) {
            streak++;
        } else if (i > 0) { // Allow today to be missed
            break;
        }
    }
    
    return streak;
}

/**
 * Render analytics data to the UI
 */
function renderAnalytics(data) {
    if (analyticsLoading) analyticsLoading.classList.add('hidden');
    
    // Check if there's any data to show
    if (data.totalBookings === 0 && data.totalAiWorkouts === 0) {
        showAnalyticsEmpty();
        return;
    }

    if (analyticsContent) analyticsContent.classList.remove('hidden');
    if (analyticsEmpty) analyticsEmpty.classList.add('hidden');

    // Update key metrics (first row)
    const sessionsThisMonthEl = document.getElementById('sessions-this-month');
    const sessionsMonthChangeEl = document.getElementById('sessions-month-change');
    const totalSessionsEl = document.getElementById('total-sessions');
    const completionRateEl = document.getElementById('completion-rate');
    const completionRateDetailEl = document.getElementById('completion-rate-detail');
    const weeklyAverageEl = document.getElementById('weekly-average');

    if (sessionsThisMonthEl) sessionsThisMonthEl.textContent = data.sessionsThisMonth;
    if (sessionsMonthChangeEl) {
        const changeText = data.monthlyChange >= 0 ? `↑ ${data.monthlyChange}%` : `↓ ${Math.abs(data.monthlyChange)}%`;
        const changeColor = data.monthlyChange >= 0 ? 'text-emerald-400' : 'text-pink-400';
        sessionsMonthChangeEl.textContent = changeText + ' vs last month';
        sessionsMonthChangeEl.className = `text-xs mt-1 ${changeColor}`;
    }
    if (totalSessionsEl) totalSessionsEl.textContent = data.totalSessions;
    if (completionRateEl) completionRateEl.textContent = `${data.completionRate}%`;
    if (completionRateDetailEl) completionRateDetailEl.textContent = `${data.completedBookings} of ${data.totalBookings} completed`;
    if (weeklyAverageEl) weeklyAverageEl.textContent = data.weeklyAverage;

    // Update second row metrics
    const currentStreakEl = document.getElementById('current-streak');
    const aiWorkoutsCountEl = document.getElementById('ai-workouts-count');
    const uniqueCoachesEl = document.getElementById('unique-coaches');
    const cancellationRateEl = document.getElementById('cancellation-rate');
    const avgDurationEl = document.getElementById('avg-duration');
    const favoriteTimeEl = document.getElementById('favorite-time');

    if (currentStreakEl) currentStreakEl.textContent = `${data.currentStreak} ${data.currentStreak === 1 ? 'day' : 'days'}`;
    if (aiWorkoutsCountEl) aiWorkoutsCountEl.textContent = data.totalAiWorkouts;
    if (uniqueCoachesEl) uniqueCoachesEl.textContent = data.uniqueCoachesCount;
    if (cancellationRateEl) cancellationRateEl.textContent = `${data.cancellationRate}%`;
    if (avgDurationEl) avgDurationEl.textContent = data.avgDuration > 0 ? `${data.avgDuration} min` : '45 min';
    if (favoriteTimeEl) favoriteTimeEl.textContent = data.favoriteTime;

    // Render monthly trend chart
    renderMonthlyTrendChart(data.monthlyTrend);

    // Render weekly activity chart
    renderWeeklyActivityChart(data.weeklyActivity);

    // Render top coaches
    renderTopCoaches(data.topCoaches);

    // Render goal progress
    renderGoalProgress(data.goalProgress);

    // Render activity summary
    renderActivitySummary(data.recentActivity, data.currentStreak, data.totalAiWorkouts);
}

/**
 * Render monthly trend bar chart
 */
function renderMonthlyTrendChart(monthlyTrend) {
    const container = document.getElementById('monthly-trend-chart');
    if (!container) return;

    const maxValue = Math.max(...monthlyTrend.map(m => m.total), 1);
    
    container.innerHTML = monthlyTrend.map(m => {
        const heightPercent = (m.total / maxValue) * 100;
        const sessionsHeight = m.total > 0 ? (m.sessions / m.total) * heightPercent : 0;
        const aiHeight = m.total > 0 ? (m.aiWorkouts / m.total) * heightPercent : 0;
        
        return `
            <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full flex flex-col justify-end h-40 relative">
                    <div class="w-full rounded-t transition-all duration-500" style="height: ${heightPercent}%">
                        <div class="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style="height: ${sessionsHeight > 0 ? (sessionsHeight / heightPercent) * 100 : 0}%"></div>
                        <div class="w-full bg-gradient-to-t from-purple-600 to-purple-400" style="height: ${aiHeight > 0 ? (aiHeight / heightPercent) * 100 : 0}%"></div>
                    </div>
                    <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white font-semibold">${m.total || ''}</span>
                </div>
                <span class="text-xs text-gray-400">${m.month}</span>
            </div>
        `;
    }).join('');
}

/**
 * Render weekly activity bar chart
 */
function renderWeeklyActivityChart(weeklyActivity) {
    const container = document.getElementById('weekly-activity-chart');
    if (!container) return;

    const maxValue = Math.max(...weeklyActivity.map(d => d.total), 1);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    
    container.innerHTML = weeklyActivity.map(d => {
        const heightPercent = (d.total / maxValue) * 100;
        const isToday = d.day === today;
        
        return `
            <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full flex flex-col justify-end h-40 relative">
                    <div class="w-full ${isToday ? 'bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 shadow-lg shadow-slate-500/30' : 'bg-gradient-to-t from-slate-400 via-slate-300 to-slate-200'} rounded-lg transition-all duration-500" 
                         style="height: ${heightPercent}%"></div>
                    ${d.total > 0 ? `<span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-700 font-semibold">${d.total}</span>` : ''}
                </div>
                <span class="text-xs ${isToday ? 'text-slate-700 font-semibold' : 'text-slate-500'}">${d.day}</span>
            </div>
        `;
    }).join('');
}

/**
 * Render top coaches list
 */
function renderTopCoaches(topCoaches) {
    const container = document.getElementById('top-coaches-list');
    const emptyEl = document.getElementById('top-coaches-empty');
    if (!container) return;

    if (topCoaches.length === 0) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    
    const maxCount = Math.max(...topCoaches.map(c => c.count), 1);
    
    container.innerHTML = topCoaches.map((coach, index) => {
        const barWidth = (coach.count / maxCount) * 100;
        const medals = ['🥇', '🥈', '🥉'];
        const medal = index < 3 ? medals[index] : '';
        
        return `
            <div class="flex items-center gap-3">
                <span class="text-lg w-6">${medal || `${index + 1}.`}</span>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-gray-800 font-medium">${coach.name}</span>
                        <span class="text-xs text-blue-600">${coach.count} sessions</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render goal progress section
 */
function renderGoalProgress(goalProgress) {
    const container = document.getElementById('goal-progress-content');
    if (!container) return;

    const colorClasses = {
        pink: { bg: 'from-pink-600 to-rose-500', text: 'text-pink-400', ring: 'ring-pink-500/30' },
        blue: { bg: 'from-blue-600 to-indigo-500', text: 'text-blue-400', ring: 'ring-blue-500/30' },
        green: { bg: 'from-emerald-600 to-green-500', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
        purple: { bg: 'from-purple-600 to-violet-500', text: 'text-purple-400', ring: 'ring-purple-500/30' },
        gray: { bg: 'from-gray-600 to-gray-500', text: 'text-gray-400', ring: 'ring-gray-500/30' }
    };
    
    const colors = colorClasses[goalProgress.color] || colorClasses.gray;
    
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">${goalProgress.icon || '🎯'}</span>
                    <div>
                        <h4 class="font-semibold text-gray-800">${goalProgress.goal}</h4>
                        <p class="text-xs text-gray-600">${goalProgress.current || 0} / ${goalProgress.target || '?'} activities</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-2xl font-bold ${colors.text}">${goalProgress.progress}%</span>
                </div>
            </div>
            
            <div class="relative">
                <div class="w-full bg-gray-200 rounded-full h-4 ${colors.ring} ring-2">
                    <div class="h-4 rounded-full bg-gradient-to-r ${colors.bg} transition-all duration-700 ease-out" 
                         style="width: ${goalProgress.progress}%"></div>
                </div>
                ${goalProgress.progress >= 100 ? '<div class="absolute -right-1 -top-1 text-xl animate-bounce">🎉</div>' : ''}
            </div>
            
            <p class="text-sm ${colors.text} text-center">${goalProgress.message}</p>
        </div>
    `;
}

/**
 * Render activity summary
 */
function renderActivitySummary(recentActivity, streak, totalAiWorkouts) {
    const container = document.getElementById('activity-summary');
    if (!container) return;

    const streakSection = `
        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div class="flex items-center gap-3">
                <span class="text-2xl">🔥</span>
                <div>
                    <p class="text-sm font-semibold text-gray-900">Current Streak</p>
                    <p class="text-xs text-gray-600">Keep the momentum going!</p>
                </div>
            </div>
            <div class="text-right">
                <span class="text-2xl font-bold text-orange-600">${streak}</span>
                <p class="text-xs text-orange-700">days</p>
            </div>
        </div>
    `;

    const aiWorkoutsSection = `
        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div class="flex items-center gap-3">
                <span class="text-2xl">🤖</span>
                <div>
                    <p class="text-sm font-semibold text-gray-900">AI Workouts Generated</p>
                    <p class="text-xs text-gray-600">Personalized plans created</p>
                </div>
            </div>
            <div class="text-right">
                <span class="text-2xl font-bold text-purple-600">${totalAiWorkouts}</span>
                <p class="text-xs text-purple-700">total</p>
            </div>
        </div>
    `;

    const activityListSection = recentActivity.length > 0 ? `
        <div class="mt-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
            <div class="space-y-2">
                ${recentActivity.map(a => `
                    <div class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span class="text-lg">${a.icon}</span>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900 truncate">${a.title}</p>
                            <p class="text-xs text-gray-600">${a.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span class="text-xs px-2 py-1 rounded ${
                            a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            a.status === 'generated' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                        }">${a.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    container.innerHTML = streakSection + aiWorkoutsSection + activityListSection;
}

// End of User Analytics Functions
// ============================================

// ============================================
// COACH ANALYTICS FUNCTIONS
// ============================================

// Coach Analytics DOM elements
const refreshCoachAnalytics = document.getElementById("refresh-coach-analytics");
const coachAnalyticsLoading = document.getElementById("coach-analytics-loading");
const coachAnalyticsContent = document.getElementById("coach-analytics-content");
const coachAnalyticsEmpty = document.getElementById("coach-analytics-empty");

/**
 * Show coach analytics loading state
 */
function showCoachAnalyticsLoading() {
    if (coachAnalyticsLoading) coachAnalyticsLoading.classList.remove('hidden');
    if (coachAnalyticsContent) coachAnalyticsContent.classList.add('hidden');
    if (coachAnalyticsEmpty) coachAnalyticsEmpty.classList.add('hidden');
}

/**
 * Show coach analytics empty state
 */
function showCoachAnalyticsEmpty() {
    if (coachAnalyticsLoading) coachAnalyticsLoading.classList.add('hidden');
    if (coachAnalyticsContent) coachAnalyticsContent.classList.add('hidden');
    if (coachAnalyticsEmpty) coachAnalyticsEmpty.classList.remove('hidden');
}

/**
 * Load and display coach analytics data
 */
async function loadCoachAnalytics() {
    if (!currentCoachId) {
        showCoachAnalyticsEmpty();
        return;
    }

    showCoachAnalyticsLoading();

    try {
        // Fetch all bookings for this coach
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("coachId", "==", currentCoachId),
            orderBy("createdAt", "desc")
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const allBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch workout sessions conducted by this coach
        const sessionsQuery = query(
            collection(db, "workoutSessions"),
            where("coachId", "==", currentCoachId),
            orderBy("completedAt", "desc")
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const allSessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Get coach profile for hourly rate
        const coachRef = doc(db, "coaches", currentCoachId);
        const coachSnap = await getDoc(coachRef);
        const coachProfile = coachSnap.exists() ? coachSnap.data() : null;

        // Calculate and render analytics
        const analyticsData = calculateCoachAnalytics(allBookings, allSessions, coachProfile);
        renderCoachAnalytics(analyticsData);

    } catch (error) {
        console.error('Failed to load coach analytics:', error);
        showCoachAnalyticsEmpty();
    }
}

/**
 * Calculate coach analytics metrics
 */
function calculateCoachAnalytics(bookings, sessions, coachProfile) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const hourlyRate = coachProfile?.hourlyRate || 0;

    // Filter by status
    const completedBookings = bookings.filter(b => b.status === 'completed');
    
    // Get unique clients
    const clientMap = new Map();
    completedBookings.forEach(b => {
        if (!clientMap.has(b.userId)) {
            clientMap.set(b.userId, {
                id: b.userId,
                name: b.userName || 'Unknown',
                email: b.userEmail,
                sessionsCount: 0,
                lastSession: null,
                goals: new Set()
            });
        }
        const client = clientMap.get(b.userId);
        client.sessionsCount++;
        if (b.goal) client.goals.add(b.goal);
        const sessionDate = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.();
        if (!client.lastSession || sessionDate > client.lastSession) {
            client.lastSession = sessionDate;
        }
    });
    const uniqueClients = Array.from(clientMap.values());

    // Active clients (had session in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeClients = uniqueClients.filter(c => c.lastSession && c.lastSession >= thirtyDaysAgo);

    // New clients this month
    const newClientsThisMonth = completedBookings.filter(b => {
        const date = b.createdAt?.toDate?.() || new Date(0);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((acc, b) => {
        if (!acc.has(b.userId)) acc.add(b.userId);
        return acc;
    }, new Set()).size;

    // Sessions this month
    const sessionsThisMonth = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Sessions last month (for comparison)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const sessionsLastMonth = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    // Monthly change
    const sessionsChange = sessionsLastMonth.length > 0
        ? Math.round(((sessionsThisMonth.length - sessionsLastMonth.length) / sessionsLastMonth.length) * 100)
        : (sessionsThisMonth.length > 0 ? 100 : 0);

    // Revenue calculations
    const revenueThisMonth = sessionsThisMonth.length * hourlyRate;
    const revenueLastMonth = sessionsLastMonth.length * hourlyRate;
    const revenueChange = revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : (revenueThisMonth > 0 ? 100 : 0);

    // Average completion rate from sessions
    let avgCompletion = 0;
    if (sessions.length > 0) {
        const totalCompletion = sessions.reduce((sum, s) => {
            if (s.totalItems > 0) {
                return sum + (s.completedItems / s.totalItems);
            }
            return sum;
        }, 0);
        avgCompletion = Math.round((totalCompletion / sessions.length) * 100);
    }

    // Revenue trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
        const targetMonth = new Date(currentYear, currentMonth - i, 1);
        const monthSessions = completedBookings.filter(b => {
            const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return date.getMonth() === targetMonth.getMonth() && 
                   date.getFullYear() === targetMonth.getFullYear();
        });
        revenueTrend.push({
            month: targetMonth.toLocaleDateString('en-US', { month: 'short' }),
            sessions: monthSessions.length,
            revenue: monthSessions.length * hourlyRate
        });
    }

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
        
        const daySessions = completedBookings.filter(b => {
            const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
            return date >= dayStart && date <= dayEnd;
        });
        
        weeklyActivity.push({
            day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
            date: targetDate.getDate(),
            count: daySessions.length
        });
    }

    // Top clients by session count
    const topClients = uniqueClients
        .sort((a, b) => b.sessionsCount - a.sessionsCount)
        .slice(0, 5);

    // Goals distribution
    const goalCounts = {};
    completedBookings.forEach(b => {
        const goal = b.goal || 'general_fitness';
        goalCounts[goal] = (goalCounts[goal] || 0) + 1;
    });
    const goalsDistribution = Object.entries(goalCounts)
        .map(([goal, count]) => ({ goal, count }))
        .sort((a, b) => b.count - a.count);

    // Clients needing attention (no session in 14+ days, but were active before)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const clientsNeedingAttention = uniqueClients.filter(c => {
        return c.sessionsCount >= 2 && c.lastSession && c.lastSession < twoWeeksAgo;
    }).sort((a, b) => a.lastSession - b.lastSession).slice(0, 5);

    // Performance metrics
    const totalSessions = completedBookings.length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const cancellationRate = bookings.length > 0 
        ? Math.round((cancelledBookings / bookings.length) * 100) 
        : 0;
    const avgSessionsPerClient = uniqueClients.length > 0 
        ? (totalSessions / uniqueClients.length).toFixed(1) 
        : 0;

    // Total lifetime revenue
    const totalRevenue = totalSessions * hourlyRate;

    // Client retention rate (clients with 2+ sessions / total clients)
    const returningClients = uniqueClients.filter(c => c.sessionsCount >= 2);
    const retentionRate = uniqueClients.length > 0 
        ? Math.round((returningClients.length / uniqueClients.length) * 100) 
        : 0;

    // Peak booking hour
    const peakHourCounts = {};
    completedBookings.forEach(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.();
        if (date) {
            const hour = date.getHours();
            peakHourCounts[hour] = (peakHourCounts[hour] || 0) + 1;
        }
    });
    let peakHour = '-';
    const maxPeakEntry = Object.entries(peakHourCounts).sort((a, b) => b[1] - a[1])[0];
    if (maxPeakEntry) {
        const hour = parseInt(maxPeakEntry[0]);
        peakHour = hour < 12 ? `${hour || 12} AM` : `${hour === 12 ? 12 : hour - 12} PM`;
    }

    // Monthly growth rate (comparing last 3 months avg to previous 3 months avg)
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
    
    const recentThreeMonths = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date >= threeMonthsAgo;
    }).length;
    
    const previousThreeMonths = completedBookings.filter(b => {
        const date = b.scheduledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return date >= sixMonthsAgo && date < threeMonthsAgo;
    }).length;
    
    const growthRate = previousThreeMonths > 0 
        ? Math.round(((recentThreeMonths - previousThreeMonths) / previousThreeMonths) * 100)
        : (recentThreeMonths > 0 ? 100 : 0);

    return {
        activeClients: activeClients.length,
        totalClients: uniqueClients.length,
        newClientsThisMonth,
        sessionsThisMonth: sessionsThisMonth.length,
        sessionsChange,
        totalSessions,
        revenueThisMonth,
        revenueChange,
        avgCompletion,
        revenueTrend,
        weeklyActivity,
        topClients,
        goalsDistribution,
        clientsNeedingAttention,
        cancellationRate,
        avgSessionsPerClient,
        hourlyRate,
        totalRevenue,
        retentionRate,
        peakHour,
        growthRate
    };
}

/**
 * Render coach analytics to UI
 */
function renderCoachAnalytics(data) {
    if (coachAnalyticsLoading) coachAnalyticsLoading.classList.add('hidden');
    
    if (data.totalSessions === 0) {
        showCoachAnalyticsEmpty();
        return;
    }

    if (coachAnalyticsContent) coachAnalyticsContent.classList.remove('hidden');
    if (coachAnalyticsEmpty) coachAnalyticsEmpty.classList.add('hidden');

    // Update key metrics (first row)
    const activeClientsEl = document.getElementById('coach-active-clients');
    const newClientsEl = document.getElementById('coach-new-clients');
    const sessionsMonthEl = document.getElementById('coach-sessions-month');
    const sessionsChangeEl = document.getElementById('coach-sessions-change');
    const revenueMonthEl = document.getElementById('coach-revenue-month');
    const revenueChangeEl = document.getElementById('coach-revenue-change');
    const avgCompletionEl = document.getElementById('coach-avg-completion');

    if (activeClientsEl) activeClientsEl.textContent = data.activeClients;
    if (newClientsEl) newClientsEl.textContent = `+${data.newClientsThisMonth} new this month`;
    if (sessionsMonthEl) sessionsMonthEl.textContent = data.sessionsThisMonth;
    if (sessionsChangeEl) {
        const changeText = data.sessionsChange >= 0 ? `↑ ${data.sessionsChange}%` : `↓ ${Math.abs(data.sessionsChange)}%`;
        sessionsChangeEl.textContent = changeText + ' vs last month';
        sessionsChangeEl.className = `text-xs mt-1 ${data.sessionsChange >= 0 ? 'text-emerald-400' : 'text-pink-400'}`;
    }
    if (revenueMonthEl) revenueMonthEl.textContent = `₹${data.revenueThisMonth.toLocaleString()}`;
    if (revenueChangeEl) {
        const changeText = data.revenueChange >= 0 ? `↑ ${data.revenueChange}%` : `↓ ${Math.abs(data.revenueChange)}%`;
        revenueChangeEl.textContent = changeText + ' vs last month';
        revenueChangeEl.className = `text-xs mt-1 ${data.revenueChange >= 0 ? 'text-yellow-400' : 'text-pink-400'}`;
    }
    if (avgCompletionEl) avgCompletionEl.textContent = `${data.avgCompletion}%`;

    // Update second row metrics
    const totalRevenueEl = document.getElementById('coach-total-revenue');
    const retentionRateEl = document.getElementById('coach-retention-rate');
    const avgSessionsEl = document.getElementById('coach-avg-sessions');
    const cancellationRateEl = document.getElementById('coach-cancellation-rate');
    const peakHourEl = document.getElementById('coach-peak-hour');
    const growthRateEl = document.getElementById('coach-growth-rate');

    if (totalRevenueEl) totalRevenueEl.textContent = `₹${data.totalRevenue.toLocaleString()}`;
    if (retentionRateEl) retentionRateEl.textContent = `${data.retentionRate}%`;
    if (avgSessionsEl) avgSessionsEl.textContent = data.avgSessionsPerClient;
    if (cancellationRateEl) cancellationRateEl.textContent = `${data.cancellationRate}%`;
    if (peakHourEl) peakHourEl.textContent = data.peakHour;
    if (growthRateEl) {
        growthRateEl.textContent = `${data.growthRate >= 0 ? '+' : ''}${data.growthRate}%`;
        growthRateEl.className = `text-xl font-bold ${data.growthRate >= 0 ? 'text-lime-400' : 'text-red-400'}`;
    }

    // Render charts
    renderCoachRevenueChart(data.revenueTrend);
    renderCoachWeeklyChart(data.weeklyActivity);
    
    // Render lists
    renderCoachTopClients(data.topClients);
    renderCoachGoalsDistribution(data.goalsDistribution);
    renderCoachPerformanceSummary(data);
    renderClientsNeedingAttention(data.clientsNeedingAttention);
}

/**
 * Render revenue trend chart
 */
function renderCoachRevenueChart(revenueTrend) {
    const container = document.getElementById('coach-revenue-chart');
    if (!container) return;

    const maxRevenue = Math.max(...revenueTrend.map(m => m.revenue), 1);
    
    container.innerHTML = revenueTrend.map((m, idx) => {
        const heightPercent = (m.revenue / maxRevenue) * 100;
        const isCurrentMonth = idx === revenueTrend.length - 1;
        
        return `
            <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full flex flex-col justify-end h-32 relative">
                    <div class="w-full ${isCurrentMonth ? 'bg-gradient-to-t from-yellow-600 to-amber-400' : 'bg-gradient-to-t from-yellow-700/60 to-amber-500/60'} rounded-t transition-all duration-500" 
                         style="height: ${heightPercent}%"></div>
                    ${m.revenue > 0 ? `<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-yellow-300 font-medium whitespace-nowrap">₹${(m.revenue/1000).toFixed(1)}k</span>` : ''}
                </div>
                <span class="text-xs ${isCurrentMonth ? 'text-yellow-400 font-semibold' : 'text-gray-400'}">${m.month}</span>
            </div>
        `;
    }).join('');
}

/**
 * Render weekly sessions chart
 */
function renderCoachWeeklyChart(weeklyActivity) {
    const container = document.getElementById('coach-weekly-chart');
    if (!container) return;

    const maxCount = Math.max(...weeklyActivity.map(d => d.count), 1);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    
    container.innerHTML = weeklyActivity.map(d => {
        const heightPercent = (d.count / maxCount) * 100;
        const isToday = d.day === today;
        
        return `
            <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full flex flex-col justify-end h-32 relative">
                    <div class="w-full ${isToday ? 'bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 shadow-lg shadow-slate-500/30' : 'bg-gradient-to-t from-slate-400 via-slate-300 to-slate-200'} rounded-lg transition-all duration-500" 
                         style="height: ${Math.max(heightPercent, d.count > 0 ? 10 : 0)}%"></div>
                    ${d.count > 0 ? `<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-slate-600 font-semibold">${d.count}</span>` : ''}
                </div>
                <span class="text-xs ${isToday ? 'text-slate-700 font-semibold' : 'text-slate-500'}">${d.day}</span>
            </div>
        `;
    }).join('');
}

/**
 * Render top clients list
 */
function renderCoachTopClients(topClients) {
    const container = document.getElementById('coach-top-clients');
    const emptyEl = document.getElementById('coach-top-clients-empty');
    if (!container) return;

    if (topClients.length === 0) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    const maxSessions = Math.max(...topClients.map(c => c.sessionsCount), 1);
    
    container.innerHTML = topClients.map((client, idx) => {
        const barWidth = (client.sessionsCount / maxSessions) * 100;
        const medals = ['🥇', '🥈', '🥉'];
        const medal = idx < 3 ? medals[idx] : '';
        const goalsList = Array.from(client.goals).slice(0, 2).map(g => 
            g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        ).join(', ');
        
        return `
            <div class="flex items-center gap-3">
                <span class="text-lg w-6">${medal || `${idx + 1}.`}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-white font-medium truncate">${client.name}</span>
                        <span class="text-xs text-blue-400 ml-2">${client.sessionsCount} sessions</span>
                    </div>
                    <div class="w-full bg-gray-700/50 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style="width: ${barWidth}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 truncate">${goalsList || 'General'}</p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render goals distribution
 */
function renderCoachGoalsDistribution(goalsDistribution) {
    const container = document.getElementById('coach-goals-distribution');
    if (!container) return;

    const goalLabels = {
        weight_loss: { label: 'Weight Loss', color: 'pink', icon: '🔥' },
        muscle_gain: { label: 'Muscle Gain', color: 'blue', icon: '💪' },
        endurance: { label: 'Endurance', color: 'green', icon: '🏃' },
        general_fitness: { label: 'General Fitness', color: 'purple', icon: '⭐' },
        yoga: { label: 'Yoga', color: 'teal', icon: '🧘' },
        hiit: { label: 'HIIT', color: 'orange', icon: '⚡' }
    };

    const total = goalsDistribution.reduce((sum, g) => sum + g.count, 0);
    
    if (total === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No data yet</p>';
        return;
    }

    container.innerHTML = goalsDistribution.slice(0, 4).map(g => {
        const goalInfo = goalLabels[g.goal] || { label: g.goal.replace('_', ' '), color: 'gray', icon: '🎯' };
        const percentage = Math.round((g.count / total) * 100);
        
        const colorClasses = {
            pink: 'from-pink-600 to-rose-500 text-pink-300',
            blue: 'from-blue-600 to-indigo-500 text-blue-300',
            green: 'from-emerald-600 to-green-500 text-emerald-300',
            purple: 'from-purple-600 to-violet-500 text-purple-300',
            teal: 'from-teal-600 to-cyan-500 text-teal-300',
            orange: 'from-orange-600 to-amber-500 text-orange-300',
            gray: 'from-gray-600 to-gray-500 text-gray-300'
        };
        const colors = colorClasses[goalInfo.color] || colorClasses.gray;
        
        return `
            <div class="flex items-center gap-3">
                <span class="text-lg">${goalInfo.icon}</span>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm ${colors.split(' ')[2]}">${goalInfo.label}</span>
                        <span class="text-xs text-gray-400">${percentage}% (${g.count})</span>
                    </div>
                    <div class="w-full bg-gray-700/50 rounded-full h-2">
                        <div class="h-2 rounded-full bg-gradient-to-r ${colors.split(' ').slice(0, 2).join(' ')}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render performance summary
 */
function renderCoachPerformanceSummary(data) {
    const container = document.getElementById('coach-performance-summary');
    if (!container) return;

    container.innerHTML = `
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-sm text-slate-600">Total Sessions</span>
            <span class="text-sm font-semibold text-slate-800">${data.totalSessions}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-sm text-slate-600">Total Clients</span>
            <span class="text-sm font-semibold text-slate-800">${data.totalClients}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-sm text-slate-600">Avg Sessions/Client</span>
            <span class="text-sm font-semibold text-slate-800">${data.avgSessionsPerClient}</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-sm text-slate-600">Cancellation Rate</span>
            <span class="text-sm font-semibold ${data.cancellationRate > 20 ? 'text-red-600' : 'text-emerald-600'}">${data.cancellationRate}%</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
            <span class="text-sm text-emerald-700">Hourly Rate</span>
            <span class="text-sm font-semibold text-emerald-800">₹${data.hourlyRate.toLocaleString()}</span>
        </div>
    `;
}

/**
 * Render clients needing attention
 */
function renderClientsNeedingAttention(clients) {
    const container = document.getElementById('coach-attention-clients');
    const emptyEl = document.getElementById('coach-attention-empty');
    const countEl = document.getElementById('attention-count');
    if (!container) return;

    if (countEl) countEl.textContent = clients.length;

    if (clients.length === 0) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    const now = new Date();
    
    container.innerHTML = clients.map(client => {
        const daysSinceLastSession = Math.floor((now - client.lastSession) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        ${client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-800">${client.name}</p>
                        <p class="text-xs text-slate-600">${client.sessionsCount} total sessions</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs text-red-600 font-medium">${daysSinceLastSession} days ago</p>
                    <p class="text-xs text-slate-500">Last session</p>
                </div>
            </div>
        `;
    }).join('');
}

// End of Coach Analytics Functions
// ============================================

async function createBooking(coachId, goal, scheduledAt) {
    const user = auth.currentUser;
    if (!user) return;
    console.log('Creating booking for coachId:', coachId, 'goal:', goal, 'scheduledAt:', scheduledAt);
    
    // If coachId is null, this is a broadcast request to all coaches (for "book later")
    const isBroadcastRequest = (coachId === null);
    
    if (isBroadcastRequest) {
        console.log('📢 Creating BROADCAST booking request (no specific coach)');
        // Skip availability check for broadcast requests
        // Coaches will see this request and can accept if available
    } else {
        // Check if coach already has an active booking at this time
        const now = new Date();
        const bufferMinutes = 30; // Time buffer around bookings
        
        try {
            console.log('🔍 Checking coach availability...');
            
            // Query for existing bookings for this coach that are active/confirmed
            const existingBookingsQuery = query(
                collection(db, "bookings"),
                where("coachId", "==", coachId),
                where("status", "in", ["pending", "confirmed", "reviewing", "active"])
            );
            
            const existingBookingsSnap = await getDocs(existingBookingsQuery);
            console.log(`Found ${existingBookingsSnap.docs.length} existing bookings for coach`);
            
            // For immediate bookings, use current time. For scheduled, use provided time
            const now = new Date();
            const requestedTime = scheduledAt ? new Date(scheduledAt) : now;
            const requestedStart = requestedTime.getTime();
            const requestedEnd = requestedStart + (60 * 60 * 1000); // 1 hour sessions
            const bufferMs = bufferMinutes * 60 * 1000;
            
            console.log(`📅 Requested booking time: ${requestedTime.toLocaleString()}`);
            console.log(`📅 Session window: ${requestedTime.toLocaleString()} - ${new Date(requestedEnd).toLocaleString()}`);
            
            for (const bookingDoc of existingBookingsSnap.docs) {
                const booking = bookingDoc.data();
                
                // Handle serverTimestamp or regular timestamp
                let bookingTime;
                if (!booking.scheduledAt) {
                    // If no scheduledAt, assume it's an immediate booking created recently
                    bookingTime = booking.createdAt?.toDate ? booking.createdAt.toDate() : now;
                } else if (booking.scheduledAt.toDate) {
                    bookingTime = booking.scheduledAt.toDate();
                } else {
                    bookingTime = new Date(booking.scheduledAt);
                }
                
                const bookingStart = bookingTime.getTime();
                const bookingEnd = bookingStart + (60 * 60 * 1000); // 1 hour sessions
                
                console.log(`  🔍 Checking against booking ${bookingDoc.id}:`);
                console.log(`     Existing: ${bookingTime.toLocaleString()} - ${new Date(bookingEnd).toLocaleString()} (${booking.status})`);
                
                // Check if there's a time conflict (with buffer)
                const hasConflict = (
                    (requestedStart >= bookingStart - bufferMs && requestedStart < bookingEnd + bufferMs) ||
                    (requestedEnd > bookingStart - bufferMs && requestedEnd <= bookingEnd + bufferMs) ||
                    (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
                );
                
                if (hasConflict) {
                    console.log('❌ TIME CONFLICT DETECTED!');
                    console.log(`   Requested: ${requestedTime.toLocaleString()} - ${new Date(requestedEnd).toLocaleString()}`);
                    console.log(`   Existing:  ${bookingTime.toLocaleString()} - ${new Date(bookingEnd).toLocaleString()}`);
                    console.log(`   Overlap detected with booking ${bookingDoc.id}`);
                    
                    const endTime = new Date(bookingEnd);
                    const endTimeStr = endTime.toLocaleString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric'
                    });
                    
                    // Return null to indicate booking failed due to conflict
                    showToast(`This coach is currently busy and will be available after ${endTimeStr}. Please refresh the coach list.`, 'error');
                    return null;
                }
            }
        
            console.log('✅ Coach is available for booking');
        } catch (error) {
            if (error.message.includes('already booked') || error.message.includes('busy')) {
                return null; // Return null instead of throwing for availability conflicts
            }
            console.warn('⚠️ Could not check availability (index may be missing), proceeding with booking:', error.message);
            // Continue with booking if availability check fails due to index issues
        }
    }
    
    // Get coach data (skip for broadcast requests)
    let coachName = null;
    let coachEmail = null;
    
    if (!isBroadcastRequest) {
        const coachSnap = await getDoc(doc(db, "coaches", coachId)).catch(() => null);
        const coachData = coachSnap?.exists?.() ? coachSnap.data() : null;
        coachName = coachData?.name ?? null;
        coachEmail = coachData?.email ?? null;
        console.log('Coach data:', { coachName, coachEmail });
    } else {
        console.log('📢 Broadcast request - no specific coach');
    }
    
    // Generate Jitsi Meet room (free, no API required)
    console.log('Using Jitsi Meet for video sessions');
    const roomName = generateMeetingRoom();
    const meetingId = roomName;
    // Use clean URL without hash parameters - configuration will be handled in the API
    const meetingLink = `https://meet.jit.si/${roomName}`;
    const meetingPassword = '';
    
    const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        coachId: coachId, // null for broadcast requests
        coachEmail: coachEmail, // null for broadcast requests
        goal,
        status: "pending", // Always start as pending
        coachName: coachName, // null for broadcast requests
        isBroadcast: isBroadcastRequest, // Flag to indicate broadcast request
        scheduledAt: scheduledAt || serverTimestamp(),
        meetingId: meetingId,
        meetingLink: meetingLink,
        meetingPassword: meetingPassword,
        createdAt: serverTimestamp()
    };
    
    console.log('Booking data:', bookingData);
    const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
    console.log('Booking created with ID:', bookingRef.id);
    
    // Notify coach(es) about new booking request
    if (isBroadcastRequest) {
        // Notify ALL coaches about broadcast request
        console.log('📢 Notifying ALL coaches about broadcast request');
        await notifyAllCoaches({
            type: 'booking_request',
            bookingId: bookingRef.id,
            userName: user.displayName || user.email,
            userEmail: user.email,
            goal: goal,
            scheduledAt: scheduledAt ? scheduledAt.toISOString() : 'Now',
            timestamp: serverTimestamp()
        });
    } else if (coachEmail) {
        // Notify specific coach
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
    const user = auth.currentUser;
    if (!user) return;
    
    const bookingRef = doc(db, "bookings", bookingId);
    
    // Check if this is a broadcast request that needs coach assignment
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
    }
    
    const bookingData = bookingSnap.data();
    const updateData = { 
        status: "confirmed",
        confirmedAt: serverTimestamp()
    };
    
    // If this is a broadcast request (no coachId), assign the confirming coach
    if (bookingData.isBroadcast && !bookingData.coachId) {
        console.log('📢 Broadcast request - assigning coach:', user.uid);
        
        // Get coach data
        const coachQuery = query(
            collection(db, "coaches"),
            where("email", "==", user.email)
        );
        const coachSnap = await getDocs(coachQuery);
        
        if (!coachSnap.empty) {
            const coachDoc = coachSnap.docs[0];
            const coachData = coachDoc.data();
            
            updateData.coachId = coachDoc.id;
            updateData.coachName = coachData.name;
            updateData.coachEmail = coachData.email;
            updateData.isBroadcast = false; // No longer a broadcast request
            
            console.log('✅ Coach assigned:', coachData.name);
        }
    }
    
    await updateDoc(bookingRef, updateData);
    
    console.log('✅ Booking confirmed, will trigger notification to user via listener');
    
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

async function notifyAllCoaches(notificationData) {
    try {
        console.log('📢 Creating broadcast notification for all coaches', notificationData);
        
        // Get all coaches
        const coachesQuery = query(collection(db, "coaches"));
        const coachesSnap = await getDocs(coachesQuery);
        
        console.log(`Found ${coachesSnap.docs.length} coaches to notify`);
        
        if (coachesSnap.docs.length === 0) {
            console.warn('⚠️ No coaches found in database! Cannot send broadcast notifications.');
            return;
        }
        
        // Log coach emails for debugging
        coachesSnap.docs.forEach(doc => {
            const coach = doc.data();
            console.log(`Coach: ${doc.id}, Email: ${coach.email || 'NO EMAIL'}`);
        });
        
        // Create notification for each coach
        const notificationPromises = coachesSnap.docs.map(async (coachDoc) => {
            const coach = coachDoc.data();
            if (coach.email) {
                console.log(`Creating notification for coach: ${coach.email}`);
                return addDoc(collection(db, "notifications"), {
                    recipientEmail: coach.email,
                    read: false,
                    type: notificationData.type,
                    bookingId: notificationData.bookingId,
                    userName: notificationData.userName,
                    goal: notificationData.goal,
                    isBroadcast: true,
                    timestamp: new Date()
                });
            } else {
                console.warn(`Coach ${coachDoc.id} has no email, skipping notification`);
                return Promise.resolve();
            }
        });
        
        await Promise.all(notificationPromises);
        console.log(`✅ Broadcast notification sent to ${coachesSnap.docs.length} coaches`);
    } catch (error) {
        console.error('❌ Failed to notify all coaches:', error);
        console.error('Error details:', error.message);
    }
}

// ============================================
// SESSION REMINDER SYSTEM
// ============================================

let sessionReminderInterval = null;
let userSessionReminderInterval = null;
const notifiedBookings = new Set(); // Track which bookings we've already notified about
const notifiedUserBookings = new Set(); // Track user bookings notified

/**
 * Start checking for upcoming sessions that need reminders (FOR COACHES)
 * Checks every minute for sessions starting in 5 minutes
 */
function startSessionReminderSystem() {
    console.log('🔔 Starting session reminder system for coach...');
    
    // Stop any existing interval
    if (sessionReminderInterval) {
        clearInterval(sessionReminderInterval);
    }
    
    // Check immediately
    checkUpcomingSessions();
    
    // Then check every minute
    sessionReminderInterval = setInterval(() => {
        checkUpcomingSessions();
    }, 60000); // Check every 60 seconds
}

/**
 * Start checking for upcoming sessions that need reminders (FOR USERS)
 * Checks every minute for sessions starting in 5 minutes
 */
function startUserSessionReminderSystem() {
    console.log('🔔 Starting session reminder system for user...');
    
    // Stop any existing interval
    if (userSessionReminderInterval) {
        clearInterval(userSessionReminderInterval);
    }
    
    // Check immediately
    checkUpcomingUserSessions();
    
    // Then check every minute
    userSessionReminderInterval = setInterval(() => {
        checkUpcomingUserSessions();
    }, 60000); // Check every 60 seconds
}

/**
 * Stop the session reminder system
 */
function stopSessionReminderSystem() {
    if (sessionReminderInterval) {
        clearInterval(sessionReminderInterval);
        sessionReminderInterval = null;
    }
    if (userSessionReminderInterval) {
        clearInterval(userSessionReminderInterval);
        userSessionReminderInterval = null;
    }
    notifiedBookings.clear();
    notifiedUserBookings.clear();
    console.log('🔕 Session reminder system stopped');
}

/**
 * Check for sessions starting in 5 minutes and send reminders
 */
async function checkUpcomingSessions() {
    if (!currentCoachId) return;
    
    try {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        const sixMinutesFromNow = new Date(now.getTime() + 6 * 60 * 1000);
        
        // Query for confirmed bookings scheduled between 5-6 minutes from now
        const upcomingQuery = query(
            collection(db, "bookings"),
            where("coachId", "==", currentCoachId),
            where("status", "in", ["confirmed", "pending"])
        );
        
        const snapshot = await getDocs(upcomingQuery);
        
        snapshot.docs.forEach(doc => {
            const booking = { id: doc.id, ...doc.data() };
            
            // Skip if already notified
            if (notifiedBookings.has(booking.id)) {
                return;
            }
            
            // Get scheduled time
            let scheduledTime;
            if (booking.scheduledAt) {
                scheduledTime = booking.scheduledAt.toDate ? booking.scheduledAt.toDate() : new Date(booking.scheduledAt);
            } else {
                return; // Skip if no scheduled time
            }
            
            const timeUntilSession = scheduledTime.getTime() - now.getTime();
            const minutesUntilSession = timeUntilSession / 60000;
            
            // If session starts in 4-5 minutes, send reminder (accounting for 60s check interval)
            if (minutesUntilSession >= 4 && minutesUntilSession <= 5) {
                console.log(`⏰ Session starting in ${Math.floor(minutesUntilSession)} minutes! Sending reminder...`);
                sendSessionReminder(booking, scheduledTime);
                notifiedBookings.add(booking.id);
            }
        });
        
    } catch (error) {
        console.error('Error checking upcoming sessions:', error);
    }
}

/**
 * Send reminder to coach about upcoming session
 * @param {Object} booking - The booking object
 * @param {Date} scheduledTime - The scheduled time
 */
async function sendSessionReminder(booking, scheduledTime) {
    const timeStr = scheduledTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    const userName = booking.userName || booking.userEmail || 'User';
    const goal = booking.goal || 'fitness';
    
    // Show popup modal for joining session
    showSessionJoinModal(booking, timeStr);
    
    // Show browser notification with sound
    showNotificationWithSound(
        '⏰ Session Starting Soon!',
        `Your session with ${userName} (${goal}) starts at ${timeStr}. Time to join!`,
        'sessionReminder'
    );
    
    // Send email notification through Firestore
    try {
        await addDoc(collection(db, "mail"), {
            to: booking.coachEmail,
            message: {
                subject: `⏰ Session Reminder: Starting in 5 minutes`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #10b981;">🏋️ Session Starting Soon!</h2>
                        <p style="font-size: 16px; color: #374151;">
                            Hi Coach,
                        </p>
                        <p style="font-size: 16px; color: #374151;">
                            Your session with <strong>${userName}</strong> is scheduled to start in <strong style="color: #ef4444;">5 minutes</strong>!
                        </p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Client:</strong> ${userName}</p>
                            <p style="margin: 5px 0;"><strong>Goal:</strong> ${goal}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${timeStr}</p>
                            <p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${booking.meetingLink}" style="color: #3b82f6;">${booking.meetingLink}</a></p>
                        </div>
                        <p style="font-size: 16px; color: #374151;">
                            Please join the session now to ensure you're ready when the client arrives.
                        </p>
                        <a href="${booking.meetingLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                            Join Session Now
                        </a>
                        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                            Find My Fit Coach - Your Fitness Journey Partner
                        </p>
                    </div>
                `
            }
        });
        console.log('📧 Reminder email sent to:', booking.coachEmail);
    } catch (error) {
        console.error('Failed to send reminder email:', error);
    }
    
    // Also add to in-app notifications
    try {
        await addDoc(collection(db, "notifications"), {
            recipientEmail: booking.coachEmail,
            read: false,
            type: 'session_reminder',
            bookingId: booking.id,
            userName: userName,
            goal: goal,
            scheduledTime: scheduledTime,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to create in-app notification:', error);
    }
}

/**
 * Check for user sessions starting in 5 minutes and send reminders
 */
async function checkUpcomingUserSessions() {
    if (!currentUserId) return;
    
    try {
        const now = new Date();
        const user = auth.currentUser;
        if (!user) return;
        
        // Query for confirmed bookings for this user
        const upcomingQuery = query(
            collection(db, "bookings"),
            where("userId", "==", currentUserId),
            where("status", "in", ["confirmed", "active"])
        );
        
        const snapshot = await getDocs(upcomingQuery);
        
        snapshot.docs.forEach(doc => {
            const booking = { id: doc.id, ...doc.data() };
            
            // Skip if already notified
            if (notifiedUserBookings.has(booking.id)) {
                return;
            }
            
            // Get scheduled time
            let scheduledTime;
            if (booking.scheduledAt) {
                scheduledTime = booking.scheduledAt.toDate ? booking.scheduledAt.toDate() : new Date(booking.scheduledAt);
            } else {
                return; // Skip if no scheduled time
            }
            
            const timeUntilSession = scheduledTime.getTime() - now.getTime();
            const minutesUntilSession = timeUntilSession / 60000;
            
            // If session starts in 4-5 minutes, send reminder (accounting for 60s check interval)
            if (minutesUntilSession >= 4 && minutesUntilSession <= 5) {
                console.log(`⏰ User session starting in ${Math.floor(minutesUntilSession)} minutes! Sending reminder...`);
                sendUserSessionReminder(booking, scheduledTime);
                notifiedUserBookings.add(booking.id);
            }
        });
        
    } catch (error) {
        console.error('Error checking upcoming user sessions:', error);
    }
}

/**
 * Send reminder to user about upcoming session
 * @param {Object} booking - The booking object
 * @param {Date} scheduledTime - The scheduled time
 */
async function sendUserSessionReminder(booking, scheduledTime) {
    const timeStr = scheduledTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    const coachName = booking.coachName || 'Coach';
    const goal = booking.goal || 'fitness';
    
    // Show popup modal for joining session
    showUserSessionJoinModal(booking, timeStr);
    
    // Show browser notification with sound
    showNotificationWithSound(
        '⏰ Session Starting Soon!',
        `Your session with ${coachName} (${goal}) starts at ${timeStr}. Time to join!`,
        'sessionReminder'
    );
}

/**
 * Show session join modal popup for users
 */
function showUserSessionJoinModal(booking, timeStr) {
    if (!sessionJoinModal) return;
    
    pendingJoinBooking = booking;
    
    const coachName = booking.coachName || 'Coach';
    const goal = booking.goal || 'fitness';
    
    // Update modal content
    if (joinModalClientName) joinModalClientName.textContent = coachName;
    if (joinModalGoal) joinModalGoal.textContent = goal;
    if (joinModalTime) joinModalTime.textContent = timeStr;
    
    // Show modal
    sessionJoinModal.classList.remove('hidden');
    
    console.log('📢 User session join modal displayed');
}

/**
 * Show session join modal popup
 */
function showSessionJoinModal(booking, timeStr) {
    if (!sessionJoinModal) return;
    
    pendingJoinBooking = booking;
    
    const userName = booking.userName || booking.userEmail || 'User';
    const goal = booking.goal || 'fitness';
    
    // Update modal content
    if (joinModalClientName) joinModalClientName.textContent = userName;
    if (joinModalGoal) joinModalGoal.textContent = goal;
    if (joinModalTime) joinModalTime.textContent = timeStr;
    
    // Show modal
    sessionJoinModal.classList.remove('hidden');
    
    console.log('📢 Session join modal displayed');
}

// ============================================
// END SESSION REMINDER SYSTEM
// ============================================

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
    if (broadcastBookingsListener) {
        broadcastBookingsListener();
    }
    
    // Set up real-time listener for bookings assigned to this coach
    const q = query(
        collection(db, "bookings"),
        where("coachId", "==", currentCoachId),
        orderBy("createdAt", "desc"),
        limit(50)
    );
    
    // Set up separate listener for broadcast requests (coachId is null)
    // Simplified query to avoid complex index requirements
    const broadcastQuery = query(
        collection(db, "bookings"),
        where("isBroadcast", "==", true),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    
    console.log('Setting up real-time bookings listeners for coachId:', currentCoachId);
    
    let assignedBookings = [];
    let broadcastBookings = [];
    
    const renderCombinedBookings = () => {
        // Filter broadcast bookings to only show pending ones
        const pendingBroadcasts = broadcastBookings.filter(b => b.status === 'pending');
        const allBookings = [...assignedBookings, ...pendingBroadcasts];
        renderCoachCalendar(allBookings);
    };
    
    bookingsListener = onSnapshot(q, (snapshot) => {
        console.log('Assigned bookings snapshot received, total docs:', snapshot.docs.length);
        assignedBookings = snapshot.docs.map(d => {
            const data = { id: d.id, ...d.data() };
            console.log('Booking item:', data);
            return data;
        });
        renderCombinedBookings();
        
        // Check for new pending bookings (sound notification for coach)
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const booking = { id: change.doc.id, ...change.doc.data() };
                if (booking.status === 'pending' && booking.coachId === currentCoachId) {
                    showNotificationWithSound(
                        '🔔 New Booking Request!',
                        `${booking.userName || booking.userEmail} wants to book a ${booking.goal} session`,
                        'newBooking'
                    );
                }
            }
        });
    }, (error) => {
        console.error('Bookings listener error:', error);
    });
    
    // Listen for broadcast requests
    broadcastBookingsListener = onSnapshot(broadcastQuery, (snapshot) => {
        console.log('📢 Broadcast bookings snapshot received, total docs:', snapshot.docs.length);
        broadcastBookings = snapshot.docs.map(d => {
            const data = { id: d.id, ...d.data() };
            console.log('Broadcast booking item:', data);
            return data;
        });
        renderCombinedBookings();
        
        // Notify about new broadcast requests
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const booking = { id: change.doc.id, ...change.doc.data() };
                if (booking.status === 'pending' && booking.isBroadcast) {
                    showNotificationWithSound(
                        '📢 New Open Request!',
                        `${booking.userName || booking.userEmail} is looking for a ${booking.goal} coach`,
                        'newBooking'
                    );
                }
            }
        });
    }, (error) => {
        console.error('❌ Broadcast bookings listener error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // If it's an index error, show a helpful message
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
            console.error('⚠️ Firestore index required. Please create the index or check Firestore rules.');
            console.error('Query: bookings collection, where isBroadcast==true, orderBy createdAt desc');
        }
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
    const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'reviewing');
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
    
    // Render Active Sessions - HIGHEST PRIORITY
    if (activeBookings.length > 0) {
        const activeSection = document.createElement("div");
        activeSection.className = "mb-8 p-5 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl border-3 border-emerald-400 shadow-2xl animate-pulse-slow";
        activeSection.innerHTML = `
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-2xl font-extrabold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text flex items-center gap-3">
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-full animate-ping-slow">
                        <span class="absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                        <span class="relative inline-flex w-6 h-6 bg-emerald-500 rounded-full"></span>
                    </span>
                    ACTIVE SESSION NOW (${activeBookings.length})
                </h3>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border-2 border-emerald-300 animate-bounce">
                        ⚡ IN PROGRESS
                    </span>
                </div>
            </div>
            <div id="active-sessions-list" class="space-y-4"></div>
        `;
        coachCalendar.appendChild(activeSection);
        
        const activeList = activeSection.querySelector("#active-sessions-list");
        activeBookings.forEach(booking => {
            activeList.appendChild(createCoachBookingCard(booking, 'active'));
        });
    }
    
    // Render Pending Requests - PRIORITY SECTION
    if (pendingBookings.length > 0) {
        const pendingSection = document.createElement("div");
        pendingSection.className = "mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 shadow-lg";
        pendingSection.innerHTML = `
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-xl font-bold text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text flex items-center gap-2">
                    <span class="inline-block w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg"></span>
                    🔔 Pending Requests (${pendingBookings.length})
                    <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200 ml-2">Action Required</span>
                </h3>
                <div class="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200">
                    💡 Confirm bookings to secure sessions
                </div>
            </div>
            <div id="pending-sessions-list" class="space-y-3"></div>
        `;
        coachCalendar.appendChild(pendingSection);
        
        const pendingList = pendingSection.querySelector("#pending-sessions-list");
        pendingBookings.forEach(booking => {
            pendingList.appendChild(createCoachBookingCard(booking, 'pending'));
        });
    }
    
    // Render Confirmed Sessions (Ready to Join)
    if (confirmedBookings.length > 0) {
        const confirmedSection = document.createElement("div");
        confirmedSection.className = "mb-6";
        confirmedSection.innerHTML = `
            <h3 class="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                <span class="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                ✓ Confirmed Sessions (${confirmedBookings.length})
            </h3>
            <div id="confirmed-sessions-list" class="space-y-3"></div>
        `;
        coachCalendar.appendChild(confirmedSection);
        
        const confirmedList = confirmedSection.querySelector("#confirmed-sessions-list");
        confirmedBookings.forEach(booking => {
            confirmedList.appendChild(createCoachBookingCard(booking, 'confirmed'));
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
            <button id="toggle-past-sessions" class="w-full flex items-center justify-between text-left p-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors mb-3">
                <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <span class="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                    Past Sessions (${pastBookings.length})
                </h3>
                <svg id="past-sessions-chevron" class="w-5 h-5 text-gray-600 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        completed: 'border-gray-300 bg-gray-50',
        cancelled: 'border-red-500/30 bg-red-500/5'
    };
    
    card.className = `rounded-lg border p-4 ${statusStyles[booking.status] || 'border-gray-700'}`;
    
    // Format date and time more prominently
    let dateTimeDisplay = '';
    if (booking.scheduledAt) {
        const scheduledDate = new Date(booking.scheduledAt.toMillis());
        const isToday = new Date().toDateString() === scheduledDate.toDateString();
        const isTomorrow = new Date(Date.now() + 86400000).toDateString() === scheduledDate.toDateString();
        
        let dayLabel = scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (isToday) dayLabel = 'Today';
        else if (isTomorrow) dayLabel = 'Tomorrow';
        
        const timeStr = scheduledDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
        
        // Show prominent time for upcoming/confirmed sessions
        if (category === 'pending' || category === 'active' || (booking.status === 'confirmed' && !booking.status.includes('completed'))) {
            dateTimeDisplay = `
                <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-xs text-blue-600 font-semibold">📅 ${dayLabel}</p>
                    <p class="text-lg font-bold text-blue-700">🕐 ${timeStr}</p>
                </div>
            `;
        } else {
            dateTimeDisplay = `<p class="text-xs text-gray-600 mt-1">🕐 ${timeStr}</p>`;
        }
    } else {
        dateTimeDisplay = '<p class="text-xs text-gray-600 mt-1">🕐 In Progress</p>';
    }
    
    const confirmBtnId = `confirm-${booking.id}`;
    const endBtnId = `coach-end-${booking.id}`;
    const deleteBtnId = `coach-delete-${booking.id}`;
    const joinBtnId = `coach-join-${booking.id}`;
    
    const statusBadges = {
        pending: '<span class="inline-block px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">⏳ Pending</span>',
        confirmed: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">✓ Confirmed</span>',
        active: '<span class="inline-block px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">🟢 Active</span>',
        scheduled: '<span class="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600 border border-blue-500/30">📅 Scheduled</span>',
        completed: '<span class="inline-block px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 border border-gray-300">✓ Completed</span>',
        cancelled: '<span class="inline-block px-2 py-1 rounded text-xs bg-red-500/20 text-red-600 border border-red-500/30">✕ Cancelled</span>'
    };
    
    // Check if scheduled time has arrived (allow joining 5 minutes early)
    const now = Date.now();
    const scheduledTime = booking.scheduledAt?.toMillis?.() ?? now;
    const canJoinYet = (scheduledTime - now) <= (5 * 60 * 1000); // 5 minutes early grace period
    
    const showConfirmButton = booking.status === 'pending' && category !== 'past';
    // Show Join button if confirmed OR active OR reviewing, has link, and (time has arrived OR session is already active)
    const showJoinButton = (booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'reviewing') && booking.meetingLink && category !== 'past' && (canJoinYet || booking.status === 'active');
    // Show End button if time has arrived (canJoinYet) OR session is active, and status is confirmed/reviewing/active
    const showEndButton = category !== 'past' && (booking.status === 'confirmed' || booking.status === 'reviewing' || booking.status === 'active') && (canJoinYet || booking.status === 'active');
    const showDeleteButton = category === 'past' && (booking.status === 'completed' || booking.status === 'cancelled');
    
    // Add broadcast indicator
    const broadcastBadge = booking.isBroadcast 
        ? '<span class="inline-block px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-600 border border-purple-500/30 animate-pulse">📢 Open Request</span>'
        : '';
    
    card.innerHTML = `
        <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <p class="font-semibold text-gray-800">${booking.userName || booking.userEmail || 'User'}</p>
                    ${broadcastBadge}
                    ${booking.status !== 'active' ? (statusBadges[booking.status] || '') : ''}
                </div>
                <p class="text-sm text-gray-600">Goal: <span class="font-medium">${booking.goal}</span></p>
                ${booking.isBroadcast ? '<p class="text-xs text-purple-600 mt-1 italic">🌐 This request was sent to all coaches</p>' : ''}
                ${booking.status === 'active' ? '<p class="text-xs text-emerald-600 mt-1 font-semibold">⚡ Session in progress</p>' : dateTimeDisplay}
            </div>
            <div class="flex flex-col items-end gap-2">
                ${showConfirmButton ? '<button id="' + confirmBtnId + '" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500 whitespace-nowrap">Confirm Booking</button>' : ''}
                ${showJoinButton ? '<button id="' + joinBtnId + '" data-meeting-link="' + booking.meetingLink + '" class="rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 text-white text-xs font-semibold hover:from-emerald-500 hover:to-blue-500 inline-flex items-center gap-2 whitespace-nowrap"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session</button>' : ''}
                ${showEndButton ? '<button id="' + endBtnId + '" class="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 text-blue-400 text-xs font-medium hover:bg-blue-500/20 whitespace-nowrap">End Session</button>' : ''}
                ${showDeleteButton ? '<button id="' + deleteBtnId + '" class="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-gray-600 text-xs font-medium hover:bg-gray-100 whitespace-nowrap">Delete</button>' : ''}
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
    
    // Add event listener for join button (COACH)
    if (showJoinButton) {
        setTimeout(() => {
            const joinBtn = card.querySelector(`#${joinBtnId}`);
            joinBtn?.addEventListener('click', async () => {
                joinBtn.disabled = true;
                joinBtn.innerHTML = 'Starting Review...';
                try {
                    // Update booking status to "reviewing" so user knows coach is preparing
                    await updateDoc(doc(db, "bookings", booking.id), { 
                        status: "reviewing",
                        reviewStartedAt: serverTimestamp()
                    });
                    
                    // Show pre-session review modal for coach
                    showPreSessionReview(booking);
                    
                    // Re-enable button (will be updated by real-time listener)
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session';
                    
                } catch (e) {
                    console.error('Failed to start review:', e);
                    alert('Failed to start review: ' + e.message);
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>Join Session';
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
    
    // Get booking data before ending
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
        console.error('Booking not found');
        return;
    }
    
    const bookingData = bookingSnap.data();
    
    // Update booking status to completed
    await updateDoc(bookingRef, { 
        status: "completed",
        endedAt: serverTimestamp()
    });
    
    // Show feedback modal
    showFeedbackModal(bookingId, bookingData);
}

// Feedback modal functions
function showFeedbackModal(bookingId, bookingData) {
    currentFeedbackBooking = { id: bookingId, ...bookingData };
    selectedRating = 0;
    
    // Determine who to show feedback for
    const otherPersonName = userType === 'coach' 
        ? (bookingData.userName || bookingData.userEmail || 'the user')
        : (bookingData.coachName || 'the coach');
    
    feedbackOtherName.textContent = otherPersonName;
    feedbackNotes.value = '';
    
    // Reset stars
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.classList.remove('text-yellow-400');
        btn.classList.add('text-gray-300');
    });
    
    submitFeedbackBtn.disabled = true;
    ratingText.textContent = 'Click to rate';
    
    feedbackModal.classList.remove('hidden');
}

function closeFeedbackModal() {
    feedbackModal.classList.add('hidden');
    currentFeedbackBooking = null;
    selectedRating = 0;
}

async function submitFeedback() {
    if (!currentFeedbackBooking || selectedRating === 0) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    submitFeedbackBtn.disabled = true;
    submitFeedbackBtn.textContent = 'Submitting...';
    
    try {
        const feedbackData = {
            bookingId: currentFeedbackBooking.id,
            rating: selectedRating,
            notes: feedbackNotes.value.trim() || null,
            submittedAt: serverTimestamp(),
            submittedBy: user.uid,
            submitterType: userType
        };
        
        // Add feedback for coach rating
        if (userType === 'user') {
            feedbackData.coachId = currentFeedbackBooking.coachId;
            feedbackData.userId = user.uid;
            feedbackData.ratingFor = 'coach';
        } else {
            feedbackData.coachId = currentFeedbackBooking.coachId;
            feedbackData.userId = currentFeedbackBooking.userId;
            feedbackData.ratingFor = 'user';
        }
        
        // Save feedback to Firestore
        await addDoc(collection(db, 'feedback'), feedbackData);
        
        // Update booking with feedback flag
        const bookingRef = doc(db, 'bookings', currentFeedbackBooking.id);
        const updateData = userType === 'coach' 
            ? { coachFeedbackGiven: true }
            : { userFeedbackGiven: true };
        await updateDoc(bookingRef, updateData);
        
        closeFeedbackModal();
        alert('Thank you for your feedback!');
        
        // Refresh coach list if user is viewing coaches (to update availability)
        if (userType === 'user' && coachSection && !coachSection.classList.contains('hidden')) {
            await fetchCoachesForGoal(goalEl?.value || null);
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
        submitFeedbackBtn.disabled = false;
        submitFeedbackBtn.textContent = 'Submit Feedback';
    }
}

// Modal event handlers
bookingCancelBtn.addEventListener("click", () => {
    closeBookingModal();
});

bookingConfirmBtn.addEventListener("click", async () => {
    console.log('Immediate booking confirm clicked, pendingBookingCoach:', pendingBookingCoach, 'pendingBookingGoal:', pendingBookingGoal);
    
    if (!pendingBookingCoach || !pendingBookingGoal) {
        console.error('Missing coach or goal data');
        alert('Missing booking information. Please try again.');
        return;
    }
    
    bookingConfirmBtn.disabled = true;
    bookingConfirmBtn.textContent = 'Requesting...';
    try {
        console.log('Creating immediate booking with specific coach...');
        const result = await createBooking(pendingBookingCoach.id, pendingBookingGoal, new Date());
        if (result === null) {
            closeBookingModal();
            await fetchBookings();
            return;
        }
        closeBookingModal();
        alert('Booking request sent! Waiting for coach confirmation. You will be notified when the coach accepts.');
        await fetchBookings();
        setTimeout(() => {
            if (goalEl && goalEl.value) {
                fetchCoachesForGoal(goalEl.value);
            }
        }, 1000);
    } catch (e) {
        console.error('Booking error:', e);
        alert('Failed to create booking: ' + e.message);
    } finally {
        bookingConfirmBtn.disabled = false;
        bookingConfirmBtn.textContent = '✓ Confirm';
    }
});

// Schedule Ahead Modal handlers
btnScheduleAhead?.addEventListener("click", () => {
    openScheduleAheadModal();
});

scheduleCancelBtn.addEventListener("click", () => {
    closeScheduleAheadModal();
});

scheduleConfirmBtn.addEventListener("click", async () => {
    const goal = scheduleGoal.value;
    const datetimeValue = scheduleDatetime.value;
    
    if (!goal) {
        alert('Please select a fitness goal.');
        return;
    }
    
    const selectedMs = datetimeValue ? Date.parse(datetimeValue) : NaN;
    if (!selectedMs || Number.isNaN(selectedMs) || selectedMs < Date.now()) {
        scheduleDatetimeError.classList.remove("hidden");
        return;
    }
    
    scheduleDatetimeError.classList.add("hidden");
    scheduleConfirmBtn.disabled = true;
    scheduleConfirmBtn.textContent = 'Sending to all coaches...';
    
    try {
        console.log('Creating broadcast booking request (no specific coach)...');
        const result = await createBooking(null, goal, new Date(selectedMs));
        if (result === null) {
            closeScheduleAheadModal();
            await fetchBookings();
            return;
        }
        closeScheduleAheadModal();
        alert('Your request has been sent to all coaches! You will be notified when a coach accepts.');
        await fetchBookings();
    } catch (e) {
        console.error('Booking error:', e);
        alert('Failed to create booking: ' + e.message);
    } finally {
        scheduleConfirmBtn.disabled = false;
        scheduleConfirmBtn.textContent = '📢 Send Request';
    }
});

// ============================================
// AUTH HANDLERS - Account Type Selection
// ============================================

function showLoginOptions(type) {
    userType = type;
    localStorage.setItem('userType', type);
    
    // Update UI indicator
    if (type === 'user') {
        selectedTypeIcon.innerHTML = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#0ea5e9"/><circle cx="12" cy="7" r="4" stroke="#0ea5e9"/>';
        selectedTypeText.textContent = 'Signing in as User';
    } else {
        selectedTypeIcon.innerHTML = '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#a855f7"/>';
        selectedTypeText.textContent = 'Signing in as Coach';
    }
    
    // Show login options, hide type selection
    accountTypeSelection.classList.add('hidden');
    loginOptions.classList.remove('hidden');
}

function hideLoginOptions() {
    loginOptions.classList.add('hidden');
    accountTypeSelection.classList.remove('hidden');
    // Reset to Google tab
    showGooglePanel();
    // Clear forms
    clearAuthForms();
}

function clearAuthForms() {
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    if (signupName) signupName.value = '';
    if (signupEmail) signupEmail.value = '';
    if (signupPassword) signupPassword.value = '';
    if (signupPasswordConfirm) signupPasswordConfirm.value = '';
    if (loginError) loginError.classList.add('hidden');
    if (signupError) signupError.classList.add('hidden');
}

function showGooglePanel() {
    tabGoogle.classList.add('border-cyan-500', 'text-cyan-400');
    tabGoogle.classList.remove('border-transparent', 'text-gray-400');
    tabEmail.classList.remove('border-cyan-500', 'text-cyan-400');
    tabEmail.classList.add('border-transparent', 'text-gray-400');
    panelGoogle.classList.remove('hidden');
    panelEmail.classList.add('hidden');
}

function showEmailPanel() {
    tabEmail.classList.add('border-cyan-500', 'text-cyan-400');
    tabEmail.classList.remove('border-transparent', 'text-gray-400');
    tabGoogle.classList.remove('border-cyan-500', 'text-cyan-400');
    tabGoogle.classList.add('border-transparent', 'text-gray-400');
    panelEmail.classList.remove('hidden');
    panelGoogle.classList.add('hidden');
}

function showLoginForm() {
    emailLoginForm.classList.remove('hidden');
    emailSignupForm.classList.add('hidden');
    btnShowLogin.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
    btnShowLogin.classList.remove('text-gray-400', 'border-transparent');
    btnShowSignup.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
    btnShowSignup.classList.add('text-gray-400', 'border-transparent');
}

function showSignupForm() {
    emailSignupForm.classList.remove('hidden');
    emailLoginForm.classList.add('hidden');
    btnShowSignup.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
    btnShowSignup.classList.remove('text-gray-400', 'border-transparent');
    btnShowLogin.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
    btnShowLogin.classList.add('text-gray-400', 'border-transparent');
}

function showAuthError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

// Account type selection - Wait for DOM to be fully ready
window.addEventListener('DOMContentLoaded', () => {
    const btnSelectUser = document.getElementById("btn-select-user");
    const btnSelectCoach = document.getElementById("btn-select-coach");
    const btnAdminAccess = document.getElementById("btn-admin-access");
    const btnChangeType = document.getElementById("btn-change-type");
    
    console.log('Setting up event listeners...', { btnSelectUser, btnSelectCoach, btnAdminAccess });
    
    if (btnSelectUser) {
        btnSelectUser.addEventListener("click", () => {
            console.log('User button clicked');
            showLoginOptions('user');
        });
    }
    
    if (btnSelectCoach) {
        btnSelectCoach.addEventListener("click", () => {
            console.log('Coach button clicked');
            showLoginOptions('coach');
        });
    }
    
    if (btnAdminAccess) {
        btnAdminAccess.addEventListener("click", () => {
            console.log('Admin button clicked');
            alert('Admin functionality coming soon!');
        });
    }
    
    if (btnChangeType) {
        btnChangeType.addEventListener("click", hideLoginOptions);
    }
    
    // Sign-in button handlers
    if (btnSignInUser) {
        btnSignInUser.addEventListener("click", () => {
            console.log('Sign in as User button clicked');
            landingHero.classList.add("hidden");
            gateEl.classList.remove("hidden");
            gateEl.scrollIntoView({ behavior: 'smooth' });
            showLoginOptions('user');
        });
    }
    
    if (btnSignInCoach) {
        btnSignInCoach.addEventListener("click", () => {
            console.log('Sign in as Coach button clicked');
            landingHero.classList.add("hidden");
            gateEl.classList.remove("hidden");
            gateEl.scrollIntoView({ behavior: 'smooth' });
            showLoginOptions('coach');
        });
    }
});

// Auth method tabs
tabGoogle?.addEventListener("click", showGooglePanel);
tabEmail?.addEventListener("click", showEmailPanel);

// Login/Signup toggle
btnShowLogin?.addEventListener("click", showLoginForm);
btnShowSignup?.addEventListener("click", showSignupForm);

// ============================================
// ENHANCED DASHBOARD FUNCTIONALITY
// ============================================

// Enhanced User Dashboard Functions
function updateUserWelcomeData() {
    const user = auth.currentUser;
    if (!user) return;
    
    const welcomeMessage = document.getElementById('user-welcome-message');
    const lastActivity = document.getElementById('user-last-activity');
    const currentGoal = document.getElementById('user-current-goal');
    
    // Update welcome message based on time of day
    const hour = new Date().getHours();
    let timeOfDay = 'day';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Good ${timeOfDay}! Ready to crush your fitness goals?`;
    }
    
    // Update last activity (mock data for now)
    if (lastActivity) {
        lastActivity.textContent = 'Last workout: 2 days ago';
    }
    
    // Update current goal from profile data
    if (currentGoal && userProfile?.goal) {
        const goalMap = {
            'weight_loss': 'Weight Loss',
            'muscle_gain': 'Muscle Gain',
            'endurance': 'Endurance',
            'general_fitness': 'General Fitness'
        };
        currentGoal.textContent = goalMap[userProfile.goal] || 'Not Set';
    }
}

function updateUserStats() {
    // Update session count (mock data)
    const sessionsCount = document.getElementById('user-sessions-count');
    const weekSessions = document.getElementById('user-week-sessions');
    const streak = document.getElementById('user-streak');
    const progress = document.getElementById('user-progress');
    
    if (sessionsCount) sessionsCount.textContent = '12';
    if (weekSessions) weekSessions.textContent = '3';
    if (streak) streak.textContent = '5 days';
    if (progress) progress.textContent = '68%';
    
    // Update progress bar
    const progressBar = document.getElementById('goal-progress-bar');
    const progressText = document.getElementById('goal-progress-text');
    if (progressBar) {
        progressBar.style.width = '68%';
    }
    if (progressText) {
        progressText.textContent = '68% Complete';
    }
    
    // Update weekly stats
    const weekCalories = document.getElementById('week-calories');
    const weekTime = document.getElementById('week-time');
    const weekSessionsDetail = document.getElementById('week-sessions-detail');
    
    if (weekCalories) weekCalories.textContent = '1,245 kcal';
    if (weekTime) weekTime.textContent = '180 min';
    if (weekSessionsDetail) weekSessionsDetail.textContent = '3';
    
    // Update motivational quote
    updateMotivationalQuote();
}

function updateMotivationalQuote() {
    const quotes = [
        "Your only limit is your mind.",
        "Push yourself because no one else is going to do it for you.",
        "Great things never come from comfort zones.",
        "Don't stop when you're tired. Stop when you're done.",
        "Success starts with self-discipline.",
        "A year from now, you'll wish you had started today."
    ];
    
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteElement = document.getElementById('motivational-quote');
    if (quoteElement) {
        quoteElement.textContent = `"${quote}"`;
    }
}

function updateRecentAchievements() {
    const achievementsContainer = document.getElementById('recent-achievements');
    if (!achievementsContainer) return;
    
    const achievements = [
        { icon: '🏆', text: 'Completed 10 sessions', date: '2 days ago' },
        { icon: '🔥', text: '5-day streak achieved', date: '1 week ago' },
        { icon: '💪', text: 'First strength training', date: '2 weeks ago' }
    ];
    
    achievementsContainer.innerHTML = achievements.map(achievement => 
        `<div class="flex items-center gap-2 text-sm">
            <span class="text-lg">${achievement.icon}</span>
            <div>
                <p class="font-medium text-gray-900">${achievement.text}</p>
                <p class="text-xs text-gray-500">${achievement.date}</p>
            </div>
        </div>`
    ).join('');
}

// Enhanced Coach Dashboard Functions
function updateCoachWelcomeData() {
    const user = auth.currentUser;
    if (!user) return;
    
    const welcomeMessage = document.getElementById('coach-welcome-message');
    const coachStatus = document.getElementById('coach-status');
    const specialization = document.getElementById('coach-specialization');
    const rating = document.getElementById('coach-rating');
    
    // Update welcome message
    const hour = new Date().getHours();
    let timeOfDay = 'day';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Good ${timeOfDay}! Ready to inspire and transform lives?`;
    }
    
    if (coachStatus) {
        coachStatus.textContent = 'Online • Available for bookings';
    }
    
    // Update specialization from profile
    if (specialization && coachProfile?.specialty) {
        specialization.textContent = coachProfile.specialty;
    }
    
    if (rating) {
        rating.textContent = '⭐ 4.8 rating (24 reviews)';
    }
}

function updateCoachStats() {
    // Update coach quick stats
    const activeClients = document.getElementById('coach-active-clients-quick');
    const todaySessions = document.getElementById('coach-today-sessions');
    const monthlyRevenue = document.getElementById('coach-monthly-revenue');
    const completionRate = document.getElementById('coach-completion-rate');
    const nextSession = document.getElementById('coach-next-session');
    
    if (activeClients) activeClients.textContent = '18';
    if (todaySessions) todaySessions.textContent = '4';
    if (monthlyRevenue) monthlyRevenue.textContent = '$2,340';
    if (completionRate) completionRate.textContent = '94%';
    if (nextSession) nextSession.textContent = '2:30 PM';
    
    // Update schedule summary
    const scheduleSummary = document.getElementById('coach-schedule-summary');
    if (scheduleSummary) {
        scheduleSummary.textContent = '4 sessions today, 2 available slots';
    }
}

// Filter bookings by status
function filterBookingsByStatus(status) {
    const bookingList = document.getElementById('booking-list');
    if (!bookingList) return;
    
    const bookings = bookingList.querySelectorAll('.booking-item');
    bookings.forEach(booking => {
        const bookingStatus = booking.getAttribute('data-status');
        if (status === 'upcoming') {
            booking.style.display = bookingStatus === 'upcoming' ? 'block' : 'none';
        } else if (status === 'completed') {
            booking.style.display = bookingStatus === 'completed' ? 'block' : 'none';
        } else if (status === 'cancelled') {
            booking.style.display = bookingStatus === 'cancelled' ? 'block' : 'none';
        }
    });
}

// Load coach schedule by view
function loadCoachSchedule(view) {
    const calendar = document.getElementById('coach-calendar');
    if (!calendar) return;
    
    // Mock data based on view
    let scheduleData = [];
    
    switch (view) {
        case 'today':
            scheduleData = [
                { time: '9:00 AM', client: 'Sarah Johnson', type: 'Strength Training', status: 'confirmed' },
                { time: '11:00 AM', client: 'Mike Chen', type: 'Cardio Session', status: 'confirmed' },
                { time: '2:30 PM', client: 'Available Slot', type: '', status: 'available' },
                { time: '4:00 PM', client: 'Lisa Rodriguez', type: 'Yoga Flow', status: 'confirmed' }
            ];
            break;
        case 'week':
            // Week view logic here
            break;
        case 'month':
            // Month view logic here
            break;
        case 'availability':
            // Availability view logic here
            break;
    }
    
    // Render schedule
    calendar.innerHTML = scheduleData.map(item => 
        `<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg ${
            item.status === 'available' ? 'bg-green-50 border-green-200' : 'bg-white'
        }">
            <div class="flex items-center space-x-3">
                <div class="w-2 h-2 rounded-full ${
                    item.status === 'confirmed' ? 'bg-blue-500' : 
                    item.status === 'available' ? 'bg-green-500' : 'bg-gray-300'
                }"></div>
                <div>
                    <p class="font-medium text-gray-900">${item.time}</p>
                    <p class="text-sm text-gray-600">${item.client}</p>
                    ${item.type ? `<p class="text-xs text-gray-500">${item.type}</p>` : ''}
                </div>
            </div>
        </div>`
    ).join('');
}

// Placeholder functions for new buttons
function loadUserWorkouts() {
    console.log('Loading user workouts...');
    // Implementation for loading user workouts
}

function showProfileForm() {
    const profileSection = document.getElementById('profile-section');
    const mainContent = document.getElementById('main-content');
    
    if (profileSection && mainContent) {
        profileSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
}

function loadCoachClients() {
    console.log('Loading coach clients...');
    // Implementation for loading coach clients
}

function showCoachProfileForm() {
    const profileSection = document.getElementById('coach-profile-section');
    
    if (profileSection) {
        profileSection.classList.remove('hidden');
        profileSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function openAvailabilityModal() {
    console.log('Opening availability modal...');
    // Implementation for availability modal
}

// ============================================
// TAB FUNCTIONALITY
// ============================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.id.replace('tab-', 'content-');
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-50', 'text-blue-600', 'border-blue-600');
                btn.classList.add('text-gray-600');
            });
            
            // Add active class to clicked button
            button.classList.add('active', 'bg-blue-50', 'text-blue-600', 'border-blue-600');
            button.classList.remove('text-gray-600');
            
            // Hide all tab panels
            tabPanels.forEach(panel => {
                panel.classList.add('hidden');
                panel.classList.remove('active');
            });
            
            // Show target tab panel
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                targetPanel.classList.add('active');
            }
            
            // Update quick action button functionality based on tab
            updateQuickActions(targetTab);
        });
    });
    
    // Initialize with dashboard tab active
    const dashboardTab = document.getElementById('tab-dashboard');
    if (dashboardTab && !dashboardTab.classList.contains('active')) {
        dashboardTab.click();
    }
}

function updateQuickActions(activeTab) {
    // Update quick action buttons based on active tab
    const quickBookSession = document.getElementById('quick-book-session');
    const quickViewWorkouts = document.getElementById('quick-view-workouts');
    
    if (quickBookSession) {
        quickBookSession.addEventListener('click', () => {
            // Switch to coaches tab
            const coachesTab = document.getElementById('tab-coaches');
            if (coachesTab) {
                coachesTab.click();
            }
        });
    }
    
    if (quickViewWorkouts) {
        quickViewWorkouts.addEventListener('click', () => {
            // Switch to workouts tab
            const workoutsTab = document.getElementById('tab-workouts');
            if (workoutsTab) {
                workoutsTab.click();
            }
        });
    }
    
    const quickEditProfile = document.getElementById('quick-edit-profile');
    if (quickEditProfile) {
        quickEditProfile.addEventListener('click', () => {
            // Switch to profile tab
            const profileTab = document.getElementById('tab-profile');
            if (profileTab) {
                profileTab.click();
            }
        });
    }
}

// Enhanced Dashboard Event Listeners
function initializeEnhancedDashboard() {
    // Initialize tab functionality
    initializeTabs();
    
    // Quick action buttons for users
    const quickBookSession = document.getElementById('quick-book-session');
    const quickViewWorkouts = document.getElementById('quick-view-workouts');
    const quickEditProfile = document.getElementById('quick-edit-profile');
    const bookNewSession = document.getElementById('book-new-session');
    
    // Session filter buttons
    const filterUpcoming = document.getElementById('filter-upcoming');
    const filterCompleted = document.getElementById('filter-completed');
    const filterCancelled = document.getElementById('filter-cancelled');
    
    if (quickBookSession) {
        quickBookSession.addEventListener('click', () => {
            const coachList = document.getElementById('coach-list');
            if (coachList) {
                coachList.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (quickViewWorkouts) {
        quickViewWorkouts.addEventListener('click', loadUserWorkouts);
    }
    
    if (quickEditProfile) {
        quickEditProfile.addEventListener('click', showProfileForm);
    }
    
    if (bookNewSession) {
        bookNewSession.addEventListener('click', () => {
            const coachList = document.getElementById('coach-list');
            if (coachList) {
                coachList.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Session filter functionality
    if (filterUpcoming && filterCompleted && filterCancelled) {
        [filterUpcoming, filterCompleted, filterCancelled].forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                [filterUpcoming, filterCompleted, filterCancelled].forEach(b => {
                    b.classList.remove('bg-blue-100', 'text-blue-700', 'border-blue-200');
                    b.classList.add('text-gray-600', 'hover:bg-gray-100', 'border-gray-200');
                });
                
                // Add active class to clicked button
                e.target.classList.remove('text-gray-600', 'hover:bg-gray-100', 'border-gray-200');
                e.target.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-200');
                
                // Filter bookings based on selection
                filterBookingsByStatus(e.target.id.replace('filter-', ''));
            });
        });
    }
    
    // Coach dashboard event listeners
    const coachQuickSchedule = document.getElementById('coach-quick-schedule');
    const coachQuickClients = document.getElementById('coach-quick-clients');
    const coachQuickAnalytics = document.getElementById('coach-quick-analytics');
    const coachQuickProfile = document.getElementById('coach-quick-profile');
    const coachAddAvailability = document.getElementById('coach-add-availability');
    
    // Schedule tab buttons
    const scheduleToday = document.getElementById('schedule-today');
    const scheduleWeek = document.getElementById('schedule-week');
    const scheduleMonth = document.getElementById('schedule-month');
    const scheduleAvailability = document.getElementById('schedule-availability');
    
    if (coachQuickSchedule) {
        coachQuickSchedule.addEventListener('click', () => {
            const scheduleSection = document.querySelector('#coach-calendar').parentElement;
            if (scheduleSection) {
                scheduleSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (coachQuickClients) {
        coachQuickClients.addEventListener('click', loadCoachClients);
    }
    
    if (coachQuickAnalytics) {
        coachQuickAnalytics.addEventListener('click', () => {
            const analyticsSection = document.getElementById('coach-analytics-content').parentElement;
            if (analyticsSection) {
                analyticsSection.scrollIntoView({ behavior: 'smooth' });
                loadCoachAnalytics();
            }
        });
    }
    
    if (coachQuickProfile) {
        coachQuickProfile.addEventListener('click', showCoachProfileForm);
    }
    
    if (coachAddAvailability) {
        coachAddAvailability.addEventListener('click', openAvailabilityModal);
    }
    
    // Schedule tab functionality
    if (scheduleToday && scheduleWeek && scheduleMonth && scheduleAvailability) {
        [scheduleToday, scheduleWeek, scheduleMonth, scheduleAvailability].forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                [scheduleToday, scheduleWeek, scheduleMonth, scheduleAvailability].forEach(b => {
                    b.classList.remove('bg-blue-100', 'text-blue-700', 'border-blue-200');
                    b.classList.add('text-gray-600', 'hover:bg-gray-100', 'border-gray-200');
                });
                
                // Add active class to clicked button
                e.target.classList.remove('text-gray-600', 'hover:bg-gray-100', 'border-gray-200');
                e.target.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-200');
                
                // Load schedule based on selection
                const view = e.target.id.replace('schedule-', '');
                loadCoachSchedule(view);
            });
        });
    }
    
    // Initialize with default views
    if (userType === 'user') {
        updateUserWelcomeData();
        updateUserStats();
        updateRecentAchievements();
    } else if (userType === 'coach') {
        updateCoachWelcomeData();
        updateCoachStats();
        loadCoachSchedule('today');
    }
}

// Call enhanced dashboard initialization when user profile loads
if (typeof loadUserProfile === 'function') {
    const originalLoadUserProfile = loadUserProfile;
    loadUserProfile = async function(userId) {
        await originalLoadUserProfile.call(this, userId);
        initializeEnhancedDashboard();
    };
}

// Initialize enhanced dashboard on page load
setTimeout(() => {
    initializeEnhancedDashboard();
}, 1000);

btnGoogleSignin?.addEventListener("click", signInWithGoogle);

async function signInWithGoogle() {
    console.log(`🔵 Google sign-in as "${userType}" clicked`);
    console.log(`🔵 userType from localStorage:`, localStorage.getItem('userType'));
    
    if (!userType) {
        alert('Please select User or Coach first');
        return;
    }
    
    const provider = new GoogleAuthProvider();
    
    // Try popup first, fall back to redirect if blocked
    try {
        console.log('🔵 Attempting popup sign-in...');
        const result = await signInWithPopup(auth, provider);
        console.log('🔵 Popup sign-in successful:', result.user.email);
        console.log('🔵 userType at sign-in completion:', userType);
    } catch (error) {
        console.error('🔴 Popup sign-in error:', error.code, error.message);
        
        // If popup was blocked, use redirect
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.log('🔴 Popup blocked, using redirect method...');
            try {
                await signInWithRedirect(auth, provider);
            } catch (redirectError) {
                console.error('🔴 Redirect error:', redirectError);
                alert(`Sign-in failed: ${redirectError.message}`);
            }
        } else {
            alert(`Sign-in failed: ${error.message}`);
        }
    }
}

// Handle redirect result on page load
console.log('🔄 Checking for redirect result... userType from localStorage:', localStorage.getItem('userType'));
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log('✅ Signed in via redirect:', result.user.email);
            console.log('✅ userType:', userType);
            // Force UI update after redirect
            setTimeout(() => {
                console.log('🔄 Forcing UI update after redirect...');
                toggleAuthUI(result.user);
            }, 100);
        } else {
            console.log('ℹ️ No redirect result (normal page load)');
        }
    })
    .catch((error) => {
        console.error('🔴 Redirect sign-in error:', error);
        alert(`Redirect sign-in failed: ${error.message}`);
    });

// ============================================
// EMAIL/PASSWORD SIGN-IN
// ============================================

emailLoginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
        showAuthError(loginError, 'Please enter both email and password');
        return;
    }
    
    // Show loading state
    const submitBtn = emailLoginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    loginError.classList.add('hidden');
    
    try {
        console.log(`Email sign-in as ${userType} with: ${email}`);
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Email sign-in successful:', result.user);
        clearAuthForms();
    } catch (error) {
        console.error('Email sign-in error:', error.code, error.message);
        
        let errorMessage = 'Sign-in failed. Please try again.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please sign up first.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password. Please check and try again.';
                break;
        }
        showAuthError(loginError, errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ============================================
// EMAIL/PASSWORD SIGN-UP
// ============================================

emailSignupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupPasswordConfirm.value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showAuthError(signupError, 'Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthError(signupError, 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showAuthError(signupError, 'Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    const submitBtn = emailSignupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    signupError.classList.add('hidden');
    
    try {
        console.log(`Creating account as ${userType} for: ${email}`);
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update the user's display name
        await updateProfile(result.user, {
            displayName: name
        });
        
        console.log('Account created successfully:', result.user);
        clearAuthForms();
        
    } catch (error) {
        console.error('Sign-up error:', error.code, error.message);
        
        let errorMessage = 'Account creation failed. Please try again.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists. Please sign in instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use a stronger password.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled. Please contact support.';
                break;
        }
        showAuthError(signupError, errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Legacy function for backwards compatibility
async function signInUser() {
    await signInWithGoogle();
}

btnSignOut.addEventListener("click", async () => {
    await signOut(auth);
    // Clear userType on sign out
    localStorage.removeItem('userType');
    userType = null;
});

// Coach sign out button (in dropdown)
const btnCoachSignOut = document.getElementById("btn-coach-sign-out");
btnCoachSignOut?.addEventListener("click", async () => {
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
    userDropdown.classList.add("hidden"); // Close dropdown
    profileSection.classList.remove("hidden");
    mainContent.classList.add("hidden");
    cancelEditProfileBtn.classList.remove("hidden");
    // Show delete button when editing existing profile
    const deleteBtn = document.getElementById("delete-profile-btn");
    if (deleteBtn && isProfileComplete) {
        deleteBtn.classList.remove("hidden");
    }
});

// Cancel edit profile
cancelEditProfileBtn.addEventListener("click", () => {
    profileSection.classList.add("hidden");
    mainContent.classList.remove("hidden");
    cancelEditProfileBtn.classList.add("hidden");
    // Hide delete button when canceling edit
    const deleteBtn = document.getElementById("delete-profile-btn");
    if (deleteBtn) deleteBtn.classList.add("hidden");
});

// Delete profile button
const deleteProfileBtn = document.getElementById("delete-profile-btn");
deleteProfileBtn?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const confirmMessage = "⚠️ Are you sure you want to delete your profile?\n\nThis will permanently remove:\n• Your profile information\n• All your bookings\n• Your workout history\n\nThis action cannot be undone.";
    
    if (!confirm(confirmMessage)) return;
    
    // Final confirmation
    const finalConfirm = prompt("Type 'DELETE' to confirm profile deletion:");
    if (finalConfirm !== 'DELETE') {
        alert('Profile deletion cancelled.');
        return;
    }
    
    deleteProfileBtn.disabled = true;
    deleteProfileBtn.textContent = 'Deleting...';
    
    try {
        // Delete all user data
        const userRef = doc(db, "users", user.uid);
        
        // Delete user bookings
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("userId", "==", user.uid)
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const deleteBookingPromises = bookingsSnap.docs.map(doc => deleteDoc(doc.ref));
        
        // Delete AI workouts
        const workoutsQuery = query(
            collection(db, "ai_workouts"),
            where("userId", "==", user.uid)
        );
        const workoutsSnap = await getDocs(workoutsQuery);
        const deleteWorkoutPromises = workoutsSnap.docs.map(doc => deleteDoc(doc.ref));
        
        // Wait for all deletions
        await Promise.all([...deleteBookingPromises, ...deleteWorkoutPromises]);
        
        // Delete user profile
        await deleteDoc(userRef);
        
        // Reset button state before sign out
        deleteProfileBtn.disabled = false;
        deleteProfileBtn.textContent = '🗑️ Delete Profile';
        
        // Sign out and show goodbye message
        alert('😢 Sorry to see you go!\n\nYour profile and data have been permanently deleted.\n\nWe hope to see you again in the future. Stay healthy!');
        
        await signOut(auth);
        
    } catch (error) {
        console.error('Failed to delete profile:', error);
        alert('Failed to delete profile: ' + error.message);
        deleteProfileBtn.disabled = false;
        deleteProfileBtn.textContent = '🗑️ Delete Profile';
    }
});

// Coach profile - Edit button
const editCoachProfileBtn = document.getElementById("edit-coach-profile-btn");
editCoachProfileBtn?.addEventListener("click", () => {
    coachDropdown.classList.add("hidden"); // Close dropdown
    coachDashboard.classList.add("hidden");
    coachProfileSetup.classList.remove("hidden");
    // Show delete button when editing
    const deleteBtn = document.getElementById("delete-coach-profile-btn");
    if (deleteBtn) deleteBtn.classList.remove("hidden");
});

// Coach profile - Delete button
const deleteCoachProfileBtn = document.getElementById("delete-coach-profile-btn");
deleteCoachProfileBtn?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user || !currentCoachId) return;
    
    const confirmMessage = "⚠️ Are you sure you want to delete your coach profile?\n\nThis will permanently remove:\n• Your coach profile\n• All your booking history\n• Your availability and settings\n\nThis action cannot be undone.";
    
    if (!confirm(confirmMessage)) return;
    
    // Final confirmation
    const finalConfirm = prompt("Type 'DELETE' to confirm coach profile deletion:");
    if (finalConfirm !== 'DELETE') {
        alert('Coach profile deletion cancelled.');
        return;
    }
    
    deleteCoachProfileBtn.disabled = true;
    deleteCoachProfileBtn.textContent = 'Deleting...';
    
    try {
        // Delete coach bookings
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("coachId", "==", currentCoachId)
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const deleteBookingPromises = bookingsSnap.docs.map(doc => deleteDoc(doc.ref));
        
        // Delete notifications for this coach
        const notificationsQuery = query(
            collection(db, "notifications"),
            where("recipientEmail", "==", user.email)
        );
        const notificationsSnap = await getDocs(notificationsQuery);
        const deleteNotificationPromises = notificationsSnap.docs.map(doc => deleteDoc(doc.ref));
        
        // Wait for all deletions
        await Promise.all([...deleteBookingPromises, ...deleteNotificationPromises]);
        
        // Delete coach profile
        const coachRef = doc(db, "coaches", currentCoachId);
        await deleteDoc(coachRef);
        
        // Reset button state before sign out
        deleteCoachProfileBtn.disabled = false;
        deleteCoachProfileBtn.textContent = '🗑️ Delete Coach Profile';
        
        // Sign out and show goodbye message
        alert('😢 Sorry to see you go!\n\nYour coach profile and data have been permanently deleted.\n\nWe hope to see you again in the future. Keep inspiring others to stay fit!');
        
        currentCoachId = null;
        await signOut(auth);
        
    } catch (error) {
        console.error('Failed to delete coach profile:', error);
        alert('Failed to delete coach profile: ' + error.message);
        deleteCoachProfileBtn.disabled = false;
        deleteCoachProfileBtn.textContent = '🗑️ Delete Coach Profile';
    }
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
            await Promise.all([
                fetchCoachBookings(),
                loadCoachAnalytics()
            ]);
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

// Analytics refresh button (User)
refreshAnalytics?.addEventListener("click", async () => {
    await loadAnalytics();
});

// Coach Analytics refresh button
refreshCoachAnalytics?.addEventListener("click", async () => {
    await loadCoachAnalytics();
});

// Save session notes button
saveSessionNotesBtn?.addEventListener("click", async () => {
    if (currentCallBookingId && currentSessionUserId && workoutChecklist.length > 0) {
        await saveSessionNotes(currentCallBookingId, currentSessionUserId, workoutChecklist);
    } else {
        alert('No active session to save notes for.');
    }
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
        
        // Get recent workouts to avoid repetition
        let recentWorkouts = [];
        try {
            // Use the same collection as the display function
            const recentWorkoutsQuery = query(
                collection(db, 'workoutSessions'),
                where('userId', '==', user.uid),
                orderBy('completedAt', 'desc'),
                limit(3)
            );
            const recentWorkoutsSnap = await getDocs(recentWorkoutsQuery);
            recentWorkouts = recentWorkoutsSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    exercises: data.exercises || [],
                    coachNotes: data.coachNotes || '',
                    completedAt: data.completedAt,
                    goal: data.goal || 'general fitness'
                };
            });
            console.log('📊 Retrieved recent workouts for AI generation:', recentWorkouts.length);
            if (recentWorkouts.length > 0) {
                console.log('📝 Sample recent workout:', JSON.stringify(recentWorkouts[0], null, 2));
            }
        } catch (error) {
            console.warn('Could not fetch recent workouts:', error.message);
            // Fallback to ai_workouts if workoutSessions fails
            try {
                const fallbackQuery = query(
                    collection(db, 'ai_workouts'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(3)
                );
                const fallbackSnap = await getDocs(fallbackQuery);
                recentWorkouts = fallbackSnap.docs.map(doc => doc.data().workout);
            } catch (fallbackError) {
                console.warn('Fallback workout fetch also failed:', fallbackError.message);
            }
        }
        
        // Use saved AI analysis if available for personalized workout
        let workout;
        console.log('🤖 Determining workout generation method...');
        if (savedAIAnalysis && (Date.now() - savedAIAnalysis.timestamp < 30 * 60 * 1000)) { // 30 minutes
            console.log('📋 Using saved AI analysis for workout generation');
            console.log('🔍 AI Analysis data:', {
                hasAnalysis: !!savedAIAnalysis.analysis,
                hasUserProfile: !!savedAIAnalysis.userProfile,
                sessionGoal: savedAIAnalysis.sessionGoal
            });
            workout = await aiService.generateWorkoutFromAnalysis(userProfile, savedAIAnalysis);
        } else {
            console.log('🆕 Generating new workout with recent workout context. Recent workouts:', recentWorkouts.length);
            console.log('🔍 AI Service check:', {
                hasAIService: !!aiService,
                methodExists: typeof aiService.generatePersonalizedWorkoutWithHistory === 'function',
                userProfile: userProfile.goal || 'no goal'
            });
            workout = await aiService.generatePersonalizedWorkoutWithHistory(userProfile, recentWorkouts);
            console.log('✅ AI workout generation completed:', {
                workoutReceived: !!workout,
                workoutType: Array.isArray(workout) ? 'array' : typeof workout,
                workoutLength: workout?.length || 0,
                firstExercise: workout?.[0] || 'none'
            });
        }
        
        renderAIWorkout(workout);
        
        // Save workout to history for immediate future variation
        try {
            const exercisesData = Array.isArray(workout) ? workout : (workout?.exercises || []);
            await addDoc(collection(db, 'ai_workouts'), {
                userId: user.uid,
                workout: {
                    exercises: exercisesData,
                    generatedAt: new Date(),
                    userProfile: {
                        goal: userProfile.goal,
                        heightCm: userProfile.heightCm,
                        weightKg: userProfile.weightKg
                    }
                },
                createdAt: new Date(),
                timestamp: Date.now()
            });
            console.log('✅ Workout saved to ai_workouts for immediate variation tracking');
        } catch (error) {
            console.warn('Could not save workout to history:', error.message);
        }
        
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
    
    // Handle both array format and object format
    const exercises = Array.isArray(workout) ? workout : (workout?.exercises || []);
    if (exercises.length === 0) {
        console.error('No exercises found in workout:', workout);
        alert('Workout generation failed - no exercises received. Please try again.');
        aiWorkoutEmpty.classList.remove('hidden');
        aiWorkoutContainer.classList.add('hidden');
        return;
    }
    
    const exercisesList = exercises.map((ex, index) => {
        // Handle both string format and object format
        if (typeof ex === 'string') {
            return `
                <div class="border-l-4 border-indigo-500 pl-3 py-2">
                    <label class="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
                        <input type="checkbox" class="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" id="exercise-${index}">
                        <div class="flex-1">
                            <p class="text-sm text-gray-900 dark:text-gray-100">${ex}</p>
                        </div>
                    </label>
                </div>
            `;
        }
        // Object format
        return `
            <div class="border-l-4 border-indigo-500 pl-3 py-2">
                <label class="flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
                    <input type="checkbox" class="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" id="exercise-${index}">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 dark:text-gray-100">${ex.name || ex}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            ${ex.checklistItem || `${ex.sets ? `${ex.sets} sets` : ''} ${ex.reps ? `× ${ex.reps} reps` : ''} ${ex.duration ? `• ${ex.duration}` : ''}`}
                        </p>
                        ${ex.notes ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 ${ex.notes}</p>` : ''}
                    </div>
                </label>
            </div>
        `;
    }).join('');
    
    // Only show warmup/cooldown if they exist
    const hasWarmup = workout.warmup && (workout.warmup.checklistItems || workout.warmup.description || typeof workout.warmup === 'string');
    const hasCooldown = workout.cooldown && (workout.cooldown.checklistItems || workout.cooldown.description || typeof workout.cooldown === 'string');
    
    const warmupItems = hasWarmup ? (
        workout.warmup?.checklistItems?.map((item, index) => 
            `<label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded" id="warmup-${index}">
                <span class="text-sm">${item}</span>
            </label>`
        ).join('') || `<p class="text-sm">${workout.warmup?.description || workout.warmup}</p>`
    ) : '';
    
    const cooldownItems = hasCooldown ? (
        workout.cooldown?.checklistItems?.map((item, index) => 
            `<label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded" id="cooldown-${index}">
                <span class="text-sm">${item}</span>
            </label>`
        ).join('') || `<p class="text-sm">${workout.cooldown?.description || workout.cooldown}</p>`
    ) : '';
    
    const equipmentBadges = workout.equipmentNeeded?.map(eq => 
        `<span class="inline-block bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">${eq}</span>`
    ).join(' ') || 'No equipment needed';
    
    aiWorkoutContent.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start justify-between">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">${workout.title || 'Personalized Workout'}</h3>
                    <div class="flex gap-2 mt-2 text-sm">
                        ${workout.intensity ? `<span class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full font-medium">
                            ${workout.intensity} intensity
                        </span>` : ''}
                        ${workout.duration ? `<span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full font-medium">
                            ${workout.duration} mins
                        </span>` : ''}
                        ${workout.estimatedCalories ? `<span class="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-3 py-1 rounded-full font-medium">
                            ~${workout.estimatedCalories} cal
                        </span>` : ''}
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
            
            ${hasWarmup ? `
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    🔥 Warm-up (5 mins)
                    <span class="text-xs font-normal text-gray-500">Check off as you complete</span>
                </h4>
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded space-y-2">
                    ${warmupItems}
                </div>
            </div>
            ` : ''}
            
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    💪 Main Exercises
                    <span class="text-xs font-normal text-gray-500">Check off as you complete</span>
                </h4>
                <div class="space-y-3">
                    ${exercisesList}
                </div>
            </div>
            
            ${hasCooldown ? `
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    🧘 Cool-down (5 mins)
                    <span class="text-xs font-normal text-gray-500">Check off as you complete</span>
                </h4>
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded space-y-2">
                    ${cooldownItems}
                </div>
            </div>
            ` : ''}
            
            <div>
                <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">🎯 Equipment Needed</h4>
                <div class="flex flex-wrap gap-2">
                    ${equipmentBadges}
                </div>
            </div>
        </div>
    `;
}

// Dropdown menu toggles
userDisplayEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("hidden");
    coachDropdown?.classList.add("hidden"); // Close coach dropdown if open
});

coachDisplayEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    coachDropdown.classList.toggle("hidden");
    userDropdown?.classList.add("hidden"); // Close user dropdown if open
});

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
    userDropdown?.classList.add("hidden");
    coachDropdown?.classList.add("hidden");
});

// Prevent dropdown from closing when clicking inside
userDropdown?.addEventListener("click", (e) => {
    e.stopPropagation();
});

coachDropdown?.addEventListener("click", (e) => {
    e.stopPropagation();
});

// Presence tracking functions
async function updatePresence(isOnline = true) {
    if (!auth.currentUser || userType !== 'coach') return;
    
    try {
        const coachRef = doc(db, "coaches", currentCoachId || auth.currentUser.uid);
        await updateDoc(coachRef, {
            isOnline: isOnline,
            lastSeen: serverTimestamp()
        });
        console.log('📡 Updated coach presence:', isOnline ? 'ONLINE' : 'OFFLINE');
    } catch (error) {
        console.error('❌ Error updating presence:', error);
    }
}

function startPresenceTracking() {
    if (userType !== 'coach' || !auth.currentUser) return;
    
    // Clear any existing heartbeat
    if (presenceHeartbeat) {
        clearInterval(presenceHeartbeat);
    }
    
    // Set initial online status
    updatePresence(true);
    
    // Send heartbeat every 30 seconds to keep coach online
    presenceHeartbeat = setInterval(() => {
        updatePresence(true);
    }, ONLINE_PRESENCE_INTERVAL);
    
    // Set offline only on page close/browser close
    window.addEventListener('beforeunload', () => {
        updatePresence(false);
    });
    
    // Note: Removed visibility change handler - coach stays online when logged in,
    // even if they switch tabs or minimize the window
    
    console.log('🟢 Coach presence tracking started (stays online while logged in)');
}

function stopPresenceTracking() {
    if (presenceHeartbeat) {
        clearInterval(presenceHeartbeat);
        presenceHeartbeat = null;
    }
    
    if (userType === 'coach' && auth.currentUser) {
        updatePresence(false);
    }
    
    console.log('🔴 Coach presence tracking stopped');
}

function startCoachPresenceListener() {
    if (userType !== 'user') return; // Only for users viewing coaches
    
    // Clean up existing listener
    if (coachPresenceListener) {
        coachPresenceListener();
    }
    
    const q = query(collection(db, "coaches"));
    coachPresenceListener = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
                const coachData = { id: change.doc.id, ...change.doc.data() };
                updateCoachPresenceUI(coachData);
            }
        });
    });
    
    console.log('👁️ Coach presence listener started');
}

function updateCoachPresenceUI(coachData) {
    const coachCard = document.querySelector(`[data-coach-id="${coachData.id}"]`);
    if (!coachCard) return;
    
    const presenceIndicator = coachCard.querySelector('.presence-indicator');
    if (!presenceIndicator) return;
    
    const isOnline = isCoachOnline(coachData);
    
    if (isOnline) {
        presenceIndicator.classList.remove('bg-gray-400');
        presenceIndicator.classList.add('bg-green-500');
        presenceIndicator.title = 'Online now';
    } else {
        presenceIndicator.classList.remove('bg-green-500');
        presenceIndicator.classList.add('bg-gray-400');
        
        const lastSeen = getLastSeenText(coachData.lastSeen);
        presenceIndicator.title = lastSeen;
    }
}

function isCoachOnline(coachData) {
    // If presence fields don't exist, default to true (assume online) to allow bookings
    // This handles the case where coaches haven't set up presence tracking yet or just logged in
    if (!coachData.hasOwnProperty('isOnline') || !coachData.hasOwnProperty('lastSeen')) {
        return true; // Default to online to allow bookings
    }
    
    if (!coachData.lastSeen) return false;
    
    const now = new Date();
    const lastSeen = coachData.lastSeen.toDate ? coachData.lastSeen.toDate() : new Date(coachData.lastSeen);
    const timeDiff = now - lastSeen;
    
    // Check if last seen is recent (within OFFLINE_TIMEOUT)
    const isRecentlyActive = timeDiff < OFFLINE_TIMEOUT;
    
    // If coach was recently active (within timeout), consider them online even if isOnline flag is false
    // This handles the case where presence hasn't updated yet after login
    if (isRecentlyActive) {
        return true;
    }
    
    // Otherwise, rely on the isOnline flag
    return coachData.isOnline === true;
}

function getLastSeenText(lastSeen) {
    if (!lastSeen) return 'Status: N/A';
    
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Last seen: Just now';
    if (diffMins < 60) return `Last seen: ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen: ${diffHours}h ago`;
    if (diffDays < 7) return `Last seen: ${diffDays}d ago`;
    return 'Last seen: Over a week ago';
}

// Notification sounds for booking events
const notificationSounds = {
    newBooking: () => {
        // Soft, professional notification tone for new booking
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Soft sine wave - gentle and professional
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5 - pleasant tone
        oscillator.frequency.exponentialRampToValueAtTime(698.46, audioContext.currentTime + 0.15); // F5
        
        // Very gentle volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05); // Softer volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        
        console.log('🔔 New booking notification sound played');
    },
    
    bookingConfirmed: () => {
        // Elegant success chime for booking confirmation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Two-note ascending chime
        [523.25, 659.25].forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + (i * 0.12));
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + (i * 0.12));
            gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + (i * 0.12) + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (i * 0.12) + 0.3);
            
            oscillator.start(audioContext.currentTime + (i * 0.12));
            oscillator.stop(audioContext.currentTime + (i * 0.12) + 0.3);
        });
        
        console.log('✅ Booking confirmed notification sound played');
    },
    
    sessionReminder: () => {
        // Professional two-tone reminder (like smartphone notifications)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Two gentle tones
        [783.99, 659.25].forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + (i * 0.25));
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + (i * 0.25));
            gainNode.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + (i * 0.25) + 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (i * 0.25) + 0.25);
            
            oscillator.start(audioContext.currentTime + (i * 0.25));
            oscillator.stop(audioContext.currentTime + (i * 0.25) + 0.25);
        });
        
        console.log('⏰ Session reminder sound played (2 tones)');
    }
};

// Show browser notification with sound
function showNotificationWithSound(title, message, soundType) {
    // Play sound
    try {
        if (notificationSounds[soundType]) {
            notificationSounds[soundType]();
        }
    } catch (error) {
        console.warn('Could not play notification sound:', error);
    }
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'fitness-booking'
        });
    }
    
    console.log('📢 Notification shown:', title, '-', message);
}

// Pre-Session Review Functions
async function showPreSessionReview(booking) {
    currentReviewBooking = booking;
    
    // Update UI with booking info
    document.getElementById('review-user-name').textContent = booking.userName || booking.userEmail;
    document.getElementById('review-user-goal').textContent = booking.goal || 'No specific goal';
    
    // Show the modal
    preSessionModal.classList.remove('hidden');
    
    // Load user profile data
    await loadUserDataForReview(booking);
    
    // Generate AI analysis
    await generateAISessionAnalysis(booking);
    
    // Load session history
    await loadSessionHistoryForReview(booking);
}

async function loadUserDataForReview(booking) {
    try {
        // Get user profile data
        const userProfileRef = doc(db, 'users', booking.userId);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists()) {
            const userData = userProfileSnap.data();
            document.getElementById('review-user-height').textContent = userData.height ? `${userData.height} cm` : 'Not specified';
            document.getElementById('review-user-weight').textContent = userData.weight ? `${userData.weight} kg` : 'Not specified';
            document.getElementById('review-user-requirements').textContent = userData.requirements || 'None specified';
        }
    } catch (error) {
        console.error('Error loading user data for review:', error);
    }
}

async function generateAISessionAnalysis(booking) {
    try {
        aiAnalysisLoading.classList.remove('hidden');
        aiAnalysisContent.classList.add('hidden');
        
        // Get user's past booking sessions for context (same as session history)
        let sessionHistory = [];
        try {
            const pastBookingsQuery = query(
                collection(db, 'bookings'),
                where('userId', '==', booking.userId),
                where('coachId', '==', currentCoachId),
                where('status', '==', 'completed'),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const pastBookings = await getDocs(pastBookingsQuery);
            sessionHistory = pastBookings.docs.map(doc => doc.data());
            console.log('✅ Retrieved session history:', sessionHistory.length, 'sessions');
        } catch (indexError) {
            console.warn('⚠️ Firestore index missing for booking history query. Trying alternative approach...');
            // Try without orderBy to avoid index requirement
            try {
                const simpleQuery = query(
                    collection(db, 'bookings'),
                    where('userId', '==', booking.userId),
                    where('coachId', '==', currentCoachId),
                    where('status', '==', 'completed'),
                    limit(5)
                );
                const pastBookings = await getDocs(simpleQuery);
                sessionHistory = pastBookings.docs.map(doc => doc.data());
                console.log('✅ Retrieved session history without ordering:', sessionHistory.length, 'sessions');
            } catch (fallbackError) {
                console.warn('⚠️ Could not retrieve session history:', fallbackError.message);
                sessionHistory = [];
            }
        }
        
        // Get user profile for context
        const userProfileRef = doc(db, 'users', booking.userId);
        const userProfileSnap = await getDoc(userProfileRef);
        const userProfile = userProfileSnap.exists() ? userProfileSnap.data() : {};
        
        // Create prompt for AI analysis with default values
        const analysisPrompt = `As a fitness coach, provide a brief pre-session analysis for this client (MAX 400 words):

CLIENT:
- Goal: ${booking.goal}
- Height: ${userProfile.heightCm || userProfile.height || 170} cm (${userProfile.heightCm || userProfile.height ? 'actual' : 'default average'})
- Weight: ${userProfile.weightKg || userProfile.weight || 70} kg (${userProfile.weightKg || userProfile.weight ? 'actual' : 'default average'})
- Age: ${userProfile.age || 30} (${userProfile.age ? 'actual' : 'default average'})
- Requirements: ${userProfile.requirements || 'None'}
- Past Sessions with You: ${sessionHistory.length} completed sessions
${sessionHistory.length > 0 ? 
    '\nPAST SESSIONS:\n' + sessionHistory.map((s, i) => {
        const date = new Date(s.scheduledAt?.toMillis?.() || s.createdAt?.toMillis?.()).toLocaleDateString();
        return `${i+1}. ${s.goal} - ${date}${s.coachNotes ? '\n   Your Notes: ' + s.coachNotes : ''}`;
    }).join('\n') :
    '\nNo previous sessions with this client yet.'
}

Provide CONCISE insights using simple HTML tags:

<div class="space-y-3">
<div><strong>🎯 Session Focus</strong><br>
[Key areas to focus on today based on their goal and history]</div>

<div><strong>📊 Past Progress Review</strong><br>
[Analysis of their session history and your previous coach notes]</div>

<div><strong>⚠️ Key Considerations</strong><br>
[Important points based on their profile and past sessions]</div>

<div><strong>🔥 Session Strategy</strong><br>
[How to approach today's session]</div>
</div>

Return ONLY the content between the <div class="space-y-3"> tags, without any code block markers or extra formatting.`;
        
        // Get AI analysis
        console.log('🤖 Starting AI analysis with prompt:', analysisPrompt.substring(0, 100) + '...');
        console.log('📊 User profile:', userProfile);
        console.log('📚 Session history:', sessionHistory);
        
        const analysis = await aiService.generateCoachingInsights({
            prompt: analysisPrompt,
            userProfile: userProfile,
            workoutHistory: sessionHistory, // Using session history instead of workout history
            sessionGoal: booking.goal
        });
        
        // Save AI analysis for workout generation with enhanced user profile
        savedAIAnalysis = {
            analysis: analysis,
            userProfile: {
                ...userProfile,
                heightCm: userProfile.heightCm || userProfile.height || 170,
                weightKg: userProfile.weightKg || userProfile.weight || 70,
                age: userProfile.age || 30
            },
            sessionGoal: booking.goal,
            sessionHistory: sessionHistory,
            timestamp: Date.now()
        };
        
        console.log('✅ AI analysis received and saved:', analysis.substring(0, 100) + '...');
        
        // Display the analysis
        document.getElementById('ai-session-summary').innerHTML = `
            <div class="space-y-4">
                <div class="bg-white/70 p-4 rounded-lg border border-emerald-300">
                    <h4 class="font-semibold text-emerald-700 mb-2">🎯 AI Coaching Insights</h4>
                    <div class="text-sm text-gray-700 whitespace-pre-wrap">${analysis}</div>
                </div>
            </div>
        `;
        
        aiAnalysisLoading.classList.add('hidden');
        aiAnalysisContent.classList.remove('hidden');
        
    } catch (error) {
        console.error('❌ Error generating AI analysis:', error);
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        document.getElementById('ai-session-summary').innerHTML = `
            <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <p class="text-red-700">Failed to generate AI analysis: ${error.message}</p>
                <p class="text-red-600 text-sm mt-2">Please proceed with manual review. Check console for details.</p>
            </div>
        `;
        aiAnalysisLoading.classList.add('hidden');
        aiAnalysisContent.classList.remove('hidden');
    }
}

async function loadSessionHistoryForReview(booking) {
    try {
        // Get past completed bookings with this user
        const pastBookingsQuery = query(
            collection(db, 'bookings'),
            where('userId', '==', booking.userId),
            where('coachId', '==', currentCoachId),
            where('status', '==', 'completed'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const pastBookings = await getDocs(pastBookingsQuery);
        
        // Update count display
        const countElement = document.getElementById('past-sessions-count');
        if (countElement) {
            countElement.textContent = `${pastBookings.docs.length} session${pastBookings.docs.length !== 1 ? 's' : ''}`;
        }
        
        if (pastBookings.empty) {
            document.getElementById('session-history-content').innerHTML = `
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p class="text-blue-700">🆕 This is your first session with this client!</p>
                </div>
            `;
            return;
        }
        
        const historyHtml = pastBookings.docs.map(doc => {
            const session = doc.data();
            const date = new Date(session.scheduledAt?.toMillis?.() || session.createdAt?.toMillis?.()).toLocaleDateString();
            return `
                <div class="bg-gray-50 p-4 rounded-lg border mb-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-medium text-gray-800">${session.goal}</p>
                            <p class="text-sm text-gray-600">${date}</p>
                            ${session.coachNotes ? `<div class="mt-2 p-2 bg-blue-50 rounded text-sm"><strong>Your Notes:</strong> ${session.coachNotes}</div>` : ''}
                        </div>
                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Completed</span>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('session-history-content').innerHTML = historyHtml;
        
    } catch (error) {
        console.error('Error loading session history:', error);
        document.getElementById('session-history-content').innerHTML = `
            <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <p class="text-red-700">Failed to load session history.</p>
            </div>
        `;
        
        const countElement = document.getElementById('past-sessions-count');
        if (countElement) {
            countElement.textContent = 'Error loading';
        }
    }
}

async function completeReviewAndJoinSession() {
    if (!currentReviewBooking) return;
    
    try {
        // Hide review modal
        preSessionModal.classList.add('hidden');
        
        // Save notes if any
        const notes = coachSessionNotes.value.trim();
        if (notes) {
            await updateDoc(doc(db, 'bookings', currentReviewBooking.id), {
                coachNotes: notes,
                notesUpdatedAt: serverTimestamp()
            });
        }
        
        // Update booking status to active
        await updateDoc(doc(db, 'bookings', currentReviewBooking.id), {
            status: 'active',
            joinedAt: serverTimestamp(),
            reviewCompletedAt: serverTimestamp()
        });
        
        // Start the video call
        const roomName = currentReviewBooking.meetingId || currentReviewBooking.meetingLink.split('/').pop().split('#')[0];
        const title = `Session with ${currentReviewBooking.userName || 'User'}`;
        startEmbeddedVideoCall(currentReviewBooking.id, roomName, title, true);
        
        currentReviewBooking = null;
        
    } catch (error) {
        console.error('Error completing review:', error);
        alert('Failed to start session: ' + error.message);
    }
}

function closePreSessionReview() {
    if (currentReviewBooking) {
        // Reset booking status back to confirmed
        updateDoc(doc(db, 'bookings', currentReviewBooking.id), {
            status: 'confirmed'
        }).catch(console.error);
    }
    
    preSessionModal.classList.add('hidden');
    currentReviewBooking = null;
    coachSessionNotes.value = '';
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Auth state changes
onAuthStateChanged(auth, async (user) => {
    console.log('🔑 Auth state changed. User:', user?.email || 'null', 'userType:', userType);
    
    toggleAuthUI(user);
    if (user) {
        currentUserId = user.uid; // Set global user ID
        console.log('🔑 User authenticated:', user.email, 'UID:', currentUserId, 'as:', userType);
        
        // Request notification permission for booking alerts
        requestNotificationPermission();
        
        if (userType === 'coach') {
            console.log('🏋️ Loading coach dashboard...');
            const coachId = await loadCoachProfile(user.email);
            if (coachId) {
                // Coach profile exists, load bookings and analytics
                currentCoachId = coachId;
                startPresenceTracking(); // Start tracking coach presence
                startSessionReminderSystem(); // Start checking for upcoming sessions
                await Promise.all([
                    fetchCoachBookings(),
                    loadCoachAnalytics()
                ]);
            }
            // Otherwise show profile setup form
        } else {
            await loadUserProfile(user.uid);
            startCoachPresenceListener(); // Start listening to coach presence for users
            setupCoachAvailabilityListener(); // Start listening to bookings for coach availability
            startUserSessionReminderSystem(); // Start checking for upcoming user sessions
            // Load ALL coaches for users to see
            await Promise.all([
                fetchWorkoutsForGoal(goalEl.value),
                fetchCoachesForGoal(null), // null = show all coaches
                fetchBookings(),
                loadAnalytics() // Load user analytics
            ]);
        }
    } else {
        renderWorkouts([]);
        await renderCoaches([], null);
        renderBookings([]);
        renderCoachCalendar([]);
        showAnalyticsEmpty(); // Clear analytics on logout
        currentUserId = null;
        currentCoachId = null;
        
        // Stop presence tracking
        stopPresenceTracking();
        stopSessionReminderSystem(); // Stop session reminders
        
        // Clean up listeners on sign out
        if (userBookingsListener) {
            userBookingsListener();
            userBookingsListener = null;
        }
        if (bookingsListener) {
            bookingsListener();
            bookingsListener = null;
        }
        if (notificationsListener) {
            notificationsListener();
            notificationsListener = null;
        }
        if (coachPresenceListener) {
            coachPresenceListener();
            coachPresenceListener = null;
        }
        if (allBookingsListener) {
            allBookingsListener();
            allBookingsListener = null;
        }
        if (broadcastBookingsListener) {
            broadcastBookingsListener();
            broadcastBookingsListener = null;
        }
    }
});
// ============================================
// TAB NAVIGATION FOR USER PAGE
// ============================================

// Tab switching functionality
const tabButtons = {
    'tab-workouts': 'content-workouts',
    'tab-coaches': 'content-coaches',
    'tab-bookings': 'content-bookings',
    'tab-analytics': 'content-analytics'
};

// Add click handlers to tab buttons
Object.keys(tabButtons).forEach(tabId => {
    const button = document.getElementById(tabId);
    if (button) {
        button.addEventListener('click', () => switchTab(tabId));
    }
});

function switchTab(activeTabId) {
    // Update button styles
    Object.keys(tabButtons).forEach(tabId => {
        const button = document.getElementById(tabId);
        const content = document.getElementById(tabButtons[tabId]);
        
        if (tabId === activeTabId) {
            // Active tab style
            button.className = 'tab-btn flex-1 min-w-[120px] px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md';
            content.classList.remove('hidden');
        } else {
            // Inactive tab style
            button.className = 'tab-btn flex-1 min-w-[120px] px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100';
            content.classList.add('hidden');
        }
    });
}

// Initialize with Coaches tab active
switchTab('tab-coaches');

// ============================================
// TAB NAVIGATION FOR COACH PAGE
// ============================================

// Coach tab switching functionality
const coachTabButtons = {
    'coach-tab-schedule': 'coach-content-schedule',
    'coach-tab-analytics': 'coach-content-analytics'
};

// Add click handlers to coach tab buttons
Object.keys(coachTabButtons).forEach(tabId => {
    const button = document.getElementById(tabId);
    if (button) {
        button.addEventListener('click', () => switchCoachTab(tabId));
    }
});

function switchCoachTab(activeTabId) {
    // Update button styles
    Object.keys(coachTabButtons).forEach(tabId => {
        const button = document.getElementById(tabId);
        const content = document.getElementById(coachTabButtons[tabId]);
        
        if (tabId === activeTabId) {
            // Active tab style
            button.className = 'tab-button flex-1 min-w-[120px] rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md';
            content.classList.remove('hidden');
        } else {
            // Inactive tab style
            button.className = 'tab-button flex-1 min-w-[120px] rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 text-gray-700 hover:bg-gray-100';
            content.classList.add('hidden');
        }
    });
}