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
  table: number // Added table for clarity in UI
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
  pulseTime: number // Added for animation
  problemId: string // To link tile to problem
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
  bonusQuestion?: BonusQuestion // Added bonus question
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
    name: string // Added name for themed drawing
    bg: string // Changed to string for linear-gradient
    floor: string
    wall: string
    decorations?: string[] // Added decorations for backgrounds
  }
  flashEffect: { active: boolean; color: string; time: number } // Added for correct/wrong flash
}

interface PlayerState {
  coins: number
  unlockedCharacters: Character[]
  currentCharacter: Character
  completedLevels: number[]
}

const CHARACTER_SHOP: Record<Character, { name: string; price: number; avatar: string; emoji: string }> = {
  doremon: { name: "Doremon", price: 0, avatar: "/avarta/doremon.jpg", emoji: "/avarta/doremon.jpg" },
  nobita: { name: "Nobita", price: 300, avatar: "/avarta/nobita.jpg", emoji: "/avarta/nobita.jpg" },
  chaien: { name: "Chaien", price: 300, avatar: "/avarta/chaien.jpg", emoji: "/avarta/chaien.jpg" },
  shizuka: { name: "Shizuka", price: 500, avatar: "/avarta/shizuka.jpg", emoji: "/avarta/shizuka.jpg" },
  goku: { name: "Goku", price: 800, avatar: "/avarta/goku.jpg", emoji: "/avarta/goku.jpg" },
  pikachu: { name: "Pikachu", price: 800, avatar: "/avarta/pikachu.jpg", emoji: "/avarta/pikachu.jpg" },
}

export default function MathDuckMaze() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mathDuckPlayerState")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Ensure currentCharacter is valid
          if (!parsed.currentCharacter || !CHARACTER_SHOP[parsed.currentCharacter as Character]) {
            parsed.currentCharacter = "doremon"
          }
          return parsed
        } catch (e) {
          console.error("[v0] Failed to parse saved player state:", e)
        }
      }
    }
    return {
      coins: 0,
      unlockedCharacters: ["doremon"] as Character[],
      currentCharacter: "doremon" as Character,
      completedLevels: [],
    }
  })

  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(180)
  const [currentLevel, setCurrentLevel] = useState(1)
  const gameMapRef = useRef<GameMap | null>(null)
  const keysPressed = useRef<Record<string, boolean>>({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const animationFrameRef = useRef<number>(0) // Track animation time
  const [showShop, setShowShop] = useState(false) // State to control shop visibility

  const [showBonusQuestion, setShowBonusQuestion] = useState(false)
  const [currentBonusQuestion, setCurrentBonusQuestion] = useState<BonusQuestion | null>(null)
  const [selectedBonusAnswer, setSelectedBonusAnswer] = useState<number | null>(null)

  const [characterImages, setCharacterImages] = React.useState<Record<string, HTMLImageElement>>({})

  React.useEffect(() => {
    const images: Record<string, HTMLImageElement> = {}
    Object.entries(CHARACTER_SHOP).forEach(([id, char]) => {
      const img = new Image()
      img.src = char.avatar
      images[id] = img
    })
    setCharacterImages(images)
  }, [])

  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = Object.entries(CHARACTER_SHOP).map(([key, char]) => {
        return new Promise<void>((resolve) => {
          const img = new Image()
          img.src = char.avatar
          img.onload = () => resolve()
          img.onerror = () => resolve() // Continue even if image fails
        })
      })
      await Promise.all(imagePromises)
    }
    loadImages()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mathDuckPlayerState", JSON.stringify(playerState))
    }
  }, [playerState])

  const LEVELS = [
    {
      id: 1,
      name: "Rừng Xanh",
      theme: {
        name: "Rừng", // Added name
        bg: "linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)", // Sky to grass
        floor: "#228B22",
        wall: "#8B4513",
        decorations: ["🌳", "🌲", "🌿", "🍃"],
      },
      timeLimit: 180,
      multipliers: [1, 2],
      walls: [
        // Outer walls
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Complex inner maze
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
        name: "Sa mạc", // Added name
        bg: "linear-gradient(180deg, #FFE4B5 0%, #DEB887 100%)", // Sandy gradient
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
        // Spiral-like maze
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
    {
      id: 3,
      name: "Đại Dương",
      theme: {
        name: "Đại dương", // Added name
        bg: "linear-gradient(180deg, #E0F6FF 0%, #0077BE 100%)", // Sky to deep ocean
        floor: "#4682B4",
        wall: "#2F4F4F",
        decorations: ["🐟", "🐠", "🦈", "🐙", "🌊"],
      },
      timeLimit: 160,
      multipliers: [5, 6],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Wave-like maze pattern
        { x: 150, y: 120, width: 100, height: 20 },
        { x: 250, y: 140, width: 20, height: 80 },
        { x: 180, y: 220, width: 90, height: 20 },
        { x: 180, y: 240, width: 20, height: 100 },
        { x: 320, y: 180, width: 20, height: 120 },
        { x: 340, y: 180, width: 120, height: 20 },
        { x: 460, y: 200, width: 20, height: 140 },
        { x: 480, y: 340, width: 100, height: 20 },
        { x: 580, y: 200, width: 20, height: 140 },
        { x: 600, y: 200, width: 150, height: 20 },
        { x: 750, y: 220, width: 20, height: 100 },
        { x: 650, y: 320, width: 100, height: 20 },
        { x: 300, y: 380, width: 150, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [{ x: 530, y: 280, reward: 70 }],
    },
    {
      id: 4,
      name: "Núi Lửa",
      theme: {
        name: "Núi lửa", // Added name
        bg: "linear-gradient(180deg, #2C1810 0%, #8B0000 100%)", // Dark to red
        floor: "#8B0000",
        wall: "#2F1810",
        decorations: ["🔥", "🌋", "💥", "🪨"],
      },
      timeLimit: 150,
      multipliers: [7, 8],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Zigzag maze with dead ends
        { x: 150, y: 100, width: 20, height: 150 },
        { x: 170, y: 100, width: 100, height: 20 },
        { x: 270, y: 120, width: 20, height: 100 },
        { x: 200, y: 220, width: 90, height: 20 },
        { x: 200, y: 240, width: 20, height: 80 },
        { x: 350, y: 150, width: 20, height: 150 },
        { x: 370, y: 150, width: 120, height: 20 },
        { x: 490, y: 170, width: 20, height: 100 },
        { x: 420, y: 270, width: 90, height: 20 },
        { x: 420, y: 290, width: 20, height: 80 },
        { x: 580, y: 120, width: 20, height: 180 },
        { x: 600, y: 200, width: 100, height: 20 },
        { x: 700, y: 140, width: 20, height: 80 },
        { x: 720, y: 140, width: 100, height: 20 },
        { x: 820, y: 160, width: 20, height: 120 },
        { x: 250, y: 350, width: 180, height: 20 },
        { x: 550, y: 380, width: 150, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [
        { x: 350, y: 400, reward: 80 },
        { x: 750, y: 380, reward: 80 },
      ],
    },
    {
      id: 5,
      name: "Tuyết Trắng",
      theme: {
        name: "Tuyết", // Added name
        bg: "linear-gradient(180deg, #B0E0E6 0%, #F0F8FF 100%)", // Sky blue to snow white
        floor: "#F0F8FF",
        wall: "#4682B4",
        decorations: ["❄️", "⛄", "🌨️", "🎿"],
      },
      timeLimit: 140,
      multipliers: [9, 10],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Snowflake-like intricate maze
        { x: 200, y: 120, width: 150, height: 20 },
        { x: 200, y: 140, width: 20, height: 80 },
        { x: 350, y: 140, width: 20, height: 120 },
        { x: 250, y: 220, width: 100, height: 20 },
        { x: 250, y: 240, width: 20, height: 100 },
        { x: 420, y: 180, width: 120, height: 20 },
        { x: 540, y: 120, width: 20, height: 80 },
        { x: 480, y: 240, width: 80, height: 20 },
        { x: 480, y: 260, width: 20, height: 100 },
        { x: 620, y: 160, width: 20, height: 140 },
        { x: 640, y: 230, width: 100, height: 20 },
        { x: 740, y: 140, width: 20, height: 110 },
        { x: 760, y: 140, width: 80, height: 20 },
        { x: 180, y: 360, width: 220, height: 20 },
        { x: 500, y: 380, width: 200, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [{ x: 680, y: 380, reward: 90 }],
    },
    {
      id: 6,
      name: "Thành Phố",
      theme: {
        name: "Thành phố", // Added name
        bg: "linear-gradient(180deg, #FF6B6B 0%, #4ECDC4 100%)", // Colorful city sunset
        floor: "#696969",
        wall: "#A9A9A9",
        decorations: ["🏢", "🚗", "🚦", "🏙️"],
      },
      timeLimit: 130,
      multipliers: [11, 12],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // City block maze
        { x: 150, y: 100, width: 100, height: 20 },
        { x: 150, y: 120, width: 20, height: 120 },
        { x: 250, y: 120, width: 20, height: 80 },
        { x: 170, y: 200, width: 100, height: 20 },
        { x: 300, y: 100, width: 20, height: 100 },
        { x: 320, y: 180, width: 100, height: 20 },
        { x: 420, y: 100, width: 20, height: 100 },
        { x: 320, y: 220, width: 120, height: 20 },
        { x: 320, y: 240, width: 20, height: 120 },
        { x: 480, y: 100, width: 100, height: 20 },
        { x: 580, y: 140, width: 20, height: 140 },
        { x: 520, y: 280, width: 80, height: 20 },
        { x: 650, y: 100, width: 20, height: 180 },
        { x: 670, y: 200, width: 100, height: 20 },
        { x: 770, y: 120, width: 20, height: 100 },
        { x: 700, y: 280, width: 20, height: 80 },
        { x: 200, y: 300, width: 180, height: 20 },
        { x: 450, y: 340, width: 200, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [
        { x: 380, y: 280, reward: 100 },
        { x: 720, y: 340, reward: 100 },
      ],
    },
    {
      id: 7,
      name: "Rừng Tối",
      theme: {
        name: "Rừng tối", // Added name
        bg: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)", // Dark forest
        floor: "#0f3460",
        wall: "#0a2342",
        decorations: ["🌑", "🦇", "👻", "🕷️"],
      },
      timeLimit: 120,
      multipliers: [1, 2, 3],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Dense forest maze
        { x: 140, y: 100, width: 80, height: 20 },
        { x: 140, y: 120, width: 20, height: 100 },
        { x: 220, y: 120, width: 20, height: 80 },
        { x: 240, y: 180, width: 80, height: 20 },
        { x: 280, y: 220, width: 60, height: 20 },
        { x: 280, y: 240, width: 20, height: 100 },
        { x: 320, y: 100, width: 20, height: 120 },
        { x: 380, y: 140, width: 100, height: 20 },
        { x: 480, y: 100, width: 20, height: 80 },
        { x: 420, y: 200, width: 80, height: 20 },
        { x: 420, y: 220, width: 20, height: 120 },
        { x: 540, y: 140, width: 20, height: 180 },
        { x: 560, y: 240, width: 100, height: 20 },
        { x: 660, y: 120, width: 20, height: 140 },
        { x: 680, y: 180, width: 100, height: 20 },
        { x: 780, y: 100, width: 20, height: 100 },
        { x: 720, y: 240, width: 20, height: 100 },
        { x: 180, y: 300, width: 150, height: 20 },
        { x: 400, y: 360, width: 180, height: 20 },
        { x: 650, y: 380, width: 120, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [{ x: 620, y: 330, reward: 120 }],
    },
    {
      id: 8,
      name: "Hang Pha Lê",
      theme: {
        name: "Pha lê", // Added name
        bg: "linear-gradient(180deg, #E0BBE4 0%, #957DAD 100%)", // Purple crystal cave
        floor: "#957DAD",
        wall: "#D291BC",
        decorations: ["💎", "✨", "🔮", "💜"],
      },
      timeLimit: 110,
      multipliers: [4, 5, 6],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Crystal cave labyrinth
        { x: 160, y: 100, width: 120, height: 20 },
        { x: 160, y: 120, width: 20, height: 100 },
        { x: 280, y: 120, width: 20, height: 60 },
        { x: 200, y: 180, width: 100, height: 20 },
        { x: 200, y: 200, width: 20, height: 120 },
        { x: 340, y: 140, width: 100, height: 20 },
        { x: 440, y: 100, width: 20, height: 80 },
        { x: 360, y: 200, width: 100, height: 20 },
        { x: 360, y: 220, width: 20, height: 140 },
        { x: 500, y: 160, width: 20, height: 120 },
        { x: 520, y: 220, width: 100, height: 20 },
        { x: 620, y: 120, width: 20, height: 120 },
        { x: 560, y: 280, width: 80, height: 20 },
        { x: 700, y: 140, width: 100, height: 20 },
        { x: 700, y: 160, width: 20, height: 140 },
        { x: 800, y: 160, width: 20, height: 80 },
        { x: 740, y: 240, width: 80, height: 20 },
        { x: 250, y: 340, width: 200, height: 20 },
        { x: 520, y: 360, width: 180, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [
        { x: 280, y: 380, reward: 130 },
        { x: 680, y: 380, reward: 130 },
      ],
    },
    {
      id: 9,
      name: "Vũ Trụ",
      theme: {
        name: "Vũ trụ", // Added name
        bg: "linear-gradient(180deg, #000428 0%, #004e92 100%)", // Deep space
        floor: "#1e3a5f",
        wall: "#0f1c2e",
        decorations: ["⭐", "🌟", "🚀", "🌙", "🪐"],
      },
      timeLimit: 100,
      multipliers: [7, 8, 9],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Space station complex maze
        { x: 150, y: 100, width: 100, height: 20 },
        { x: 150, y: 120, width: 20, height: 140 },
        { x: 250, y: 120, width: 20, height: 100 },
        { x: 170, y: 200, width: 100, height: 20 },
        { x: 190, y: 260, width: 80, height: 20 },
        { x: 190, y: 280, width: 20, height: 80 },
        { x: 310, y: 140, width: 80, height: 20 },
        { x: 390, y: 100, width: 20, height: 80 },
        { x: 330, y: 200, width: 80, height: 20 },
        { x: 330, y: 220, width: 20, height: 100 },
        { x: 450, y: 120, width: 100, height: 20 },
        { x: 550, y: 140, width: 20, height: 140 },
        { x: 480, y: 200, width: 90, height: 20 },
        { x: 480, y: 220, width: 20, height: 100 },
        { x: 620, y: 100, width: 20, height: 160 },
        { x: 640, y: 180, width: 100, height: 20 },
        { x: 740, y: 120, width: 20, height: 80 },
        { x: 680, y: 260, width: 20, height: 100 },
        { x: 760, y: 240, width: 80, height: 20 },
        { x: 840, y: 180, width: 20, height: 80 },
        { x: 250, y: 340, width: 150, height: 20 },
        { x: 500, y: 360, width: 200, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [{ x: 580, y: 320, reward: 150 }],
    },
    {
      id: 10,
      name: "Lâu Đài",
      theme: {
        name: "Lâu đài", // Added name
        bg: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)", // Golden castle
        floor: "#DAA520",
        wall: "#B8860B",
        decorations: ["👑", "🏰", "⚔️", "🛡️"],
      },
      timeLimit: 90,
      multipliers: [10, 11, 12],
      walls: [
        { x: 50, y: 50, width: 900, height: 20 },
        { x: 50, y: 50, width: 20, height: 450 },
        { x: 930, y: 50, width: 20, height: 450 },
        { x: 50, y: 480, width: 900, height: 20 },
        // Ultimate castle maze
        { x: 130, y: 100, width: 120, height: 20 },
        { x: 130, y: 120, width: 20, height: 100 },
        { x: 250, y: 120, width: 20, height: 80 },
        { x: 150, y: 180, width: 120, height: 20 },
        { x: 150, y: 200, width: 20, height: 140 },
        { x: 290, y: 140, width: 80, height: 20 },
        { x: 370, y: 100, width: 20, height: 80 },
        { x: 310, y: 200, width: 80, height: 20 },
        { x: 310, y: 220, width: 20, height: 120 },
        { x: 420, y: 140, width: 100, height: 20 },
        { x: 520, y: 100, width: 20, height: 80 },
        { x: 450, y: 200, width: 90, height: 20 },
        { x: 450, y: 220, width: 20, height: 140 },
        { x: 580, y: 140, width: 20, height: 140 },
        { x: 600, y: 200, width: 100, height: 20 },
        { x: 700, y: 120, width: 20, height: 100 },
        { x: 630, y: 260, width: 90, height: 20 },
        { x: 630, y: 280, width: 20, height: 80 },
        { x: 760, y: 160, width: 100, height: 20 },
        { x: 760, y: 180, width: 20, height: 120 },
        { x: 860, y: 180, width: 20, height: 80 },
        { x: 780, y: 240, width: 100, height: 20 },
        { x: 200, y: 300, width: 180, height: 20 },
        { x: 200, y: 320, width: 20, height: 80 },
        { x: 420, y: 340, width: 150, height: 20 },
        { x: 650, y: 360, width: 120, height: 20 },
      ],
      playerStart: { x: 100, y: 100 },
      doorPos: { x: 860, y: 420 },
      treasures: [
        { x: 280, y: 420, reward: 200 },
        { x: 550, y: 400, reward: 200 },
        { x: 800, y: 380, reward: 200 },
      ],
    },
  ]

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

    return {
      question: `${num1} × ${num2} = ?`,
      correctAnswer,
      options,
    }
  }

  const generateAnswerTiles = (problem: MathProblem): AnswerTile[] => {
    const correctAnswer = problem.correctAnswer
    const wrongAnswers = new Set<number>()

    // Generate 5-7 wrong answers
    const numWrong = 5 + Math.floor(Math.random() * 3)
    while (wrongAnswers.size < numWrong) {
      const randType = Math.random()
      let wrong: number
      if (randType < 0.3) {
        wrong = correctAnswer + (Math.floor(Math.random() * 10) + 1)
      } else if (randType < 0.6) {
        wrong = correctAnswer - (Math.floor(Math.random() * 10) + 1)
      } else {
        wrong = Math.floor(Math.random() * 81) + 1
      }
      if (wrong > 0 && wrong !== correctAnswer && wrong <= 100) {
        wrongAnswers.add(wrong)
      }
    }

    // Always include correct answer
    const allAnswers = [correctAnswer, ...Array.from(wrongAnswers)]

    return allAnswers.map((value) => ({
      x: Math.floor(Math.random() * (1000 - 100)) + 50,
      y: Math.floor(Math.random() * (600 - 100)) + 50,
      value,
      width: 40,
      height: 40,
      picked: false,
      pulseTime: Math.random() * 100,
      problemId: problem.id,
    }))
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
        table: mult, // Assign multiplier as table number
      }
    })

    const answerTiles: AnswerTile[] = []
    const usedPositions: { x: number; y: number }[] = []
    const allAnswerValues = new Set<number>()

    // Add all correct answers
    mathProblems.forEach((problem) => {
      allAnswerValues.add(problem.correctAnswer)
    })

    // Generate unique wrong answers
    mathProblems.forEach((problem) => {
      let wrongCount = 0
      let attempts = 0
      while (wrongCount < 2 && attempts < 20) {
        const offset = Math.floor(Math.random() * 10) + 1
        const wrongValue =
          Math.random() > 0.5 ? problem.correctAnswer + offset : Math.max(1, problem.correctAnswer - offset)

        if (!allAnswerValues.has(wrongValue) && wrongValue > 0 && wrongValue <= 144) {
          allAnswerValues.add(wrongValue)
          wrongCount++
        }
        attempts++
      }
    })

    // Place answer tiles
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
        problemId: "", // Placeholder, will be set later
      })
    })

    // Distribute answer tiles to problems
    const availableTiles = [...answerTiles]
    mathProblems.forEach((problem) => {
      const correctTileIndex = availableTiles.findIndex((tile) => tile.value === problem.correctAnswer)
      if (correctTileIndex !== -1) {
        const correctTile = availableTiles.splice(correctTileIndex, 1)[0]
        correctTile.problemId = problem.id
        answerTiles.find((t) => t.id === correctTile.id)!.problemId = problem.id
      }

      // Assign some random wrong answer tiles to this problem as well
      const wrongTilesToAssign = Math.min(2, availableTiles.length)
      for (let i = 0; i < wrongTilesToAssign; i++) {
        const wrongTile = availableTiles.pop()
        if (wrongTile) {
          wrongTile.problemId = problem.id
          answerTiles.find((t) => t.id === wrongTile.id)!.problemId = problem.id
        }
      }
    })

    const treasures: Treasure[] = levelConfig.treasures.map((t, idx) => ({
      x: t.x,
      y: t.y,
      width: 40, // Increased size for treasure chest
      height: 40,
      type: "treasure",
      collected: false,
      reward: t.reward,
      glowTime: 0,
      bonusQuestion: generateBonusQuestion(), // Add bonus question
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
      door: {
        x: levelConfig.doorPos.x,
        y: levelConfig.doorPos.y,
        width: 50,
        height: 50,
        locked: true,
        glowTime: 0,
      },
      theme: levelConfig.theme,
      flashEffect: { active: false, color: "", time: 0 },
    }

    gameMapRef.current = gameMap
  }

  const getRandomPosition = (
    walls: { x: number; y: number; width: number; height: number }[],
    usedPositions: { x: number; y: number }[],
    playerStart: { x: number; y: number },
  ) => {
    const maxAttempts = 200
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = 100 + Math.floor(Math.random() * 750)
      const y = 100 + Math.floor(Math.random() * 350)

      let valid = true

      // Keep away from player start
      if (Math.abs(x - playerStart.x) < 80 && Math.abs(y - playerStart.y) < 80) {
        valid = false
      }

      // Check wall collisions with larger margin
      for (const wall of walls) {
        if (
          x < wall.x + wall.width + 50 &&
          x + 40 > wall.x - 50 &&
          y < wall.y + wall.height + 50 &&
          y + 40 > wall.y - 50
        ) {
          valid = false
          break
        }
      }

      // Check spacing from other positions
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
      if (collide(futurePlayerX, wall)) {
        canMoveX = false
      }
      if (collide(futurePlayerY, wall)) {
        canMoveY = false
      }
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
          // Wrong answer - reset position only
          map.flashEffect = { active: true, color: "rgba(255, 0, 0, 0.3)", time: 0 }
          map.player.x = map.player.spawnX
          map.player.y = map.player.spawnY
          map.player.vx = 0
          map.player.vy = 0
        }
        tile.picked = true // Mark tile as picked regardless of correctness
      }
    })

    map.treasures.forEach((treasure) => {
      if (!treasure.collected && collide(map.player, treasure)) {
        // Show bonus question modal
        setCurrentBonusQuestion(treasure.bonusQuestion || null)
        setShowBonusQuestion(true)
        setGameState("paused")
        treasure.collected = true // Mark as collected (will be processed after answer)
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
        completedLevels: prev.completedLevels.includes(currentLevel)
          ? prev.completedLevels
          : [...prev.completedLevels, currentLevel],
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

    const drawBackground = () => {
      // Fill with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      const { theme } = map // Destructure theme here

      // Parse gradient colors from theme.bg
      if (theme.bg.includes("gradient")) {
        const colors = theme.bg.match(/#[0-9A-Fa-f]{6}/g) || []
        if (colors.length >= 2) {
          gradient.addColorStop(0, colors[0])
          gradient.addColorStop(1, colors[1])
        } else {
          // Fallback if only one color is found
          gradient.addColorStop(0, theme.bg || "#f0f0f0")
          gradient.addColorStop(1, theme.bg || "#d0d0d0")
        }
      } else {
        // Fallback if not a gradient
        gradient.fillStyle = theme.bg || "#f0f0f0"
      }

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw decorative elements in corners and scattered
      ctx.font = "48px Arial"
      const decorations = theme.decorations || []

      // Top corners
      ctx.fillText(decorations[0] || "🌳", 50, 80)
      ctx.fillText(decorations[1] || "🌲", canvas.width - 100, 80)

      // Bottom corners
      ctx.fillText(decorations[2] || "🌿", 50, canvas.height - 50)
      ctx.fillText(decorations[3] || "🍃", canvas.width - 100, canvas.height - 50)

      // Scattered decorations
      for (let i = 0; i < 3; i++) {
        const x = 150 + i * 250
        const y = 100 + (i % 2) * 400
        ctx.fillText(decorations[i % decorations.length], x, y)
      }
    }

    drawBackground()

    // Flash effect for correct/wrong answer
    if (map.flashEffect.active) {
      map.flashEffect.time++
      ctx.fillStyle = map.flashEffect.color
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (map.flashEffect.time > 15) {
        map.flashEffect.active = false
        map.flashEffect.time = 0
      }
    }

    ctx.shadowBlur = 8
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3

    map.walls.forEach((wall) => {
      // Determine wall color based on theme
      const wallGradient = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.height)
      const { theme } = map // Destructure theme here

      if (theme.name.includes("Rừng")) {
        wallGradient.addColorStop(0, "#2d5016")
        wallGradient.addColorStop(1, "#1a3010")
      } else if (theme.name.includes("Sa mạc")) {
        wallGradient.addColorStop(0, "#d4a574")
        wallGradient.addColorStop(1, "#8b6f47")
      } else if (theme.name.includes("Đại dương")) {
        wallGradient.addColorStop(0, "#1e90ff")
        wallGradient.addColorStop(1, "#0047ab")
      } else if (theme.name.includes("Núi lửa")) {
        wallGradient.addColorStop(0, "#ff4500")
        wallGradient.addColorStop(1, "#8b0000")
      } else if (theme.name.includes("Tuyết")) {
        wallGradient.addColorStop(0, "#e0f2f7")
        wallGradient.addColorStop(1, "#90caf9")
      } else if (theme.name.includes("Thành phố")) {
        wallGradient.addColorStop(0, "#757575")
        wallGradient.addColorStop(1, "#424242")
      } else if (theme.name.includes("Rừng tối")) {
        wallGradient.addColorStop(0, "#3e2723")
        wallGradient.addColorStop(1, "#1b0000")
      } else if (theme.name.includes("Pha lê")) {
        wallGradient.addColorStop(0, "#e1bee7")
        wallGradient.addColorStop(1, "#9c27b0")
      } else if (theme.name.includes("Vũ trụ")) {
        wallGradient.addColorStop(0, "#1a237e")
        wallGradient.addColorStop(1, "#000051")
      } else {
        // Default or Castle theme
        wallGradient.addColorStop(0, "#d4af37")
        wallGradient.addColorStop(1, "#8b6914")
      }

      ctx.fillStyle = wallGradient
      ctx.beginPath()
      ctx.roundRect(wall.x, wall.y, wall.width, wall.height, 8)
      ctx.fill()

      // Add highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(wall.x + 2, wall.y + 2, wall.width - 4, 4, 2)
      ctx.stroke()

      // Add border
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(wall.x, wall.y, wall.width, wall.height, 8)
      ctx.stroke()
    })

    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw answer tiles with pulse animation
    map.answerTiles.forEach((tile) => {
      if (tile.picked) return

      tile.pulseTime++
      const pulse = Math.sin(tile.pulseTime * 0.05) * 0.1 + 1
      const size = 40 * pulse

      ctx.save()
      ctx.translate(tile.x + 20, tile.y + 20)
      ctx.scale(pulse, pulse)

      ctx.fillStyle = "#FFEB3B"
      ctx.beginPath()
      ctx.roundRect(-20, -20, 40, 40, 8)
      ctx.fill()

      ctx.strokeStyle = "#F57C00"
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.fillStyle = "#000"
      ctx.font = "bold 22px 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(tile.value.toString(), 0, 0)

      ctx.restore()
    })

    map.treasures.forEach((treasure) => {
      if (!treasure.collected) {
        treasure.glowTime++
        const glow = Math.sin(treasure.glowTime * 0.08) * 0.3 + 1
        const bounce = Math.sin(treasure.glowTime * 0.1) * 3

        ctx.save()
        ctx.shadowBlur = 25 * glow
        ctx.shadowColor = "#FFD700"

        const cx = treasure.x + treasure.width / 2
        const cy = treasure.y + treasure.height / 2 + bounce

        // Draw treasure chest with more detail
        // Chest base (brown wood)
        ctx.fillStyle = "#8B4513"
        ctx.fillRect(treasure.x + 5, cy - 5, 30, 20)

        // Wood texture lines
        ctx.strokeStyle = "#654321"
        ctx.lineWidth = 1
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(treasure.x + 8, cy - 5 + i * 7)
          ctx.lineTo(treasure.x + 32, cy - 5 + i * 7)
          ctx.stroke()
        }

        // Chest lid (lighter brown)
        ctx.fillStyle = "#A0522D"
        ctx.fillRect(treasure.x + 5, cy - 15, 30, 12)

        // Gold decorative bands
        ctx.strokeStyle = "#FFD700"
        ctx.lineWidth = 3
        ctx.strokeRect(treasure.x + 5, treasure.y + 5, 30, 27)

        // Vertical gold band
        ctx.beginPath()
        ctx.moveTo(cx, cy - 15)
        ctx.lineTo(cx, cy + 12)
        ctx.stroke()

        // Gold lock with keyhole
        ctx.fillStyle = "#FFD700"
        ctx.beginPath()
        ctx.arc(cx, cy, 5, 0, Math.PI * 2)
        ctx.fill()

        // Keyhole
        ctx.fillStyle = "#8B4513"
        ctx.fillRect(cx - 1, cy, 2, 4)

        // Sparkle particles around chest
        for (let i = 0; i < 5; i++) {
          const angle = treasure.glowTime * 0.05 + (i * Math.PI * 2) / 5
          const sparkleX = cx + Math.cos(angle) * 25
          const sparkleY = cy + Math.sin(angle) * 20
          const sparkleSize = 2 + Math.sin(treasure.glowTime * 0.1 + i) * 1

          ctx.fillStyle = "rgba(255, 215, 0, " + (0.5 + Math.sin(treasure.glowTime * 0.1 + i) * 0.5) + ")"
          ctx.beginPath()
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }
    })

    // Draw key with bounce animation
    if (map.key.visible) {
      map.key.bounceTime++
      const bounce = Math.sin(map.key.bounceTime * 0.1) * 5

      ctx.save()
      ctx.shadowBlur = 20
      ctx.shadowColor = "#FFD700"
      ctx.font = "35px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("🔑", map.key.x + map.key.width / 2, map.key.y + map.key.height / 2 + bounce)
      ctx.restore()
    }

    map.door.glowTime++

    // Draw door base with gradient
    const doorGradient = ctx.createLinearGradient(map.door.x, map.door.y, map.door.x, map.door.y + map.door.height)

    if (map.door.locked) {
      doorGradient.addColorStop(0, "#FF1493")
      doorGradient.addColorStop(1, "#C71585")
    } else {
      doorGradient.addColorStop(0, "#90EE90")
      doorGradient.addColorStop(1, "#32CD32")
    }

    ctx.fillStyle = doorGradient
    ctx.beginPath()
    ctx.roundRect(map.door.x, map.door.y, map.door.width, map.door.height, 12)
    ctx.fill()

    // Add door panels
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 3
    const panelMargin = 8
    const panelWidth = (map.door.width - panelMargin * 3) / 2
    const panelHeight = (map.door.height - panelMargin * 3) / 2

    // Top left panel
    ctx.beginPath()
    ctx.roundRect(map.door.x + panelMargin, map.door.y + panelMargin, panelWidth, panelHeight, 6)
    ctx.stroke()

    // Top right panel
    ctx.beginPath()
    ctx.roundRect(map.door.x + panelMargin * 2 + panelWidth, map.door.y + panelMargin, panelWidth, panelHeight, 6)
    ctx.stroke()

    // Bottom left panel
    ctx.beginPath()
    ctx.roundRect(map.door.x + panelMargin, map.door.y + panelMargin * 2 + panelHeight, panelWidth, panelHeight, 6)
    ctx.stroke()

    // Bottom right panel
    ctx.beginPath()
    ctx.roundRect(
      map.door.x + panelMargin * 2 + panelWidth,
      map.door.y + panelMargin * 2 + panelHeight,
      panelWidth,
      panelHeight,
      6,
    )
    ctx.stroke()

    // Add glow effect when unlocked
    if (!map.door.locked) {
      ctx.save()
      ctx.shadowBlur = 30
      ctx.shadowColor = "#00FF00"
      ctx.strokeStyle = "#00FF00"
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.roundRect(map.door.x - 2, map.door.y - 2, map.door.width + 4, map.door.height + 4, 12)
      ctx.stroke()
      ctx.restore()
    }

    // Add door border
    ctx.strokeStyle = map.door.locked ? "#8B008B" : "#228B22"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(map.door.x, map.door.y, map.door.width, map.door.height, 12)
    ctx.stroke()

    // Draw lock/open icon
    ctx.font = "50px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "#FFF"
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 3
    const iconText = map.door.locked ? "🔒" : "🚪"
    ctx.strokeText(iconText, map.door.x + map.door.width / 2, map.door.y + map.door.height / 2)
    ctx.fillText(iconText, map.door.x + map.door.width / 2, map.door.y + map.door.height / 2)

    // Add door handle
    if (!map.door.locked) {
      ctx.fillStyle = "#DAA520"
      ctx.beginPath()
      ctx.arc(map.door.x + map.door.width * 0.75, map.door.y + map.door.height / 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = "#8B6914"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    const drawCharacter = () => {
      const char = CHARACTER_SHOP[playerState.currentCharacter]
      if (!char) return

      const img = characterImages[playerState.currentCharacter]
      if (!img || !img.complete) return

      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.ellipse(map.player.x + map.player.width / 2, map.player.y + map.player.height + 5, 18, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      // Draw character avatar with circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(
        map.player.x + map.player.width / 2,
        map.player.y + map.player.height / 2,
        map.player.width / 2 - 2,
        0,
        Math.PI * 2,
      )
      ctx.clip()
      ctx.drawImage(img, map.player.x, map.player.y, map.player.width, map.player.height)
      ctx.restore()

      // Draw animated border around character
      const borderGlow = Math.sin(Date.now() * 0.003) * 0.5 + 0.5
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + borderGlow * 0.2})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(
        map.player.x + map.player.width / 2,
        map.player.y + map.player.height / 2,
        map.player.width / 2 - 2,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    }

    drawCharacter()

    // Draw UI panels - removed from canvas as DOM elements
    // Timer panel
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`

    const timerColor = timeLeft > 60 ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 200, 200, 0.95)"
    ctx.fillStyle = timerColor
    ctx.beginPath()
    ctx.roundRect(canvas.width - 140, canvas.height - 70, 120, 55, 12)
    ctx.fill()

    ctx.strokeStyle = timeLeft > 60 ? "#333" : "#D32F2F"
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.fillStyle = timeLeft > 60 ? "#000" : "#D32F2F"
    ctx.font = "bold 32px 'Courier New', monospace"
    ctx.textAlign = "center"
    ctx.fillText(timeString, canvas.width - 80, canvas.height - 40)

    // Control buttons
    const buttonSize = 45
    const buttonY = 20
    const buttonSpacing = 12

    const buttons = [
      { icon: "💾", x: canvas.width - 160 },
      { icon: soundEnabled ? "🔊" : "🔇", x: canvas.width - 160 + buttonSize + buttonSpacing },
      { icon: "✖", x: canvas.width - 160 + 2 * (buttonSize + buttonSpacing) },
    ]

    buttons.forEach((btn) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
      ctx.beginPath()
      ctx.roundRect(btn.x, buttonY, buttonSize, buttonSize, 10)
      ctx.fill()

      ctx.strokeStyle = "#333"
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.font = "28px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(btn.icon, btn.x + buttonSize / 2, buttonY + buttonSize / 2)
    })

    // Coins display
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
    ctx.beginPath()
    ctx.roundRect(canvas.width - 160, 85, 150, 40, 10)
    ctx.fill()

    ctx.fillStyle = "#FFD700"
    ctx.font = "bold 24px 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(`💰 ${playerState.coins}`, canvas.width - 85, 105)
  }

  useEffect(() => {
    if (gameState !== "PLAYING") {
      keysPressed.current = {}
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== "PLAYING") {
      const map = gameMapRef.current
      if (map) {
        map.player.vx = 0
        map.player.vy = 0
      }
      keysPressed.current = {}
      return
    }

    const interval = setInterval(() => {
      const map = gameMapRef.current
      if (!map) return

      map.player.vx = 0
      map.player.vy = 0

      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) {
        map.player.vy = -1
      }
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) {
        map.player.vy = 1
      }
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
        map.player.vx = -1
      }
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
        map.player.vx = 1
      }

      updateGameMap()
      renderGameMap()
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [gameState, score, playerState.coins, soundEnabled, playerState.currentCharacter])

  useEffect(() => {
    if (gameState !== "PLAYING") return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const map = gameMapRef.current
          if (map) {
            map.player.vx = 0
            map.player.vy = 0
          }
          keysPressed.current = {}
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
    setTimeLeft(LEVELS.find((lvl) => lvl.id === levelNum)?.timeLimit || 180) // Use timeLimit from level config
    keysPressed.current = {}
    setGameState("PLAYING")
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "PLAYING") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const buttonSize = 45
    const buttonY = 20
    const buttonSpacing = 12

    if (x >= canvas.width - 160 && x <= canvas.width - 160 + buttonSize && y >= buttonY && y <= buttonY + buttonSize) {
      console.log("[v0] Save button clicked")
      // Implement save functionality if needed
    }

    if (
      x >= canvas.width - 160 + buttonSize + buttonSpacing &&
      x <= canvas.width - 160 + buttonSize + buttonSpacing + buttonSize &&
      y >= buttonY &&
      y <= buttonY + buttonSize
    ) {
      setSoundEnabled((prev) => !prev)
    }

    if (
      x >= canvas.width - 160 + 2 * (buttonSize + buttonSpacing) &&
      x <= canvas.width - 160 + 2 * (buttonSize + buttonSpacing) + buttonSize &&
      y >= buttonY &&
      y <= buttonY + buttonSize
    ) {
      const map = gameMapRef.current
      if (map) {
        map.player.vx = 0
        map.player.vy = 0
      }
      keysPressed.current = {}
      setGameState("LEVEL_SELECT")
    }
  }

  const handleBonusAnswer = (answer: number) => {
    const map = gameMapRef.current // Get map here to access treasures and flashEffect
    if (currentBonusQuestion && answer === currentBonusQuestion.correctAnswer) {
      // Correct answer - give coins
      // Find the reward from the treasure that triggered the question.
      // Note: This assumes only one treasure is active at a time for bonus questions.
      const triggeredTreasure = map?.treasures.find(
        (t) => t.collected && t.bonusQuestion?.question === currentBonusQuestion.question,
      )
      const reward = triggeredTreasure?.reward || 50
      setPlayerState((prev) => ({
        ...prev,
        coins: prev.coins + reward,
      }))
      setScore((prev) => prev + reward)

      // Flash green
      if (map) {
        map.flashEffect = { active: true, color: "rgba(0, 255, 0, 0.3)", time: 0 }
      }
    } else {
      // Wrong answer - no reward, flash red
      if (map) {
        map.flashEffect = { active: true, color: "rgba(255, 0, 0, 0.3)", time: 0 }
      }
    }

    setShowBonusQuestion(false)
    setCurrentBonusQuestion(null)
    setSelectedBonusAnswer(null)
    setGameState("PLAYING") // Resume game
  }

  if (gameState === "MENU") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-yellow-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-400 to-blue-300 border-4 border-blue-600 rounded-3xl">
          <div className="text-center space-y-6">
            <h1
              className="text-6xl font-black text-white drop-shadow-lg"
              style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
            >
              🎮 MÊ CUNG TOÁN HỌC
            </h1>
            <p className="text-2xl text-white font-bold">Phiêu Lưu & Giải Toán!</p>

            <div className="bg-white/90 rounded-2xl p-6 text-left space-y-3">
              <p
                className="font-bold text-xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                📖 Hướng dẫn:
              </p>
              <p className="text-lg">⌨️ WASD hoặc ⬆️⬇️⬅️➡️: Di chuyển 4 hướng</p>
              <p className="text-lg">✅ Chạm đáp án đúng: Hoàn thành câu hỏi</p>
              <p className="text-lg">❌ Chạm đáp án sai: Reset vị trí</p>
              <p className="text-lg">🔑 Giải hết toán → Nhặt chìa khóa</p>
              <p className="text-lg">🚪 Mở cửa → Sang màn mới</p>
              <p className="text-lg">💎 Tìm rương báu ẩn để nhận thêm xu!</p>
            </div>

            <Button
              onClick={() => setGameState("LEVEL_SELECT")}
              className="text-3xl px-8 py-7 w-full font-black bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 rounded-2xl"
              style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
            >
              ▶️ BẮT ĐẦU CHƠI
            </Button>

            <Button
              onClick={() => setGameState("SHOP")}
              className="text-2xl px-8 py-5 w-full font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-4 border-yellow-700 rounded-2xl"
              style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
            >
              🛒 CỬA HÀNG NHÂN VẬT
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "SHOP") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-8 bg-gradient-to-b from-purple-200 to-purple-100 border-4 border-purple-600 rounded-3xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1
                className="text-5xl font-black text-purple-800"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                🛒 CỬA HÀNG NHÂN VẬT
              </h1>
              <p className="text-2xl font-bold text-purple-600 mt-2">Xu của bạn: 💰 {playerState.coins}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(CHARACTER_SHOP).map(([key, char]) => {
                const isUnlocked = playerState.unlockedCharacters.includes(key as Character)
                const isCurrent = playerState.currentCharacter === key
                const canBuy = playerState.coins >= char.price

                return (
                  <Card
                    key={key}
                    className={`p-4 text-center border-4 rounded-2xl ${
                      isCurrent
                        ? "border-green-500 bg-green-100"
                        : isUnlocked
                          ? "border-blue-500 bg-blue-50"
                          : canBuy
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    <div className="text-6xl mb-2">{char.emoji}</div>
                    <h3
                      className="text-xl font-bold mb-2"
                      style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
                    >
                      {char.name}
                    </h3>

                    {isUnlocked ? (
                      isCurrent ? (
                        <p className="text-green-600 font-bold text-lg">✓ Đang sử dụng</p>
                      ) : (
                        <Button
                          onClick={() => {
                            setPlayerState((prev) => ({
                              ...prev,
                              currentCharacter: key as Character,
                            }))
                          }}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg rounded-xl"
                        >
                          Chọn
                        </Button>
                      )
                    ) : (
                      <>
                        <p className="text-lg font-bold mb-2">💰 {char.price} xu</p>
                        <Button
                          onClick={() => {
                            if (canBuy) {
                              setPlayerState((prev) => ({
                                ...prev,
                                coins: prev.coins - char.price,
                                unlockedCharacters: [...prev.unlockedCharacters, key as Character],
                                currentCharacter: key as Character,
                              }))
                            }
                          }}
                          disabled={!canBuy}
                          className={`w-full font-bold rounded-xl ${
                            canBuy
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {canBuy ? "Mua" : "Không đủ xu"}
                        </Button>
                      </>
                    )}
                  </Card>
                )
              })}
            </div>

            <Button
              onClick={() => setGameState("MENU")}
              className="text-2xl px-8 py-4 w-full font-bold bg-purple-500 hover:bg-purple-600 text-white border-4 border-purple-700 rounded-2xl"
              style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
            >
              ← Quay lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "LEVEL_SELECT") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-cyan-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-5xl p-8 bg-gradient-to-b from-white to-blue-50 border-4 border-blue-600 rounded-3xl">
          <div className="space-y-6">
            <div className="text-center">
              <h1
                className="text-5xl font-black text-blue-800"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                🗺️ CHỌN MÀN CHƠI
              </h1>
              <p className="text-xl font-bold text-blue-600 mt-2">
                Nhân vật: {CHARACTER_SHOP[playerState.currentCharacter].emoji}{" "}
                {CHARACTER_SHOP[playerState.currentCharacter].name}
              </p>
              <p className="text-lg font-bold text-yellow-600">💰 Xu: {playerState.coins}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {LEVELS.map((level, idx) => {
                const levelNum = level.id // Use id from level config
                const isCompleted = playerState.completedLevels.includes(levelNum)

                return (
                  <Button
                    key={levelNum}
                    onClick={() => startGame(levelNum)}
                    className={`h-24 text-xl font-black border-4 rounded-2xl ${
                      isCompleted
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-700"
                        : "bg-blue-500 hover:bg-blue-600 text-white border-blue-700"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-3xl">{levelNum}</span>
                      {isCompleted && <span className="text-sm">✓</span>}
                    </div>
                  </Button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Button
                onClick={() => setGameState("MENU")}
                className="text-2xl px-6 py-4 font-bold bg-gray-500 hover:bg-gray-600 text-white border-4 border-gray-700 rounded-2xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                ← Menu
              </Button>

              <Button
                onClick={() => setGameState("SHOP")}
                className="text-2xl px-6 py-4 font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-4 border-yellow-700 rounded-2xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                🛒 Cửa hàng
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "WIN") {
    const earnedCoins = Math.floor(score * 0.5) + 100
    const nextLevel = currentLevel + 1
    const hasNextLevel = nextLevel <= LEVELS.length

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-green-100 to-green-50 border-4 border-green-600 rounded-3xl">
          <div className="text-center space-y-6">
            <h1
              className="text-6xl font-black text-green-800"
              style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
            >
              🎉 CHIẾN THẮNG!
            </h1>
            <p className="text-3xl font-bold text-green-700">Màn {currentLevel} hoàn thành!</p>

            <div className="bg-white rounded-2xl p-6 space-y-3">
              <p className="text-2xl font-bold">Điểm số: {score}</p>
              <p className="text-2xl font-bold text-yellow-600">Nhận được: 💰 {earnedCoins} xu</p>
              <p className="text-xl">Tổng xu: 💰 {playerState.coins}</p>
            </div>

            <div className="space-y-4">
              {hasNextLevel && (
                <Button
                  onClick={() => startGame(nextLevel)}
                  className="text-3xl px-8 py-6 w-full font-black bg-blue-500 hover:bg-blue-600 text-white border-4 border-blue-700 rounded-2xl"
                  style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
                >
                  ▶️ Màn tiếp theo
                </Button>
              )}

              <Button
                onClick={() => setGameState("LEVEL_SELECT")}
                className="text-2xl px-8 py-4 w-full font-bold bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 rounded-2xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                📋 Chọn màn khác
              </Button>

              <Button
                onClick={() => setGameState("SHOP")}
                className="text-2xl px-8 py-4 w-full font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-4 border-yellow-700 rounded-2xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                🛒 Mua nhân vật mới
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "LOSE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 to-orange-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 bg-gradient-to-b from-red-100 to-red-50 border-4 border-red-600 rounded-3xl">
          <div className="text-center space-y-6">
            <h1
              className="text-6xl font-black text-red-800"
              style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
            >
              ⏰ HẾT GIỜ!
            </h1>
            <p className="text-3xl font-bold text-red-700">Màn {currentLevel}</p>

            <div className="bg-white rounded-2xl p-6">
              <p className="text-2xl font-bold">Điểm số: {score}</p>
              <p className="text-xl mt-2">Thử lại lần nữa nhé!</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => startGame(currentLevel)}
                className="text-3xl px-8 py-6 w-full font-black bg-orange-500 hover:bg-orange-600 text-white border-4 border-orange-700 rounded-2xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                🔄 Chơi lại
              </Button>

              <Button
                onClick={() => setGameState("LEVEL_SELECT")}
                className="text-2xl px-8 py-4 w-full font-bold bg-red-500 hover:bg-red-600 text-white border-4 border-red-700 rounded-2xl"
                style={{ fontFamily: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif" }}
              >
                📋 Chọn màn khác
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (showShop) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 border-4 border-purple-400">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold text-purple-800" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
              🏪 CỬA HÀNG NHÂN VẬT
            </h2>
            <button
              onClick={() => setShowShop(false)}
              className="text-4xl hover:scale-110 transition-transform text-purple-600"
            >
              ✖
            </button>
          </div>

          <div className="mb-6 text-center bg-yellow-200 py-3 px-6 rounded-2xl border-3 border-yellow-400">
            <p className="text-2xl font-bold text-yellow-800" style={{ fontFamily: "'Comic Sans MS', cursive" }}>
              💰 Xu của bạn: {playerState.coins}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
            {(Object.entries(CHARACTER_SHOP) as [Character, (typeof CHARACTER_SHOP)[Character]][]).map(
              ([charId, char]) => {
                const isUnlocked = playerState.unlockedCharacters.includes(charId)
                const isCurrent = playerState.currentCharacter === charId
                const canAfford = playerState.coins >= char.price

                return (
                  <div
                    key={charId}
                    className={`p-4 rounded-2xl border-4 transition-all ${
                      isCurrent
                        ? "bg-gradient-to-br from-green-200 to-green-300 border-green-500 shadow-lg scale-105"
                        : isUnlocked
                          ? "bg-white border-blue-400 hover:scale-105 cursor-pointer"
                          : canAfford
                            ? "bg-gray-100 border-gray-400 hover:scale-105 cursor-pointer"
                            : "bg-gray-200 border-gray-300 opacity-60"
                    }`}
                    onClick={() => {
                      if (isCurrent) return
                      if (isUnlocked) {
                        setPlayerState((prev) => ({ ...prev, currentCharacter: charId }))
                      } else if (canAfford) {
                        setPlayerState((prev) => ({
                          ...prev,
                          coins: prev.coins - char.price,
                          unlockedCharacters: [...prev.unlockedCharacters, charId],
                          currentCharacter: charId,
                        }))
                      }
                    }}
                  >
                    <div className="relative w-full aspect-square mb-2 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                      <img
                        src={char.avatar || "/placeholder.svg"}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p
                      className="text-xl font-bold text-center mb-1"
                      style={{ fontFamily: "'Comic Sans MS', cursive" }}
                    >
                      {char.name}
                    </p>

                    {isCurrent ? (
                      <p className="text-center text-green-700 font-bold text-lg">✓ ĐANG DÙNG</p>
                    ) : isUnlocked ? (
                      <p className="text-center text-blue-700 font-bold text-lg">ĐÃ MỞ KHÓA</p>
                    ) : (
                      <p className={`text-center font-bold text-lg ${canAfford ? "text-orange-600" : "text-gray-500"}`}>
                        💰 {char.price} xu
                      </p>
                    )}
                  </div>
                )
              },
            )}
          </div>
        </div>
      </div>
    )
  }

  if (showBonusQuestion && currentBonusQuestion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-400 animate-in zoom-in-95">
          <div className="text-center mb-6">
            <div className="text-7xl mb-4 animate-bounce">🎁</div>
            <h2 className="text-4xl font-bold text-purple-600 mb-2" style={{ fontFamily: "Comic Sans MS, cursive" }}>
              Rương Báu!
            </h2>
            <p className="text-gray-700 text-xl font-semibold">Trả lời đúng nhận 💎</p>
          </div>

          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-6">
            <p
              className="text-4xl font-bold text-center text-gray-800"
              style={{ fontFamily: "Comic Sans MS, cursive" }}
            >
              {currentBonusQuestion.question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {currentBonusQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedBonusAnswer(option)}
                className={`p-4 rounded-xl text-2xl font-bold transition-all ${
                  selectedBonusAnswer === option
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white scale-105 shadow-lg"
                    : "bg-white hover:bg-yellow-50 text-gray-800 hover:scale-105"
                } border-4 border-yellow-300`}
                style={{ fontFamily: "Comic Sans MS, cursive" }}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={() => selectedBonusAnswer !== null && handleBonusAnswer(selectedBonusAnswer)}
            disabled={selectedBonusAnswer === null}
            className={`w-full py-4 rounded-xl text-xl font-bold transition-all ${
              selectedBonusAnswer !== null
                ? "bg-gradient-to-r from-green-400 to-blue-500 text-white hover:scale-105 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            style={{ fontFamily: "Comic Sans MS, cursive" }}
          >
            Xác Nhận
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-3 flex-wrap justify-center max-w-4xl">
        {gameMapRef.current?.mathProblems
          .filter((p) => !p.solved)
          .map((problem) => (
            <div key={problem.id} className="bg-white rounded-2xl shadow-2xl px-6 py-4 border-4 border-orange-400">
              <p
                className="text-3xl font-bold text-gray-800 text-center"
                style={{ fontFamily: "Comic Sans MS, cursive" }}
              >
                {problem.a} × {problem.b} = ?
              </p>
              <p className="text-sm text-gray-600 text-center mt-1" style={{ fontFamily: "Comic Sans MS, cursive" }}>
                Bảng {problem.table}
              </p>
            </div>
          ))}
      </div>

      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={1000}
            height={600}
            className="border-8 border-gray-700 rounded-3xl shadow-2xl"
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  )
}
