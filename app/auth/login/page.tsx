'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1️⃣ Đăng nhập user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Supabase login error:', signInError)
        setError(signInError.message)
        return
      }

      if (!signInData.user) {
        setError('Không tìm thấy người dùng. Vui lòng thử lại.')
        return
      }

      const userId = signInData.user.id

      // 2️⃣ Lấy thông tin profile từ bảng profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn('Không lấy được profile:', profileError)
        // Nếu muốn, vẫn có thể cho login nhưng role sẽ mặc định
      }

      console.log('Login success:', { user: signInData.user, profile: profileData })

      // 3️⃣ Lưu role vào localStorage (hoặc state global) nếu cần
      if (profileData?.role) {
        localStorage.setItem('role', profileData.role)
        localStorage.setItem('full_name', profileData.full_name)
      }

      // 4️⃣ Chuyển hướng
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err?.message || 'Đã xảy ra lỗi không xác định')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold text-gray-900">Chào Mừng Trở Lại</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Đăng nhập để tiếp tục hành trình học tập
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Địa Chỉ Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hocsinh@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mật Khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link href="/auth/signup" className="font-medium text-yellow-600 hover:text-yellow-500">
                  Đăng ký tại đây
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
