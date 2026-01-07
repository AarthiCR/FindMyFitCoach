# Analytics Components Documentation

This document describes all analytics metrics displayed in the FindMyFitCoach application for both **User** and **Coach** dashboards.

---

## Table of Contents

- [User Analytics](#user-analytics)
  - [Key Metrics](#user-key-metrics)
  - [Secondary Metrics](#user-secondary-metrics)
  - [Charts & Visualizations](#user-charts--visualizations)
  - [Detailed Stats](#user-detailed-stats)
- [Coach Analytics](#coach-analytics)
  - [Key Metrics](#coach-key-metrics)
  - [Secondary Metrics](#coach-secondary-metrics)
  - [Charts & Visualizations](#coach-charts--visualizations)
  - [Detailed Stats](#coach-detailed-stats)

---

## User Analytics

### User Key Metrics

| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `sessionsThisMonth` | **Sessions This Month** | Number of completed coaching sessions in the current calendar month | `COUNT(bookings WHERE status = 'completed' AND scheduledAt.month = currentMonth)` |
| `monthlyChange` | **↑/↓ X% vs last month** | Percentage change in sessions compared to previous month | `((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth) × 100` |
| `totalSessions` | **Total Sessions** | All-time count of completed coaching sessions | `COUNT(bookings WHERE status = 'completed')` |
| `completionRate` | **Completion Rate** | Percentage of bookings that were completed (not cancelled) | `(completedBookings / totalBookings) × 100` |
| `weeklyAverage` | **Weekly Average** | Average number of sessions per week over the last 4 weeks | `COUNT(completedBookings in last 28 days) / 4` |

### User Secondary Metrics

| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `currentStreak` | **🔥 Streak** | Consecutive days with at least one activity (booking or AI workout) | Count backwards from today, incrementing for each consecutive day with activity until a gap is found |
| `totalAiWorkouts` | **🤖 AI Workouts** | Total number of AI-generated workout plans created | `COUNT(ai_workouts)` |
| `uniqueCoachesCount` | **👥 Coaches** | Number of different coaches the user has booked sessions with | `COUNT(DISTINCT coachId FROM completedBookings)` |
| `cancellationRate` | **📉 Cancelled** | Percentage of total bookings that were cancelled | `(cancelledBookings / totalBookings) × 100` |
| `avgDuration` | **⏱️ Avg Duration** | Average duration of completed workout sessions | `SUM(session.duration) / COUNT(sessions)` or default `45 min` if no data |
| `favoriteTime` | **🌅 Best Time** | The hour of day when user most frequently schedules workouts | `MODE(scheduledAt.hour FROM completedBookings)` formatted as "X AM/PM" |

### User Charts & Visualizations

#### Monthly Trend Chart
| Component Name | UI Display | Summary | Data Structure |
|----------------|------------|---------|----------------|
| `monthlyTrend` | **Monthly Trend** | Bar chart showing activity over the last 6 months | Array of `{ month, sessions, aiWorkouts, total }` for each of the last 6 months |

**Calculation:**
```javascript
For each month (last 6 months):
  sessions = COUNT(completedBookings WHERE scheduledAt.month = targetMonth)
  aiWorkouts = COUNT(ai_workouts WHERE createdAt.month = targetMonth)
  total = sessions + aiWorkouts
```

#### Weekly Activity Chart
| Component Name | UI Display | Summary | Data Structure |
|----------------|------------|---------|----------------|
| `weeklyActivity` | **Weekly Activity** | Bar chart showing daily activity for the last 7 days | Array of `{ day, date, sessions, aiWorkouts, total }` for each of the last 7 days |

**Calculation:**
```javascript
For each day (last 7 days):
  sessions = COUNT(completedBookings WHERE scheduledAt.date = targetDate)
  aiWorkouts = COUNT(ai_workouts WHERE createdAt.date = targetDate)
  total = sessions + aiWorkouts
```

### User Detailed Stats

#### Top Coaches List
| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `topCoaches` | **Most Booked Coaches** | Ranked list of coaches by number of completed sessions | `GROUP BY coachId, COUNT(*), ORDER BY count DESC, LIMIT 5` |

#### Goal Progress
| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `goalProgress` | **Goal Progress** | Progress bar showing advancement toward fitness goal | Based on user's selected goal, progress = `(totalActivities / goalTarget) × 100` |

**Goal Targets:**
| Goal | Target Sessions | Icon |
|------|-----------------|------|
| Weight Loss | 20 | 🔥 |
| Muscle Gain | 24 | 💪 |
| Endurance | 30 | 🏃 |
| General Fitness | 16 | ⭐ |

#### Activity Summary
| Component Name | UI Display | Summary | Data |
|----------------|------------|---------|------|
| `recentActivity` | **Activity Summary** | Timeline of recent events (bookings, AI workouts, sessions) | Last 10 activities sorted by date, showing type and details |

---

## Coach Analytics

### Coach Key Metrics

| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `activeClients` | **Active Clients** | Number of unique clients who had a session in the last 30 days | `COUNT(DISTINCT userId FROM completedBookings WHERE lastSessionDate >= (today - 30 days))` |
| `newClientsThisMonth` | **+X new this month** | New unique clients acquired in current month | `COUNT(DISTINCT userId FROM bookings WHERE createdAt.month = currentMonth)` |
| `sessionsThisMonth` | **Sessions This Month** | Number of completed sessions conducted this month | `COUNT(bookings WHERE coachId = currentCoach AND status = 'completed' AND scheduledAt.month = currentMonth)` |
| `sessionsChange` | **↑/↓ X% vs last month** | Percentage change in sessions compared to previous month | `((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth) × 100` |
| `revenueThisMonth` | **Revenue This Month** | Earnings from completed sessions this month | `sessionsThisMonth × hourlyRate` |
| `revenueChange` | **↑/↓ X% vs last month** | Percentage change in revenue compared to previous month | `((revenueThisMonth - revenueLastMonth) / revenueLastMonth) × 100` |
| `avgCompletion` | **Avg Completion** | Average workout completion rate across all sessions | `AVG(completedItems / totalItems) × 100` from workoutSessions |

### Coach Secondary Metrics

| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `totalRevenue` | **💎 Lifetime Revenue** | Total earnings from all completed sessions | `totalSessions × hourlyRate` |
| `retentionRate` | **🔄 Retention** | Percentage of clients who returned for 2+ sessions | `(clientsWithMultipleSessions / totalClients) × 100` |
| `avgSessionsPerClient` | **📊 Sessions/Client** | Average number of sessions per unique client | `totalSessions / uniqueClientsCount` |
| `cancellationRate` | **❌ Cancelled** | Percentage of bookings that were cancelled | `(cancelledBookings / totalBookings) × 100` |
| `peakHour` | **⏰ Peak Hour** | Most common hour when clients book sessions | `MODE(scheduledAt.hour FROM completedBookings)` formatted as "X AM/PM" |
| `growthRate` | **📈 Growth** | Business growth rate comparing recent vs previous 3-month periods | `((recentThreeMonthsSessions - previousThreeMonthsSessions) / previousThreeMonthsSessions) × 100` |

### Coach Charts & Visualizations

#### Revenue Trend Chart
| Component Name | UI Display | Summary | Data Structure |
|----------------|------------|---------|----------------|
| `revenueTrend` | **💰 Revenue Trend** | Bar chart showing monthly revenue for the last 6 months | Array of `{ month, sessions, revenue }` for each of the last 6 months |

**Calculation:**
```javascript
For each month (last 6 months):
  sessions = COUNT(completedBookings WHERE scheduledAt.month = targetMonth)
  revenue = sessions × hourlyRate
```

#### Weekly Sessions Chart
| Component Name | UI Display | Summary | Data Structure |
|----------------|------------|---------|----------------|
| `weeklyActivity` | **📅 This Week's Sessions** | Bar chart showing daily sessions for the last 7 days | Array of `{ day, date, count }` for each of the last 7 days |

**Calculation:**
```javascript
For each day (last 7 days):
  count = COUNT(completedBookings WHERE scheduledAt.date = targetDate)
```

### Coach Detailed Stats

#### Top Clients List
| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `topClients` | **⭐ Top Clients** | Ranked list of clients by number of completed sessions | `GROUP BY userId, COUNT(*), ORDER BY count DESC, LIMIT 5` |

#### Client Goals Distribution
| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `goalsDistribution` | **🎯 Client Goals** | Breakdown of client fitness goals | `GROUP BY goal, COUNT(*), ORDER BY count DESC` |

**Goal Labels:**
| Goal Key | Display Name | Color |
|----------|--------------|-------|
| `weight_loss` | Weight Loss | Pink |
| `muscle_gain` | Muscle Gain | Blue |
| `endurance` | Endurance | Green |
| `general_fitness` | General Fitness | Purple |

#### Performance Summary
| Component Name | UI Display | Summary | Metrics Shown |
|----------------|------------|---------|---------------|
| `performanceSummary` | **📊 Performance** | Key performance indicators | Total Sessions, Total Clients, Avg Sessions/Client, Cancellation Rate |

#### Clients Needing Attention
| Component Name | UI Display | Summary | Formula |
|----------------|------------|---------|---------|
| `clientsNeedingAttention` | **⚠️ Clients Needing Attention** | Clients who haven't had a session recently but were previously active | `clients WHERE sessionsCount >= 2 AND lastSessionDate < (today - 14 days)` |

**Criteria:**
- Client has at least 2 completed sessions (shows commitment)
- Last session was more than 14 days ago (becoming inactive)
- Sorted by last session date (oldest first)
- Limited to 5 clients

---

## Data Sources

### Collections Used

| Collection | Used For | Key Fields |
|------------|----------|------------|
| `bookings` | Session counts, revenue, coach/client relationships | `userId`, `coachId`, `status`, `scheduledAt`, `createdAt`, `goal` |
| `ai_workouts` | AI workout counts, workout types | `userId`, `createdAt`, `workoutType`, `workout` |
| `workoutSessions` | Completion rates, session details | `userId`, `coachId`, `totalItems`, `completedItems`, `completedAt`, `duration` |
| `users` | User profiles, goals | `uid`, `goal`, `name`, `email` |
| `coaches` | Coach profiles, hourly rates | `id`, `hourlyRate`, `name`, `email` |

### Status Values

| Status | Meaning | Included In |
|--------|---------|-------------|
| `pending` | Session scheduled but not yet completed | Total bookings count |
| `completed` | Session was conducted successfully | Completed sessions, revenue calculations |
| `cancelled` | Session was cancelled | Cancellation rate calculations |

---

## Refresh Behavior

- **Manual Refresh**: Click the "🔄 Refresh" button in the Analytics section
- **Auto-refresh on Login**: Analytics load automatically when user signs in
- **Data Caching**: No client-side caching; data is fetched fresh on each refresh

---

## Performance Considerations

1. **Queries are ordered by date descending** for efficient pagination
2. **Composite indexes** are created in Firestore for:
   - `bookings`: `userId + createdAt`
   - `bookings`: `coachId + status + scheduledAt`
   - `ai_workouts`: `userId + createdAt`
   - `workoutSessions`: `coachId + completedAt`
3. **All date calculations use Firestore Timestamps** for consistency

