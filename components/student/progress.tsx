"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Calendar } from "lucide-react"

interface Quiz {
  id: string
  title: string
}

interface Result {
  id: string
  quiz_id: string
  score: number
  total_questions: number
  completed_at: string
}

interface StudentProgressProps {
  results: Result[]
  quizzes: Quiz[]
}

export function StudentProgress({ results, quizzes }: StudentProgressProps) {
  // map quiz_id -> title
  const quizMap = quizzes.reduce<Record<string, string>>((acc, q) => {
    acc[q.id] = q.title
    return acc
  }, {})

  const totalQuizzes = results.length
  const totalPoints = results.reduce((sum, r) => sum + r.score, 0)
  const averageScore = totalQuizzes > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalQuizzes)
    : 0

  const recentResults = results
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 5)

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-100"
    if (percentage >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Bài Kiểm Tra Hoàn Thành</p>
              <p className="text-3xl font-bold text-gray-900">{totalQuizzes}</p>
            </div>
            <Trophy className="w-8 h-8 text-purple-600" />
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Điểm Trung Bình</p>
              <p className="text-3xl font-bold text-gray-900">{averageScore}</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Điểm</p>
              <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-600" />
          </CardContent>
        </Card>
      </div>

      {/* Kết quả gần đây */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Kết Quả Gần Đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Chưa có kết quả kiểm tra</div>
          ) : (
            <div className="space-y-4">
              {recentResults.map((r) => {
                const percentage = Math.round((r.score / r.total_questions) * 100)
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{quizMap[r.quiz_id] || "Quiz"}</h4>
                      <p className="text-sm text-gray-500">
                        Hoàn thành: {new Date(r.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {r.score}/{r.total_questions}
                        </p>
                      </div>
                      <Badge className={getScoreColor(percentage)}>{percentage}%</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
