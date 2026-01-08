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
     * Generate workout plan based on pre-session AI analysis
     */
    async generateWorkoutFromAnalysis(userProfile, savedAnalysis) {
        const analysisText = savedAnalysis.analysis || '';
        const sessionGoal = savedAnalysis.sessionGoal || 'general fitness';
        const sessionHistory = savedAnalysis.sessionHistory || [];
        
        // Extract past exercises to avoid repetition
        const pastExercises = sessionHistory
            .filter(s => s.coachNotes)
            .map(s => s.coachNotes)
            .join(' ')
            .toLowerCase();
        
        const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][new Date().getDay()];
        const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
        const variationSeed = Math.floor(Math.random() * 1000);
        
        const customPrompt = `Based on the pre-session coaching analysis, generate a UNIQUE workout plan that builds on past sessions.

USER PROFILE:
- Goal: ${sessionGoal}
- Height: ${userProfile.heightCm || 170}cm
- Weight: ${userProfile.weightKg || 70}kg
- Requirements: ${userProfile.requirements || 'None'}
- Session: ${timeOfDay} ${dayOfWeek}

PRE-SESSION ANALYSIS:
${analysisText}

PAST SESSION HISTORY (${sessionHistory.length} sessions):
${sessionHistory.length > 0 ? 
    sessionHistory.map((s, i) => {
        const date = new Date(s.scheduledAt?.toMillis?.() || s.createdAt?.toMillis?.()).toLocaleDateString();
        return `${i+1}. ${s.goal} (${date})${s.coachNotes ? '\n   Coach Notes: ' + s.coachNotes : ''}`;
    }).join('\n') :
    'No previous sessions with this coach.'
}

CRITICAL REQUIREMENTS:
1. AVOID REPETITION: Don't repeat exercises from past sessions (past exercises mentioned: ${pastExercises.substring(0, 200)})
2. BUILD PROGRESSION: Based on coach notes, make this session appropriately more challenging
3. ADDRESS ANALYSIS: Specifically target areas mentioned in the pre-session analysis
4. BE CREATIVE: Use variation seed ${variationSeed} to ensure uniqueness
5. FRESH APPROACH: Try different training styles, rep schemes, or exercise combinations

Generate 5-7 NEW exercises that:
- Complement the coaching insights from the analysis
- Avoid repeating past session exercises
- Progress appropriately from previous sessions
- Match the ${timeOfDay} energy levels

Return exactly 5-7 exercises as a JSON array of strings. Each should be actionable and specific.

Examples of VARIED exercises:
- "Warm-up: Cat-cow stretches and shoulder rolls (4 minutes)"
- "Single-leg deadlifts: 3 sets of 8 reps per leg with focus on balance"
- "Resistance band chest flies: 4 sets of 12 reps with slow control"
- "Bear crawl to downward dog: 3 rounds of 30 seconds"
- "Wall sits with arm raises: 3 sets of 45 seconds"

Return ONLY a JSON array of strings, no other text or markdown.`;

        return this.generateWorkoutPlan(userProfile, customPrompt);
    }

    /**
     * Generate personalized workout considering recent workout history to avoid repetition
     */
    async generatePersonalizedWorkoutWithHistory(userProfile, recentWorkouts = []) {
        console.log('🏋️ generatePersonalizedWorkoutWithHistory called:', {
            userProfile: userProfile.goal || 'no goal',
            recentWorkoutsCount: recentWorkouts.length,
            recentWorkouts: recentWorkouts.slice(0, 2), // First 2 for debugging
            hasAPIKey: !!this.apiKey,
            apiKeyLength: this.apiKey ? this.apiKey.length : 0
        });
        
        // Check API key first
        if (!this.apiKey) {
            console.warn('❌ No OpenAI API key found - returning fallback');
            return this.getRandomFallbackWorkout();
        }
        // Extract exercises from recent workouts to avoid repetition
        const recentExercises = recentWorkouts
            .flatMap(w => {
                // Handle both ai_workouts format and workoutSessions format
                if (w.exercises) {
                    return Array.isArray(w.exercises) ? w.exercises : [w.exercises];
                }
                if (w.workout && w.workout.exercises) {
                    return Array.isArray(w.workout.exercises) ? w.workout.exercises : [w.workout.exercises];
                }
                return [];
            })
            .map(ex => (typeof ex === 'string' ? ex : ex.name || ex.exercise || ex.description || ''))
            .filter(ex => ex.length > 0)
            .join(' ')
            .toLowerCase();
            
        console.log('🔍 Recent exercises to avoid:', recentExercises.substring(0, 100) + '...');
            
        const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][new Date().getDay()];
        const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
        const variationSeed = Math.floor(Math.random() * 1000);
        
        const prompt = `You are an experienced fitness coach designing a progressive workout plan.

🎲 UNIQUE SESSION: ${Date.now()}-${Math.random().toString(36).substring(2)}
⚡ FORCE CREATIVITY: Generate a completely different workout structure

User Profile:
- Height: ${userProfile.heightCm || 170}cm (${userProfile.heightCm ? 'actual' : 'average'})
- Weight: ${userProfile.weightKg || 70}kg (${userProfile.weightKg ? 'actual' : 'average'})
- Primary Goal: ${userProfile.goal || 'general fitness'}
- Requirements/Constraints: ${userProfile.requirements || 'None'}
- Fitness Level: ${this._calculateFitnessLevel(userProfile)}
- Session: ${timeOfDay} ${dayOfWeek}
- Variation ID: ${variationSeed}
- Timestamp: ${Date.now()}
- Random Factor: ${Math.random().toFixed(3)}

RECENT WORKOUT HISTORY (avoid exact repetition):
${recentWorkouts.length > 0 ? 
    recentWorkouts.map((w, i) => {
        const exercises = w.exercises || w.workout?.exercises || [];
        const exerciseList = Array.isArray(exercises) ? exercises.join(', ') : exercises;
        return `Previous Workout ${i + 1}: ${exerciseList}`;
    }).join('\n') :
    'No recent workouts found'
}

SPECIFIC EXERCISES TO AVOID:
${recentExercises.length > 10 ? 
    'Recent exercises: ' + recentExercises.substring(0, 200) + '...' : 
    'No recent exercise history available'
}

COACHING GUIDELINES:
• Design a balanced workout with proper progression
• Vary exercises from recent sessions while maintaining effectiveness  
• Include appropriate warm-up, main work, and cool-down phases
• Use proven exercise techniques with clear instructions
• Adjust intensity based on user's fitness level and goals
• Ensure exercises are safe for home environment
• Session timing: ${timeOfDay} - adjust intensity accordingly
• MANDATORY: Create a unique workout structure, NOT the generic 7-exercise pattern

GENERATE A DIFFERENT WORKOUT STRUCTURE:
Instead of the banned pattern above, use alternatives like:
✅ "Dynamic warm-up: Arm circles and leg swings (4 minutes)"
✅ "Circuit training: 3 rounds of bodyweight exercises (15 minutes)" 
✅ "Core strengthening: Dead bug exercise 2 sets of 8 each side"
✅ "Upper body: Wall push-ups 2 sets of 10 reps"
✅ "Lower body: Step-ups on sturdy surface 2 sets of 12 each leg"
✅ "Active recovery: Walking in place with arm movements (5 minutes)"
✅ "Flexibility focus: Targeted stretches for worked muscles (4 minutes)"
• MANDATORY: Create a unique workout structure, NOT the generic 7-exercise pattern

GENERATE A DIFFERENT WORKOUT STRUCTURE:
Instead of the banned pattern above, use alternatives like:
✅ "Dynamic warm-up: Arm circles and leg swings (4 minutes)"
✅ "Circuit training: 3 rounds of bodyweight exercises (15 minutes)" 
✅ "Core strengthening: Dead bug exercise 2 sets of 8 each side"
✅ "Upper body: Wall push-ups 2 sets of 10 reps"
✅ "Lower body: Step-ups on sturdy surface 2 sets of 12 each leg"
✅ "Active recovery: Walking in place with arm movements (5 minutes)"
✅ "Flexibility focus: Targeted stretches for worked muscles (4 minutes)"

Generate exactly 5-7 professional exercises as a JSON array of strings.
IMPORTANT: Each response MUST be different. Use this unique identifier: ${Date.now()}-${Math.random()}

Instead of the banned exercises above, create variations like:
✅ "Movement preparation: Joint circles and gentle stretches (4 minutes)"
✅ "Strength circuit: 3 exercises, 45s work/15s rest, 2 rounds"
✅ "Core training: Bird dog holds 2 sets of 30 seconds each side"
✅ "Upper body: Incline push-ups against wall 2 sets of 8 reps"
✅ "Leg strengthening: Chair-supported squats 2 sets of 10 reps"
✅ "Active cool-down: Gentle walking with arm swings (5 minutes)"

Return exactly 5-7 exercises as a JSON array of strings. MAKE IT UNIQUE!`;

        try {
            console.log('📝 Full workout prompt being sent to AI:', prompt.substring(0, 500) + '...');
            const response = await this._callOpenAI(prompt, 'gpt-4o-mini', 1.2, 400);
            console.log('🔄 Raw AI response:', response);
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            console.log('🧹 Cleaned JSON:', cleanJson);
            const parsed = JSON.parse(cleanJson);
            
            console.log('🎯 Workout generation successful:', {
                isArray: Array.isArray(parsed),
                exerciseCount: parsed?.length || 0,
                exercises: parsed
            });
            
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('❌ AI Workout with History Error:', {
                errorMessage: error.message,
                errorType: error.name,
                isJSONError: error.message.includes('JSON'),
                isNetworkError: error.message.includes('fetch') || error.message.includes('network'),
                isAPIError: error.message.includes('API'),
                fullError: error.toString(),
                stack: error.stack?.split('\n').slice(0, 3)
            });
            console.log('🔄 Using fallback workout due to error above...');
            // Return professional coaching plans based on goal (AVOID REPETITIVE PATTERN)
            const goalBasedDefaults = {
                'weight loss': [
                    'Joint mobility: Gentle circles and stretches (4 minutes)',
                    'Cardio circuit: Marching, step-touches, arm movements (10 minutes)',
                    'Strength training: Wall sits 2 sets of 20 seconds',
                    'Upper body: Modified push-ups 2 sets of 6-8 reps',
                    'Core engagement: Standing side bends 2 sets of 10 each side',
                    'Cool-down walk: Gentle movement with deep breathing (4 minutes)'
                ],
                'muscle gain': [
                    'Movement prep: Dynamic stretching and activation (4 minutes)',
                    'Strength focus: Bodyweight squats 3 sets of 8-10 reps',
                    'Upper body work: Incline push-ups 3 sets of 6-8 reps',
                    'Core stability: Modified side planks 2 sets of 15 seconds each',
                    'Functional training: Single-leg stands 2 sets of 30 seconds each',
                    'Flexibility session: Full body stretches and mobility (5 minutes)'
                ]
            };
            
            const goal = userProfile.goal?.toLowerCase() || 'general fitness';
            return goalBasedDefaults[goal] || goalBasedDefaults['weight loss'];
        }
    }

    /**
     * Generate comprehensive coaching insights for pre-session review
     */
    async generateCoachingInsights({ prompt, userProfile, workoutHistory, sessionGoal }) {
        console.log('🧠 generateCoachingInsights called:', {
            sessionGoal,
            userProfileGoal: userProfile?.goal,
            workoutHistoryCount: workoutHistory?.length || 0,
            promptLength: prompt?.length || 0
        });
        
        try {
            // Call OpenAI without JSON formatting for readable coaching insights
            const response = await this._callOpenAIText(prompt, 'gpt-4o-mini', 0.7, 1500);
            
            // Clean up any markdown code blocks that might appear
            const cleanResponse = response
                .replace(/```html\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/`/g, '')
                .trim();
            
            return cleanResponse;
        } catch (error) {
            console.error('AI Coaching Insights Error:', error);
            
            // Return a helpful fallback analysis
            return `<div class="space-y-3">
<div><strong>🎯 Session Focus</strong><br>
• ${sessionGoal || 'General fitness improvement'} with form assessment<br>
• ${workoutHistory.length > 0 ? 'Building on previous progress' : 'Establishing baseline fitness level'}</div>

<div><strong>📊 Past Progress Review</strong><br>
${workoutHistory.length > 0 ? 
    `• ${workoutHistory.length} previous sessions completed<br>• Review past performance and form improvements` : 
    '• No previous session data available<br>• Focus on initial assessment and goal setting'}</div>

<div><strong>⚠️ Key Considerations</strong><br>
• Focus on proper form over intensity<br>
• Monitor for fatigue and adjust accordingly<br>
• Ensure adequate hydration and rest periods</div>

<div><strong>🔥 Session Strategy</strong><br>
• Start with assessment and warm-up<br>
• Build confidence through achievable goals<br>
• Provide positive reinforcement throughout</div>

<div class="text-sm text-gray-600 mt-2"><em>AI analysis unavailable - manual assessment recommended</em></div>
</div>`;
        }
    }

    /**
     * Call OpenAI GPT API for text responses (not JSON)
     */
    async _callOpenAIText(prompt, model = null, temperature = 0.7, maxTokens = 2048) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model || this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert fitness coach AI assistant. Provide clear, helpful coaching insights in readable text format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: maxTokens
                // No response_format specified = plain text response
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
     * Call OpenAI GPT API
     */
    async _callOpenAI(prompt, model = null, temperature = 0.7, maxTokens = 2048) {
        console.log('🌐 OpenAI API Call Starting:', {
            model: model || this.model,
            temperature,
            maxTokens,
            hasApiKey: !!this.apiKey,
            promptLength: prompt.length,
            promptPreview: prompt.substring(0, 200) + '...'
        });
        
        try {
            const requestBody = {
                model: model || this.model,
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
                temperature: temperature,
                max_tokens: maxTokens,
                response_format: { type: "json_object" }
            };
            
            console.log('📤 Making OpenAI request...', {
                endpoint: this.apiEndpoint,
                modelUsed: requestBody.model,
                messageCount: requestBody.messages.length
            });
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 OpenAI response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries([...response.headers.entries()])
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ OpenAI API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ OpenAI response data:', {
                hasChoices: !!data.choices,
                choicesLength: data.choices?.length || 0,
                hasContent: !!data.choices?.[0]?.message?.content,
                contentLength: data.choices?.[0]?.message?.content?.length || 0,
                usage: data.usage
            });
            
            const text = data.choices?.[0]?.message?.content;
            
            if (!text) {
                console.error('❌ No content in OpenAI response:', data);
                throw new Error('No response from AI');
            }

            console.log('🔤 OpenAI response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return text;
        } catch (error) {
            console.error('💥 OpenAI API call failed:', {
                errorMessage: error.message,
                errorName: error.name,
                errorStack: error.stack?.split('\n')[0],
                isNetworkError: !error.status,
                apiKeyPresent: !!this.apiKey
            });
            throw error;
        }
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
        // Add variation factors to ensure different workouts each time
        const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][new Date().getDay()];
        const sessionTime = new Date().getHours();
        const timeOfDay = sessionTime < 12 ? 'morning' : sessionTime < 17 ? 'afternoon' : 'evening';
        const variationSeed = Math.floor(Math.random() * 1000);
        
        const prompt = customPrompt || `Generate a UNIQUE and VARIED workout plan for a ${timeOfDay} ${dayOfWeek} session.

User Profile:
- Height: ${userProfile.heightCm || 170}cm
- Weight: ${userProfile.weightKg || 70}kg
- Primary Goal: ${userProfile.goal || 'general fitness'}
- Requirements/Constraints: ${userProfile.requirements || 'None'}
- Fitness Level: ${this._calculateFitnessLevel(userProfile)}

IMPORTANT INSTRUCTIONS:
1. Create a DIFFERENT workout than usual - vary exercises, order, intensity, and rep schemes
2. Consider the time of day (${timeOfDay}) and day of week (${dayOfWeek}) for energy levels
3. Include ${5 + Math.floor(Math.random() * 3)} exercises (5-7 total)
4. Mix different muscle groups and training styles
5. Be creative with exercise variations and combinations
6. Variation seed: ${variationSeed} (use this to ensure uniqueness)

Return exactly 5-7 exercises as a JSON array of strings. Each string should be a complete, actionable exercise description with sets/reps/duration.

Examples:
- "Warm-up: Dynamic leg swings and arm circles (3 minutes)"
- "Decline push-ups: 4 sets of 8-10 reps with 60s rest"
- "Bulgarian split squats: 3 sets of 12 reps per leg"
- "Plank to downward dog flow: 3 rounds of 45 seconds"

Return ONLY a JSON array of strings, no other text or markdown.
Make this workout DIFFERENT and FRESH!`;

        try {
            const response = await this._callOpenAI(prompt, 'gpt-4o-mini', 0.7, 400);
            const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('AI Workout Plan Error:', error);
            // Return NON-REPETITIVE fallback plan
            const uniqueFallback = [
                'Movement preparation: Joint rotations and gentle stretches (4 minutes)',
                'Strength circuit: Bodyweight exercises 2 rounds of 30s work/15s rest',
                'Core training: Modified planks and side bends 8 minutes',
                'Balance practice: Single-leg stands with arm movements (3 minutes)',
                'Active recovery: Walking movements with deep breathing (5 minutes)'
            ];
            console.log('⚠️ MAIN FALLBACK WORKOUT USED:', uniqueFallback);
            return uniqueFallback;
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
