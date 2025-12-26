import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentDashboard } from "@/components/student/dashboard"
import { TeacherDashboard } from "@/components/teacher/dashboard"
import { AdminDashboard } from "@/components/admin/dashboard" // 👈 thêm dòng này
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 🔐 Lấy thông tin user hiện tại
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // 🧠 Lấy role từ bảng profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single()

  // Nếu chưa có profile → quay lại login
  if (!profile) {
    redirect("/auth/login")
  }

  // 🧭 Điều hướng theo vai trò
  switch (profile.role) {
    case "admin":
      return <AdminDashboard user={data.user} profile={profile} /> // 👈 hiển thị giao diện admin
    case "teacher":
      return <TeacherDashboard user={data.user} profile={profile} />
    case "student":
    default:
      return <StudentDashboard user={data.user} profile={profile} />
  }
}
