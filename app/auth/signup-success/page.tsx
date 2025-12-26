'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Sau 5 giây tự động chuyển về trang đăng nhập
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold text-green-700 mb-4">🎉 Đăng ký thành công!</h1>
        <p className="text-gray-700 mb-6">
          Cảm ơn bạn đã tham gia! Hãy kiểm tra email của bạn để xác minh tài khoản trước khi đăng nhập.
        </p>

        <Button
          asChild
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg"
        >
          <Link href="/auth/login">Đăng nhập ngay</Link>
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          (Bạn sẽ được chuyển hướng tự động sau 5 giây)
        </p>
      </div>
    </div>
  )
}
