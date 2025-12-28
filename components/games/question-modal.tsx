"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { QuestionData } from "./logic/question-engine"

interface QuestionModalProps {
  question: QuestionData | null
  isOpen: boolean
  onAnswer: (correct: boolean) => void
}

export function QuestionModal({ question, isOpen, onAnswer }: QuestionModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedAnswer(null)
      setSubmitted(false)
    }
  }, [isOpen])

  if (!question) return null

  const handleSubmit = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === question.correct
    setSubmitted(true)

    setTimeout(() => {
      onAnswer(isCorrect)
    }, 1500)
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md bg-gradient-to-b from-yellow-100 to-orange-100 border-4 border-yellow-400">
        <DialogHeader>
          <DialogTitle className="text-2xl text-yellow-900 text-center">❓ Câu Hỏi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question */}
          <div className="text-2xl font-bold text-center text-blue-900 bg-blue-100 rounded-lg p-4 border-3 border-blue-300">
            {question.question}
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, idx) => (
              <Button
                key={idx}
                onClick={() => !submitted && setSelectedAnswer(option)}
                className={`text-2xl font-bold py-6 transition-all ${
                  selectedAnswer === option
                    ? "bg-green-500 hover:bg-green-600 text-white scale-110"
                    : "bg-gradient-to-b from-green-200 to-green-100 hover:from-green-300 hover:to-green-200 text-green-900 border-3 border-green-400"
                }`}
                disabled={submitted}
              >
                {option}
              </Button>
            ))}
          </div>

          {/* Feedback */}
          {submitted && (
            <div
              className={`text-center text-xl font-bold py-3 rounded-lg border-3 ${
                selectedAnswer === question.correct
                  ? "bg-green-200 border-green-400 text-green-900"
                  : "bg-red-200 border-red-400 text-red-900"
              }`}
            >
              {selectedAnswer === question.correct ? "✅ Đúng rồi! 🎉" : `❌ Sai rồi! Đáp án là ${question.correct}`}
            </div>
          )}

          {/* Submit Button */}
          {!submitted && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="w-full text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white py-3"
            >
              Trả Lời 🎯
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
