/**
 * AI Service for FindMyFitCoach - Google Gemini Version
 * Uses Google's Gemini API for AI-powered workout generation
 */

export class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // Updated to use gemini-1.5-flash (fast and free tier friendly)
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

    /**
     * Generate personalized workout considering recent workout history
     */
    async generatePersonalizedWorkoutWithHistory(userProfile, recentWorkouts = []) {
        console.log('🏋️ generatePersonalizedWorkoutWithHistory called:', {
            userProfile: userProfile.goal || 'no goal',
            recentWorkoutsCount: recentWorkouts.length,
            hasAPIKey: !!this.apiKey
        });

        if (!this.apiKey) {
            console.warn('❌ No Gemini API key found - returning fallback');
            return this.getFallbackWorkout(userProfile);
        }

        const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][new Date().getDay()];
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
            const response = await this._callGemini(prompt);
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
            const response = await this._callGemini(prompt);
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
            const response = await this._callGemini(prompt);
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
            const response = await this._callGemini(prompt);
            return this._parseWorkoutResponse(response);
        } catch (error) {
            console.error('Error:', error);
            return this.getFallbackWorkout(userProfile);
        }
    }

    /**
     * Call Google Gemini API
     */
    async _callGemini(prompt) {
        console.log('🌐 Gemini API Call Starting...');

        const url = `${this.apiEndpoint}?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Gemini API error:', {
                status: response.status,
                statusText: response.statusText,
                errorData,
                url: this.apiEndpoint,
                hasApiKey: !!this.apiKey
            });

            // Provide helpful error messages
            if (response.status === 400) {
                throw new Error('Invalid API request. Please check your API key.');
            } else if (response.status === 403) {
                throw new Error('API key is invalid or does not have permission to use Gemini API.');
            } else if (response.status === 404) {
                throw new Error('Gemini API endpoint not found. The model may have been updated.');
            } else if (response.status === 429) {
                throw new Error('API quota exceeded. Please try again later.');
            }

            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from AI');
        }

        console.log('✅ Gemini response received');
        return text;
    }

    /**
     * Parse workout response
     */
    _parseWorkoutResponse(response) {
        try {
            // Remove markdown code blocks
            const cleanJson = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const parsed = JSON.parse(cleanJson);

            if (Array.isArray(parsed)) {
                return parsed;
            }

            // Handle object with exercises array
            if (parsed.exercises && Array.isArray(parsed.exercises)) {
                return parsed.exercises;
            }

            throw new Error('Invalid format');
        } catch (error) {
            console.error('Parse error:', error);
            // Return fallback if parsing fails
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

    /**
     * Get fallback workout
     */
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

    /**
     * Get fallback coaching insights
     */
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

    /**
     * Calculate fitness level
     */
    _calculateFitnessLevel(userProfile) {
        const bmi = userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2);

        if (bmi < 18.5) return 'beginner';
        if (bmi < 25) return 'intermediate';
        if (bmi < 30) return 'beginner';
        return 'beginner';
    }
}
