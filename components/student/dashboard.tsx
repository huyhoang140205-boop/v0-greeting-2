"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { LogOut } from "lucide-react"

import StudentFlashcards from "@/components/student/flashcard-grid"
import { StudentNotes } from "@/components/student/notes"
import { StudentQuizzes } from "@/components/student/quizzes"
import { StudentProgress } from "@/components/student/progress"
import { GameHub } from "@/components/games/game-hub"

/* ===================== IMAGES (UPDATED) ===================== */
const images = {
  // 📚 FLASHCARD – thẻ học hoạt hình (MỚI)
  flashcards: "https://cdn-icons-png.flaticon.com/512/2436/2436874.png",

  // 📝 NOTES – dùng ảnh flashcard cũ (CHUYỂN SANG)
  notes: "https://cdn-icons-png.flaticon.com/512/4696/4696755.png",

  // ❓ QUIZ – bài kiểm tra hoạt hình (MỚI)
  quizzes: "https://cdn-icons-png.flaticon.com/512/2010/2010990.png",

  // 📈 PROGRESS – huy hiệu, sao
  progress: "https://cdn-icons-png.flaticon.com/512/3159/3159310.png",

  // 🎮 GAME
  games: "https://cdn-icons-png.flaticon.com/512/686/686589.png",

  // 🏫 CLASS – lớp học hoạt hình (MỚI)
  classes: "https://cdn-icons-png.flaticon.com/512/8074/8074808.png",

  // 👧👦 AVATAR mặc định (ĐỘNG VẬT – TRẺ EM)
  avatarDefault: "https://cdn-icons-png.flaticon.com/512/616/616408.png", // gấu hoạt hình
}

/* ===================== SOUND ===================== */
const clickSound = () => new Audio("https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3").play()

const winSound = () => new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3").play()

/* ===================== TYPES ===================== */
type View = "flashcards" | "quizzes" | "notes" | "progress" | "games" | "classes"

/* ===================== JOIN CLASS ===================== */
function JoinClass({ supabase, userId }: any) {
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [joined, setJoined] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [expandedAge, setExpandedAge] = useState<string | null>(null)

  const DEFAULT_CLASSES = {
    "3 tuổi": [
      "fc4b29b0-d7cf-4a97-89b1-3cb479d6db23",
      "82edff0e-5402-4c63-b7b3-067944f01c4a",
      "1f79af46-2a69-4e14-a200-e4fe6e4ab9d4",
    ],
    "4 tuổi": [
      "404ebca9-1861-4f92-98ec-9405deddd507",
      "090f0c1e-70c2-443c-9cb3-d3a7eaeddba7",
      "01f1504a-8163-4ceb-b4df-7cc5862f444c",
    ],
    "5 tuổi": [
      "bdef73f9-e2ca-4161-80f8-4547ec886f1a",
      "ab43875a-6d41-465f-9213-aaa0bad15515",
      "3149d4cd-57d1-4c62-a6c9-0e6ab220be18",
    ],
  }

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data: cls } = await supabase.from("classes").select("*")
    const { data: mem } = await supabase.from("class_members").select("class_id").eq("user_id", userId)

    setAllClasses(cls || [])
    setJoined(mem?.map((m) => m.class_id) || [])
    setLoading(false)
  }

  const joinClass = async (classId: string) => {
    setJoiningId(classId)

    const { error } = await supabase.from("class_members").insert({
      user_id: userId,
      class_id: classId,
    })

    if (!error) {
      clickSound()
      await load()
    }

    setJoiningId(null)
  }

  if (loading) return <p className="text-xl">⏳ Đang tải lớp học...</p>

  const defaultClassIds = Object.values(DEFAULT_CLASSES).flat()
  const defaultClasses = allClasses.filter((c) => defaultClassIds.includes(c.id))
  const customClasses = allClasses.filter((c) => !defaultClassIds.includes(c.id))

  return (
    <div className="space-y-8">
      {/* Default Classes Section */}
      <div className="border-2 border-blue-400 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
        <h3 className="text-2xl font-bold mb-6 text-blue-900">📚 Các Lớp Mặc Định</h3>
        <div className="space-y-3">
          {Object.entries(DEFAULT_CLASSES).map(([age, classIds]) => {
            const ageClasses = defaultClasses.filter((c) => classIds.includes(c.id))
            const isExpanded = expandedAge === age

            return (
              <div key={age}>
                <button
                  onClick={() => setExpandedAge(isExpanded ? null : age)}
                  className="w-full text-left px-6 py-4 bg-gradient-to-r from-blue-300 to-cyan-300 hover:from-blue-400 hover:to-cyan-400 font-bold text-lg text-blue-900 rounded-xl border-2 border-blue-400 transition flex justify-between items-center"
                >
                  <span>{age}</span>
                  <span className="text-2xl">{isExpanded ? "▼" : "▶"}</span>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-3 pl-4">
                    {ageClasses.map((c) => {
                      const isJoined = joined.includes(c.id)
                      return (
                        <Card
                          key={c.id}
                          className="rounded-2xl bg-white border-2 border-blue-300 hover:shadow-lg transition"
                        >
                          <CardHeader>
                            <CardTitle className="text-lg text-gray-900">{c.name}</CardTitle>
                            <CardDescription className="text-gray-600">{c.description}</CardDescription>
                          </CardHeader>

                          <CardContent className="flex justify-end">
                            {isJoined ? (
                              <Badge className="bg-green-400 text-green-900">✅ Đã tham gia</Badge>
                            ) : (
                              <Button
                                size="sm"
                                disabled={joiningId === c.id}
                                onClick={() => joinClass(c.id)}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                {joiningId === c.id ? "⏳ Đang vào..." : "➕ Tham gia"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Classes Section */}
      {customClasses.length > 0 && (
        <div className="border-2 border-purple-400 rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <h3 className="text-2xl font-bold mb-6 text-purple-900">🎓 Lớp Bổ Sung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customClasses.map((c) => {
              const isJoined = joined.includes(c.id)

              return (
                <Card
                  key={c.id}
                  className="rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 hover:scale-105 transition border-2 border-purple-300"
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-900">{c.name}</CardTitle>
                    <CardDescription className="text-purple-700">{c.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex justify-between items-center">
                    {isJoined ? (
                      <Badge className="bg-green-400 text-green-900">✅ Đã tham gia</Badge>
                    ) : (
                      <Button
                        size="sm"
                        disabled={joiningId === c.id}
                        onClick={() => joinClass(c.id)}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {joiningId === c.id ? "⏳ Đang vào..." : "➕ Tham gia"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ===================== DASHBOARD ===================== */
export function StudentDashboard({ user, profile }: any) {
  const supabase = createClient()
  const router = useRouter()

  const [view, setView] = useState<View>("flashcards")
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [points, setPoints] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setQuizzes((await supabase.from("quizzes").select("*")).data || [])
    setNotes((await supabase.from("notes").select("*").eq("user_id", user.id)).data || [])
    setResults((await supabase.from("results").select("*").eq("user_id", user.id)).data || [])
    setPoints((await supabase.from("user_totals").select("*").eq("user_id", user.id).single()).data)
    setLoading(false)
  }

  const onQuizDone = () => {
    winSound()
    confetti({ particleCount: 200, spread: 160 })
    load()
  }

  if (loading) return <p className="p-10">⏳ Đang tải...</p>

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-sky-50">
      {/* HEADER */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={profile?.avatar_url || images.avatarDefault}
              className="w-12 h-12 rounded-full border-2 border-pink-400"
            />
            <h1 className="text-3xl font-extrabold text-pink-500">Học tập cùng Flashcard 🎒</h1>
          </div>

          <div className="flex gap-4 items-center">
            <Badge className="bg-yellow-200 text-yellow-800 px-4 py-1 text-lg">🏆 {points?.total_score || 0}</Badge>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push("/")
              }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* MENU */}
      <div className="px-8 py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Tile title="Flashcards" img={images.flashcards} onClick={() => setView("flashcards")} />
        <Tile title="Quiz" img={images.quizzes} onClick={() => setView("quizzes")} />
        <Tile title="Notes" img={images.notes} onClick={() => setView("notes")} />
        <Tile title="Progress" img={images.progress} onClick={() => setView("progress")} />
        <Tile title="Games" img={images.games} onClick={() => setView("games")} />
        <Tile title="Classes" img={images.classes} onClick={() => setView("classes")} />
      </div>

      {/* CONTENT */}
      <div className="px-8 pb-20">
        {view === "flashcards" && <StudentFlashcards userId={user.id} />}
        {view === "quizzes" && <StudentQuizzes quizzes={quizzes} onQuizComplete={onQuizDone} />}
        {view === "notes" && <StudentNotes notes={notes} onNotesChange={load} />}
        {view === "progress" && <StudentProgress results={results} quizzes={quizzes} />}
        {view === "games" && <GameHub />}
        {view === "classes" && <JoinClass supabase={supabase} userId={user.id} />}
      </div>
    </div>
  )
}

/* ===================== TILE ===================== */
function Tile({ title, img, onClick }: any) {
  return (
    <div
      onClick={() => {
        clickSound()
        onClick()
      }}
      className="cursor-pointer rounded-3xl bg-white p-6 flex flex-col items-center gap-3
      shadow-xl hover:scale-110 transition"
    >
      <img src={img || "/placeholder.svg"} className="w-16 h-16 animate-bounce" />
      <p className="font-bold text-lg text-pink-600">{title}</p>
    </div>
  )
}
