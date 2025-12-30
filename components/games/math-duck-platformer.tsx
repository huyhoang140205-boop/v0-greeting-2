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
  duck: MapObject & { vx: number; vy: number; isJumping: boolean }
  platforms: MapObject[]
  questionSource: MapObject
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

  const levelDataMap: Record<number, { platforms: MapObject[]; answerPositions: Array<{ x: number; y: number }> }> = {
    1: {
      platforms: [
        { x: 30, y: 500, width: 140, height: 20 }, // Start
        { x: 150, y: 450, width: 100, height: 20 },
        { x: 250, y: 400, width: 100, height: 20 },
        { x: 350, y: 350, width: 100, height: 20 },
        { x: 450, y: 300, width: 100, height: 20 },
        { x: 550, y: 350, width: 100, height: 20 },
        { x: 650, y: 400, width: 100, height: 20 },
        { x: 750, y: 450, width: 100, height: 20 },
        { x: 800, y: 480, width: 140, height: 20 }, // Near door
      ],
      answerPositions: [
        { x: 450, y: 250 }, // A - CORRECT (in middle path)
        { x: 50, y: 300 }, // B - Wrong (far left)
        { x: 800, y: 100 }, // C - Wrong (far right top)
        { x: 300, y: 150 }, // D - Wrong (left top)
      ],
    },
    2: {
      platforms: [
        { x: 30, y: 500, width: 140, height: 20 },
        { x: 100, y: 450, width: 90, height: 20 },
        { x: 170, y: 400, width: 90, height: 20 },
        { x: 240, y: 350, width: 90, height: 20 },
        { x: 310, y: 300, width: 90, height: 20 },
        { x: 380, y: 250, width: 90, height: 20 },
        { x: 450, y: 300, width: 90, height: 20 },
        { x: 520, y: 350, width: 90, height: 20 },
        { x: 590, y: 400, width: 90, height: 20 },
        { x: 660, y: 450, width: 90, height: 20 },
        { x: 800, y: 480, width: 140, height: 20 },
      ],
      answerPositions: [
        { x: 380, y: 210 }, // A - CORRECT (at highest platform)
        { x: 80, y: 200 }, // B - Wrong (far left)
        { x: 700, y: 150 }, // C - Wrong (far right)
        { x: 200, y: 100 }, // D - Wrong (left top)
      ],
    },
    3: {
      platforms: [
        { x: 30, y: 500, width: 140, height: 20 },
        { x: 110, y: 460, width: 80, height: 20 },
        { x: 180, y: 420, width: 80, height: 20 },
        { x: 250, y: 380, width: 80, height: 20 },
        { x: 320, y: 340, width: 80, height: 20 },
        { x: 390, y: 300, width: 80, height: 20 },
        { x: 460, y: 260, width: 80, height: 20 },
        { x: 530, y: 300, width: 80, height: 20 },
        { x: 600, y: 340, width: 80, height: 20 },
        { x: 670, y: 380, width: 80, height: 20 },
        { x: 740, y: 420, width: 80, height: 20 },
        { x: 800, y: 480, width: 140, height: 20 },
      ],
      answerPositions: [
        { x: 460, y: 220 }, // A - CORRECT (center peak)
        { x: 100, y: 250 }, // B - Wrong (far left)
        { x: 750, y: 100 }, // C - Wrong (far right)
        { x: 50, y: 100 }, // D - Wrong (far left top)
      ],
    },
  }

  for (let i = 4; i <= 10; i++) {
    if (!levelDataMap[i]) {
      const startX = 50
      const platformCount = 6 + i
      levelDataMap[i] = {
        platforms: Array.from({ length: platformCount }).map((_, idx) => ({
          x: startX + (idx * 700) / platformCount,
          y: 500 - (idx % (Math.floor(platformCount / 3) + 1)) * 80,
          width: 90,
          height: 20,
        })),
        answerPositions: [
          { x: 350 + Math.random() * 50, y: 200 }, // A - CORRECT (center)
          { x: 50, y: 150 + Math.random() * 100 }, // B - Wrong (left)
          { x: 750, y: 100 + Math.random() * 150 }, // C - Wrong (right)
          { x: 100, y: 50 + Math.random() * 100 }, // D - Wrong (left top)
        ],
      }
    }
  }

  const generateMathProblem = (level: number): MathProblem => {
    const maxNum = Math.min(3 + Math.floor(level / 2), 12)
    const a = Math.floor(Math.random() * (maxNum - 1)) + 2
    const b = Math.floor(Math.random() * (maxNum - 1)) + 2
    const correctAnswer = a * b

    const options = [correctAnswer]
    while (options.length < 4) {
      const wrong = Math.floor(Math.random() * correctAnswer * 1.5) + 1
      if (!options.includes(wrong) && wrong !== correctAnswer) {
        options.push(wrong)
      }
    }

    return {
      a,
      b,
      correctAnswer,
      options: options.sort(() => Math.random() - 0.5),
    }
  }

  const initGameMap = (level: number) => {
    const math = generateMathProblem(level)
    const levelData = levelDataMap[level] || levelDataMap[1]

    const answerTiles: AnswerTile[] = levelData.answerPositions.map((pos, idx) => ({
      id: ["A", "B", "C", "D"][idx],
      x: pos.x,
      y: pos.y,
      width: 50,
      height: 50,
      value: math.options[idx],
      correct: math.options[idx] === math.correctAnswer,
      picked: false,
    }))

    const gameMap: GameMap = {
      duck: {
        x: 60,
        y: 440,
        width: 40,
        height: 40,
        vx: 0,
        vy: 0,
        isJumping: false,
      },
      platforms: levelData.platforms,
      questionSource: { x: 30, y: 80, width: 300, height: 80 },
      answerTiles,
      key: { x: 400, y: 100, width: 30, height: 30, visible: false },
      door: { x: 800, y: 420, width: 50, height: 60, locked: true },
      math,
    }

    gameMapRef.current = gameMap
  }

  const collide = (a: MapObject, b: MapObject) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  const saveGameScoreToDB = async (levelNum: number, finalScore: number, isWin: boolean) => {
    try {
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
      if (!response.ok) console.error("Failed to save score")
    } catch (error) {
      console.error("Error saving score:", error)
    }
  }

  const updateGameMap = () => {
    const map = gameMapRef.current
    if (!map) return

    const canvas = canvasRef.current
    if (!canvas) return

    map.duck.vy += 0.5
    map.duck.y += map.duck.vy
    map.duck.x += map.duck.vx
    map.duck.vx *= 0.9

    let onPlatform = false
    map.platforms.forEach((p) => {
      if (
        map.duck.y + map.duck.height >= p.y &&
        map.duck.y + map.duck.height <= p.y + 10 &&
        map.duck.x + map.duck.width > p.x &&
        map.duck.x < p.x + p.width
      ) {
        map.duck.y = p.y - map.duck.height
        map.duck.vy = 0
        map.duck.isJumping = false
        onPlatform = true
      }
    })

    if (map.duck.x < 0) map.duck.x = 0
    if (map.duck.x + map.duck.width > canvas.width) map.duck.x = canvas.width - map.duck.width
    if (map.duck.y > canvas.height) {
      saveGameScoreToDB(currentLevel, score, false)
      setGameState("LOSE")
      return
    }

    map.answerTiles.forEach((tile) => {
      if (!tile.picked && collide(map.duck, tile)) {
        tile.picked = true

        if (tile.correct) {
          map.key.visible = true
          setScore((prev) => prev + 100)
        } else {
          saveGameScoreToDB(currentLevel, score, false)
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
      const earnedCoins = score
      saveGameScoreToDB(currentLevel, score, true)
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
    ctx.fillRect(0, 0, canvas.width, 150)

    map.platforms.forEach((p) => {
      ctx.fillStyle = "#FF8C00"
      ctx.fillRect(p.x, p.y, p.width, p.height)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.strokeRect(p.x, p.y, p.width, p.height)

      ctx.fillStyle = "#7FD700"
      for (let i = 0; i < p.width; i += 10) {
        ctx.fillRect(p.x + i, p.y - 6, 8, 6)
      }
    })

    map.answerTiles.forEach((tile) => {
      ctx.fillStyle = tile.picked ? "#A9A9A9" : "#FFFF00"
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.strokeRect(tile.x, tile.y, tile.width, tile.height)

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
    }

    ctx.fillStyle = map.door.locked ? "#FF69B4" : "#90EE90"
    ctx.fillRect(map.door.x, map.door.y, map.door.width, map.door.height)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(map.door.x, map.door.y, map.door.width, map.door.height)

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
    ctx.fillRect(10, 10, 320, 100)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 320, 100)

    ctx.fillStyle = "#000"
    ctx.font = "bold 28px Arial"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`${map.math.a} × ${map.math.b} = ?`, 20, 20)

    ctx.font = "16px Arial"
    ctx.fillText("(Chạm vào ô đáp án)", 20, 60)
  }

  useEffect(() => {
    if (gameState !== "PLAYING") return

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true

      const map = gameMapRef.current
      if (!map) return

      if (["w", "arrowup", " "].includes(e.key.toLowerCase()) && !map.duck.isJumping) {
        map.duck.vy = -12
        map.duck.isJumping = true
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
    if (gameState !== "PLAYING") return

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
