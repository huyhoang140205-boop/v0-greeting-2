"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { generateLevel, type QuestionTile } from "./logic/times-table-duck"

type GameState = "START" | "PLAYING" | "WIN" | "LOSE"

export default function TimesTableDuck() {
  const [gameState, setGameState] = useState<GameState>("START")
  const [level, setLevel] = useState(1)
  const [tiles, setTiles] = useState<QuestionTile[]>([])
  const [currentTileIndex, setCurrentTileIndex] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [duckX, setDuckX] = useState(0)
  const [duckY, setDuckY] = useState(0)
  const [gameLevel, setGameLevel] = useState(generateLevel(1))

  // Start game
  const startGame = useCallback(() => {
    const newLevel = generateLevel(level)
    setGameLevel(newLevel)
    setTiles(newLevel.tiles)
    setCurrentTileIndex(0)
    setDuckX(0)
    setDuckY(0)
    setTimeLeft(newLevel.timeLimit)
    setScore(0)
    setCombo(0)
    setGameState("PLAYING")
  }, [level])

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

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== "PLAYING") return

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if (["arrowup", "w"].includes(key)) {
        setDuckY((prev) => Math.max(0, prev - 1))
      } else if (["arrowdown", "s"].includes(key)) {
        setDuckY((prev) => Math.min(4, prev + 1))
      } else if (["arrowleft", "a"].includes(key)) {
        setDuckX((prev) => Math.max(0, prev - 1))
      } else if (["arrowright", "d"].includes(key)) {
        setDuckX((prev) => Math.min(4, prev + 1))
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [gameState])

  // Check collision with tiles
  useEffect(() => {
    if (gameState !== "PLAYING" || tiles.length === 0) return

    const currentTile = tiles[currentTileIndex]
    if (!currentTile) return

    if (duckX === currentTile.x && duckY === currentTile.y && !currentTile.completed) {
      // Touch tile - mark as completed
      const newTiles = [...tiles]
      newTiles[currentTileIndex].completed = true
      setTiles(newTiles)

      // Check if correct sequence
      const correctOrder = tiles.slice(0, currentTileIndex + 1).every((t) => t.completed)

      if (correctOrder) {
        setCombo((prev) => prev + 1)
        setScore((prev) => prev + 100 * (currentTileIndex + 1))

        // Move to next tile
        if (currentTileIndex < tiles.length - 1) {
          setCurrentTileIndex((prev) => prev + 1)
        } else {
          // All tiles completed
          setGameState("WIN")
        }
      } else {
        // Wrong order - lose
        setGameState("LOSE")
      }
    }
  }, [duckX, duckY, gameState, tiles, currentTileIndex])

  // Save score to database
  const saveScore = useCallback(async () => {
    try {
      const response = await fetch("/api/games/times-table-duck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          duration: gameLevel.timeLimit - timeLeft,
          combo,
          metadata: {
            level,
            correct: currentTileIndex + 1,
            wrong: tiles.length - (currentTileIndex + 1),
            timeLeft,
            maxTable: gameLevel.maxTable,
          },
        }),
      })

      if (!response.ok) console.error("Failed to save score")
    } catch (error) {
      console.error("Error saving score:", error)
    }
  }, [score, gameLevel, combo, level, currentTileIndex, tiles.length, timeLeft])

  // Game over handlers
  useEffect(() => {
    if (gameState === "WIN" || gameState === "LOSE") {
      saveScore()
    }
  }, [gameState, saveScore])

  const gridSize = Math.max(...tiles.map((t) => Math.max(t.x, t.y)), 4) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-lg">
          <div className="text-2xl font-bold">
            ⏱️ <span className="text-red-500">{timeLeft}s</span>
          </div>
          <h1 className="text-3xl font-bold">🦆 Times Table Duck</h1>
          <div className="text-2xl font-bold">
            ⭐ <span className="text-yellow-500">{score}</span>
          </div>
        </div>

        {/* Game Start */}
        {gameState === "START" && (
          <Card className="p-8 text-center space-y-4">
            <h2 className="text-4xl font-bold">🦆 Times Table Duck</h2>
            <p className="text-lg text-gray-700">
              Điều khiển con vịt bằng ⬆⬇⬅➡ hoặc WASD để chạm các ô phép nhân theo đúng thứ tự!
            </p>
            <div className="space-y-2">
              <p className="text-xl font-semibold">Chọn cấp độ:</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map((lvl) => (
                  <Button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    variant={level === lvl ? "default" : "outline"}
                    className="text-lg px-6 py-2"
                  >
                    Cấp {lvl}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={startGame} className="text-xl px-8 py-4 w-full bg-green-500 hover:bg-green-600">
              🎮 Bắt đầu
            </Button>
          </Card>
        )}

        {/* Game Playing */}
        {gameState === "PLAYING" && (
          <div className="space-y-4">
            {/* Game Grid */}
            <Card className="p-4 bg-white shadow-lg">
              <div
                className="grid gap-2 bg-gradient-to-br from-green-100 to-blue-100 p-4 rounded-lg"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(60px, 1fr))`,
                }}
              >
                {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                  const x = idx % gridSize
                  const y = Math.floor(idx / gridSize)
                  const tile = tiles.find((t) => t.x === x && t.y === y)
                  const isDuck = duckX === x && duckY === y
                  const isCurrentTile = tile && tile.id === currentTileIndex

                  return (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg flex items-center justify-center relative border-2"
                      style={{
                        borderColor: isDuck ? "#000" : "#ccc",
                        backgroundColor: isDuck ? "#FFD700" : "white",
                      }}
                    >
                      {isDuck && <span className="text-3xl">🦆</span>}

                      {tile && (
                        <div
                          className={`text-center text-xs font-bold w-full h-full flex flex-col items-center justify-center rounded ${
                            tile.completed
                              ? "bg-green-400 text-white"
                              : isCurrentTile
                                ? "bg-blue-400 text-white ring-4 ring-yellow-300"
                                : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          <div>{tile.question}</div>
                          <div className="text-xs">= {tile.answer}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-4 bg-yellow-100 border-2 border-yellow-500">
              <p className="text-center text-lg font-bold">
                🎯 Chạm ô {tiles[currentTileIndex]?.question || "..."} tiếp theo!
              </p>
              <p className="text-center text-sm text-gray-700 mt-2">Combo: {combo}</p>
            </Card>
          </div>
        )}

        {/* Win Screen */}
        {gameState === "WIN" && (
          <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-green-300 to-blue-300">
            <h2 className="text-5xl font-bold">🎉 Thắng!</h2>
            <div className="text-4xl font-bold text-green-700">Điểm: {score}</div>
            <div className="text-2xl">Combo Max: {combo}</div>
            <Button
              onClick={() => setGameState("START")}
              className="text-xl px-8 py-4 w-full bg-green-600 hover:bg-green-700"
            >
              🎮 Chơi lại
            </Button>
          </Card>
        )}

        {/* Lose Screen */}
        {gameState === "LOSE" && (
          <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-red-300 to-orange-300">
            <h2 className="text-5xl font-bold">😢 Thua!</h2>
            <div className="text-4xl font-bold text-red-700">Điểm: {score}</div>
            <p className="text-lg">Chạm sai thứ tự hoặc hết thời gian</p>
            <Button
              onClick={() => setGameState("START")}
              className="text-xl px-8 py-4 w-full bg-orange-600 hover:bg-orange-700"
            >
              🎮 Thử lại
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
