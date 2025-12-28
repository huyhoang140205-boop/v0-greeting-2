"use client"
import type { Tile } from "./logic/map-generator"

interface BoardMapProps {
  tiles: Tile[]
  playerPosition: number
  onTileClick?: (tileId: number) => void
}

export function BoardMap({ tiles, playerPosition }: BoardMapProps) {
  const tileEmojis: Record<string, string> = {
    normal: "🟢",
    star: "⭐",
    treasure: "🎁",
    achievement: "🏆",
    boss: "👑",
  }

  const tileColors: Record<string, string> = {
    normal: "bg-gradient-to-b from-green-300 to-green-500",
    star: "bg-gradient-to-b from-yellow-300 to-yellow-500",
    treasure: "bg-gradient-to-b from-orange-300 to-orange-500",
    achievement: "bg-gradient-to-b from-purple-300 to-purple-500",
    boss: "bg-gradient-to-b from-red-300 to-red-500",
  }

  return (
    <div className="w-full bg-gradient-to-br from-emerald-200 via-cyan-100 to-sky-200 rounded-xl p-6 border-4 border-emerald-400 shadow-xl">
      <div className="grid grid-cols-5 gap-3 auto-rows-fr">
        {tiles.map((tile) => {
          const isCurrentPosition = tile.id === playerPosition

          return (
            <div
              key={tile.id}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl border-3 border-white shadow-lg
                transition-all duration-300 cursor-pointer relative overflow-hidden
                ${tileColors[tile.type]}
                ${isCurrentPosition ? "ring-4 ring-yellow-300 scale-110 shadow-2xl" : "hover:scale-105"}
              `}
            >
              <div className="absolute top-1 left-1 text-xs font-bold bg-white bg-opacity-70 rounded px-1.5 py-0.5 text-gray-800">
                {tile.id}
              </div>

              <div className="text-3xl mb-1">{tileEmojis[tile.type]}</div>

              {isCurrentPosition && (
                <>
                  <div className="absolute inset-0 bg-yellow-300 opacity-20 rounded-xl blur-sm" />
                  <div className="text-lg font-bold text-white drop-shadow-lg">▶</div>
                </>
              )}

              <div className="text-xs font-bold text-white drop-shadow-md text-center mt-1 line-clamp-1">
                {tile.type === "normal"
                  ? "Thường"
                  : tile.type === "star"
                    ? "Sao"
                    : tile.type === "treasure"
                      ? "Rương"
                      : tile.type === "achievement"
                        ? "Thành Tích"
                        : "Boss"}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t-2 border-emerald-400 flex flex-wrap gap-4 justify-center text-sm font-bold">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-b from-green-300 to-green-500 border border-white">🟢</div>
          <span>Thường</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-b from-yellow-300 to-yellow-500 border border-white">⭐</div>
          <span>Sao</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-b from-orange-300 to-orange-500 border border-white">🎁</div>
          <span>Rương</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-b from-purple-300 to-purple-500 border border-white">🏆</div>
          <span>Thành Tích</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-b from-red-300 to-red-500 border border-white">👑</div>
          <span>Boss</span>
        </div>
      </div>
    </div>
  )
}
