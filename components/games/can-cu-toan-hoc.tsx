"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Item {
  id: string
  name: string
  price: number
  type: "robot" | "background" | "aura"
  color: string
}

const ITEMS: Item[] = [
  { id: "1", name: "SƠN ĐỎ NEON", price: 1, type: "robot", color: "#FF5050" },
  { id: "2", name: "NỀN TRẠM VŨ TRỤ", price: 3, type: "background", color: "#141432" },
  { id: "3", name: "HÀO QUANG CỰC QUANG", price: 5, type: "aura", color: "#9600FF" },
]

type GameState = "MENU" | "PLAY" | "WIN" | "SHOP"
type Difficulty = "DỄ" | "VỪA" | "KHÓ"

export default function CanCuToanHoc() {
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [difficulty, setDifficulty] = useState<Difficulty>("DỄ")
  const [score, setScore] = useState(0)
  const [input, setInput] = useState("")
  const [message, setMessage] = useState("Nhập phép tính và nhấn ENTER")
  const [numbers, setNumbers] = useState<number[]>([])
  const [target, setTarget] = useState(0)
  const [inventory, setInventory] = useState<string[]>([])
  const [robotColor, setRobotColor] = useState("#00FFFF")
  const [bgColor, setBgColor] = useState("#0A0A19")
  const [hasAura, setHasAura] = useState(false)

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem("canCuToanHoc")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setScore(data.score || 0)
        setInventory(data.inventory || [])
        updateAppearance(data.inventory || [])
      } catch (e) {
        console.error("Failed to load game data:", e)
      }
    }
  }, [])

  const updateAppearance = (items: string[]) => {
    items.forEach((itemName) => {
      const item = ITEMS.find((i) => i.name === itemName)
      if (item) {
        if (item.type === "robot") setRobotColor(item.color)
        if (item.type === "background") setBgColor(item.color)
        if (item.type === "aura") setHasAura(true)
      }
    })
  }

  const saveGame = () => {
    localStorage.setItem(
      "canCuToanHoc",
      JSON.stringify({
        score,
        inventory,
      }),
    )
  }

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff)
    const limit = diff === "KHÓ" ? 100 : 50
    const nums = Array.from({ length: 5 }, () => Math.floor(Math.random() * limit) + 1)
    setNumbers(nums)

    const numCount = { DỄ: 2, VỪA: 3, KHÓ: 5 }[diff]
    const selected = nums.sort(() => Math.random() - 0.5).slice(0, numCount)
    let result = selected[0]
    for (let i = 1; i < selected.length; i++) {
      if (Math.random() > 0.5) result += selected[i]
      else result -= selected[i]
    }
    setTarget(result)
    setInput("")
    setMessage("Nhập phép tính và nhấn ENTER")
    setGameState("PLAY")
  }

  const checkAnswer = () => {
    try {
      const regex = /\d+/g
      const inputNums = (input.match(regex) || []).map(Number)
      const tempNums = [...numbers]

      for (const num of inputNums) {
        const idx = tempNums.indexOf(num)
        if (idx === -1) {
          setMessage("Lỗi: Số không tồn tại!")
          return
        }
        tempNums.splice(idx, 1)
      }

      const numCount = { DỄ: 2, VỪA: 3, KHÓ: 5 }[difficulty]
      if (inputNums.length !== numCount) {
        setMessage(`Cần dùng đúng ${numCount} số!`)
        return
      }

      // eslint-disable-next-line no-eval
      const result = eval(input)
      if (result === target) {
        const points = { DỄ: 1, VỪA: 2, KHÓ: 3 }[difficulty]
        const newScore = score + points
        setScore(newScore)
        localStorage.setItem(
          "canCuToanHoc",
          JSON.stringify({
            score: newScore,
            inventory,
          }),
        )
        setGameState("WIN")
      } else {
        setMessage("Kết quả sai! Thử lại.")
      }
    } catch (e) {
      setMessage("Lỗi: Phép tính sai cú pháp!")
    }
  }

  const buyItem = (itemId: string) => {
    const item = ITEMS.find((i) => i.id === itemId)
    if (!item) return

    if (inventory.includes(item.name)) {
      updateAppearance([item.name])
      setMessage(`Đã mặc ${item.name}`)
      return
    }

    if (score >= item.price) {
      const newScore = score - item.price
      const newInventory = [...inventory, item.name]
      setScore(newScore)
      setInventory(newInventory)
      localStorage.setItem(
        "canCuToanHoc",
        JSON.stringify({
          score: newScore,
          inventory: newInventory,
        }),
      )
      updateAppearance(newInventory)
      setMessage(`Mua thành công ${item.name}!`)
    } else {
      setMessage(`Không đủ điểm! Cần ${item.price - score} điểm nữa`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      checkAnswer()
    } else if (e.key === "Backspace") {
      setInput(input.slice(0, -1))
    } else if (/[0-9+\-\s]/.test(e.key)) {
      setInput(input + e.key)
    }
  }

  // ============= MENU =============
  if (gameState === "MENU") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center space-y-8 max-w-2xl">
          <h1 className="text-6xl font-bold" style={{ color: "#00FFFF" }}>
            🏗️ CĂN CỨ TOÁN HỌC
          </h1>

          <div className="text-2xl font-bold" style={{ color: "#FFD700" }}>
            ĐIỂM TÍCH LŨY: {score}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Chọn Độ Khó</h2>
            <div className="grid grid-cols-3 gap-4">
              {(["DỄ", "VỪA", "KHÓ"] as Difficulty[]).map((diff) => (
                <Button
                  key={diff}
                  onClick={() => startGame(diff)}
                  className={`py-6 text-lg font-bold transition-all transform hover:scale-110 ${
                    diff === "DỄ"
                      ? "bg-green-500 hover:bg-green-600"
                      : diff === "VỪA"
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-red-500 hover:bg-red-600"
                  } text-white`}
                >
                  {diff}
                  <br />
                  (+{diff === "DỄ" ? 1 : diff === "VỪA" ? 2 : 3} điểm)
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setGameState("SHOP")}
            className="w-full py-6 text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
          >
            🛍️ Cửa Hàng Trang Trí
          </Button>
        </div>
      </div>
    )
  }

  // ============= SHOP =============
  if (gameState === "SHOP") {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: bgColor }}>
        <div className="max-w-4xl mx-auto space-y-6">
          <Button onClick={() => setGameState("MENU")} className="bg-gray-700 hover:bg-gray-800 text-white">
            ← Quay lại Menu
          </Button>

          <h1 className="text-4xl font-bold text-center" style={{ color: "#FFD700" }}>
            🛍️ CỬA HÀNG TRANG TRÍ
          </h1>

          <div className="grid grid-cols-1 gap-4">
            {ITEMS.map((item) => (
              <Card
                key={item.id}
                className="p-6 border-2"
                style={{ backgroundColor: "#1A1A2E", borderColor: item.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                    <p style={{ color: inventory.includes(item.name) ? "#00FF00" : "#FFD700" }} className="font-bold">
                      {inventory.includes(item.name) ? "✓ ĐÃ SỞ HỮU (Bấm để mặc)" : `GIÁ: ${item.price} ĐIỂM`}
                    </p>
                  </div>
                  <Button
                    onClick={() => buyItem(item.id)}
                    className={`px-8 py-4 font-bold transition-all ${
                      inventory.includes(item.name)
                        ? "bg-green-600 hover:bg-green-700"
                        : score >= item.price
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-600 opacity-50 cursor-not-allowed"
                    } text-white`}
                  >
                    {inventory.includes(item.name) ? "✓ Mặc" : "Mua"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ color: "#FFD700" }} className="text-center font-bold">
            {message}
          </div>
        </div>
      </div>
    )
  }

  // ============= PLAY / WIN =============
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-2xl w-full space-y-6">
        {/* Mục tiêu */}
        <div className="text-center space-y-2">
          {hasAura && (
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-purple-500 opacity-50 absolute"></div>
            </div>
          )}
          <div className="w-20 h-20 mx-auto rounded-xl" style={{ backgroundColor: robotColor }}></div>
          <h2 className="text-4xl font-bold" style={{ color: "#FFD700" }}>
            MỤC TIÊU: {target}
          </h2>
        </div>

        {/* Các số */}
        <div className="grid grid-cols-5 gap-3">
          {numbers.map((num, i) => (
            <div
              key={i}
              className="p-4 rounded-lg text-center font-bold text-lg border-2"
              style={{ backgroundColor: "#1A1A2E", borderColor: "#00FFFF", color: "#FFFFFF" }}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Input */}
        <div>
          <input
            type="text"
            value={input}
            onKeyDown={handleKeyDown}
            placeholder="Nhập phép tính..."
            className="w-full px-6 py-4 rounded-lg text-lg font-bold text-white border-2"
            style={{ backgroundColor: "#0F0F23", borderColor: "#00FFFF" }}
            autoFocus
          />
        </div>

        {/* Message */}
        <div className="text-center text-lg font-bold" style={{ color: "#00FFFF" }}>
          {message}
        </div>

        {/* Win Screen */}
        {gameState === "WIN" && (
          <div className="space-y-4 text-center">
            <h2 className="text-4xl font-bold" style={{ color: "#00FF00" }}>
              ✅ CHÍNH XÁC!
            </h2>
            <p className="text-2xl font-bold" style={{ color: "#FFD700" }}>
              +{difficulty === "DỄ" ? 1 : difficulty === "VỪA" ? 2 : 3} ĐIỂM
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => startGame(difficulty)}
                className="py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white"
              >
                Tiếp tục
              </Button>
              <Button
                onClick={() => setGameState("MENU")}
                className="py-4 text-lg font-bold bg-gray-600 hover:bg-gray-700 text-white"
              >
                Quay lại Menu
              </Button>
            </div>
          </div>
        )}

        {gameState === "PLAY" && (
          <Button
            onClick={checkAnswer}
            className="w-full py-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            Kiểm Tra (Enter)
          </Button>
        )}
      </div>
    </div>
  )
}
