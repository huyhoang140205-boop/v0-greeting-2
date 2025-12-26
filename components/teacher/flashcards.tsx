"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Edit, Trash2, Save, X, BookOpen } from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  category?: string
  difficulty: "easy" | "medium" | "hard"
  created_at: string
  class_id?: string
}

interface TeacherFlashcardsProps {
  flashcards: Flashcard[]
  onFlashcardsChange: () => void
}

const DIFFICULTY_GRADIENT = {
  easy: "bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300",
  medium: "bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-300",
  hard: "bg-gradient-to-br from-rose-100 to-pink-100 border-2 border-rose-300",
}

const DIFFICULTY_EMOJI = {
  easy: "🌱",
  medium: "🔥",
  hard: "⭐",
}

const CATEGORY_OPTIONS = [
  { value: "vocabulary", label: "📚 Từ Vựng" },
  { value: "grammar", label: "✏️ Ngữ Pháp" },
  { value: "concept", label: "💡 Khái Niệm" },
  { value: "science", label: "🔬 Khoa Học" },
]

const canManageFlashcard = async (flashcardId: string): Promise<boolean> => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  // Check if user is a teacher in any class
  const { data: classMember } = await supabase
    .from("class_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "giáo viên")
    .single()

  return !!classMember
}

export function TeacherFlashcards({ flashcards, onFlashcardsChange }: TeacherFlashcardsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [editData, setEditData] = useState({
    question: "",
    answer: "",
    category: "vocabulary",
    difficulty: "medium" as "easy" | "medium" | "hard",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadTeacherClasses()
  }, [])

  const loadTeacherClasses = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get all classes where user has role="teacher"
      const { data: classMembers } = await supabase
        .from("class_members")
        .select("class_id, classes(*)")
        .eq("user_id", user.id)
        .eq("role", "teacher")

      if (classMembers) {
        const classes = classMembers.map((m) => m.classes).filter((c): c is any => c !== null)
        setTeacherClasses(classes)
        if (classes.length > 0) {
          setSelectedClassId(classes[0].id)
        }
      }
    } finally {
      setIsLoadingClasses(false)
    }
  }

  const filteredFlashcards = selectedClassId ? flashcards.filter((f) => f.class_id === selectedClassId) : []

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const startEditing = async (flashcard: Flashcard) => {
    const canManage = await canManageFlashcard(flashcard.id)
    if (!canManage) return

    setEditingId(flashcard.id)
    setEditData({
      question: flashcard.question,
      answer: flashcard.answer,
      category: flashcard.category || "vocabulary",
      difficulty: flashcard.difficulty,
    })
  }

  const handleUpdate = async (id: string) => {
    if (!editData.question.trim() || !editData.answer.trim()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("flashcards")
        .update({
          question: editData.question.trim(),
          answer: editData.answer.trim(),
          category: editData.category.trim() || null,
          difficulty: editData.difficulty,
        })
        .eq("id", id)

      if (!error) {
        setEditingId(null)
        onFlashcardsChange()
      }
    } catch (error) {
      console.error("Error updating flashcard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const canManage = await canManageFlashcard(id)
    if (!canManage) return

    if (!confirm("Are you sure you want to delete this flashcard?")) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("flashcards").delete().eq("id", id)

      if (!error) {
        onFlashcardsChange()
      }
    } catch (error) {
      console.error("Error deleting flashcard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {teacherClasses.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Lớp</label>
          <Select value={selectedClassId || ""} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp để xem/quản lý flashcard" />
            </SelectTrigger>
            <SelectContent>
              {teacherClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredFlashcards.length === 0 ? (
        <Card className="border-0 bg-gradient-to-br from-gray-50 to-blue-50 shadow-lg">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 text-lg font-semibold">Chưa có flashcard nào</p>
            <p className="text-gray-500 text-sm mt-2">Tạo flashcard đầu tiên để bắt đầu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlashcards.map((flashcard) => (
            <Card
              key={flashcard.id}
              className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105 cursor-pointer ${
                DIFFICULTY_GRADIENT[flashcard.difficulty as keyof typeof DIFFICULTY_GRADIENT]
              }`}
            >
              <CardHeader className="pb-3 bg-white/40 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {editingId === flashcard.id ? (
                      <Textarea
                        value={editData.question}
                        onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                        className="font-bold mb-2 min-h-16 text-lg"
                        placeholder="Câu hỏi..."
                      />
                    ) : (
                      <CardTitle className="text-lg text-gray-800 font-bold text-balance mb-2">
                        {flashcard.question}
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {editingId === flashcard.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdate(flashcard.id)}
                          disabled={isLoading}
                          className="bg-white/50 hover:bg-white/70 text-gray-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="bg-white/50 hover:bg-white/70 text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(flashcard)}
                          className="bg-white/50 hover:bg-white/70 text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(flashcard.id)}
                          disabled={isLoading}
                          className="bg-white/50 hover:bg-white/70 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {editingId === flashcard.id ? (
                    <>
                      <Select
                        value={editData.category}
                        onValueChange={(value) => setEditData({ ...editData, category: value })}
                      >
                        <SelectTrigger className="flex-1 bg-white/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={editData.difficulty}
                        onValueChange={(value: "easy" | "medium" | "hard") =>
                          setEditData({ ...editData, difficulty: value })
                        }
                      >
                        <SelectTrigger className="w-32 bg-white/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">🌱 Dễ</SelectItem>
                          <SelectItem value="medium">🔥 Trung bình</SelectItem>
                          <SelectItem value="hard">⭐ Khó</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      {flashcard.category && (
                        <Badge className="bg-white/60 text-gray-700 border border-gray-300">
                          {CATEGORY_OPTIONS.find((c) => c.value === flashcard.category)?.label || flashcard.category}
                        </Badge>
                      )}
                      <Badge className="bg-white/70 text-gray-700 border border-gray-300 font-bold">
                        {DIFFICULTY_EMOJI[flashcard.difficulty as keyof typeof DIFFICULTY_EMOJI]}{" "}
                        {flashcard.difficulty === "easy"
                          ? "Dễ"
                          : flashcard.difficulty === "medium"
                            ? "Trung bình"
                            : "Khó"}
                      </Badge>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="bg-white/30 backdrop-blur-sm">
                {editingId === flashcard.id ? (
                  <Textarea
                    value={editData.answer}
                    onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                    placeholder="Câu trả lời..."
                    className="min-h-20 bg-white/80"
                  />
                ) : (
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">✅ Đáp Án:</p>
                    <p className="text-gray-800 text-sm leading-relaxed text-pretty font-medium">
                      {flashcard.answer.length > 100 ? `${flashcard.answer.substring(0, 100)}...` : flashcard.answer}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-4">
                  {editingId === flashcard.id
                    ? "Đang chỉnh sửa..."
                    : `📅 ${new Date(flashcard.created_at).toLocaleDateString("vi-VN")}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
