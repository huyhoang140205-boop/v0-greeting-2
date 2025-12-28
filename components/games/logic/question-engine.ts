export interface QuestionData {
  id: string
  question: string
  options: string[]
  correct: string
  type: "addition" | "subtraction" | "counting"
  reward: number
}

export function generateSimpleQuestion(): QuestionData {
  const types = ["addition", "subtraction", "counting"] as const
  const type = types[Math.floor(Math.random() * types.length)]

  let question = ""
  let correct = ""
  let options: string[] = []

  if (type === "addition") {
    const a = Math.floor(Math.random() * 5) + 1
    const b = Math.floor(Math.random() * 5) + 1
    question = `${a} + ${b} = ?`
    correct = String(a + b)
    options = generateOptions(a + b)
  } else if (type === "subtraction") {
    const a = Math.floor(Math.random() * 5) + 3
    const b = Math.floor(Math.random() * a)
    question = `${a} - ${b} = ?`
    correct = String(a - b)
    options = generateOptions(a - b)
  } else {
    const count = Math.floor(Math.random() * 5) + 1
    question = `Có ${count} quả cam. Bạn thấy bao nhiêu quả?`
    correct = String(count)
    options = generateOptions(count)
  }

  return {
    id: Math.random().toString(),
    question,
    options,
    correct,
    type,
    reward: 5,
  }
}

function generateOptions(correct: number): string[] {
  const options = [String(correct)]

  // Add 3 wrong options
  for (let i = 0; i < 3; i++) {
    let wrong = correct + (Math.random() > 0.5 ? 1 : -1)
    while (wrong < 0 || options.includes(String(wrong))) {
      wrong = correct + (Math.random() > 0.5 ? 1 : -1)
    }
    options.push(String(wrong))
  }

  return options.sort(() => Math.random() - 0.5)
}
