"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

/* ======================
 * TYPES
 * ====================== */
interface Result {
  id: string
  score: number
  total_questions: number
  completed_at: string
  user_id: string
  quiz_id: string
}

interface Profile {
  id: string
  full_name: string
  email: string
}

interface Quiz {
  id: string
  title: string
  class_id?: string
}

interface Class {
  id: string
  name: string
}

interface TeacherAnalyticsProps {
  students: Profile[]
  quizzes: Quiz[]
}

/* ======================
 * BAR COLORS (SẶC SỠ)
 * ====================== */
const BAR_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
]

export function TeacherAnalytics({
  students,
  quizzes,
}: TeacherAnalyticsProps) {
  const supabase = createClient()

  const [teacherClasses, setTeacherClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [results, setResults] = useState<Result[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)

  /* ======================
   * LOAD CLASSES (GIỮ NGUYÊN)
   * ====================== */
  useEffect(() => {
    loadTeacherClasses()
  }, [])

  const loadTeacherClasses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("class_members")
        .select("classes(id, name)")
        .eq("user_id", user.id)
        .eq("role", "teacher")

      const classes = data?.map((m) => m.classes).filter(Boolean) ?? []
      setTeacherClasses(classes)

      if (classes.length > 0) {
        setSelectedClassId(classes[0].id)
      }
    } finally {
      setLoadingClasses(false)
    }
  }

  /* ======================
   * LOAD RESULTS BY CLASS (GIỮ NGUYÊN)
   * ====================== */
  useEffect(() => {
    if (!selectedClassId) return
    loadResultsByClass()
  }, [selectedClassId])

  const loadResultsByClass = async () => {
    setLoadingResults(true)
    try {
      const quizIds = quizzes
        .filter((q) => q.class_id === selectedClassId)
        .map((q) => q.id)

      if (quizIds.length === 0) {
        setResults([])
        return
      }

      const { data } = await supabase
        .from("results")
        .select("*")
        .in("quiz_id", quizIds)

      setResults(data || [])
    } finally {
      setLoadingResults(false)
    }
  }

  /* ======================
   * GROUP BY STUDENT
   * ====================== */
  const resultsByStudent: Record<string, Result[]> = {}

  results.forEach((r) => {
    if (!resultsByStudent[r.user_id]) {
      resultsByStudent[r.user_id] = []
    }
    resultsByStudent[r.user_id].push(r)
  })

  /* ======================
   * RANKING + CHART DATA
   * ====================== */
  const rankingData = Object.entries(resultsByStudent)
    .map(([userId, rs]) => {
      const student = students.find((s) => s.id === userId)

      const totalScore = rs.reduce((s, r) => s + r.score, 0)
      const totalQuestions = rs.reduce(
        (s, r) => s + r.total_questions,
        0
      )

      const percent =
        totalQuestions > 0
          ? Math.round((totalScore / totalQuestions) * 100)
          : 0

      return {
        userId,
        name: student?.full_name || student?.email || "Unknown",
        percent,
      }
    })
    .sort((a, b) => b.percent - a.percent)

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return "bg-green-100 text-green-700"
    if (percent >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  /* ======================
   * RENDER
   * ====================== */
  return (
    <div className="space-y-6">
      {/* Select class */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chọn lớp</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingClasses ? (
            <p className="text-sm text-gray-500">Đang tải lớp...</p>
          ) : (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
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

      {/* 📊 BIỂU ĐỒ */}
      {rankingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Điểm trung bình theo học sinh</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />

                <Bar dataKey="percent">
                  {rankingData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 🏆 RANKING */}
      {rankingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Xếp hạng trong lớp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rankingData.map((s, idx) => (
              <div
                key={s.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold w-6">
                    {idx === 0
                      ? "🥇"
                      : idx === 1
                      ? "🥈"
                      : idx === 2
                      ? "🥉"
                      : idx + 1}
                  </span>
                  <span>{s.name}</span>
                </div>

                <Badge className={getScoreColor(s.percent)}>
                  {s.percent}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 📄 CHI TIẾT */}
      {loadingResults ? (
        <p className="text-sm text-gray-500">Đang tải kết quả...</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-500">
          Chưa có kết quả nào cho lớp này.
        </p>
      ) : (
        Object.entries(resultsByStudent).map(([userId, studentResults]) => {
          const student = students.find((s) => s.id === userId)
          return (
            <Card key={userId}>
              <CardHeader>
                <CardTitle>
                  {student?.full_name || student?.email || "Unknown Student"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {studentResults.map((r) => {
                  const quiz = quizzes.find((q) => q.id === r.quiz_id)
                  const percent = Math.round(
                    (r.score / r.total_questions) * 100
                  )

                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">
                          {quiz?.title || "Unknown Quiz"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {r.completed_at
                            ? new Date(r.completed_at).toLocaleString("vi-VN")
                            : "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          {r.score}/{r.total_questions}
                        </span>
                        <Badge className={getScoreColor(percent)}>
                          {percent}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
