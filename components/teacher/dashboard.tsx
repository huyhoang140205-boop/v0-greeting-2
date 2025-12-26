"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreateFlashcardForm } from "@/components/teacher/create-flashcard-form"
import { TeacherFlashcards } from "@/components/teacher/flashcards"
import { TeacherQuizzes } from "@/components/teacher/quizzes"
import { TeacherAnalytics } from "@/components/teacher/analytics"
import { BookOpen, Brain, Users, BarChart3, LogOut, User, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreateClassForm } from "@/components/teacher/CreateClassForm"
import dynamic from "next/dynamic"

// import ClassDetailsDashboard dynamically to avoid SSR issues
const ClassDetailsDashboard = dynamic(() => import("./ClassDetailsDashboard").then((mod) => mod.default || mod), {
  ssr: false,
})

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

interface TeacherDashboardProps {
  user: any
  profile: Profile
}

interface Class {
  id: string
  name: string
  description?: string
  teacher_id: string
  created_at: string
}

interface Member {
  class_id: string
  user_id: string
}

const DEFAULT_CLASSES_BY_AGE: { [key: string]: string[] } = {
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

export function TeacherDashboard({ user, profile }: TeacherDashboardProps) {
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateFlashcardForm, setShowCreateFlashcardForm] = useState(false)
  const [showCreateClassForm, setShowCreateClassForm] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | { id: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDashboardData = async () => {
    try {
      const supabase = createClient()

      const [flashcardsData, quizzesData, studentsData, resultsData, classesData, membersData] = await Promise.all([
        supabase.from("flashcards").select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabase.from("quizzes").select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false }),
        supabase.from("results").select("*").order("completed_at", { ascending: false }),
        supabase.from("classes").select("*").order("created_at", { ascending: false }),
        supabase.from("class_members").select("*").eq("user_id", user.id),
      ])

      setFlashcards(flashcardsData.data || [])
      setQuizzes(quizzesData.data || [])
      setStudents(studentsData.data || [])
      setResults(resultsData.data || [])
      setClasses(classesData.data || [])
      setMembers(membersData.data || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleFlashcardCreated = () => {
    setShowCreateFlashcardForm(false)
    loadDashboardData()
  }

  const handleClassCreated = () => {
    setShowCreateClassForm(false)
    loadDashboardData()
  }

  const joinClass = async (classId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("class_members").insert([
      {
        class_id: classId,
        user_id: user.id,
        role: profile.role, // Join as teacher role
      },
    ])
    if (!error) {
      loadDashboardData()
    }
  }

  // MỞ chi tiết lớp nội bộ (không chuyển route)
  const openClassDetails = (cls: Class) => {
    setSelectedClass(cls)
  }

  const closeClassDetails = () => {
    setSelectedClass(null)
  }

  const hasJoinedClass = (classId: string): boolean => {
    return members.some((m) => m.class_id === classId && m.user_id === user.id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bảng điều khiển...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BookOpen className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EduCards</h1>
              <p className="text-sm text-gray-600">Bảng Điều Khiển Giáo Viên</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{profile.full_name || profile.email}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Giáo Viên
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-transparent"
            >
              <LogOut className="w-4 h-4" /> Đăng Xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Thẻ Học Của Tôi</p>
                <p className="text-3xl font-bold text-gray-900">{flashcards.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-yellow-600" />
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bài Kiểm Tra Của Tôi</p>
                <p className="text-3xl font-bold text-gray-900">{quizzes.length}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Học Sinh</p>
                <p className="text-3xl font-bold text-gray-900">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lượt Làm Bài</p>
                <p className="text-3xl font-bold text-gray-900">{results.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </CardContent>
          </Card>
        </div>

        {/* Create New Content */}
        <div className="mb-8">
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo Nội Dung Mới</h3>
                <p className="text-gray-600">Thêm thẻ học và bài kiểm tra để giúp học sinh học tập hiệu quả hơn.</p>
              </div>

              <Button
                onClick={() => setShowCreateFlashcardForm(!showCreateFlashcardForm)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showCreateFlashcardForm ? "Ẩn Form" : "Tạo Thẻ Học"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {showCreateFlashcardForm && (
          <div className="mb-8">
            <CreateFlashcardForm onSuccess={handleFlashcardCreated} />
          </div>
        )}

        <Tabs defaultValue="flashcards" className="space-y-6">
          <TabsList className="flex w-full bg-white border-2 border-gray-200 rounded-md overflow-hidden">
            <TabsTrigger
              value="flashcards"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-center hover:bg-yellow-100 active:bg-yellow-200 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Thẻ Học</span>
            </TabsTrigger>

            <TabsTrigger
              value="quizzes"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-center hover:bg-blue-100 active:bg-blue-200 transition-colors"
            >
              <Brain className="w-5 h-5" />
              <span>Kiểm Tra</span>
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-center hover:bg-purple-100 active:bg-purple-200 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Phân Tích</span>
            </TabsTrigger>

            <TabsTrigger
              value="classes"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 text-center hover:bg-green-100 active:bg-green-200 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Lớp Học</span>
            </TabsTrigger>
          </TabsList>

          {/* FLASHCARDS TAB */}
          <TabsContent value="flashcards">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Thẻ Học Của Tôi</h2>
              <Button
                onClick={() => setShowCreateFlashcardForm(!showCreateFlashcardForm)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tạo Mới
              </Button>
            </div>

            <TeacherFlashcards flashcards={flashcards} onFlashcardsChange={loadDashboardData} />
          </TabsContent>

          {/* QUIZZES TAB */}
          <TabsContent value="quizzes">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bài Kiểm Tra Của Tôi</h2>
            <TeacherQuizzes quizzes={quizzes} onQuizzesChange={loadDashboardData} />
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Phân Tích Học Tập</h2>
            <TeacherAnalytics results={results} students={students} quizzes={quizzes} />
          </TabsContent>

          {/* CLASSES TAB */}
          {/* CLASSES TAB */}
          <TabsContent value="classes">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lớp Học</h2>

            <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <CreateClassForm
                  role="teacher"
                  onSuccess={() => {
                    loadDashboardData()
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Class Details Modal */}
        {selectedClass?.name && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <ClassDetailsDashboard cls={selectedClass} onClose={closeClassDetails} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
