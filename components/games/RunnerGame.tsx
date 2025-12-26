"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

interface PhysicsPuzzleGameProps {
  onBack: () => void
}

interface Block {
  id: string
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  value: number
  color: string
  rotation: number
}

export default function PhysicsPuzzleGame({ onBack }: PhysicsPuzzleGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [score, setScore] = useState(0)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [targetSum, setTargetSum] = useState(15)
  const [gameWon, setGameWon] = useState(false)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const gameLoopRef = useRef<number | null>(null)

  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Khi component mount: lấy user và bắt đầu thời gian
  useEffect(() => {
    startTimeRef.current = Date.now()
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        setUserId(data.user?.id ?? null)
      } catch (err) {
        console.error("Lỗi lấy user:", err)
      }
    })()

    return () => {
      mounted = false
      if (gameLoopRef.current) {
        window.clearInterval(gameLoopRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Physics simulation + rendering loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const GRAVITY = 0.5
    const FRICTION = 0.98
    const BOUNCE = 0.6

    const gameLoop = () => {
      // Clear
      ctx.fillStyle = "#1e293b"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Ground
      ctx.fillStyle = "#64748b"
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40)

      // Update physics and draw
      setBlocks((prevBlocks) => {
        const updated = prevBlocks.map((block) => {
          const newBlock = { ...block }

          // Gravity
          newBlock.vy += GRAVITY

          // Friction
          newBlock.vx *= FRICTION

          // Position
          newBlock.x += newBlock.vx
          newBlock.y += newBlock.vy

          // Bounds
          if (newBlock.x < 0) {
            newBlock.x = 0
            newBlock.vx *= -BOUNCE
          }
          if (newBlock.x + newBlock.width > canvas.width) {
            newBlock.x = canvas.width - newBlock.width
            newBlock.vx *= -BOUNCE
          }

          // Ground collision
          if (newBlock.y + newBlock.height > canvas.height - 40) {
            newBlock.y = canvas.height - 40 - newBlock.height
            newBlock.vy *= -BOUNCE
            newBlock.vx *= FRICTION
          }

          // Rotation
          newBlock.rotation += newBlock.vx * 0.1

          return newBlock
        })

        // Draw
        updated.forEach((block) => {
          ctx.save()
          ctx.translate(block.x + block.width / 2, block.y + block.height / 2)
          ctx.rotate(block.rotation)

          ctx.fillStyle = block.color
          ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height)

          if (selectedBlock === block.id) {
            ctx.strokeStyle = "#fbbf24"
            ctx.lineWidth = 3
            ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height)
          }

          ctx.fillStyle = "#fff"
          ctx.font = "bold 20px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(String(block.value), 0, 0)

          ctx.restore()
        })

        return updated
      })
    }

    gameLoopRef.current = window.setInterval(gameLoop, 1000 / 60)
    return () => {
      if (gameLoopRef.current) {
        window.clearInterval(gameLoopRef.current)
      }
    }
    // selectedBlock intentionally in deps so selection changes will highlight next frame
  }, [selectedBlock])

  // Click selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clicked = blocks.find((block) => {
      return x > block.x && x < block.x + block.width && y > block.y && y < block.y + block.height
    })

    if (clicked) {
      setSelectedBlock(clicked.id)
    } else {
      setSelectedBlock(null)
    }
  }

  // Add block
  const addBlock = (value: number) => {
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"]
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      x: Math.random() * 300,
      y: 0,
      width: 50,
      height: 50,
      vx: Math.random() * 2 - 1,
      vy: 0,
      value,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: 0,
    }

    setBlocks((prev) => [...prev, newBlock])
  }

  // Save game result to Supabase:
  // - ensure game row exists
  // - insert into game_plays
  // - upsert into game_scores
  const saveGameResult = async (opts: {
    user_id: string
    score: number
    duration: number
    combo?: number
    metadata?: any
  }) => {
    const { user_id, score: finalScore, duration, combo = 0, metadata = {} } = opts
    const gameSlug = "physics-puzzle"

    try {
      // 1) Ensure game exists (get or create)
      const { data: gameRow, error: gameErr } = await supabase
        .from("game")
        .select("id")
        .eq("slug", gameSlug)
        .maybeSingle()

      if (gameErr) {
        console.error("Lỗi khi lấy game:", gameErr)
        return
      }

      let game_id: string
      if (gameRow && gameRow.id) {
        game_id = gameRow.id
      } else {
        // create game record
        const { data: created, error: createErr } = await supabase.from("game").insert({
          slug: gameSlug,
          title: "Physics Puzzle",
          description: "Physics puzzle where you sum blocks to reach target",
          category: "puzzle",
          difficulty: "normal",
          is_active: true,
        }).select("id").single()

        if (createErr) {
          console.error("Lỗi khi tạo game:", createErr)
          return
        }
        game_id = created.id
      }

      // 2) Insert into game_plays
      const { error: playErr } = await supabase.from("game_plays").insert({
        user_id,
        game_id,
        score: finalScore,
        played_at: new Date().toISOString(),
        duration: Math.round(duration), // seconds
        combo,
        metadata,
      })

      if (playErr) {
        console.error("Lỗi insert game_plays:", playErr)
        // continue to try updating scores anyway
      }

      // 3) Upsert game_scores (select then insert/update)
      const { data: existingScores, error: scoreSelectErr } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", user_id)
        .eq("game_id", game_id)
        .maybeSingle()

      if (scoreSelectErr) {
        console.error("Lỗi select game_scores:", scoreSelectErr)
      }

      if (existingScores && existingScores.id) {
        // update
        const plays_count = (existingScores.plays_count || 0) + 1
        const best_score = Math.max(existingScores.best_score || 0, finalScore)
        const max_combo = Math.max(existingScores.max_combo || 0, combo)
        // recalc average_score: (avg * prev_count + finalScore) / new_count
        const prev_avg = Number(existingScores.average_score || 0)
        const prev_count = Number(existingScores.plays_count || 0)
        const new_avg = (prev_avg * prev_count + finalScore) / plays_count

        const { error: updateErr } = await supabase
          .from("game_scores")
          .update({
            best_score,
            last_score: finalScore,
            plays_count,
            updated_at: new Date().toISOString(),
            last_played: new Date().toISOString(),
            max_combo,
            average_score: new_avg,
            last_score: finalScore,
          })
          .eq("id", existingScores.id)

        if (updateErr) console.error("Lỗi update game_scores:", updateErr)
      } else {
        // insert new
        const { error: insertErr } = await supabase.from("game_scores").insert({
          user_id,
          game_id,
          best_score: finalScore,
          plays_count: 1,
          updated_at: new Date().toISOString(),
          last_score: finalScore,
          last_played: new Date().toISOString(),
          max_combo: combo,
          average_score: finalScore,
        })

        if (insertErr) console.error("Lỗi insert game_scores:", insertErr)
      }
    } catch (err) {
      console.error("Lỗi saveGameResult:", err)
    }
  }

  // Check sum (game finish condition)
  const checkSum = async () => {
    if (blocks.length === 0) return

    const total = blocks.reduce((acc, b) => acc + b.value, 0)
    const success = total === targetSum

    // compute duration
    const now = Date.now()
    const started = startTimeRef.current ?? now
    const durationSec = (now - started) / 1000

    if (success) {
      setScore((prev) => prev + 50)
    } else {
      setLives((prev) => Math.max(prev - 1, 0))
    }

    setGameWon(true)

    // metadata to save
    const meta = {
      target: targetSum,
      total,
      blocks: blocks.map((b) => ({ id: b.id, value: b.value })),
      level,
      success,
    }

    if (!userId) {
      // If user not signed in, still show modal but inform not saved
      console.warn("User not signed in. Skipping save.")
      return
    }

    // finalScore reflecting the updated score value after awarding points
    const finalScore = success ? score + 50 : score

    // Save to DB
    await saveGameResult({
      user_id: userId,
      score: finalScore,
      duration: durationSec,
      combo: 0,
      metadata: meta,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 z-10 text-white">
        <button onClick={onBack} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          ← Back
        </button>
        <div className="flex gap-8 font-bold">
          <div>Score: {score}</div>
          <div>Target: {targetSum}</div>
          <div>Level: {level}</div>
          <div>Lives: {lives}/3</div>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Game canvas */}
        <div className="flex-1 bg-slate-800 rounded-lg overflow-hidden border-2 border-purple-500">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer"
          />
        </div>

        {/* Control panel */}
        <div className="w-64 bg-gradient-to-b from-purple-800 to-slate-900 rounded-lg p-6 border-2 border-purple-500 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4">Add Blocks</h3>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                onClick={() => addBlock(num)}
                className="px-3 py-2 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                +{num}
              </button>
            ))}
          </div>

          <button
            onClick={checkSum}
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 mb-4"
          >
            Check Sum
          </button>

          <button
            onClick={() => setBlocks([])}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            Clear Board
          </button>

          <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-purple-400">
            <p className="text-gray-300 text-sm mb-2">Total Sum:</p>
            <p className="text-2xl font-bold text-yellow-300">{blocks.reduce((sum, b) => sum + b.value, 0)}</p>
          </div>
        </div>
      </div>

      {/* Win modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-blue-800 to-purple-900 p-8 rounded-lg text-center border-2 border-blue-400">
            <h2 className="text-4xl font-bold text-blue-300 mb-4">
              {blocks.reduce((sum, b) => sum + b.value, 0) === targetSum ? "Perfect! 🎉" : "Game Over"}
            </h2>
            <p className="text-2xl text-white mb-6">Score: {score}</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setBlocks([])
                  setGameWon(false)
                  setLives(3)
                  // reset start time for next play
                  startTimeRef.current = Date.now()
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
              >
                Play Again
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
