"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  role: "teacher" | "student"
  onSuccess: () => void
}

const DEFAULT_CLASSES: Record<string, string[]> = {
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

export function CreateClassForm({ role, onSuccess }: Props) {
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [joined, setJoined] = useState<string[]>([])
  const [expandedAge, setExpandedAge] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)

  const [students, setStudents] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  /* ================= INIT ================= */
  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setLoading(true)

    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    setUser(data.user)

    const { data: classesData } = await supabase
      .from("classes")
      .select("*")

    setAllClasses(classesData || [])

    const { data: memberData } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", data.user.id)

    setJoined(memberData?.map((m) => m.class_id) || [])
    setLoading(false)
  }

  /* ================= JOIN CLASS ================= */
  const handleJoinClass = async (classId: string) => {
    if (!user) return

    await supabase.from("class_members").insert({
      class_id: classId,
      user_id: user.id,
      role,
      joined_at: new Date().toISOString(),
    })

    setJoined((prev) => [...prev, classId])
  }

  /* ================= CREATE CLASS ================= */
  const handleCreateClass = async () => {
    if (!newName.trim() || !user) return
    setCreating(true)

    await supabase.from("classes").insert({
      name: newName,
      description: newDescription,
      teacher_id: user.id,
      created_at: new Date().toISOString(),
    })

    setNewName("")
    setNewDescription("")
    setShowCreateForm(false)
    setCreating(false)

    onSuccess()
    init()
  }

  /* ================= CLASS DETAIL ================= */
  const openClassDetail = async (cls: any) => {
    setSelectedClass(cls)

    /* ===== STUDENTS ===== */
    const { data: members } = await supabase
      .from("class_members")
      .select("user_id")
      .eq("class_id", cls.id)
      .eq("role", "student")

    const studentIds = members?.map((m) => m.user_id) || []

    const { data: studentsData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds)

    setStudents(studentsData || [])

    /* ===== QUIZZES OF THIS CLASS ===== */
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("class_id", cls.id)

    const quizIds = quizzes?.map((q) => q.id) || []

    if (quizIds.length === 0) {
      setResults([])
      return
    }

    /* ===== RESULTS (ĐÚNG LỚP) ===== */
    const { data: resultsData } = await supabase
      .from("results")
      .select(`
        id,
        user_id,
        quiz_id,
        score,
        total_questions,
        completed_at
      `)
      .in("user_id", studentIds)
      .in("quiz_id", quizIds)
      .order("completed_at", { ascending: false })

    const quizMap = Object.fromEntries(
      quizzes!.map((q) => [q.id, q.title])
    )

    const normalizedResults =
      resultsData?.map((r) => ({
        ...r,
        quiz_title: quizMap[r.quiz_id],
      })) || []

    setResults(normalizedResults)
  }

  if (loading) return <p>⏳ Đang tải...</p>

  const defaultIds = Object.values(DEFAULT_CLASSES).flat()
  const defaultClasses = allClasses.filter((c) =>
    defaultIds.includes(c.id)
  )

  const extraClasses =
    role === "teacher" && user
      ? allClasses.filter(
          (c) =>
            !defaultIds.includes(c.id) &&
            c.teacher_id === user.id
        )
      : []

  return (
    <div className="space-y-8">
      {/* ================= CLASS DETAIL ================= */}
      {selectedClass && (
        <Card className="border-2 border-indigo-400 bg-indigo-50">
          <CardHeader>
            <CardTitle>{selectedClass.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p>{selectedClass.description}</p>

            <h3 className="text-lg font-bold">👩‍🎓 Học sinh</h3>

            {students.map((s) => {
              const studentResults = results.filter(
                (r) => r.user_id === s.id
              )

              return (
                <div
                  key={s.id}
                  className="border rounded-xl bg-white p-4 space-y-3"
                >
                  <div>
                    <p className="font-semibold text-lg">
                      {s.full_name || s.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {studentResults.length} bài đã làm
                    </p>
                  </div>

                  {studentResults.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Chưa làm bài nào
                    </p>
                  )}

                  {studentResults.map((r) => (
                    <div
                      key={r.id}
                      className="flex justify-between items-center border-b py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {r.quiz_title}
                        </p>
                        <p className="text-gray-500">
                          {r.completed_at
                            ? new Date(
                                r.completed_at
                              ).toLocaleString()
                            : "—"}
                        </p>
                      </div>

                      <span className="font-semibold">
                        {r.score}/{r.total_questions}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}

            <Button
              variant="outline"
              onClick={() => setSelectedClass(null)}
            >
              ⬅ Quay lại
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================= LIST CLASSES ================= */}
      {!selectedClass && (
        <>
          {/* DEFAULT CLASSES */}
          <div className="border-2 border-blue-300 p-6 rounded-xl bg-blue-50">
            <h3 className="text-2xl font-bold mb-6">
              📚 Lớp mặc định
            </h3>

            {Object.entries(DEFAULT_CLASSES).map(([age, ids]) => {
              const ageClasses = defaultClasses.filter((c) =>
                ids.includes(c.id)
              )
              const open = expandedAge === age

              return (
                <div key={age}>
                  <Button
                    variant="outline"
                    className="w-full justify-between mb-2"
                    onClick={() =>
                      setExpandedAge(open ? null : age)
                    }
                  >
                    {age} {open ? "▼" : "▶"}
                  </Button>

                  {open &&
                    ageClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex justify-between items-center p-4 bg-white border rounded-lg mb-2"
                      >
                        <div>
                          <p className="font-bold">
                            {cls.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {cls.description}
                          </p>
                        </div>

                        {joined.includes(cls.id) ? (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              openClassDetail(cls)
                            }
                          >
                            Xem chi tiết
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              handleJoinClass(cls.id)
                            }
                          >
                            Tham gia
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              )
            })}
          </div>

          {/* EXTRA CLASSES */}
          {role === "teacher" && (
            <Card className="border-2 border-green-400 bg-green-50">
              <CardHeader>
                <CardTitle>
                  ✨ Lớp học bổ sung của bạn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {extraClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex justify-between items-center p-4 bg-white border rounded-lg"
                  >
                    <span className="font-semibold">
                      {cls.name}
                    </span>
                    <Button
                      onClick={() =>
                        openClassDetail(cls)
                      }
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                ))}

                {extraClasses.length === 0 && (
                  <p className="text-gray-600 text-sm">
                    Bạn chưa tạo lớp nào.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* CREATE CLASS */}
          {role === "teacher" && (
            <Card className="border-2 border-emerald-400 bg-emerald-50">
              <CardHeader>
                <CardTitle>
                  ➕ Tạo lớp học mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showCreateForm ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      setShowCreateForm(true)
                    }
                  >
                    Tạo lớp
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Tên lớp</Label>
                      <Input
                        value={newName}
                        onChange={(e) =>
                          setNewName(e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label>Mô tả</Label>
                      <Textarea
                        value={newDescription}
                        onChange={(e) =>
                          setNewDescription(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateClass}
                        disabled={creating}
                      >
                        {creating
                          ? "Đang tạo..."
                          : "Tạo"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setShowCreateForm(false)
                        }
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
