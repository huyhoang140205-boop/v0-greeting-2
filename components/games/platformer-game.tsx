"use client";

import { useEffect, useRef, useState } from "react";
import { initPlatformer } from "@/scripts/game-platformer";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  gameSlug?: string;
  onGameComplete?: (score: number) => void;
}

export function PlatformerGame({ gameSlug = "platformer-mario", onGameComplete }: Props) {
  const canvasId = useRef(`platformer-${Math.random().toString(36).slice(2, 9)}`);
  const destroyRef = useRef<() => void>(() => {});
  const mountedRef = useRef(true);

  const [lastScore, setLastScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // ==========================================================
  // Lấy hoặc tạo game
  // ==========================================================
  const getOrCreateGameId = async (): Promise<string | null> => {
    try {
      const { data: game, error } = await supabase
        .from("game")
        .select("id")
        .eq("slug", gameSlug)
        .maybeSingle();

      if (error) {
        console.error("❌ Lỗi lấy game:", error);
        return null;
      }

      if (game) return game.id;

      const { data: newGame, error: insertErr } = await supabase
        .from("game")
        .insert({
          slug: gameSlug,
          title: "Mario Platformer",
          description: "Trò chơi học toán kiểu Mario"
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("❌ Lỗi tạo game:", insertErr);
        return null;
      }

      return newGame.id;
    } catch (err) {
      console.error("🔥 Lỗi getOrCreateGameId:", err);
      return null;
    }
  };

  // ==========================================================
  // Lưu điểm khi ấn nút
  // ==========================================================
  const saveScore = async (score: number) => {
    try {
      console.log("🔵 Bắt đầu lưu điểm:", score);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Bạn cần đăng nhập!");

      const gameId = await getOrCreateGameId();
      if (!gameId) return alert("Không lấy được gameId!");

      console.log("gameId =", gameId);

      // 1️⃣ Lưu lịch sử chơi
      const { error: playErr } = await supabase
        .from("game_plays")
        .insert({
          user_id: user.id,
          game_id: gameId,
          score,
          played_at: new Date()
        });

      if (playErr) {
        console.error("❌ Lỗi lưu game_plays:", playErr);
        return alert("Không thể lưu lịch sử chơi!");
      }

      // 2️⃣ Lưu hoặc cập nhật game_scores
      const { data: oldScore, error: oldErr } = await supabase
        .from("game_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("game_id", gameId)
        .maybeSingle();

      if (oldErr) console.error("⚠️ Lỗi lấy game_scores:", oldErr);

      if (!oldScore) {
        const { error: createErr } = await supabase
          .from("game_scores")
          .insert({
            user_id: user.id,
            game_id: gameId,
            best_score: score,
            last_score: score,
            plays_count: 1,
            last_played: new Date(),
            average_score: score
          });

        if (createErr) {
          console.error("❌ Lỗi tạo game_scores:", createErr);
          return alert("Không thể tạo bảng điểm!");
        }
      } else {
        const newCount = oldScore.plays_count + 1;
        const newAverage = (oldScore.average_score * oldScore.plays_count + score) / newCount;

        const { error: updateErr } = await supabase
          .from("game_scores")
          .update({
            best_score: Math.max(oldScore.best_score, score),
            last_score: score,
            plays_count: newCount,
            average_score: newAverage,
            last_played: new Date(),
            updated_at: new Date()
          })
          .eq("id", oldScore.id);

        if (updateErr) {
          console.error("❌ Lỗi cập nhật game_scores:", updateErr);
          return alert("Không thể cập nhật điểm!");
        }
      }

      console.log("✅ Lưu điểm thành công!");
      setLastScore(score);
      alert("🎉 Đã lưu điểm!");
      onGameComplete?.(score);
    } catch (err) {
      console.error("🔥 Lỗi saveScore:", err);
      alert("Có lỗi xảy ra khi lưu điểm!");
    }
  };

  // ==========================================================
  // INIT GAME
  // ==========================================================
  useEffect(() => {
    mountedRef.current = true;

    const marioImg = new Image();
    marioImg.src = "/sprites/mario.png";
    const blockImg = new Image();
    blockImg.src = "/sprites/block.png";

    const { destroy } = initPlatformer(canvasId.current, {
      width: 820,
      height: 360,
      sprite: marioImg,
      block: blockImg,
      onScore: (score: number) => {
        setLastScore(score); // Chỉ update UI
      },
      onError: (err) => console.error(err)
    });

    destroyRef.current = destroy;
    setLoading(false);

    return () => {
      mountedRef.current = false;
      destroyRef.current?.();
    };
  }, [gameSlug]);

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="w-full max-w-3xl">
        <canvas id={canvasId.current} className="w-full border rounded-lg bg-black" />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => destroyRef.current?.()}>
          ⏸️ Tạm dừng
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            if (lastScore === 0) return alert("Chưa có điểm!");
            saveScore(lastScore);
          }}
        >
          💾 Lưu điểm ({lastScore})
        </Button>
      </div>

      {!loading && (
        <p className="text-sm text-gray-400 text-center">
          Dùng ← → để di chuyển, Space/↑ để nhảy. Chạm vào đáp án đúng để nhận điểm! 🚀
        </p>
      )}
    </div>
  );
}
