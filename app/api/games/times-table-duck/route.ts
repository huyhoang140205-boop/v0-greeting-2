import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { score, duration, combo, metadata } = body

    // Insert game play record
    const { error: playError } = await supabase.from("game_plays").insert([
      {
        user_id: user.id,
        game_id: "times-table-duck",
        score,
        duration,
        combo,
        metadata,
      },
    ])

    if (playError) {
      console.error("Play insert error:", playError)
      return NextResponse.json({ error: playError.message }, { status: 400 })
    }

    // Upsert game scores
    const { data: existing } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", "times-table-duck")
      .single()

    const gameScore = {
      user_id: user.id,
      game_id: "times-table-duck",
      best_score: existing ? Math.max(existing.best_score, score) : score,
      last_score: score,
      plays_count: (existing?.plays_count || 0) + 1,
      max_combo: existing ? Math.max(existing.max_combo || 0, combo) : combo,
      average_score: existing
        ? (existing.average_score * existing.plays_count + score) / ((existing.plays_count || 0) + 1)
        : score,
      last_played: new Date().toISOString(),
    }

    const { error: scoreError } = await supabase.from("game_scores").upsert([gameScore], {
      onConflict: "user_id,game_id",
    })

    if (scoreError) {
      console.error("Score upsert error:", scoreError)
    }

    return NextResponse.json({ success: true, score: gameScore })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
