/**
 * AI Service for FindMyFitCoach
 * Provides AI-driven workout generation, coach matching, and personalized recommendations
 */

export class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini'; // Using GPT-4o-mini for cost-effective, fast responses
    }

    /**
     * Generate personalized daily workout plan based on user profile
     */
    async generatePersonalizedWorkout(userProfile) {
        const prompt = `You are an expert fitness coach AI. Generate a personalized daily workout plan in JSON format as a checklist that users can follow step-by-step.

User Profile:
- Height: ${userProfile.heightCm} cm
- Weight: ${userProfile.weightKg} kg
- Goal: ${userProfile.goal}
- Requirements/Constraints: ${userProfile.requirements || 'None'}
- Fitness Level: ${this._calculateFitnessLevel(userProfile)}

Create a checklist-style workout plan with the following structure:
{
  "title": "Workout name",
  "duration": number (in minutes),
  "intensity": "low|moderate|high",
  "exercises": [
    {
      "name": "Exercise name",
      "sets": number,
      "reps": "number or range",
      "duration": "duration if applicable",
      "notes": "form tips or modifications",
      "checklistItem": "Clear action item (e.g., 'Complete 3 sets of 10-12 push-ups')"
    }
  ],
  "warmup": {
    "description": "Warmup routine description",
    "checklistItems": ["Warmup step 1", "Warmup step 2", "Warmup step 3"]
  },
  "cooldown": {
    "description": "Cooldown routine description",
    "checklistItems": ["Cooldown step 1", "Cooldown step 2", "Cooldown step 3"]
  },
  "estimatedCalories": number,
  "equipmentNeeded": ["list of equipment"],
  "aiReasoning": "Brief explanation of why this workout suits the user"
}

Make each exercise and step actionable as a checklist item. Consider their goal, fitness level, and any constraints. Make it achievable yet challenging.
Return ONLY valid JSON, no markdown formatting.`;

        try {
            const response = await this._callOpenAI(prompt);
            return this._parseWorkoutResponse(response);
        } catch (error) {
            console.error('AI Workout Generation Error:', error);
            throw new Error('Failed to generate personalized workout');
        }
    }

    /**
     * Generate AI-powered coach recommendations with match scoring
     */
    async generateCoachRecommendations(userProfile, availableCoaches) {
        const prompt = `You are an AI matchmaking system for fitness coaches. Analyze the user's profile and rank coaches by compatibility.

User Profile:
- Goal: ${userProfile.goal}
- Requirements: ${userProfile.requirements || 'None'}
- Experience Level: ${this._calculateFitnessLevel(userProfile)}

Available Coaches:
${JSON.stringify(availableCoaches, null, 2)}

For each coach, provide a match score (0-100) and reasoning. Return JSON:
{
  "recommendations": [
    {
      "coachId": "coach ID",
      "matchScore": number (0-100),
      "reasoning": "Why this coach is a good match",
      "keyStrengths": ["strength1", "strength2"],
      "suggestedFocus": "What to focus on with this coach"
    }
  ]
}

Sort by matchScore (highest first). Return ONLY valid JSON, no markdown.`;

        try {
            const response = await this._callOpenAI(prompt);
            return this._parseCoachRecommendations(response);
        } catch (error) {
            console.error('AI Coach Matching Error:', error);
            throw new Error('Failed to generate coach recommendations');
        }
    }

    /**
     * Generate personalized session recommendations
     */
    async generateSessionRecommendations(userProfile, coachProfile, userHistory) {
        const prompt = `You are a fitness scheduling AI. Recommend optimal session types and focus areas.

User Profile:
- Goal: ${userProfile.goal}
- Current Stats: ${userProfile.heightCm}cm, ${userProfile.weightKg}kg
- Requirements: ${userProfile.requirements || 'None'}

Coach Expertise:
- Specializations: ${coachProfile.specializations?.join(', ') || 'General'}
- Experience: ${coachProfile.yearsExperience || 0} years

Recent Activity:
${userHistory?.recentWorkouts?.length || 0} workouts completed in last 7 days

Suggest 3-5 session focus areas with duration and intensity. Return JSON:
{
  "recommendations": [
    {
      "sessionType": "Type of session",
      "focus": "What to focus on",
      "suggestedDuration": number (minutes),
      "intensity": "low|moderate|high",
      "expectedBenefits": ["benefit1", "benefit2"],
      "priority": number (1-5, 1=highest)
    }
  ],
  "overallStrategy": "Brief explanation of the recommended approach"
}

Return ONLY valid JSON, no markdown.`;

        try {
            const response = await this._callOpenAI(prompt);
            return this._parseSessionRecommendations(response);
        } catch (error) {
            console.error('AI Session Recommendation Error:', error);
            throw new Error('Failed to generate session recommendations');
        }
    }

    /**
     * Analyze progress and provide adaptive recommendations
     */
    async analyzeProgress(userProfile, workoutHistory, metrics) {
        const prompt = `You are a fitness progress analysis AI. Analyze the user's progress and provide insights.

User Profile:
- Goal: ${userProfile.goal}
- Starting Weight: ${metrics.startingWeight || userProfile.weightKg}kg
- Current Weight: ${userProfile.weightKg}kg

Workout History Summary:
- Total Workouts: ${workoutHistory.totalWorkouts || 0}
- Avg Workouts/Week: ${workoutHistory.avgPerWeek || 0}
- Total Duration: ${workoutHistory.totalMinutes || 0} minutes

Provide analysis in JSON:
{
  "progressScore": number (0-100),
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "achievements": ["Achievement 1", "Achievement 2"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "nextSteps": ["Recommendation 1", "Recommendation 2"],
  "motivationalMessage": "Personalized encouragement"
}

Return ONLY valid JSON, no markdown.`;

        try {
            const response = await this._callOpenAI(prompt);
            return this._parseProgressAnalysis(response);
        } catch (error) {
            console.error('AI Progress Analysis Error:', error);
            throw new Error('Failed to analyze progress');
        }
    }

    /**
     * Call OpenAI GPT API
     */
    async _callOpenAI(prompt) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert fitness coach AI assistant. Provide responses in valid JSON format only, without markdown formatting.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        
        if (!text) {
            throw new Error('No response from AI');
        }

        return text;
    }

    /**
     * Parse and validate workout response
     */
    _parseWorkoutResponse(response) {
        try {
            // Remove markdown code blocks if present
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const workout = JSON.parse(cleanJson);
            
            // Validate required fields
            if (!workout.title || !workout.exercises) {
                throw new Error('Invalid workout structure');
            }
            
            return workout;
        } catch (error) {
            console.error('Parse error:', error, 'Response:', response);
            throw new Error('Failed to parse workout data');
        }
    }

    /**
     * Parse coach recommendations
     */
    _parseCoachRecommendations(response) {
        try {
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const data = JSON.parse(cleanJson);
            return data.recommendations || [];
        } catch (error) {
            console.error('Parse error:', error);
            throw new Error('Failed to parse coach recommendations');
        }
    }

    /**
     * Parse session recommendations
     */
    _parseSessionRecommendations(response) {
        try {
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Parse error:', error);
            throw new Error('Failed to parse session recommendations');
        }
    }

    /**
     * Parse progress analysis
     */
    _parseProgressAnalysis(response) {
        try {
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Parse error:', error);
            throw new Error('Failed to parse progress analysis');
        }
    }

    /**
     * Generate workout plan as a simple array of exercise strings
     */
    async generateWorkoutPlan(userProfile, customPrompt = null) {
        const prompt = customPrompt || `Generate a focused workout plan for ${userProfile.goal || 'general fitness'}. 
User: ${userProfile.heightCm}cm, ${userProfile.weightKg}kg. 
Requirements: ${userProfile.requirements || 'None'}.

Return exactly 5-7 exercises as a simple JSON array of strings. Each string should be a complete exercise description with reps/duration.
Example: ["Warm-up: 5 min jogging", "Push-ups: 3 sets of 12 reps", "Squats: 3 sets of 15 reps"]

Return ONLY the JSON array, no other text or markdown.`;

        try {
            const response = await this._callOpenAI(prompt, 'gpt-4o-mini', 0.7, 300);
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('AI Workout Plan Error:', error);
            // Return default plan on error
            return [
                'Warm-up: 5 minutes light cardio',
                'Main exercise set 1 (customize based on goal)',
                'Main exercise set 2 (customize based on goal)',
                'Strength training (20 minutes)',
                'Cool-down: 5 minutes stretching'
            ];
        }
    }

    /**
     * Calculate fitness level based on profile
     */
    _calculateFitnessLevel(userProfile) {
        const bmi = userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2);
        
        if (bmi < 18.5) return 'beginner (underweight)';
        if (bmi < 25) return 'intermediate (healthy weight)';
        if (bmi < 30) return 'beginner (overweight)';
        return 'beginner (obese - gentle approach needed)';
    }
}
