"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Clock, Star } from "lucide-react"

interface GameQuestion {
  id: string
  question: string
  correct_answer: string
  options: string[]
  points: number
}

interface MemoryCard {
  id: string
  content: string
  type: "question" | "answer"
  matched: boolean
  flipped: boolean
}

interface MemoryMatchGameProps {
  gameId: string
  questions: GameQuestion[]
  onGameComplete: (score: number, maxScore: number, timeTaken: number, pointsEarned: number) => void
}

export function MemoryMatchGame({ gameId, questions, onGameComplete }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)

  // Initialize cards from questions
  useEffect(() => {
    const gameCards: MemoryCard[] = []
    questions.forEach((q, index) => {
      gameCards.push({
        id: `q-${index}`,
        content: q.question,
        type: "question",
        matched: false,
        flipped: false,
      })
      gameCards.push({
        id: `a-${index}`,
        content: q.correct_answer,
        type: "answer",
        matched: false,
        flipped: false,
      })
    })

    // Shuffle cards
    const shuffled = gameCards.sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }, [questions])

  // Timer
  useEffect(() => {
    if (gameStarted && !gameEnded && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !gameEnded) {
      endGame()
    }
  }, [gameStarted, gameEnded, timeLeft])

  const startGame = () => {
    setGameStarted(true)
    setTimeLeft(120)
  }

  const handleCardClick = (cardId: string) => {
    if (!gameStarted || gameEnded || flippedCards.length >= 2) return

    const card = cards.find((c) => c.id === cardId)
    if (!card || card.matched || card.flipped) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card state
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)))

    if (newFlippedCards.length === 2) {
      setTimeout(() => checkMatch(newFlippedCards), 1000)
    }
  }

  const checkMatch = (flippedCardIds: string[]) => {
    const [card1Id, card2Id] = flippedCardIds
    const card1 = cards.find((c) => c.id === card1Id)
    const card2 = cards.find((c) => c.id === card2Id)

    if (!card1 || !card2) return

    // Check if it's a question-answer pair
    const questionIndex1 = card1.id.split("-")[1]
    const questionIndex2 = card2.id.split("-")[1]

    const isMatch = questionIndex1 === questionIndex2 && card1.type !== card2.type

    if (isMatch) {
      // Match found
      setCards((prev) =>
        prev.map((c) => (c.id === card1Id || c.id === card2Id ? { ...c, matched: true, flipped: true } : c)),
      )

      const questionData = questions[Number.parseInt(questionIndex1)]
      setScore((prev) => prev + questionData.points)
      setMatchedPairs((prev) => prev + 1)

      // Check if game is complete
      if (matchedPairs + 1 === questions.length) {
        setTimeout(() => endGame(), 500)
      }
    } else {
      // No match - flip cards back
      setCards((prev) => prev.map((c) => (c.id === card1Id || c.id === card2Id ? { ...c, flipped: false } : c)))
    }

    setFlippedCards([])
  }

  const endGame = () => {
    setGameEnded(true)
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0)
    const timeTaken = 120 - timeLeft
    onGameComplete(score, maxScore, timeTaken, score)
  }

  const progress = (matchedPairs / questions.length) * 100

  if (!gameStarted) {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Trò chơi Ghép thẻ</h2>
          <p className="text-gray-600">Ghép các câu hỏi với đáp án đúng trong thời gian cho phép</p>
        </div>

        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>2 phút</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>{questions.length} cặp thẻ</span>
          </div>
        </div>

        <Button onClick={startGame} size="lg" className="bg-yellow-500 hover:bg-yellow-600">
          Bắt đầu chơi
        </Button>
      </div>
    )
  }

  if (gameEnded) {
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = Math.round((score / maxScore) * 100)

    return (
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Hoàn thành!</h2>
          <p className="text-gray-600">
            Bạn đã ghép được {matchedPairs}/{questions.length} cặp thẻ
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-3xl font-bold text-yellow-600">{score} điểm</div>
          <div className="text-sm text-gray-500">({percentage}% chính xác)</div>
          <div className="text-sm text-gray-500">
            Thời gian: {Math.floor((120 - timeLeft) / 60)}:{((120 - timeLeft) % 60).toString().padStart(2, "0")}
          </div>
        </div>

        <Button onClick={() => window.location.reload()} variant="outline">
          Chơi lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Ghép thẻ ghi nhớ</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{score} điểm</span>
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="text-sm">
          {matchedPairs}/{questions.length} cặp
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tiến độ</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`aspect-square cursor-pointer transition-all duration-300 ${
              card.flipped || card.matched ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 hover:bg-gray-100"
            } ${card.matched ? "ring-2 ring-green-200" : ""}`}
            onClick={() => handleCardClick(card.id)}
          >
            <CardContent className="p-2 h-full flex items-center justify-center">
              {card.flipped || card.matched ? (
                <div className="text-center">
                  <div
                    className={`text-xs font-medium ${card.type === "question" ? "text-blue-600" : "text-green-600"}`}
                  >
                    {card.type === "question" ? "Câu hỏi" : "Đáp án"}
                  </div>
                  <div className="text-sm mt-1 text-balance">{card.content}</div>
                </div>
              ) : (
                <div className="text-2xl text-gray-400">?</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
