import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[v0] Missing Supabase environment variables!")
  console.error("[v0] SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING")
  console.error("[v0] SUPABASE_SERVICE_ROLE_KEY:", serviceRoleKey ? "SET" : "MISSING")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function verifyConnection() {
  console.log("[v0] Starting Supabase connection verification...")

  try {
    // Test 1: Check if we can query a table
    console.log("[v0] Test 1: Checking profiles table...")
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id").limit(1)

    if (profilesError) {
      console.error("[v0] Profiles table error:", profilesError.message)
    } else {
      console.log("[v0] Profiles table OK - Found", profiles?.length || 0, "records")
    }

    // Test 2: Check study_sets table
    console.log("[v0] Test 2: Checking study_sets table...")
    const { data: sets, error: setsError } = await supabase.from("study_sets").select("id").limit(1)

    if (setsError) {
      console.error("[v0] Study sets table error:", setsError.message)
    } else {
      console.log("[v0] Study sets table OK - Found", sets?.length || 0, "records")
    }

    // Test 3: Check flashcards table
    console.log("[v0] Test 3: Checking flashcards table...")
    const { data: cards, error: cardsError } = await supabase.from("flashcards").select("id").limit(1)

    if (cardsError) {
      console.error("[v0] Flashcards table error:", cardsError.message)
    } else {
      console.log("[v0] Flashcards table OK - Found", cards?.length || 0, "records")
    }

    // Test 4: Check user_stats table
    console.log("[v0] Test 4: Checking user_stats table...")
    const { data: stats, error: statsError } = await supabase.from("user_stats").select("id").limit(1)

    if (statsError) {
      console.error("[v0] User stats table error:", statsError.message)
    } else {
      console.log("[v0] User stats table OK - Found", stats?.length || 0, "records")
    }

    console.log("[v0] Connection verification complete!")
  } catch (error) {
    console.error("[v0] Verification failed:", error)
    process.exit(1)
  }
}

verifyConnection()
