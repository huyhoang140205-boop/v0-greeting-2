"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type GameState = "MENU" | "LEVEL_SELECT" | "PLAYING" | "WIN" | "SHOP" | "LOSE" | "paused" // Added "paused"
type Character = "doremon" | "nobita" | "chaien" | "shizuka" | "goku" | "pikachu"

interface MathProblem {
  id: string
  a: number
  b: number
  correctAnswer: number
  solved: boolean
  table: number
}

interface MapObject {
  x: number
  y: number
  width: number
  height: number
}

interface AnswerTile extends MapObject {
  id: string
  value: number
  picked: boolean
  pulseTime: number
  problemId: string
}

interface BonusQuestion {
  question: string
  correctAnswer: number
  options: number[]
}

interface Treasure extends MapObject {
  type: "treasure"
  collected: boolean
  reward: number
  glowTime: number
  bonusQuestion?: BonusQuestion
}

interface Wall extends MapObject {
  type: "wall"
}

interface GameMap {
  player: MapObject & { vx: number; vy: number; spawnX: number; spawnY: number }
  walls: Wall[]
  answerTiles: AnswerTile[]
  mathProblems: MathProblem[]
  treasures: Treasure[]
  key: MapObject & { visible: boolean; collected: boolean; bounceTime: number }
  door: MapObject & { locked: boolean; glowTime: number }
  theme: {
    name: string
    bg: string
    floor: string
    wall: string
    decorations?: string[]
  }
  flashEffect: { active: boolean; color: string; time: number }
}

interface PlayerState {
  coins: number
  unlockedCharacters: Character[]
  currentCharacter: Character
  completedLevels: number[]
}

// --- CONSTANTS ---

const CHARACTER_SHOP: Record<Character, { name: string; price: number; avatar: string; emoji: string }> = {
  doremon: { name: "Doremon", price: 0, avatar: "/avatar/doremon.jpg", emoji: "🐱" },
  nobita: { name: "Nobita", price: 300, avatar: "/avatar/nobita.jpg", emoji: "🤓" },
  chaien: { name: "Chaien", price: 300, avatar: "/avatar/chaien.jpg", emoji: "🎤" },
  shizuka: { name: "Shizuka", price: 500, avatar: "/avatar/shizuka.jpg", emoji: "👧" },
  goku: { name: "Goku", price: 800, avatar: "/avatar/goku.jpg", emoji: "🐉" },
  pikachu: { name: "Pikachu", price: 800, avatar: "/avatar/pikachu.jpg", emoji: "⚡" },
}

const LEVELS = [
  {
    id: 1,
    name: "Rừng Xanh",
    theme: {
      name: "Rừng",
      bg: "linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)",
      floor: "#228B22",
      wall: "#8B4513",
      decorations: ["🌳", "🌲", "🌿", "🍃"],
    },
    timeLimit: 180,
    multipliers: [1, 2],
    walls: [
      { x: 50, y: 50, width: 900, height: 20 },
      { x: 50, y: 50, width: 20, height: 450 },
      { x: 930, y: 50, width: 20, height: 450 },
      { x: 50, y: 480, width: 900, height: 20 },
      // Inner walls
      { x: 150, y: 120, width: 80, height: 20 },
      { x: 150, y: 120, width: 20, height: 100 },
      { x: 280, y: 150, width: 20, height: 120 },
      { x: 280, y: 270, width: 120, height: 20 },
      { x: 400, y: 120, width: 20, height: 150 },
      { x: 420, y: 120, width: 100, height: 20 },
      { x: 520, y: 140, width: 20, height: 180 },
      { x: 540, y: 320, width: 100, height: 20 },
      { x: 640, y: 180, width: 20, height: 140 },
      { x: 660, y: 180, width: 120, height: 20 },
      { x: 780, y: 200, width: 20, height: 150 },
      { x: 200, y: 350, width: 150, height: 20 },
      { x: 450, y: 380, width: 180, height: 20 },
    ],
    playerStart: { x: 100, y: 100 },
    doorPos: { x: 860, y: 420 },
    treasures: [{ x: 500, y: 230, reward: 50 }],
  },
  {
    id: 2,
    name: "Sa Mạc",
    theme: {
      name: "Sa mạc",
      bg: "linear-gradient(180deg, #FFE4B5 0%, #DEB887 100%)",
      floor: "#F4A460",
      wall: "#D2691E",
      decorations: ["🌵", "🦂", "🏜️", "🐪"],
    },
    timeLimit: 170,
    multipliers: [3, 4],
    walls: [
      { x: 50, y: 50, width: 900, height: 20 },
      { x: 50, y: 50, width: 20, height: 450 },
      { x: 930, y: 50, width: 20, height: 450 },
      { x: 50, y: 480, width: 900, height: 20 },
      // Maze
      { x: 150, y: 120, width: 150, height: 20 },
      { x: 150, y: 140, width: 20, height: 100 },
      { x: 170, y: 240, width: 180, height: 20 },
      { x: 350, y: 120, width: 20, height: 120 },
      { x: 370, y: 200, width: 100, height: 20 },
      { x: 470, y: 140, width: 20, height: 80 },
      { x: 490, y: 140, width: 150, height: 20 },
      { x: 640, y: 160, width: 20, height: 100 },
      { x: 520, y: 260, width: 120, height: 20 },
      { x: 520, y: 280, width: 20, height: 80 },
      { x: 700, y: 120, width: 80, height: 20 },
      { x: 780, y: 140, width: 20, height: 180 },
      { x: 200, y: 350, width: 200, height: 20 },
      { x: 500, y: 380, width: 180, height: 20 },
    ],
    playerStart: { x: 100, y: 100 },
    doorPos: { x: 860, y: 420 },
    treasures: [
      { x: 250, y: 180, reward: 60 },
      { x: 750, y: 380, reward: 60 },
    ],
  },
  // Bạn có thể thêm các level 3-10 vào đây tương tự như logic trên
]

// --- MAIN COMPONENT ---

export default function MathDuckMaze() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("MENU")
  
  // Khởi tạo state với giá trị mặc định để tránh Hydration Mismatch
  const [playerState, setPlayerState] = useState<PlayerState>({
    coins: 0,
    unlockedCharacters: ["doremon"],
    currentCharacter: "doremon",
    completedLevels: [],
  })

  // Load state từ localStorage sau khi mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mathDuckPlayerState")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (!parsed.currentCharacter || !CHARACTER_SHOP[parsed.currentCharacter as Character]) {
            parsed.currentCharacter = "doremon"
          }
          setPlayerState(parsed)
        } catch (e) {
          console.error("Failed to parse saved player state:", e)
        }
      }
    }
  }, [])

  // Lưu state khi thay đổi
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mathDuckPlayerState", JSON.stringify(playerState))
    }
  }, [playerState])

  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(180)
  const [currentLevel, setCurrentLevel] = useState(1)
  const gameMapRef = useRef<GameMap | null>(null)
  const keysPressed = useRef<Record<string, boolean>>({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const animationFrameRef = useRef<number>(0)
  const [showShop, setShowShop] = useState(false)

  const [showBonusQuestion, setShowBonusQuestion] = useState(false)
  const [currentBonusQuestion, setCurrentBonusQuestion] = useState<BonusQuestion | null>(null)
  const [selectedBonusAnswer, setSelectedBonusAnswer] = useState<number | null>(null)

  const [characterImages, setCharacterImages] = useState<Record<string, HTMLImageElement>>({})

  // Load ảnh
  useEffect(() => {
    const images: Record<string, HTMLImageElement> = {}
    Object.entries(CHARACTER_SHOP).forEach(([id, char]) => {
      const img = new Image()
      img.src = char.avatar
      // Nếu lỗi thì dùng placeholder hoặc bỏ qua
      img.onerror = () => { console.warn(`Could not load image for ${char.name}`); }
      images[id] = img
    })
    setCharacterImages(images)
  }, [])

  const generateBonusQuestion = (): BonusQuestion => {
    const num1 = Math.floor(Math.random() * 9) + 1
    const num2 = Math.floor(Math.random() * 9) + 1
    const correctAnswer = num1 * num2

    const wrongAnswers = new Set<number>()
    while (wrongAnswers.size < 3) {
      const wrong = correctAnswer + Math.floor(Math.random() * 20) - 10
      if (wrong > 0 && wrong !== correctAnswer) {
        wrongAnswers.add(wrong)
      }
    }

    const options = [correctAnswer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5)
    return { question: `${num1} × ${num2} = ?`, correctAnswer, options }
  }

  const getRandomPosition = (
    walls: MapObject[],
    usedPositions: { x: number; y: number }[],
    playerStart: { x: number; y: number },
  ) => {
    const maxAttempts = 200
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = 100 + Math.floor(Math.random() * 750)
      const y = 100 + Math.floor(Math.random() * 350)
      let valid = true

      if (Math.abs(x - playerStart.x) < 80 && Math.abs(y - playerStart.y) < 80) valid = false

      for (const wall of walls) {
        if (x < wall.x + wall.width + 50 && x + 40 > wall.x - 50 && y < wall.y + wall.height + 50 && y + 40 > wall.y - 50) {
          valid = false
          break
        }
      }

      if (valid) {
        for (const pos of usedPositions) {
          if (Math.abs(x - pos.x) < 90 && Math.abs(y - pos.y) < 90) {
            valid = false
            break
          }
        }
      }
      if (valid) return { x, y }
    }
    return { x: 400, y: 250 }
  }

  const initGameMap = (levelNum: number) => {
    const levelConfig = LEVELS.find((lvl) => lvl.id === levelNum)
    if (!levelConfig) return

    const mathProblems: MathProblem[] = levelConfig.multipliers.map((mult, idx) => {
      const b = Math.floor(Math.random() * 10) + 1
      return {
        id: `problem-${idx}`,
        a: mult,
        b: b,
        correctAnswer: mult * b,
        solved: false,
        table: mult,
      }
    })

    const answerTiles: AnswerTile[] = []
    const usedPositions: { x: number; y: number }[] = []
    const allAnswerValues = new Set<number>()

    mathProblems.forEach((problem) => allAnswerValues.add(problem.correctAnswer))

    mathProblems.forEach((problem) => {
      let wrongCount = 0
      let attempts = 0
      while (wrongCount < 2 && attempts < 20) {
        const offset = Math.floor(Math.random() * 10) + 1
        const wrongValue = Math.random() > 0.5 ? problem.correctAnswer + offset : Math.max(1, problem.correctAnswer - offset)
        if (!allAnswerValues.has(wrongValue) && wrongValue > 0 && wrongValue <= 144) {
          allAnswerValues.add(wrongValue)
          wrongCount++
        }
        attempts++
      }
    })

    Array.from(allAnswerValues).forEach((value, idx) => {
      const pos = getRandomPosition(levelConfig.walls, usedPositions, levelConfig.playerStart)
      usedPositions.push(pos)
      answerTiles.push({
        x: pos.x,
        y: pos.y,
        width: 40,
        height: 40,
        id: `answer-${idx}`,
        value: value,
        picked: false,
        pulseTime: 0,
        problemId: "",
      })
    })

    const availableTiles = [...answerTiles]
    mathProblems.forEach((problem) => {
      const correctTileIndex = availableTiles.findIndex((tile) => tile.value === problem.correctAnswer)
      if (correctTileIndex !== -1) {
        const correctTile = availableTiles.splice(correctTileIndex, 1)[0]
        correctTile.problemId = problem.id
        const realTile = answerTiles.find((t) => t.id === correctTile.id)
        if (realTile) realTile.problemId = problem.id
      }
      const wrongTilesToAssign = Math.min(2, availableTiles.length)
      for (let i = 0; i < wrongTilesToAssign; i++) {
        const wrongTile = availableTiles.pop()
        if (wrongTile) {
          const realTile = answerTiles.find((t) => t.id === wrongTile.id)
          if (realTile) realTile.problemId = problem.id
        }
      }
    })

    const treasures: Treasure[] = levelConfig.treasures.map((t) => ({
      x: t.x,
      y: t.y,
      width: 40,
      height: 40,
      type: "treasure",
      collected: false,
      reward: t.reward,
      glowTime: 0,
      bonusQuestion: generateBonusQuestion(),
    }))

    const gameMap: GameMap = {
      player: {
        x: levelConfig.playerStart.x,
        y: levelConfig.playerStart.y,
        width: 30,
        height: 30,
        vx: 0,
        vy: 0,
        spawnX: levelConfig.playerStart.x,
        spawnY: levelConfig.playerStart.y,
      },
      walls: levelConfig.walls.map((w) => ({ ...w, type: "wall" as const })),
      answerTiles: answerTiles,
      mathProblems: mathProblems,
      treasures: treasures,
      key: { x: 500, y: 250, width: 30, height: 30, visible: false, collected: false, bounceTime: 0 },
      door: { x: levelConfig.doorPos.x, y: levelConfig.doorPos.y, width: 50, height: 50, locked: true, glowTime: 0 },
      theme: levelConfig.theme,
      flashEffect: { active: false, color: "", time: 0 },
    }
    gameMapRef.current = gameMap
  }

  const collide = (a: MapObject, b: MapObject) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  const updateGameMap = () => {
    const map = gameMapRef.current
    if (!map) return
    const canvas = canvasRef.current
    if (!canvas) return

    const MOVE_SPEED = 3
    const newX = map.player.x + map.player.vx * MOVE_SPEED
    const newY = map.player.y + map.player.vy * MOVE_SPEED
    let canMoveX = true
    let canMoveY = true
    const futurePlayerX = { ...map.player, x: newX }
    const futurePlayerY = { ...map.player, y: newY }

    for (const wall of map.walls) {
      if (collide(futurePlayerX, wall)) canMoveX = false
      if (collide(futurePlayerY, wall)) canMoveY = false
    }

    if (canMoveX) map.player.x = newX
    if (canMoveY) map.player.y = newY

    map.player.x = Math.max(0, Math.min(canvas.width - map.player.width, map.player.x))
    map.player.y = Math.max(0, Math.min(canvas.height - map.player.height, map.player.y))

    map.answerTiles.forEach((tile) => {
      if (!tile.picked && collide(map.player, tile)) {
        const matchingProblem = map.mathProblems.find((p) => !p.solved && p.id === tile.problemId)
        if (matchingProblem && matchingProblem.correctAnswer === tile.value) {
          matchingProblem.solved = true
          setScore((prev) => prev + 100)
          map.flashEffect = { active: true, color: "rgba(0, 255, 0, 0.3)", time: 0 }
          const allSolved = map.mathProblems.every((p) => p.solved)
          if (allSolved && !map.key.visible && !map.key.collected) {
            const keyPos = getRandomPosition(map.walls, [], map.player)
            map.key.x = keyPos.x
            map.key.y = keyPos.y
            map.key.visible = true
          }
        } else {
          map.flashEffect = { active: true, color: "rgba(255, 0, 0, 0.3)", time: 0 }
          map.player.x = map.player.spawnX
          map.player.y = map.player.spawnY
          map.player.vx = 0
          map.player.vy = 0
        }
        tile.picked = true
      }
    })

    map.treasures.forEach((treasure) => {
      if (!treasure.collected && collide(map.player, treasure)) {
        setCurrentBonusQuestion(treasure.bonusQuestion || null)
        setShowBonusQuestion(true)
        setGameState("paused")
        treasure.collected = true
      }
    })

    if (map.key.visible && !map.key.collected && collide(map.player, map.key)) {
      map.key.collected = true
      map.key.visible = false
      map.door.locked = false
      setScore((prev) => prev + 50)
    }

    if (!map.door.locked && collide(map.player, map.door)) {
      const earnedCoins = Math.floor(score * 0.5) + 100
      setPlayerState((prev) => ({
        ...prev,
        coins: prev.coins + earnedCoins,
        completedLevels: prev.completedLevels.includes(currentLevel) ? prev.completedLevels : [...prev.completedLevels, currentLevel],
      }))
      map.player.vx = 0
      map.player.vy = 0
      keysPressed.current = {}
      setGameState("WIN")
    }
  }

  const renderGameMap = () => {
    const canvas = canvasRef.current
    const map = gameMapRef.current
    if (!canvas || !map) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    animationFrameRef.current++

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    if (map.theme.bg.includes("gradient")) {
      const colors = map.theme.bg.match(/#[0-9A-Fa-f]{6}/g) || []
      if (colors.length >= 2) {
        gradient.addColorStop(0, colors[0])
        gradient.addColorStop(1, colors[1])
      } else {
        gradient.addColorStop(0, "#f0f0f0"); gradient.addColorStop(1, "#d0d0d0")
      }
    } else {
      gradient.fillStyle = map.theme.bg || "#f0f0f0"
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Decorations
    ctx.font = "48px Arial"
    const decorations = map.theme.decorations || []
    ctx.fillText(decorations[0] || "🌳", 50, 80)
    ctx.fillText(decorations[1] || "🌲", canvas.width - 100, 80)
    ctx.fillText(decorations[2] || "🌿", 50, canvas.height - 50)
    ctx.fillText(decorations[3] || "🍃", canvas.width - 100, canvas.height - 50)

    if (map.flashEffect.active) {
      map.flashEffect.time++
      ctx.fillStyle = map.flashEffect.color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (map.flashEffect.time > 15) {
        map.flashEffect.active = false
        map.flashEffect.time = 0
      }
    }

    // Walls
    ctx.shadowBlur = 8; ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3
    map.walls.forEach((wall) => {
      const wallGradient = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.height)
      // (Giữ logic màu wall cũ nhưng rút gọn lại nếu cần)
      wallGradient.addColorStop(0, "#8B4513"); wallGradient.addColorStop(1, "#5D4037")
      
      ctx.fillStyle = wallGradient
      ctx.beginPath()
      if ('roundRect' in ctx) {
        ctx.roundRect(wall.x, wall.y, wall.width, wall.height, 8)
      } else {
         ctx.rect(wall.x, wall.y, wall.width, wall.height)
      }
      ctx.fill()
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3; ctx.stroke()
    })

    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0

    // Tiles
    map.answerTiles.forEach((tile) => {
      if (tile.picked) return
      tile.pulseTime++
      const pulse = Math.sin(tile.pulseTime * 0.05) * 0.1 + 1
      ctx.save()
      ctx.translate(tile.x + 20, tile.y + 20)
      ctx.scale(pulse, pulse)
      ctx.fillStyle = "#FFEB3B"
      ctx.beginPath()
      if ('roundRect' in ctx) ctx.roundRect(-20, -20, 40, 40, 8)
      else ctx.rect(-20,-20,40,40)
      ctx.fill()
      ctx.strokeStyle = "#F57C00"; ctx.lineWidth = 4; ctx.stroke()
      ctx.fillStyle = "#000"
      ctx.font = "bold 22px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillText(tile.value.toString(), 0, 0)
      ctx.restore()
    })

    // Treasures
    map.treasures.forEach((treasure) => {
      if (!treasure.collected) {
        treasure.glowTime++
        const bounce = Math.sin(treasure.glowTime * 0.1) * 3
        const cx = treasure.x + treasure.width / 2
        const cy = treasure.y + treasure.height / 2 + bounce
        
        ctx.fillStyle = "#8B4513"; ctx.fillRect(treasure.x + 5, cy - 5, 30, 20) // Chest base
        ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill() // Lock
      }
    })

    // Key
    if (map.key.visible) {
      map.key.bounceTime++
      const bounce = Math.sin(map.key.bounceTime * 0.1) * 5
      ctx.save()
      ctx.shadowBlur = 20; ctx.shadowColor = "#FFD700"
      ctx.font = "35px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillText("🔑", map.key.x + map.key.width / 2, map.key.y + map.key.height / 2 + bounce)
      ctx.restore()
    }

    // Door
    map.door.glowTime++
    ctx.fillStyle = map.door.locked ? "#C71585" : "#32CD32"
    ctx.beginPath()
    if('roundRect' in ctx) ctx.roundRect(map.door.x, map.door.y, map.door.width, map.door.height, 12)
    else ctx.rect(map.door.x, map.door.y, map.door.width, map.door.height)
    ctx.fill()
    ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#FFF"
    ctx.fillText(map.door.locked ? "🔒" : "🚪", map.door.x + map.door.width / 2, map.door.y + map.door.height / 2)

    // Player
    const drawCharacter = () => {
      const char = CHARACTER_SHOP[playerState.currentCharacter]
      if (!char) return
      const img = characterImages[playerState.currentCharacter]

      ctx.save()
      ctx.beginPath()
      ctx.arc(map.player.x + map.player.width / 2, map.player.y + map.player.height / 2, map.player.width / 2 - 2, 0, Math.PI * 2)
      ctx.clip()
      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, map.player.x, map.player.y, map.player.width, map.player.height)
      } else {
        // Fallback if image missing
        ctx.fillStyle = "blue"; ctx.fillRect(map.player.x, map.player.y, map.player.width, map.player.height)
      }
      ctx.restore()
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(map.player.x + map.player.width / 2, map.player.y + map.player.height / 2, map.player.width / 2 - 2, 0, Math.PI * 2); ctx.stroke()
    }
    drawCharacter()

    // UI Overlay on Canvas (Timer, Buttons)
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`
    
    // Timer Box
    ctx.fillStyle = timeLeft > 60 ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 200, 200, 0.9)"
    ctx.beginPath(); if('roundRect' in ctx) ctx.roundRect(canvas.width - 140, canvas.height - 70, 120, 55, 12); else ctx.rect(canvas.width - 140, canvas.height - 70, 120, 55); ctx.fill()
    ctx.fillStyle = timeLeft > 60 ? "#000" : "#D32F2F"
    ctx.font = "bold 32px monospace"; ctx.textAlign = "center"
    ctx.fillText(timeString, canvas.width - 80, canvas.height - 40)

    // Control Buttons Icons
    const buttonSize = 45; const buttonY = 20; const buttonSpacing = 12
    const buttons = [{ icon: "💾", x: canvas.width - 160 }, { icon: soundEnabled ? "🔊" : "🔇", x: canvas.width - 160 + buttonSize + buttonSpacing }, { icon: "✖", x: canvas.width - 160 + 2 * (buttonSize + buttonSpacing) }]
    
    buttons.forEach((btn) => {
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); if('roundRect' in ctx) ctx.roundRect(btn.x, buttonY, buttonSize, buttonSize, 10); else ctx.rect(btn.x, buttonY, buttonSize, buttonSize); ctx.fill(); ctx.stroke()
      ctx.fillStyle = "#000"; ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
      ctx.fillText(btn.icon, btn.x + buttonSize / 2, buttonY + buttonSize / 2)
    })
    
    // Coins
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)"; ctx.beginPath(); if('roundRect' in ctx) ctx.roundRect(canvas.width - 160, 85, 150, 40, 10); else ctx.rect(canvas.width - 160, 85, 150, 40); ctx.fill()
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center"
    ctx.fillText(`💰 ${playerState.coins}`, canvas.width - 85, 105 + 8) // +8 for better centering
  }

  useEffect(() => {
    if (gameState !== "PLAYING") {
      keysPressed.current = {}
      return
    }
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true }
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState])

  // Game Loop
  useEffect(() => {
    if (gameState !== "PLAYING") return
    const interval = setInterval(() => {
      const map = gameMapRef.current
      if (!map) return
      map.player.vx = 0; map.player.vy = 0
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) map.player.vy = -1
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) map.player.vy = 1
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) map.player.vx = -1
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) map.player.vx = 1
      updateGameMap()
      renderGameMap()
    }, 1000 / 60)
    return () => clearInterval(interval)
  }, [gameState, score, playerState.coins, soundEnabled, playerState.currentCharacter])

  // Timer
  useEffect(() => {
    if (gameState !== "PLAYING") return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("LOSE")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState])

  const startGame = (levelNum: number) => {
    setCurrentLevel(levelNum)
    initGameMap(levelNum)
    setScore(0)
    setTimeLeft(LEVELS.find((lvl) => lvl.id === levelNum)?.timeLimit || 180)
    keysPressed.current = {}
    setGameState("PLAYING")
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "PLAYING") return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // Scale logic to fix click coordinates on resized screens
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const buttonSize = 45; const buttonY = 20; const buttonSpacing = 12
    // Save button (placeholder)
    if (x >= canvas.width - 160 && x <= canvas.width - 160 + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      console.log("Save clicked")
    }
    // Sound toggle
    if (x >= canvas.width - 160 + buttonSize + buttonSpacing && x <= canvas.width - 160 + buttonSize + buttonSpacing + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      setSoundEnabled((prev) => !prev)
    }
    // Exit button
    if (x >= canvas.width - 160 + 2 * (buttonSize + buttonSpacing) && x <= canvas.width - 160 + 2 * (buttonSize + buttonSpacing) + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      setGameState("LEVEL_SELECT")
    }
  }

  const handleBonusAnswer = (answer: number) => {
    const map = gameMapRef.current
    if (currentBonusQuestion && answer === currentBonusQuestion.correctAnswer) {
      const triggeredTreasure = map?.treasures.find((t) => t.collected && t.bonusQuestion?.question === currentBonusQuestion.question)
      const reward = triggeredTreasure?.reward || 50
      setPlayerState((prev) => ({ ...prev, coins: prev.coins + reward }))
      setScore((prev) => prev + reward)
      if (map) map.flashEffect = { active: true, color: "rgba(0, 255, 0, 0.3)", time: 0 }
    } else {
      if (map) map.flashEffect = { active: true, color: "rgba(255, 0, 0, 0.3)", time: 0 }
    }
    setShowBonusQuestion(false)
    setCurrentBonusQuestion(null)
    setSelectedBonusAnswer(null)
    setGameState("PLAYING")
  }

  // --- RENDERS ---

  if (gameState === "MENU") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-400 to-blue-300 border-4 border-blue-600 rounded-3xl shadow-xl">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white drop-shadow-lg font-sans">
              🎮 MÊ CUNG TOÁN HỌC
            </h1>
            <p className="text-2xl text-white font-bold">Phiêu Lưu & Giải Toán!</p>
            <div className="bg-white/90 rounded-2xl p-6 text-left space-y-3 shadow-inner">
              <p className="font-bold text-xl">📖 Hướng dẫn:</p>
              <p className="text-lg">⌨️ WASD hoặc ⬆️⬇️⬅️➡️: Di chuyển</p>
              <p className="text-lg">✅ Chạm đáp án đúng: Hoàn thành câu hỏi</p>
              <p className="text-lg">❌ Chạm đáp án sai: Reset vị trí</p>
              <p className="text-lg">🔑 Giải hết toán → Nhặt chìa khóa → 🚪 Mở cửa</p>
            </div>
            <button onClick={() => setGameState("LEVEL_SELECT")} className="block w-full text-3xl px-8 py-4 font-black bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 rounded-2xl transition-transform hover:scale-105">
              ▶️ BẮT ĐẦU CHƠI
            </button>
            <button onClick={() => setGameState("SHOP")} className="block w-full text-2xl px-8 py-4 font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-4 border-yellow-700 rounded-2xl transition-transform hover:scale-105">
              🛒 CỬA HÀNG NHÂN VẬT
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "SHOP") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-300 p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl p-8 bg-gradient-to-b from-purple-200 to-purple-100 border-4 border-purple-600 rounded-3xl shadow-xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-5xl font-black text-purple-800">🛒 CỬA HÀNG</h1>
              <p className="text-2xl font-bold text-purple-600 mt-2">Xu của bạn: 💰 {playerState.coins}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(CHARACTER_SHOP).map(([key, char]) => {
                const isUnlocked = playerState.unlockedCharacters.includes(key as Character)
                const isCurrent = playerState.currentCharacter === key
                const canBuy = playerState.coins >= char.price
                return (
                  <div key={key} className={`p-4 text-center border-4 rounded-2xl shadow-sm ${isCurrent ? "border-green-500 bg-green-100" : isUnlocked ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-100"}`}>
                    <div className="text-6xl mb-2">{char.emoji}</div>
                    <h3 className="text-xl font-bold mb-2">{char.name}</h3>
                    {isUnlocked ? (
                      isCurrent ? <p className="text-green-600 font-bold text-lg">✓ Đang dùng</p> : 
                      <button onClick={() => setPlayerState(prev => ({ ...prev, currentCharacter: key as Character }))} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-xl">Chọn</button>
                    ) : (
                      <>
                        <p className="text-lg font-bold mb-2">💰 {char.price} xu</p>
                        <button onClick={() => { if (canBuy) setPlayerState(prev => ({ ...prev, coins: prev.coins - char.price, unlockedCharacters: [...prev.unlockedCharacters, key as Character], currentCharacter: key as Character })) }} disabled={!canBuy} className={`w-full py-2 font-bold rounded-xl ${canBuy ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 text-gray-500"}`}>
                          {canBuy ? "Mua" : "Thiếu xu"}
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setGameState("MENU")} className="w-full text-2xl px-8 py-4 font-bold bg-purple-500 hover:bg-purple-600 text-white border-4 border-purple-700 rounded-2xl">
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "LEVEL_SELECT") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-cyan-300 p-4 flex items-center justify-center">
        <div className="w-full max-w-5xl p-8 bg-gradient-to-b from-white to-blue-50 border-4 border-blue-600 rounded-3xl shadow-xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-5xl font-black text-blue-800">🗺️ CHỌN MÀN CHƠI</h1>
              <p className="text-xl font-bold text-blue-600 mt-2">Nhân vật: {CHARACTER_SHOP[playerState.currentCharacter].emoji} {CHARACTER_SHOP[playerState.currentCharacter].name}</p>
              <p className="text-lg font-bold text-yellow-600">💰 Xu: {playerState.coins}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {LEVELS.map((level) => {
                const isCompleted = playerState.completedLevels.includes(level.id)
                return (
                  <button key={level.id} onClick={() => startGame(level.id)} className={`h-24 text-xl font-black border-4 rounded-2xl transition-transform hover:scale-105 ${isCompleted ? "bg-green-500 border-green-700 text-white" : "bg-blue-500 border-blue-700 text-white"}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">{level.id}</span>
                      {isCompleted && <span className="text-sm">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <button onClick={() => setGameState("MENU")} className="text-2xl px-6 py-4 font-bold bg-gray-500 hover:bg-gray-600 text-white border-4 border-gray-700 rounded-2xl">← Menu</button>
              <button onClick={() => setGameState("SHOP")} className="text-2xl px-6 py-4 font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-4 border-yellow-700 rounded-2xl">🛒 Cửa hàng</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "WIN" || gameState === "LOSE") {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${gameState === "WIN" ? "from-green-400 to-emerald-300" : "from-red-400 to-orange-300"} p-4 flex items-center justify-center`}>
        <div className={`w-full max-w-2xl p-8 bg-gradient-to-b ${gameState === "WIN" ? "from-green-100" : "from-red-100"} border-4 ${gameState === "WIN" ? "border-green-600" : "border-red-600"} rounded-3xl shadow-xl`}>
          <div className="text-center space-y-6">
            <h1 className={`text-6xl font-black ${gameState === "WIN" ? "text-green-800" : "text-red-800"}`}>
              {gameState === "WIN" ? "🎉 CHIẾN THẮNG!" : "⏰ HẾT GIỜ!"}
            </h1>
            <p className={`text-3xl font-bold ${gameState === "WIN" ? "text-green-700" : "text-red-700"}`}>Màn {currentLevel}</p>
            <div className="bg-white rounded-2xl p-6 space-y-3">
              <p className="text-2xl font-bold">Điểm số: {score}</p>
              {gameState === "WIN" && <p className="text-2xl font-bold text-yellow-600">Nhận được: 💰 {Math.floor(score * 0.5) + 100} xu</p>}
            </div>
            <div className="space-y-4">
              {gameState === "WIN" && currentLevel < LEVELS.length && (
                <button onClick={() => startGame(currentLevel + 1)} className="text-3xl px-8 py-6 w-full font-black bg-blue-500 hover:bg-blue-600 text-white border-4 border-blue-700 rounded-2xl">▶️ Màn tiếp theo</button>
              )}
              {gameState === "LOSE" && (
                <button onClick={() => startGame(currentLevel)} className="text-3xl px-8 py-6 w-full font-black bg-orange-500 hover:bg-orange-600 text-white border-4 border-orange-700 rounded-2xl">🔄 Chơi lại</button>
              )}
              <button onClick={() => setGameState("LEVEL_SELECT")} className={`text-2xl px-8 py-4 w-full font-bold text-white border-4 rounded-2xl ${gameState === "WIN" ? "bg-green-500 border-green-700" : "bg-red-500 border-red-700"}`}>📋 Chọn màn khác</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- UI FOR POPUPS IN GAME ---

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-3 flex-wrap justify-center max-w-4xl pointer-events-none">
        {gameMapRef.current?.mathProblems.filter((p) => !p.solved).map((problem) => (
            <div key={problem.id} className="bg-white rounded-2xl shadow-2xl px-6 py-4 border-4 border-orange-400 animate-in fade-in zoom-in">
              <p className="text-3xl font-bold text-gray-800 text-center">{problem.a} × {problem.b} = ?</p>
            </div>
        ))}
      </div>

      {showBonusQuestion && currentBonusQuestion && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-400">
               <div className="text-center mb-6">
                  <div className="text-7xl mb-4">🎁</div>
                  <h2 className="text-4xl font-bold text-purple-600 mb-2">Rương Báu!</h2>
                  <p className="text-gray-700 text-xl font-semibold">Trả lời đúng nhận 💎</p>
               </div>
               <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-6">
                  <p className="text-4xl font-bold text-center text-gray-800">{currentBonusQuestion.question}</p>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-6">
                  {currentBonusQuestion.options.map((option, idx) => (
                     <button key={idx} onClick={() => setSelectedBonusAnswer(option)} className={`p-4 rounded-xl text-2xl font-bold transition-all border-4 ${selectedBonusAnswer === option ? "bg-yellow-400 text-white border-yellow-600" : "bg-white text-gray-800 border-yellow-300 hover:bg-yellow-50"}`}>
                        {option}
                     </button>
                  ))}
               </div>
               <button onClick={() => selectedBonusAnswer !== null && handleBonusAnswer(selectedBonusAnswer)} disabled={selectedBonusAnswer === null} className={`w-full py-4 rounded-xl text-xl font-bold transition-all ${selectedBonusAnswer !== null ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}`}>Xác Nhận</button>
            </div>
         </div>
      )}

      {/* Main Game Canvas Wrapper */}
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <canvas ref={canvasRef} width={1000} height={600} className="border-8 border-gray-700 rounded-3xl shadow-2xl max-w-full h-auto cursor-pointer" onClick={handleCanvasClick} />
      </div>
    </div>
  )
}
