"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GameState = "START" | "PLAYING" | "WIN" | "LOSE"

interface Platform {
  x: number
  y: number
  width: number
  height: number
}

interface Tile {
  x: number
  y: number
  number: number
  collected: boolean
  id: string
}

interface Physics {
  vx: number
  vy: number
  isJumping: boolean
}

export default function MathDuckPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("START")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [level, setLevel] = useState(1)

  // Game objects
  const gameDataRef = useRef({
    duck: {
      x: 80,
      y: 400,
      width: 40,
      height: 40,
      vx: 0,
      vy: 0,
      isJumping: false,
    },
    platforms: [] as Platform[],
    tiles: [] as Tile[],
    nextTileIndex: 0,
    goalDoor: { x: 0, y: 0, width: 60, height: 80 },
  })

  // Initialize game
  const initGame = () => {
    const data = gameDataRef.current
    const multiplier = level

    data.platforms = [
      // Start platform
      { x: 0, y: 450, width: 150, height: 30 },
      // Mid platforms
      { x: 200, y: 350, width: 150, height: 30 },
      { x: 400, y: 280, width: 150, height: 30 },
      { x: 600, y: 350, width: 150, height: 30 },
      // Goal platform
      { x: 800, y: 380, width: 120, height: 30 },
    ]

    // Generate number tiles for sequence
    const numbers = [2 * multiplier, 3 * multiplier, 6 * multiplier]
    data.tiles = numbers.map((num, idx) => ({
      x: 150 + idx * 250,
      y: 280 - idx * 50,
      number: num,
      collected: false,
      id: `tile-${idx}`,
    }))

    // Goal door
    data.goalDoor = { x: 800, y: 300, width: 60, height: 80 }

    // Reset duck
    data.duck = {
      x: 80,
      y: 400,
      width: 40,
      height: 40,
      vx: 0,
      vy: 0,
      isJumping: false,
    }
  }

  // Start game
  const startGame = () => {
    initGame()
    setScore(0)
    setTimeLeft(60)
    setGameState("PLAYING")
  }

  // Render game
  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const data = gameDataRef.current

    // Clear canvas with orange checkerboard
    ctx.fillStyle = "#FFA500"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw checkerboard
    for (let x = 0; x < canvas.width; x += 40) {
      for (let y = 0; y < canvas.height; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) {
          ctx.fillStyle = "#FFB84D"
          ctx.fillRect(x, y, 40, 40)
        }
      }
    }

    // Draw sky
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(0, 0, canvas.width, 150)

    // Draw clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.beginPath()
    ctx.arc(200, 80, 30, 0, Math.PI * 2)
    ctx.arc(250, 85, 35, 0, Math.PI * 2)
    ctx.arc(150, 85, 28, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(700, 100, 30, 0, Math.PI * 2)
    ctx.arc(750, 105, 35, 0, Math.PI * 2)
    ctx.arc(650, 105, 28, 0, Math.PI * 2)
    ctx.fill()

    // Draw platforms
    data.platforms.forEach((p) => {
      ctx.fillStyle = "#FF8C00"
      ctx.fillRect(p.x, p.y, p.width, p.height)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 3
      ctx.strokeRect(p.x, p.y, p.width, p.height)

      // Grass top
      ctx.fillStyle = "#7FD700"
      for (let i = 0; i < p.width; i += 10) {
        ctx.fillRect(p.x + i, p.y - 8, 8, 8)
      }
    })

    // Draw number tiles
    data.tiles.forEach((tile, idx) => {
      const isNext = idx === data.nextTileIndex && !tile.collected
      const isCollected = tile.collected

      ctx.fillStyle = isCollected ? "#90EE90" : isNext ? "#FFFF00" : "#CCCCCC"
      ctx.fillRect(tile.x, tile.y, 40, 40)

      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.strokeRect(tile.x, tile.y, 40, 40)

      // Number text
      ctx.fillStyle = "#000"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(tile.number.toString(), tile.x + 20, tile.y + 20)
    })

    // Draw goal door
    ctx.fillStyle = "#FF69B4"
    ctx.fillRect(data.goalDoor.x, data.goalDoor.y, data.goalDoor.width, data.goalDoor.height)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 3
    ctx.strokeRect(data.goalDoor.x, data.goalDoor.y, data.goalDoor.width, data.goalDoor.height)

    // Door window
    ctx.fillStyle = "#FFFF00"
    ctx.fillRect(data.goalDoor.x + 10, data.goalDoor.y + 15, 40, 40)

    // Draw duck
    ctx.fillStyle = "#FFD700"
    ctx.beginPath()
    ctx.arc(data.duck.x + 20, data.duck.y + 20, 15, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = "#FFA500"
    ctx.beginPath()
    ctx.arc(data.duck.x + 32, data.duck.y + 18, 6, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = "#000"
    ctx.beginPath()
    ctx.arc(data.duck.x + 25, data.duck.y + 15, 3, 0, Math.PI * 2)
    ctx.fill()

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    ctx.beginPath()
    ctx.ellipse(data.duck.x + 20, data.duck.y + 42, 18, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Game update loop
  const update = () => {
    const data = gameDataRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    data.duck.vy += 0.5
    data.duck.y += data.duck.vy
    data.duck.x += data.duck.vx

    // Friction
    data.duck.vx *= 0.95

    // Platform collision
    let onPlatform = false
    data.platforms.forEach((p) => {
      if (
        data.duck.y + data.duck.height >= p.y &&
        data.duck.y + data.duck.height <= p.y + 15 &&
        data.duck.x + data.duck.width > p.x &&
        data.duck.x < p.x + p.width
      ) {
        data.duck.y = p.y - data.duck.height
        data.duck.vy = 0
        data.duck.isJumping = false
        onPlatform = true
      }
    })

    // Fall off screen
    if (data.duck.y > canvas.height) {
      setGameState("LOSE")
      return
    }

    // Tile collision
    data.tiles.forEach((tile, idx) => {
      if (!tile.collected && idx === data.nextTileIndex) {
        if (
          data.duck.x + data.duck.width > tile.x &&
          data.duck.x < tile.x + 40 &&
          data.duck.y + data.duck.height > tile.y &&
          data.duck.y < tile.y + 40
        ) {
          tile.collected = true
          setScore((prev) => prev + 100)

          if (idx === data.tiles.length - 1) {
            // Last tile collected
            setTimeout(() => {
              // Check if near goal
              if (
                data.duck.x + data.duck.width > data.goalDoor.x &&
                data.duck.x < data.goalDoor.x + data.goalDoor.width &&
                data.duck.y + data.duck.height > data.goalDoor.y &&
                data.duck.y < data.goalDoor.y + data.goalDoor.height
              ) {
                setGameState("WIN")
              }
            }, 300)
          } else {
            data.nextTileIndex++
          }
        }
      }
    })

    // Boundary
    if (data.duck.x < 0) data.duck.x = 0
    if (data.duck.x + data.duck.width > canvas.width) {
      data.duck.x = canvas.width - data.duck.width
    }
  }

  // Input handling
  useEffect(() => {
    if (gameState !== "PLAYING") return

    const handleKeyDown = (e: KeyboardEvent) => {
      const data = gameDataRef.current
      const key = e.key.toLowerCase()

      if (["a", "arrowleft"].includes(key)) {
        data.duck.vx = -5
      }
      if (["d", "arrowright"].includes(key)) {
        data.duck.vx = 5
      }
      if (["w", "arrowup", " "].includes(key) && !data.duck.isJumping) {
        data.duck.vy = -12
        data.duck.isJumping = true
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState])

  // Timer
  useEffect(() => {
    if (gameState !== "PLAYING") return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("LOSE")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  // Game loop
  useEffect(() => {
    if (gameState !== "PLAYING") return

    const interval = setInterval(() => {
      update()
      render()
    }, 1000 / 60) // 60 FPS

    return () => clearInterval(interval)
  }, [gameState])

  // Initial render
  useEffect(() => {
    render()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
      {gameState === "START" && (
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-400 to-blue-300 border-4 border-blue-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">🦆 MATH DUCK PLATFORMER</h1>
            <p className="text-2xl text-white">Nhảy qua các nền tảng & giải toán!</p>

            <div className="bg-white rounded-lg p-4 text-left space-y-2">
              <p className="text-lg font-bold">Hướng dẫn:</p>
              <p>A/D hoặc ⬅️➡️ để di chuyển</p>
              <p>W hoặc ⬆️ hoặc SPACE để nhảy</p>
              <p>Chạm các số theo thứ tự: 2 → 3 → 6</p>
              <p>Vào cửa hộp để thắng!</p>
            </div>

            <div className="space-y-3">
              <p className="text-2xl font-bold text-white">Chọn cấp độ:</p>
              <div className="flex gap-3 justify-center">
                {[1, 2, 3].map((lvl) => (
                  <Button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    variant={level === lvl ? "default" : "outline"}
                    className={`text-xl px-6 py-3 font-bold border-2 ${
                      level === lvl
                        ? "bg-yellow-400 text-black border-yellow-600"
                        : "bg-white text-gray-800 border-gray-400"
                    }`}
                  >
                    {lvl === 1 && "Dễ"}
                    {lvl === 2 && "Vừa"}
                    {lvl === 3 && "Khó"}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={startGame}
              className="text-3xl px-8 py-6 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4 border-green-700"
            >
              ▶️ CHƠI
            </Button>
          </div>
        </Card>
      )}

      {gameState === "PLAYING" && (
        <div className="w-full max-w-4xl space-y-4">
          <div className="flex justify-between bg-white rounded-lg p-4 border-4 border-gray-400">
            <div className="text-2xl font-bold">⏱️ {timeLeft}s</div>
            <div className="text-2xl font-bold">⭐ {score}</div>
            <div className="text-2xl">🦆</div>
          </div>

          <canvas ref={canvasRef} width={900} height={550} className="w-full border-4 border-gray-800 rounded-lg" />
        </div>
      )}

      {gameState === "WIN" && (
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-emerald-300 to-emerald-200 border-4 border-emerald-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">🎉 THẮNG!</h1>
            <div className="bg-white rounded-lg p-6">
              <p className="text-4xl font-black text-green-600">Điểm: {score}</p>
            </div>
            <Button
              onClick={() => setGameState("START")}
              className="text-2xl px-8 py-6 w-full font-black bg-green-600 hover:bg-green-700 text-white border-4"
            >
              🎮 CHƠI LẠI
            </Button>
          </div>
        </Card>
      )}

      {gameState === "LOSE" && (
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-orange-300 to-orange-200 border-4 border-orange-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">😢 THUA</h1>
            <div className="bg-white rounded-lg p-6">
              <p className="text-3xl font-black text-orange-600">Điểm: {score}</p>
            </div>
            <Button
              onClick={() => setGameState("START")}
              className="text-2xl px-8 py-6 w-full font-black bg-orange-600 hover:bg-orange-700 text-white border-4"
            >
              🎮 THỬ LẠI
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
