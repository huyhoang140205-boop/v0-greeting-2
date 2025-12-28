"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"

interface RewardPopupProps {
  isOpen: boolean
  reward: number
  rewardType: "points" | "star" | "treasure"
  onClose: () => void
}

export function RewardPopup({ isOpen, reward, rewardType, onClose }: RewardPopupProps) {
  const emojis: Record<string, string> = {
    points: "💰",
    star: "⭐",
    treasure: "🎁",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-gradient-to-b from-yellow-300 to-orange-300 border-4 border-yellow-500 flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="text-8xl animate-bounce">{emojis[rewardType]}</div>
          <h2 className="text-4xl font-bold text-yellow-900">
            +{reward} {rewardType === "points" ? "Điểm" : rewardType === "star" ? "Sao" : "Rương"}
          </h2>
          <p className="text-2xl text-yellow-800">Tuyệt vời! 🎉</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
