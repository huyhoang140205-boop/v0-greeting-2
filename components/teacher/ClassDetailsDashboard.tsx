"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BarChart3, X } from "lucide-react"

interface ClassProps {
  id: string
  name?: string
  description?: string
  created_at?: string
}

interface Props {
  cls: ClassProps
  onClose: () => void
}

export default function ClassDetailsDashboard({ cls, onClose }: Props) {
  const supabase = createClient()

  const [members, setMembers] = useState<any[]>([])
  const [classScores, setClassScores] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agg, setAgg] = useState({ totalPlays: 0, avgScore: 0 })

  useEffect(() => {
    if (!cls?.id) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1) members (join profiles)
      const { data: classMembers, error: membersError } = await supabase
        .from("class_members")
        .select("id, class_id, user_id, role, joined_at, profiles(id, full_name, email, created_at)")
        .eq("class_id", cls.id)

      if (membersError) console.error("membersError", membersError)

      const memberIds = (classMembers || []).map((m: any) => m.user_id).filter(Boolean)
      setMembers(classMembers || [])

      // 2) results: chỉ lấy quiz do học sinh trong lớp làm
      let resultsData: any[] = []
      if (memberIds.length > 0) {
        const { data: res, error: resErr } = await supabase
          .from("results")
          .select("id, user_id, quiz_id, score, total_questions, completed_at, quizzes(id, title, class_id)")
          .in("user_id", memberIds)
          .order("completed_at", { ascending: false })

        if (resErr) console.error("resultsError", resErr)
        // Lọc chỉ quiz thuộc lớp hiện tại
        resultsData = (res || []).filter(r => r.quizzes?.class_id === cls.id)
      }

      setResults(resultsData)

      // 3) class_scores: chỉ giữ scores cho học sinh trong lớp
      const { data: scoresData, error: scoresError } = await supabase
        .from("class_scores")
        .select("class_id, game_id, total_score, max_score, avg_score, updated_at, game(id, title, thumbnail_url, category)")
        .eq("class_id", cls.id)

      if (scoresError) console.error("scoresError", scoresError)
      setClassScores(scoresData || [])

      // 4) aggregate stats
      const totalPlays = resultsData.length
      const avgScore =
        totalPlays > 0 ? Math.round(resultsData.reduce((s, r) => s + (r.score || 0), 0) / totalPlays * 100) / 100 : 0
      setAgg({ totalPlays, avgScore })

    } catch (err) {
      console.error("Error loading class details", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 mb-6 border-2 border-blue-200">
        <p>Đang tải dữ liệu lớp...</p>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-2 border-blue-300 bg-white shadow-lg">
      <CardHeader className="flex items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-bold">{cls.name || "Chi tiết lớp"}</CardTitle>
          <p className="text-sm text-gray-600">{cls.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Tổng lượt làm bài</div>
            <div className="text-lg font-bold">{agg.totalPlays}</div>
            <div className="text-sm text-gray-500">Điểm trung bình</div>
            <div className="text-lg font-bold">{agg.avgScore}</div>
          </div>

          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4" /> Đóng
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Users className="w-5 h-5" /> Học sinh ({members.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="border rounded p-3 bg-gray-50">
                <div className="font-semibold">{m.profiles?.full_name || m.profiles?.email}</div>
                <div className="text-sm text-gray-600">{m.profiles?.email}</div>
                <div className="text-xs text-gray-500 mt-1">Vai trò: {m.role}</div>
                <div className="text-xs text-gray-500">Tham gia: {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "-"}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5" /> Điểm (class_scores)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classScores.length === 0 && <div className="text-sm text-gray-600">Chưa có dữ liệu điểm cho lớp này.</div>}
            {classScores.map((s: any) => (
              <div key={s.game_id} className="border rounded p-4 bg-white">
                <div className="font-semibold">{s.game?.title || s.game_id}</div>
                <div className="text-sm text-gray-600">Thể loại: {s.game?.category || "-"}</div>
                <div className="mt-2">
                  <div className="text-sm">Max: <b>{s.max_score ?? 0}</b></div>
                  <div className="text-sm">Avg: <b>{s.avg_score ?? 0}</b></div>
                  <div className="text-sm text-gray-500">Cập nhật: {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "-"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Kết quả chi tiết</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Học sinh</th>
                  <th className="p-2 text-left">Bài kiểm tra</th>
                  <th className="p-2 text-left">Điểm</th>
                  <th className="p-2 text-left">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">
                      {members.find((m) => m.user_id === r.user_id)?.profiles?.full_name ||
                        members.find((m) => m.user_id === r.user_id)?.profiles?.email ||
                        r.user_id}
                    </td>
                    <td className="p-2">{r.quizzes?.title || r.quiz_id}</td>
                    <td className="p-2 font-bold">{r.score}</td>
                    <td className="p-2">{r.completed_at ? new Date(r.completed_at).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
