"use client"

import { useMemo } from "react"
import type { Tile } from "./logic/map-generator"

interface BoardMapProps {
  tiles: Tile[]
  playerPosition: number
  onTileClick?: (tileId: number) => void
}

export function BoardMap({ tiles, playerPosition, onTileClick }: BoardMapProps) {
  const tileElements = useMemo(() => {
    return tiles.map((tile) => {
      const isActive = tile.id === playerPosition
      const tileEmojis: Record<string, string> = {
        normal: "🟢",
        star: "⭐",
        treasure: "🎁",
        achievement: "🏆",
        boss: "👑",
      }

      return (
        <div
          key={tile.id}
          className={`absolute flex items-center justify-center transition-all duration-300 ${
            isActive ? "z-20 scale-125" : "z-10 scale-100"
          } hover:scale-110 cursor-pointer`}
          style={{
            left: `${tile.position[0]}%`,
            top: `${tile.position[1]}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {isActive && (
            <div className="absolute w-16 h-16 bg-yellow-300 rounded-full blur-xl opacity-50 animate-pulse" />
          )}
          <div
            className={`relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-white shadow-lg transition-all ${
              isActive ? "bg-yellow-200 scale-125" : "bg-white"
            }`}
          >
            <span className={`text-3xl ${isActive ? "drop-shadow-lg" : ""}`}>{tileEmojis[tile.type]}</span>
          </div>
        </div>
      )
    })
  }, [tiles, playerPosition])

  return (
    <div className="w-full bg-gradient-to-br from-emerald-200 via-cyan-100 to-sky-200 rounded-xl p-8 border-4 border-emerald-400 shadow-xl relative overflow-hidden aspect-video">
      <div className="absolute top-3 right-6 text-4xl opacity-40">🌳</div>
      <div className="absolute bottom-3 left-6 text-4xl opacity-40">🏰</div>
      <div className="absolute top-1/2 right-4 text-5xl opacity-20">☁️</div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
        {tiles.map((tile, index) => {
          if (index >= tiles.length - 1) return null
          const nextTile = tiles[index + 1]
          return (
            <line
              key={`path-${index}`}
              x1={`${tile.position[0]}%`}
              y1={`${tile.position[1]}%`}
              x2={`${nextTile.position[0]}%`}
              y2={`${nextTile.position[1]}%`}
              stroke="#4B5563"
              strokeWidth="8"
              strokeDasharray="10,5"
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {/* Tiles container */}
      <div className="relative w-full h-full">{tileElements}</div>
    </div>
  )
}
