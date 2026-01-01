"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2 } from "lucide-react"

// Trò chơi
import { TreasureHuntGame } from "./treasure-hunt-game"
import { EduTreasureQuest } from "./edu-treasure-quest"
import RabbitMathGame from "./RabbitMathGame"
import { SnailMazeAdventure } from "./snail-maze-adventure"
import BoardGameParty from "./board-game-party"
import CanCuToanHoc from "./can-cu-toan-hoc"
import TimesTableDuck from "./times-table-duck"
import MathDuckPlatformer from "./math-duck-platformer"

export function GameHub() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const games = [
    // ⭐ GAME NỔI BẬT
    {
      id: "math-duck-platformer",
      name: "🗺️ Game mê cung",
      description:
        "Vượt qua mê cung để dành chiến thằng nào!",
      icon: () => <span>🗺️</span>,
      component: MathDuckPlatformer,
      featured: true,
      props: {
        gameId: "math-duck-platformer-1",
        onGameComplete: (score: number) => console.log("Math Duck Platformer score:", score),
      },
    },
    {
      id: "rabbit-math",
      name: "🐰 Rabbit Math",
      description: "Giải toán cùng chú thỏ nhí nhảnh.",
      icon: () => <span>🐰</span>,
      component: RabbitMathGame,
    },

    // Các game thường
    {
      id: "can-cu-toan-hoc",
      name: "🏗️ Căn Cứ Toán Học",
      description:
        "Xây dựng căn cứ toán học bằng cách giải các bài toán và biểu thức. Chọn mức độ khó, giải nhanh để kiếm điểm cao! Mua trang trí tuyệt đẹp với điểm kiếm được.",
      icon: () => <span>🏗️</span>,
      component: CanCuToanHoc,
    },
    {
      id: "board-game-party",
      name: "🎲 Board Game Party",
      description:
        "Cuộc phiêu lưu board game kiểu Mario Party! Lăn xúc xắc, di chuyển quanh bản đồ, chơi mini-game, và thu thập sao.",
      icon: () => <span>🎲</span>,
      component: BoardGameParty,
    },
    {
      id: "snail-maze",
      name: "🐌 Ốc Sên Phiêu Lưu",
      description:
        "Giúp ốc sên di chuyển trên bản đồ 5x5 bằng cách trả lời các câu hỏi toán, tiếng Việt, tiếng Anh, khoa học. Thu thập sao và mở rương kho báu!",
      icon: () => <span>🐌</span>,
      component: SnailMazeAdventure,
    },
    {
      id: "edu-treasure-quest",
      name: "🗺️ EduTreasure Quest",
      description:
        "Phiêu lưu tìm kho báu với bản đồ tương tác, chọn nhân vật, và trả lời câu hỏi toán học, tiếng Việt, tiếng Anh, khoa học để di chuyển trên bản đồ!",
      icon: () => <span>🗺️</span>,
      component: EduTreasureQuest,
    },
    {
      id: "treasure-hunt",
      name: "🗺️ Tìm Kho Báu (Cổ Điển)",
      description: "Trả lời câu hỏi toán để tìm kho báu qua 7 mốc!",
      icon: () => <span>🗺️</span>,
      component: TreasureHuntGame,
    },
  ]

  const selected = games.find((g) => g.id === selectedGame)

  // ================== MÀN HÌNH GAME ==================
  if (selected) {
    const GameComponent = selected.component
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedGame(null)}>
          ← Quay lại
        </Button>
        <GameComponent {...(selected.props ?? {})} />
      </div>
    )
  }

  // ================== GAME HUB ==================
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2 text-gray-900">
          <Gamepad2 className="w-8 h-8 text-yellow-600" />🎮 Game Hub
        </h1>
        <p className="text-lg text-gray-600">Chọn một trò chơi để bắt đầu cuộc phiêu lưu! 🚀</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`cursor-pointer transition hover:shadow-2xl hover:scale-105 border-2 ${
              game.featured ? "md:col-span-2" : ""
            }`}
            style={{
              borderColor: game.featured ? "#FCD34D" : "#E5E7EB",
              backgroundImage: game.featured
                ? "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #F59E0B 100%)"
                : "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <game.icon />
                {game.name}
                {game.featured && (
                  <span className="ml-auto text-sm bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full">
                    ⭐ Nổi Bật
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-gray-700 mb-4 font-medium">{game.description}</p>
              <Button
                className={`w-full font-bold py-2 ${
                  game.featured
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                }`}
              >
                🎮 Chơi ngay
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
