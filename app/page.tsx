import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Brain, Users, Trophy } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-900">EduCards</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:text-yellow-600">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">Bắt đầu</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6 text-balance">
          Thành thạo mọi môn học với
          <span className="text-yellow-600"> Thẻ học tương tác</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-pretty">
          Tham gia cùng hàng nghìn học sinh và giáo viên sử dụng EduCards để tạo, chia sẻ và học tập với thẻ học kỹ
          thuật số và trò chơi giáo dục.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 text-lg">
              Bắt đầu học miễn phí
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 px-8 py-3 text-lg bg-transparent"
            >
              Đăng nhập
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Mọi thứ bạn cần để xuất sắc</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle className="text-xl">Thẻ học tương tác</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tạo và học tập với những thẻ học được thiết kế đẹp mắt giúp bạn ghi nhớ nhanh hơn.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Trò chơi thông minh</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chơi các trò chơi giáo dục thú vị với hệ thống điểm thưởng và xếp hạng để duy trì động lực học tập.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Công cụ giáo viên</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Công cụ mạnh mẽ cho giáo viên để tạo nội dung, theo dõi tiến độ học sinh và quản lý lớp học.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Theo dõi tiến độ</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Giám sát hành trình học tập của bạn với phân tích chi tiết và huy hiệu thành tích.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-yellow-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Sẵn sàng thay đổi cách học tập của bạn?</h3>
          <p className="text-xl mb-8 opacity-90">
            Tham gia cùng hàng nghìn học sinh và giáo viên đang sử dụng EduCards
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-yellow-600 hover:bg-gray-100 px-8 py-3 text-lg">
              Bắt đầu ngay hôm nay
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="w-6 h-6 text-yellow-500" />
            <span className="text-xl font-bold">EduCards</span>
          </div>
          <p className="text-gray-400">© 2025 EduCards. Trao quyền cho giáo dục thông qua công nghệ.</p>
        </div>
      </footer>
    </div>
  )
}
