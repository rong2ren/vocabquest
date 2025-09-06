Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;
        const userEmail = userData.email;

        if (req.method === 'POST') {
            // Create/Update user profile
            const { full_name, role, grade_level, date_of_birth, parent_email, preferences } = await req.json();

            console.log('Creating/updating user profile for:', userId);

            // Check if user profile already exists
            const existingUserResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            const existingUsers = await existingUserResponse.json();
            const userExists = existingUsers && existingUsers.length > 0;

            const userProfileData = {
                id: userId,
                email: userEmail,
                full_name: full_name || 'Student User',
                role: role || 'student',
                grade_level: grade_level || 4,
                date_of_birth: date_of_birth || null,
                parent_email: parent_email || null,
                preferences: preferences || {},
                last_active: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (userExists) {
                // Update existing profile
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userProfileData)
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update user profile: ${errorText}`);
                }
            } else {
                // Create new profile
                userProfileData.created_at = new Date().toISOString();
                
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userProfileData)
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create user profile: ${errorText}`);
                }

                // Initialize gamification profile for new users
                const gamificationData = {
                    user_id: userId,
                    total_points: 0,
                    current_level: 1,
                    current_xp: 0,
                    xp_to_next_level: 100,
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity_date: new Date().toISOString().split('T')[0], // Today's date
                    words_learned: 0,
                    total_time_minutes: 0,
                    achievements_earned: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                await fetch(`${supabaseUrl}/rest/v1/user_gamification`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gamificationData)
                });

                // Assign default SSAT vocabulary list to new student users
                if (userProfileData.role === 'student') {
                    // Get the default SSAT vocabulary list
                    const defaultListResponse = await fetch(`${supabaseUrl}/rest/v1/vocabulary_lists?is_default=eq.true`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });

                    const defaultLists = await defaultListResponse.json();
                    if (defaultLists && defaultLists.length > 0) {
                        const defaultListId = defaultLists[0].id;

                        const userListAssignment = {
                            user_id: userId,
                            list_id: defaultListId,
                            assigned_at: new Date().toISOString(),
                            is_active: true,
                            progress_percentage: 0,
                            words_mastered: 0,
                            created_at: new Date().toISOString()
                        };

                        await fetch(`${supabaseUrl}/rest/v1/user_word_lists`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(userListAssignment)
                        });
                    }
                }

                // Create first daily goal
                const dailyGoalData = {
                    user_id: userId,
                    goal_date: new Date().toISOString().split('T')[0],
                    target_words: 10,
                    target_minutes: 20,
                    target_accuracy: 80.0,
                    words_completed: 0,
                    minutes_completed: 0,
                    current_accuracy: 0.0,
                    is_completed: false,
                    bonus_points: 0,
                    created_at: new Date().toISOString()
                };

                await fetch(`${supabaseUrl}/rest/v1/daily_goals`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dailyGoalData)
                });
            }

            return new Response(JSON.stringify({
                data: {
                    message: userExists ? 'Profile updated successfully' : 'Profile created successfully',
                    user_id: userId,
                    profile: userProfileData,
                    is_new_user: !userExists
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (req.method === 'GET') {
            // Get user profile and gamification data
            console.log('Fetching user profile for:', userId);

            const [profileResponse, gamificationResponse, dailyGoalResponse] = await Promise.all([
                fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }),
                fetch(`${supabaseUrl}/rest/v1/user_gamification?user_id=eq.${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }),
                fetch(`${supabaseUrl}/rest/v1/daily_goals?user_id=eq.${userId}&goal_date=eq.${new Date().toISOString().split('T')[0]}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                })
            ]);

            const profile = await profileResponse.json();
            const gamification = await gamificationResponse.json();
            const dailyGoal = await dailyGoalResponse.json();

            return new Response(JSON.stringify({
                data: {
                    profile: profile[0] || null,
                    gamification: gamification[0] || null,
                    daily_goal: dailyGoal[0] || null
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('User profile error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'USER_PROFILE_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});