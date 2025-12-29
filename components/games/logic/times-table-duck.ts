export interface QuestionTile {
  id: number
  question: string
  answer: number
  x: number
  y: number
  completed: boolean
}

export interface GameLevel {
  level: number
  tiles: QuestionTile[]
  maxTable: number
  timeLimit: number
}

export function generateLevel(level: number): GameLevel {
  const maxTable = Math.min(level + 2, 12)
  const tileCount = 4 + level
  const tiles: QuestionTile[] = []

  // Generate multiplication questions in order
  for (let i = 0; i < tileCount; i++) {
    const a = Math.floor(Math.random() * maxTable) + 1
    const b = Math.floor(Math.random() * maxTable) + 1
    tiles.push({
      id: i,
      question: `${a} × ${b}`,
      answer: a * b,
      x: 0,
      y: 0,
      completed: false,
    })
  }

  // Shuffle positions on grid
  const gridSize = Math.ceil(Math.sqrt(tileCount + 2))
  let posIndex = 0
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (posIndex < tiles.length) {
        tiles[posIndex].x = j
        tiles[posIndex].y = i
        posIndex++
      }
    }
  }

  return {
    level,
    tiles,
    maxTable,
    timeLimit: 30 - level,
  }
}

export function checkSequence(tiles: QuestionTile[]): boolean {
  // Check if tiles are completed in order
  for (let i = 0; i < tiles.length; i++) {
    if (!tiles[i].completed) return false
    if (i > 0 && tiles[i - 1].id > tiles[i].id) return false
  }
  return true
}

export function calculateScore(baseScore: number, timeLeft: number, combo: number, difficulty: string): number {
  const diffMultiplier = difficulty === "KHÓ" ? 3 : difficulty === "VỪA" ? 2 : 1
  const timeBonus = Math.max(0, timeLeft * 10)
  const comboBonus = combo * 50

  return (baseScore + timeBonus + comboBonus) * diffMultiplier
}
