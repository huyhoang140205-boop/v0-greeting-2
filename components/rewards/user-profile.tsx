"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  BookOpen,
  Brain,
  Clock,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface UserProfileData {
  id: string;
  full_name: string;
  role: string;
  points: number;
  updated_at: string;
}

interface ActivityStats {
  total_games_played: number;
  total_quizzes_taken: number;
  total_flashcards_studied: number;
  average_score: number;
  total_study_time: number;
  last_activity: string;
}

export function UserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [activity, setActivity] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return console.error("❌ Không có user:", userError);

      // ✅ Lấy dữ liệu từ bảng profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, points, updated_at")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // ✅ Lấy dữ liệu từ results, game_results, flashcards
      const { data: results } = await supabase
        .from("results")
        .select("score, total_questions, created_at")
        .eq("user_id", user.id);

      const { data: games } = await supabase
        .from("game_results")
        .select("score, max_score, time_taken, created_at")
        .eq("user_id", user.id);

      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("id")
        .eq("created_by", user.id);

      // ✅ Tính toán thống kê
      const totalGames = games?.length || 0;
      const totalQuizzes = results?.length || 0;
      const totalFlashcards = flashcards?.length || 0;

      const avgQuizScore =
        totalQuizzes > 0
          ? results.reduce((sum, r) => sum + (r.score / (r.total_questions || 1)) * 100, 0) /
            totalQuizzes
          : 0;

      const avgGameScore =
        totalGames > 0
          ? games.reduce((sum, g) => sum + (g.score / (g.max_score || 1)) * 100, 0) / totalGames
          : 0;

      const averageScore =
        totalGames + totalQuizzes > 0
          ? (avgQuizScore * totalQuizzes + avgGameScore * totalGames) /
            (totalGames + totalQuizzes)
          : 0;

      const totalStudyTime =
        (games?.reduce((sum, g) => sum + (g.time_taken || 0), 0) || 0) / 60;

      const lastActivity =
        [...(games || []), ...(results || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          ?.created_at || profileData.updated_at;

      setActivity({
        total_games_played: totalGames,
        total_quizzes_taken: totalQuizzes,
        total_flashcards_studied: totalFlashcards,
        average_score: Math.round(averageScore),
        total_study_time: Math.round(totalStudyTime),
        last_activity: lastActivity,
      });
    } catch (err) {
      console.error("❌ Lỗi tải hồ sơ:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy hồ sơ</h3>
        <p className="text-gray-600">Vui lòng đăng nhập để xem hồ sơ của bạn.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <User className="w-8 h-8 text-yellow-600" />
          Hồ sơ cá nhân
        </h1>
        <p className="text-gray-600">
          Theo dõi tiến độ học tập và thành tích của bạn
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ====== PROFILE CARD ====== */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarFallback className="bg-yellow-100 text-yellow-700 text-2xl">
                  {profile.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profile.full_name}</CardTitle>
              <p className="text-gray-600 capitalize">Vai trò: {profile.role}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {profile.points ?? 0}
                </div>
                <div className="text-sm text-gray-600">Tổng điểm</div>
              </div>
            </CardContent>
          </Card>

          {/* ====== BADGES ====== */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Thành tích</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Hệ thống huy hiệu sẽ hiển thị ở đây sau khi có dữ liệu
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ====== ACTIVITY STATS ====== */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Thống kê hoạt động</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatBox
                    icon={<Brain className="text-blue-600" />}
                    value={activity.total_games_played}
                    label="Trò chơi đã chơi"
                    color="bg-blue-50"
                  />
                  <StatBox
                    icon={<BookOpen className="text-green-600" />}
                    value={activity.total_quizzes_taken}
                    label="Bài kiểm tra"
                    color="bg-green-50"
                  />
                  <StatBox
                    icon={<Calendar className="text-pink-600" />}
                    value={new Date(activity.last_activity).toLocaleDateString("vi-VN")}
                    label="Hoạt động cuối"
                    color="bg-pink-50"
                  />
                </div>
              ) : (
                <p className="text-center py-8 text-gray-600">
                  Chưa có dữ liệu hoạt động
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ✅ Component hiển thị chỉ số
function StatBox({
  icon,
  value,
  label,
  color,
}: {
  icon: JSX.Element;
  value: any;
  label: string;
  color: string;
}) {
  return (
    <div className={`text-center p-4 rounded-lg ${color}`}>
      <div className="w-8 h-8 mx-auto mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
