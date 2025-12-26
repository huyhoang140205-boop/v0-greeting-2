"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"

// Game Types
type TileType = "normal" | "minigame" | "event" | "star" | "trap"
type GameState = "setup" | "playing" | "minigame" | "results" | "gameover"

interface Tile {
  id: number
  type: TileType
  x: number
  y: number
  icon: string
  description: string
}

interface Player {
  id: number
  name: string
  position: number
  stars: number
  coins: number
  color: string
  emoji: string
}

// Board Generation - 20 tile path
const generateBoard = (): Tile[] => {
  const tiles: Tile[] = [
    { id: 0, type: "normal", x: 150, y: 350, icon: "🏁", description: "Start" },
    { id: 1, type: "event", x: 220, y: 320, icon: "❓", description: "Event" },
    { id: 2, type: "minigame", x: 290, y: 280, icon: "🎮", description: "Mini-Game" },
    { id: 3, type: "normal", x: 350, y: 240, icon: "•", description: "Normal" },
    { id: 4, type: "star", x: 400, y: 200, icon: "⭐", description: "Star" },
    { id: 5, type: "trap", x: 420, y: 140, icon: "⚠️", description: "Trap" },
    { id: 6, type: "minigame", x: 400, y: 80, icon: "🎮", description: "Mini-Game" },
    { id: 7, type: "normal", x: 330, y: 50, icon: "•", description: "Normal" },
    { id: 8, type: "event", x: 250, y: 40, icon: "❓", description: "Event" },
    { id: 9, type: "star", x: 170, y: 60, icon: "⭐", description: "Star" },
    { id: 10, type: "normal", x: 100, y: 100, icon: "•", description: "Normal" },
    { id: 11, type: "minigame", x: 50, y: 160, icon: "🎮", description: "Mini-Game" },
    { id: 12, type: "trap", x: 40, y: 230, icon: "⚠️", description: "Trap" },
    { id: 13, type: "normal", x: 70, y: 280, icon: "•", description: "Normal" },
    { id: 14, type: "event", x: 130, y: 300, icon: "❓", description: "Event" },
    { id: 15, type: "star", x: 190, y: 310, icon: "⭐", description: "Star" },
    { id: 16, type: "minigame", x: 250, y: 330, icon: "🎮", description: "Mini-Game" },
    { id: 17, type: "normal", x: 310, y: 340, icon: "•", description: "Normal" },
    { id: 18, type: "trap", x: 370, y: 335, icon: "⚠️", description: "Trap" },
    { id: 19, type: "normal", x: 430, y: 310, icon: "🏆", description: "Finish" },
  ]
  return tiles
}

// Mini-Game: Math Challenge
const MathGame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const questions = [
    { q: "5 + 3 = ?", options: ["8", "6", "9"], correct: 0, category: "Toán học" },
    { q: "10 - 4 = ?", options: ["6", "8", "5"], correct: 0, category: "Toán học" },
    { q: "3 × 2 = ?", options: ["5", "6", "7"], correct: 1, category: "Toán học" },
    { q: "'Dog' tiếng Việt là gì?", options: ["Mèo", "Chó", "Chim"], correct: 1, category: "Tiếng Anh" },
  ]

  const handleAnswer = (index: number) => {
    if (answered) return

    setAnswered(true)
    if (index === questions[currentQuestion].correct) {
      setScore(score + 25)
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setAnswered(false)
    } else {
      onComplete(
        score +
          (answered &&
          questions[currentQuestion].options[0] ===
            questions[currentQuestion].options[questions[currentQuestion].correct]
            ? 25
            : 0),
      )
    }
  }

  const q = questions[currentQuestion]
  const isCorrect = answered && questions[currentQuestion].correct !== -1

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <h2 className="text-3xl font-bold text-purple-600">Thử Thách Toán Học</h2>
      <div className="text-sm bg-blue-100 px-3 py-1 rounded-full">{q.category}</div>
      <p className="text-2xl font-bold text-center">{q.q}</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {q.options.map((option, index) => (
          <Button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={answered}
            size="lg"
            className={`h-20 text-base transition-all ${
              answered
                ? index === questions[currentQuestion].correct
                  ? "bg-green-500 hover:bg-green-500"
                  : "bg-red-500 hover:bg-red-500"
                : "bg-gradient-to-br from-purple-400 to-pink-400 hover:scale-105"
            } text-white`}
          >
            {option}
          </Button>
        ))}
      </div>
      <p className="text-lg font-semibold">
        Câu {currentQuestion + 1} / {questions.length}
      </p>
      {answered && (
        <Button onClick={handleNext} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
          {currentQuestion < questions.length - 1 ? "Câu tiếp theo" : "Hoàn thành"}
        </Button>
      )}
    </div>
  )
}

// Mini-Game: Memory Match
const MemoryGame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [pairs] = useState([
    { id: 1, value: "cat", icon: "🐱" },
    { id: 2, value: "dog", icon: "🐶" },
    { id: 3, value: "bird", icon: "🐦" },
    { id: 4, value: "fish", icon: "🐠" },
    { id: 5, value: "cat", icon: "🐱" },
    { id: 6, value: "dog", icon: "🐶" },
    { id: 7, value: "bird", icon: "🐦" },
    { id: 8, value: "fish", icon: "🐠" },
  ])

  const [cards, setCards] = useState(pairs.sort(() => Math.random() - 0.5))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return

    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(moves + 1)
      if (cards[newFlipped[0]].value === cards[newFlipped[1]].value) {
        setMatched([...matched, newFlipped[0], newFlipped[1]])
        setFlipped([])
      } else {
        setTimeout(() => setFlipped([]), 1000)
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <h2 className="text-3xl font-bold text-purple-600">Trò Chơi Ghép Cặp</h2>
      <p className="text-lg font-semibold">Lượt: {moves}</p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleFlip(index)}
            className={`w-16 h-16 flex items-center justify-center text-3xl rounded-lg cursor-pointer transition-all transform ${
              flipped.includes(index) || matched.includes(index)
                ? "bg-gradient-to-br from-green-300 to-green-500 scale-95 rotate-0"
                : "bg-gradient-to-br from-blue-400 to-blue-600 hover:scale-110 hover:rotate-3"
            } shadow-lg`}
          >
            {flipped.includes(index) || matched.includes(index) ? card.icon : "?"}
          </div>
        ))}
      </div>
      {matched.length === 8 && (
        <Button
          onClick={() => onComplete(Math.max(0, 100 - moves * 5))}
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Hoàn thành!
        </Button>
      )}
    </div>
  )
}

const BoardCanvas: React.FC<{
  tiles: Tile[]
  players: Player[]
  animatingPlayer: number | null
}> = ({ tiles, players, animatingPlayer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 500, 400)
    bgGradient.addColorStop(0, "#90EE90")
    bgGradient.addColorStop(0.5, "#98FB98")
    bgGradient.addColorStop(1, "#7CFC00")
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, 500, 400)

    const drawTree = (x: number, y: number) => {
      // Trunk
      ctx.fillStyle = "#8B4513"
      ctx.fillRect(x - 3, y, 6, 20)
      // Foliage
      ctx.fillStyle = "#228B22"
      ctx.beginPath()
      ctx.arc(x, y - 5, 12, 0, Math.PI * 2)
      ctx.fill()
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)"
      ctx.beginPath()
      ctx.ellipse(x, y + 25, 15, 5, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawBush = (x: number, y: number) => {
      ctx.fillStyle = "#228B22"
      ctx.beginPath()
      ctx.ellipse(x, y, 8, 6, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "rgba(0,0,0,0.15)"
      ctx.beginPath()
      ctx.ellipse(x, y + 10, 10, 4, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawMushroom = (x: number, y: number) => {
      ctx.fillStyle = "#FF6347"
      ctx.beginPath()
      ctx.arc(x, y - 3, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#D2691E"
      ctx.fillRect(x - 2, y, 4, 6)
      ctx.fillStyle = "rgba(0,0,0,0.2)"
      ctx.beginPath()
      ctx.ellipse(x, y + 8, 8, 3, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawLamp = (x: number, y: number) => {
      ctx.fillStyle = "#FFD700"
      ctx.beginPath()
      ctx.arc(x, y - 8, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#8B7355"
      ctx.fillRect(x - 1, y - 8, 2, 10)
      ctx.fillStyle = "rgba(255,215,0,0.3)"
      ctx.beginPath()
      ctx.arc(x, y - 8, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "rgba(0,0,0,0.1)"
      ctx.beginPath()
      ctx.ellipse(x, y + 5, 6, 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw decorative elements scattered around
    drawTree(80, 150)
    drawTree(420, 120)
    drawBush(200, 100)
    drawBush(350, 280)
    drawMushroom(120, 200)
    drawMushroom(380, 250)
    drawLamp(150, 50)
    drawLamp(400, 350)

    ctx.strokeStyle = "#D2B48C"
    ctx.lineWidth = 25
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Draw path as a flowing line through tile positions
    ctx.beginPath()
    ctx.moveTo(tiles[0].x, tiles[0].y)
    for (let i = 1; i < tiles.length; i++) {
      const prevTile = tiles[i - 1]
      const currTile = tiles[i]
      const cpx = (prevTile.x + currTile.x) / 2
      const cpy = (prevTile.y + currTile.y) / 2
      ctx.quadraticCurveTo(prevTile.x, prevTile.y, cpx, cpy)
    }
    ctx.stroke()

    tiles.forEach((tile, index) => {
      const isAnimating = animatingPlayer !== null && players[animatingPlayer].position === index

      // Tile color based on type
      let tileColor = "#90EE90"
      switch (tile.type) {
        case "star":
          tileColor = "#FFD700"
          break
        case "minigame":
          tileColor = "#DDA0DD"
          break
        case "event":
          tileColor = "#87CEEB"
          break
        case "trap":
          tileColor = "#FF6B6B"
          break
        default:
          tileColor = "#B0E0E6"
      }

      // Glow effect for animated tiles
      if (isAnimating) {
        ctx.shadowColor = tileColor
        ctx.shadowBlur = 20
      } else {
        ctx.shadowColor = "rgba(0,0,0,0)"
        ctx.shadowBlur = 0
      }

      // Draw tile circle
      ctx.fillStyle = tileColor
      ctx.strokeStyle = "#FFFFFF"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(tile.x, tile.y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw icon
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#000000"
      ctx.fillText(tile.icon, tile.x, tile.y)

      // Draw soft shadow under tile
      ctx.shadowColor = "rgba(0,0,0,0)"
      ctx.fillStyle = "rgba(0,0,0,0.15)"
      ctx.beginPath()
      ctx.ellipse(tile.x, tile.y + 25, 20, 6, 0, 0, Math.PI * 2)
      ctx.fill()
    })

    players.forEach((player, playerIndex) => {
      const tile = tiles[player.position]
      if (!tile) return

      const isCurrent = animatingPlayer === playerIndex
      const bounceOffset = isCurrent ? Math.sin(Date.now() / 100) * 4 : 0

      // Draw player character (chibi style)
      const x = tile.x
      const y = tile.y - bounceOffset - 30

      // Head
      ctx.fillStyle = player.color
      ctx.beginPath()
      ctx.arc(x, y - 5, 8, 0, Math.PI * 2)
      ctx.fill()

      // Body
      ctx.fillStyle = player.color
      ctx.fillRect(x - 6, y + 3, 12, 10)

      // Eyes
      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.arc(x - 3, y - 6, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + 3, y - 6, 2, 0, Math.PI * 2)
      ctx.fill()

      // Smile
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y - 4, 3, 0, Math.PI, true)
      ctx.stroke()

      // Emoji
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(player.emoji, x, y - 5)

      // Player shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)"
      ctx.beginPath()
      ctx.ellipse(x, y + 18, 10, 4, 0, 0, Math.PI * 2)
      ctx.fill()
    })

    // Reset shadow
    ctx.shadowColor = "rgba(0,0,0,0)"
  }, [tiles, players, animatingPlayer])

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={400}
      className="border-4 border-gray-400 rounded-lg bg-white shadow-lg w-full max-w-2xl mx-auto"
    />
  )
}

// Main Board Game Component
export default function BoardGameParty() {
  const [gameState, setGameState] = useState<GameState>("setup")
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Bạn", position: 0, stars: 0, coins: 0, color: "#FF6B9D", emoji: "😀" },
    { id: 2, name: "AI", position: 0, stars: 0, coins: 0, color: "#00BFFF", emoji: "🤖" },
  ])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [board] = useState<Tile[]>(generateBoard())
  const [selectedMinigame, setSelectedMinigame] = useState<string | null>(null)
  const [movesRemaining, setMovesRemaining] = useState(0)
  const [animatingPlayer, setAnimatingPlayer] = useState<number | null>(null)

  const rollDice = () => {
    const result = Math.floor(Math.random() * 6) + 1
    setDiceResult(result)
    setMovesRemaining(result)
    setAnimatingPlayer(currentPlayer)
  }

  const movePlayer = () => {
    if (movesRemaining === 0) return

    setAnimatingPlayer(currentPlayer)
    setTimeout(() => {
      const newPlayers = [...players]
      const newPosition = Math.min(newPlayers[currentPlayer].position + 1, board.length - 1)
      newPlayers[currentPlayer].position = newPosition
      setPlayers(newPlayers)
      setMovesRemaining(movesRemaining - 1)

      const currentTile = board[newPosition]
      if (movesRemaining === 1) {
        handleTileEvent(currentTile, currentPlayer)
      }
      setAnimatingPlayer(null)
    }, 500)
  }

  const handleTileEvent = (tile: Tile, playerIndex: number) => {
    switch (tile.type) {
      case "star":
        const newPlayers1 = [...players]
        newPlayers1[playerIndex].stars += 1
        setPlayers(newPlayers1)
        break
      case "minigame":
        setSelectedMinigame("math")
        setGameState("minigame")
        return
      case "trap":
        const newPlayers2 = [...players]
        newPlayers2[playerIndex].position = Math.max(0, newPlayers2[playerIndex].position - 2)
        setPlayers(newPlayers2)
        break
      case "event":
        const newPlayers3 = [...players]
        newPlayers3[playerIndex].coins += 5
        setPlayers(newPlayers3)
        break
    }

    if (movesRemaining === 0) {
      nextTurn()
    }
  }

  const nextTurn = () => {
    setCurrentPlayer((currentPlayer + 1) % players.length)
    setDiceResult(null)
    setMovesRemaining(0)

    if (players.some((p) => p.position >= board.length - 1)) {
      setGameState("gameover")
    }
  }

  const handleMinigameComplete = (score: number) => {
    const newPlayers = [...players]
    newPlayers[currentPlayer].coins += Math.round(score / 10)
    setPlayers(newPlayers)
    setGameState("playing")
    setSelectedMinigame(null)
    nextTurn()
  }

  // Render Mini-Game
  if (gameState === "minigame" && selectedMinigame) {
    return (
      <div className="w-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8">
        {selectedMinigame === "math" && <MathGame onComplete={handleMinigameComplete} />}
        {selectedMinigame === "memory" && <MemoryGame onComplete={handleMinigameComplete} />}
      </div>
    )
  }

  // Render Setup
  if (gameState === "setup") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
        <h1 className="text-4xl font-bold text-orange-900">Board Game Party</h1>
        <p className="text-xl text-orange-800">Lăn xúc xắc, di chuyển, chơi mini-game và thu thập sao!</p>
        <Button
          onClick={() => setGameState("playing")}
          size="lg"
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105 text-white px-8 py-4 text-lg"
        >
          Bắt đầu trò chơi
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 space-y-6">
      {/* Player Stats */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              index === currentPlayer
                ? "border-yellow-400 bg-yellow-100 shadow-lg scale-105"
                : "border-gray-300 bg-white"
            }`}
          >
            <p className="text-lg font-bold">
              {player.emoji} {player.name}
            </p>
            <p className="text-sm">
              Sao: {player.stars} | Coins: {player.coins}
            </p>
          </div>
        ))}
      </div>

      {/* Board */}
      <BoardCanvas tiles={board} players={players} animatingPlayer={animatingPlayer} />

      {/* Game Controls */}
      <div className="flex flex-col gap-4">
        {diceResult === null ? (
          <Button
            onClick={rollDice}
            size="lg"
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:scale-105 text-white px-8 py-4 text-lg font-bold"
          >
            🎲 Lăn Xúc Xắc
          </Button>
        ) : (
          <>
            <div className="text-center p-4 bg-yellow-200 rounded-lg border-2 border-yellow-400">
              <p className="text-3xl font-bold">{diceResult}</p>
              <p className="text-lg">Còn lại: {movesRemaining}</p>
            </div>
            <Button
              onClick={movePlayer}
              disabled={movesRemaining === 0}
              size="lg"
              className="bg-gradient-to-r from-blue-400 to-purple-500 hover:scale-105 text-white px-8 py-4 text-lg font-bold disabled:opacity-50"
            >
              {movesRemaining > 0 ? `Di Chuyển (${movesRemaining})` : "Kết Thúc Lượt"}
            </Button>
            {movesRemaining === 0 && (
              <Button onClick={nextTurn} size="lg" className="bg-gray-500 hover:bg-gray-600 text-white font-bold">
                Người Chơi Tiếp Theo
              </Button>
            )}
          </>
        )}
      </div>

      {/* Game Over Screen */}
      {gameState === "gameover" && (
        <div className="p-6 bg-gradient-to-br from-green-200 to-blue-200 rounded-lg text-center border-4 border-green-400">
          <h2 className="text-3xl font-bold mb-4 text-green-900">Cuộc chơi kết thúc!</h2>
          <p className="text-xl mb-4">
            Người chiến thắng: {players.reduce((prev, current) => (prev.stars > current.stars ? prev : current)).name}
          </p>
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold"
          >
            Chơi Lại
          </Button>
        </div>
      )}
    </div>
  )
}
