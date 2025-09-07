const profileCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-id",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
}

Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: profileCorsHeaders })
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
    console.log("🔍 Using user ID from header:", userId)

    // Only handle GET requests - fast read-only queries
    if (req.method === "GET") {
      // Fetch user profile from database
      console.log("📊 Fetching profile for user ID:", userId)
      const profileResponse = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
        { headers: authHeaders }
      )
      const profileData = await profileResponse.json()
      console.log("📊 Profile data from DB:", profileData)
      
      // Fetch gamification data from database
      const gamificationResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_gamification?user_id=eq.${userId}`,
        { headers: authHeaders }
      )
      const gamificationData = await gamificationResponse.json()
      console.log("📊 Gamification data from DB:", gamificationData)
      
      const profile = profileData[0] || null
      const gamification = gamificationData[0] || null
      
      // Check if user needs initialization
      const needs_initialization = !profile || !gamification
      console.log("📊 Needs initialization:", needs_initialization)
      
      return profileJsonResponse({
        profile,
        gamification,
        needs_initialization,
      })
    }

    // Method not allowed for anything other than GET
    return new Response("Method not allowed", { status: 405, headers: profileCorsHeaders })

  } catch (error) {
    console.error("User profile error:", error.message, error.stack)
    return profileJsonResponse(
      { code: "USER_PROFILE_FAILED", message: error.message },
      500,
    )
  }
})

function profileJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...profileCorsHeaders, "Content-Type": "application/json" },
  })
}