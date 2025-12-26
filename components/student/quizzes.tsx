"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Play, Clock, Trophy, Brain } from "lucide-react"

interface Quiz {
  id: string
  title: string
  description: string
  created_at: string
  class_id: string
}

interface CompletedQuiz {
  quiz_id: string
  score: number
  total_questions: number
}

export function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [completedQuizzes, setCompletedQuizzes] = useState<CompletedQuiz[]>([])
  const [totalScore, setTotalScore] = useState<number | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: classMembers } = await supabase
          .from("class_members")
          .select("class_id")
          .eq("user_id", user.id)
        const studentClassIds = classMembers?.map((c) => c.class_id) || []

        const { data: quizData } = await supabase
          .from("quizzes")
          .select("*")
          .in("class_id", studentClassIds)
          .order("created_at", { ascending: false })

        setQuizzes(quizData || [])

        const { data: results } = await supabase
          .from("results")
          .select("*")
          .eq("user_id", user.id)

        setCompletedQuizzes(results || [])

        const totalScoreSum = results?.reduce((sum, r: any) => sum + (r.score || 0), 0) || 0
        setTotalScore(totalScoreSum)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizzes()
  }, [])

  const startQuiz = async (quizId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at")

      if (error) {
        console.error(error)
        return
      }

      const questions = data || []

      if (questions.length === 0) {
        alert("Quiz này chưa có câu hỏi!")
        return
      }

      setQuizQuestions(questions)
      setActiveQuiz(quizId)
      setCurrentQuestion(0)
      setAnswers({})
      setSelectedAnswer(null)
      setShowResults(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => setSelectedAnswer(answer)

  const handleNextQuestion = () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [quizQuestions[currentQuestion].id]: selectedAnswer }
      setAnswers(newAnswers)

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
      } else {
        finishQuiz(newAnswers)
      }
    }
  }

  const finishQuiz = async (finalAnswers: { [key: string]: string }) => {
    let correctCount = 0
    quizQuestions.forEach((q) => {
      if (finalAnswers[q.id] === q.correct_answer) correctCount++
    })

    setShowResults(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && activeQuiz) {
        await supabase.from("results").insert({
          user_id: user.id,
          quiz_id: activeQuiz,
          score: correctCount,
          total_questions: quizQuestions.length,
        })

        setCompletedQuizzes((prev) => [
          ...prev,
          { quiz_id: activeQuiz, score: correctCount, total_questions: quizQuestions.length },
        ])
        setTotalScore((prev) => (prev || 0) + correctCount)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const resetQuiz = () => {
    setActiveQuiz(null)
    setQuizQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswers({})
    setShowResults(false)
  }

  // --- Render quiz đang làm ---
  if (activeQuiz && quizQuestions.length > 0 && !showResults) {
    const question = quizQuestions[currentQuestion]
    const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-lg font-bold text-purple-600 bg-purple-100 px-4 py-2 rounded-full">
            Câu {currentQuestion + 1} / {quizQuestions.length} 🎯
          </span>
          <Button variant="outline" onClick={resetQuiz} className="text-red-600 border-red-300 bg-transparent">
            Thoát
          </Button>
        </div>
        <Progress value={progress} className="h-3 mb-6 bg-gray-200" />

        <Card className="border-4 border-gradient-to-r from-blue-400 to-purple-400 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-2xl rounded-3xl mb-8">
          <CardHeader>
            <CardTitle className="text-3xl text-gray-900 text-balance leading-relaxed">
              ❓ {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["A", "B", "C", "D"].map((opt, idx) => {
              const bgColorClass = [
                "from-blue-300 to-blue-400",
                "from-green-300 to-green-400",
                "from-yellow-300 to-orange-400",
                "from-pink-300 to-red-400",
              ][idx]

              return (
                <button
                  key={opt}
                  onClick={() => handleAnswerSelect(opt)}
                  className={`w-full p-5 text-left rounded-2xl border-4 transition-all transform ${
                    selectedAnswer === opt
                      ? `border-gray-800 bg-gradient-to-r ${bgColorClass} scale-105 shadow-lg text-white font-bold text-xl`
                      : `border-gray-300 bg-white hover:border-gray-500 text-gray-900 hover:shadow-lg`
                  }`}
                >
                  <span
                    className={`font-bold text-2xl mr-3 ${selectedAnswer === opt ? "text-white" : "text-blue-600"}`}
                  >
                    {opt}.
                  </span>
                  <span className={`text-lg ${selectedAnswer === opt ? "text-white" : "text-gray-900"}`}>
                    {question[`option_${opt.toLowerCase()}`]}
                  </span>
                </button>
              )
            })}
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-lg py-6 font-bold mt-6 rounded-2xl shadow-lg transform transition hover:scale-105"
            >
              {currentQuestion < quizQuestions.length - 1 ? "➡️ Câu Tiếp Theo" : "🏁 Hoàn Thành"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Render kết quả ---
  if (showResults) {
    const score = completedQuizzes.find((c) => c.quiz_id === activeQuiz)?.score || 0
    const totalQuestions = completedQuizzes.find((c) => c.quiz_id === activeQuiz)?.total_questions || 1
    const percentage = Math.round((score / totalQuestions) * 100)

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-4 border-green-400 bg-gradient-to-br from-green-100 via-yellow-50 to-orange-100 shadow-2xl rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl transform animate-bounce">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">🎉 Tuyệt Vời Quá!</h2>
            <p className="text-2xl text-gray-800 mb-2 font-bold">
              Bạn trả lời đúng <span className="text-green-600">{score}</span> / <span className="text-gray-900">{totalQuestions}</span> câu
            </p>
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-2xl text-3xl font-bold mb-6 shadow-lg">
              📊 {percentage}%
            </div>
            {percentage === 100 && <p className="text-xl text-green-600 font-bold mb-4">🏆 Hoàn hảo! Bạn là ngôi sao!</p>}
            {percentage >= 80 && percentage < 100 && <p className="text-xl text-blue-600 font-bold mb-4">⭐ Rất tốt! Tiếp tục cố gắng!</p>}
            {percentage < 80 && <p className="text-xl text-orange-600 font-bold mb-4">💪 Tốt! Hãy ôn tập thêm nha!</p>}
            {totalScore !== null && <p className="text-lg text-gray-800 mb-6 font-semibold">🎯 <span className="text-blue-600">Tổng điểm: {totalScore}</span></p>}
            <Button
              onClick={resetQuiz}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg py-6 px-8 rounded-2xl font-bold shadow-lg transform transition hover:scale-105"
            >
              ↩️ Quay Lại Danh Sách
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Render danh sách quiz ---
  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card className="border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">Đang tải bài kiểm tra...</p>
          </CardContent>
        </Card>
      ) : quizzes.length === 0 ? (
        <Card className="border-4 border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl">
          <CardContent className="p-12 text-center">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 text-xl font-semibold">Chưa có bài kiểm tra nào</p>
            <p className="text-gray-500 text-lg mt-2">Hãy chờ giáo viên tạo bài kiểm tra cho bạn! 👨‍🏫</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const completed = completedQuizzes.find((c) => c.quiz_id === quiz.id)
            return (
              <Card
                key={quiz.id}
                className="border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-2xl hover:scale-105 transition-all transform rounded-3xl overflow-hidden"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-gray-900 text-balance font-bold">{quiz.title}</CardTitle>
                      <CardDescription className="mt-3 text-gray-700 text-base">{quiz.description}</CardDescription>
                    </div>
                    <Badge className="bg-blue-400 text-white text-lg px-4 py-2 rounded-full whitespace-nowrap">
                      📝 Quiz
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-base text-gray-600 font-semibold">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span>Trắc Nghiệm</span>
                    </div>
                    {completed ? (
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-6 py-2 rounded-full shadow-lg text-lg">
                        ✅ {completed.score}/{completed.total_questions}
                      </div>
                    ) : (
                      <Button
                        onClick={() => startQuiz(quiz.id)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-full font-bold shadow-lg text-base transform transition hover:scale-110 flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" /> Bắt Đầu
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
