"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Target, Zap, TrendingUp, BookOpen, Brain, Award, Lock, CheckCircle } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: "games" | "quizzes" | "streaks" | "points" | "special"
  requirement: number
  current_progress: number
  unlocked: boolean
  unlocked_at?: string
  points_reward: number
}

const achievementIcons = {
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  trending: TrendingUp,
  book: BookOpen,
  brain: Brain,
  award: Award,
}

const categoryNames = {
  games: "Trò chơi",
  quizzes: "Kiểm tra",
  streaks: "Chuỗi ngày",
  points: "Điểm số",
  special: "Đặc biệt",
}

const categoryColors = {
  games: "bg-blue-50 text-blue-700 border-blue-200",
  quizzes: "bg-green-50 text-green-700 border-green-200",
  streaks: "bg-orange-50 text-orange-700 border-orange-200",
  points: "bg-yellow-50 text-yellow-700 border-yellow-200",
  special: "bg-purple-50 text-purple-700 border-purple-200",
}

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock achievements data - in real app, this would come from the database
    const mockAchievements: Achievement[] = [
      {
        id: "1",
        name: "Người mới bắt đầu",
        description: "Hoàn thành trò chơi đầu tiên",
        icon: "star",
        category: "games",
        requirement: 1,
        current_progress: 1,
        unlocked: true,
        unlocked_at: "2025-01-15",
        points_reward: 10,
      },
      {
        id: "2",
        name: "Người chơi tích cực",
        description: "Chơi 10 trò chơi",
        icon: "brain",
        category: "games",
        requirement: 10,
        current_progress: 7,
        unlocked: false,
        points_reward: 50,
      },
      {
        id: "3",
        name: "Bậc thầy trò chơi",
        description: "Chơi 50 trò chơi",
        icon: "trophy",
        category: "games",
        requirement: 50,
        current_progress: 7,
        unlocked: false,
        points_reward: 200,
      },
      {
        id: "4",
        name: "Học sinh chăm chỉ",
        description: "Hoàn thành 5 bài kiểm tra",
        icon: "book",
        category: "quizzes",
        requirement: 5,
        current_progress: 3,
        unlocked: false,
        points_reward: 30,
      },
      {
        id: "5",
        name: "Chuyên gia kiểm tra",
        description: "Hoàn thành 25 bài kiểm tra",
        icon: "target",
        category: "quizzes",
        requirement: 25,
        current_progress: 3,
        unlocked: false,
        points_reward: 100,
      },
      {
        id: "6",
        name: "Chuỗi 3 ngày",
        description: "Học liên tục 3 ngày",
        icon: "trending",
        category: "streaks",
        requirement: 3,
        current_progress: 1,
        unlocked: false,
        points_reward: 25,
      },
      {
        id: "7",
        name: "Chuỗi 7 ngày",
        description: "Học liên tục 1 tuần",
        icon: "zap",
        category: "streaks",
        requirement: 7,
        current_progress: 1,
        unlocked: false,
        points_reward: 75,
      },
      {
        id: "8",
        name: "Chuỗi 30 ngày",
        description: "Học liên tục 1 tháng",
        icon: "award",
        category: "streaks",
        requirement: 30,
        current_progress: 1,
        unlocked: false,
        points_reward: 300,
      },
      {
        id: "9",
        name: "Người thu thập điểm",
        description: "Đạt 100 điểm",
        icon: "star",
        category: "points",
        requirement: 100,
        current_progress: 45,
        unlocked: false,
        points_reward: 20,
      },
      {
        id: "10",
        name: "Triệu phú điểm",
        description: "Đạt 1000 điểm",
        icon: "trophy",
        category: "points",
        requirement: 1000,
        current_progress: 45,
        unlocked: false,
        points_reward: 100,
      },
    ]

    setAchievements(mockAchievements)
    setLoading(false)
  }, [])

  const filteredAchievements =
    selectedCategory === "all" ? achievements : achievements.filter((a) => a.category === selectedCategory)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalPoints = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points_reward, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-600">Đang tải thành tích...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-600" />
          Thành tích
        </h1>
        <p className="text-gray-600">Mở khóa các thành tích bằng cách học tập chăm chỉ</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{unlockedCount}</div>
            <div className="text-sm text-gray-600">Thành tích đã mở</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{achievements.length}</div>
            <div className="text-sm text-gray-600">Tổng thành tích</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
            <div className="text-sm text-gray-600">Điểm thưởng</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setSelectedCategory("all")}
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          className={selectedCategory === "all" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
        >
          Tất cả
        </Button>
        {Object.entries(categoryNames).map(([key, name]) => (
          <Button
            key={key}
            onClick={() => setSelectedCategory(key)}
            variant={selectedCategory === key ? "default" : "outline"}
            size="sm"
            className={selectedCategory === key ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            {name}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const IconComponent = achievementIcons[achievement.icon as keyof typeof achievementIcons] || Award
          const progress = (achievement.current_progress / achievement.requirement) * 100

          return (
            <Card
              key={achievement.id}
              className={`relative ${achievement.unlocked ? "border-green-200 bg-green-50" : "border-gray-200"}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${achievement.unlocked ? "bg-green-100" : "bg-gray-100"}`}>
                      {achievement.unlocked ? (
                        <IconComponent className="w-6 h-6 text-green-600" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${achievement.unlocked ? "text-green-800" : "text-gray-700"}`}>
                        {achievement.name}
                      </CardTitle>
                      <Badge variant="outline" className={`text-xs mt-1 ${categoryColors[achievement.category]}`}>
                        {categoryNames[achievement.category]}
                      </Badge>
                    </div>
                  </div>
                  {achievement.unlocked && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className={`text-sm ${achievement.unlocked ? "text-green-700" : "text-gray-600"}`}>
                  {achievement.description}
                </p>

                {!achievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tiến độ</span>
                      <span>
                        {achievement.current_progress}/{achievement.requirement}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    +{achievement.points_reward} điểm
                  </Badge>
                  {achievement.unlocked && achievement.unlocked_at && (
                    <span className="text-xs text-green-600">
                      Mở khóa: {new Date(achievement.unlocked_at).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thành tích</h3>
          <p className="text-gray-600">Không tìm thấy thành tích nào trong danh mục này.</p>
        </div>
      )}
    </div>
  )
}
