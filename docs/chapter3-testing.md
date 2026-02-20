# CHAPTER 3: TESTING, VALIDATION & RESULTS — Sivaguru

## 3.1 Test Plan

### Testing Strategy

The testing strategy for FindMyFitCoach follows a **unit testing** approach focused on the application's pure business-logic functions. These are functions that perform calculations, data parsing, and state evaluation without depending on the browser DOM, Firebase services, or external APIs. By isolating this logic into a dedicated utility module (`src/utils/helpers.js`), each function can be tested independently with predictable inputs and verifiable outputs.

The strategy covers the following functional areas of the application:

- **Health metrics** — BMI calculation and fitness level classification used by the AI workout engine.
- **AI response parsing** — Validation and extraction of workout plans and coach recommendations returned by the OpenAI API.
- **Analytics computations** — Goal progress tracking, activity streak counting, session completion rates, and month-over-month trend analysis displayed on the analytics dashboard.
- **Real-time presence logic** — Coach online status detection and human-readable "last seen" formatting used in the coach listing UI.

### Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| **Jest** | 29.7.0 | JavaScript unit test framework — discovers, runs, and reports test results |
| **Node.js** | 18+ | Runtime environment for executing tests outside the browser |
| **npm** | 9+ | Package manager used to install Jest and define test scripts |

### How to Run

```
npm test              # Run all tests
npm run test:verbose  # Run with detailed per-test output
npm run test:watch    # Re-run tests automatically on file save
```

---

## 3.2 Test Cases

### 3.2.1 BMI Calculation (`calculateBMI`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-01 | Correct BMI for a normal-weight person | weightKg = 70, heightCm = 175 | 22.86 (approx.) | Pass |
| TC-02 | Correct BMI for an overweight person | weightKg = 95, heightCm = 170 | 32.87 (approx.) | Pass |
| TC-03 | Returns 0 when weight is missing | weightKg = null, heightCm = 175 | 0 | Pass |
| TC-04 | Returns 0 when height is zero | weightKg = 70, heightCm = 0 | 0 | Pass |

### 3.2.2 Fitness Level Classification (`calculateFitnessLevel`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-05 | Underweight user classification | weightKg = 50, heightCm = 180 (BMI ≈ 15.4) | "beginner (underweight)" | Pass |
| TC-06 | Healthy weight user classification | weightKg = 70, heightCm = 175 (BMI ≈ 22.9) | "intermediate (healthy weight)" | Pass |
| TC-07 | Overweight user classification | weightKg = 85, heightCm = 170 (BMI ≈ 29.4) | "beginner (overweight)" | Pass |
| TC-08 | Obese user gets gentle approach label | weightKg = 110, heightCm = 170 (BMI ≈ 38.1) | "beginner (obese - gentle approach needed)" | Pass |
| TC-09 | Missing profile data returns unknown | Empty object {} | "unknown" | Pass |

### 3.2.3 AI Workout Response Parsing (`parseWorkoutResponse`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-10 | Parses valid workout JSON correctly | JSON with title "Morning Burn", 1 exercise | Object with title = "Morning Burn", exercises array of length 1 | Pass |
| TC-11 | Strips markdown code fences before parsing | JSON wrapped in `` ```json ... ``` `` | Parsed object with title = "Quick HIIT" | Pass |
| TC-12 | Throws error when title field is missing | JSON with exercises but no title | Throws "Invalid workout structure" | Pass |
| TC-13 | Throws error when exercises field is missing | JSON with title but no exercises | Throws "Invalid workout structure" | Pass |
| TC-14 | Throws error on malformed JSON string | "not json at all" | Throws error | Pass |

### 3.2.4 Coach Recommendations Parsing (`parseCoachRecommendations`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-15 | Returns recommendations array from valid JSON | JSON with 2 coach recommendations | Array of length 2, first matchScore = 92 | Pass |
| TC-16 | Returns empty array when key is missing | JSON without "recommendations" key | Empty array [] | Pass |
| TC-17 | Handles markdown-wrapped response | JSON wrapped in `` ```json ... ``` `` | Array with coachId = "c1" | Pass |

### 3.2.5 Goal Progress Calculation (`calculateGoalProgress`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-18 | Returns "Not set" when user has no goal | userProfile = {}, empty arrays | goal = "Not set", progress = 0 | Pass |
| TC-19 | Weight loss: 5 of 20 activities = 25% | goal = "weight_loss", 3 bookings + 2 AI workouts | progress = 25, color = "pink" | Pass |
| TC-20 | Muscle gain: 24 activities reaches 100% | goal = "muscle_gain", 20 bookings + 4 AI workouts | progress = 100, message contains "Goal achieved" | Pass |
| TC-21 | Progress is capped and never exceeds 100% | goal = "general_fitness" (target 16), 50 bookings | progress = 100 | Pass |
| TC-22 | Unknown goal falls back to general_fitness | goal = "yoga_master", 8 bookings | progress = 50, color = "purple" | Pass |

### 3.2.6 Activity Streak Calculation (`calculateStreak`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-23 | Returns 0 when there are no activities | Empty array [] | 0 | Pass |
| TC-24 | Returns 3 for three consecutive days ending today | Date strings for today, yesterday, 2 days ago | 3 | Pass |
| TC-25 | Streak breaks when a day is missed | Today, yesterday, 3 days ago (gap on day 2) | 2 | Pass |
| TC-26 | Streak of 1 if only yesterday has activity | Yesterday's date string only | 1 | Pass |

### 3.2.7 Booking Completion Rate (`calculateCompletionRate`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-27 | Returns 0 for empty bookings array | [] | 0 | Pass |
| TC-28 | Returns 0 when bookings is null | null | 0 | Pass |
| TC-29 | Returns 100% when all bookings completed | 3 bookings, all status = "completed" | 100 | Pass |
| TC-30 | Returns 50% when half are completed | 2 completed, 1 cancelled, 1 pending | 50 | Pass |
| TC-31 | Returns 0% when none are completed | 1 cancelled, 1 pending | 0 | Pass |

### 3.2.8 Last Seen Text Formatting (`getLastSeenText`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-32 | Returns fallback text for null input | null | "Status: N/A" | Pass |
| TC-33 | Returns "Just now" for < 1 minute ago | Date 30 seconds ago | "Last seen: Just now" | Pass |
| TC-34 | Returns minutes ago for recent activity | Date 10 minutes ago | "Last seen: 10m ago" | Pass |
| TC-35 | Returns hours ago for same-day activity | Date 3 hours ago | "Last seen: 3h ago" | Pass |
| TC-36 | Returns days ago for recent past | Date 2 days ago | "Last seen: 2d ago" | Pass |
| TC-37 | Returns "Over a week ago" for old dates | Date 14 days ago | "Last seen: Over a week ago" | Pass |

### 3.2.9 Coach Online Status (`isCoachOnline`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-38 | Defaults to online when presence fields missing | { name: "Coach A" } (no isOnline/lastSeen) | true | Pass |
| TC-39 | Returns false when lastSeen is null | { isOnline: false, lastSeen: null } | false | Pass |
| TC-40 | Returns true when last seen within 90 seconds | { isOnline: false, lastSeen: 30 seconds ago } | true | Pass |
| TC-41 | Returns false when stale and isOnline is false | { isOnline: false, lastSeen: 2 minutes ago } | false | Pass |
| TC-42 | Returns true when isOnline flag is true (even if stale) | { isOnline: true, lastSeen: 2 minutes ago } | true | Pass |

### 3.2.10 Monthly Change Percentage (`calculateMonthlyChange`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-43 | Returns 100% when last month was zero | thisMonth = 5, lastMonth = 0 | 100 | Pass |
| TC-44 | Returns 0% when both months are zero | thisMonth = 0, lastMonth = 0 | 0 | Pass |
| TC-45 | Calculates correct positive change | thisMonth = 6, lastMonth = 3 | 100 (+100%) | Pass |
| TC-46 | Calculates correct negative change | thisMonth = 3, lastMonth = 6 | -50 (-50%) | Pass |
| TC-47 | Returns 0% when sessions unchanged | thisMonth = 4, lastMonth = 4 | 0 | Pass |

---

## 3.3 Results & Analysis

### Test Execution Summary

| Metric | Value |
|--------|-------|
| Total Test Suites | 1 |
| Total Test Cases | 47 |
| Passed | 47 |
| Failed | 0 |
| Pass Rate | **100%** |
| Execution Time | 2.962 seconds |

### Observations

1. **All 47 test cases passed on the first run**, confirming that the core business logic functions behave correctly across normal inputs, edge cases, and error conditions.

2. **Edge case handling is robust.** Functions like `calculateBMI` gracefully return 0 for missing or zero inputs instead of producing `NaN` or `Infinity`. Similarly, `calculateCompletionRate` safely handles `null` input, and `calculateFitnessLevel` returns "unknown" for incomplete profiles.

3. **AI response parsing is resilient.** The `parseWorkoutResponse` and `parseCoachRecommendations` functions correctly strip markdown code fences (`` ```json ```) that OpenAI sometimes wraps around JSON responses. They also properly validate required fields (`title`, `exercises`) and throw descriptive errors for malformed data.

4. **Goal progress correctly caps at 100%.** Even when a user's total activities far exceed the milestone target, the progress value is clamped to 100, preventing UI rendering issues in the analytics dashboard.

5. **Streak calculation tolerates today being missed.** The algorithm allows the current day to have no activity without breaking the streak. This is a deliberate design choice so that a user checking their streak in the morning (before working out) still sees their running streak intact.

6. **Coach online status uses a layered approach.** The `isCoachOnline` function defaults to `true` when presence fields are missing (for backward compatibility with coaches who signed up before presence tracking was added), uses a 90-second heartbeat window as the primary signal, and falls back to the `isOnline` database flag only when the heartbeat is stale.

### Performance / Accuracy Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Test pass rate | 100% (47/47) | All assertions matched expected values |
| BMI accuracy | Within 0.1 of manual calculation | Verified against standard BMI formula: weight / (height in m)^2 |
| Fitness level coverage | 5 of 5 BMI ranges tested | Underweight, healthy, overweight, obese, and missing data |
| JSON parsing coverage | Valid, markdown-wrapped, and malformed inputs tested | Covers the 3 most common AI response formats |
| Goal progress boundaries | 0% and 100% caps verified | Prevents underflow and overflow in dashboard charts |
| Time-based function accuracy | Tested at second, minute, hour, day, and week granularity | All `getLastSeenText` thresholds produce correct human-readable output |
