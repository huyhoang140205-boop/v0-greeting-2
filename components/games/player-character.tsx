"use client"

interface PlayerCharacterProps {
  avatar: string
  name: string
  score: number
  position: number
}

export function PlayerCharacter({ avatar, name, score, position }: PlayerCharacterProps) {
  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-4 border-3 border-blue-300 shadow-md">
      <img
        src={avatar || "/placeholder.svg"}
        alt={name}
        className="w-16 h-16 rounded-full border-3 border-white shadow-lg object-cover animate-bounce"
      />
      <div className="flex-1">
        <h3 className="text-xl font-bold text-blue-900">{name}</h3>
        <p className="text-lg font-bold text-yellow-600">⭐ Điểm: {score}</p>
        <p className="text-sm text-gray-600">Ô hiện tại: {position}</p>
      </div>
    </div>
  )
}
