const initCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
}

Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: initCorsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase env vars not configured")
    }

    const authHeaders = {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    }

    // Get user ID from custom header (passed from frontend)
    const userId = req.headers.get("X-User-ID")
    if (!userId) {
      throw new Error("No user ID provided")
    }

    // Only handle POST requests for initialization
    if (req.method === "POST") {
      const {
        full_name,
        role,
        grade_level,
        date_of_birth,
        parent_email,
        preferences,
      } = await req.json()

      const now = new Date()
      const isoNow = now.toISOString()
      const today = isoNow.split("T")[0]

      // Check if user profile already exists
      const existingProfile = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
        { headers: authHeaders },
      ).then((r) => r.json())
      
      const isNewUser = existingProfile.length === 0

      if (!isNewUser) {
        return initJsonResponse({
          message: "User already initialized",
          is_new_user: false,
        })
      }

      // Create user profile
      const profileData = {
        id: userId,
        email: userData.email,
        full_name: full_name ?? "Student User",
        role: role ?? "student",
        grade_level: grade_level ?? 4,
        date_of_birth: date_of_birth ?? null,
        parent_email: parent_email ?? null,
        preferences: preferences ?? {},
        last_active: isoNow,
        updated_at: isoNow,
        created_at: isoNow,
      }

      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })
      
      if (!profileResponse.ok) {
        throw new Error(await profileResponse.text())
      }

      // Initialize gamification
      const gamificationData = {
        user_id: userId,
        total_points: 0,
        current_level: 1,
        current_xp: 0,
        xp_to_next_level: 100,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: today,
        words_learned: 0,
        total_time_minutes: 0,
        achievements_earned: 0,
        created_at: isoNow,
        updated_at: isoNow,
      }

      await fetch(`${supabaseUrl}/rest/v1/user_gamification`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(gamificationData),
      })

      // Assign default vocabulary list for students
      if (profileData.role === "student") {
        const defaultLists = await fetch(
          `${supabaseUrl}/rest/v1/vocabulary_lists?is_default=eq.true`,
          { headers: authHeaders },
        ).then((r) => r.json())

        if (defaultLists.length > 0) {
          const assignment = {
            user_id: userId,
            list_id: defaultLists[0].id,
            assigned_at: isoNow,
            is_active: true,
            progress_percentage: 0,
            words_mastered: 0,
            created_at: isoNow,
          }
          
          await fetch(`${supabaseUrl}/rest/v1/user_word_lists`, {
            method: "POST",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify(assignment),
          })
        }
      }

      return initJsonResponse({
        message: "User initialized successfully",
        profile: profileData,
        is_new_user: true,
      })
    }

    // Method not allowed for anything other than POST
    return new Response("Method not allowed", { status: 405, headers: initCorsHeaders })

  } catch (error) {
    console.error("User initialization error:", error.message, error.stack)
    return initJsonResponse(
      { code: "USER_INITIALIZATION_FAILED", message: error.message },
      500,
    )
  }
})

function initJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...initCorsHeaders, "Content-Type": "application/json" },
  })
}
