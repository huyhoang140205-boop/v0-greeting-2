'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const AVATARS = [
  '/avarta/doremon.jpg',
  '/avarta/nobita.jpg',
  '/avarta/shizuka.jpg',
  '/avarta/pikachu.jpg',
  '/avarta/chaien.jpg',
  '/avarta/goku.jpg',
]
export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // gọi backend upsert profile
  async function serverUpsertProfile(userId: string) {
    try {
      const res = await fetch('/api/internal/upsert-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email,
          full_name: fullName,
          role,
          avatar_url: avatarUrl, // 👈 gửi avatar
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        return { ok: false, error: text }
      }

      return await res.json()
    } catch (err) {
      return { ok: false, error: 'Failed to upsert profile' }
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      const userId = data?.user?.id
      if (!userId) {
        setError('User ID not found')
        return
      }

      const profileRes = await serverUpsertProfile(userId)
      if (!profileRes.ok) {
        setError(profileRes.error ?? 'Failed to save profile')
        return
      }

      setInfo('Đăng ký thành công. Kiểm tra email để xác thực.')
      router.push('/auth/signup-success')
    } catch (err: any) {
      setError(err.message ?? 'Đã xảy ra lỗi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold">Tham Gia EduCards</CardTitle>
            <CardDescription>Tạo tài khoản để bắt đầu học tập</CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Avatar */}
              <div className="space-y-2">
                <Label>Ảnh đại diện</Label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`rounded-full border-2 p-1 transition ${
                        avatarUrl === url ? 'border-yellow-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={url}
                        alt="avatar"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và Tên</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tôi là</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Học sinh</SelectItem>
                    <SelectItem value="teacher">Giáo viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Xác nhận mật khẩu</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
              )}

              {info && (
                <div className="bg-green-50 text-green-700 p-3 rounded text-sm">{info}</div>
              )}

              <Button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                disabled={isLoading}
              >
                {isLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-yellow-600 font-medium">
                Đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
