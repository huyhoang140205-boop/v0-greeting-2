'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  full_name: string
  role: string
  email: string | null
  created_at: string
  updated_at: string
}

interface ClassInfo {
  id: string
  name: string
}

interface QuizResult {
  id: string
  quiz_id: string
  score: number
  total_questions: number
  completed_at: string
  quiz_title?: string
  class_name?: string
}

interface GamePlay {
  id: string
  game_id: string
  score: number
  played_at: string
  game_title?: string
  class_name?: string
}

interface TeacherClassActivity {
  class: ClassInfo
  quizCount: number
  flashcardCount: number
}

export default function ActiveUser() {
  const supabase = createClient()
  const [users, setUsers] = useState<UserProfile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [studentQuizResults, setStudentQuizResults] = useState<QuizResult[]>([])
  const [studentGamePlays, setStudentGamePlays] = useState<GamePlay[]>([])
  const [teacherActivities, setTeacherActivities] = useState<TeacherClassActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Fetch tất cả users
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from<UserProfile>('profiles')
          .select('id, full_name, role, email, created_at, updated_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers(data ?? [])
      } catch (err) {
        console.error('Lỗi fetch profiles:', err)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchProfiles()
  }, [])

  // Khi chọn user
  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user)
    setActivityLoading(true)
    try {
      if (user.role === 'student') {
        // --- Student ---
        // 1. Lấy các lớp đã tham gia
        const { data: memberData } = await supabase
          .from('class_members')
          .select('class_id')
          .eq('user_id', user.id)
          .eq('role', 'student')

        const classIds = memberData?.map(c => c.class_id) || []
        const { data: classes } = await supabase
          .from('classes')
          .select('id, name')
          .in('id', classIds)

        const classMap = new Map(classes?.map(c => [c.id, c.name]) || [])

        // 2. Lấy quiz đã làm
        const { data: results } = await supabase
          .from('results')
          .select('id, quiz_id, score, total_questions, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })

        // 3. Lấy title và class_name cho quiz
        const quizIds = results?.map(r => r.quiz_id) || []
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id, title, class_id')
          .in('id', quizIds)

        const quizMap = new Map(quizzes?.map(q => [q.id, { title: q.title, class_id: q.class_id }]) || [])

        const enrichedResults = results?.map(r => ({
          ...r,
          quiz_title: quizMap.get(r.quiz_id)?.title,
          class_name: classMap.get(quizMap.get(r.quiz_id)?.class_id || '') || '—',
        })) || []

        setStudentQuizResults(enrichedResults)

        // 4. Lấy game đã chơi
        const { data: gamePlays } = await supabase
          .from('game_plays')
          .select('id, game_id, score, played_at')
          .eq('user_id', user.id)
          .order('played_at', { ascending: false })

        const gameIds = gamePlays?.map(g => g.game_id) || []
        const { data: games } = await supabase
          .from('game')
          .select('id, title, class_id')
          .in('id', gameIds)

        const gameMap = new Map(games?.map(g => [g.id, { title: g.title, class_id: g.class_id }]) || [])

        const enrichedGames = gamePlays?.map(g => ({
          ...g,
          game_title: gameMap.get(g.game_id)?.title,
          class_name: classMap.get(gameMap.get(g.game_id)?.class_id || '') || '—',
        })) || []

        setStudentGamePlays(enrichedGames)
        setTeacherActivities([])
      } else if (user.role === 'teacher') {
        // --- Teacher ---
        // Lấy các lớp do teacher tạo
        const { data: classes } = await supabase
          .from('classes')
          .select('id, name')
          .eq('teacher_id', user.id)

        const classIds = classes?.map(c => c.id) || []

        // Đếm số quiz và flashcard cho từng lớp
        const { data: quizCounts } = await supabase
          .from('quizzes')
          .select('class_id, id')
          .in('class_id', classIds)

        const { data: flashcardCounts } = await supabase
          .from('flashcards')
          .select('class_id, id')
          .in('class_id', classIds)

        const activity = classes?.map(c => ({
          class: c,
          quizCount: quizCounts?.filter(q => q.class_id === c.id).length || 0,
          flashcardCount: flashcardCounts?.filter(f => f.class_id === c.id).length || 0,
        })) || []

        setTeacherActivities(activity)
        setStudentQuizResults([])
        setStudentGamePlays([])
      }
    } catch (err) {
      console.error('Lỗi fetch activity:', err)
      setStudentQuizResults([])
      setStudentGamePlays([])
      setTeacherActivities([])
    } finally {
      setActivityLoading(false)
    }
  }

  if (loading) return <div>Đang tải dữ liệu...</div>
  if (!users || users.length === 0) return <div>Hiện chưa có profile nào.</div>

  return (
    <div className="overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">📜 Danh sách người dùng</h2>

      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2">Email</th>
            <th className="border px-3 py-2">Họ và Tên</th>
            <th className="border px-3 py-2">Role</th>
            <th className="border px-3 py-2">Ngày tạo</th>
            <th className="border px-3 py-2">Cập nhật lần cuối</th>
            <th className="border px-3 py-2">Xem hoạt động</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border px-3 py-2">{user.email ?? '—'}</td>
              <td className="border px-3 py-2">{user.full_name}</td>
              <td className="border px-3 py-2">{user.role}</td>
              <td className="border px-3 py-2">{new Date(user.created_at).toLocaleString()}</td>
              <td className="border px-3 py-2">{new Date(user.updated_at).toLocaleString()}</td>
              <td className="border px-3 py-2">
                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => handleSelectUser(user)}
                >
                  Xem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">📊 Lịch sử hoạt động: {selectedUser.full_name}</h3>

          {activityLoading ? (
            <div>Đang tải hoạt động...</div>
          ) : selectedUser.role === 'student' ? (
            <>
              <h4 className="font-medium mt-2">Lớp đã tham gia</h4>
              <ul className="list-disc ml-6">
                {[...new Set([...studentQuizResults.map(r => r.class_name), ...studentGamePlays.map(g => g.class_name)])].map(name => (
                  <li key={name}>{name}</li>
                ))}
              </ul>

              <h4 className="font-medium mt-2">Quiz đã làm</h4>
              {studentQuizResults.length === 0 ? <p>Chưa có quiz nào.</p> : (
                <table className="w-full border-collapse border border-gray-300 mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2">Quiz</th>
                      <th className="border px-3 py-2">Lớp</th>
                      <th className="border px-3 py-2">Điểm</th>
                      <th className="border px-3 py-2">Tổng câu hỏi</th>
                      <th className="border px-3 py-2">Ngày hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentQuizResults.map(q => (
                      <tr key={q.id}>
                        <td className="border px-3 py-2">{q.quiz_title}</td>
                        <td className="border px-3 py-2">{q.class_name}</td>
                        <td className="border px-3 py-2">{q.score}</td>
                        <td className="border px-3 py-2">{q.total_questions}</td>
                        <td className="border px-3 py-2">{new Date(q.completed_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h4 className="font-medium mt-2">Game đã chơi</h4>
              {studentGamePlays.length === 0 ? <p>Chưa có game nào.</p> : (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2">Game</th>
                      <th className="border px-3 py-2">Lớp</th>
                      <th className="border px-3 py-2">Điểm</th>
                      <th className="border px-3 py-2">Ngày chơi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGamePlays.map(g => (
                      <tr key={g.id}>
                        <td className="border px-3 py-2">{g.game_title}</td>
                        <td className="border px-3 py-2">{g.class_name}</td>
                        <td className="border px-3 py-2">{g.score}</td>
                        <td className="border px-3 py-2">{new Date(g.played_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <>
              <h4 className="font-medium mt-2">Lớp do giáo viên tạo</h4>
              {teacherActivities.length === 0 ? <p>Chưa tạo lớp nào.</p> : (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2">Lớp</th>
                      <th className="border px-3 py-2">Số quiz</th>
                      <th className="border px-3 py-2">Số flashcard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherActivities.map(t => (
                      <tr key={t.class.id}>
                        <td className="border px-3 py-2">{t.class.name}</td>
                        <td className="border px-3 py-2">{t.quizCount}</td>
                        <td className="border px-3 py-2">{t.flashcardCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
