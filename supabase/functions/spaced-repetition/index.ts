Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { user_id, word_id, is_correct, response_time_seconds, learning_mode } = await req.json();

        console.log('Processing spaced repetition update:', { user_id, word_id, is_correct, learning_mode });

        if (!user_id || !word_id || is_correct === undefined) {
            throw new Error('user_id, word_id, and is_correct are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get current progress for this word
        const progressResponse = await fetch(`${supabaseUrl}/rest/v1/user_progress?user_id=eq.${user_id}&word_id=eq.${word_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!progressResponse.ok) {
            throw new Error('Failed to fetch user progress');
        }

        const progressData = await progressResponse.json();
        let currentProgress = progressData[0] || null;

        // Child-optimized spaced repetition algorithm
        // Based on SM-2 but with 60-70% compressed intervals for elementary students
        const now = new Date();
        let newLevel, newEaseFactor, newInterval, newNextReview;
        let consecutiveCorrect = 0;
        let totalAttempts = 1;
        let totalCorrect = is_correct ? 1 : 0;
        let firstLearned = null;

        if (currentProgress) {
            // Existing progress - update
            consecutiveCorrect = is_correct ? (currentProgress.consecutive_correct + 1) : 0;
            totalAttempts = currentProgress.total_attempts + 1;
            totalCorrect = currentProgress.total_correct + (is_correct ? 1 : 0);
            firstLearned = currentProgress.first_learned;
        } else {
            // First attempt
            firstLearned = now.toISOString();
        }

        const successRate = (totalCorrect / totalAttempts) * 100;

        if (is_correct) {
            if (!currentProgress) {
                // First correct attempt
                newLevel = 1;
                newEaseFactor = 2.5;
                newInterval = 1; // 1 hour (compressed from adult 1 day)
            } else {
                const currentLevel = currentProgress.current_level || 0;
                const currentEase = currentProgress.ease_factor || 2.5;
                
                newLevel = currentLevel + 1;
                
                // Adjust ease factor based on response quality
                let easeAdjustment = 0;
                if (response_time_seconds) {
                    // Quick response (< 3 seconds) = easier, slow response (> 10 seconds) = harder
                    if (response_time_seconds < 3) {
                        easeAdjustment = 0.1;
                    } else if (response_time_seconds > 10) {
                        easeAdjustment = -0.1;
                    }
                }
                
                newEaseFactor = Math.max(1.3, Math.min(3.0, currentEase + easeAdjustment));
                
                // Child-optimized interval progression (60-70% of adult intervals)
                if (newLevel === 1) {
                    newInterval = 6; // 6 hours (compressed from 1 day)
                } else if (newLevel === 2) {
                    newInterval = 24; // 1 day (compressed from 6 days)
                } else {
                    // Progressive intervals with compression factor
                    const baseInterval = Math.round(currentProgress.interval_days * newEaseFactor * 0.65); // 65% compression
                    newInterval = Math.min(baseInterval, 720); // Max 30 days (720 hours)
                }
            }
        } else {
            // Incorrect response - reset with short retry interval
            newLevel = Math.max(0, (currentProgress?.current_level || 0) - 1);
            newEaseFactor = Math.max(1.3, (currentProgress?.ease_factor || 2.5) - 0.2);
            newInterval = 1; // 1 hour retry
        }

        // Calculate next review time
        newNextReview = new Date(now.getTime() + (newInterval * 60 * 60 * 1000)); // Convert hours to milliseconds

        // Determine if word is "learned" (level 4+ with good success rate)
        const isLearned = newLevel >= 4 && successRate >= 80;

        const progressUpdate = {
            user_id,
            word_id,
            current_level: newLevel,
            ease_factor: newEaseFactor,
            interval_days: newInterval,
            last_reviewed: now.toISOString(),
            next_review: newNextReview.toISOString(),
            consecutive_correct: consecutiveCorrect,
            total_attempts: totalAttempts,
            total_correct: totalCorrect,
            success_rate: successRate,
            first_learned: firstLearned,
            is_learned: isLearned,
            updated_at: now.toISOString()
        };

        if (currentProgress) {
            // Update existing progress
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_progress?id=eq.${currentProgress.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(progressUpdate)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update progress: ${errorText}`);
            }
        } else {
            // Insert new progress
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_progress`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(progressUpdate)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to insert progress: ${errorText}`);
            }
        }

        // Calculate points earned based on performance
        let pointsEarned = 0;
        if (is_correct) {
            pointsEarned = 10; // Base points for correct answer
            
            // Bonus points for consecutive correct answers
            if (consecutiveCorrect >= 5) {
                pointsEarned += 5;
            }
            
            // Bonus for quick response
            if (response_time_seconds && response_time_seconds < 5) {
                pointsEarned += 5;
            }
            
            // Bonus for learning new word
            if (newLevel === 1) {
                pointsEarned += 10;
            }
            
            // Bonus for mastering word
            if (isLearned && !currentProgress?.is_learned) {
                pointsEarned += 25;
            }
        }

        // Log the learning activity
        const activityData = {
            user_id,
            activity_type: `${learning_mode || 'review'}_attempt`,
            activity_data: {
                word_id,
                is_correct,
                response_time_seconds,
                points_earned: pointsEarned,
                new_level: newLevel,
                success_rate: successRate
            },
            points_earned: pointsEarned
        };

        await fetch(`${supabaseUrl}/rest/v1/activity_log`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });

        console.log('Spaced repetition update completed successfully');

        return new Response(JSON.stringify({
            data: {
                message: 'Progress updated successfully',
                progress: {
                    current_level: newLevel,
                    next_review: newNextReview.toISOString(),
                    interval_hours: newInterval,
                    success_rate: successRate,
                    is_learned: isLearned,
                    consecutive_correct: consecutiveCorrect
                },
                points_earned: pointsEarned
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Spaced repetition error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'SPACED_REPETITION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});