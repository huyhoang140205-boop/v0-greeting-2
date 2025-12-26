// /scripts/math-calculator.ts
// Canvas animation engine for Math Calculator Game 🎨

type SceneOptions = {
  canvasId: string
  onError?: (err: Error) => void
}

let _canvas: HTMLCanvasElement | null = null
let _ctx: CanvasRenderingContext2D | null = null
let _animationId: number | null = null
let _particles: Particle[] = []
let _lastTime = 0

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export function initMathCalculatorScene({ canvasId, onError }: SceneOptions) {
  // Chỉ chạy khi window/document tồn tại (client-side)
  if (typeof window === "undefined" || typeof document === "undefined") return

  try {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`)
    _canvas = canvas

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Failed to get 2D context")
    _ctx = ctx

    canvas.width = canvas.clientWidth
    canvas.height = 200 // banner height

    // create particles
    _particles = []
    for (let i = 0; i < 50; i++) {
      _particles.push(createParticle(canvas))
    }

    _lastTime = performance.now()
    loop()
  } catch (err: any) {
    console.error("initMathCalculatorScene error:", err)
    onError?.(err)
  }
}

function createParticle(canvas: HTMLCanvasElement): Particle {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    size: Math.random() * 3 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0,
    maxLife: 200 + Math.random() * 200,
  }
}

function loop(time?: number) {
  if (!_canvas || !_ctx) return
  const ctx = _ctx
  const canvas = _canvas
  const delta = (time ?? performance.now()) - _lastTime
  _lastTime = time ?? performance.now()

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, "#1e3a8a")
  grad.addColorStop(1, "#3b82f6")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // floating math symbols
  ctx.font = "24px monospace"
  const symbols = ["+", "-", "×", "÷", "=", "√", "π"]
  for (let i = 0; i < symbols.length; i++) {
    const x = (Date.now() / 10 + i * 90) % canvas.width
    const y = 60 + Math.sin(Date.now() / 1000 + i) * 30
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.fillText(symbols[i], x, y)
  }

  // update particles
  for (let p of _particles) {
    p.x += p.vx
    p.y += p.vy
    p.life += delta

    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height || p.life > p.maxLife) {
      Object.assign(p, createParticle(canvas))
      continue
    }

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.fill()
  }

  _animationId = requestAnimationFrame(loop)
}

export function destroyMathCalculatorScene() {
  if (_animationId) cancelAnimationFrame(_animationId)
  _animationId = null
  _particles = []
  _canvas = null
  _ctx = null
}
