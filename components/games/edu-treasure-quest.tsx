"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import confetti from "canvas-confetti"

const CHARACTER_AVATARS = [
  { id: 1, name: "🕵️ Thám Tử", emoji: "🕵️", color: "from-blue-400 to-blue-600" },
  { id: 2, name: "👨‍🚀 Phi Hành Gia", emoji: "👨‍🚀", color: "from-purple-400 to-purple-600" },
  { id: 3, name: "🧗 Nhà Thám Hiểm", emoji: "🧗", color: "from-orange-400 to-orange-600" },
  { id: 4, name: "🥷 Ninja", emoji: "🥷", color: "from-black to-gray-800" },
  { id: 5, name: "👸 Công Chúa", emoji: "👸", color: "from-pink-400 to-pink-600" },
  { id: 6, name: "🤖 Robot", emoji: "🤖", color: "from-gray-400 to-gray-600" },
]

// Questions data - diverse types for elementary students
const QUESTIONS_DATABASE = [
  // Toán học
  { id: 1, type: "math", question: "2 + 3 = ?", answer: "5", options: ["3", "4", "5", "6"], icon: "🔢" },
  { id: 2, type: "math", question: "10 - 4 = ?", answer: "6", options: ["5", "6", "7", "8"], icon: "🔢" },
  { id: 3, type: "math", question: "3 × 2 = ?", answer: "6", options: ["4", "5", "6", "7"], icon: "🔢" },
  { id: 4, type: "math", question: "8 ÷ 2 = ?", answer: "4", options: ["2", "3", "4", "5"], icon: "🔢" },
  { id: 5, type: "math", question: "5 + 7 = ?", answer: "12", options: ["10", "11", "12", "13"], icon: "🔢" },
  { id: 6, type: "math", question: "6 × 3 = ?", answer: "18", options: ["15", "18", "20", "24"], icon: "🔢" },
  { id: 7, type: "math", question: "20 ÷ 4 = ?", answer: "5", options: ["4", "5", "6", "7"], icon: "🔢" },

  // Tiếng Việt
  {
    id: 8,
    type: "vietnamese",
    question: "Con vật nào biết bay?",
    answer: "Chim",
    options: ["Cá", "Chim", "Cua", "Ốc"],
    icon: "🔤",
  },
  {
    id: 9,
    type: "vietnamese",
    question: "Màu của lá cây là?",
    answer: "Xanh",
    options: ["Đỏ", "Xanh", "Vàng", "Tím"],
    icon: "🔤",
  },
  {
    id: 10,
    type: "vietnamese",
    question: "Nước ở đâu?",
    answer: "Biển",
    options: ["Núi", "Rừng", "Biển", "Trời"],
    icon: "🔤",
  },
  {
    id: 11,
    type: "vietnamese",
    question: "Quả nào có hạt nhỏ?",
    answer: "Dâu tây",
    options: ["Chuối", "Dâu tây", "Xoài", "Dừa"],
    icon: "🔤",
  },

  // Tiếng Anh
  { id: 12, type: "english", question: "Cat = ?", answer: "Mèo", options: ["Chó", "Mèo", "Chim", "Cá"], icon: "🌐" },
  {
    id: 13,
    type: "english",
    question: "Apple = ?",
    answer: "Táo",
    options: ["Cam", "Táo", "Chuối", "Dâu"],
    icon: "🌐",
  },
  {
    id: 14,
    type: "english",
    question: "Sun = ?",
    answer: "Mặt trời",
    options: ["Mặt trăng", "Mặt trời", "Sao", "Mây"],
    icon: "🌐",
  },
  {
    id: 15,
    type: "english",
    question: "Tree = ?",
    answer: "Cây",
    options: ["Hoa", "Cây", "Lá", "Quả"],
    icon: "🌐",
  },

  // Khoa học
  {
    id: 16,
    type: "science",
    question: "Cây cần gì để sống?",
    answer: "Nước và ánh sáng",
    options: ["Nước", "Nước và ánh sáng", "Không khí", "Đất"],
    icon: "🔬",
  },
  {
    id: 17,
    type: "science",
    question: "Con chim có bao nhiêu chân?",
    answer: "2",
    options: ["4", "2", "6", "8"],
    icon: "🔬",
  },
  {
    id: 18,
    type: "science",
    question: "Con cá sống ở đâu?",
    answer: "Nước",
    options: ["Trên đất", "Trên cây", "Nước", "Trên mây"],
    icon: "🔬",
  },
]

const GAME_MAP = [
  { id: 1, name: "🏠 Nhà Cũ", terrain: "house", position: [0, 0] },
  { id: 2, name: "🌳 Rừng", terrain: "forest", position: [1, 0] },
  { id: 3, name: "🏞️ Thung Lũng", terrain: "valley", position: [2, 0] },
  { id: 4, name: "🗻 Núi Cao", terrain: "mountain", position: [3, 0] },
  { id: 5, name: "🏖️ Bãi Cát", terrain: "beach", position: [4, 0] },
  { id: 6, name: "🌊 Biển Xanh", terrain: "sea", position: [5, 0] },
  { id: 7, name: "🏝️ Đảo Huyền Thoại", terrain: "island", position: [6, 0] },
  { id: 8, name: "💎 Kho Báu", terrain: "treasure", position: [7, 0] },
]

const TREASURE_MILESTONES = [3, 6]

export function EduTreasureQuest() {
  const [selectedCharacter, setSelectedCharacter] = useState<(typeof CHARACTER_AVATARS)[0] | null>(null)
  const [currentTile, setCurrentTile] = useState(0)
  const [completedTiles, setCompletedTiles] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [unlockedTreasures, setUnlockedTreasures] = useState<number[]>([])
  const [showChallenge, setShowChallenge] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS_DATABASE[0])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [showTreasureModal, setShowTreasureModal] = useState(false)
  const [treasureJustOpened, setTreasureJustOpened] = useState<number | null>(null)
  const [collectedStickers, setCollectedStickers] = useState<string[]>([])
  const [wrongAttempts, setWrongAttempts] = useState(0)

  const getRandomQuestion = () => {
    return QUESTIONS_DATABASE[Math.floor(Math.random() * QUESTIONS_DATABASE.length)]
  }

  const handleAnswer = (option: string) => {
    setSelectedAnswer(option)
    setShowResult(true)

    if (option === currentQuestion.answer) {
      setScore(score + 10)
      const newCompleted = [...completedTiles, currentTile]
      setCompletedTiles(newCompleted)
      setWrongAttempts(0)

      const treasureIndex = TREASURE_MILESTONES.findIndex((m) => m === newCompleted.length)
      if (treasureIndex !== -1 && !unlockedTreasures.includes(treasureIndex)) {
        setUnlockedTreasures([...unlockedTreasures, treasureIndex])
        setTreasureJustOpened(treasureIndex)
        setShowTreasureModal(true)
        const stickerTypes = ["🌟", "✨", "🎉", "💎", "🏆"]
        setCollectedStickers([...collectedStickers, stickerTypes[treasureIndex]])
      }

      setTimeout(() => {
        if (currentTile < GAME_MAP.length - 1) {
          setCurrentTile(currentTile + 1)
          setSelectedAnswer(null)
          setShowResult(false)
          setShowChallenge(false)
          setCurrentQuestion(getRandomQuestion())
        } else {
          setGameComplete(true)
          confetti({ particleCount: 500, spread: 180, duration: 3000 })
        }
      }, 1500)
    } else {
      const newWrongAttempts = wrongAttempts + 1
      setWrongAttempts(newWrongAttempts)

      if (newWrongAttempts >= 2) {
        setTimeout(() => {
          setSelectedAnswer(null)
          setShowResult(false)
          setCurrentQuestion(getRandomQuestion())
          setWrongAttempts(0)
        }, 2000)
      }
    }
  }

  if (!selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-purple-800">🎮 Chọn Nhân Vật</h1>
            <p className="text-lg text-gray-700">Chọn nhân vật của bạn để bắt đầu phiêu lưu tìm kho báu!</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CHARACTER_AVATARS.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={`p-6 rounded-lg border-4 bg-gradient-to-br ${character.color} text-white font-bold text-center hover:scale-110 transition-transform shadow-lg`}
              >
                <div className="text-6xl mb-3">{character.emoji}</div>
                <div className="text-lg">{character.name.split(" ")[1]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tile = GAME_MAP[currentTile]
  const isTileCompleted = completedTiles.includes(currentTile)
  const progress = (completedTiles.length / GAME_MAP.length) * 100

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-300 to-blue-300 flex items-center justify-center p-4">
        <div className="space-y-6 w-full max-w-2xl">
          <Card className="border-4 border-yellow-400 bg-white shadow-2xl">
            <CardHeader className="text-center space-y-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-t-lg">
              <div className="text-7xl animate-bounce">💎✨🏆</div>
              <CardTitle className="text-4xl text-yellow-600">Bạn Tìm Được Kho Báu!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-center gap-4 items-center">
                <div className="text-6xl">{selectedCharacter.emoji}</div>
                <div className="text-3xl font-bold text-gray-800">{selectedCharacter.name}</div>
              </div>

              <div className="grid grid-cols-3 gap-3 justify-items-center">
                {collectedStickers.map((sticker, i) => (
                  <div key={i} className="text-5xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                    {sticker}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg border-3 border-green-400">
                  <p className="text-gray-700 font-bold">Điểm Số</p>
                  <p className="text-4xl font-bold text-green-600">{score}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg border-3 border-blue-400">
                  <p className="text-gray-700 font-bold">Bảng Vàng</p>
                  <p className="text-4xl font-bold text-blue-600">{completedTiles.length}/8</p>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-gray-800">
                  {completedTiles.length === 8 ? "🌟 Tuyệt vời! Hoàn hảo!" : "👏 Tốt lắm!"}
                </p>
              </div>

              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 text-lg rounded-lg"
              >
                🔄 Chơi Lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-emerald-100 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Character */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-purple-700">🗺️ EduTreasure Quest</h1>
          <div className="flex justify-center gap-2 items-center">
            <span className="text-5xl">{selectedCharacter.emoji}</span>
            <p className="text-lg text-gray-700">{selectedCharacter.name}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800">Tiến Độ Hành Trình</span>
            <Badge className="bg-yellow-400 text-yellow-900 text-lg px-3 py-1">{Math.round(progress)}%</Badge>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-8 overflow-hidden border-3 border-gray-500 shadow-lg">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Game Map Grid */}
        <Card className="border-4 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-purple-800">🗺️ Bản Đồ Hành Trình</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-4">
              {GAME_MAP.map((t, idx) => (
                <div key={t.id} className="flex items-center">
                  <button
                    onClick={() => !showChallenge && idx <= currentTile && setCurrentTile(idx)}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl transition-all ${
                      idx < currentTile
                        ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white scale-100 shadow-lg"
                        : idx === currentTile
                          ? "bg-gradient-to-br from-yellow-300 to-orange-400 text-white scale-125 animate-pulse shadow-2xl border-4 border-yellow-500"
                          : "bg-gray-300 text-gray-600 opacity-50"
                    }`}
                    disabled={showChallenge}
                  >
                    {t.name.split(" ")[0]}
                  </button>
                  {idx < GAME_MAP.length - 1 && (
                    <div
                      className={`w-8 h-1 ${
                        idx < currentTile ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-purple-300">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{tile.name.split(" ")[0]}</div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">{tile.name}</p>
                  <p className="text-gray-600">{isTileCompleted ? "✅ Đã hoàn thành" : "🎯 Đang chơi"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collected Stickers */}
        {collectedStickers.length > 0 && (
          <Card className="border-4 border-pink-400 bg-gradient-to-r from-pink-50 to-red-50">
            <CardHeader>
              <CardTitle className="text-center text-pink-800">✨ Huy Hiệu Nhận Được</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4 flex-wrap">
                {collectedStickers.map((sticker, i) => (
                  <div
                    key={i}
                    className="text-5xl animate-bounce p-3 bg-white rounded-full border-3 border-pink-400 shadow-lg"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {sticker}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Challenge Card */}
        {showChallenge ? (
          <Card className="border-4 border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-cyan-200 to-blue-200">
              <div className="text-6xl mb-3">{currentQuestion.icon}</div>
              <CardTitle className="text-3xl text-cyan-900">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option}
                    onClick={() => !showResult && handleAnswer(option)}
                    disabled={showResult}
                    className={`py-6 text-xl font-bold transition-all ${
                      selectedAnswer === option
                        ? option === currentQuestion.answer
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white scale-105 shadow-lg"
                          : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white scale-105 shadow-lg"
                        : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white"
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>

              {showResult && (
                <div
                  className={`p-4 rounded-lg text-center font-bold text-lg animate-bounce ${
                    selectedAnswer === currentQuestion.answer
                      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-3 border-green-400"
                      : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-3 border-red-400"
                  }`}
                >
                  {selectedAnswer === currentQuestion.answer ? "✅ Chính xác! +10 điểm" : "❌ Thử lại!"}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => {
              setShowChallenge(true)
              setCurrentQuestion(getRandomQuestion())
              setSelectedAnswer(null)
              setShowResult(false)
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-xl rounded-lg shadow-xl"
          >
            🎯 Bắt Đầu Thử Thách
          </Button>
        )}

        {/* Score Display */}
        <div className="flex justify-between items-center">
          <Badge className="bg-yellow-400 text-yellow-900 px-6 py-3 text-lg font-bold">⭐ Điểm: {score}</Badge>
          <Badge className="bg-blue-400 text-blue-900 px-6 py-3 text-lg font-bold">
            🎯 Vị Trí: {currentTile + 1}/8
          </Badge>
        </div>
      </div>

      {/* Treasure Modal */}
      {showTreasureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-100 shadow-2xl animate-bounce">
            <CardHeader className="text-center space-y-4">
              <div className="text-7xl animate-spin">💎</div>
              <CardTitle className="text-3xl text-yellow-700">Mở Được Kho Báu!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-2xl font-bold text-orange-600">{collectedStickers[collectedStickers.length - 1]}</p>
              <p className="text-lg text-gray-700">Bạn nhận được một huy hiệu mới!</p>
              <Button
                onClick={() => setShowTreasureModal(false)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3"
              >
                Tiếp Tục
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
