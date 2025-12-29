"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GameState = "MENU" | "CHARACTER_SELECT" | "LEVEL_SELECT" | "PLAYING" | "WIN" | "SHOP" | "LOSE"
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

export default function MathDuckPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [score, setScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [selectedCharacter, setSelectedCharacter] = useState<Character>("duck")
  const [ownedCharacters, setOwnedCharacters] = useState<Character[]>(["duck"])
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const gameMapRef = useRef<GameMap | null>(null)
  const keysPressed = useRef<Record<string, boolean>>({})

  const characterShop: Record<Character, { name: string; price: number; emoji: string }> = {
    duck: { name: "Vịt", price: 0, emoji: "🦆" },
    rabbit: { name: "Thỏ", price: 300, emoji: "🐰" },
    bird: { name: "Chim", price: 300, emoji: "🐦" },
    fish: { name: "Cá", price: 300, emoji: "🐠" },
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

    const platforms: MapObject[] = [
      { x: 50, y: 480, width: 120, height: 20 },
      { x: 200, y: 420, width: 120, height: 20 },
      { x: 350, y: 360, width: 120, height: 20 },
      { x: 500, y: 300, width: 120, height: 20 },
      { x: 650, y: 360, width: 120, height: 20 },
      { x: 750, y: 480, width: 120, height: 20 },
    ]

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
      platforms,
      questionSource: { x: 30, y: 80, width: 300, height: 80 },
      answerTiles: [
        {
          id: "A",
          x: 200,
          y: 360,
          width: 50,
          height: 50,
          value: math.options[0],
          correct: math.options[0] === math.correctAnswer,
          picked: false,
        },
        {
          id: "B",
          x: 350,
          y: 300,
          width: 50,
          height: 50,
          value: math.options[1],
          correct: math.options[1] === math.correctAnswer,
          picked: false,
        },
        {
          id: "C",
          x: 500,
          y: 240,
          width: 50,
          height: 50,
          value: math.options[2],
          correct: math.options[2] === math.correctAnswer,
          picked: false,
        },
        {
          id: "D",
          x: 650,
          y: 300,
          width: 50,
          height: 50,
          value: math.options[3],
          correct: math.options[3] === math.correctAnswer,
          picked: false,
        },
      ],
      key: { x: 400, y: 100, width: 30, height: 30, visible: false },
      door: { x: 800, y: 420, width: 50, height: 60, locked: true },
      math,
    }

    gameMapRef.current = gameMap
  }

  const collide = (a: MapObject, b: MapObject) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  const updateGameMap = () => {
    const map = gameMapRef.current
    if (!map) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Physics
    map.duck.vy += 0.5
    map.duck.y += map.duck.vy
    map.duck.x += map.duck.vx
    map.duck.vx *= 0.9

    // Platform collision
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

    // Boundaries
    if (map.duck.x < 0) map.duck.x = 0
    if (map.duck.x + map.duck.width > canvas.width) map.duck.x = canvas.width - map.duck.width
    if (map.duck.y > canvas.height) setGameState("LOSE")

    map.answerTiles.forEach((tile) => {
      if (!tile.picked && collide(map.duck, tile)) {
        tile.picked = true

        if (tile.correct) {
          map.key.visible = true
          setScore((prev) => prev + 100)
        } else {
          setScore((prev) => Math.max(0, prev - 20))
        }
      }
    })

    if (map.key.visible && collide(map.duck, map.key)) {
      map.key.visible = false
      map.door.locked = false
      setScore((prev) => prev + 50)
    }

    if (map.door.locked === false && collide(map.duck, map.door)) {
      setTotalScore((prev) => prev + score)
      if (!completedLevels.includes(currentLevel)) {
        setCompletedLevels([...completedLevels, currentLevel])
      }

      if (currentLevel >= 10) {
        setGameState("SHOP")
      } else {
        setCurrentLevel((prev) => prev + 1)
        setGameState("LEVEL_SELECT")
      }
    }
  }

  const renderGameMap = () => {
    const canvas = canvasRef.current
    const map = gameMapRef.current
    if (!canvas || !map) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Background
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

    // Sky
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(0, 0, canvas.width, 150)

    // Platforms
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

    // Answer tiles
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

    // Key
    if (map.key.visible) {
      ctx.fillStyle = "#FFD700"
      ctx.fillRect(map.key.x, map.key.y, map.key.width, map.key.height)
      ctx.strokeStyle = "#FFA500"
      ctx.lineWidth = 2
      ctx.strokeRect(map.key.x, map.key.y, map.key.width, map.key.height)
    }

    // Door
    ctx.fillStyle = map.door.locked ? "#FF69B4" : "#90EE90"
    ctx.fillRect(map.door.x, map.door.y, map.door.width, map.door.height)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(map.door.x, map.door.y, map.door.width, map.door.height)

    // Duck
    const charEmoji =
      selectedCharacter === "duck"
        ? "🦆"
        : selectedCharacter === "rabbit"
          ? "🐰"
          : selectedCharacter === "bird"
            ? "🐦"
            : "🐠"
    ctx.font = "40px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(charEmoji, map.duck.x + map.duck.width / 2, map.duck.y + map.duck.height / 2)

    // Question box at corner
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

  // Input handling
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

  // Game loop
  useEffect(() => {
    if (gameState !== "PLAYING") return

    const interval = setInterval(() => {
      const map = gameMapRef.current
      if (!map) return

      // Handle movement input
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

  const startGame = () => {
    initGameMap(currentLevel)
    setScore(0)
    setTimeLeft(120)
    setGameState("PLAYING")
  }

  // Render based on gameState
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
              onClick={() => setGameState("CHARACTER_SELECT")}
              className="text-3xl px-8 py-6 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4 border-green-700"
            >
              ▶️ BẮT ĐẦU
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "CHARACTER_SELECT") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-purple-400 to-purple-300 border-4 border-purple-600">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-black text-white drop-shadow-lg">Chọn Nhân Vật</h1>

            <div className="grid grid-cols-4 gap-4">
              {Object.entries(characterShop).map(([char, info]) => (
                <button
                  key={char}
                  onClick={() => {
                    setSelectedCharacter(char as Character)
                    setCurrentLevel(1)
                    startGame()
                  }}
                  className={`p-4 rounded-lg font-bold text-4xl border-4 transition ${selectedCharacter === char ? "bg-yellow-300 border-yellow-600 scale-110" : "bg-white border-gray-400"}`}
                >
                  {info.emoji}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setGameState("LEVEL_SELECT")}
              className="text-2xl px-8 py-4 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4"
            >
              🎮 CHƠI
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
              <div className="flex gap-2">
                <Button
                  onClick={() => setGameState("SHOP")}
                  className="text-xl px-6 py-3 font-black bg-purple-500 hover:bg-purple-600 text-white border-4"
                >
                  🛍️ SHOP
                </Button>
                <div className="bg-white rounded-lg px-4 py-2 border-4 text-2xl font-black">💰 {totalScore}</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => {
                const levelNum = i + 1
                const isCompleted = completedLevels.includes(levelNum)
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

            <Button
              onClick={() => setGameState("CHARACTER_SELECT")}
              className="text-2xl px-8 py-4 w-full font-black bg-red-500 hover:bg-red-600 text-white border-4"
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

  if (gameState === "SHOP") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-emerald-400 to-emerald-300 border-4 border-emerald-600">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-black text-white drop-shadow-lg">🎉 HOÀN THÀNH!</h1>
            <p className="text-3xl font-black text-white">Tổng Điểm: {totalScore}</p>

            <div className="bg-white rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-black">Mua Nhân Vật</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(characterShop)
                  .filter(([char]) => char !== "duck")
                  .map(([char, info]) => (
                    <div key={char} className="bg-gradient-to-b from-blue-200 to-blue-100 rounded-lg p-4 border-2">
                      <p className="text-4xl mb-2">{info.emoji}</p>
                      <p className="font-bold">{info.name}</p>
                      <p className="text-lg">💰 {info.price}</p>
                      <Button
                        onClick={() => {
                          if (totalScore >= info.price && !ownedCharacters.includes(char as Character)) {
                            setOwnedCharacters([...ownedCharacters, char as Character])
                            setTotalScore((prev) => prev - info.price)
                          }
                        }}
                        disabled={totalScore < info.price || ownedCharacters.includes(char as Character)}
                        className="w-full mt-2 text-sm"
                      >
                        {ownedCharacters.includes(char as Character) ? "✓ Có" : "Mua"}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              onClick={() => setGameState("CHARACTER_SELECT")}
              className="text-2xl px-8 py-6 w-full font-black bg-blue-600 hover:bg-blue-700 text-white border-4"
            >
              🎮 CHƠI LẠI
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "LOSE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-red-400 to-red-300 border-4 border-red-600">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-black text-white drop-shadow-lg">💔 HẾT THỜI GIAN!</h1>
            <p className="text-3xl font-black text-white">Điểm: {score}</p>

            <Button
              onClick={() => setGameState("LEVEL_SELECT")}
              className="text-2xl px-8 py-6 w-full font-black bg-blue-600 hover:bg-blue-700 text-white border-4"
            >
              🔄 THỬ LẠI
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
