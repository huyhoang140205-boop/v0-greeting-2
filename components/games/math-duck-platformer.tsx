"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GameState = "MENU" | "CHARACTER_SELECT" | "LEVEL_SELECT" | "PLAYING" | "WIN" | "SHOP" | "LOSE" | "SHOP_INGAME"
type Character = "duck" | "rabbit" | "bird" | "fish"

interface Platform {
  x: number
  y: number
  width: number
  height: number
}

interface MathProblem {
  a: number
  b: number
  correctAnswer: number
  options: number[]
}

interface GameData {
  duck: {
    x: number
    y: number
    width: number
    height: number
    vx: number
    vy: number
    isJumping: boolean
  }
  platforms: Platform[]
  goalDoor: { x: number; y: number; width: number; height: number }
  hasKey: boolean
  keyPosition: { x: number; y: number } | null
  math: MathProblem
  selectedAnswer: number | null
  showAnswers: boolean
}

export default function MathDuckPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [score, setScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [selectedCharacter, setSelectedCharacter] = useState<Character>("duck")
  const [ownedCharacters, setOwnedCharacters] = useState<Character[]>(["duck"])
  const [completedLevels, setCompletedLevels] = useState<number[]>([])

  const characterShop: Record<Character, { name: string; price: number; emoji: string }> = {
    duck: { name: "Vịt", price: 0, emoji: "🦆" },
    rabbit: { name: "Thỏ", price: 500, emoji: "🐰" },
    bird: { name: "Chim", price: 500, emoji: "🐦" },
    fish: { name: "Cá", price: 500, emoji: "🐠" },
  }

  const gameDataRef = useRef<GameData>({
    duck: {
      x: 80,
      y: 400,
      width: 40,
      height: 40,
      vx: 0,
      vy: 0,
      isJumping: false,
    },
    platforms: [],
    goalDoor: { x: 0, y: 0, width: 60, height: 80 },
    hasKey: false,
    keyPosition: null,
    math: { a: 0, b: 0, correctAnswer: 0, options: [] },
    selectedAnswer: null,
    showAnswers: true,
  })

  const generateMathProblem = (level: number): MathProblem => {
    const maxNum = Math.min(3 + Math.floor(level / 2), 12)
    const a = Math.floor(Math.random() * (maxNum - 1)) + 2
    const b = Math.floor(Math.random() * (maxNum - 1)) + 2
    const correctAnswer = a * b

    const options = [correctAnswer]
    while (options.length < 3) {
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

  const initGame = () => {
    const data = gameDataRef.current
    data.math = generateMathProblem(currentLevel)
    data.selectedAnswer = null
    data.showAnswers = true
    data.hasKey = false
    data.keyPosition = null

    const platformCount = 3 + Math.floor(currentLevel / 3)
    data.platforms = [{ x: 0, y: 450, width: 150, height: 30 }]

    for (let i = 1; i < platformCount; i++) {
      data.platforms.push({
        x: 100 + i * 160,
        y: 400 - (i % 3) * 60,
        width: 140,
        height: 30,
      })
    }

    data.goalDoor = {
      x: 100 + platformCount * 160 - 60,
      y: 350,
      width: 60,
      height: 80,
    }

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

  const startGame = () => {
    initGame()
    setScore(0)
    setTimeLeft(90)
    setGameState("PLAYING")
  }

  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const data = gameDataRef.current

    // Checkerboard background
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

    // Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ;[
      [200, 80],
      [700, 100],
    ].forEach(([cx, cy]) => {
      ctx.beginPath()
      ctx.arc(cx - 30, cy, 30, 0, Math.PI * 2)
      ctx.arc(cx + 10, cy, 35, 0, Math.PI * 2)
      ctx.arc(cx - 50, cy, 28, 0, Math.PI * 2)
      ctx.fill()
    })

    // Platforms
    data.platforms.forEach((p) => {
      ctx.fillStyle = "#FF8C00"
      ctx.fillRect(p.x, p.y, p.width, p.height)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 3
      ctx.strokeRect(p.x, p.y, p.width, p.height)

      ctx.fillStyle = "#7FD700"
      for (let i = 0; i < p.width; i += 10) {
        ctx.fillRect(p.x + i, p.y - 8, 8, 8)
      }
    })

    if (data.keyPosition && !data.hasKey) {
      ctx.fillStyle = "#FFD700"
      ctx.fillRect(data.keyPosition.x - 8, data.keyPosition.y - 8, 16, 16)
      ctx.fillStyle = "#FFA500"
      ctx.arc(data.keyPosition.x - 3, data.keyPosition.y - 3, 4, 0, Math.PI * 2)
      ctx.beginPath()
      ctx.arc(data.keyPosition.x - 3, data.keyPosition.y - 3, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Goal door
    ctx.fillStyle = "#FF69B4"
    ctx.fillRect(data.goalDoor.x, data.goalDoor.y, data.goalDoor.width, data.goalDoor.height)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 3
    ctx.strokeRect(data.goalDoor.x, data.goalDoor.y, data.goalDoor.width, data.goalDoor.height)

    ctx.fillStyle = data.hasKey ? "#00FF00" : "#FFFF00"
    ctx.fillRect(data.goalDoor.x + 10, data.goalDoor.y + 15, 40, 40)

    const characterEmoji =
      selectedCharacter === "duck"
        ? "🦆"
        : selectedCharacter === "rabbit"
          ? "🐰"
          : selectedCharacter === "bird"
            ? "🐦"
            : "🐠"

    ctx.font = "40px Arial"
    ctx.textAlign = "center"
    ctx.fillText(characterEmoji, data.duck.x + 20, data.duck.y + 25)

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    ctx.beginPath()
    ctx.ellipse(data.duck.x + 20, data.duck.y + 42, 18, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
    ctx.fillRect(10, 10, 320, 100)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, 320, 100)

    ctx.fillStyle = "#000"
    ctx.font = "bold 28px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`${data.math.a} × ${data.math.b} = ?`, 20, 45)

    ctx.font = "16px Arial"
    data.math.options.forEach((opt, idx) => {
      const y = 65 + idx * 18
      const isSelected = data.selectedAnswer === opt
      const isCorrect = opt === data.math.correctAnswer

      ctx.fillStyle = isSelected ? "#FFD700" : isCorrect && data.selectedAnswer ? "#90EE90" : "#FFF"
      ctx.fillRect(20, y - 12, 60, 16)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.strokeRect(20, y - 12, 60, 16)

      ctx.fillStyle = "#000"
      ctx.textAlign = "center"
      ctx.fillText(opt.toString(), 50, y)
    })
  }

  const update = () => {
    const data = gameDataRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    data.duck.vy += 0.5
    data.duck.y += data.duck.vy
    data.duck.x += data.duck.vx
    data.duck.vx *= 0.95

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

    if (data.duck.y > canvas.height) {
      setGameState("LOSE")
      return
    }

    if (data.keyPosition && !data.hasKey) {
      if (
        data.duck.x + data.duck.width > data.keyPosition.x - 20 &&
        data.duck.x < data.keyPosition.x + 20 &&
        data.duck.y + data.duck.height > data.keyPosition.y - 20 &&
        data.duck.y < data.keyPosition.y + 20
      ) {
        data.hasKey = true
        setScore((prev) => prev + 50)
      }
    }

    if (data.hasKey) {
      if (
        data.duck.x + data.duck.width > data.goalDoor.x &&
        data.duck.x < data.goalDoor.x + data.goalDoor.width &&
        data.duck.y + data.duck.height > data.goalDoor.y &&
        data.duck.y < data.goalDoor.y + data.goalDoor.height
      ) {
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

      const num = Number.parseInt(key)
      if (num >= 1 && num <= 3) {
        const data = gameDataRef.current
        data.selectedAnswer = data.math.options[num - 1]

        if (data.selectedAnswer === data.math.correctAnswer) {
          data.keyPosition = {
            x: data.duck.x + 60,
            y: 250,
          }
          data.showAnswers = false
        }
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
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [gameState])

  useEffect(() => {
    render()
  }, [])

  // Render based on gameState
  if (gameState === "MENU") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-400 to-blue-300 border-4 border-blue-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">🦆 MATH DUCK PLATFORMER</h1>
            <p className="text-2xl text-white">Nhảy & Giải Toán!</p>

            <div className="bg-white rounded-lg p-4 text-left space-y-2 text-lg">
              <p className="font-bold">Hướng dẫn:</p>
              <p>A/D hoặc ⬅️➡️: Di chuyển</p>
              <p>W hoặc ⬆️ hoặc SPACE: Nhảy</p>
              <p>1/2/3: Chọn đáp án</p>
              <p>Chọn đúng → Chìa khóa rơi ra</p>
              <p>Nhặt chìa khóa → Cửa mở</p>
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
                  className={`p-4 rounded-lg font-bold text-2xl border-4 transition ${
                    selectedCharacter === char
                      ? "bg-yellow-300 border-yellow-600 scale-110"
                      : "bg-white border-gray-400"
                  }`}
                >
                  {info.emoji}
                </button>
              ))}
            </div>

            <Button
              onClick={() => {
                setCurrentLevel(1)
                setGameState("LEVEL_SELECT")
              }}
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
                    className={`text-2xl py-6 font-black border-4 transition ${
                      isCompleted
                        ? "bg-green-400 hover:bg-green-500 border-green-700"
                        : "bg-blue-300 hover:bg-blue-400 border-blue-600"
                    }`}
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
            <Button
              onClick={() => setGameState("SHOP_INGAME")}
              className="text-lg px-3 py-1 font-black bg-purple-500 hover:bg-purple-600 text-white border-2"
            >
              🛍️ SHOP
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={900}
            height={550}
            className="w-full border-4 border-gray-800 rounded-lg bg-sky-300"
          />

          <div className="bg-white rounded-lg p-4 border-2">
            <p className="text-center font-bold text-lg">Nhấn 1, 2, hoặc 3 để chọn đáp án</p>
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
              onClick={() => {
                setGameState("CHARACTER_SELECT")
                setScore(0)
              }}
              className="text-2xl px-8 py-6 w-full font-black bg-blue-600 hover:bg-blue-700 text-white border-4"
            >
              🎮 CHƠI LẠI
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "SHOP_INGAME") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-purple-400 to-purple-300 border-4 border-purple-600">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-black text-white drop-shadow-lg">🛍️ SHOP NÓ</h1>
            <p className="text-2xl font-black">💰 {totalScore}</p>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(characterShop)
                .filter(([char]) => char !== "duck")
                .map(([char, info]) => (
                  <div key={char} className="bg-white rounded-lg p-4 border-2 space-y-2">
                    <p className="text-4xl">{info.emoji}</p>
                    <p className="font-bold">{info.name}</p>
                    <p className="text-lg font-black">💰 {info.price}</p>
                    <Button
                      onClick={() => {
                        if (totalScore >= info.price && !ownedCharacters.includes(char as Character)) {
                          setOwnedCharacters([...ownedCharacters, char as Character])
                          setTotalScore((prev) => prev - info.price)
                        }
                      }}
                      disabled={totalScore < info.price || ownedCharacters.includes(char as Character)}
                      className="w-full text-sm"
                    >
                      {ownedCharacters.includes(char as Character) ? "✓ CÓ" : "MUA"}
                    </Button>
                  </div>
                ))}
            </div>

            <Button
              onClick={() => setGameState("PLAYING")}
              className="text-2xl px-8 py-4 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4"
            >
              ⬅️ TIẾP TỤC
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "LOSE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-orange-300 to-orange-200 border-4 border-orange-600">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg">😢 THUA</h1>
            <p className="text-3xl font-bold">Điểm: {score}</p>
            <Button
              onClick={() => {
                setCurrentLevel(1)
                setGameState("CHARACTER_SELECT")
              }}
              className="text-2xl px-8 py-6 w-full font-black bg-orange-600 hover:bg-orange-700 text-white border-4"
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
