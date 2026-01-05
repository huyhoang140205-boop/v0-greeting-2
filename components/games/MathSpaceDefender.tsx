"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"

// --- SUPABASE CONFIGURATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Slug khác để lưu điểm riêng, nhưng dùng chung logic user
const GAME_SLUG = "math-space-defender"

// --- TYPES ---

type GameState = "MENU" | "PLAYING" | "GAME_OVER" | "SHOP" | "PAUSED"
type Character = "doremon" | "nobita" | "chaien" | "shizuka" | "goku" | "pikachu"

interface PlayerState {
  coins: number
  unlockedCharacters: Character[]
  currentCharacter: Character
  highScore: number
}

// Giữ nguyên Shop giống game trước để tạo cảm giác đồng bộ
const CHARACTER_SHOP: Record<Character, { name: string; price: number; avatar: string; color: string }> = {
  doremon: { name: "Doremon", price: 0, avatar: "/avarta/doremon.jpg", color: "#3b82f6" },
  nobita: { name: "Nobita", price: 300, avatar: "/avarta/nobita.jpg", color: "#fbbf24" },
  chaien: { name: "Chaien", price: 300, avatar: "/avarta/chaien.jpg", color: "#f97316" },
  shizuka: { name: "Shizuka", price: 500, avatar: "/avarta/shizuka.jpg", color: "#ec4899" },
  goku: { name: "Goku", price: 800, avatar: "/avarta/goku.jpg", color: "#f59e0b" },
  pikachu: { name: "Pikachu", price: 800, avatar: "/avarta/pikachu.jpg", color: "#eab308" },
}

const DEFAULT_PLAYER_STATE: PlayerState = {
  coins: 0,
  unlockedCharacters: ["doremon"],
  currentCharacter: "doremon",
  highScore: 0,
}

interface Meteor {
  id: number
  x: number
  y: number
  radius: number
  value: number
  speed: number
  isCorrect: boolean
  rotation: number
}

interface Bullet {
  x: number
  y: number
  speed: number
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

interface MathQuestion {
  text: string
  answer: number
}

export default function MathSpaceDefender() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion>({ text: "2 x 2", answer: 4 })
  
  // Database
  const [userId, setUserId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [playerState, setPlayerState] = useState<PlayerState>(DEFAULT_PLAYER_STATE)
  const [characterImages, setCharacterImages] = useState<Record<string, HTMLImageElement>>({})

  // Game Refs
  const playerX = useRef(500) // Vị trí ngang của tàu
  const meteors = useRef<Meteor[]>([])
  const bullets = useRef<Bullet[]>([])
  const particles = useRef<Particle[]>([])
  const frameId = useRef(0)
  const lastShotTime = useRef(0)
  const spawnTimer = useRef(0)
  const keysPressed = useRef<Record<string, boolean>>({})
  const difficultyMultiplier = useRef(1)

  // --- DATABASE LOGIC (Tương tự game trước) ---
  useEffect(() => {
    // 1. Load Images
    const images: Record<string, HTMLImageElement> = {}
    Object.entries(CHARACTER_SHOP).forEach(([id, char]) => {
      const img = new Image()
      img.src = char.avatar
      images[id] = img
    })
    setCharacterImages(images)

    // 2. Init Session
    const initSession = async () => {
      if (typeof window !== 'undefined') {
          const localData = localStorage.getItem("mathSpacePlayer")
          if (localData) setPlayerState(JSON.parse(localData))
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      else setIsDataLoaded(true)

      const { data: gameData } = await supabase.from('game').select('id').eq('slug', GAME_SLUG).single()
      if (gameData) setGameId(gameData.id)
    }
    initSession()
  }, [])

  useEffect(() => {
    const loadFromDb = async () => {
      if (!userId || !gameId) return
      try {
        const { data } = await supabase.from('game_plays').select('metadata').eq('user_id', userId).eq('game_id', gameId).order('played_at', { ascending: false }).limit(1).single()
        if (data?.metadata) {
            setPlayerState(prev => ({ ...prev, ...data.metadata }))
        }
      } catch (e) { console.error(e) } 
      finally { setIsDataLoaded(true) }
    }
    loadFromDb()
  }, [userId, gameId])

  const saveData = async () => {
    if (typeof window !== "undefined") localStorage.setItem("mathSpacePlayer", JSON.stringify(playerState))
    if (!userId || !gameId || !isDataLoaded) return

    await supabase.from('game_plays').insert({
      user_id: userId, game_id: gameId, score, played_at: new Date().toISOString(), metadata: playerState
    })
    
    // Update Score Board
    const { data: existing } = await supabase.from('game_scores').select('id, best_score').eq('user_id', userId).eq('game_id', gameId).single()
    if (existing) {
        await supabase.from('game_scores').update({ 
            best_score: Math.max(existing.best_score, score), 
            last_score: score, 
            updated_at: new Date().toISOString() 
        }).eq('id', existing.id)
    } else {
        await supabase.from('game_scores').insert({ 
            user_id: userId, game_id: gameId, best_score: score, last_score: score 
        })
    }
  }

  // --- GAME LOGIC ---

  const generateQuestion = (currentScore: number) => {
    // Độ khó tăng dần theo điểm
    let maxNum = 5
    if (currentScore > 500) maxNum = 9
    if (currentScore > 1000) maxNum = 12
    if (currentScore > 2000) maxNum = 15

    const a = Math.floor(Math.random() * maxNum) + 2
    const b = Math.floor(Math.random() * maxNum) + 2
    
    // 30% cơ hội ra phép cộng/trừ để đổi gió, 70% phép nhân
    if (Math.random() > 0.7) {
         return { text: `${a * b} ÷ ${a}`, answer: b }
    } else {
         return { text: `${a} × ${b}`, answer: a * b }
    }
  }

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      })
    }
  }

  const spawnMeteor = (canvasWidth: number, targetAnswer: number) => {
    const isTarget = Math.random() < 0.4 // 40% tỉ lệ ra đúng đáp án
    
    let value = targetAnswer
    if (!isTarget) {
        // Tạo số sai (gần đúng để lừa)
        do {
            value = targetAnswer + Math.floor(Math.random() * 20) - 10
        } while (value === targetAnswer || value <= 0)
    }

    // Nếu trên màn hình chưa có đáp án đúng nào, bắt buộc spawn đáp án đúng
    const hasCorrect = meteors.current.some(m => m.isCorrect)
    if (!hasCorrect && Math.random() > 0.5) {
        value = targetAnswer
    }
    
    // Logic để không spawn chồng lên nhau quá nhiều
    const radius = 35 + Math.random() * 15
    const x = Math.random() * (canvasWidth - radius * 2) + radius
    
    meteors.current.push({
        id: Math.random(),
        x,
        y: -50,
        radius,
        value,
        speed: (2 + Math.random() * 2) * difficultyMultiplier.current,
        isCorrect: value === targetAnswer,
        rotation: 0
    })
  }

  // --- MAIN LOOP ---
  const update = () => {
    if (gameState !== "PLAYING") return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 1. Controls
    if (keysPressed.current["arrowleft"] || keysPressed.current["a"]) playerX.current -= 7
    if (keysPressed.current["arrowright"] || keysPressed.current["d"]) playerX.current += 7
    // Giới hạn màn hình
    playerX.current = Math.max(30, Math.min(canvas.width - 30, playerX.current))

    // Shoot (Auto shoot or Space)
    if (keysPressed.current[" "] || keysPressed.current["enter"] || keysPressed.current["click"]) {
        const now = Date.now()
        if (now - lastShotTime.current > 250) { // 250ms cooldown
            bullets.current.push({ x: playerX.current, y: canvas.height - 80, speed: 12 })
            lastShotTime.current = now
            // Nếu là click chuột, tắt flag ngay để tránh bắn liên thanh
            if (keysPressed.current["click"]) keysPressed.current["click"] = false
        }
    }

    // 2. Physics & Logic
    
    // Bullets
    for (let i = bullets.current.length - 1; i >= 0; i--) {
        const b = bullets.current[i]
        b.y -= b.speed
        if (b.y < 0) bullets.current.splice(i, 1)
    }

    // Meteors
    spawnTimer.current++
    // Tốc độ spawn tăng theo điểm
    const spawnRate = Math.max(40, 100 - Math.floor(score / 100))
    if (spawnTimer.current > spawnRate) {
        spawnMeteor(canvas.width, currentQuestion.answer)
        spawnTimer.current = 0
    }

    // Update Difficulty
    difficultyMultiplier.current = 1 + score / 2000

    for (let i = meteors.current.length - 1; i >= 0; i--) {
        const m = meteors.current[i]
        m.y += m.speed
        m.rotation += 0.02

        // Collision: Bullet vs Meteor
        let hit = false
        for (let j = bullets.current.length - 1; j >= 0; j--) {
            const b = bullets.current[j]
            const dx = b.x - m.x
            const dy = b.y - m.y
            if (Math.sqrt(dx*dx + dy*dy) < m.radius) {
                // Hit!
                bullets.current.splice(j, 1)
                createExplosion(m.x, m.y, m.isCorrect ? "#4ADE80" : "#F87171")
                
                if (m.isCorrect) {
                    setScore(s => s + 50)
                    // Next Question
                    const nextQ = generateQuestion(score + 50)
                    setCurrentQuestion(nextQ)
                    // Clear all meteors to reset field focused on new number? 
                    // No, let them fall, just update correctness
                    // Logic hay hơn: Giữ nguyên meteors, nhưng update đáp án đúng? 
                    // Cách đơn giản nhất: Xóa thiên thạch bị bắn, nếu đúng thì tạo câu hỏi mới.
                    // Các thiên thạch còn lại trên màn hình sẽ thành SAI (nếu số ko trùng câu mới)
                } else {
                    setScore(s => Math.max(0, s - 20)) // Trừ điểm nếu bắn sai
                }
                meteors.current.splice(i, 1)
                hit = true
                break
            }
        }

        if (hit) continue

        // Collision: Meteor vs Player
        const pdx = playerX.current - m.x
        const pdy = (canvas.height - 50) - m.y
        if (Math.sqrt(pdx*pdx + pdy*pdy) < m.radius + 20) {
            createExplosion(playerX.current, canvas.height - 50, "#EF4444")
            meteors.current.splice(i, 1)
            setLives(l => {
                const newLives = l - 1
                if (newLives <= 0) setGameState("GAME_OVER")
                return newLives
            })
            continue
        }

        // Out of screen
        if (m.y > canvas.height) {
            // Nếu thiên thạch rơi là đáp án đúng mà người chơi không bắn -> mất máu
            if (m.isCorrect) {
                 // Có thể phạt hoặc không. Ở đây phạt nhẹ là trừ điểm
                 setScore(s => Math.max(0, s - 10))
            }
            meteors.current.splice(i, 1)
        }
    }

    // Particles
    for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.05
        if (p.life <= 0) particles.current.splice(i, 1)
    }

    // --- DRAWING ---
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background (Space moving stars)
    const time = Date.now() * 0.0005
    ctx.fillStyle = "#0f172a" // Dark slate
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw Stars
    ctx.fillStyle = "#FFF"
    for(let i=0; i<50; i++) {
        const sx = (Math.sin(i * 132 + time) * canvas.width + canvas.width) % canvas.width
        const sy = (Math.cos(i * 53 + time * 2) * canvas.height + canvas.height) % canvas.height
        const size = (i % 3) + 1
        ctx.fillRect(sx, sy, size, size)
    }

    // Draw Player
    const charInfo = CHARACTER_SHOP[playerState.currentCharacter]
    const img = characterImages[playerState.currentCharacter]
    const py = canvas.height - 70
    
    // Thruster fire
    ctx.fillStyle = "#f59e0b"
    ctx.beginPath()
    ctx.moveTo(playerX.current - 10, py + 30)
    ctx.lineTo(playerX.current + 10, py + 30)
    ctx.lineTo(playerX.current, py + 50 + Math.random() * 10)
    ctx.fill()

    if (img && img.complete) {
        ctx.save()
        ctx.beginPath(); ctx.arc(playerX.current, py, 30, 0, Math.PI*2); ctx.clip()
        ctx.drawImage(img, playerX.current - 30, py - 30, 60, 60)
        ctx.restore()
        // Border ring
        ctx.strokeStyle = charInfo.color
        ctx.lineWidth = 4
        ctx.beginPath(); ctx.arc(playerX.current, py, 30, 0, Math.PI*2); ctx.stroke()
    } else {
        ctx.fillStyle = charInfo.color
        ctx.beginPath(); ctx.arc(playerX.current, py, 30, 0, Math.PI*2); ctx.fill()
    }

    // Draw Bullets
    ctx.fillStyle = "#38bdf8" // Light blue laser
    bullets.current.forEach(b => {
        ctx.beginPath()
        ctx.roundRect(b.x - 4, b.y, 8, 20, 4)
        ctx.fill()
        // Glow
        ctx.shadowBlur = 10; ctx.shadowColor = "#38bdf8"
        ctx.fill(); ctx.shadowBlur = 0
    })

    // Draw Meteors
    meteors.current.forEach(m => {
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(m.rotation)
        
        // Meteor Body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, m.radius)
        gradient.addColorStop(0, "#475569") // Slate 600
        gradient.addColorStop(1, "#1e293b") // Slate 800
        ctx.fillStyle = gradient
        
        // Vẽ hình dạng méo mó chút cho giống đá
        ctx.beginPath()
        const spikes = 8
        for(let i=0; i<spikes*2; i++){
            const r = m.radius - (i%2===0 ? 0 : 5)
            const a = (Math.PI / spikes) * i
            ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r)
        }
        ctx.closePath()
        ctx.fill()
        
        // Border indicating correct answer? No, make player calculate!
        // But maybe hint color slightly?
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.stroke()

        // Number
        ctx.rotate(-m.rotation) // Keep text straight
        ctx.fillStyle = "#FFF"
        ctx.font = "bold 24px monospace"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(m.value.toString(), 0, 0)
        
        ctx.restore()
    })

    // Draw Particles
    particles.current.forEach(p => {
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1.0
    })

    frameId.current = requestAnimationFrame(update)
  }

  // Handle Input
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true }
    const handleUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false }
    window.addEventListener("keydown", handleDown)
    window.addEventListener("keyup", handleUp)
    return () => {
        window.removeEventListener("keydown", handleDown)
        window.removeEventListener("keyup", handleUp)
    }
  }, [])

  // Start Loop
  useEffect(() => {
    if (gameState === "PLAYING") {
        frameId.current = requestAnimationFrame(update)
    }
    return () => cancelAnimationFrame(frameId.current)
  }, [gameState, score, currentQuestion]) // Re-bind when react state changes

  // Game Over handling
  useEffect(() => {
    if (gameState === "GAME_OVER") {
        // Cộng coin (10% score)
        const earnedCoins = Math.floor(score * 0.1)
        setPlayerState(prev => ({
            ...prev,
            coins: prev.coins + earnedCoins,
            highScore: Math.max(prev.highScore, score)
        }))
        setTimeout(saveData, 500)
    }
  }, [gameState])


  // --- UI RENDER ---

  const startGame = () => {
    setScore(0)
    setLives(3)
    setCurrentQuestion({ text: "2 + 2", answer: 4 })
    meteors.current = []
    bullets.current = []
    particles.current = []
    playerX.current = 500
    setGameState("PLAYING")
  }

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
        
        {/* TOP HUD */}
        <div className="absolute top-4 left-0 w-full flex justify-between px-8 z-10 text-white">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-600 flex gap-4">
                <div className="font-bold text-yellow-400 text-xl">🏆 {Math.max(score, playerState.highScore)}</div>
                <div className="font-bold text-green-400 text-xl">Score: {score}</div>
            </div>
            <div className="flex gap-2">
                {[...Array(lives)].map((_, i) => <span key={i} className="text-3xl animate-pulse">❤️</span>)}
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-600">
                <span className="font-bold text-yellow-400 text-xl">💰 {playerState.coins}</span>
            </div>
        </div>

        {/* GAME CANVAS */}
        <canvas 
            ref={canvasRef} 
            width={1000} 
            height={600}
            className="bg-black rounded-lg shadow-2xl border-4 border-slate-700 cursor-crosshair touch-none max-w-full max-h-full"
            onPointerDown={(e) => {
                // Hỗ trợ touch/click bắn
                keysPressed.current["click"] = true
                // Logic di chuyển bằng touch (đơn giản: tap bên trái thì sang trái...)
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                if (x < rect.width / 2) keysPressed.current["arrowleft"] = true
                else keysPressed.current["arrowright"] = true
            }}
            onPointerUp={() => {
                keysPressed.current["click"] = false
                keysPressed.current["arrowleft"] = false
                keysPressed.current["arrowright"] = false
            }}
        />

        {/* BOTTOM QUESTION HUD (Only visible playing) */}
        {gameState === "PLAYING" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-lg border-4 border-blue-400 animate-bounce">
                <h2 className="text-4xl font-black font-mono">{currentQuestion.text} = ?</h2>
            </div>
        )}

        {/* MENU SCREEN */}
        {gameState === "MENU" && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <Card className="w-full max-w-lg p-8 bg-gradient-to-br from-indigo-900 to-slate-900 border-4 border-indigo-500 rounded-3xl text-center shadow-[0_0_50px_rgba(79,70,229,0.5)]">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        🚀 GALAXY MATH
                    </h1>
                    <p className="text-slate-300 mb-8 text-lg">Bảo vệ vũ trụ bằng trí tuệ của bạn!</p>
                    
                    <div className="space-y-4">
                        <Button onClick={startGame} className="w-full h-16 text-2xl font-bold bg-green-500 hover:bg-green-600 border-b-4 border-green-700 rounded-xl">
                            CHIẾN ĐẤU NGAY ⚔️
                        </Button>
                        <Button onClick={() => setGameState("SHOP")} className="w-full h-14 text-xl font-bold bg-yellow-500 hover:bg-yellow-600 border-b-4 border-yellow-700 rounded-xl text-yellow-900">
                            SHOP NHÂN VẬT 🛒
                        </Button>
                    </div>

                    <div className="mt-6 text-sm text-slate-400">
                        <p>Hướng dẫn: Dùng phím ⬅️ ➡️ để di chuyển</p>
                        <p>SPACE hoặc Click để bắn đáp án đúng</p>
                    </div>
                </Card>
            </div>
        )}

        {/* SHOP SCREEN */}
        {gameState === "SHOP" && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-4xl h-[80vh] p-6 bg-slate-800 border-4 border-yellow-500 rounded-3xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-4xl font-black text-yellow-400">KHO VŨ KHÍ</h2>
                        <div className="bg-slate-700 px-4 py-2 rounded-full border border-yellow-500 text-yellow-400 font-bold text-xl">
                            💰 {playerState.coins}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto flex-1 p-2">
                        {Object.entries(CHARACTER_SHOP).map(([key, char]) => {
                            const isUnlocked = playerState.unlockedCharacters.includes(key as Character)
                            const isSelected = playerState.currentCharacter === key
                            
                            return (
                                <div key={key} className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${isSelected ? "bg-indigo-900 border-green-400" : "bg-slate-700 border-slate-600"}`}>
                                    <div className={`p-1 rounded-full border-2 mb-3 ${isSelected ? "border-green-400" : "border-transparent"}`}>
                                        <img src={char.avatar} className="w-20 h-20 rounded-full object-cover" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">{char.name}</h3>
                                    
                                    <div className="mt-auto w-full pt-3">
                                        {isUnlocked ? (
                                            <Button 
                                                onClick={() => {
                                                    setPlayerState(p => ({...p, currentCharacter: key as Character}))
                                                    saveData()
                                                }}
                                                disabled={isSelected}
                                                className={`w-full ${isSelected ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                                            >
                                                {isSelected ? "ĐANG CHỌN" : "TRANG BỊ"}
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => {
                                                    if (playerState.coins >= char.price) {
                                                        setPlayerState(p => ({
                                                            ...p, 
                                                            coins: p.coins - char.price,
                                                            unlockedCharacters: [...p.unlockedCharacters, key as Character],
                                                            currentCharacter: key as Character
                                                        }))
                                                        saveData()
                                                    }
                                                }}
                                                disabled={playerState.coins < char.price}
                                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                                            >
                                                MUA {char.price} 💰
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <Button onClick={() => setGameState("MENU")} className="mt-4 bg-slate-600 hover:bg-slate-500 py-6 text-xl">QUAY LẠI MENU</Button>
                </Card>
            </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameState === "GAME_OVER" && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                 <Card className="w-full max-w-md p-8 bg-slate-800 border-4 border-red-500 rounded-3xl text-center animate-in zoom-in">
                    <h1 className="text-5xl font-black text-red-500 mb-4">THẤT BẠI!</h1>
                    <div className="text-6xl mb-6">💥</div>
                    <p className="text-slate-300 text-xl mb-2">Điểm số của bạn:</p>
                    <p className="text-5xl font-bold text-white mb-6">{score}</p>
                    <p className="text-yellow-400 font-bold mb-8">+ {Math.floor(score * 0.1)} Coins</p>
                    
                    <div className="flex gap-3">
                        <Button onClick={startGame} className="flex-1 h-14 bg-red-600 hover:bg-red-700 font-bold text-lg">CHƠI LẠI</Button>
                        <Button onClick={() => setGameState("MENU")} className="flex-1 h-14 bg-slate-600 hover:bg-slate-500 font-bold text-lg">MENU</Button>
                    </div>
                 </Card>
            </div>
        )}
    </div>
  )
}
