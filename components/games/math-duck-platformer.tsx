"use client"

import { useEffect, useRef, useState } from "react"

type GameState = "PLAYING" | "WIN" | "LOSE"

interface Tile {
  x: number
  y: number
  w: number
  h: number
}

interface AnswerTile extends Tile {
  value: number
  correct: boolean
  picked: boolean
}

export default function MathDuckPixelGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const [gameState, setGameState] = useState<GameState>("PLAYING")

  const TABLE = 4
  const MULTIPLIERS = [2, 4, 5, 8]
  const CORRECT = TABLE * 2

  const duck = useRef({
    x: 120,
    y: 300,
    vx: 0,
    vy: 0,
    onGround: false,
  })

  const platforms: Tile[] = [
    { x: 80, y: 360, w: 200, h: 20 },
    { x: 320, y: 300, w: 120, h: 20 },
    { x: 520, y: 260, w: 120, h: 20 },
    { x: 700, y: 320, w: 120, h: 20 },
  ]

  const answers = useRef<AnswerTile[]>([
    { x: 340, y: 260, w: 32, h: 32, value: 8, correct: true, picked: false },
    { x: 540, y: 220, w: 32, h: 32, value: 5, correct: false, picked: false },
    { x: 740, y: 280, w: 32, h: 32, value: 9, correct: false, picked: false },
  ])

  const door = { x: 820, y: 300, w: 40, h: 60 }

  const collide = (a: any, b: any) =>
    a.x < b.x + b.w &&
    a.x + 24 > b.x &&
    a.y < b.y + b.h &&
    a.y + 24 > b.y

  const update = () => {
    const d = duck.current
    d.vy += 0.6
    d.x += d.vx
    d.y += d.vy
    d.vx *= 0.8
    d.onGround = false

    platforms.forEach((p) => {
      if (
        d.y + 24 >= p.y &&
        d.y + 24 <= p.y + 10 &&
        d.x + 24 > p.x &&
        d.x < p.x + p.w
      ) {
        d.y = p.y - 24
        d.vy = 0
        d.onGround = true
      }
    })

    answers.current.forEach((a) => {
      if (!a.picked && collide(d, a)) {
        a.picked = true
        if (a.correct) setGameState("WIN")
        else setGameState("LOSE")
      }
    })

    if (collide(d, door)) setGameState("WIN")
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // nền caro cam
    for (let x = 0; x < 900; x += 32) {
      for (let y = 0; y < 500; y += 32) {
        ctx.fillStyle = (x / 32 + y / 32) % 2 ? "#FFB347" : "#FFA500"
        ctx.fillRect(x, y, 32, 32)
      }
    }

    // trời
    ctx.fillStyle = "#4FC3F7"
    ctx.fillRect(200, 0, 700, 500)

    // platform
    platforms.forEach((p) => {
      ctx.fillStyle = "#FF9800"
      ctx.fillRect(p.x, p.y, p.w, p.h)
      ctx.fillStyle = "#66BB6A"
      ctx.fillRect(p.x, p.y - 6, p.w, 6)
    })

    // answer tiles
    answers.current.forEach((a) => {
      ctx.fillStyle = a.picked ? "#999" : "#FFEB3B"
      ctx.fillRect(a.x, a.y, a.w, a.h)
      ctx.fillStyle = "#000"
      ctx.font = "bold 16px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(a.value.toString(), a.x + 16, a.y + 16)
    })

    // cửa
    ctx.fillStyle = "#E91E63"
    ctx.fillRect(door.x, door.y, door.w, door.h)

    // duck
    ctx.font = "24px monospace"
    ctx.fillText("🦆", duck.current.x, duck.current.y + 20)

    // bảng nhân
    ctx.fillStyle = "#90CAF9"
    ctx.fillRect(20, 20, 150, 180)
    ctx.fillStyle = "#000"
    ctx.font = "14px monospace"
    ctx.fillText("Table of 4", 40, 45)
    MULTIPLIERS.forEach((m, i) => {
      ctx.fillText(`4 x ${m} = ?`, 40, 70 + i * 30)
    })
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true
      if ((e.key === " " || e.key === "ArrowUp") && duck.current.onGround) {
        duck.current.vy = -12
      }
    }
    const up = (e: KeyboardEvent) => (keys.current[e.key] = false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  useEffect(() => {
    const loop = setInterval(() => {
      if (gameState !== "PLAYING") return
      if (keys.current["ArrowLeft"]) duck.current.vx = -4
      if (keys.current["ArrowRight"]) duck.current.vx = 4
      update()
      draw()
    }, 1000 / 60)
    return () => clearInterval(loop)
  }, [gameState])

  return (
    <div className="flex justify-center mt-4">
      <canvas ref={canvasRef} width={900} height={500} />
      {gameState !== "PLAYING" && (
        <div className="absolute top-1/2 text-4xl font-bold">
          {gameState === "WIN" ? "🎉 YOU WIN" : "❌ WRONG ANSWER"}
        </div>
      )}
    </div>
  )
}
