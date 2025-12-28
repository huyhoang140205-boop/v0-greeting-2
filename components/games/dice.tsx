"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DiceProps {
  onRoll: (value: number) => void
  disabled?: boolean
}

export function Dice({ onRoll, disabled }: DiceProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [diceValue, setDiceValue] = useState(0)

  const handleRoll = () => {
    setIsRolling(true)

    // Animate rolling
    let value = 0
    const interval = setInterval(() => {
      value = Math.floor(Math.random() * 6) + 1
      setDiceValue(value)
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      const finalValue = Math.floor(Math.random() * 6) + 1
      setDiceValue(finalValue)
      setIsRolling(false)
      onRoll(finalValue)
    }, 600)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`text-8xl ${isRolling ? "animate-spin" : ""}`}>
        {diceValue === 0 ? "🎲" : getDiceFace(diceValue)}
      </div>
      <Button
        onClick={handleRoll}
        disabled={disabled || isRolling}
        className="px-8 py-3 text-xl font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg"
      >
        {isRolling ? "Đang lăn..." : "Lăn xúc xắc 🎲"}
      </Button>
      {diceValue > 0 && !isRolling && <p className="text-2xl font-bold text-green-600">Được: {diceValue} ô!</p>}
    </div>
  )
}

function getDiceFace(value: number): string {
  const faces = ["", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"]
  return faces[value] || "🎲"
}
