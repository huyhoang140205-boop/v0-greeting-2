export interface GameScore {
  correct: number
  wrong: number
  stars: number
  totalScore: number
}

export function calculateScore(correct: number, wrong: number, starsCollected: number): GameScore {
  const correctScore = correct * 10
  const starBonus = starsCollected * 5
  const totalScore = correctScore + starBonus

  return {
    correct,
    wrong,
    stars: starsCollected,
    totalScore,
  }
}
