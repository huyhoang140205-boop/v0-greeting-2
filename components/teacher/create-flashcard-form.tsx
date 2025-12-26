"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2 } from "lucide-react"

interface CreateFlashcardFormProps {
  onSuccess?: () => void
}

interface ClassOption {
  id: string
  name: string
}

const CATEGORY_OPTIONS = [
  { value: "vocabulary", label: "📚 Từ Vựng" },
  { value: "grammar", label: "✏️ Ngữ Pháp" },
  { value: "concept", label: "💡 Khái Niệm" },
  { value: "science", label: "🔬 Khoa Học" },
]

export function CreateFlashcardForm({ onSuccess }: CreateFlashcardFormProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [category, setCategory] = useState("vocabulary")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [selectedClass, setSelectedClass] = useState("")
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // ✅ Load lớp:
  // 1️⃣ Teacher tham gia
  // 2️⃣ Teacher tạo
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

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
        const map = new Map<string, ClassOption>()

        memberData?.forEach((item) => {
          if (item.classes) {
            map.set(item.classes.id, item.classes)
          }
        })

        createdData?.forEach((cls) => {
          map.set(cls.id, cls)
        })

        const mergedClasses = Array.from(map.values())

        setClasses(mergedClasses)

        // auto chọn lớp đầu
        if (mergedClasses.length > 0) {
          setSelectedClass(mergedClasses[0].id)
        }
      } catch (err: any) {
        console.error("Error fetching classes:", err)
        setError(err.message || JSON.stringify(err))
      }
    }

    fetchClasses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClass) {
      setError("Bạn phải chọn lớp")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error("Bạn phải đăng nhập")

      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        category: category || null,
        difficulty,
        class_id: selectedClass,
        created_by: user.id,
      }

      const { error: insertError } = await supabase
        .from("flashcards")
        .insert(payload)

      if (insertError) throw insertError

      setQuestion("")
      setAnswer("")
      setCategory("vocabulary")
      setDifficulty("medium")

      onSuccess?.()
    } catch (err: any) {
      console.error("Create flashcard failed:", err)
      setError(err.message || JSON.stringify(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Plus className="w-5 h-5" /> Tạo Flashcard Mới
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-bold">Câu Hỏi *</Label>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} required />
          </div>

          <div>
            <Label className="font-bold">Câu Trả Lời *</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="font-bold">Danh Mục</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-bold">Lớp *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-bold">Độ Khó</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🌱 Dễ</SelectItem>
                  <SelectItem value="medium">🔥 Trung bình</SelectItem>
                  <SelectItem value="hard">⭐ Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-red-600 font-semibold">{error}</p>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Plus />} Tạo Flashcard
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
