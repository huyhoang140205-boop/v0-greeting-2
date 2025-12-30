"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GameState = "MENU" | "LEVEL_SELECT" | "PLAYING" | "WIN" | "SHOP" | "LOSE"
type Character = "duck" | "rabbit" | "bird" | "fish"

interface MathProblem {
  a: number
  b: number
  correctAnswer: number
  options: number[]
}

interface MapObject {
  x: number
  y: number
  width: number
  height: number
}

interface AnswerTile extends MapObject {
  id: string
  value: number
  correct: boolean
  picked: boolean
}

interface GameMap {
  duck: MapObject & { vx: number; vy: number; onGround: boolean } // Added vy and onGround for jumping
  tiles: MapObject[]
  answerTiles: AnswerTile[]
  key: MapObject & { visible: boolean }
  door: MapObject & { locked: boolean }
  math: MathProblem
}

interface PlayerState {
  coins: number
  unlockedCharacters: Character[]
  currentCharacter: Character
  completedLevels: number[]
}

export default function MathDuckPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [gameState, setGameState] = useState<GameState>("LEVEL_SELECT")

  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mathDuckPlayerState")
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      coins: 0,
      unlockedCharacters: ["duck"],
      currentCharacter: "duck",
      completedLevels: [],
    }
  })

  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120)
  const [currentLevel, setCurrentLevel] = useState(1)
  const gameMapRef = useRef<GameMap | null>(null)
  const keysPressed = useRef<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mathDuckPlayerState", JSON.stringify(playerState))
    }
  }, [playerState])

  const characterShop: Record<Character, { name: string; price: number; emoji: string }> = {
    duck: { name: "Vịt", price: 0, emoji: "🦆" },
    rabbit: { name: "Thỏ", price: 300, emoji: "🐰" },
    bird: { name: "Chim", price: 300, emoji: "🐦" },
    fish: { name: "Cá", price: 300, emoji: "🐠" },
  }

  const LEVELS = [
    {
      multiplier: 1,
      tiles: [
        { x: 50, y: 400, width: 200, height: 30 }, // Repositioned all platforms within game area
        { x: 300, y: 340, width: 120, height: 30 },
        { x: 500, y: 300, width: 120, height: 30 },
        { x: 700, y: 340, width: 120, height: 30 },
        { x: 850, y: 420, width: 100, height: 30 },
      ],
      answers: [{ x: 400, y: 220, width: 40, height: 40, value: 1, correct: true }],
      doorX: 820,
      doorY: 350,
    },
    {
      multiplier: 2,
      tiles: [
        { x: 50, y: 400, width: 150, height: 30 },
        { x: 250, y: 350, width: 120, height: 30 },
        { x: 450, y: 300, width: 120, height: 30 },
        { x: 650, y: 350, width: 120, height: 30 },
        { x: 820, y: 420, width: 100, height: 30 },
      ],
      answers: [
        { x: 500, y: 200, width: 40, height: 40, value: 6, correct: true },
        { x: 150, y: 280, width: 40, height: 40, value: 2, correct: false },
        { x: 750, y: 200, width: 40, height: 40, value: 3, correct: false },
      ],
      doorX: 790,
      doorY: 350,
    },
    {
      multiplier: 3,
      tiles: [
        { x: 30, y: 400, width: 150, height: 30 },
        { x: 200, y: 330, width: 120, height: 30 },
        { x: 380, y: 270, width: 120, height: 30 },
        { x: 560, y: 330, width: 120, height: 30 },
        { x: 720, y: 270, width: 120, height: 30 },
        { x: 820, y: 420, width: 100, height: 30 },
      ],
      answers: [
        { x: 430, y: 140, width: 40, height: 40, value: 9, correct: true },
        { x: 100, y: 280, width: 40, height: 40, value: 6, correct: false },
        { x: 700, y: 160, width: 40, height: 40, value: 12, correct: false },
      ],
      doorX: 790,
      doorY: 350,
    },
    {
      multiplier: 4,
      tiles: [
        { x: 30, y: 400, width: 150, height: 30 },
        { x: 250, y: 360, width: 100, height: 30 },
        { x: 420, y: 300, width: 100, height: 30 },
        { x: 250, y: 240, width: 100, height: 30 },
        { x: 550, y: 280, width: 100, height: 30 },
        { x: 700, y: 340, width: 100, height: 30 },
        { x: 820, y: 420, width: 100, height: 30 },
      ],
      answers: [
        { x: 470, y: 120, width: 40, height: 40, value: 16, correct: true },
        { x: 150, y: 260, width: 40, height: 40, value: 8, correct: false },
        { x: 650, y: 160, width: 40, height: 40, value: 5, correct: false },
        { x: 750, y: 240, width: 40, height: 40, value: 2, correct: false },
      ],
      doorX: 790,
      doorY: 300,
    },
    {
      multiplier: 5,
      tiles: [
        { x: 30, y: 400, width: 140, height: 30 },
        { x: 220, y: 350, width: 100, height: 30 },
        { x: 400, y: 290, width: 100, height: 30 },
        { x: 580, y: 340, width: 100, height: 30 },
        { x: 350, y: 240, width: 100, height: 30 },
        { x: 550, y: 200, width: 100, height: 30 },
        { x: 720, y: 280, width: 100, height: 30 },
        { x: 820, y: 420, width: 100, height: 30 },
      ],
      answers: [
        { x: 470, y: 80, width: 40, height: 40, value: 25, correct: true },
        { x: 120, y: 260, width: 40, height: 40, value: 7, correct: false },
        { x: 650, y: 120, width: 40, height: 40, value: 5, correct: false },
        { x: 800, y: 160, width: 40, height: 40, value: 8, correct: false },
        { x: 100, y: 350, width: 40, height: 40, value: 20, correct: false },
      ],
      doorX: 790,
      doorY: 280,
    },
  ]

  const initGameMap = (levelNum: number) => {
    const levelConfig = LEVELS[levelNum - 1]
    if (!levelConfig) return

    const gameMap: GameMap = {
      duck: { x: 50, y: 360, width: 30, height: 30, vx: 0, vy: 0, onGround: false }, // Added jump velocity
      tiles: levelConfig.tiles,
      answerTiles: levelConfig.answers.map((a) => ({ ...a, picked: false })),
      key: { x: 400, y: 50, width: 30, height: 30, visible: false },
      door: { x: levelConfig.doorX, y: levelConfig.doorY - 50, width: 50, height: 60, locked: true },
      math: {
        a: levelConfig.multiplier,
        b: Math.floor(Math.random() * 10) + 1,
        correctAnswer: 0,
        options: [],
      },
    }
    gameMap.math.correctAnswer = gameMap.math.a * gameMap.math.b
    gameMapRef.current = gameMap
  }

  const collide = (a: MapObject, b: MapObject) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  const saveGameScoreToDB = async (levelNum: number, finalScore: number, isWin: boolean) => {
    try {
      console.log("[v0] Saving score to database:", { levelNum, finalScore, isWin })
      const response = await fetch("/api/games/math-duck-platformer/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: levelNum,
          score: finalScore,
          isWin,
          character: playerState.currentCharacter,
        }),
      })
      if (response.ok) {
        console.log("[v0] Score saved successfully")
      } else {
        console.error("[v0] Failed to save score:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error saving score:", error)
    }
  }

  const updateGameMap = () => {
    const map = gameMapRef.current
    if (!map) return

    const canvas = canvasRef.current
    if (!canvas) return

    const GRAVITY = 0.4
    const JUMP_POWER = 12
    const GROUND_Y = 420 // Platform base line

    map.duck.vy += GRAVITY
    map.duck.y += map.duck.vy
    map.duck.x += map.duck.vx
    map.duck.vx *= 0.85

    map.duck.onGround = false
    map.tiles.forEach((tile) => {
      if (
        map.duck.y + map.duck.height >= tile.y &&
        map.duck.y + map.duck.height <= tile.y + tile.height + 5 &&
        map.duck.x + map.duck.width > tile.x &&
        map.duck.x < tile.x + tile.width &&
        map.duck.vy >= 0
      ) {
        map.duck.y = tile.y - map.duck.height
        map.duck.vy = 0
        map.duck.onGround = true
      }
    })

    if (map.duck.x < 0) map.duck.x = 0
    if (map.duck.x + map.duck.width > canvas.width) map.duck.x = canvas.width - map.duck.width
    if (map.duck.y > canvas.height) {
      // Fall off - reset to start
      map.duck.y = 360
      map.duck.vy = 0
    }

    map.answerTiles.forEach((tile) => {
      if (!tile.picked && collide(map.duck, tile)) {
        tile.picked = true

        if (tile.correct) {
          map.key.x = tile.x
          map.key.y = tile.y - 40
          map.key.visible = true
          setScore((prev) => prev + 100)
        } else {
          const finalScore = score
          saveGameScoreToDB(currentLevel, finalScore, false)
          setGameState("LOSE")
          return
        }
      }
    })

    if (map.key.visible && collide(map.duck, map.key)) {
      map.key.visible = false
      map.door.locked = false
      setScore((prev) => prev + 50)
    }

    if (!map.door.locked && collide(map.duck, map.door)) {
      const earnedCoins = score + 150
      saveGameScoreToDB(currentLevel, earnedCoins, true)
      setPlayerState((prev) => ({
        ...prev,
        coins: prev.coins + earnedCoins,
        completedLevels: prev.completedLevels.includes(currentLevel)
          ? prev.completedLevels
          : [...prev.completedLevels, currentLevel],
      }))
      setGameState("WIN")
    }
  }

  const renderGameMap = () => {
    const canvas = canvasRef.current
    const map = gameMapRef.current
    if (!canvas || !map) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFA500"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let x = 0; x < canvas.width; x += 40) {
      for (let y = 0; y < canvas.height; y += 40) {
        if ((x / 40 + y / 40) % 2 === 0) {
          ctx.fillStyle = "#FFB84D"
          ctx.fillRect(x, y, 40, 40)
        }
      }
    }

    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Simple cloud shapes
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
    const clouds = [
      { x: 100, y: 50, w: 80, h: 30 },
      { x: 400, y: 80, w: 100, h: 40 },
      { x: 700, y: 40, w: 90, h: 35 },
    ]
    clouds.forEach((c) => {
      ctx.beginPath()
      ctx.arc(c.x, c.y, 20, 0, Math.PI * 2)
      ctx.arc(c.x + 30, c.y - 10, 25, 0, Math.PI * 2)
      ctx.arc(c.x + 60, c.y, 20, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = "#7FD700"
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30)

    map.tiles.forEach((tile) => {
      ctx.fillStyle = "#FF8C00"
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.strokeRect(tile.x, tile.y, tile.width, tile.height)

      // Grass on top of platform
      ctx.fillStyle = "#7FD700"
      for (let i = 0; i < tile.width; i += 10) {
        ctx.fillRect(tile.x + i, tile.y - 6, 8, 6)
      }
    })

    map.answerTiles.forEach((tile) => {
      ctx.fillStyle = tile.picked ? "#A9A9A9" : "#FFFF00"
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.strokeRect(tile.x, tile.y, tile.width, tile.height)
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.fillStyle = "#000"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(tile.value.toString(), tile.x + tile.width / 2, tile.y + tile.height / 2)
    })

    if (map.key.visible) {
      ctx.fillStyle = "#FFD700"
      ctx.fillRect(map.key.x, map.key.y, map.key.width, map.key.height)
      ctx.strokeStyle = "#FFA500"
      ctx.lineWidth = 2
      ctx.strokeRect(map.key.x, map.key.y, map.key.width, map.key.height)
      ctx.fillStyle = "#000"
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("🔑", map.key.x + map.key.width / 2, map.key.y + map.key.height / 2)
    }

    ctx.fillStyle = map.door.locked ? "#FF69B4" : "#90EE90"
    ctx.fillRect(map.door.x, map.door.y, map.door.width, map.door.height)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(map.door.x, map.door.y, map.door.width, map.door.height)
    ctx.fillStyle = "#000"
    ctx.font = "30px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("🚪", map.door.x + map.door.width / 2, map.door.y + map.door.height / 2)

    const charEmoji =
      playerState.currentCharacter === "duck"
        ? "🦆"
        : playerState.currentCharacter === "rabbit"
          ? "🐰"
          : playerState.currentCharacter === "bird"
            ? "🐦"
            : "🐠"
    ctx.font = "40px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(charEmoji, map.duck.x + map.duck.width / 2, map.duck.y + map.duck.height / 2)

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.fillRect(10, 10, 320, 120)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 320, 120)

    ctx.fillStyle = "#000"
    ctx.font = "bold 28px Arial"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`${map.math.a} × ${map.math.b} = ?`, 20, 20)
    ctx.font = "16px Arial"
    ctx.fillText("Chạm vào ô số để trả lời", 20, 65)
  }

  useEffect(() => {
    if (gameState !== "PLAYING") return

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true

      const map = gameMapRef.current
      if (map && (e.key.toLowerCase() === "w" || e.key === "ArrowUp" || e.key === " ") && map.onGround) {
        map.vy = -12
        map.onGround = false
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== "PLAYING") {
      const map = gameMapRef.current
      if (map) {
        map.duck.vx = 0
      }
      return
    }

    const interval = setInterval(() => {
      const map = gameMapRef.current
      if (!map) return

      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
        map.duck.vx = -5
      }
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
        map.duck.vx = 5
      }

      updateGameMap()
      renderGameMap()
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [gameState])

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

  const startGame = () => {
    initGameMap(currentLevel)
    setScore(0)
    setTimeLeft(120)
    setGameState("PLAYING")
  }

  const initializeGame = (level: number) => {
    initGameMap(level)
    setScore(0)
    setTimeLeft(120)
  }

  if (gameState === "MENU") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-400 to-blue-300 border-4 border-blue-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">🦆 MATH DUCK</h1>
            <p className="text-2xl text-white">Nhảy & Giải Toán!</p>

            <div className="bg-white rounded-lg p-4 text-left space-y-2 text-lg">
              <p className="font-bold">Hướng dẫn:</p>
              <p>A/D hoặc ⬅️➡️: Di chuyển</p>
              <p>W hoặc ⬆️ hoặc SPACE: Nhảy</p>
              <p>Chạm vào ô đáp án để trả lời</p>
              <p>Trả lời đúng → Chìa khóa xuất hiện</p>
              <p>Nhặt chìa khóa → Cửa tự mở</p>
            </div>

            <Button
              onClick={() => setGameState("LEVEL_SELECT")}
              className="text-3xl px-8 py-6 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4 border-green-700"
            >
              ▶️ BẮT ĐẦU
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "LEVEL_SELECT") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-8 bg-gradient-to-b from-blue-400 to-blue-300 border-4 border-blue-600">
          <div className="text-center space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-5xl font-black text-white drop-shadow-lg">Chọn Màn</h1>
              <div className="flex gap-4">
                <Button
                  onClick={() => setGameState("SHOP")}
                  className="text-xl px-6 py-3 font-black bg-purple-500 hover:bg-purple-600 text-white border-4"
                >
                  🛍️ SHOP
                </Button>
                <div className="bg-white rounded-lg px-4 py-2 border-4 text-2xl font-black">💰 {playerState.coins}</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => {
                const levelNum = i + 1
                const isCompleted = playerState.completedLevels.includes(levelNum)
                return (
                  <Button
                    key={levelNum}
                    onClick={() => {
                      setCurrentLevel(levelNum)
                      startGame()
                    }}
                    className={`text-2xl py-6 font-black border-4 transition ${isCompleted ? "bg-green-400 hover:bg-green-500 border-green-700" : "bg-blue-300 hover:bg-blue-400 border-blue-600"}`}
                  >
                    {isCompleted ? "✓" : ""} Màn {levelNum}
                  </Button>
                )
              })}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "SHOP") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-8 bg-gradient-to-b from-emerald-400 to-emerald-300 border-4 border-emerald-600">
          <div className="text-center space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-black text-white drop-shadow-lg">🛍️ SHOP NHÂN VẬT</h1>
              <div className="bg-white rounded-lg px-4 py-2 border-4 text-2xl font-black">💰 {playerState.coins}</div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {Object.entries(characterShop).map(([char, info]) => (
                <div
                  key={char}
                  className={`rounded-lg p-4 border-4 ${playerState.currentCharacter === char ? "bg-yellow-300 border-yellow-600" : "bg-white border-gray-400"}`}
                >
                  <p className="text-5xl mb-3">{info.emoji}</p>
                  <p className="font-bold text-lg mb-2">{info.name}</p>
                  {info.price > 0 && <p className="text-2xl mb-3">💰 {info.price}</p>}
                  {playerState.unlockedCharacters.includes(char as Character) ? (
                    <Button
                      onClick={() => {
                        setPlayerState((prev) => ({
                          ...prev,
                          currentCharacter: char as Character,
                        }))
                      }}
                      className={`w-full font-bold ${playerState.currentCharacter === char ? "bg-yellow-500" : "bg-blue-500"}`}
                    >
                      {playerState.currentCharacter === char ? "✓ Đang dùng" : "Chọn"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (playerState.coins >= info.price) {
                          setPlayerState((prev) => ({
                            ...prev,
                            coins: prev.coins - info.price,
                            unlockedCharacters: [...prev.unlockedCharacters, char as Character],
                          }))
                        }
                      }}
                      disabled={playerState.coins < info.price}
                      className="w-full"
                    >
                      {playerState.coins >= info.price ? "Mua" : "Không đủ"}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setGameState("LEVEL_SELECT")}
              className="text-2xl px-8 py-6 w-full font-black bg-blue-600 hover:bg-blue-700 text-white border-4"
            >
              ⬅️ QUAY LẠI
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "PLAYING") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <div className="flex justify-between bg-white rounded-lg p-4 border-4 font-bold text-2xl">
            <span>🎮 Màn {currentLevel}/10</span>
            <span>⏱️ {timeLeft}s</span>
            <span>⭐ {score}</span>
            <Button
              onClick={() => setGameState("LEVEL_SELECT")}
              className="text-lg px-4 py-2 font-black bg-red-500 hover:bg-red-600 text-white border-2"
            >
              ⬅️ QUAY LẠI
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={900}
            height={550}
            className="w-full border-4 border-gray-800 rounded-lg bg-sky-300"
          />

          <div className="bg-white rounded-lg p-4 border-2">
            <p className="text-center font-bold text-lg">Nhảy tới ô đáp án để trả lời câu hỏi</p>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "LOSE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-red-400 to-red-300 border-4 border-red-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">💥 GAME OVER</h1>
            <p className="text-3xl font-bold text-white">Điểm: {score}</p>
            <p className="text-2xl text-white">Trả lời sai hoặc rơi xuống!</p>

            <div className="space-y-3">
              <Button
                onClick={() => startGame()}
                className="text-2xl px-8 py-6 w-full font-black bg-blue-500 hover:bg-blue-600 text-white border-4"
              >
                🔄 THỬ LẠI
              </Button>
              <Button
                onClick={() => setGameState("LEVEL_SELECT")}
                className="text-2xl px-8 py-6 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4"
              >
                📋 CHỌN MÀN
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "WIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-green-400 to-green-300 border-4 border-green-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">🎉 CHIẾN THẮNG!</h1>
            <p className="text-3xl font-bold text-white">Điểm: {score}</p>
            <p className="text-2xl text-white">Nhận được: 💰 {score} coins</p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setScore(0)
                  setGameState("PLAYING")
                  initializeGame(currentLevel)
                }}
                className="text-2xl px-8 py-6 w-full font-black bg-blue-500 hover:bg-blue-600 text-white border-4"
              >
                🔄 CHƠI LẠI
              </Button>
              <Button
                onClick={() => setGameState("LEVEL_SELECT")}
                className="text-2xl px-8 py-6 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4"
              >
                📋 CHỌN MÀN
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
