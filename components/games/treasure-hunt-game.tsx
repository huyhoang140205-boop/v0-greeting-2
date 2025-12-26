"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import confetti from "canvas-confetti"

const STAGES = [
  {
    id: 1,
    name: "🏠 Nhà Cũ",
    description: "Bắt đầu từ ngôi nhà cũ ngoài rừng",
    question: "5 + 3 = ?",
    answer: "8",
    options: ["6", "7", "8", "9"],
    position: 0,
  },
  {
    id: 2,
    name: "🌳 Rừng Sâu",
    description: "Đi qua rừng rậm rạp",
    question: "10 - 4 = ?",
    answer: "6",
    options: ["4", "5", "6", "7"],
    position: 15,
  },
  {
    id: 3,
    name: "🏞️ Thung Lũng",
    description: "Vượt qua thung lũng sâu",
    question: "7 × 2 = ?",
    answer: "14",
    options: ["12", "13", "14", "15"],
    position: 30,
  },
  {
    id: 4,
    name: "🗻 Núi Cao",
    description: "Leo lên đỉnh núi cao",
    question: "20 ÷ 4 = ?",
    answer: "5",
    options: ["3", "4", "5", "6"],
    position: 45,
  },
  {
    id: 5,
    name: "🏖️ Bãi Cát",
    description: "Đi qua bãi cát vàng",
    question: "6 + 9 = ?",
    answer: "15",
    options: ["13", "14", "15", "16"],
    position: 60,
  },
  {
    id: 6,
    name: "🌊 Biển Xanh",
    description: "Vượt qua biển xanh",
    question: "18 - 7 = ?",
    answer: "11",
    options: ["9", "10", "11", "12"],
    position: 75,
  },
  {
    id: 7,
    name: "💎 Kho Báu",
    description: "Tìm được kho báu!",
    question: "9 × 3 = ?",
    answer: "27",
    options: ["24", "25", "26", "27"],
    position: 100,
  },
]

export function TreasureHuntGame() {
  const [currentStage, setCurrentStage] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)

  const stage = STAGES[currentStage]
  const progress = ((currentStage + 1) / STAGES.length) * 100

  const handleAnswer = (option: string) => {
    setSelectedAnswer(option)
    setShowResult(true)

    if (option === stage.answer) {
      setScore(score + 10)
      setCorrectAnswers(correctAnswers + 1)

      setTimeout(() => {
        if (currentStage < STAGES.length - 1) {
          setCurrentStage(currentStage + 1)
          setSelectedAnswer(null)
          setShowResult(false)
        } else {
          setGameComplete(true)
          confetti({ particleCount: 300, spread: 160 })
        }
      }, 1500)
    }
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-4 border-yellow-500 bg-white shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="text-6xl animate-bounce">💎✨🏆</div>
            <CardTitle className="text-4xl text-yellow-600">Chúc Mừng! Bạn Tìm Được Kho Báu!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-400">
                <p className="text-gray-600 font-semibold">Điểm Số</p>
                <p className="text-4xl font-bold text-green-600">{score}</p>
              </div>
              <div className="text-center p-4 bg-blue-100 rounded-lg border-2 border-blue-400">
                <p className="text-gray-600 font-semibold">Câu Đúng</p>
                <p className="text-4xl font-bold text-blue-600">{correctAnswers}/7</p>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-lg text-gray-700">
                {correctAnswers === 7
                  ? "🌟 Tuyệt vời! Bạn đã hoàn hảo!"
                  : correctAnswers >= 5
                    ? "👏 Rất tốt! Tiếp tục cố gắng!"
                    : "💪 Bạn có thể làm tốt hơn!"}
              </p>
            </div>

            <Button
              onClick={() => {
                setCurrentStage(0)
                setScore(0)
                setGameComplete(false)
                setCorrectAnswers(0)
                setSelectedAnswer(null)
                setShowResult(false)
              }}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 text-lg"
            >
              🔄 Chơi Lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-purple-700">🗺️ Tìm Kho Báu</h1>
          <p className="text-xl text-gray-700">
            Mức {currentStage + 1} / {STAGES.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">Tiến Độ</span>
            <Badge className="bg-yellow-400 text-yellow-900">{Math.round(progress)}%</Badge>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden border-2 border-gray-400">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Map Journey */}
        <Card className="border-4 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{stage.name.split(" ")[0]}</div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">{stage.name}</p>
                  <p className="text-gray-600">{stage.description}</p>
                </div>
              </div>

              {/* Visual Journey */}
              <div className="mt-6 p-4 bg-white rounded-lg border-2 border-purple-300">
                <div className="flex items-center justify-between mb-2">
                  {STAGES.map((s, i) => (
                    <div
                      key={s.id}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        i < currentStage
                          ? "bg-green-400 text-white scale-110"
                          : i === currentStage
                            ? "bg-yellow-400 text-white scale-125 animate-pulse"
                            : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {s.id}
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">👈 Trả lời đúng để di chuyển tiếp →</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="border-4 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">❓</div>
            <CardTitle className="text-3xl text-blue-900">{stage.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {stage.options.map((option) => (
                <Button
                  key={option}
                  onClick={() => !showResult && handleAnswer(option)}
                  disabled={showResult}
                  className={`py-6 text-xl font-bold transition-all ${
                    selectedAnswer === option
                      ? option === stage.answer
                        ? "bg-green-500 hover:bg-green-600 text-white scale-105"
                        : "bg-red-500 hover:bg-red-600 text-white scale-105"
                      : "bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white"
                  }`}
                >
                  {option}
                </Button>
              ))}
            </div>

            {showResult && (
              <div
                className={`p-4 rounded-lg text-center font-bold text-lg ${
                  selectedAnswer === stage.answer
                    ? "bg-green-100 text-green-800 border-2 border-green-400"
                    : "bg-red-100 text-red-800 border-2 border-red-400"
                }`}
              >
                {selectedAnswer === stage.answer ? "✅ Chính xác! +10 điểm" : "❌ Sai rồi!"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score */}
        <div className="text-center">
          <Badge className="bg-yellow-400 text-yellow-900 px-6 py-2 text-lg">⭐ Điểm: {score}</Badge>
        </div>
      </div>
    </div>
  )
}
