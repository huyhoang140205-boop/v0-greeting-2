"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { generateLevel, type QuestionTile } from "./logic/times-table-duck"

type GameState = "START" | "PLAYING" | "WIN" | "LOSE"
type TileStatus = "empty" | "unsolved" | "active" | "correct"

export default function TimesTableDuck() {
  const [gameState, setGameState] = useState<GameState>("START")
  const [level, setLevel] = useState(1)
  const [tiles, setTiles] = useState<QuestionTile[]>([])
  const [currentTileIndex, setCurrentTileIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [duckX, setDuckX] = useState(0)
  const [duckY, setDuckY] = useState(0)
  const [gameLevel, setGameLevel] = useState(generateLevel(1))
  const [isMoving, setIsMoving] = useState(false)
  const [feedbackTile, setFeedbackTile] = useState<{ index: number; type: "correct" | "wrong" } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getTileStatus = useCallback(
    (tile: QuestionTile | undefined, x: number, y: number): TileStatus => {
      if (!tile) return "empty"
      if (tile.completed) return "correct"
      if (duckX === x && duckY === y) return "active"
      return "unsolved"
    },
    [duckX, duckY],
  )

  // Start game
  const startGame = useCallback(() => {
    const newLevel = generateLevel(level)
    setGameLevel(newLevel)
    setTiles(newLevel.tiles)
    setCurrentTileIndex(0)
    setDuckX(Math.floor(newLevel.tiles[0]?.x || 0))
    setDuckY(Math.floor(newLevel.tiles[0]?.y || 0))
    setTimeLeft(newLevel.timeLimit)
    setScore(0)
    setGameState("PLAYING")
  }, [level])

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

  useEffect(() => {
    if (gameState !== "PLAYING" || isMoving) return

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const cols = 6
      const rows = 6

      let newX = duckX
      let newY = duckY

      if (["arrowup", "w"].includes(key)) {
        newY = Math.max(0, duckY - 1)
        e.preventDefault()
      } else if (["arrowdown", "s"].includes(key)) {
        newY = Math.min(rows - 1, duckY + 1)
        e.preventDefault()
      } else if (["arrowleft", "a"].includes(key)) {
        newX = Math.max(0, duckX - 1)
        e.preventDefault()
      } else if (["arrowright", "d"].includes(key)) {
        newX = Math.min(cols - 1, duckX + 1)
        e.preventDefault()
      }

      if (newX !== duckX || newY !== duckY) {
        setIsMoving(true)
        setTimeout(() => {
          setDuckX(newX)
          setDuckY(newY)
          setIsMoving(false)
        }, 200)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [gameState, isMoving, duckX, duckY])

  useEffect(() => {
    if (gameState !== "PLAYING" || tiles.length === 0 || isMoving) return

    const currentTile = tiles[currentTileIndex]
    if (!currentTile) return

    if (duckX === currentTile.x && duckY === currentTile.y && !currentTile.completed) {
      // Play sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }

      // Mark as completed
      const newTiles = [...tiles]
      newTiles[currentTileIndex].completed = true
      setTiles(newTiles)
      setFeedbackTile({ index: currentTileIndex, type: "correct" })

      // Add score
      setScore((prev) => prev + 100)

      // Move to next tile
      setTimeout(() => {
        if (currentTileIndex < tiles.length - 1) {
          setCurrentTileIndex((prev) => prev + 1)
          setFeedbackTile(null)
        } else {
          setGameState("WIN")
        }
      }, 600)
    }
  }, [duckX, duckY, gameState, tiles, currentTileIndex, isMoving])

  const saveScore = useCallback(async () => {
    try {
      await fetch("/api/games/times-table-duck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          duration: gameLevel.timeLimit - timeLeft,
          combo: currentTileIndex + 1,
          metadata: {
            level,
            correct: currentTileIndex + 1,
            wrong: Math.max(0, tiles.length - (currentTileIndex + 1)),
            timeLeft: Math.max(0, timeLeft),
          },
        }),
      })
    } catch (error) {
      console.error("[v0] Error saving score:", error)
    }
  }, [score, gameLevel, level, currentTileIndex, tiles.length, timeLeft])

  useEffect(() => {
    if (gameState === "WIN" || gameState === "LOSE") {
      saveScore()
    }
  }, [gameState, saveScore])

  const gridCols = 6
  const gridRows = 6

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-200 via-sky-100 to-green-100 p-4">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj=="
      />

      {/* Start Screen */}
      {gameState === "START" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-300 to-blue-200 border-4 border-blue-500">
            <div className="text-center space-y-8">
              {/* Title */}
              <div>
                <h1
                  className="text-6xl font-black text-white drop-shadow-lg mb-2"
                  style={{ textShadow: "3px 3px 0 #0066CC" }}
                >
                  MATH DUCK
                </h1>
                <div className="text-5xl">🦆</div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg p-4 text-left space-y-2">
                <p className="text-xl font-bold text-gray-800">Hướng dẫn:</p>
                <p className="text-lg text-gray-700">⬆️⬇️⬅️➡️ hoặc WASD để điều khiển vịt chạm các ô theo thứ tự</p>
                <p className="text-lg text-gray-700">✅ Giải đúng = Xanh lá, scale up + particle</p>
                <p className="text-lg text-gray-700">❌ Sai thứ tự = Tile rung, flash đỏ</p>
              </div>

              {/* Level Selection */}
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
                          : "bg-white text-gray-800 border-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {lvl === 1 && "Dễ 1-3"}
                      {lvl === 2 && "Vừa 1-6"}
                      {lvl === 3 && "Khó 1-12"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={startGame}
                className="text-3xl px-8 py-6 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 rounded-xl"
              >
                ▶️ CHƠI
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Playing Screen */}
      {gameState === "PLAYING" && (
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center bg-white rounded-lg p-4 border-4 border-gray-400 shadow-lg">
            <div className="text-3xl font-black text-red-500">⏱️ {timeLeft}s</div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Ô {currentTileIndex + 1}/{tiles.length}
              </p>
              <p className="text-2xl font-black text-yellow-600">⭐ {score}</p>
            </div>
            <div className="text-3xl">🦆</div>
          </div>

          {/* Game Grid */}
          <div className="bg-gradient-to-br from-cyan-300 to-emerald-200 rounded-xl p-6 border-4 border-cyan-600 shadow-2xl">
            <div
              className="grid gap-3 bg-white p-4 rounded-lg"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(70px, 1fr))`,
              }}
            >
              {Array.from({ length: gridCols * gridRows }).map((_, idx) => {
                const x = idx % gridCols
                const y = Math.floor(idx / gridCols)
                const tile = tiles.find((t) => t.x === x && t.y === y)
                const isDuck = duckX === x && duckY === y
                const status = getTileStatus(tile, x, y)
                const isFeedback = feedbackTile?.index === currentTileIndex && isDuck

                return (
                  <div
                    key={idx}
                    className={`aspect-square flex items-center justify-center rounded-xl border-2 font-bold text-center transition-all duration-200 relative overflow-hidden ${
                      status === "correct"
                        ? "bg-emerald-300 border-emerald-500 text-white scale-105"
                        : status === "active"
                          ? "bg-blue-300 border-yellow-400 border-4 text-white"
                          : status === "unsolved"
                            ? "bg-gray-300 border-gray-400 text-gray-600"
                            : "bg-white border-gray-200 text-gray-300"
                    } ${isFeedback ? "animate-bounce" : ""}`}
                  >
                    {/* Duck character */}
                    {isDuck && !tile && <span className="text-4xl">🦆</span>}

                    {/* Tile content */}
                    {tile && (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        {isDuck && <span className="text-2xl absolute top-1 left-1">🦆</span>}
                        <div className="text-xs leading-tight">
                          <div className="font-black">{tile.question}</div>
                          <div className="text-xs">=</div>
                          <div className="font-black">{tile.answer}</div>
                        </div>
                      </div>
                    )}

                    {/* Particle effect for correct answer */}
                    {isFeedback && status === "correct" && (
                      <>
                        <span className="absolute animate-pulse text-xl">⭐</span>
                        <span className="absolute animate-pulse text-xl">✨</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-300 border-2 border-emerald-500 rounded"></div>
                <span>Đúng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-300 border-4 border-yellow-400 rounded"></div>
                <span>Hiện tại</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400 rounded"></div>
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded"></div>
                <span>Trống</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-200 border-4 border-yellow-500 rounded-lg p-4 text-center">
            <p className="text-xl font-black text-gray-800">
              🎯 Chạm ô tiếp theo: <span className="text-blue-600">{tiles[currentTileIndex]?.question}</span>
            </p>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {gameState === "WIN" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-emerald-300 to-emerald-200 border-4 border-emerald-600">
            <div className="text-center space-y-6">
              <h1 className="text-6xl font-black text-white drop-shadow-lg">🎉 THẮNG!</h1>
              <div className="text-5xl">⭐✨🎉</div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-4xl font-black text-green-600">Điểm: {score}</p>
                <p className="text-lg text-gray-700 mt-2">Luyện tập tốt lắm!</p>
              </div>
              <Button
                onClick={() => setGameState("START")}
                className="text-2xl px-8 py-6 w-full font-black bg-green-600 hover:bg-green-700 text-white border-4 border-green-800"
              >
                🎮 CHƠI LẠI
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Lose Screen */}
      {gameState === "LOSE" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-orange-300 to-orange-200 border-4 border-orange-600">
            <div className="text-center space-y-6">
              <h1 className="text-6xl font-black text-white drop-shadow-lg">😢 HẾT THỜI GIAN</h1>
              <div className="text-5xl">⏰</div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-3xl font-black text-orange-600">Điểm: {score}</p>
                <p className="text-lg text-gray-700 mt-2">Thử lại lần nữa nhé!</p>
              </div>
              <Button
                onClick={() => setGameState("START")}
                className="text-2xl px-8 py-6 w-full font-black bg-orange-600 hover:bg-orange-700 text-white border-4 border-orange-800"
              >
                🎮 THỬ LẠI
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
