type Question = {
  question: string
  correct_answer: string
  options: string[]
}

type InitOpts = {
  width?: number
  height?: number
  level?: "easy" | "medium" | "hard"
  questions?: Question[]
  sprite?: HTMLImageElement
  block?: HTMLImageElement
  onScore?: (score: number) => void
  onError?: (err: Error) => void
}

let _animationId: number | null = null
let _canvas: HTMLCanvasElement | null = null
let _ctx: CanvasRenderingContext2D | null = null
let _keys: Record<string, boolean> = {}
let _handleQuestionInput = (e: KeyboardEvent) => {}

function _handleKeyDown(e: KeyboardEvent) { _keys[e.key] = true }
function _handleKeyUp(e: KeyboardEvent) { _keys[e.key] = false }

export function destroyPlatformer() {
  if (typeof window === "undefined") return
  if (_animationId) cancelAnimationFrame(_animationId)
  window.removeEventListener("keydown", _handleKeyDown)
  window.removeEventListener("keyup", _handleKeyUp)
  window.removeEventListener("keydown", _handleQuestionInput)
  _animationId = null
  _canvas = null
  _ctx = null
  _keys = {}
}

export async function initPlatformer(canvasId: string, opts: InitOpts = {}) {
  try {
    destroyPlatformer()

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
    if (!canvas) throw new Error(`Canvas not found: ${canvasId}`)
    _canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No 2D context")
    _ctx = ctx

    canvas.width = opts.width || 820
    canvas.height = opts.height || 360

    // ✅ Chờ ảnh load xong trước khi bắt đầu
    if (opts.sprite && !opts.sprite.complete) await opts.sprite.decode()
    if (opts.block && !opts.block.complete) await opts.block.decode()

    const groundY = 280
    const player = { x: 60, y: groundY - 48, w: 32, h: 48, vy: 0, jumping: false }
    const gravity = 0.9
    let score = 0
    let currentQuestion = 0
    let showQuestion = false
    let selectedAnswer: string | null = null

    const baseQuestions: Record<string, Question[]> = {
      easy: [
        { question: "3 + 2 = ?", correct_answer: "5", options: ["4", "5", "6", "7"] },
        { question: "7 - 5 = ?", correct_answer: "2", options: ["1", "2", "3", "4"] },
      ],
      medium: [
        { question: "6 × 2 = ?", correct_answer: "12", options: ["10", "11", "12", "13"] },
        { question: "9 ÷ 3 = ?", correct_answer: "3", options: ["2", "3", "4", "5"] },
      ],
      hard: [
        { question: "15 ÷ (3 + 2) = ?", correct_answer: "3", options: ["2", "3", "4", "5"] },
        { question: "√81 = ?", correct_answer: "9", options: ["7", "8", "9", "10"] },
      ],
    }

    const questions = opts.questions || baseQuestions[opts.level || "easy"]

    window.addEventListener("keydown", _handleKeyDown)
    window.addEventListener("keyup", _handleKeyUp)

    _handleQuestionInput = (e: KeyboardEvent) => {
      if (!showQuestion) return
      const q = questions[currentQuestion]
      const index = parseInt(e.key) - 1
      if (isNaN(index) || index < 0 || index >= q.options.length) return
      selectedAnswer = q.options[index]

      if (selectedAnswer === q.correct_answer) {
        score += 10
        opts.onScore?.(score)
      }
      currentQuestion++
      selectedAnswer = null
      showQuestion = false
    }
    window.addEventListener("keydown", _handleQuestionInput)

    function drawHUD() {
      if (!_ctx) return
      _ctx.fillStyle = "#fff"
      _ctx.font = "18px monospace"
      _ctx.fillText(`Score: ${score}`, 12, 24)
      _ctx.fillText(`Q: ${currentQuestion + 1}/${questions.length}`, 12, 48)
    }

    function drawPlayer() {
      if (!_ctx) return
      if (opts.sprite && opts.sprite.complete) {
        _ctx.drawImage(opts.sprite, player.x, player.y, player.w, player.h)
      } else {
        _ctx.fillStyle = "#facc15"
        _ctx.fillRect(player.x, player.y, player.w, player.h)
      }
    }

    function drawPlatform() {
      if (!_ctx) return
      if (opts.block && opts.block.complete) {
        for (let x = 0; x < canvas.width; x += 32) {
          _ctx.drawImage(opts.block, x, groundY, 32, 32)
        }
      } else {
        _ctx.fillStyle = "#334155"
        _ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY)
      }
    }

    function drawQuestion(q: Question) {
      if (!_ctx) return
      const ctx = _ctx
      ctx.fillStyle = "rgba(0,0,0,0.8)"
      ctx.fillRect(80, 60, 660, 220)
      ctx.fillStyle = "#fff"
      ctx.font = "20px sans-serif"
      ctx.fillText(q.question, 100, 100)
      q.options.forEach((opt, i) => {
        ctx.fillStyle = selectedAnswer === opt ? "#facc15" : "#fff"
        ctx.fillText(`${i + 1}. ${opt}`, 120, 140 + i * 30)
      })
      ctx.font = "14px monospace"
      ctx.fillText("→ Nhấn phím số 1-4 để chọn đáp án", 120, 250)
    }

    function update() {
      if (showQuestion) return
      if (_keys["ArrowLeft"] || _keys["a"]) player.x -= 4
      if (_keys["ArrowRight"] || _keys["d"]) player.x += 4
      if ((_keys[" "] || _keys["ArrowUp"] || _keys["w"]) && !player.jumping) {
        player.vy = -14
        player.jumping = true
      }

      player.vy += gravity
      player.y += player.vy
      if (player.y + player.h >= groundY) {
        player.y = groundY - player.h
        player.vy = 0
        player.jumping = false
      }

      if (player.x < 0) player.x = 0
      if (player.x + player.w > canvas.width) player.x = canvas.width - player.w

      if (player.x + player.w > canvas.width - 80) {
        if (currentQuestion < questions.length) {
          showQuestion = true
          player.x = 60
        } else {
          opts.onScore?.(score)
          destroyPlatformer()
        }
      }
    }

    function draw() {
      if (!_ctx) return
      _ctx.clearRect(0, 0, canvas.width, canvas.height)
      _ctx.fillStyle = "#87CEEB"
      _ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawPlatform()
      drawPlayer()
      drawHUD()
      if (showQuestion && currentQuestion < questions.length)
        drawQuestion(questions[currentQuestion])
    }

    function loop() {
      try {
        update()
        draw()
        _animationId = requestAnimationFrame(loop)
      } catch (err: any) {
        console.error("Platformer error:", err)
        opts.onError?.(err)
      }
    }

    loop()
    return { destroy: destroyPlatformer }
  } catch (err: any) {
    console.error(err)
    opts.onError?.(err)
    return { destroy: destroyPlatformer }
  }
}
