// /scripts/memory-match.ts
// Canvas confetti + particle animation cho Memory Match Game

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationId: number | null = null
let lastTime = 0

// Khởi tạo canvas overlay
export function initMemoryMatchScene(containerId?: string) {
  try {
    canvas = document.createElement("canvas")
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none" // không chặn click
    canvas.style.zIndex = "1000"

    const container = containerId ? document.getElementById(containerId) : document.body
    container?.appendChild(canvas)

    ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Cannot get canvas 2D context")

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    lastTime = performance.now()
    loop()
    console.log("Memory Match scene initialized")
  } catch (err) {
    console.error("initMemoryMatchScene error:", err)
  }
}

// Khi chơi xong hoặc không cần nữa
export function destroyMemoryMatchScene() {
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  particles = []
  canvas?.remove()
  canvas = null
  ctx = null
  window.removeEventListener("resize", resizeCanvas)
  console.log("Memory Match scene destroyed")
}

// Hiệu ứng confetti khi ghép đúng thẻ
export function showConfetti(x?: number, y?: number) {
  if (!canvas) return
  const cw = canvas.width
  const ch = canvas.height
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: x ?? cw / 2,
      y: y ?? ch / 2,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * -5 - 2,
      size: Math.random() * 6 + 4,
      color: ["#f43f5e", "#facc15", "#22c55e", "#3b82f6", "#8b5cf6"][Math.floor(Math.random() * 5)],
      life: 0,
      maxLife: 60 + Math.random() * 40
    })
  }
}

// Vẽ animation
function loop(time?: number) {
  if (!canvas || !ctx) return
  const now = time ?? performance.now()
  const delta = now - lastTime
  lastTime = now

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Vẽ particle
  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.15 // gravity
    p.life += 1

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.fill()
  })

  // Loại bỏ particle cũ
  particles = particles.filter(p => p.life < p.maxLife)

  animationId = requestAnimationFrame(loop)
}

// Resize canvas khi window thay đổi
function resizeCanvas() {
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
