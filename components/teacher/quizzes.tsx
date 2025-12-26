"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import CreateQuizForm from "@/components/teacher/create-quiz-form"
import { Plus, Brain, Trash2, Loader2, GraduationCap, Pencil, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/* ======================
 * TYPES
 * ====================== */
interface Quiz {
  id: string
  title: string
  description: string
  created_at: string
  class_id?: string
}

interface Question {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: "A" | "B" | "C" | "D"
  points: number
}

interface TeacherQuizzesProps {
  quizzes: Quiz[]
  onQuizzesChange: () => void
}

export function TeacherQuizzes({ quizzes, onQuizzesChange }: TeacherQuizzesProps) {
  const supabase = createClient()

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question[]>>({})
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editingQuizId, setEditingQuizId] = useState<string | "new" | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [loadingClasses, setLoadingClasses] = useState(true)

  // Load lớp
  useEffect(() => {
    const loadTeacherClasses = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("class_members")
          .select("classes(*)")
          .eq("user_id", user.id)
          .eq("role", "teacher")

        const classes = data?.map((m) => m.classes).filter(Boolean) ?? []
        setTeacherClasses(classes)

        if (classes.length > 0) setSelectedClassId(classes[0].id)
      } finally {
        setLoadingClasses(false)
      }
    }
    loadTeacherClasses()
  }, [])

  // Load questions theo quiz
  const loadQuestions = async (quizId: string) => {
    if (questionsMap[quizId]) return
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId)
    setQuestionsMap((prev) => ({ ...prev, [quizId]: data || [] }))
  }

  const filteredQuizzes = quizzes.filter((q) => q.class_id === selectedClassId)

  // Xóa quiz
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Xóa quiz này và toàn bộ dữ liệu liên quan?")) return
    setIsDeleting(id)
    try {
      await supabase.from("results").delete().eq("quiz_id", id)
      await supabase.from("quiz_questions").delete().eq("quiz_id", id)
      await supabase.from("quizzes").delete().eq("id", id)
      onQuizzesChange()
    } finally {
      setIsDeleting(null)
    }
  }

  // Lưu chỉnh sửa câu hỏi
  const handleSaveQuestion = async () => {
    if (!editingQuestion) return
    setIsSaving(true)
    try {
      await supabase
        .from("quiz_questions")
        .update({
          question: editingQuestion.question,
          option_a: editingQuestion.option_a,
          option_b: editingQuestion.option_b,
          option_c: editingQuestion.option_c,
          option_d: editingQuestion.option_d,
          correct_answer: editingQuestion.correct_answer,
          points: editingQuestion.points,
        })
        .eq("id", editingQuestion.id)

      // Cập nhật state local
      setQuestionsMap((prev) => {
        const quizId = Object.keys(prev).find((key) => prev[key].some((q) => q.id === editingQuestion.id))
        if (!quizId) return prev
        const updated = prev[quizId].map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
        return { ...prev, [quizId]: updated }
      })

      setEditingQuestion(null)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // ======================
  // RENDER
  // ======================
  // Nếu đang tạo / chỉnh quiz → mở CreateQuizForm
  if (editingQuizId !== null) {
    return (
      <Card className="border-2 border-blue-200">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>
            <Plus className="w-5 h-5 mr-2" />
            {editingQuizId === "new" ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"}
          </CardTitle>
          <Button variant="outline" onClick={() => setEditingQuizId(null)}>
            Quay lại
          </Button>
        </CardHeader>
        <CardContent>
          <CreateQuizForm
            quizId={editingQuizId === "new" ? undefined : editingQuizId}
            classId={selectedClassId!}
            onSuccess={() => {
              setEditingQuizId(null)
              onQuizzesChange()
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Quản lý Quiz</h2>
      </div>

      {/* Select class */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chọn lớp học</CardTitle>
          <CardDescription>Quiz sẽ được hiển thị theo từng lớp</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingClasses ? (
            <p className="text-sm text-gray-500">Đang tải lớp...</p>
          ) : (
            <Select value={selectedClassId || ""} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                {teacherClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">Tổng quiz: {filteredQuizzes.length}</p>
        <Button onClick={() => setEditingQuizId("new")} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo Quiz
        </Button>
      </div>

      {/* Quiz list */}
      {filteredQuizzes.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Chưa có quiz nào cho lớp này</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              onMouseEnter={() => loadQuestions(quiz.id)}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-blue-700">{quiz.title}</CardTitle>
                    <CardDescription className="text-gray-600">{quiz.description}</CardDescription>
                  </div>
                  <Badge className="bg-blue-400 text-white">Quiz</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Questions */}
                {questionsMap[quiz.id]?.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg border border-blue-200 hover:border-blue-300"
                  >
                    <span className="text-sm text-gray-700 font-medium">
                      {idx + 1}. {q.question}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingQuestion(q)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Chỉnh
                    </Button>
                  </div>
                ))}

                {/* Inline edit question form */}
                {editingQuestion && questionsMap[quiz.id]?.some((q) => q.id === editingQuestion.id) && (
                  <Card className="border-2 border-blue-300 p-4 mt-4 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardHeader>
                      <CardTitle className="text-blue-700">Chỉnh câu hỏi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Textarea
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                        className="border-blue-200 focus:border-blue-400"
                      />
                      {["a", "b", "c", "d"].map((opt) => (
                        <Input
                          key={opt}
                          placeholder={`Option ${opt.toUpperCase()}`}
                          value={editingQuestion[`option_${opt}` as keyof Question] as string}
                          onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, [`option_${opt}`]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-400 focus:outline-none"
                        />
                      ))}
                      <Input
                        type="number"
                        min={1}
                        value={editingQuestion.points}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-400 focus:outline-none"
                      />
                      <Select
                        value={editingQuestion.correct_answer}
                        onValueChange={(v) =>
                          setEditingQuestion({ ...editingQuestion, correct_answer: v as "A" | "B" | "C" | "D" })
                        }
                      >
                        <SelectTrigger className="w-32 border-blue-200 focus:border-blue-400">
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

                      <Button
                        onClick={handleSaveQuestion}
                        className="bg-blue-500 hover:bg-blue-600 text-white mt-2"
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}{" "}
                        Lưu
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Delete quiz */}
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    disabled={isDeleting === quiz.id}
                  >
                    {isDeleting === quiz.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}{" "}
                    Xóa Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
