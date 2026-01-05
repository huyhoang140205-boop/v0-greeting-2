"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sparkles, Play, ChevronLeft, ChevronRight, X, RotateCcw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// --- INTERFACES ---
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

interface StudySession {
  isActive: boolean
  deckName: string
  cards: Flashcard[]
}

// --- CONSTANTS ---
const AVATAR_MAP: Record<string, string> = {
  "0": "/avarta/doremon.jpg",
  "1": "/avarta/goku.jpg",
  "2": "/avarta/pikachu.jpg",
  "3": "/avarta/chaien.jpg",
  "4": "/avarta/nobita.jpg",
  "5": "/avarta/shizuka.jpg",
}

const GRADIENT_COLORS = [
  "from-blue-400 to-purple-500",
  "from-pink-400 to-red-500",
  "from-yellow-400 to-orange-500",
  "from-green-400 to-emerald-500",
  "from-indigo-400 to-blue-500",
  "from-rose-400 to-pink-500",
]

export default function StudentFlashcards({ userId }: StudentFlashcardsProps) {
  const supabase = createClient()

  // Data State
  const [classes, setClasses] = useState<Class[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [category, setCategory] = useState<string>("vocabulary")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Study Mode State (NEW)
  const [studySession, setStudySession] = useState<StudySession>({
    isActive: false,
    deckName: "",
    cards: [],
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCardFlipped, setIsCardFlipped] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Reset flip when changing card
  useEffect(() => {
    setIsCardFlipped(false)
  }, [currentIndex])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: joinedData } = await supabase.from("class_members").select("class_id").eq("user_id", userId)
      const classIds = joinedData?.map((c) => c.class_id) || []

      const { data: classesData } = await supabase
        .from("classes")
        .select("id,name")
        .in("id", classIds.length > 0 ? classIds : [""])

      setClasses(classesData || [])

      // Fetch ALL relevant flashcards once
      let query = supabase.from("flashcards").select("*").order("created_at", { ascending: false })

      if (classIds.length > 0) {
        query = query.or(`class_id.in.(${classIds.join(",")}),and(created_by.eq.${userId},class_id.is.null)`)
      } else {
        query = query.eq("created_by", userId).is("class_id", null)
      }

      const { data: allCards, error } = await query
      if (error) throw error

      setFlashcards(allCards || [])
    } catch (err) {
      console.error("❌ Lỗi load dữ liệu:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return

    setIsSubmitting(true)
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
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- LOGIC CHẾ ĐỘ HỌC ---
  const startStudy = (deckName: string, cards: Flashcard[]) => {
    if (cards.length === 0) return
    setStudySession({ isActive: true, deckName, cards })
    setCurrentIndex(0)
    setIsCardFlipped(false)
  }

  const exitStudy = () => {
    setStudySession({ isActive: false, deckName: "", cards: [] })
  }

  const nextCard = () => {
    if (currentIndex < studySession.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  // --- COMPONENTS CON ---

  // 1. Component hiển thị 1 Lớp (Deck Card) ở màn hình chính
  const DeckCard = ({
    title,
    count,
    avatarUrl,
    colorIndex,
    onClick,
  }: {
    title: string
    count: number
    avatarUrl?: string
    colorIndex: number
    onClick: () => void
  }) => {
    const gradient = GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length]

    return (
      <div
        onClick={onClick}
        className="group relative h-64 w-full cursor-pointer transition-all duration-300 hover:-translate-y-2"
      >
        {/* Stack effect layers */}
        <div className={`absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br ${gradient} opacity-40 transform translate-x-2 translate-y-2`} />
        <div className={`absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br ${gradient} opacity-70 transform translate-x-1 translate-y-1`} />
        
        {/* Main Card */}
        <div className={`relative w-full h-full rounded-2xl bg-white border-2 border-gray-100 shadow-xl p-6 flex flex-col items-center justify-between overflow-hidden group-hover:border-purple-300`}>
             {/* Background decoration */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
            
            {/* Avatar & Icon */}
            <div className="z-10 mt-2">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="icon" className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" />
                ) : (
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl text-white shadow-md border-4 border-white`}>
                        📚
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="text-center z-10">
                <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{title}</h3>
                <p className="text-gray-500 font-medium">{count} thẻ</p>
            </div>

            <Button className={`w-full bg-gradient-to-r ${gradient} text-white font-bold rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0`}>
                <Play className="w-4 h-4 mr-2" fill="currentColor" /> Bắt đầu học
            </Button>
        </div>
      </div>
    )
  }

  // 2. Component hiển thị Flashcard đang học (Study View)
  const StudyView = () => {
    const currentCard = studySession.cards[currentIndex]
    const progress = ((currentIndex + 1) / studySession.cards.length) * 100
    const gradientClass = GRADIENT_COLORS[currentIndex % GRADIENT_COLORS.length]

    return (
      <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col items-center justify-center p-4">
        {/* Header Bar */}
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" onClick={exitStudy} className="text-white hover:bg-white/20 rounded-full p-2">
                    <X className="w-6 h-6" />
                 </Button>
                 <div>
                     <h2 className="text-xl font-bold">{studySession.deckName}</h2>
                     <p className="text-sm opacity-80">Thẻ {currentIndex + 1} / {studySession.cards.length}</p>
                 </div>
            </div>
            <div className="w-1/3 md:w-1/4">
                <Progress value={progress} className="h-2 bg-gray-700" />
            </div>
        </div>

        {/* Main Flashcard Interaction Area */}
        <div className="flex items-center gap-4 md:gap-8 w-full max-w-5xl justify-center">
            {/* Prev Button */}
            <Button 
                variant="outline" 
                size="icon" 
                onClick={prevCard} 
                disabled={currentIndex === 0}
                className="hidden md:flex w-12 h-12 rounded-full border-2 border-white/20 bg-transparent text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
            >
                <ChevronLeft className="w-8 h-8" />
            </Button>

            {/* THE CARD */}
            <div 
                className="perspective-1000 w-full max-w-md md:max-w-xl h-[500px] cursor-pointer"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
            >
                <div 
                    className="relative w-full h-full transition-transform duration-500 ease-out"
                    style={{ 
                        transformStyle: "preserve-3d",
                        transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                    }}
                >
                     {/* FRONT */}
                     <div 
                        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-8 shadow-2xl border-4 border-white/20`}
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        <span className="absolute top-6 left-6 text-white/40 text-sm font-bold tracking-widest uppercase">Câu hỏi</span>
                        <h3 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight drop-shadow-md">
                            {currentCard.question}
                        </h3>
                        <p className="absolute bottom-8 text-white/60 text-sm animate-bounce">Chạm để lật</p>
                     </div>

                     {/* BACK */}
                     <div 
                        className="absolute inset-0 rounded-3xl bg-white flex flex-col items-center justify-center p-8 shadow-2xl border-4 border-gray-200"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        <span className="absolute top-6 left-6 text-gray-400 text-sm font-bold tracking-widest uppercase">Đáp án</span>
                        <div className="text-2xl md:text-3xl font-bold text-gray-800 text-center leading-snug overflow-y-auto max-h-full w-full custom-scrollbar">
                            {currentCard.answer.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">{line}</p>
                            ))}
                        </div>
                     </div>
                </div>
            </div>

            {/* Next Button */}
            <Button 
                variant="outline" 
                size="icon" 
                onClick={nextCard} 
                disabled={currentIndex === studySession.cards.length - 1}
                className="hidden md:flex w-12 h-12 rounded-full border-2 border-white/20 bg-transparent text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
            >
                <ChevronRight className="w-8 h-8" />
            </Button>
        </div>

        {/* Mobile Navigation Controls (Bottom) */}
        <div className="flex md:hidden items-center justify-between w-full max-w-md mt-8 px-4">
             <Button onClick={prevCard} disabled={currentIndex === 0} variant="secondary" className="rounded-full w-12 h-12 p-0"><ChevronLeft /></Button>
             <span className="text-white font-mono text-lg">{currentIndex + 1} / {studySession.cards.length}</span>
             <Button onClick={nextCard} disabled={currentIndex === studySession.cards.length - 1} variant="secondary" className="rounded-full w-12 h-12 p-0"><ChevronRight /></Button>
        </div>
      </div>
    )
  }


  // --- MAIN RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Sparkles className="animate-spin text-purple-500 w-10 h-10"/></div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      
      {/* Hiển thị StudyView nếu đang học */}
      {studySession.isActive && <StudyView />}

      <div className="max-w-6xl mx-auto">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    Thư Viện Flashcard
                </h1>
                <p className="text-gray-500">Chọn một bộ thẻ để bắt đầu ôn tập ngay hôm nay!</p>
            </div>
            <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-black text-white hover:bg-gray-800 rounded-full px-6 py-6 shadow-lg transition-transform hover:scale-105"
            >
                {showForm ? <X className="mr-2"/> : <Sparkles className="mr-2" />}
                {showForm ? "Đóng" : "Tạo thẻ mới"}
            </Button>
        </div>

        {/* Form Tạo Thẻ (Giữ nguyên logic cũ nhưng làm gọn UI) */}
        {showForm && (
             <Card className="mb-12 border-2 border-purple-100 shadow-xl overflow-hidden animate-in slide-in-from-top-4 fade-in">
                <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-500" />
                <CardHeader>
                    <CardTitle>Tạo Flashcard Mới</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateFlashcard} className="space-y-4">
                        {error && <p className="text-red-500">{error}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Loại thẻ</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-md">
                                    <option value="vocabulary">Từ Vựng</option>
                                    <option value="grammar">Ngữ Pháp</option>
                                    <option value="concept">Khái Niệm</option>
                                    <option value="science">Khoa Học</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <textarea 
                                value={question} onChange={(e) => setQuestion(e.target.value)} 
                                placeholder="Câu hỏi..." className="w-full p-3 border rounded-xl h-32 focus:ring-2 focus:ring-purple-500 outline-none" 
                             />
                             <textarea 
                                value={answer} onChange={(e) => setAnswer(e.target.value)} 
                                placeholder="Câu trả lời..." className="w-full p-3 border rounded-xl h-32 focus:ring-2 focus:ring-green-500 outline-none" 
                             />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 h-12 text-lg">
                            {isSubmitting ? "Đang lưu..." : "Lưu thẻ"}
                        </Button>
                    </form>
                </CardContent>
             </Card>
        )}

        {/* GRID CÁC BỘ THẺ (DECK VIEW) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* 1. Các bộ thẻ theo Lớp */}
            {classes.map((cls, idx) => {
                 const classCards = flashcards.filter(f => f.class_id === cls.id)
                 if(classCards.length === 0) return null
                 
                 return (
                     <DeckCard 
                        key={cls.id}
                        title={cls.name}
                        count={classCards.length}
                        colorIndex={idx}
                        avatarUrl={AVATAR_MAP[(idx % 6).toString()]}
                        onClick={() => startStudy(cls.name, classCards)}
                     />
                 )
            })}

            {/* 2. Bộ thẻ cá nhân */}
            {(() => {
                const personalCards = flashcards.filter(f => f.created_by === userId && !f.class_id)
                if (personalCards.length === 0) return null

                return (
                    <DeckCard 
                        title="Thẻ cá nhân của bạn"
                        count={personalCards.length}
                        colorIndex={99}
                        avatarUrl={undefined} // Sẽ hiển thị icon mặc định
                        onClick={() => startStudy("Thẻ Cá Nhân", personalCards)}
                    />
                )
            })()}

        </div>

        {/* Empty State nếu không có thẻ nào */}
        {flashcards.length === 0 && !loading && (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-700">Chưa có flashcard nào</h3>
                <p className="text-gray-500">Hãy tạo thẻ mới hoặc tham gia lớp học để bắt đầu.</p>
            </div>
        )}

      </div>
    </div>
  )
}
