/**
 * AI Service for FindMyFitCoach
 *
 * Provider-agnostic interface that tries Gemini first, then OpenAI as fallback.
 * API keys are read from config/config.js (deployed via Firebase Hosting,
 * but kept out of git via .gitignore).
 */

export class AIService {
    constructor({ geminiApiKey, openaiApiKey } = {}) {
        this.geminiApiKey = geminiApiKey || '';
        this.openaiApiKey = openaiApiKey || '';
        this.geminiEndpoint =
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    }

    // ─── Public methods ────────────────────────────────────────

    /**
     * Generate personalized workout considering recent workout history
     */
    async generatePersonalizedWorkoutWithHistory(userProfile, recentWorkouts = []) {
        console.log('🏋️ generatePersonalizedWorkoutWithHistory called:', {
            userProfile: userProfile.goal || 'no goal',
            recentWorkoutsCount: recentWorkouts.length
        });

        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

        const prompt = `You are an experienced fitness coach. Generate a personalized workout plan.

User Profile:
- Height: ${userProfile.heightCm || 170}cm
- Weight: ${userProfile.weightKg || 70}kg
- Primary Goal: ${userProfile.goal || 'general fitness'}
- Requirements: ${userProfile.requirements || 'None'}
- Session: ${timeOfDay} ${dayOfWeek}

${recentWorkouts.length > 0 ? `Recent workouts: ${recentWorkouts.length} completed` : 'No recent workouts'}

Generate exactly 5-7 exercises as a JSON array of strings. Each should be actionable and specific.

Examples:
- "Warm-up: Dynamic stretches and arm circles (4 minutes)"
- "Push-ups: 3 sets of 10-12 reps"
- "Squats: 3 sets of 15 reps"
- "Plank hold: 3 sets of 30 seconds"
- "Cool-down: Gentle stretching (5 minutes)"

Return ONLY a valid JSON array of strings, no markdown or other formatting.`;

        try {
            const response = await this._callAI(prompt);
            return this._parseWorkoutResponse(response);
        } catch (error) {
            console.error('❌ AI Workout Error:', error);
            return this.getFallbackWorkout(userProfile);
        }
    }

    /**
     * Generate coaching insights
     */
    async generateCoachingInsights({ prompt, userProfile, workoutHistory, sessionGoal }) {
        try {
            const response = await this._callAI(prompt);
            return response.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
        } catch (error) {
            console.error('AI Coaching Insights Error:', error);
            return this.getFallbackInsights(sessionGoal, workoutHistory);
        }
    }

    /**
     * Generate workout from analysis
     */
    async generateWorkoutFromAnalysis(userProfile, savedAnalysis) {
        const prompt = `Based on coaching analysis, generate a workout plan.

User: ${userProfile.goal || 'general fitness'}
Analysis: ${savedAnalysis.analysis || 'Standard session'}

Generate 5-7 exercises as a JSON array of strings.
Return ONLY a valid JSON array.`;

        try {
            const response = await this._callAI(prompt);
            return this._parseWorkoutResponse(response);
        } catch (error) {
            console.error('Error:', error);
            return this.getFallbackWorkout(userProfile);
        }
    }

    /**
     * Generate workout plan
     */
    async generateWorkoutPlan(userProfile, customPrompt = null) {
        const prompt = customPrompt || `Generate a workout for: ${userProfile.goal || 'fitness'}

Height: ${userProfile.heightCm || 170}cm
Weight: ${userProfile.weightKg || 70}kg

Return 5-7 exercises as a JSON array of strings only.`;

        try {
            const response = await this._callAI(prompt);
            return this._parseWorkoutResponse(response);
        } catch (error) {
            console.error('Error:', error);
            return this.getFallbackWorkout(userProfile);
        }
    }

    /**
     * Generate coach recommendations for a user (match scoring)
     */
    async generateCoachRecommendations(userProfile, coaches) {
        if (!coaches || coaches.length === 0) return [];

        const coachList = coaches.map(c => ({
            id: c.id,
            name: c.displayName || c.name || 'Coach',
            specialties: c.specialties || [],
            bio: c.bio || '',
            experience: c.experience || ''
        }));

        const prompt = `You are a fitness matching expert. Score how well each coach matches this user.

User Profile:
- Goal: ${userProfile.goal || 'general fitness'}
- Height: ${userProfile.heightCm || 170}cm
- Weight: ${userProfile.weightKg || 70}kg
- Requirements: ${userProfile.requirements || 'None'}

Available Coaches:
${coachList.map((c, i) => `${i + 1}. ${c.name} — Specialties: ${c.specialties.join(', ') || 'General'} — Bio: ${c.bio.substring(0, 100)}`).join('\n')}

Return a JSON array of objects with "coachId" (string) and "matchScore" (number 0-100).
Example: [{"coachId": "abc123", "matchScore": 85}]
Return ONLY the JSON array.`;

        try {
            const response = await this._callAI(prompt);
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            if (Array.isArray(parsed)) {
                return parsed.map(item => ({
                    coachId: item.coachId,
                    matchScore: Math.min(100, Math.max(0, Number(item.matchScore) || 50))
                }));
            }
            return [];
        } catch (error) {
            console.warn('AI coach matching failed (non-critical):', error.message);
            return [];
        }
    }

    // ─── Private: provider-agnostic dispatch ───────────────────

    /**
     * Try Gemini first, fall back to OpenAI.
     * Throws only if BOTH providers fail (or no keys are configured).
     */
    async _callAI(prompt) {
        if (!this.geminiApiKey && !this.openaiApiKey) {
            console.warn('⚠️ No AI API keys configured — returning fallback');
            throw new Error('No AI API key configured. Add a key in config/config.js');
        }

        // Attempt 1 — Gemini
        if (this.geminiApiKey) {
            try {
                return await this._callGemini(prompt);
            } catch (geminiError) {
                console.warn('⚠️ Gemini failed, trying OpenAI fallback:', geminiError.message);
                if (!this.openaiApiKey) throw geminiError;
            }
        }

        // Attempt 2 — OpenAI (fallback)
        if (this.openaiApiKey) {
            return await this._callOpenAI(prompt);
        }

        throw new Error('All AI providers failed');
    }

    // ─── Private: Gemini ───────────────────────────────────────

    async _callGemini(prompt) {
        console.log('🌐 Calling Gemini API...');

        const url = `${this.geminiEndpoint}?key=${this.geminiApiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty Gemini response');

        console.log('✅ Gemini response received');
        return text;
    }

    // ─── Private: OpenAI ───────────────────────────────────────

    async _callOpenAI(prompt) {
        console.log('🌐 Calling OpenAI API...');

        const response = await fetch(this.openaiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an experienced fitness coach. Respond concisely and helpfully.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('Empty OpenAI response');

        console.log('✅ OpenAI response received');
        return text;
    }

    // ─── Response parsing ──────────────────────────────────────

    _parseWorkoutResponse(response) {
        try {
            const cleanJson = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const parsed = JSON.parse(cleanJson);

            if (Array.isArray(parsed)) return parsed;
            if (parsed.exercises && Array.isArray(parsed.exercises)) return parsed.exercises;

            throw new Error('Invalid format');
        } catch (error) {
            console.error('Parse error:', error);
            return [
                'Warm-up: Light cardio and stretching (5 minutes)',
                'Bodyweight squats: 3 sets of 12 reps',
                'Push-ups: 3 sets of 10 reps',
                'Plank hold: 3 sets of 30 seconds',
                'Lunges: 3 sets of 10 reps per leg',
                'Cool-down: Stretching (5 minutes)'
            ];
        }
    }

    // ─── Fallbacks (no AI needed) ──────────────────────────────

    getFallbackWorkout(userProfile) {
        const goal = userProfile?.goal?.toLowerCase() || 'general fitness';

        const workouts = {
            'weight loss': [
                'Warm-up: Marching in place and arm circles (4 minutes)',
                'Jumping jacks: 3 sets of 30 seconds',
                'Bodyweight squats: 3 sets of 15 reps',
                'Mountain climbers: 3 sets of 20 reps',
                'Walking lunges: 3 sets of 10 per leg',
                'Plank: 3 sets of 30 seconds',
                'Cool-down: Gentle stretching (5 minutes)'
            ],
            'muscle gain': [
                'Warm-up: Dynamic stretches (5 minutes)',
                'Push-ups: 4 sets of 8-12 reps',
                'Squats: 4 sets of 10-15 reps',
                'Pike push-ups: 3 sets of 8-10 reps',
                'Bulgarian split squats: 3 sets of 10 per leg',
                'Plank to push-up: 3 sets of 8 reps',
                'Cool-down: Static stretching (5 minutes)'
            ],
            'general fitness': [
                'Warm-up: Light cardio and mobility (4 minutes)',
                'Squats: 3 sets of 12 reps',
                'Push-ups: 3 sets of 10 reps',
                'Lunges: 3 sets of 10 per leg',
                'Plank: 3 sets of 30 seconds',
                'Burpees: 2 sets of 8 reps',
                'Cool-down: Full body stretch (5 minutes)'
            ]
        };

        return workouts[goal] || workouts['general fitness'];
    }

    getFallbackInsights(sessionGoal, workoutHistory) {
        return `<div class="space-y-3">
<div><strong>🎯 Session Focus</strong><br>
• ${sessionGoal || 'General fitness improvement'}<br>
• ${workoutHistory.length > 0 ? 'Building on previous progress' : 'Establishing baseline'}</div>

<div><strong>📊 Progress</strong><br>
• ${workoutHistory.length} sessions completed<br>
• Continue with proper form and consistency</div>

<div><strong>⚠️ Key Points</strong><br>
• Focus on proper form<br>
• Stay hydrated<br>
• Listen to your body</div>
</div>`;
    }

    _calculateFitnessLevel(userProfile) {
        const bmi = userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2);
        if (bmi < 18.5) return 'beginner';
        if (bmi < 25) return 'intermediate';
        if (bmi < 30) return 'beginner';
        return 'beginner';
    }
}
