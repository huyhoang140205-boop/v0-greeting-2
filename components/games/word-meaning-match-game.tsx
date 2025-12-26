"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Link, Trophy, Timer, Volume2, RotateCcw, Zap } from "lucide-react"

interface GameQuestion {
  id: string
  question: string // English word
  correct_answer: string // Vietnamese meaning
  options: string[] // Vietnamese meanings to match
  hints?: string
  points: number
}

interface WordMeaningMatchGameProps {
  gameId?: string
  questions?: GameQuestion[]
  onGameComplete?: (score: number, maxScore: number, timeTaken: number, pointsEarned: number) => void
}

interface MatchPair {
  english: string
  vietnamese: string
  matched: boolean
  correct: boolean
}

// Default questions để tránh lỗi khi không truyền props
const defaultQuestions: GameQuestion[] = [
  { id: "1", question: "Apple", correct_answer: "Táo", options: ["Táo","Chuối","Cam","Nho"], points: 10 },
  { id: "2", question: "Dog", correct_answer: "Chó", options: ["Chó","Mèo","Chuột","Cá"], points: 10 },
  { id: "3", question: "Book", correct_answer: "Sách", options: ["Sách","Bút","Vở","Thước"], points: 10 },
  { id: "4", question: "House", correct_answer: "Nhà", options: ["Nhà","Trường","Cửa","Bàn"], points: 10 },
]

export function WordMeaningMatchGame({
  gameId = "default",
  questions = defaultQuestions,
  onGameComplete = () => {},
}: WordMeaningMatchGameProps) {
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [matchPairs, setMatchPairs] = useState<MatchPair[]>([])
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null)
  const [selectedVietnamese, setSelectedVietnamese] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [roundComplete, setRoundComplete] = useState(false)
  const [streak, setStreak] = useState(0)
  const startTimeRef = useRef<number>(0)

  const questionsPerRound = 4
  const totalRounds = questions.length > 0 ? Math.ceil(questions.length / questionsPerRound) : 1
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0)
  const progress = ((currentRound + 1) / totalRounds) * 100

  const getCurrentRoundQuestions = () => {
    if (!questions || questions.length === 0) return []
    const startIndex = currentRound * questionsPerRound
    return questions.slice(startIndex, startIndex + questionsPerRound)
  }

  useEffect(() => {
    if (gameStarted && !gameEnded) {
      initializeRound()
    }
  }, [currentRound, gameStarted])

  const initializeRound = () => {
    const roundQuestions = getCurrentRoundQuestions()
    const pairs: MatchPair[] = roundQuestions.map((q) => ({
      english: q.question,
      vietnamese: q.correct_answer,
      matched: false,
      correct: false,
    }))
    setMatchPairs(pairs)
    setSelectedEnglish(null)
    setSelectedVietnamese(null)
    setRoundComplete(false)
    setFeedback(null)
  }

  const startGame = () => {
    setGameStarted(true)
    startTimeRef.current = Date.now()
    setScore(0)
    setCurrentRound(0)
    setStreak(0)
  }

  const endGame = () => {
    setGameEnded(true)
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const streakBonus = streak >= 8 ? 30 : 0
    const pointsEarned = score + streakBonus
    onGameComplete(score, maxScore, timeTaken, pointsEarned)
  }

  const handleEnglishSelect = (word: string) => {
    if (matchPairs.find((p) => p.english === word)?.matched) return
    setSelectedEnglish(word)
    if (selectedVietnamese) checkMatch(word, selectedVietnamese)
  }

  const handleVietnameseSelect = (meaning: string) => {
    if (matchPairs.find((p) => p.vietnamese === meaning)?.matched) return
    setSelectedVietnamese(meaning)
    if (selectedEnglish) checkMatch(selectedEnglish, meaning)
  }

  const checkMatch = (english: string, vietnamese: string) => {
    const pair = matchPairs.find((p) => p.english === english && p.vietnamese === vietnamese)

    if (pair) {
      const newPairs = matchPairs.map((p) =>
        p.english === english && p.vietnamese === vietnamese ? { ...p, matched: true, correct: true } : p,
      )
      setMatchPairs(newPairs)

      const question = getCurrentRoundQuestions().find((q) => q.question === english)
      if (question) setScore(score + question.points)
      setStreak(streak + 1)
      setFeedback("Chính xác! Ghép đúng rồi!")

      // Phát âm từ
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(english)
        utterance.lang = "en-US"
        utterance.rate = 0.8
        speechSynthesis.speak(utterance)
      }

      if (newPairs.every((p) => p.matched)) {
        setRoundComplete(true)
        setTimeout(() => {
          if (currentRound < totalRounds - 1) setCurrentRound(currentRound + 1)
          else endGame()
        }, 1500)
      }
    } else {
      setStreak(0)
      setFeedback("Sai rồi! Thử lại nhé.")
      setTimeout(() => setFeedback(null), 1200)
    }

    setSelectedEnglish(null)
    setSelectedVietnamese(null)
  }

  const playPronunciation = (word: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "en-US"
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const resetRound = () => initializeRound()

  if (!gameStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Link className="w-8 h-8 text-green-600" />
            Ghép đôi từ - nghĩa
          </CardTitle>
          <p className="text-gray-600">
            Kéo từ tiếng Anh sang nghĩa tiếng Việt đúng. Ghép đúng thì sáng lên, sai thì rung lắc.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={startGame} size="lg" className="bg-green-600 hover:bg-green-700">
            Bắt đầu ghép đôi!
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (gameEnded) {
    const percentage = Math.round((score / maxScore) * 100)
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            Hoàn thành trò chơi!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-3xl font-bold text-green-600">
              {score}/{maxScore} điểm
            </p>
            <p className="text-gray-600">Tỷ lệ chính xác: {percentage}%</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Hiển thị game
  const englishWords = matchPairs.map((p) => p.english)
  const vietnameseMeanings = [...matchPairs.map((p) => p.vietnamese)].sort(() => Math.random() - 0.5)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Link className="w-6 h-6 text-green-600" />
            Ghép đôi từ - nghĩa
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              <span>{score} điểm</span>
            </div>
            <Button variant="outline" size="sm" onClick={resetRound} className="flex items-center gap-1 bg-transparent">
              <RotateCcw className="w-4 h-4" />
              Đặt lại
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Vòng {currentRound + 1}/{totalRounds}
            </span>
            <span>
              Đã ghép: {matchPairs.filter((p) => p.matched).length}/{matchPairs.length}
            </span>
          </div>
          <Progress value={progress} />
          {streak >= 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
              <p className="text-yellow-800 text-sm text-center flex items-center justify-center gap-1">
                <Zap className="w-4 h-4" />
                Chuỗi {streak} lần ghép đúng!
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* English Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 text-center">Từ tiếng Anh</h3>
            <div className="space-y-2">
              {englishWords.map((word, index) => {
                const pair = matchPairs.find((p) => p.english === word)
                const isMatched = pair?.matched
                const isSelected = selectedEnglish === word

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isMatched
                        ? "bg-green-100 border-green-300 text-green-800 shadow-lg"
                        : isSelected
                        ? "bg-blue-100 border-blue-400 text-blue-800"
                        : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                    }`}
                    onClick={() => !isMatched && handleEnglishSelect(word)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">{word}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          playPronunciation(word)
                        }}
                        className="p-1 h-auto"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Vietnamese Column */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 text-center">Nghĩa tiếng Việt</h3>
            <div className="space-y-2">
              {vietnameseMeanings.map((meaning, index) => {
                const pair = matchPairs.find((p) => p.vietnamese === meaning)
                const isMatched = pair?.matched
                const isSelected = selectedVietnamese === meaning

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isMatched
                        ? "bg-green-100 border-green-300 text-green-800 shadow-lg"
                        : isSelected
                        ? "bg-blue-100 border-blue-400 text-blue-800"
                        : "bg-white border-gray-200 hover:border-green-300 hover:shadow-md"
                    }`}
                    onClick={() => !isMatched && handleVietnameseSelect(meaning)}
                  >
                    <span className="text-lg">{meaning}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`text-center p-3 rounded-lg ${
              feedback.includes("Chính xác") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {feedback}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
