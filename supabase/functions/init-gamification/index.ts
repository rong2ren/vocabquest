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
        console.log('Starting gamification system initialization...');

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Default badges configuration
        const defaultBadges = [
            {
                name: "First Steps",
                description: "Complete your first vocabulary learning session",
                icon_url: "/images/badges/first-steps.png",
                category: "beginner",
                requirements: { first_session_complete: true },
                points_reward: 50
            },
            {
                name: "Quick Learner",
                description: "Learn 5 words in a single session",
                icon_url: "/images/badges/quick-learner.png",
                category: "achievement",
                requirements: { words_in_session: 5 },
                points_reward: 75
            },
            {
                name: "Spelling Champion",
                description: "Get 10 spelling questions correct in a row",
                icon_url: "/images/badges/spelling-champion.png",
                category: "skill",
                requirements: { spelling_streak: 10 },
                points_reward: 100
            },
            {
                name: "Synonym Master",
                description: "Correctly identify 25 synonyms",
                icon_url: "/images/badges/synonym-master.png",
                category: "skill",
                requirements: { synonyms_correct: 25 },
                points_reward: 125
            },
            {
                name: "Definition Detective",
                description: "Match 50 words to their definitions",
                icon_url: "/images/badges/definition-detective.png",
                category: "skill",
                requirements: { definitions_correct: 50 },
                points_reward: 150
            },
            {
                name: "Week Warrior",
                description: "Study vocabulary for 7 consecutive days",
                icon_url: "/images/badges/week-warrior.png",
                category: "streak",
                requirements: { daily_streak: 7 },
                points_reward: 200
            },
            {
                name: "Month Master",
                description: "Study vocabulary for 30 consecutive days",
                icon_url: "/images/badges/month-master.png",
                category: "streak",
                requirements: { daily_streak: 30 },
                points_reward: 500
            },
            {
                name: "Vocabulary Virtuoso",
                description: "Master 100 vocabulary words",
                icon_url: "/images/badges/vocabulary-virtuoso.png",
                category: "mastery",
                requirements: { words_mastered: 100 },
                points_reward: 750
            },
            {
                name: "Accuracy Ace",
                description: "Maintain 90% accuracy for 20 sessions",
                icon_url: "/images/badges/accuracy-ace.png",
                category: "skill",
                requirements: { accuracy_sessions: 20, min_accuracy: 90 },
                points_reward: 300
            },
            {
                name: "Study Streak Star",
                description: "Complete daily goals for 14 days straight",
                icon_url: "/images/badges/study-streak-star.png",
                category: "streak",
                requirements: { goal_streak: 14 },
                points_reward: 400
            }
        ];

        console.log('Inserting default badges...');
        const badgesResponse = await fetch(`${supabaseUrl}/rest/v1/badges`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(defaultBadges)
        });

        if (!badgesResponse.ok) {
            const errorText = await badgesResponse.text();
            console.error('Failed to insert badges:', errorText);
            throw new Error(`Failed to insert badges: ${errorText}`);
        }

        // Default challenges configuration
        const now = new Date().toISOString();
        const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const defaultChallenges = [
            {
                title: "Daily Word Explorer",
                description: "Learn 5 new words today",
                challenge_type: "daily",
                requirements: { target_new_words: 5 },
                rewards: { points: 50, badge_progress: true },
                start_date: null,
                end_date: null,
                is_active: true
            },
            {
                title: "Spelling Success",
                description: "Get 10 spelling questions correct today",
                challenge_type: "daily",
                requirements: { target_spelling_correct: 10 },
                rewards: { points: 75, badge_progress: true },
                start_date: null,
                end_date: null,
                is_active: true
            },
            {
                title: "Quiz Champion",
                description: "Complete 3 quiz sessions with 80% accuracy or higher",
                challenge_type: "daily",
                requirements: { target_quiz_sessions: 3, min_accuracy: 80 },
                rewards: { points: 100, badge_progress: true },
                start_date: null,
                end_date: null,
                is_active: true
            },
            {
                title: "Weekly Word Master",
                description: "Learn 35 new words this week",
                challenge_type: "weekly",
                requirements: { target_new_words: 35 },
                rewards: { points: 300, special_badge: true },
                start_date: now,
                end_date: weekLater,
                is_active: true
            },
            {
                title: "Consistency Champion",
                description: "Study vocabulary every day this week",
                challenge_type: "weekly",
                requirements: { target_study_days: 7 },
                rewards: { points: 250, streak_bonus: 1.5 },
                start_date: now,
                end_date: weekLater,
                is_active: true
            },
            {
                title: "SSAT Preparation Master",
                description: "Complete all 200 SSAT vocabulary words with 85% mastery",
                challenge_type: "monthly",
                requirements: { target_words_mastered: 200, min_mastery_rate: 85 },
                rewards: { points: 1000, special_title: "SSAT Ready", certificate: true },
                start_date: now,
                end_date: monthLater,
                is_active: true
            }
        ];

        console.log('Inserting default challenges...');
        const challengesResponse = await fetch(`${supabaseUrl}/rest/v1/challenges`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(defaultChallenges)
        });

        if (!challengesResponse.ok) {
            const errorText = await challengesResponse.text();
            console.error('Failed to insert challenges:', errorText);
            throw new Error(`Failed to insert challenges: ${errorText}`);
        }

        console.log('Gamification system initialized successfully');

        return new Response(JSON.stringify({
            data: {
                message: 'Gamification system initialized successfully',
                badges_created: defaultBadges.length,
                challenges_created: defaultChallenges.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Gamification initialization error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'GAMIFICATION_INIT_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});