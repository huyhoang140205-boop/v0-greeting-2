import React, { useRef, useEffect, useState } from "react";

export default function RabbitMathGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [question, setQuestion] = useState("? + ? = ?");
  const [currentAnswer, setCurrentAnswer] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const player = useRef({ x: 175, y: 500, w: 60, h: 60, speed: 7 }).current;
  const items = useRef<any[]>([]).current;
  const spawnTimer = useRef(0);
  const speed = useRef(2);
  const move = useRef({ left: false, right: false });

  // ---- Start / Restart ----
  function startGame() {
    setScore(0);
    setLives(3);
    items.length = 0;
    speed.current = 2;
    setIsGameOver(false);
    setIsPlaying(true);
    generateQuestion();
  }

  // ---- Question generation ----
  function generateQuestion() {
    const op = Math.random() > 0.5 ? "+" : "-";
    let a = 0, b = 0;
    if (op === "+") {
      a = Math.floor(Math.random() * 10);
      b = Math.floor(Math.random() * 10);
      setCurrentAnswer(a + b);
    } else {
      a = Math.floor(Math.random() * 10) + 5;
      b = Math.floor(Math.random() * a);
      setCurrentAnswer(a - b);
    }
    setQuestion(`${a} ${op} ${b} = ?`);
  }

  // ---- Spawn carrot item ----
  function spawnItem() {
    // don't spawn if game ended
    if (!isPlaying) return;

    let value;
    if (Math.random() < 0.4) {
      value = currentAnswer;
    } else {
      value = Math.floor(Math.random() * 20);
      if (value === currentAnswer) value++;
    }

    items.push({
      x: Math.random() * 350,
      y: -50,
      value,
      w: 50,
      h: 70,
    });
  }

  // ---- Update game state ----
  function update() {
    if (!isPlaying) return;

    // Move player
    if (move.current.left && player.x > 0) player.x -= player.speed;
    if (move.current.right && player.x < 340) player.x += player.speed;

    // Spawn timer
    spawnTimer.current++;
    if (spawnTimer.current > 60) {
      spawnItem();
      spawnTimer.current = 0;
    }

    // Update items & collisions
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      it.y += speed.current;

      // Collision check
      if (
        player.x < it.x + it.w &&
        player.x + player.w > it.x &&
        player.y < it.y + it.h &&
        player.y + player.h > it.y
      ) {
        if (it.value === currentAnswer) {
          setScore((s) => s + 10);
          speed.current += 0.2;
          generateQuestion();
          // clear remaining items for new question
          items.length = 0;
        } else {
          // Decrease lives but clamp >= 0 and handle game over exactly once
          setLives((prevLives) => {
            const next = Math.max(0, prevLives - 1);
            if (next === 0) {
              // trigger game over
              setIsPlaying(false);
              setIsGameOver(true);
            }
            return next;
          });
        }
        items.splice(i, 1);
        return; // early return to avoid continuing loop after mutation
      }

      // Remove off-screen
      if (it.y > 600) {
        items.splice(i, 1);
        i--;
      }
    }
  }

  // ---- Draw on canvas ----
  function draw() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, 400, 600);

    // draw player (emoji)
    ctx.font = "60px Arial";
    ctx.fillText("🐰", player.x, player.y + 50);

    // draw items (carrot + value)
    for (let it of items) {
      ctx.font = "50px Arial";
      ctx.fillText("🥕", it.x, it.y + 50);

      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.strokeText(String(it.value), it.x + 15, it.y + 35);
      ctx.fillText(String(it.value), it.x + 15, it.y + 35);
    }
  }

  // ---- Game loop with proper cleanup ----
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      if (isPlaying) {
        update();
        draw();
        rafId = requestAnimationFrame(loop);
      }
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentAnswer]); // include currentAnswer so spawned items reflect it

  // ---- Keyboard & pointer controls ----
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") move.current.left = true;
      if (e.key === "ArrowRight") move.current.right = true;
      if ((e.key === " " || e.key === "Enter") && !isPlaying) {
        // Start / restart with Space or Enter
        startGame();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") move.current.left = false;
      if (e.key === "ArrowRight") move.current.right = false;
    }
    function onBlur() {
      // Reset movement when window loses focus
      move.current.left = false;
      move.current.right = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [isPlaying]);

  // ---- Ensure lives display never passes negative to repeat() ----
  const safeLives = Math.max(0, lives);

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{
        background: "linear-gradient(to bottom, #87CEEB, #E0F7FA)",
        height: "100vh",
        paddingTop: 20,
      }}
    >
      <div
        id="game-container"
        className="relative"
        style={{
          width: 400,
          height: 600,
          border: "5px solid #FF8C00",
          borderRadius: 15,
          overflow: "hidden",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        {/* SKY */}
        <div
          style={{
            position: "absolute",
            top: 0,
            width: "100%",
            height: "80%",
            backgroundColor: "#87CEEB",
            zIndex: 0,
          }}
        />

        {/* GRASS */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "20%",
            backgroundColor: "#32CD32",
            borderTop: "5px solid #228B22",
            zIndex: 0,
          }}
        />

        {/* HUD */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            right: 10,
            display: "flex",
            justifyContent: "space-between",
            zIndex: 10,
            fontSize: 22,
            color: "#fff",
            fontWeight: "bold",
            textShadow: "2px 2px 0 #000",
          }}
        >
          <div>Điểm: {score}</div>
          {/* clamp repeat argument to >=0 */}
          <div>Mạng: {"❤️".repeat(safeLives)}</div>
        </div>

        {/* QUESTION BOX */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "10px 20px",
            borderRadius: 20,
            border: "3px solid #FF69B4",
            fontSize: 28,
            fontWeight: "bold",
            zIndex: 10,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          {question}
        </div>

        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 5 }}
        />

        {/* START SCREEN */}
        {!isPlaying && !isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: 40,
                marginBottom: 20,
                color: "#FFD700",
                textShadow: "3px 3px 0 #FF4500",
              }}
            >
              THỎ CON <br /> HAM HỌC
            </h1>
            <p style={{ fontSize: 18, marginBottom: 20 }}>
              Di chuyển Thỏ để ăn cà rốt <br /> có kết quả đúng!
            </p>

            <button
              onClick={startGame}
              style={{
                padding: "15px 30px",
                fontSize: 24,
                backgroundColor: "#32CD32",
                color: "white",
                borderRadius: 10,
                border: "none",
                fontWeight: "bold",
                boxShadow: "0 5px 0 #228B22",
              }}
            >
              Bắt đầu chơi
            </button>
            <p style={{ marginTop: 12, opacity: 0.9, fontSize: 14 }}>
              (Hoặc nhấn <b>Space</b> / <b>Enter</b> để bắt đầu)
            </p>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: 40, marginBottom: 20, color: "#FFD700" }}>
              HẾT GIỜ!
            </h1>
            <p style={{ fontSize: 20, marginBottom: 20 }}>
              Điểm số của bé:
              <span style={{ color: "#FFD700", fontSize: 32, marginLeft: 10 }}>
                {score}
              </span>
            </p>

            <button
              onClick={startGame}
              style={{
                padding: "15px 30px",
                fontSize: 24,
                backgroundColor: "#32CD32",
                color: "white",
                borderRadius: 10,
                border: "none",
                fontWeight: "bold",
                boxShadow: "0 5px 0 #228B22",
              }}
            >
              Chơi lại nhé
            </button>
            <p style={{ marginTop: 12, opacity: 0.9, fontSize: 14 }}>
              (Hoặc nhấn <b>Space</b> / <b>Enter</b> để chơi lại)
            </p>
          </div>
        )}
      </div>

      {/* CONTROLS - use pointer events for mouse/touch/pen */}
      <div className="flex gap-6 mt-4">
        <div
          role="button"
          aria-label="left"
          className="w-20 h-20 flex items-center justify-center text-4xl rounded-full"
          style={{
            background: "#FFD700",
            border: "4px solid #FF8C00",
            boxShadow: "0 6px 0 #b36b00",
            userSelect: "none",
            touchAction: "none",
          }}
          onPointerDown={() => (move.current.left = true)}
          onPointerUp={() => (move.current.left = false)}
          onPointerCancel={() => (move.current.left = false)}
          onPointerLeave={() => (move.current.left = false)}
        >
          ⬅️
        </div>

        <div
          role="button"
          aria-label="right"
          className="w-20 h-20 flex items-center justify-center text-4xl rounded-full"
          style={{
            background: "#FFD700",
            border: "4px solid #FF8C00",
            boxShadow: "0 6px 0 #b36b00",
            userSelect: "none",
            touchAction: "none",
          }}
          onPointerDown={() => (move.current.right = true)}
          onPointerUp={() => (move.current.right = false)}
          onPointerCancel={() => (move.current.right = false)}
          onPointerLeave={() => (move.current.right = false)}
        >
          ➡️
        </div>
      </div>
    </div>
  );
}
