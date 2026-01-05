"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"

// --- SUPABASE CONFIGURATION ---
// Hãy chắc chắn bạn đã điền đúng URL và Key trong .env.local hoặc ở đây
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const GAME_SLUG = "math-duck-maze"

// --- TYPES ---

type GameState = "MENU" | "LEVEL_SELECT" | "PLAYING" | "WIN" | "SHOP" | "LOSE" | "paused"
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

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
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
  particles: Particle[]
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

const CHARACTER_SHOP: Record<Character, { name: string; price: number; avatar: string }> = {
  doremon: { name: "Doremon", price: 0, avatar: "/avarta/doremon.jpg" },
  nobita: { name: "Nobita", price: 300, avatar: "/avarta/nobita.jpg" },
  chaien: { name: "Chaien", price: 300, avatar: "/avarta/chaien.jpg" },
  shizuka: { name: "Shizuka", price: 500, avatar: "/avarta/shizuka.jpg" },
  goku: { name: "Goku", price: 800, avatar: "/avarta/goku.jpg" },
  pikachu: { name: "Pikachu", price: 800, avatar: "/avarta/pikachu.jpg" },
}

const DEFAULT_PLAYER_STATE: PlayerState = {
  coins: 0,
  unlockedCharacters: ["doremon"],
  currentCharacter: "doremon",
  completedLevels: [],
}

export default function MathDuckMaze() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("MENU")
  
  // --- DATABASE STATE ---
  const [userId, setUserId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false) // QUAN TRỌNG: Chặn lưu khi chưa load xong

  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mathDuckPlayerState")
      if (saved) {
        try {
          return { ...DEFAULT_PLAYER_STATE, ...JSON.parse(saved) }
        } catch (e) {
          console.error("Local parse error", e)
        }
      }
    }
    return DEFAULT_PLAYER_STATE
  })

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

  // --- DATABASE LOGIC ---

  // 1. Init Session & Fetch Game ID
  useEffect(() => {
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        setIsDataLoaded(true) // Nếu là khách, coi như đã load xong (dùng localStorage)
      }

      const { data: gameData } = await supabase
        .from('game')
        .select('id')
        .eq('slug', GAME_SLUG)
        .single()
      
      if (gameData) setGameId(gameData.id)
    }
    initSession()
  }, [])

  // 2. Load Data from DB (Chỉ chạy khi có user và gameId)
  useEffect(() => {
    const loadFromDb = async () => {
      if (!userId || !gameId) return

      try {
        const { data, error } = await supabase
          .from('game_plays')
          .select('metadata')
          .eq('user_id', userId)
          .eq('game_id', gameId)
          .order('played_at', { ascending: false })
          .limit(1)
          .single()

        if (data && data.metadata) {
          const dbState = data.metadata as PlayerState
          // Merge deep để tránh mất trường dữ liệu mới nếu có update sau này
          setPlayerState(prev => ({
            ...prev,
            ...dbState,
            // Đảm bảo character hợp lệ
            currentCharacter: CHARACTER_SHOP[dbState.currentCharacter] ? dbState.currentCharacter : "doremon"
          }))
          console.log("✅ Loaded data from DB")
        }
      } catch (err) {
        console.error("Error loading DB:", err)
      } finally {
        setIsDataLoaded(true) // Đánh dấu đã load xong
      }
    }

    loadFromDb()
  }, [userId, gameId])

  // 3. Save Function (Chỉ save khi đã load xong data)
  const saveToDatabase = useCallback(async (manualSave = false) => {
    // Nếu chưa đăng nhập hoặc dữ liệu chưa load xong từ DB thì KHÔNG lưu đè
    if (!userId || !gameId || !isDataLoaded) {
      if (manualSave && !userId) alert("Vui lòng đăng nhập để lưu vào Cloud!")
      return
    }

    setIsSaving(true)
    try {
      const playPayload = {
        user_id: userId,
        game_id: gameId,
        score: score,
        played_at: new Date().toISOString(),
        metadata: playerState
      }

      const { error } = await supabase.from('game_plays').insert(playPayload)
      if (error) throw error

      // Cập nhật bảng điểm tổng hợp (Leaderboard)
      const { data: existingScore } = await supabase
        .from('game_scores')
        .select('id, best_score, plays_count')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single()

      if (existingScore) {
        await supabase.from('game_scores').update({
            best_score: Math.max(existingScore.best_score || 0, score),
            plays_count: (existingScore.plays_count || 0) + 1,
            last_score: score,
            last_played: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', existingScore.id)
      } else {
        await supabase.from('game_scores').insert({
            user_id: userId,
            game_id: gameId,
            best_score: score,
            plays_count: 1,
            last_score: score,
            last_played: new Date().toISOString()
          })
      }

      if (manualSave) alert("Đã lưu thành công!")
    } catch (err) {
      console.error("Save failed:", err)
      if (manualSave) alert("Lỗi khi lưu dữ liệu!")
    } finally {
      setIsSaving(false)
    }
  }, [userId, gameId, isDataLoaded, playerState, score])

  // LocalStorage Backup (Luôn chạy để user chưa login vẫn chơi được)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mathDuckPlayerState", JSON.stringify(playerState))
    }
  }, [playerState])

  // Preload Images
  useEffect(() => {
    const images: Record<string, HTMLImageElement> = {}
    Object.entries(CHARACTER_SHOP).forEach(([id, char]) => {
      const img = new Image()
      img.src = char.avatar
      images[id] = img
    })
    setCharacterImages(images)
  }, [])

  // --- GAME CONFIG DATA (LEVELS) ---
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
    // ... Copy các level khác giữ nguyên, chỉ chỉnh logic spawn bên dưới ...
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
      treasures: [{ x: 250, y: 180, reward: 60 }, { x: 750, y: 380, reward: 60 }],
    },
    {
      id: 3,
      name: "Đại Dương",
      theme: {
        name: "Đại dương",
        bg: "linear-gradient(180deg, #E0F6FF 0%, #0077BE 100%)",
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
        name: "Núi lửa",
        bg: "linear-gradient(180deg, #2C1810 0%, #8B0000 100%)",
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
      treasures: [{ x: 350, y: 400, reward: 80 }, { x: 750, y: 380, reward: 80 }],
    },
    {
      id: 5,
      name: "Tuyết Trắng",
      theme: {
        name: "Tuyết",
        bg: "linear-gradient(180deg, #B0E0E6 0%, #F0F8FF 100%)",
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
        name: "Thành phố",
        bg: "linear-gradient(180deg, #FF6B6B 0%, #4ECDC4 100%)",
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
      treasures: [{ x: 380, y: 280, reward: 100 }, { x: 720, y: 340, reward: 100 }],
    },
    {
      id: 7,
      name: "Rừng Tối",
      theme: {
        name: "Rừng tối",
        bg: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
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
        name: "Pha lê",
        bg: "linear-gradient(180deg, #E0BBE4 0%, #957DAD 100%)",
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
      treasures: [{ x: 280, y: 380, reward: 130 }, { x: 680, y: 380, reward: 130 }],
    },
    {
      id: 9,
      name: "Vũ Trụ",
      theme: {
        name: "Vũ trụ",
        bg: "linear-gradient(180deg, #000428 0%, #004e92 100%)",
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
        name: "Lâu đài",
        bg: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)",
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
      treasures: [{ x: 280, y: 420, reward: 200 }, { x: 550, y: 400, reward: 200 }, { x: 800, y: 380, reward: 200 }],
    },
  ]

  const generateBonusQuestion = (): BonusQuestion => {
    const num1 = Math.floor(Math.random() * 9) + 1
    const num2 = Math.floor(Math.random() * 9) + 1
    const correctAnswer = num1 * num2
    const wrongAnswers = new Set<number>()
    while (wrongAnswers.size < 3) {
      const wrong = correctAnswer + Math.floor(Math.random() * 20) - 10
      if (wrong > 0 && wrong !== correctAnswer) wrongAnswers.add(wrong)
    }
    const options = [correctAnswer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5)
    return { question: `${num1} × ${num2} = ?`, correctAnswer, options }
  }

  const createExplosion = (x: number, y: number, color: string, count: number): Particle[] => {
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 5 + 2
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 2,
      })
    }
    return particles
  }

  // --- IMPROVED RANDOM POSITION ---
  // Fix: Check against ALL existing items (treasures, other tiles, start, door)
  const getRandomPosition = (
    walls: MapObject[],
    forbiddenRects: MapObject[], 
    playerStart: { x: number; y: number },
    width: number = 40,
    height: number = 40,
  ) => {
    const maxAttempts = 1000 
    const buffer = 15 // Tăng buffer để không dính sát tường/vật khác

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = 70 + Math.floor(Math.random() * 800) // Giới hạn trong vùng an toàn
      const y = 70 + Math.floor(Math.random() * 350)
      
      let valid = true

      // Tránh spawn đè lên người chơi
      if (Math.abs(x - playerStart.x) < 80 && Math.abs(y - playerStart.y) < 80) valid = false

      // Tránh tường
      if (valid) {
        for (const wall of walls) {
          if (x < wall.x + wall.width + buffer && x + width > wall.x - buffer &&
              y < wall.y + wall.height + buffer && y + height > wall.y - buffer) {
            valid = false; break;
          }
        }
      }

      // Tránh các vật thể đã đặt (rương, ô đáp án khác)
      if (valid) {
        for (const rect of forbiddenRects) {
           if (x < rect.x + rect.width + buffer && x + width > rect.x - buffer &&
               y < rect.y + rect.height + buffer && y + height > rect.y - buffer) {
            valid = false; break;
          }
        }
      }

      if (valid) return { x, y }
    }
    // Fallback position
    return { x: 450, y: 250 }
  }

  const initGameMap = (levelNum: number) => {
    const levelConfig = LEVELS.find((lvl) => lvl.id === levelNum)
    if (!levelConfig) return

    const mathProblems: MathProblem[] = levelConfig.multipliers.map((mult, idx) => {
      const b = Math.floor(Math.random() * 10) + 1
      return {
        id: `problem-${idx}`, a: mult, b: b, correctAnswer: mult * b, solved: false, table: mult,
      }
    })

    const answerTiles: AnswerTile[] = []
    const allAnswerValues = new Set<number>()
    mathProblems.forEach((problem) => allAnswerValues.add(problem.correctAnswer))

    mathProblems.forEach((problem) => {
      let wrongCount = 0; let attempts = 0
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

    const treasures: Treasure[] = levelConfig.treasures.map((t) => ({
      x: t.x, y: t.y, width: 40, height: 40,
      type: "treasure", collected: false, reward: t.reward, glowTime: 0,
      bonusQuestion: generateBonusQuestion(),
    }))

    // Danh sách các vật thể cấm đè lên nhau
    // Ban đầu bao gồm Rương và Cửa
    const placedItems: MapObject[] = [...treasures, {x: levelConfig.doorPos.x, y: levelConfig.doorPos.y, width: 50, height: 50}]

    Array.from(allAnswerValues).forEach((value, idx) => {
      // Truyền danh sách placedItems để tránh đè
      const pos = getRandomPosition(levelConfig.walls, placedItems, levelConfig.playerStart, 40, 40)
      const newTile: AnswerTile = {
        x: pos.x, y: pos.y, width: 40, height: 40,
        id: `answer-${idx}`, value: value, picked: false, pulseTime: 0, problemId: "",
      }
      answerTiles.push(newTile)
      placedItems.push(newTile) // Thêm tile mới vào danh sách cấm
    })

    // Assign tiles to problems
    const availableTiles = [...answerTiles]
    mathProblems.forEach((problem) => {
      const correctTileIndex = availableTiles.findIndex((tile) => tile.value === problem.correctAnswer)
      if (correctTileIndex !== -1) {
        const correctTile = availableTiles.splice(correctTileIndex, 1)[0]
        correctTile.problemId = problem.id
        answerTiles.find((t) => t.id === correctTile.id)!.problemId = problem.id
      }
      const wrongTilesToAssign = Math.min(2, availableTiles.length)
      for (let i = 0; i < wrongTilesToAssign; i++) {
        const wrongTile = availableTiles.pop()
        if (wrongTile) {
          wrongTile.problemId = problem.id
          answerTiles.find((t) => t.id === wrongTile.id)!.problemId = problem.id
        }
      }
    })

    const gameMap: GameMap = {
      player: {
        x: levelConfig.playerStart.x, y: levelConfig.playerStart.y,
        width: 30, height: 30, vx: 0, vy: 0,
        spawnX: levelConfig.playerStart.x, spawnY: levelConfig.playerStart.y,
      },
      walls: levelConfig.walls.map((w) => ({ ...w, type: "wall" as const })),
      answerTiles: answerTiles,
      mathProblems: mathProblems,
      treasures: treasures,
      particles: [],
      key: { x: -100, y: -100, width: 30, height: 30, visible: false, collected: false, bounceTime: 0 },
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
    if (!map || !canvasRef.current) return
    const canvas = canvasRef.current

    // Update Particles
    for (let i = map.particles.length - 1; i >= 0; i--) {
        const p = map.particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
        if (p.life <= 0) map.particles.splice(i, 1);
    }

    const MOVE_SPEED = 3
    const newX = map.player.x + map.player.vx * MOVE_SPEED
    const newY = map.player.y + map.player.vy * MOVE_SPEED

    let canMoveX = true; let canMoveY = true
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
          
          // Check spawn key
          const allSolved = map.mathProblems.every((p) => p.solved)
          if (allSolved && !map.key.visible && !map.key.collected) {
            // Gom tất cả vật thể hiện có để tránh spawn key đè lên
            const currentObstacles = [
                ...map.walls,
                ...map.treasures.filter(t => !t.collected),
                ...map.answerTiles.filter(t => !t.picked), // Tránh đè lên tile chưa ăn (nếu có)
                map.door
            ]
            const keyPos = getRandomPosition(map.walls, currentObstacles, map.player, 30, 30)
            map.key.x = keyPos.x
            map.key.y = keyPos.y
            map.key.visible = true
            map.particles.push(...createExplosion(map.key.x + 15, map.key.y + 15, "#FFD700", 20));
          }
        } else {
          map.flashEffect = { active: true, color: "rgba(255, 0, 0, 0.3)", time: 0 }
          map.player.x = map.player.spawnX
          map.player.y = map.player.spawnY
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
        map.particles.push(...createExplosion(treasure.x + 20, treasure.y + 20, "#FFD700", 30));
      }
    })

    if (map.key.visible && !map.key.collected && collide(map.player, map.key)) {
      map.key.collected = true; map.key.visible = false; map.door.locked = false
      setScore((prev) => prev + 50)
      map.particles.push(...createExplosion(map.player.x + 15, map.player.y + 15, "#FFFF00", 25));
    }

    if (!map.door.locked && collide(map.player, map.door)) {
      const earnedCoins = Math.floor(score * 0.5) + 100
      setPlayerState((prev) => {
          const newState = {
            ...prev,
            coins: prev.coins + earnedCoins,
            completedLevels: prev.completedLevels.includes(currentLevel) ? prev.completedLevels : [...prev.completedLevels, currentLevel],
          }
          setTimeout(() => saveToDatabase(), 500); // Save on Win
          return newState;
      })
      map.player.vx = 0; map.player.vy = 0; keysPressed.current = {}
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

    // --- RENDER HELPERS ---
    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      const { theme } = map
      if (theme.bg.includes("gradient")) {
        const colors = theme.bg.match(/#[0-9A-Fa-f]{6}/g) || []
        if (colors.length >= 2) {
          gradient.addColorStop(0, colors[0]); gradient.addColorStop(1, colors[1]);
        } else {
          gradient.addColorStop(0, theme.bg || "#f0f0f0"); gradient.addColorStop(1, "#d0d0d0");
        }
      } else {
        gradient.fillStyle = theme.bg || "#f0f0f0"
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = "48px Arial"
      const decorations = theme.decorations || []
      ctx.fillText(decorations[0] || "🌳", 50, 80)
      ctx.fillText(decorations[1] || "🌲", canvas.width - 100, 80)
      ctx.fillText(decorations[2] || "🌿", 50, canvas.height - 50)
      ctx.fillText(decorations[3] || "🍃", canvas.width - 100, canvas.height - 50)
    }

    drawBackground()

    if (map.flashEffect.active) {
      map.flashEffect.time++
      ctx.fillStyle = map.flashEffect.color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (map.flashEffect.time > 15) map.flashEffect.active = false
    }

    // Walls
    ctx.shadowBlur = 8; ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3
    map.walls.forEach((wall) => {
      const wallGradient = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.height)
      // (Giữ nguyên logic màu tường cũ hoặc simplify nếu muốn)
      wallGradient.addColorStop(0, map.theme.wall || "#8B4513")
      wallGradient.addColorStop(1, "#222") // Darker bottom
      
      ctx.fillStyle = wallGradient
      ctx.beginPath(); ctx.roundRect(wall.x, wall.y, wall.width, wall.height, 6); ctx.fill()
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2; ctx.stroke()
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
      
      // Vẽ bóng
      ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10;
      
      const grad = ctx.createLinearGradient(-20, -20, 20, 20)
      grad.addColorStop(0, "#FFF9C4"); grad.addColorStop(1, "#FBC02D")
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.roundRect(-20, -20, 40, 40, 10); ctx.fill()
      
      ctx.strokeStyle = "#F57C00"; ctx.lineWidth = 3; ctx.stroke()
      ctx.fillStyle = "#333"; ctx.font = "bold 20px 'Comic Sans MS', sans-serif"
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(tile.value.toString(), 0, 0)
      ctx.restore()
    })

    // Treasures
    map.treasures.forEach((treasure) => {
      if (!treasure.collected) {
        treasure.glowTime++
        const bounce = Math.sin(treasure.glowTime * 0.1) * 3
        ctx.save()
        ctx.shadowBlur = 20; ctx.shadowColor = "#FFD700"
        
        // Vẽ rương đơn giản nhưng đẹp hơn
        const cx = treasure.x + treasure.width / 2
        const cy = treasure.y + treasure.height / 2 + bounce
        
        ctx.fillStyle = "#8D6E63"; ctx.fillRect(treasure.x, cy - 10, 40, 30) // Body
        ctx.fillStyle = "#FFD700"; ctx.fillRect(treasure.x + 18, cy - 10, 4, 30) // Lock strip
        ctx.fillStyle = "#5D4037"; ctx.fillRect(treasure.x, cy - 15, 40, 10) // Lid
        
        // Sparkles
        if (Math.random() > 0.9) {
            ctx.fillStyle = "#FFF"; ctx.beginPath()
            ctx.arc(treasure.x + Math.random()*40, cy + Math.random()*30 - 15, 2, 0, Math.PI*2); ctx.fill()
        }
        ctx.restore()
      }
    })

    // Particles
    map.particles.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

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
    const doorGradient = ctx.createLinearGradient(map.door.x, map.door.y, map.door.x, map.door.y + map.door.height)
    if (map.door.locked) {
        doorGradient.addColorStop(0, "#FF4081"); doorGradient.addColorStop(1, "#880E4F")
    } else {
        doorGradient.addColorStop(0, "#69F0AE"); doorGradient.addColorStop(1, "#00C853")
    }
    ctx.fillStyle = doorGradient
    ctx.beginPath(); ctx.roundRect(map.door.x, map.door.y, map.door.width, map.door.height, 8); ctx.fill()
    ctx.strokeStyle = "#FFF"; ctx.lineWidth = 2; ctx.stroke()
    
    ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
    ctx.fillText(map.door.locked ? "🔒" : "🚪", map.door.x + map.door.width/2, map.door.y + map.door.height/2)

    // Player
    const char = CHARACTER_SHOP[playerState.currentCharacter]
    if (char) {
        const img = characterImages[playerState.currentCharacter]
        if (img && img.complete) {
            ctx.save()
            // Shadow under player
            ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath()
            ctx.ellipse(map.player.x + 15, map.player.y + 30, 12, 5, 0, 0, Math.PI*2); ctx.fill()
            
            // Player image
            ctx.beginPath(); ctx.arc(map.player.x + 15, map.player.y + 15, 15, 0, Math.PI*2); ctx.clip()
            ctx.drawImage(img, map.player.x, map.player.y, 30, 30)
            ctx.restore()
            
            // Border
            ctx.strokeStyle = "#FFF"; ctx.lineWidth = 2; ctx.beginPath()
            ctx.arc(map.player.x + 15, map.player.y + 15, 15, 0, Math.PI*2); ctx.stroke()
        } else {
             ctx.fillStyle = "red"; ctx.fillRect(map.player.x, map.player.y, 30, 30)
        }
    }

    // UI Overlay (Timer, Coins, Buttons)
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`

    // Timer Box
    ctx.fillStyle = timeLeft > 60 ? "rgba(0,0,0,0.6)" : "rgba(200,0,0,0.8)"
    ctx.beginPath(); ctx.roundRect(canvas.width - 130, canvas.height - 60, 110, 45, 10); ctx.fill()
    ctx.fillStyle = "#FFF"; ctx.font = "bold 28px monospace"; ctx.textAlign = "center"
    ctx.fillText(timeString, canvas.width - 75, canvas.height - 30)

    // Coin Box
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.beginPath()
    ctx.roundRect(canvas.width - 160, 85, 140, 40, 10); ctx.fill()
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 22px Arial"
    ctx.fillText(`💰 ${playerState.coins}`, canvas.width - 90, 112)

    // Buttons
    const btnSize = 40; const btnY = 20; const spacing = 10;
    const buttons = [
      { icon: isSaving ? "⏳" : "💾", x: canvas.width - 160, color: "#4CAF50" },
      { icon: soundEnabled ? "🔊" : "🔇", x: canvas.width - 160 + btnSize + spacing, color: "#2196F3" },
      { icon: "✖", x: canvas.width - 160 + 2 * (btnSize + spacing), color: "#F44336" },
    ];
    buttons.forEach((btn) => {
      ctx.fillStyle = btn.color; ctx.beginPath(); ctx.roundRect(btn.x, btnY, btnSize, btnSize, 8); ctx.fill()
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.roundRect(btn.x, btnY, btnSize, btnSize/2, 8); ctx.fill()
      ctx.fillStyle = "#FFF"; ctx.font = "20px Arial"; ctx.fillText(btn.icon, btn.x + btnSize/2, btnY + btnSize/2 + 7);
    });
  }

  // --- GAME LOOP ---
  useEffect(() => {
    if (gameState !== "PLAYING") {
      keysPressed.current = {}
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true }
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

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

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      clearInterval(interval)
    }
  }, [gameState, score, playerState, soundEnabled, isSaving])

  // Timer Loop
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
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left; const y = e.clientY - rect.top

    const btnSize = 40; const btnY = 20; const spacing = 10;
    const btn1X = canvas.width - 160;
    const btn2X = btn1X + btnSize + spacing;
    const btn3X = btn2X + btnSize + spacing;

    if (x >= btn1X && x <= btn1X + btnSize && y >= btnY && y <= btnY + btnSize) saveToDatabase(true)
    if (x >= btn2X && x <= btn2X + btnSize && y >= btnY && y <= btnY + btnSize) setSoundEnabled(p => !p)
    if (x >= btn3X && x <= btn3X + btnSize && y >= btnY && y <= btnY + btnSize) setGameState("LEVEL_SELECT")
  }

  const handleBonusAnswer = (answer: number) => {
    const map = gameMapRef.current
    if (currentBonusQuestion && answer === currentBonusQuestion.correctAnswer) {
        // Tìm rương vừa mở để xóa logic collected
        setPlayerState((prev) => ({ ...prev, coins: prev.coins + 50 }))
        setScore((prev) => prev + 50)
        if (map) map.flashEffect = { active: true, color: "rgba(0, 255, 0, 0.3)", time: 0 }
    } else {
        if (map) map.flashEffect = { active: true, color: "rgba(255, 0, 0, 0.3)", time: 0 }
    }
    setShowBonusQuestion(false); setCurrentBonusQuestion(null); setSelectedBonusAnswer(null); setGameState("PLAYING")
  }

  // --- RENDER SCREENS (Menu, Shop, etc.) ---
  
  if (gameState === "MENU") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <Card className="w-full max-w-2xl p-8 bg-white/90 backdrop-blur-sm border-4 border-indigo-600 rounded-3xl shadow-2xl">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-black text-indigo-800 drop-shadow-md" style={{ fontFamily: "Comic Sans MS" }}>
              🗺️ GIẢI TOÁN MÊ CUNG
            </h1>
            <p className="text-2xl text-purple-600 font-bold">Thử thách trí tuệ & sự khéo léo!</p>

            <div className="bg-blue-50 rounded-2xl p-6 text-left space-y-2 border-2 border-blue-200">
              <p className="font-bold text-xl text-blue-800">📖 Cách chơi:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Di chuyển bằng phím <span className="font-bold bg-gray-200 px-2 rounded">WASD</span> hoặc <span className="font-bold bg-gray-200 px-2 rounded">Mũi tên</span></li>
                <li>Tìm đáp án đúng cho các phép tính đang hiển thị.</li>
                <li>Tránh đáp án sai nếu không muốn bị reset vị trí!</li>
                <li>Mở <b>Rương</b> để kiếm thêm xu mua nhân vật.</li>
                <li>Sau khi giải hết toán, tìm <b>Chìa Khóa</b> để mở cửa.</li>
              </ul>
            </div>

            <Button onClick={() => setGameState("LEVEL_SELECT")} className="w-full text-2xl py-8 font-black bg-green-500 hover:bg-green-600 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all">
              ▶️ BẮT ĐẦU NGAY
            </Button>
            <Button onClick={() => setGameState("SHOP")} className="w-full text-xl py-6 font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-xl shadow-[0_4px_0_rgb(202,138,4)] active:shadow-none active:translate-y-1 transition-all">
              🛒 CỬA HÀNG NHÂN VẬT
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (gameState === "SHOP") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-orange-400 p-4 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-6 bg-white border-4 border-yellow-600 rounded-3xl shadow-2xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-4xl font-black text-yellow-800">🛒 CỬA HÀNG</h1>
                <div className="bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-400 font-bold text-yellow-800 text-xl">
                    💰 {playerState.coins} xu
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto p-2 flex-1">
              {Object.entries(CHARACTER_SHOP).map(([key, char]) => {
                const isUnlocked = playerState.unlockedCharacters.includes(key as Character)
                const isCurrent = playerState.currentCharacter === key
                const canBuy = playerState.coins >= char.price

                return (
                  <div key={key} 
                    className={`relative p-4 rounded-xl border-4 transition-all flex flex-col items-center
                    ${isCurrent ? "border-green-500 bg-green-50 shadow-lg scale-95" : "border-gray-200 bg-gray-50 hover:border-blue-400"}`}
                  >
                    <img src={char.avatar} alt={char.name} className="w-24 h-24 rounded-full border-4 border-white shadow-sm object-cover mb-3" />
                    <h3 className="font-bold text-lg mb-1">{char.name}</h3>
                    
                    {isUnlocked ? (
                        isCurrent ? 
                        <span className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-sm">✓ Đang dùng</span> :
                        <Button onClick={() => {
                            setPlayerState(p => ({ ...p, currentCharacter: key as Character }));
                            setTimeout(() => saveToDatabase(), 500);
                        }} className="bg-blue-500 hover:bg-blue-600 w-full h-10">Chọn</Button>
                    ) : (
                        <Button onClick={() => {
                            if (canBuy) {
                                setPlayerState(p => ({ ...p, coins: p.coins - char.price, unlockedCharacters: [...p.unlockedCharacters, key as Character], currentCharacter: key as Character }));
                                setTimeout(() => saveToDatabase(), 500);
                            }
                        }} disabled={!canBuy} className={canBuy ? "bg-green-600 hover:bg-green-700 w-full" : "bg-gray-400 w-full"}>
                            💰 {char.price}
                        </Button>
                    )}
                  </div>
                )
              })}
            </div>
            <Button onClick={() => setGameState("MENU")} className="mt-4 bg-gray-500 hover:bg-gray-600 w-full text-xl py-6">← Quay lại Menu</Button>
        </Card>
      </div>
    )
  }

  if (gameState === "LEVEL_SELECT") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-cyan-300 p-4 flex items-center justify-center">
        <Card className="w-full max-w-5xl p-8 bg-white/90 border-4 border-blue-600 rounded-3xl shadow-xl">
            <h1 className="text-5xl font-black text-center text-blue-800 mb-6">CHỌN MÀN CHƠI</h1>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {LEVELS.map((level) => {
                const isCompleted = playerState.completedLevels.includes(level.id)
                return (
                  <Button key={level.id} onClick={() => startGame(level.id)}
                    className={`h-24 text-2xl font-black border-b-4 rounded-xl transition-all active:border-b-0 active:translate-y-1 ${
                      isCompleted ? "bg-green-500 border-green-700 hover:bg-green-600" : "bg-blue-500 border-blue-700 hover:bg-blue-600"
                    }`}
                  >
                    {level.id} {isCompleted && "⭐"}
                  </Button>
                )
              })}
            </div>
            <Button onClick={() => setGameState("MENU")} className="w-full bg-gray-500 hover:bg-gray-600 text-xl py-6 rounded-xl border-b-4 border-gray-700">← Về Menu</Button>
        </Card>
      </div>
    )
  }

  // Helper cho màn hình thắng/thua
  const EndScreen = ({ type }: { type: "WIN" | "LOSE" }) => (
    <div className={`min-h-screen p-4 flex items-center justify-center bg-gradient-to-br ${type === "WIN" ? "from-green-400 to-emerald-600" : "from-red-500 to-orange-600"}`}>
        <Card className="w-full max-w-lg p-8 bg-white border-4 rounded-3xl shadow-2xl text-center space-y-6">
            <h1 className={`text-6xl font-black ${type === "WIN" ? "text-green-600" : "text-red-600"}`}>
                {type === "WIN" ? "CHIẾN THẮNG!" : "HẾT GIỜ!"}
            </h1>
            <p className="text-2xl font-bold text-gray-700">Điểm: {score}</p>
            {type === "WIN" && <p className="text-xl text-yellow-600 font-bold">+ 💰 {Math.floor(score * 0.5) + 100} xu</p>}
            
            <div className="flex flex-col gap-3">
                {type === "WIN" && currentLevel < LEVELS.length && (
                    <Button onClick={() => startGame(currentLevel + 1)} className="bg-blue-500 hover:bg-blue-600 text-xl py-6 border-b-4 border-blue-700">▶️ Màn kế tiếp</Button>
                )}
                <Button onClick={() => startGame(currentLevel)} className="bg-orange-500 hover:bg-orange-600 text-xl py-6 border-b-4 border-orange-700">🔄 Chơi lại</Button>
                <Button onClick={() => setGameState("LEVEL_SELECT")} className="bg-gray-500 hover:bg-gray-600 text-xl py-6 border-b-4 border-gray-700">📋 Chọn màn</Button>
            </div>
        </Card>
    </div>
  )

  if (gameState === "WIN") return <EndScreen type="WIN" />
  if (gameState === "LOSE") return <EndScreen type="LOSE" />

  if (showBonusQuestion && currentBonusQuestion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <Card className="w-full max-w-md p-6 bg-gradient-to-b from-purple-100 to-white border-4 border-purple-500 rounded-3xl shadow-2xl animate-in zoom-in-95">
            <h2 className="text-3xl font-bold text-center text-purple-800 mb-4">🎁 CÂU HỎI THƯỞNG</h2>
            <div className="bg-purple-600 text-white text-4xl font-bold text-center py-8 rounded-2xl mb-6 shadow-inner">
                {currentBonusQuestion.question}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {currentBonusQuestion.options.map((opt, idx) => (
                    <Button key={idx} onClick={() => handleBonusAnswer(opt)} className="text-2xl h-16 bg-white text-purple-900 border-2 border-purple-200 hover:bg-purple-100 hover:scale-105 transition-all">
                        {opt}
                    </Button>
                ))}
            </div>
        </Card>
      </div>
    )
  }

  // MAIN GAME RENDER
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 flex items-center justify-center">
      {/* Math Problems Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {gameMapRef.current?.mathProblems.filter((p) => !p.solved).map((problem) => (
            <div key={problem.id} className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border-2 border-orange-400 shadow-lg animate-in slide-in-from-top-5">
              <p className="text-2xl font-black text-gray-800">{problem.a} × {problem.b} = ?</p>
            </div>
        ))}
      </div>

      <canvas ref={canvasRef} width={1000} height={600} onClick={handleCanvasClick}
        className="bg-black border-4 border-gray-600 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer max-w-full max-h-full"
      />
    </div>
  )
}
