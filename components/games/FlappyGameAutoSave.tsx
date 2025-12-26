"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  gameSlug?: string;
  onGameComplete?: (score: number) => void;
}

interface Pipe {
  x: number;
  top: number;
  bottom: number;
  passed?: boolean;
}

export function FlappyBirdGame({ gameSlug = "flappy-bird", onGameComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const supabase = createClient();
  const [score, setScore] = useState(0);

  const getOrCreateGameId = async (): Promise<string | null> => {
    const { data: game, error } = await supabase
      .from("game")
      .select("id")
      .eq("slug", gameSlug)
      .maybeSingle();

    if (error) return null;
    if (game) return game.id;

    const { data: newGame, error: insertErr } = await supabase
      .from("game")
      .insert({
        slug: gameSlug,
        title: "Flappy Bird Mini",
        description: "Game Flappy Bird mini",
      })
      .select("id")
      .single();

    if (insertErr) return null;
    return newGame.id;
  };

  const saveScore = async (finalScore: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const gameId = await getOrCreateGameId();
      if (!gameId) return;

      await supabase.from("game_plays").insert({
        user_id: user.id,
        game_id: gameId,
        score: finalScore,
        played_at: new Date()
      });

      const { data: oldScore } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("game_id", gameId)
        .maybeSingle();

      if (!oldScore) {
        await supabase.from("game_scores").insert({
          user_id: user.id,
          game_id: gameId,
          best_score: finalScore,
          last_score: finalScore,
          plays_count: 1,
          last_played: new Date(),
          average_score: finalScore
        });
      } else {
        const newCount = oldScore.plays_count + 1;
        const newAverage = (oldScore.average_score * oldScore.plays_count + finalScore) / newCount;
        await supabase
          .from("game_scores")
          .update({
            best_score: Math.max(oldScore.best_score, finalScore),
            last_score: finalScore,
            plays_count: newCount,
            average_score: newAverage,
            last_played: new Date(),
            updated_at: new Date()
          })
          .eq("id", oldScore.id);
      }

      onGameComplete?.(finalScore);
    } catch (err) {
      console.error("Lỗi lưu điểm:", err);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const WIDTH = 400;
    const HEIGHT = 600;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let birdY = HEIGHT / 2;
    let birdV = 0;
    const gravity = 0.6;
    const jump = -10;
    const pipeWidth = 50;
    const pipeGap = 150;
    const pipeSpeed = 2;
    let pipes: Pipe[] = [];
    let gameOver = false;
    let currentScore = 0;
    let started = false; // game chưa bắt đầu

    const flap = () => {
      birdV = jump;
      if (!started) started = true; // nhấn Space lần đầu → bắt đầu game
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") flap();
    };
    window.addEventListener("keydown", handleKeyDown);

    const spawnPipe = () => {
      const top = Math.random() * (HEIGHT - pipeGap - 100) + 50;
      pipes.push({ x: WIDTH, top, bottom: top + pipeGap });
    };

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Bird
      ctx.fillStyle = "yellow";
      ctx.fillRect(80, birdY, 30, 30);

      // Pipes
      ctx.fillStyle = "green";
      pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, HEIGHT - pipe.bottom);
      });

      // Score
      ctx.fillStyle = "black";
      ctx.font = "24px sans-serif";
      ctx.fillText("Score: " + currentScore, 10, 30);

      // Text hướng dẫn
      if (!started) {
        ctx.fillStyle = "red";
        ctx.font = "20px sans-serif";
        ctx.fillText("Press SPACE to start", WIDTH/2 - 100, HEIGHT/2);
      }
    };

    const update = () => {
      if (!started || gameOver) return;

      birdV += gravity;
      birdY += birdV;

      pipes.forEach(pipe => (pipe.x -= pipeSpeed));

      if (pipes.length === 0 || pipes[pipes.length - 1].x < WIDTH - 200) spawnPipe();
      if (pipes.length && pipes[0].x + pipeWidth < 0) pipes.shift();

      for (const pipe of pipes) {
        if (
          80 + 30 > pipe.x &&
          80 < pipe.x + pipeWidth &&
          (birdY < pipe.top || birdY + 30 > pipe.bottom)
        ) {
          gameOver = true;
        }
      }

      if (birdY + 30 > HEIGHT || birdY < 0) gameOver = true;

      pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + pipeWidth < 80) {
          pipe.passed = true;
          currentScore += 10;
          setScore(currentScore);
        }
      });
    };

    const loop = () => {
      update();
      draw();
      if (!gameOver) animationRef.current = requestAnimationFrame(loop);
      else if (started) saveScore(currentScore);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ border: "2px solid black", display: "block", margin: "0 auto" }} />;
}
