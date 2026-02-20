/**
 * ============================================================
 *  FindMyFitCoach — Jest Unit Tests
 * ============================================================
 *
 *  HOW JEST WORKS (quick primer)
 *  ─────────────────────────────
 *  1. Jest automatically finds files that end with .test.js (or .spec.js).
 *
 *  2. Inside each test file you organise tests with:
 *       describe('Group name', () => { ... })   ← groups related tests
 *       test('what it should do', () => { ... }) ← one individual test
 *
 *  3. Inside a test you call the function, then use "expect" to check the result:
 *       expect(result).toBe(expected)            ← strict equality (===)
 *       expect(result).toEqual(expected)          ← deep equality (objects/arrays)
 *       expect(result).toBeGreaterThan(n)
 *       expect(result).toBeCloseTo(n, decimals)
 *       expect(() => fn()).toThrow('msg')         ← expects an error
 *
 *  4. Run all tests:    npm test
 *     Run with details: npm run test:verbose
 *     Watch mode:       npm run test:watch   (re-runs on file save)
 *
 *  That's it! Everything below uses only these basics.
 * ============================================================
 */

const {
    calculateBMI,
    calculateFitnessLevel,
    parseWorkoutResponse,
    parseCoachRecommendations,
    calculateGoalProgress,
    calculateStreak,
    calculateCompletionRate,
    getLastSeenText,
    isCoachOnline,
    calculateMonthlyChange
} = require('../src/utils/helpers');


// ────────────────────────────────────────────────────────────
//  1. BMI CALCULATION
// ────────────────────────────────────────────────────────────

describe('calculateBMI', () => {
    test('returns correct BMI for a normal person (70 kg, 175 cm)', () => {
        const bmi = calculateBMI(70, 175);
        // BMI = 70 / (1.75)^2 = 22.86
        expect(bmi).toBeCloseTo(22.86, 1);
    });

    test('returns correct BMI for an overweight person (95 kg, 170 cm)', () => {
        const bmi = calculateBMI(95, 170);
        // BMI = 95 / (1.70)^2 = 32.87
        expect(bmi).toBeCloseTo(32.87, 1);
    });

    test('returns 0 when weight is missing', () => {
        expect(calculateBMI(null, 175)).toBe(0);
    });

    test('returns 0 when height is zero', () => {
        expect(calculateBMI(70, 0)).toBe(0);
    });
});


// ────────────────────────────────────────────────────────────
//  2. FITNESS LEVEL (based on BMI)
// ────────────────────────────────────────────────────────────

describe('calculateFitnessLevel', () => {
    test('underweight user gets "beginner (underweight)"', () => {
        // BMI < 18.5 → 50 kg, 180 cm → BMI ≈ 15.4
        const level = calculateFitnessLevel({ weightKg: 50, heightCm: 180 });
        expect(level).toBe('beginner (underweight)');
    });

    test('healthy weight user gets "intermediate (healthy weight)"', () => {
        // BMI 18.5-24.9 → 70 kg, 175 cm → BMI ≈ 22.9
        const level = calculateFitnessLevel({ weightKg: 70, heightCm: 175 });
        expect(level).toBe('intermediate (healthy weight)');
    });

    test('overweight user gets "beginner (overweight)"', () => {
        // BMI 25-29.9 → 85 kg, 170 cm → BMI ≈ 29.4
        const level = calculateFitnessLevel({ weightKg: 85, heightCm: 170 });
        expect(level).toBe('beginner (overweight)');
    });

    test('obese user gets gentle approach message', () => {
        // BMI >= 30 → 110 kg, 170 cm → BMI ≈ 38.1
        const level = calculateFitnessLevel({ weightKg: 110, heightCm: 170 });
        expect(level).toBe('beginner (obese - gentle approach needed)');
    });

    test('missing data returns "unknown"', () => {
        expect(calculateFitnessLevel({})).toBe('unknown');
    });
});


// ────────────────────────────────────────────────────────────
//  3. PARSE WORKOUT RESPONSE (AI JSON parsing)
// ────────────────────────────────────────────────────────────

describe('parseWorkoutResponse', () => {
    test('parses valid workout JSON correctly', () => {
        const json = JSON.stringify({
            title: 'Morning Burn',
            duration: 30,
            intensity: 'moderate',
            exercises: [
                { name: 'Push-ups', sets: 3, reps: '10-12' }
            ],
            estimatedCalories: 250
        });

        const result = parseWorkoutResponse(json);
        expect(result.title).toBe('Morning Burn');
        expect(result.exercises).toHaveLength(1);
        expect(result.exercises[0].name).toBe('Push-ups');
    });

    test('strips markdown code fences before parsing', () => {
        const wrapped = '```json\n{"title":"Quick HIIT","exercises":[{"name":"Burpees"}]}\n```';
        const result = parseWorkoutResponse(wrapped);
        expect(result.title).toBe('Quick HIIT');
    });

    test('throws on missing title field', () => {
        const json = JSON.stringify({ exercises: [{ name: 'Squats' }] });
        expect(() => parseWorkoutResponse(json)).toThrow('Invalid workout structure');
    });

    test('throws on missing exercises field', () => {
        const json = JSON.stringify({ title: 'Workout' });
        expect(() => parseWorkoutResponse(json)).toThrow('Invalid workout structure');
    });

    test('throws on malformed JSON', () => {
        expect(() => parseWorkoutResponse('not json at all')).toThrow();
    });
});


// ────────────────────────────────────────────────────────────
//  4. PARSE COACH RECOMMENDATIONS
// ────────────────────────────────────────────────────────────

describe('parseCoachRecommendations', () => {
    test('returns recommendations array from valid JSON', () => {
        const json = JSON.stringify({
            recommendations: [
                { coachId: 'c1', matchScore: 92, reasoning: 'Great fit' },
                { coachId: 'c2', matchScore: 78, reasoning: 'Good match' }
            ]
        });

        const result = parseCoachRecommendations(json);
        expect(result).toHaveLength(2);
        expect(result[0].matchScore).toBe(92);
    });

    test('returns empty array when recommendations key is missing', () => {
        const json = JSON.stringify({ someOtherKey: 'value' });
        const result = parseCoachRecommendations(json);
        expect(result).toEqual([]);
    });

    test('handles markdown-wrapped response', () => {
        const wrapped = '```json\n{"recommendations":[{"coachId":"c1","matchScore":85}]}\n```';
        const result = parseCoachRecommendations(wrapped);
        expect(result[0].coachId).toBe('c1');
    });
});


// ────────────────────────────────────────────────────────────
//  5. GOAL PROGRESS
// ────────────────────────────────────────────────────────────

describe('calculateGoalProgress', () => {
    test('returns "Not set" when user has no goal', () => {
        const result = calculateGoalProgress({}, [], [], []);
        expect(result.goal).toBe('Not set');
        expect(result.progress).toBe(0);
    });

    test('weight_loss: 5 activities out of 20 target = 25% progress', () => {
        const user = { goal: 'weight_loss' };
        const bookings = new Array(3);  // 3 bookings
        const aiWorkouts = new Array(2); // 2 AI workouts  → total 5
        const result = calculateGoalProgress(user, bookings, [], aiWorkouts);

        expect(result.goal).toBe('Weight Loss');
        expect(result.progress).toBe(25);
        expect(result.color).toBe('pink');
    });

    test('muscle_gain: 24 activities reaches 100% (capped)', () => {
        const user = { goal: 'muscle_gain' };
        const bookings = new Array(20);
        const aiWorkouts = new Array(4); // total 24 = target
        const result = calculateGoalProgress(user, bookings, [], aiWorkouts);

        expect(result.progress).toBe(100);
        expect(result.message).toContain('Goal achieved');
    });

    test('progress never exceeds 100%', () => {
        const user = { goal: 'general_fitness' }; // target = 16
        const bookings = new Array(50);
        const result = calculateGoalProgress(user, bookings, [], []);
        expect(result.progress).toBe(100);
    });

    test('unknown goal falls back to general_fitness milestone', () => {
        const user = { goal: 'yoga_master' }; // not in milestones
        const bookings = new Array(8); // 8 / 16 = 50%
        const result = calculateGoalProgress(user, bookings, [], []);
        expect(result.progress).toBe(50);
        expect(result.color).toBe('purple');
    });
});


// ────────────────────────────────────────────────────────────
//  6. ACTIVITY STREAK
// ────────────────────────────────────────────────────────────

describe('calculateStreak', () => {
    test('returns 0 when there are no activities', () => {
        expect(calculateStreak([])).toBe(0);
    });

    test('returns 3 for three consecutive days ending today', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        const dates = [
            today.toDateString(),
            yesterday.toDateString(),
            twoDaysAgo.toDateString()
        ];

        expect(calculateStreak(dates)).toBe(3);
    });

    test('streak breaks when a day is missed', () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        // skip day -2
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        const dates = [
            today.toDateString(),
            yesterday.toDateString(),
            threeDaysAgo.toDateString() // gap on day -2 breaks the streak
        ];

        expect(calculateStreak(dates)).toBe(2);
    });

    test('streak of 1 if only yesterday has activity (today allowed to be missed)', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        expect(calculateStreak([yesterday.toDateString()])).toBe(1);
    });
});


// ────────────────────────────────────────────────────────────
//  7. COMPLETION RATE
// ────────────────────────────────────────────────────────────

describe('calculateCompletionRate', () => {
    test('returns 0 for empty bookings', () => {
        expect(calculateCompletionRate([])).toBe(0);
    });

    test('returns 0 when bookings is null', () => {
        expect(calculateCompletionRate(null)).toBe(0);
    });

    test('100% when all bookings are completed', () => {
        const bookings = [
            { status: 'completed' },
            { status: 'completed' },
            { status: 'completed' }
        ];
        expect(calculateCompletionRate(bookings)).toBe(100);
    });

    test('50% when half are completed', () => {
        const bookings = [
            { status: 'completed' },
            { status: 'cancelled' },
            { status: 'completed' },
            { status: 'pending' }
        ];
        expect(calculateCompletionRate(bookings)).toBe(50);
    });

    test('0% when none are completed', () => {
        const bookings = [
            { status: 'cancelled' },
            { status: 'pending' }
        ];
        expect(calculateCompletionRate(bookings)).toBe(0);
    });
});


// ────────────────────────────────────────────────────────────
//  8. LAST SEEN TEXT
// ────────────────────────────────────────────────────────────

describe('getLastSeenText', () => {
    test('returns "Status: N/A" for null input', () => {
        expect(getLastSeenText(null)).toBe('Status: N/A');
    });

    test('returns "Just now" for a date less than 1 minute ago', () => {
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        expect(getLastSeenText(thirtySecondsAgo)).toBe('Last seen: Just now');
    });

    test('returns minutes ago for recent activity', () => {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        expect(getLastSeenText(tenMinutesAgo)).toBe('Last seen: 10m ago');
    });

    test('returns hours ago for same-day activity', () => {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        expect(getLastSeenText(threeHoursAgo)).toBe('Last seen: 3h ago');
    });

    test('returns days ago for recent past', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        expect(getLastSeenText(twoDaysAgo)).toBe('Last seen: 2d ago');
    });

    test('returns "Over a week ago" for old dates', () => {
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        expect(getLastSeenText(twoWeeksAgo)).toBe('Last seen: Over a week ago');
    });
});


// ────────────────────────────────────────────────────────────
//  9. COACH ONLINE STATUS
// ────────────────────────────────────────────────────────────

describe('isCoachOnline', () => {
    test('returns true (default) when presence fields are missing', () => {
        // New coaches without presence tracking should default to online
        expect(isCoachOnline({ name: 'Coach A' })).toBe(true);
    });

    test('returns false when lastSeen is null', () => {
        expect(isCoachOnline({ isOnline: false, lastSeen: null })).toBe(false);
    });

    test('returns true when last seen is within 90 seconds', () => {
        const recentDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
        expect(isCoachOnline({ isOnline: false, lastSeen: recentDate })).toBe(true);
    });

    test('returns false when last seen is over 90 seconds and isOnline is false', () => {
        const oldDate = new Date(Date.now() - 120 * 1000); // 2 minutes ago
        expect(isCoachOnline({ isOnline: false, lastSeen: oldDate })).toBe(false);
    });

    test('returns true when last seen is old but isOnline flag is true', () => {
        const oldDate = new Date(Date.now() - 120 * 1000);
        expect(isCoachOnline({ isOnline: true, lastSeen: oldDate })).toBe(true);
    });
});


// ────────────────────────────────────────────────────────────
// 10. MONTHLY CHANGE PERCENTAGE
// ────────────────────────────────────────────────────────────

describe('calculateMonthlyChange', () => {
    test('returns 100 when there were no sessions last month but some this month', () => {
        expect(calculateMonthlyChange(5, 0)).toBe(100);
    });

    test('returns 0 when both months are zero', () => {
        expect(calculateMonthlyChange(0, 0)).toBe(0);
    });

    test('returns 50% increase (3 last month → 6 this month is +100%)', () => {
        expect(calculateMonthlyChange(6, 3)).toBe(100);
    });

    test('returns -50% when sessions halved', () => {
        expect(calculateMonthlyChange(3, 6)).toBe(-50);
    });

    test('returns 0% when sessions are the same', () => {
        expect(calculateMonthlyChange(4, 4)).toBe(0);
    });
});
