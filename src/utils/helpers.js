/**
 * Pure utility functions extracted from FindMyFitCoach.
 * These have no DOM or Firebase dependencies, so they can be unit-tested with Jest.
 *
 * The original logic lives in src/ai/ai-service.js and src/js/main.js.
 * This module re-exports the same logic in CommonJS format for Jest compatibility.
 */

// ── BMI & Fitness Level (from AIService._calculateFitnessLevel) ─────────

function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm === 0) return 0;
    return weightKg / Math.pow(heightCm / 100, 2);
}

function calculateFitnessLevel(userProfile) {
    const bmi = calculateBMI(userProfile.weightKg, userProfile.heightCm);
    if (bmi === 0) return 'unknown';
    if (bmi < 18.5) return 'beginner (underweight)';
    if (bmi < 25) return 'intermediate (healthy weight)';
    if (bmi < 30) return 'beginner (overweight)';
    return 'beginner (obese - gentle approach needed)';
}

// ── JSON Response Parsers (from AIService._parse* methods) ──────────────

function parseWorkoutResponse(response) {
    const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const workout = JSON.parse(cleanJson);
    if (!workout.title || !workout.exercises) {
        throw new Error('Invalid workout structure');
    }
    return workout;
}

function parseCoachRecommendations(response) {
    const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanJson);
    return data.recommendations || [];
}

// ── Goal Progress (from main.js calculateGoalProgress) ──────────────────

function calculateGoalProgress(userProfile, bookings, sessions, aiWorkouts) {
    if (!userProfile || !userProfile.goal) {
        return { goal: 'Not set', progress: 0, message: 'Set your fitness goal in your profile', color: 'gray' };
    }

    const goal = userProfile.goal;
    const totalActivities = bookings.length + aiWorkouts.length;

    const milestones = {
        weight_loss:     { target: 20, name: 'Weight Loss',     color: 'pink',   icon: '🔥' },
        muscle_gain:     { target: 24, name: 'Muscle Gain',     color: 'blue',   icon: '💪' },
        endurance:       { target: 30, name: 'Endurance',       color: 'green',  icon: '🏃' },
        general_fitness: { target: 16, name: 'General Fitness', color: 'purple', icon: '⭐' }
    };

    const milestone = milestones[goal] || milestones.general_fitness;
    const progress = Math.min(Math.round((totalActivities / milestone.target) * 100), 100);

    let message;
    if (progress < 25)       message = 'Just getting started! Keep it up!';
    else if (progress < 50)  message = 'Making progress! Stay consistent!';
    else if (progress < 75)  message = "Doing great! You're past halfway!";
    else if (progress < 100) message = 'Almost there! Push through!';
    else                     message = '🎉 Goal achieved! Time for a new challenge!';

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

// ── Streak Calculation (from main.js calculateStreak) ───────────────────

function calculateStreak(activityDateStrings) {
    const activityDates = new Set(activityDateStrings);
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);

        if (activityDates.has(checkDate.toDateString())) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    return streak;
}

// ── Completion Rate (from main.js calculateAnalytics) ───────────────────

function calculateCompletionRate(bookings) {
    if (!bookings || bookings.length === 0) return 0;
    const completed = bookings.filter(b => b.status === 'completed').length;
    return Math.round((completed / bookings.length) * 100);
}

// ── Last Seen Text (from main.js getLastSeenText) ───────────────────────

function getLastSeenText(lastSeenDate) {
    if (!lastSeenDate) return 'Status: N/A';

    const now = new Date();
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1)   return 'Last seen: Just now';
    if (diffMins < 60)  return `Last seen: ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen: ${diffHours}h ago`;
    if (diffDays < 7)   return `Last seen: ${diffDays}d ago`;
    return 'Last seen: Over a week ago';
}

// ── Coach Online Status (from main.js isCoachOnline) ────────────────────

const OFFLINE_TIMEOUT = 90000; // 90 seconds

function isCoachOnline(coachData) {
    if (!coachData.hasOwnProperty('isOnline') || !coachData.hasOwnProperty('lastSeen')) {
        return true;
    }
    if (!coachData.lastSeen) return false;

    const now = new Date();
    const lastSeen = coachData.lastSeen instanceof Date ? coachData.lastSeen : new Date(coachData.lastSeen);
    const timeDiff = now - lastSeen;

    if (timeDiff < OFFLINE_TIMEOUT) return true;
    return coachData.isOnline === true;
}

// ── Monthly Change Percentage (from main.js calculateAnalytics) ─────────

function calculateMonthlyChange(thisMonth, lastMonth) {
    if (lastMonth > 0) {
        return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    }
    return thisMonth > 0 ? 100 : 0;
}

// ── Exports ─────────────────────────────────────────────────────────────

module.exports = {
    calculateBMI,
    calculateFitnessLevel,
    parseWorkoutResponse,
    parseCoachRecommendations,
    calculateGoalProgress,
    calculateStreak,
    calculateCompletionRate,
    getLastSeenText,
    isCoachOnline,
    calculateMonthlyChange,
    OFFLINE_TIMEOUT
};
