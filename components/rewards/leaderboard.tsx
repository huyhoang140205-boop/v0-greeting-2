"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Crown, Star, TrendingUp } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface LeaderboardEntry {
  id: string
  full_name: string
  email: string
  total_points: number
  level: number
  streak_days: number
  badges: any[]
  rank: number
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      // Get top 10 from leaderboard
      const { data: topUsers, error: topError } = await supabase.from("leaderboard").select("*").limit(10)

      if (topError) throw topError

      // Get current user's position
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userRank, error: userError } = await supabase
          .from("leaderboard")
          .select("*")
          .eq("id", user.id)
          .single()

        if (!userError && userRank) {
          setCurrentUser(userRank)
        }
      }

      setLeaderboard(topUsers || [])
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
      default:
        return "bg-white border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-600">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-600" />
          Bảng xếp hạng
        </h1>
        <p className="text-gray-600">Top học sinh xuất sắc nhất</p>
      </div>

      {/* Current User Position */}
      {currentUser && currentUser.rank > 10 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800">Vị trí của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <span className="text-sm font-bold text-blue-600">#{currentUser.rank}</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">{currentUser.full_name || "Bạn"}</p>
                  <div className="flex items-center space-x-4 text-sm text-blue-600">
                    <span>Level {currentUser.level}</span>
                    <span>{currentUser.total_points} điểm</span>
                    {currentUser.streak_days > 0 && (
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{currentUser.streak_days} ngày</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                {currentUser.badges.slice(0, 3).map((badge, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {badge.type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 10 Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span>Top 10 học sinh</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaderboard.map((entry) => (
            <div key={entry.id} className={`p-4 rounded-lg border ${getRankColor(entry.rank)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10">{getRankIcon(entry.rank)}</div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-yellow-100 text-yellow-700">
                      {entry.full_name?.charAt(0) || entry.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{entry.full_name || entry.email}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Level {entry.level}</span>
                      </span>
                      <span>{entry.total_points} điểm</span>
                      {entry.streak_days > 0 && (
                        <span className="flex items-center space-x-1 text-orange-600">
                          <TrendingUp className="w-3 h-3" />
                          <span>{entry.streak_days} ngày</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {entry.badges.slice(0, 3).map((badge, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {badge.type === "level_up" ? `Lv${badge.level}` : badge.type}
                    </Badge>
                  ))}
                  {entry.badges.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{entry.badges.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu</h3>
              <p className="text-gray-600">Hãy bắt đầu học tập để xuất hiện trên bảng xếp hạng!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
