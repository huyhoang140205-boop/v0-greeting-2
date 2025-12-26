"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Volume2, VolumeX } from "lucide-react"

// Question bank
const QUESTIONS = [
  // Math questions
  { id: 1, type: "MCQ", subject: "Toán", question: "1 + 2 = ?", options: ["2", "3", "4", "5"], answer: "3" },
  { id: 2, type: "MCQ", subject: "Toán", question: "5 - 2 = ?", options: ["2", "3", "4", "5"], answer: "3" },
  { id: 3, type: "MCQ", subject: "Toán", question: "3 × 2 = ?", options: ["5", "6", "7", "8"], answer: "6" },
  { id: 4, type: "MCQ", subject: "Toán", question: "10 ÷ 2 = ?", options: ["3", "4", "5", "6"], answer: "5" },
  { id: 5, type: "MCQ", subject: "Toán", question: "2 + 3 + 1 = ?", options: ["5", "6", "7", "8"], answer: "6" },

  // Vietnamese questions
  {
    id: 6,
    type: "MCQ",
    subject: "Tiếng Việt",
    question: "Con vật nào thích ăn cà rốt?",
    options: ["🐶", "🐰", "🐱", "🐭"],
    answer: "🐰",
  },
  {
    id: 7,
    type: "Fill",
    subject: "Tiếng Việt",
    question: "Điền từ: Con ___ đang chạy nhanh",
    answer: "mèo",
    hint: "động vật có lông",
  },
  {
    id: 8,
    type: "MCQ",
    subject: "Tiếng Việt",
    question: "Từ nào đúng chính tả?",
    options: ["khouối", "khôi", "khoai", "khuôi"],
    answer: "khoai",
  },

  // English questions
  {
    id: 9,
    type: "MCQ",
    subject: "Tiếng Anh",
    question: "Apple in Vietnamese is?",
    options: ["chuối", "táo", "cam", "dứa"],
    answer: "táo",
  },
  {
    id: 10,
    type: "MCQ",
    subject: "Tiếng Anh",
    question: "What color is the sky?",
    options: ["đỏ", "xanh", "vàng", "tím"],
    answer: "xanh",
  },

  // Science questions
  {
    id: 11,
    type: "MCQ",
    subject: "Khoa Học",
    question: "Cây cần gì để sống?",
    options: ["nước", "ánh sáng", "đất", "tất cả"],
    answer: "tất cả",
  },
  {
    id: 12,
    type: "MCQ",
    subject: "Khoa Học",
    question: "Con ốc sên ăn gì?",
    options: ["thịt", "rau xanh", "hạt", "cá"],
    answer: "rau xanh",
  },
]

interface GameState {
  playerPosition: { row: number; col: number }
  completedCells: Array<{ row: number; col: number; questionId: number }>
  currentChallenge: (typeof QUESTIONS)[0] | null
  starsCollected: number
  treasuresCollected: number
  playerAvatar: string
  gameStarted: boolean
  usedQuestionIds: Set<number>
}

interface MapCell {
  row: number
  col: number
  state: "locked" | "current" | "completed" | "treasure"
  questionId?: number
}

const TerrainDecoration = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
    {/* Mountains - top left */}
    <polygon points="20,150 50,80 80,150" fill="#8B7355" opacity="0.6" />
    <polygon points="60,150 90,70 120,150" fill="#A0826D" opacity="0.6" />

    {/* Trees scattered */}
    <circle cx="320" cy="100" r="25" fill="#2D5016" opacity="0.7" />
    <rect x="315" y="120" width="10" height="30" fill="#654321" opacity="0.7" />

    <circle cx="280" cy="320" r="20" fill="#2D5016" opacity="0.6" />
    <rect x="277" y="335" width="6" height="20" fill="#654321" opacity="0.6" />

    {/* River - winding blue */}
    <path d="M 150 20 Q 180 80 160 140 Q 140 200 180 260" stroke="#4A90E2" strokeWidth="20" fill="none" opacity="0.5" />

    {/* Flowers */}
    <circle cx="100" cy="280" r="6" fill="#FF1493" opacity="0.7" />
    <circle cx="120" cy="300" r="5" fill="#FFB6C1" opacity="0.6" />
    <circle cx="280" cy="200" r="5" fill="#FF69B4" opacity="0.6" />

    {/* Camping tent */}
    <polygon points="340,300 360,260 380,300" fill="#FF6B6B" opacity="0.7" />
    <line x1="360" y1="260" x2="360" y2="300" stroke="#333" strokeWidth="1" />

    {/* Compass rose - center decoration */}
    <g opacity="0.3">
      <line x1="200" y1="150" x2="200" y2="50" stroke="#333" strokeWidth="2" />
      <text x="200" y="40" textAnchor="middle" fontSize="12" fontWeight="bold">
        N
      </text>
      <line x1="250" y1="200" x2="350" y2="200" stroke="#333" strokeWidth="2" />
      <text x="360" y="205" textAnchor="start" fontSize="12" fontWeight="bold">
        E
      </text>
    </g>
  </svg>
)

const PathConnections = ({ mapGrid }: { mapGrid: MapCell[][] }) => {
  const paths = []

  for (let i = 0; i < mapGrid.length; i++) {
    for (let j = 0; j < mapGrid[i].length; j++) {
      if (j < mapGrid[i].length - 1) {
        paths.push({ x1: j, y1: i, x2: j + 1, y2: i })
      }
      if (i < mapGrid.length - 1) {
        paths.push({ x1: j, y1: i, x2: j, y2: i + 1 })
      }
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
      {paths.map((path, idx) => (
        <line
          key={idx}
          x1={path.x1 * 100 + 50}
          y1={path.y1 * 100 + 50}
          x2={path.x2 * 100 + 50}
          y2={path.y2 * 100 + 50}
          stroke="#D4A574"
          strokeWidth="12"
          opacity="0.6"
        />
      ))}
    </svg>
  )
}

export function SnailMazeAdventure() {
  const [gameState, setGameState] = useState<GameState>({
    playerPosition: { row: 0, col: 0 },
    completedCells: [],
    currentChallenge: null,
    starsCollected: 0,
    treasuresCollected: 0,
    playerAvatar: "🐌",
    gameStarted: false,
    usedQuestionIds: new Set(),
  })

  const [showCharacterSelection, setShowCharacterSelection] = useState(true)
  const [showTreasure, setShowTreasure] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [soundEnabled, setSoundEnabled] = useState(true)

  const characters = [
    { emoji: "🐌", name: "Ốc Sên Nhỏ", color: "from-amber-300 to-amber-500" },
    { emoji: "🐰", name: "Thỏ Nhí Nhảnh", color: "from-pink-300 to-pink-500" },
    { emoji: "🦋", name: "Bướm Xinh", color: "from-purple-300 to-purple-500" },
    { emoji: "🦅", name: "Chim Đại Bàng", color: "from-blue-300 to-blue-500" },
  ]

  const selectCharacter = (emoji: string) => {
    setGameState((prev) => ({ ...prev, playerAvatar: emoji, gameStarted: true }))
    setShowCharacterSelection(false)
  }

  const getMapGrid = (): MapCell[][] => {
    const grid: MapCell[][] = []
    for (let row = 0; row < 5; row++) {
      const gridRow: MapCell[] = []
      for (let col = 0; col < 5; col++) {
        const isCompleted = gameState.completedCells.some((c) => c.row === row && c.col === col)
        const isCurrent = gameState.playerPosition.row === row && gameState.playerPosition.col === col
        const isLocked = !isCompleted && !isCurrent && gameState.completedCells.length < row + col + 1

        gridRow.push({
          row,
          col,
          state: isCurrent ? "current" : isCompleted ? "completed" : isLocked ? "locked" : "current",
          questionId: row * 5 + col,
        })
      }
      grid.push(gridRow)
    }
    return grid
  }

  const getAvailableMoves = (): Array<{ row: number; col: number }> => {
    const { row, col } = gameState.playerPosition
    const moves = []

    // Adjacent cells (up, down, left, right)
    const neighbors = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ]

    return neighbors.filter(
      (neighbor) =>
        neighbor.row >= 0 &&
        neighbor.row < 5 &&
        neighbor.col >= 0 &&
        neighbor.col < 5 &&
        !gameState.completedCells.some((c) => c.row === neighbor.row && c.col === neighbor.col),
    )
  }

  const handleCellClick = (row: number, col: number) => {
    if (gameState.currentChallenge) return

    const availableMoves = getAvailableMoves()
    if (!availableMoves.some((m) => m.row === row && m.col === col)) return

    const randomQuestion = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
    setGameState((prev) => ({
      ...prev,
      currentChallenge: randomQuestion,
    }))
    setAttempts(0)
    setFeedback("")
  }

  const handleAnswer = (selectedAnswer: string) => {
    if (!gameState.currentChallenge) return

    const isCorrect = selectedAnswer === gameState.currentChallenge.answer

    if (isCorrect) {
      setFeedback("✅ Đúng rồi! Tuyệt vời!")
      setTimeout(() => {
        const newPosition = getAvailableMoves()[0] || gameState.playerPosition
        const newStars = gameState.starsCollected + 1
        setGameState((prev) => ({
          ...prev,
          playerPosition: newPosition,
          completedCells: [
            ...prev.completedCells,
            { row: newPosition.row, col: newPosition.col, questionId: gameState.currentChallenge!.id },
          ],
          starsCollected: newStars,
          currentChallenge: null,
        }))
        setFeedback("")

        if (newStars % 3 === 0) {
          setShowTreasure(true)
        }
      }, 1500)
    } else {
      if (attempts < 1) {
        setFeedback("❌ Sai rồi, thử lại nha!")
        setAttempts((prev) => prev + 1)
      } else {
        setFeedback(`❌ Sai rồi. Đáp án đúng là: ${gameState.currentChallenge.answer}`)
        setTimeout(() => {
          setGameState((prev) => ({ ...prev, currentChallenge: null }))
          setFeedback("")
        }, 2000)
      }
    }
  }

  const handleTreasureOpen = () => {
    setGameState((prev) => ({
      ...prev,
      treasuresCollected: prev.treasuresCollected + 1,
      starsCollected: 0,
    }))
    setShowTreasure(false)
  }

  const completionPercentage = Math.round((gameState.completedCells.length / 25) * 100)

  if (showCharacterSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-cyan-100 to-lime-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-4 border-green-400">
          <CardHeader className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 text-white text-center">
            <CardTitle className="text-4xl font-bold flex items-center justify-center gap-2">
              🐌 Ốc Sên Phiêu Lưu 🌿
            </CardTitle>
            <p className="text-lg mt-2">Chọn nhân vật của bạn để bắt đầu hành trình!</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {characters.map((char) => (
                <button
                  key={char.emoji}
                  onClick={() => selectCharacter(char.emoji)}
                  className={`p-6 rounded-xl bg-gradient-to-br ${char.color} hover:scale-110 transform transition duration-300 shadow-lg border-4 border-white hover:shadow-2xl`}
                >
                  <div className="text-6xl mb-2 animate-bounce-gentle">{char.emoji}</div>
                  <div className="font-bold text-white text-center text-lg">{char.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState.currentChallenge) {
    const isMultipleChoice = gameState.currentChallenge.type === "MCQ"
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-2xl w-full shadow-2xl border-4 border-yellow-300">
          <CardHeader className="bg-gradient-to-r from-yellow-300 to-orange-300 text-center relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGameState((prev) => ({ ...prev, currentChallenge: null }))}
              className="absolute right-2 top-2"
            >
              <X className="w-6 h-6" />
            </Button>
            <CardTitle className="text-2xl font-bold">{gameState.currentChallenge.subject}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-3xl font-bold text-center mb-8 text-gray-800">
              {gameState.currentChallenge.question}
            </div>

            {isMultipleChoice ? (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {gameState.currentChallenge.options.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="h-24 text-2xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white transition-all hover:scale-105"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Nhập đáp án..."
                  id="answer-input"
                  className="w-full p-4 text-2xl border-4 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const input = (e.target as HTMLInputElement).value.toLowerCase().trim()
                      handleAnswer(input)
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={() => {
                    const input = (document.getElementById("answer-input") as HTMLInputElement).value
                      .toLowerCase()
                      .trim()
                    handleAnswer(input)
                  }}
                  className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white"
                >
                  Gửi đáp án
                </Button>
              </div>
            )}

            {feedback && (
              <div className="text-center text-2xl font-bold p-4 bg-gray-100 rounded-lg animate-bounce">{feedback}</div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showTreasure) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-xl w-full shadow-2xl border-4 border-yellow-400">
          <CardHeader className="bg-gradient-to-r from-yellow-300 to-orange-400 text-center">
            <CardTitle className="text-4xl font-bold flex items-center justify-center gap-2">
              🎉 Rương Kho Báu 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="text-8xl mb-6 animate-bounce-gentle">💎</div>
            <p className="text-2xl font-bold mb-4 text-gray-800">Bạn đã mở được một rương kho báu!</p>
            <p className="text-xl mb-8 text-gray-600">Nhận được phần thưởng! ✨✨✨</p>
            <div className="flex gap-4 justify-center mb-4">
              <span className="text-3xl">🌟</span>
              <span className="text-3xl">🎁</span>
              <span className="text-3xl">👑</span>
            </div>
            <Button
              onClick={handleTreasureOpen}
              className="w-full h-16 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
            >
              Tiếp tục chơi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mapGrid = getMapGrid()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-100 to-cyan-100 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <span className="text-6xl animate-bounce-gentle">{gameState.playerAvatar}</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Ốc Sên Phiêu Lưu</h1>
              <p className="text-lg text-gray-700">Hành trình tìm kho báu</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-200 to-yellow-400 border-4 border-yellow-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-900">⭐ {gameState.starsCollected}</div>
              <div className="text-sm font-semibold text-yellow-800">Sao Đã Thu Thập</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-200 to-purple-400 border-4 border-purple-500">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-900">💎 {gameState.treasuresCollected}</div>
              <div className="text-sm font-semibold text-purple-800">Rương Mở</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-200 to-blue-400 border-4 border-blue-500">
            <CardContent className="p-4 text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="mx-auto block"
              >
                {soundEnabled ? (
                  <Volume2 className="w-6 h-6 text-blue-900" />
                ) : (
                  <VolumeX className="w-6 h-6 text-blue-900" />
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="border-4 border-green-500 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-800">Tiến độ hoàn thành</span>
              <span className="text-lg font-bold text-green-600">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-4" />
          </CardContent>
        </Card>

        {/* Game Map with Terrain */}
        <Card className="border-4 border-green-400 overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 relative">
          <CardHeader className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 text-white relative z-10">
            <CardTitle className="text-center text-3xl font-bold">🗺️ Bản Đồ Phiêu Lưu Tìm Kho Báu</CardTitle>
          </CardHeader>
          <CardContent className="p-8 relative overflow-hidden">
            {/* Terrain decorations and path visualization */}
            <TerrainDecoration />
            <PathConnections mapGrid={mapGrid} />

            {/* Compass directions overlay */}
            <div className="absolute top-2 right-4 bg-white bg-opacity-90 rounded-lg p-3 border-2 border-green-400 z-20 text-sm font-bold">
              <div className="text-center mb-1">⬆️ N</div>
              <div className="text-center">E ➡️</div>
            </div>

            <div className="grid gap-4 relative z-10" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {mapGrid.map((row) =>
                row.map((cell) => {
                  const isAvailable =
                    !gameState.currentChallenge &&
                    getAvailableMoves().some((m) => m.row === cell.row && m.col === cell.col)
                  const isCompleted = gameState.completedCells.some((c) => c.row === cell.row && c.col === cell.col)
                  const isCurrent =
                    gameState.playerPosition.row === cell.row && gameState.playerPosition.col === cell.col

                  return (
                    <div key={`${cell.row}-${cell.col}`} className="relative h-24">
                      <button
                        onClick={() => handleCellClick(cell.row, cell.col)}
                        className={`w-full h-full rounded-full font-bold text-3xl border-4 transform transition-all duration-300 flex items-center justify-center shadow-lg ${
                          isCurrent
                            ? "bg-gradient-to-br from-red-300 to-red-500 border-red-600 scale-110 animate-glow-pulse shadow-xl"
                            : isCompleted
                              ? "bg-gradient-to-br from-green-300 to-emerald-500 border-green-600 opacity-80 shadow-md"
                              : isAvailable
                                ? "bg-gradient-to-br from-blue-300 to-cyan-500 border-blue-600 hover:scale-110 cursor-pointer hover:shadow-xl"
                                : "bg-gray-200 border-gray-400 opacity-40 cursor-not-allowed"
                        }`}
                        disabled={!isAvailable && !isCurrent}
                      >
                        {isCurrent ? gameState.playerAvatar : isCompleted ? "✅" : isAvailable ? "?" : "🔒"}
                      </button>

                      {/* Directional label on available moves */}
                      {isAvailable && (
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-blue-600 whitespace-nowrap">
                          {cell.row < gameState.playerPosition.row && "↑"}
                          {cell.row > gameState.playerPosition.row && "↓"}
                          {cell.col < gameState.playerPosition.col && "←"}
                          {cell.col > gameState.playerPosition.col && "→"}
                        </div>
                      )}
                    </div>
                  )
                }),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card className="border-4 border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-bold text-gray-800 mb-2">✨ Hướng dẫn chơi</p>
            <p className="text-sm text-gray-700">
              🎯 Trả lời đúng câu hỏi để di chuyển | ⭐ Mỗi 3 sao mở 1 rương kho báu | 🎁 Nhận phần thưởng đặc biệt!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
