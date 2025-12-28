"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { generateMap, type Tile } from "./logic/map-generator"
import { generateSimpleQuestion, type QuestionData } from "./logic/question-engine"
import { calculateScore } from "./logic/score-engine"
import { BoardMap } from "./board-map"
import { PlayerCharacter } from "./player-character"
import { Dice } from "./dice"
import { QuestionModal } from "./question-modal"
import { RewardPopup } from "./reward-popup"
import { AchievementMap } from "./achievement-map"
import React from "react"

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  unlocked: boolean
  condition: string
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "smart",
    title: "Bé Thông Minh",
    description: "Trả lời đúng 5 câu",
    emoji: "⭐",
    unlocked: false,
    condition: "5 correct",
  },
  {
    id: "diligent",
    title: "Siêu Chăm",
    description: "Chơi 3 ngày liên tiếp",
    emoji: "🔥",
    unlocked: false,
    condition: "3 days",
  },
  {
    id: "explorer",
    title: "Nhà Thám Hiểm",
    description: "Đi hết bản đồ",
    emoji: "👑",
    unlocked: false,
    condition: "finish map",
  },
]

const MemoizedBoardMap = React.memo(BoardMap)
const MemoizedPlayerCharacter = React.memo(PlayerCharacter)
const MemoizedDice = React.memo(Dice)

export function MathAdventureLand() {
  const [gameState, setGameState] = useState<"character-select" | "playing" | "finished">("character-select")
  const [selectedCharacter, setSelectedCharacter] = useState<string>("")
  const [tiles, setTiles] = useState<Tile[]>([])
  const [playerPosition, setPlayerPosition] = useState(0)
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [starsCollected, setStarsCollected] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null)
  const [showQuestion, setShowQuestion] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [rewardData, setRewardData] = useState({ amount: 0, type: "points" as const })
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS)
  const [diceRolled, setDiceRolled] = useState(false)

  const characters = [
    { id: "doremon", name: "Doremon", avatar: "/avarta/doremon.jpg" },
    { id: "pikachu", name: "Pikachu", avatar: "/avarta/pikachu.jpg" },
    { id: "goku", name: "Goku", avatar: "/avarta/goku.jpg" },
  ]

  const selectedCharData = characters.find((c) => c.id === selectedCharacter)

  // Initialize game
  useEffect(() => {
    if (gameState === "playing" && tiles.length === 0) {
      const newTiles = generateMap(40)
      setTiles(newTiles)
    }
  }, [gameState, tiles.length])

  // Character selection
  if (gameState === "character-select") {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-xl">
        <h1 className="text-4xl font-bold text-center text-purple-900">🎮 Vùng Đất Phiêu Lưu Toán Học</h1>
        <p className="text-xl text-center text-purple-800">Chọn nhân vật yêu thích của bạn!</p>

        <div className="grid grid-cols-3 gap-4">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char.id)}
              className="space-y-3 p-4 bg-white rounded-lg border-4 border-purple-300 hover:border-purple-500 transition-all hover:scale-105 cursor-pointer shadow-md"
            >
              <img
                src={char.avatar || "/placeholder.svg"}
                alt={char.name}
                className="w-full h-32 object-cover rounded-lg border-2 border-purple-300"
                loading="lazy"
              />
              <p className="text-lg font-bold text-purple-900">{char.name}</p>
            </button>
          ))}
        </div>

        <Button
          onClick={() => setGameState("playing")}
          disabled={!selectedCharacter}
          className="w-full text-2xl font-bold bg-green-500 hover:bg-green-600 text-white py-6"
        >
          Bắt Đầu Phiêu Lưu! 🚀
        </Button>
      </div>
    )
  }

  // Playing state
  if (gameState === "playing" && selectedCharData) {
    const currentTile = tiles[playerPosition]
    const isFinished = playerPosition >= tiles.length - 1

    const handleDiceRoll = (value: number) => {
      const newPosition = Math.min(playerPosition + value, tiles.length - 1)
      setPlayerPosition(newPosition)
      setDiceRolled(true)

      setTimeout(() => {
        const question = generateSimpleQuestion()
        setCurrentQuestion(question)
        setShowQuestion(true)
        setDiceRolled(false)
      }, 1200)

      // Check for finish
      if (newPosition >= tiles.length - 1) {
        setTimeout(() => {
          setGameState("finished")
        }, 2500)
      }
    }

    const handleAnswer = (correct: boolean) => {
      setShowQuestion(false)

      if (correct) {
        setCorrectAnswers((c) => c + 1)
        setScore((s) => s + 10)

        if (currentTile?.type === "star") {
          setStarsCollected((s) => s + 1)
          setRewardData({ amount: 10, type: "star" })
        } else if (currentTile?.type === "treasure") {
          setRewardData({ amount: 25, type: "treasure" })
          setScore((s) => s + 25)
        } else {
          setRewardData({ amount: 10, type: "points" })
        }

        if (correctAnswers + 1 === 5) {
          setAchievements((a) => a.map((ach) => (ach.id === "smart" ? { ...ach, unlocked: true } : ach)))
        }
      } else {
        setWrongAnswers((w) => w + 1)
      }

      setShowReward(true)
    }

    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-green-100 via-cyan-100 to-blue-100 rounded-xl min-h-screen">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-green-900">🎮 Vùng Đất Phiêu Lưu Toán Học</h1>
          <Button
            onClick={() => {
              setGameState("character-select")
              setPlayerPosition(0)
              setScore(0)
              setCorrectAnswers(0)
              setWrongAnswers(0)
              setStarsCollected(0)
              setTiles([])
            }}
            variant="outline"
            className="text-lg"
          >
            ← Quay Lại
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Character & Status */}
          <div className="space-y-4">
            <MemoizedPlayerCharacter
              avatar={selectedCharData.avatar}
              name={selectedCharData.name}
              score={score}
              position={playerPosition}
            />
            <div className="bg-white rounded-lg p-4 border-3 border-blue-300 space-y-2">
              <p className="text-lg font-bold text-blue-900">✅ Đúng: {correctAnswers}</p>
              <p className="text-lg font-bold text-red-600">❌ Sai: {wrongAnswers}</p>
              <p className="text-lg font-bold text-yellow-600">⭐ Sao: {starsCollected}</p>
            </div>
            <AchievementMap achievements={achievements} />
          </div>

          {/* Center: Board & Dice */}
          <div className="space-y-4">
            <MemoizedBoardMap tiles={tiles} playerPosition={playerPosition} />
            <MemoizedDice onRoll={handleDiceRoll} disabled={diceRolled || showQuestion || isFinished} />
          </div>

          {/* Right: Info */}
          <div className="bg-gradient-to-b from-yellow-100 to-orange-100 rounded-lg p-4 border-3 border-yellow-400 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tiến độ</p>
              <div className="text-3xl font-bold text-yellow-900">
                {playerPosition}/{tiles.length - 1}
              </div>
              <div className="w-full bg-gray-300 rounded-full h-4 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-full transition-all"
                  style={{
                    width: `${(playerPosition / (tiles.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {currentTile && (
              <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                <p className="text-sm text-gray-600">Ô Hiện Tại</p>
                <p className="text-3xl">
                  {currentTile.type === "normal"
                    ? "🟩"
                    : currentTile.type === "star"
                      ? "⭐"
                      : currentTile.type === "treasure"
                        ? "🎁"
                        : currentTile.type === "achievement"
                          ? "🏆"
                          : "👑"}
                </p>
                <p className="text-sm font-bold text-gray-700 capitalize">{currentTile.type}</p>
              </div>
            )}
          </div>
        </div>

        <QuestionModal question={currentQuestion} isOpen={showQuestion} onAnswer={handleAnswer} />
        <RewardPopup
          isOpen={showReward}
          reward={rewardData.amount}
          rewardType={rewardData.type}
          onClose={() => setShowReward(false)}
        />
      </div>
    )
  }

  // Finished state
  if (gameState === "finished") {
    const finalScore = calculateScore(correctAnswers, wrongAnswers, starsCollected)

    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-200 rounded-xl text-center min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-yellow-900">🎉 Hoàn Thành!</h1>
        <p className="text-3xl font-bold text-orange-900">Bạn đã đi hết bản đồ!</p>

        <div className="bg-white rounded-lg p-8 border-4 border-yellow-400 max-w-md">
          <h2 className="text-3xl font-bold text-yellow-900 mb-4">📊 Kết Quả</h2>
          <div className="space-y-3 text-2xl font-bold">
            <p>
              ✅ Đúng: <span className="text-green-600">{correctAnswers}</span>
            </p>
            <p>
              ❌ Sai: <span className="text-red-600">{wrongAnswers}</span>
            </p>
            <p>
              ⭐ Sao: <span className="text-yellow-600">{starsCollected}</span>
            </p>
            <div className="border-t-2 border-gray-300 pt-3">
              <p className="text-3xl">
                💯 Tổng Điểm: <span className="text-green-600">{finalScore.totalScore}</span>
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setGameState("character-select")
            setPlayerPosition(0)
            setScore(0)
            setCorrectAnswers(0)
            setWrongAnswers(0)
            setStarsCollected(0)
            setTiles([])
            setSelectedCharacter("")
            setAchievements(INITIAL_ACHIEVEMENTS)
          }}
          className="text-2xl font-bold bg-green-500 hover:bg-green-600 text-white py-6 px-8"
        >
          🎮 Chơi Lại
        </Button>
      </div>
    )
  }

  return null
}
