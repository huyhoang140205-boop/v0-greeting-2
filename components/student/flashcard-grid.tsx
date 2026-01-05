"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sparkles, Play, ChevronLeft, ChevronRight, X, RotateCcw, Lightbulb, GraduationCap } from "lucide-react"
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

// Bộ Theme màu sắc cao cấp hơn
const THEMES = [
  {
    gradient: "bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600",
    shadow: "shadow-indigo-500/50",
    iconColor: "text-indigo-200",
    accent: "border-indigo-400/30"
  },
  {
    gradient: "bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-600",
    shadow: "shadow-pink-500/50",
    iconColor: "text-pink-200",
    accent: "border-pink-400/30"
  },
  {
    gradient: "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600",
    shadow: "shadow-teal-500/50",
    iconColor: "text-teal-200",
    accent: "border-teal-400/30"
  },
  {
    gradient: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-600",
    shadow: "shadow-orange-500/50",
    iconColor: "text-orange-200",
    accent: "border-orange-400/30"
  },
  {
    gradient: "bg-gradient-to-br from-blue-500 via-sky-600 to-azure-600",
    shadow: "shadow-blue-500/50",
    iconColor: "text-blue-200",
    accent: "border-blue-400/30"
  }
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

  // Study Mode State
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

  // 1. Deck Card ở màn hình chính
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
    const theme = THEMES[colorIndex % THEMES.length]

    return (
      <div
        onClick={onClick}
        className="group relative h-72 w-full cursor-pointer transition-all duration-300 hover:-translate-y-2"
      >
        {/* Layer hiệu ứng xếp chồng */}
        <div className={`absolute top-0 left-0 w-full h-full rounded-3xl ${theme.gradient} opacity-30 transform translate-x-3 translate-y-3 blur-sm`} />
        
        {/* Thẻ chính */}
        <div className={`relative w-full h-full rounded-3xl bg-white border border-gray-100 p-6 flex flex-col items-center justify-between overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow`}>
            
            {/* Background trang trí mờ */}
            <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full ${theme.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
            <div className={`absolute bottom-0 left-0 w-full h-2 ${theme.gradient}`} />
            
            {/* Avatar / Icon */}
            <div className="z-10 mt-4 relative">
                <div className={`absolute inset-0 rounded-full ${theme.gradient} blur-md opacity-40 animate-pulse`}></div>
                {avatarUrl ? (
                    <img src={avatarUrl} alt="icon" className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                ) : (
                    <div className={`relative w-24 h-24 rounded-full ${theme.gradient} flex items-center justify-center text-4xl text-white shadow-lg border-4 border-white`}>
                        📚
                    </div>
                )}
            </div>

            {/* Nội dung text */}
            <div className="text-center z-10 w-full px-2">
                <h3 className="text-2xl font-extrabold text-gray-800 line-clamp-1 mb-1">{title}</h3>
                <div className="flex items-center justify-center gap-2 text-gray-500 font-medium bg-gray-50 py-1 px-3 rounded-full mx-auto w-fit">
                    <GraduationCap className="w-4 h-4" />
                    {count} thẻ
                </div>
            </div>

            {/* Nút Action */}
            <Button className={`w-full ${theme.gradient} text-white font-bold rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0`}>
                <Play className="w-5 h-5 mr-2 fill-current" /> Bắt đầu học
            </Button>
        </div>
      </div>
    )
  }

  // 2. Study View (Màn hình học) - ĐÃ ĐƯỢC NÂNG CẤP VISUAL
  const StudyView = () => {
    const currentCard = studySession.cards[currentIndex]
    const progress = ((currentIndex + 1) / studySession.cards.length) * 100
    // Lấy theme dựa trên index để mỗi thẻ có màu khác nhau một chút
    const theme = THEMES[currentIndex % THEMES.length]

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
        
        {/* Background mờ đằng sau (Backdrop) */}
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-0" onClick={exitStudy}></div>

        {/* Header Bar */}
        <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between text-white z-10 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
                 <Button variant="ghost" onClick={exitStudy} className="text-white hover:bg-white/10 rounded-full w-12 h-12 p-0 transition-colors">
                    <X className="w-8 h-8" />
                 </Button>
                 <div>
                     <h2 className="text-2xl font-bold tracking-tight">{studySession.deckName}</h2>
                     <p className="text-base text-white/70 font-medium">Thẻ {currentIndex + 1} / {studySession.cards.length}</p>
                 </div>
            </div>
            <div className="w-1/3 md:w-1/4 pointer-events-auto">
                <Progress value={progress} className="h-3 bg-white/20" indicatorClassName={theme.gradient} />
            </div>
        </div>

        {/* Khu vực thẻ chính */}
        <div className="flex items-center gap-6 md:gap-12 w-full max-w-7xl justify-center z-10 h-full max-h-[85vh] mt-16">
            
            {/* Nút Prev (Desktop) */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevCard} 
                disabled={currentIndex === 0}
                className="hidden md:flex w-16 h-16 rounded-full border-2 border-white/10 bg-white/5 text-white hover:bg-white/20 hover:scale-110 transition-all disabled:opacity-0"
            >
                <ChevronLeft className="w-10 h-10" />
            </Button>

            {/* THE CARD CONTAINER */}
            <div 
                className="perspective-1000 w-full max-w-3xl aspect-[4/3] md:aspect-[16/10] cursor-pointer group"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
            >
                <div 
                    className="relative w-full h-full transition-transform duration-700 ease-in-out-back"
                    style={{ 
                        transformStyle: "preserve-3d",
                        transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                    }}
                >
                     {/* === FRONT (CÂU HỎI) === */}
                     <div 
                        className={`absolute inset-0 rounded-[2.5rem] ${theme.gradient} flex flex-col items-center justify-center p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${theme.shadow} border-4 border-white/20`}
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {/* Họa tiết trang trí chìm */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                        {/* Nhãn "Câu hỏi" */}
                        <div className="absolute top-10 left-10 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
                            <span className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" /> Câu hỏi
                            </span>
                        </div>

                        {/* Nội dung câu hỏi (TO & ĐẸP) */}
                        <div className="relative z-10 w-full text-center flex items-center justify-center h-full">
                            <h3 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg select-none">
                                {currentCard.question}
                            </h3>
                        </div>

                        {/* Chỉ dẫn lật thẻ */}
                        <div className="absolute bottom-8 text-white/80 text-lg font-medium animate-bounce flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                            <RotateCcw className="w-5 h-5" /> Chạm để xem đáp án
                        </div>
                     </div>

                     {/* === BACK (ĐÁP ÁN) === */}
                     <div 
                        className="absolute inset-0 rounded-[2.5rem] bg-white flex flex-col items-center justify-center p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[6px] border-white"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                        {/* Nhãn "Đáp án" */}
                        <div className={`absolute top-10 left-10 ${theme.gradient} px-6 py-2 rounded-full shadow-lg`}>
                            <span className="text-white font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Đáp án
                            </span>
                        </div>

                         {/* Nội dung đáp án (TO & RÕ) */}
                        <div className="w-full h-full flex items-center justify-center overflow-hidden pt-12 pb-4">
                            <div className="text-3xl md:text-5xl font-bold text-gray-800 text-center leading-snug overflow-y-auto max-h-full w-full pr-4 custom-scrollbar">
                                {currentCard.answer.split('\n').map((line, i) => (
                                    <p key={i} className={`mb-4 ${i === 0 ? "text-transparent bg-clip-text " + theme.gradient : ""}`}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Nút Next (Desktop) */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextCard} 
                disabled={currentIndex === studySession.cards.length - 1}
                className="hidden md:flex w-16 h-16 rounded-full border-2 border-white/10 bg-white/5 text-white hover:bg-white/20 hover:scale-110 transition-all disabled:opacity-0"
            >
                <ChevronRight className="w-10 h-10" />
            </Button>
        </div>

        {/* Mobile Navigation Controls (Bottom) */}
        <div className="flex md:hidden items-center justify-between w-full max-w-md mt-6 px-4 z-20">
             <Button onClick={prevCard} disabled={currentIndex === 0} className={`rounded-full w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white ${currentIndex === 0 ? "opacity-30" : ""}`}><ChevronLeft className="w-8 h-8" /></Button>
             <span className="text-white/80 font-mono text-xl font-bold tracking-widest">{currentIndex + 1} / {studySession.cards.length}</span>
             <Button onClick={nextCard} disabled={currentIndex === studySession.cards.length - 1} className={`rounded-full w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white ${currentIndex === studySession.cards.length - 1 ? "opacity-30" : ""}`}><ChevronRight className="w-8 h-8" /></Button>
        </div>
      </div>
    )
  }

  // --- MAIN RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Sparkles className="animate-spin text-purple-600 w-12 h-12"/></div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans selection:bg-purple-200">
      
      {/* Hiển thị StudyView nếu đang học */}
      {studySession.isActive && <StudyView />}

      <div className="max-w-7xl mx-auto">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 mb-2 tracking-tight">
                    Thư Viện Flashcard
                </h1>
                <p className="text-lg text-gray-500 font-medium">Chọn một bộ thẻ để bắt đầu hành trình chinh phục kiến thức!</p>
            </div>
            <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-gray-900 text-white hover:bg-black rounded-2xl px-8 py-7 text-lg font-bold shadow-xl shadow-gray-200 transition-all hover:scale-105 active:scale-95"
            >
                {showForm ? <X className="mr-2 w-6 h-6"/> : <Sparkles className="mr-2 w-6 h-6" />}
                {showForm ? "Đóng lại" : "Tạo thẻ mới"}
            </Button>
        </div>

        {/* Form Tạo Thẻ */}
        {showForm && (
             <Card className="mb-12 border-none shadow-2xl rounded-[2rem] overflow-hidden animate-in slide-in-from-top-4 fade-in duration-500 ring-4 ring-purple-50">
                <div className="h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                <CardHeader className="bg-white pt-8 pb-4 px-8">
                    <CardTitle className="text-2xl font-bold text-gray-800">✨ Thêm kiến thức mới</CardTitle>
                </CardHeader>
                <CardContent className="bg-white p-8 pt-0">
                    <form onSubmit={handleCreateFlashcard} className="space-y-6">
                        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">{error}</div>}
                        
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 ml-1">Loại thẻ</label>
                            <div className="relative">
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl appearance-none font-semibold text-gray-700 focus:outline-none focus:border-purple-500 focus:bg-white transition-all">
                                    <option value="vocabulary">📖 Từ Vựng</option>
                                    <option value="grammar">🔤 Ngữ Pháp</option>
                                    <option value="concept">💡 Khái Niệm</option>
                                    <option value="science">🔬 Khoa Học</option>
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-gray-700 font-bold mb-2 ml-1">Câu hỏi</label>
                                <textarea 
                                    value={question} onChange={(e) => setQuestion(e.target.value)} 
                                    placeholder="Nhập nội dung câu hỏi..." className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl h-40 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all text-lg" 
                                />
                             </div>
                             <div>
                                <label className="block text-gray-700 font-bold mb-2 ml-1">Đáp án</label>
                                <textarea 
                                    value={answer} onChange={(e) => setAnswer(e.target.value)} 
                                    placeholder="Nhập nội dung đáp án..." className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl h-40 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all text-lg" 
                                />
                             </div>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 h-16 text-xl font-bold rounded-2xl shadow-lg shadow-purple-200 transition-all transform active:scale-95">
                            {isSubmitting ? "Đang lưu..." : "Lưu vào bộ thẻ"}
                        </Button>
                    </form>
                </CardContent>
             </Card>
        )}

        {/* GRID CÁC BỘ THẺ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            
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
                        avatarUrl={undefined} 
                        onClick={() => startStudy("Thẻ Cá Nhân", personalCards)}
                    />
                )
            })()}

        </div>

        {/* Empty State */}
        {flashcards.length === 0 && !loading && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                <div className="text-8xl mb-6 animate-bounce">📭</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Chưa có flashcard nào</h3>
                <p className="text-xl text-gray-500 max-w-md mx-auto">Không gian này đang trống trải. Hãy tạo thẻ mới hoặc tham gia lớp học để lấp đầy kiến thức!</p>
            </div>
        )}

      </div>
    </div>
  )
}
