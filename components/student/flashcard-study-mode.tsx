"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle } from "lucide-react"

interface FlashcardData {
  id: string
  question: string
  answer: string
  category?: string
  difficulty?: "easy" | "medium" | "hard"
}

interface FlashcardStudyModeProps {
  flashcards: FlashcardData[]
  onComplete?: (results: { correct: number; total: number }) => void
}

const GRADIENT_COLORS = [
  "from-blue-500 to-cyan-600",
  "from-purple-500 to-pink-600",
  "from-orange-500 to-red-600",
  "from-green-500 to-emerald-600",
  "from-yellow-500 to-orange-600",
  "from-indigo-500 to-blue-600",
]

const DIFFICULTY_EMOJI = {
  easy: "🌱",
  medium: "🔥",
  hard: "⭐",
}

export function FlashcardStudyMode({ flashcards, onComplete }: FlashcardStudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<{ [key: string]: boolean }>({})
  const [showResults, setShowResults] = useState(false)

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const correctAnswers = Object.values(results).filter(Boolean).length
  const gradientColor = GRADIENT_COLORS[currentIndex % GRADIENT_COLORS.length]

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleAnswer = (correct: boolean) => {
    setResults((prev) => ({ ...prev, [currentCard.id]: correct }))

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    } else {
      setShowResults(true)
      onComplete?.({ correct: correctAnswers + (correct ? 1 : 0), total: flashcards.length })
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults({})
    setShowResults(false)
  }

  if (showResults) {
    const percentage = Math.round((correctAnswers / flashcards.length) * 100)
    const isExcellent = percentage >= 80
    const isGood = percentage >= 60

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card
          className={`border-0 shadow-2xl overflow-hidden bg-gradient-to-br ${isExcellent ? "from-green-300 to-emerald-400" : isGood ? "from-yellow-300 to-orange-400" : "from-blue-300 to-purple-400"}`}
        >
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white">
              {isExcellent ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : isGood ? (
                <span className="text-4xl">👏</span>
              ) : (
                <span className="text-4xl">💪</span>
              )}
            </div>
            <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-4">
              {isExcellent ? "Tuyệt vời!" : isGood ? "Tốt lắm!" : "Cố gắng thêm nhé!"}
            </h2>
            <p className="text-2xl text-white/90 font-bold drop-shadow-md mb-8">
              Bạn trả lời đúng{" "}
              <span className="text-white">
                {correctAnswers}/{flashcards.length}
              </span>
            </p>
            <div className="mb-8 bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-6xl font-bold text-white drop-shadow-lg">{percentage}%</div>
            </div>
            <Progress value={percentage} className="h-4 mb-8 bg-white/30" />
            <Button
              onClick={handleRestart}
              className="bg-white text-gray-900 hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-full shadow-lg transform transition hover:scale-105"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Học Lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-md">
            Thẻ {currentIndex + 1} / {flashcards.length}
          </span>
          <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-full shadow-md">
            {Math.round(progress)}% Hoàn thành
          </span>
        </div>
        <Progress value={progress} className="h-3 bg-gray-200 rounded-full" />
      </div>

      <div className="mb-8 h-96">
        <div
          className={`relative w-full h-full cursor-pointer transition-transform duration-700 ease-out`}
          onClick={handleFlip}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front - Question */}
          <div
            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradientColor} p-8 flex flex-col justify-center items-center shadow-2xl border-4 border-white`}
            style={{
              backfaceVisibility: "hidden",
            }}
          >
            <div className="absolute top-6 right-6 text-4xl opacity-20">❓</div>
            <div className="absolute bottom-6 left-6 text-4xl opacity-20">💡</div>
            <div className="flex-1 flex flex-col justify-center items-center w-full">
              <Badge className="mb-6 bg-white/40 text-white border-white/50 text-lg px-4 py-2 font-bold">
                {DIFFICULTY_EMOJI[currentCard.difficulty as keyof typeof DIFFICULTY_EMOJI] || "❔"}
                {currentCard.difficulty && ` ${currentCard.difficulty.toUpperCase()}`}
              </Badge>
              <h3 className="text-center text-5xl font-bold text-white drop-shadow-lg text-balance leading-relaxed">
                {currentCard.question}
              </h3>
            </div>
            <p className="text-white/80 text-lg font-bold mt-8">👆 Nhấp để xem đáp án</p>
          </div>

          {/* Back - Answer */}
          <div
            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradientColor} p-8 flex flex-col justify-center items-center shadow-2xl border-4 border-white`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="absolute top-6 left-6 text-4xl opacity-20">✨</div>
            <div className="absolute bottom-6 right-6 text-4xl opacity-20">🎯</div>
            <div className="flex-1 flex flex-col justify-center items-center w-full">
              <h4 className="text-center text-2xl font-bold text-white drop-shadow-lg mb-6">ĐÁP ÁN</h4>
              <div className="text-center text-5xl leading-relaxed text-white drop-shadow-md font-bold max-h-64 overflow-y-auto px-4">
                {currentCard.answer.split("\n").map((line, idx) => (
                  <div key={idx} className="py-3 text-balance">
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/80 text-lg font-bold mt-8">👆 Nhấp để quay lại</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 font-bold text-gray-900 border-2 border-gray-300 py-6 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay Lại
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 font-bold text-gray-900 border-2 border-gray-300 py-6 rounded-xl"
          >
            Tiếp Theo
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Answer Buttons (only show when flipped) */}
        {isFlipped && (
          <div className="flex gap-4 justify-center animate-bounce-in">
            <Button
              onClick={() => handleAnswer(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg transform transition hover:scale-105"
            >
              <XCircle className="w-6 h-6" />
              Sai Rồi
            </Button>
            <Button
              onClick={() => handleAnswer(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold text-lg py-6 rounded-xl shadow-lg transform transition hover:scale-105"
            >
              <CheckCircle className="w-6 h-6" />
              Đúng Rồi
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
