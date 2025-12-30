import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Cookie setting error
            }
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { level, score, isWin, character } = body

    const { error: playError } = await supabase.from("game_plays").insert({
      user_id: user.id,
      game_id: "math-duck-platformer",
      score: score,
      duration: 120,
      metadata: {
        level,
        isWin,
        character,
      },
    })

    if (playError) throw playError

    const { data: existingScore } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", "math-duck-platformer")
      .single()

    if (existingScore) {
      const { error: updateError } = await supabase
        .from("game_scores")
        .update({
          last_score: score,
          best_score: Math.max(existingScore.best_score || 0, score),
          plays_count: (existingScore.plays_count || 0) + 1,
          average_score:
            ((existingScore.average_score || 0) * (existingScore.plays_count || 0) + score) /
            ((existingScore.plays_count || 0) + 1),
          last_played: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("game_id", "math-duck-platformer")

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase.from("game_scores").insert({
        user_id: user.id,
        game_id: "math-duck-platformer",
        best_score: score,
        last_score: score,
        plays_count: 1,
        average_score: score,
        last_played: new Date().toISOString(),
      })

      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      message: "Score saved successfully",
      score,
      isWin,
    })
  } catch (error) {
    console.error("Error saving score:", error)
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 })
  }
}
