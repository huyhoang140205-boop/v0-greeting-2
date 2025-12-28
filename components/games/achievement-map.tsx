"use client"

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  unlocked: boolean
  condition: string
}

interface AchievementMapProps {
  achievements: Achievement[]
}

export function AchievementMap({ achievements }: AchievementMapProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold text-purple-900">🏆 Thành Tựu</h3>
      <div className="grid grid-cols-3 gap-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 border-3 border-purple-300">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`text-center p-3 rounded-lg border-2 transition-all ${
              achievement.unlocked
                ? "bg-yellow-200 border-yellow-400 shadow-md"
                : "bg-gray-200 border-gray-400 opacity-50"
            }`}
            title={achievement.description}
          >
            <div className="text-3xl">{achievement.emoji}</div>
            <p className="text-xs font-bold text-gray-900">{achievement.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
