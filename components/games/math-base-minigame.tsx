"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { taoManMoi } from "./logic/math-base"

interface MathBaseMinigameProps {
  onComplete: (score: number) => void
  difficulty?: "DỄ" | "VỪA" | "KHÓ"
}

export function MathBaseMinigame({ onComplete, difficulty = "VỪA" }: MathBaseMinigameProps) {
  const [theSo, setTheSo] = useState<number[]>([])
  const [mucTieu, setMucTieu] = useState(0)
  const [nhap, setNhap] = useState("")
  const [thongBao, setThongBao] = useState("")
  const [score, setScore] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)

  useEffect(() => {
    startNewQuestion()
  }, [])

  const startNewQuestion = () => {
    const man = taoManMoi(difficulty)
    setTheSo(man.theSo)
    setMucTieu(man.mucTieu)
    setNhap("")
    setThongBao("Nhập phép tính rồi Enter")
  }

  const kiemTra = () => {
    try {
      const result = Function('"use strict"; return (' + nhap + ")")()
      if (result === mucTieu) {
        const cong = { DỄ: 1, VỪA: 2, KHÓ: 3 }[difficulty]
        const diemMoi = score + cong * 10
        setScore(diemMoi)
        setQuestionsAnswered(questionsAnswered + 1)
        setThongBao("✅ Chính xác!")
        setTimeout(startNewQuestion, 1000)
      } else {
        setThongBao(`❌ Sai kết quả! Đáp án là ${mucTieu}`)
      }
    } catch {
      setThongBao("❌ Sai cú pháp!")
    }
  }

  const handleComplete = () => {
    onComplete(score)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-screen bg-gradient-to-br from-cyan-400 to-blue-600">
      <h2 className="text-4xl font-bold text-white drop-shadow-lg">✨ CĂN CỨ TOÁN HỌC ✨</h2>

      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-white text-center">
        <p className="text-sm opacity-90">
          Độ khó: <span className="font-bold">{difficulty}</span>
        </p>
        <h3 className="text-5xl font-bold mt-4 mb-2">MỤC TIÊU: {mucTieu}</h3>
        <p className="text-sm opacity-90">Các số: {theSo.join(" ")}</p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center max-w-xs">
        {theSo.map((n, i) => (
          <div
            key={i}
            className="w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-lg bg-white/30 text-white border-2 border-white"
          >
            {n}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={nhap}
        onChange={(e) => setNhap(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && kiemTra()}
        placeholder="Nhập phép tính (ví dụ: 5+3*2)"
        className="px-6 py-3 rounded-lg text-lg text-black font-mono w-full max-w-xs text-center"
        autoFocus
      />

      <p className={`text-xl font-bold ${thongBao.includes("✅") ? "text-green-300" : "text-yellow-300"}`}>
        {thongBao}
      </p>

      <div className="flex gap-4">
        <Button onClick={kiemTra} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 text-lg">
          ✓ Kiểm tra
        </Button>
        <Button
          onClick={handleComplete}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 text-lg"
        >
          🏁 Hoàn thành ({questionsAnswered} câu)
        </Button>
      </div>

      <div className="text-white text-center text-2xl font-bold mt-4">💰 Điểm: {score}</div>
    </div>
  )
}
