"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { images } from "./images" // nếu bạn dùng file riêng
import { clickSound } from "./sounds" // nếu bạn dùng file riêng

interface ClassItem {
  id: string
  name: string
  description: string
  teacher_id: string
  ageGroup?: string
  isDefault?: boolean
}

interface Props {
  supabase: any
  userId: string
}

export default function JoinClass({ supabase, userId }: Props) {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [joined, setJoined] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAge, setExpandedAge] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const defaultAges = ["3 tuổi", "4 tuổi", "5 tuổi"]

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    setLoading(true)
    // Lấy tất cả lớp
    const { data: cls } = await supabase.from("classes").select("*")
    // Lấy các lớp mà user đã tham gia
    const { data: mem } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", userId)

    // Gán nhóm tuổi nếu là lớp mặc định
    const markedClasses = (cls || []).map((c: any) => {
      let ageGroup: string | undefined
      for (const age of defaultAges) {
        if (c.name.startsWith(age)) {
          ageGroup = age
          break
        }
      }
      return { ...c, ageGroup, isDefault: !!ageGroup }
    })

    setClasses(markedClasses)
    setJoined(mem?.map((m) => m.class_id) || [])
    setLoading(false)
  }

  const joinClass = async (classId: string) => {
    setJoiningId(classId)
    const { error } = await supabase.from("class_members").insert({
      user_id: userId,
      class_id: classId,
      joined_at: new Date(),
      role: "student" // role học sinh
    })

    if (!error) {
      clickSound()
      await loadClasses()
    }
    setJoiningId(null)
  }

  if (loading) return <p>⏳ Đang tải lớp học...</p>
  if (classes.length === 0) return <p>📭 Chưa có lớp học nào</p>

  return (
    <div className="space-y-6">
      {/* Lớp theo nhóm tuổi */}
      <div className="border p-2 rounded-md bg-gray-50">
        <h3 className="font-semibold mb-2">📚 Lớp theo độ tuổi</h3>
        {defaultAges.map(age => {
          const ageClasses = classes.filter(c => c.ageGroup === age)
          return (
            <div key={age} className="mb-2">
              <Button
                variant="outline"
                className="w-full text-left"
                onClick={() => setExpandedAge(expandedAge === age ? null : age)}
              >
                {age}
              </Button>
              {expandedAge === age && (
                <ul className="mt-2 space-y-1">
                  {ageClasses.map(cls => {
                    const isJoined = joined.includes(cls.id)
                    return (
                      <li
                        key={cls.id}
                        className="flex justify-between items-center p-2 border rounded bg-white"
                      >
                        <span>{cls.name} - {cls.description}</span>
                        {isJoined ? (
                          <Badge className="bg-green-200 text-green-800">✅ Đã tham gia</Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={joiningId === cls.id}
                            onClick={() => joinClass(cls.id)}
                          >
                            {joiningId === cls.id ? "⏳ Đang vào..." : "➕ Tham gia"}
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Lớp bổ sung */}
      <div className="border p-2 rounded-md bg-white">
        <h3 className="font-semibold mb-2">🎯 Lớp bổ sung</h3>
        <ul className="space-y-1">
          {classes.filter(c => !c.isDefault).map(cls => {
            const isJoined = joined.includes(cls.id)
            return (
              <li
                key={cls.id}
                className="flex justify-between items-center p-2 border rounded bg-gray-50"
              >
                <span>{cls.name} - {cls.description}</span>
                {isJoined ? (
                  <Badge className="bg-green-200 text-green-800">✅ Đã tham gia</Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={joiningId === cls.id}
                    onClick={() => joinClass(cls.id)}
                  >
                    {joiningId === cls.id ? "⏳ Đang vào..." : "➕ Tham gia"}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
