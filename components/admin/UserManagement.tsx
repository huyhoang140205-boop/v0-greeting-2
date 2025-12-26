'use client'

import { useEffect, useState } from "react"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newEmail, setNewEmail] = useState("")
  const [newFullName, setNewFullName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("student")
  const [newAvatar, setNewAvatar] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/manage-user")
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Lỗi khi lấy danh sách user")
      }
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newEmail || !newFullName) 
      return alert("Email và Họ tên không được để trống")
    try {
      const res = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          email: newEmail,
          full_name: newFullName,
          role: newRole,
          avatar_url: newAvatar,
          password: newPassword || undefined, // backend sẽ tự tạo nếu không có
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Tạo user thất bại")

      setNewEmail("")
      setNewFullName("")
      setNewPassword("")
      setNewRole("student")
      setNewAvatar("")
      fetchUsers()
      alert("Tạo user thành công! User sẽ nhận email xác nhận.")
    } catch (err: any) {
      alert("Thêm user thất bại: " + err.message)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa user này?")) return
    try {
      const res = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Xóa user thất bại")
      fetchUsers()
    } catch (err: any) {
      alert("Xóa thất bại: " + err.message)
    }
  }

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      const res = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateRole", id, role })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Cập nhật role thất bại")
      fetchUsers()
    } catch (err: any) {
      alert("Cập nhật role thất bại: " + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500 mb-2">Error: {error}</div>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Danh sách người dùng</h2>

      <div className="mb-6 flex gap-2 flex-wrap">
        <input
          type="email"
          placeholder="Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="border px-3 py-1 rounded"
        />
        <input
          type="text"
          placeholder="Họ và tên"
          value={newFullName}
          onChange={(e) => setNewFullName(e.target.value)}
          className="border px-3 py-1 rounded"
        />
        <input
          type="password"
          placeholder="Mật khẩu (tùy chọn)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border px-3 py-1 rounded"
        />
        <input
          type="text"
          placeholder="Avatar URL (tùy chọn)"
          value={newAvatar}
          onChange={(e) => setNewAvatar(e.target.value)}
          className="border px-3 py-1 rounded"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleAddUser}
          className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
        >
          Thêm user
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-1">Avatar</th>
            <th className="border px-3 py-1">Email</th>
            <th className="border px-3 py-1">Họ và Tên</th>
            <th className="border px-3 py-1">Role</th>
            <th className="border px-3 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border px-3 py-1">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
              </td>
              <td className="border px-3 py-1">{user.email}</td>
              <td className="border px-3 py-1">{user.full_name}</td>
              <td className="border px-3 py-1">
                <select
                  value={user.role}
                  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                  className="border px-2 py-1 rounded"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="border px-3 py-1">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
