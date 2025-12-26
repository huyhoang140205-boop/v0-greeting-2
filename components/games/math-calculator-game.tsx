"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle, XCircle } from "lucide-react";

interface GameQuestion {
  id: string;
  question: string;
  correct_answer: string;
  points: number;
}

interface MathCalculatorGameProps {
  gameId?: string;
  questions?: GameQuestion[];
  onGameComplete?: (score: number, maxScore: number, timeTaken: number, pointsEarned: number) => void;
}

// Default questions
const defaultQuestions: GameQuestion[] = [
  { id: "1", question: "5 + 3", correct_answer: "8", points: 10 },
  { id: "2", question: "7 - 4", correct_answer: "3", points: 10 },
  { id: "3", question: "6 * 2", correct_answer: "12", points: 10 },
  { id: "4", question: "12 / 3", correct_answer: "4", points: 10 },
];

export function MathCalculatorGame({
  gameId = "default-math-game",
  questions = defaultQuestions,
  onGameComplete = () => {},
}: MathCalculatorGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!gameStarted || gameEnded) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameEnded]);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    const correct = Math.abs(parseFloat(userAnswer) - parseFloat(currentQuestion.correct_answer)) < 0.01;
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) setScore((prev) => prev + currentQuestion.points);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer("");
        setShowResult(false);
        setIsCorrect(null);
      } else endGame();
    }, 1200);
  };

  const endGame = () => {
    setGameEnded(true);
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const timeTaken = 300 - timeLeft;
    onGameComplete(score, maxScore, timeTaken, score);
  };

  const progress = ((currentQuestionIndex + (showResult ? 1 : 0)) / questions.length) * 100;

  if (!gameStarted)
    return (
      <div className="text-center space-y-6">
        <h2 className="text-2xl font-bold">Trò chơi Máy tính Toán học</h2>
        <p>Giải nhanh các bài toán!</p>
        <Button onClick={() => setGameStarted(true)}>Bắt đầu</Button>
      </div>
    );

  if (gameEnded)
    return (
      <div className="text-center space-y-6">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
        <h2 className="text-2xl font-bold">Hoàn thành!</h2>
        <p>Bạn đã hoàn tất {questions.length} bài toán</p>
        <div className="text-3xl font-bold text-blue-600">{score} điểm</div>
        <Button
          onClick={() => {
            setGameStarted(false);
            setGameEnded(false);
            setScore(0);
            setTimeLeft(300);
            setCurrentQuestionIndex(0);
            setUserAnswer("");
          }}
        >
          Chơi lại
        </Button>
      </div>
    );

  if (!currentQuestion) return <div>Không có câu hỏi</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Máy tính Toán học</h2>
        <Badge variant="secondary">{currentQuestionIndex + 1}/{questions.length}</Badge>
      </div>
      <Progress value={progress} />
      <Card>
        <CardContent>
          {showResult ? (
            isCorrect ? (
              <div className="text-green-600 text-center">
                <CheckCircle className="mx-auto w-12 h-12" /> +{currentQuestion.points} điểm
              </div>
            ) : (
              <div className="text-red-600 text-center">
                <XCircle className="mx-auto w-12 h-12" /> Sai! Đáp án: {currentQuestion.correct_answer}
              </div>
            )
          ) : (
            <>
              <div className="text-2xl text-center font-bold bg-blue-50 p-3 rounded">{currentQuestion.question}</div>
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Nhập kết quả..."
              />
              <Button onClick={handleSubmit} disabled={!userAnswer.trim()}>Xác nhận</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
