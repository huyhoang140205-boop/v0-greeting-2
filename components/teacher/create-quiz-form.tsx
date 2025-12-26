"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Save, Loader2 } from "lucide-react"

interface QuizQuestion {
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: "A" | "B" | "C" | "D"
  points: number
}

interface Class {
  id: string
  name: string
}

interface CreateQuizProps {
  onSuccess?: () => void
}

export default function CreateQuizForm({ onSuccess }: CreateQuizProps) {
  const supabase = createClient()

  const [step, setStep] = useState<"createQuiz" | "addQuestions">("createQuiz")
  const [quizId, setQuizId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [numQuestions, setNumQuestions] = useState(1)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    points: 1,
  })
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Load lớp: teacher tham gia OR teacher tạo
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Bạn phải đăng nhập")

        // 1️⃣ Lớp teacher tham gia
        const { data: memberData, error: memberError } = await supabase
          .from("class_members")
          .select(`
            classes (
              id,
              name
            )
          `)
          .eq("user_id", user.id)
          .eq("role", "teacher")

        if (memberError) throw memberError

        // 2️⃣ Lớp teacher tạo
        const { data: createdData, error: createdError } = await supabase
          .from("classes")
          .select("id, name")
          .eq("teacher_id", user.id)

        if (createdError) throw createdError

        // 👉 Gộp + bỏ trùng
        const map = new Map<string, Class>()

        memberData?.forEach((item) => {
          if (item.classes) {
            map.set(item.classes.id, item.classes)
          }
        })

        createdData?.forEach((cls) => {
          map.set(cls.id, cls)
        })

        const merged = Array.from(map.values())
        setClasses(merged)

        if (merged.length > 0) {
          setSelectedClassId(merged[0].id)
        }
      } catch (err: any) {
        console.error("Fetch classes error:", err)
        setError(err.message || JSON.stringify(err))
      }
    }

    fetchClasses()
  }, [])

  // --- STEP 1: CREATE QUIZ ---
  const handleCreateQuiz = async () => {
    if (!title.trim() || !selectedClassId) {
      setError("Bạn cần nhập tên quiz và chọn lớp")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Bạn phải đăng nhập")

      const { data, error } = await supabase
        .from("quizzes")
        .insert({
          title,
          description,
          created_by: user.id,
          class_id: selectedClassId,
        })
        .select()
        .single()

      if (error) throw error

      setQuizId(data.id)
      setStep("addQuestions")
    } catch (err: any) {
      setError(err.message || JSON.stringify(err))
    } finally {
      setIsLoading(false)
    }
  }

  // --- ADD QUESTION TO STATE ---
  const handleAddQuestionToState = () => {
    if (!currentQuestion.question.trim()) return
    if (questions.length >= numQuestions) return

    setQuestions([...questions, currentQuestion])
    setCurrentQuestion({
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      points: 1,
    })
  }

  // --- SAVE ALL QUESTIONS ---
  const handleSaveAllQuestions = async () => {
    if (!quizId) return

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Bạn phải đăng nhập")

      const payload = questions.map((q) => ({
        quiz_id: quizId,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        points: q.points,
        created_by: user.id,
      }))

      const { error } = await supabase.from("quiz_questions").insert(payload)
      if (error) throw error

      onSuccess?.()
    } catch (err: any) {
      setError(err.message || JSON.stringify(err))
    } finally {
      setIsLoading(false)
    }
  }

  // ================= RENDER =================

  if (step === "createQuiz") {
    return (
      <Card className="p-4 border-2 border-blue-200">
        <CardHeader>
          <CardTitle>Create New Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-red-600">{error}</p>}

          <Input placeholder="Quiz Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp cho Quiz" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            min={1}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            placeholder="Number of questions"
          />

          <Button onClick={handleCreateQuiz} disabled={isLoading} className="bg-blue-500 text-white">
            {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Create Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  // --- STEP 2: ADD QUESTIONS ---
  return (
    <Card className="p-4 border-2 border-green-200">
      <CardHeader>
        <CardTitle>
          {questions.length < numQuestions
            ? `Add Question ${questions.length + 1} / ${numQuestions}`
            : "All Questions Added"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-red-600">{error}</p>}

        {questions.length < numQuestions && (
          <>
            <Textarea
              placeholder="Question"
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
            />

            {["a", "b", "c", "d"].map((opt) => (
              <Input
                key={opt}
                placeholder={`Option ${opt.toUpperCase()}`}
                value={currentQuestion[`option_${opt}` as keyof QuizQuestion] as string}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, [`option_${opt}`]: e.target.value })
                }
              />
            ))}

            <Input
              type="number"
              min={1}
              value={currentQuestion.points}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) })}
            />

            <Select
              value={currentQuestion.correct_answer}
              onValueChange={(v) =>
                setCurrentQuestion({ ...currentQuestion, correct_answer: v as "A" | "B" | "C" | "D" })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAddQuestionToState} className="bg-green-500 text-white">
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </>
        )}

        {questions.length === numQuestions && (
          <Button onClick={handleSaveAllQuestions} className="bg-blue-500 text-white">
            <Save className="w-4 h-4" /> Save All Questions
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
