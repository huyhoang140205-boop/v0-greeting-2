// Generates 40 tiles with different types: normal, star, treasure, achievement, boss

export interface Tile {
  id: number
  type: "normal" | "star" | "treasure" | "achievement" | "boss"
  position: [number, number]
  reward: number
}

export function generateMap(tileCount = 40): Tile[] {
  const tiles: Tile[] = []

  // Create curved path layout
  const positions = generateCurvedPath(tileCount)

  for (let i = 0; i < tileCount; i++) {
    let type: Tile["type"] = "normal"
    let reward = 0

    // Distribute special tiles
    if (i === tileCount - 1) {
      type = "boss" // Final tile
      reward = 50
    } else if (i % 8 === 0 && i > 0) {
      type = "star"
      reward = 10
    } else if (i % 10 === 0 && i > 0) {
      type = "treasure"
      reward = 25
    } else if (i % 12 === 0 && i > 0) {
      type = "achievement"
      reward = 5
    }

    tiles.push({
      id: i,
      type,
      position: positions[i],
      reward,
    })
  }

  return tiles
}

// Generate curved snake-like path
function generateCurvedPath(count: number): [number, number][] {
  const positions: [number, number][] = []
  const rows = Math.ceil(count / 8)

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 8)
    const col = i % 8
    const x = col * 60 + 30
    const y = row * 80 + 40
    positions.push([x, y])
  }

  return positions
}
