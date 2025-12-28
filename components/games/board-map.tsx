"use client"

import type { Tile } from "./logic/map-generator"

interface BoardMapProps {
  tiles: Tile[]
  playerPosition: number
  onTileClick?: (tileId: number) => void
}

export function BoardMap({ tiles, playerPosition, onTileClick }: BoardMapProps) {
  return (
    <div className="w-full h-96 bg-gradient-to-br from-green-100 via-blue-50 to-green-50 rounded-lg p-6 border-4 border-green-300 shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-4 right-4 text-6xl opacity-30">🌳</div>
      <div className="absolute bottom-4 left-4 text-6xl opacity-30">🏠</div>

      {/* Tiles */}
      <div className="relative w-full h-full">
        {tiles.map((tile) => {
          const isActive = tile.id === playerPosition
          const tileEmojis: Record<string, string> = {
            normal: "🟩",
            star: "⭐",
            treasure: "🎁",
            achievement: "🏆",
            boss: "👑",
          }

          return (
            <button
              key={tile.id}
              onClick={() => onTileClick?.(tile.id)}
              className={`absolute flex items-center justify-center transition-all duration-200 ${
                isActive ? "scale-125 z-20" : "scale-100"
              } cursor-pointer hover:scale-110`}
              style={{
                left: `${tile.position[0]}px`,
                top: `${tile.position[1]}px`,
                width: "50px",
                height: "50px",
              }}
              title={`Tile ${tile.id} - ${tile.type}`}
            >
              <span className={`text-3xl drop-shadow-lg ${isActive ? "animate-bounce" : ""}`}>
                {tileEmojis[tile.type]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
