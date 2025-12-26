"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Flashcard {
  id: string
  question: string
  answer: string
  category?: "vocabulary" | "grammar" | "concept" | "science"
  class_id: string | null
  created_by: string
}

interface Class {
  id: string
  name: string
}

interface StudentFlashcardsProps {
  userId: string
}

const AVATAR_MAP: Record<string, string> = {
  "0": "/avarta/doremon.jpg",
  "1": "/avarta/goku.jpg",
  "2": "/avarta/pikachu.jpg",
  "3": "/avarta/chaien.jpg",
  "4": "/avarta/nobita.jpg",
  "5": "/avarta/shizuka.jpg",
}

const GRADIENT_COLORS = [
  "from-blue-300 to-purple-400",
  "from-pink-300 to-red-400",
  "from-yellow-300 to-orange-400",
  "from-green-300 to-emerald-400",
  "from-indigo-300 to-blue-400",
  "from-rose-300 to-pink-400",
]

export default function StudentFlashcards({ userId }: StudentFlashcardsProps) {
  const supabase = createClient()

  const [classes, setClasses] = useState<Class[]>([])
  const [joinedClassIds, setJoinedClassIds] = useState<string[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [category, setCategory] = useState<string>("vocabulary")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: joinedData } = await supabase.from("class_members").select("class_id").eq("user_id", userId)

      const classIds = joinedData?.map((c) => c.class_id) || []
      setJoinedClassIds(classIds)

      const { data: classesData } = await supabase
        .from("classes")
        .select("id,name")
        .in("id", classIds.length > 0 ? classIds : [""])

      setClasses(classesData || [])

      const query = supabase.from("flashcards").select("*").order("created_at", { ascending: false })

      if (classIds.length > 0) {
        // Get flashcards from joined classes OR personal flashcards
        const { data: classFlashcards } = await supabase
          .from("flashcards")
          .select("*")
          .in("class_id", classIds)
          .order("created_at", { ascending: false })

        const { data: personalFlashcards } = await supabase
          .from("flashcards")
          .select("*")
          .eq("created_by", userId)
          .is("class_id", null)
          .order("created_at", { ascending: false })

        setFlashcards([...(classFlashcards || []), ...(personalFlashcards || [])])
      } else {
        // Only get personal flashcards if not in any class
        const { data: personalFlashcards } = await supabase
          .from("flashcards")
          .select("*")
          .eq("created_by", userId)
          .is("class_id", null)
          .order("created_at", { ascending: false })

        setFlashcards(personalFlashcards || [])
      }
    } catch (err) {
      console.error("❌ Lỗi load dữ liệu:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) {
      setError("Câu hỏi và câu trả lời không được để trống")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        category,
        class_id: null,
        created_by: userId,
      }

      const { data, error: insertError } = await supabase.from("flashcards").insert(payload).select()

      if (insertError) throw insertError

      setFlashcards((prev) => [...data, ...prev])
      setQuestion("")
      setAnswer("")
      setCategory("vocabulary")
      setShowForm(false)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Tạo flashcard thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <p className="text-center py-8 text-lg font-semibold">Đang tải dữ liệu...</p>
  const FlashcardItem = ({ flashcard, colorIndex }: { flashcard: Flashcard; colorIndex: number }) => {
    const [isFlipped, setIsFlipped] = useState(false)
    const gradientClass = GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length]

    return (
      <div
        className="perspective-1000 h-80 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ========== FRONT - QUESTION ========== */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientClass}
            flex items-center justify-center text-center
            p-10 shadow-2xl border-4 border-white`}
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Icons */}
            <div className="absolute top-4 left-4 text-4xl opacity-30">❓</div>
            <div className="absolute bottom-4 right-4 text-3xl opacity-30">📘</div>

            <h3 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-2xl leading-snug">
              {flashcard.question}
            </h3>
          </div>

          {/* ========== BACK - ANSWER ========== */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientClass}
            flex flex-col items-center justify-center text-center
            p-10 shadow-2xl border-4 border-white`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Icons */}
            <div className="absolute top-4 right-4 text-4xl opacity-30">✨</div>
            <div className="absolute bottom-4 left-4 text-3xl opacity-30">🎉</div>

            {/* Smaller title */}
            <h4 className="text-sm tracking-widest font-semibold text-white/80 mb-3">
              ĐÁP ÁN
            </h4>

            {/* Big answer */}
            <div className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-xl leading-snug space-y-3">
              {flashcard.answer.split("\n").map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500 animate-spin" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Học Tập Cùng Flashcard
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500 animate-spin" />
          </div>
          <p className="text-gray-600 text-lg">Nhấp vào thẻ để flip và xem đáp án</p>
        </div>

        {/* Create Flashcard Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-lg px-8 py-6 rounded-full font-bold shadow-lg transform transition hover:scale-105"
          >
            ✏️ {showForm ? "Hủy" : "Tạo Flashcard Mới"}
          </Button>
        </div>

        {showForm && (
          <Card className="max-w-2xl mx-auto mb-12 border-4 border-green-300 bg-gradient-to-br from-green-50 to-blue-50 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">✨ Tạo Flashcard Mới</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFlashcard} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl font-semibold">
                    ❌ {error}
                  </div>
                )}

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">🏷️ Loại Flashcard</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border-2 border-purple-300 rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="vocabulary">Từ Vựng</option>
                    <option value="grammar">Ngữ Pháp</option>
                    <option value="concept">Khái Niệm</option>
                    <option value="science">Khoa Học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">❓ Câu Hỏi</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="w-full p-4 border-2 border-orange-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white resize-none h-24"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">✅ Câu Trả Lời</label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-4 border-2 border-green-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none h-24"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white text-lg py-4 font-bold rounded-xl shadow-lg transform transition hover:scale-105"
                >
                  {isSubmitting ? "⏳ Đang tạo..." : "🎉 Tạo Flashcard"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Flashcards by Class */}
        {classes.map((cls, classIndex) => {
          const flashcardsOfClass = flashcards.filter((f) => f.class_id === cls.id)
          if (flashcardsOfClass.length === 0) return null

          const avatarIndex = classIndex % Object.keys(AVATAR_MAP).length
          const avatarUrl = AVATAR_MAP[avatarIndex.toString()]

          return (
            <div key={cls.id} className="mb-16">
              {/* Class Header with Avatar */}
              <div className="flex items-center gap-4 mb-8">
                {avatarUrl && (
                  <img
                    src={avatarUrl || "/placeholder.svg"}
                    alt={cls.name}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">{cls.name}</h2>
                  <p className="text-gray-600 text-lg">{flashcardsOfClass.length} thẻ học</p>
                </div>
              </div>

              {/* Flashcards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {flashcardsOfClass.map((f, idx) => (
                  <FlashcardItem key={f.id} flashcard={f} colorIndex={classIndex + idx} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Personal Flashcards */}
        {flashcards.filter((f) => f.created_by === userId && !f.class_id).length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl shadow-lg border-4 border-white">
                📌
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Flashcards Riêng của Bạn</h2>
                <p className="text-gray-600 text-lg">
                  {flashcards.filter((f) => f.created_by === userId && !f.class_id).length} thẻ học
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {flashcards
                .filter((f) => f.created_by === userId && !f.class_id)
                .map((f, idx) => (
                  <FlashcardItem key={f.id} flashcard={f} colorIndex={10 + idx} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
