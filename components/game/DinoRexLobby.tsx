"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { DINOREX_TIMER_S, DINOREX_QUESTION_COUNT, DINOREX_WIN_BONUS_COINS, DINOREX_TIMER_WARNING_S, DINOREX_BOT_NAMES, GAME_COINS_PER_CORRECT } from "@/lib/game-config";

type Player = { id: string; name: string; eliminated: boolean };
type GameState = "lobby" | "playing" | "waiting" | "eliminated" | "won" | "ended";

export default function DinoRexLobby({ onBack }: { onBack: () => void }) {
  const { data: session } = useSession();
  const [lobbyCode, setLobbyCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [question, setQuestion] = useState<{ text: string; options: string[]; correctIndex: number } | null>(null);
  const [round, setRound] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(DINOREX_TIMER_S);
  const [winner, setWinner] = useState<string | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  // Note: WebSocket/Socket.io requires the custom server
  // For demo purposes, we provide a simulated single-player version of DinoRex
  const [simulatedMode, setSimulatedMode] = useState(false);
  const [simQuestions, setSimQuestions] = useState<typeof question[]>([]);
  const [simIdx, setSimIdx] = useState(0);
  const [simEliminated, setSimEliminated] = useState(false);
  const [simScore, setSimScore] = useState(0);
  const simPlayers = ["You", ...DINOREX_BOT_NAMES];

  const loadSimQuestions = async () => {
    try {
      const res = await fetch("/api/quizzes?official=true");
      const quizzes = await res.json();
      if (!quizzes.length) return;
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      setSimQuestions(full.questions.slice(0, DINOREX_QUESTION_COUNT));
    } catch { /* ignore */ }
  };

  const handleSimAnswer = async (idx: number) => {
    if (selected !== null || !simQuestions[simIdx]) return;
    setSelected(idx);
    const q = simQuestions[simIdx];
    if (!q) return;
    const correct = idx === q.correctIndex;
    if (!correct) {
      setSimEliminated(true);
      setGameState("eliminated");
      const coins = simScore * GAME_COINS_PER_CORRECT;
      setCoinsEarned(coins);
      await fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: "sim", answers: [] }),
      }).catch(() => {});
      return;
    }
    setSimScore((s) => s + 1);
    setTimeout(() => {
      if (simIdx + 1 >= simQuestions.length) {
        setGameState("won");
        setWinner(session?.user?.name ?? "You");
        setCoinsEarned((simScore + 1) * GAME_COINS_PER_CORRECT + DINOREX_WIN_BONUS_COINS);
      } else {
        setSimIdx((i) => i + 1);
        setSelected(null);
        setTimeLeft(DINOREX_TIMER_S);
        setRound((r) => r + 1);
      }
    }, 800);
  };

  useEffect(() => {
    if (gameState !== "playing" || !simulatedMode) return;
    if (timeLeft <= 0) {
      setSimEliminated(true);
      setGameState("eliminated");
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, simulatedMode]);

  void socketRef.current; void lobbyCode; void inputCode; void joined; void players; void setLobbyCode; void setInputCode; void setJoined; void setPlayers; void simulatedMode; void simEliminated; void winner; void coinsEarned;

  if (gameState === "lobby") {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">← Back</button>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦖</div>
          <h1 className="text-3xl font-bold text-white mb-2">DinoRex</h1>
          <p className="text-gray-400">Multiplayer elimination — one wrong answer and you&apos;re out!</p>
        </div>

        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
            <p className="text-green-400 font-semibold mb-1">🎮 Practice Mode Available</p>
            <p className="text-gray-400 text-sm mb-4">Play against AI opponents while multiplayer servers are being set up.</p>
            <button
              onClick={async () => {
                setSimulatedMode(true);
                await loadSimQuestions();
                setGameState("playing");
                setTimeLeft(DINOREX_TIMER_S);
              }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            >
              Play vs AI Opponents 🤖
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">How to Play</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>🦖 Answer each question correctly to survive</li>
              <li>❌ Wrong answer = eliminated</li>
              <li>⏱️ 15 seconds per question</li>
              <li>🏆 Last survivor wins bonus coins</li>
              <li>🪙 5 coins per correct answer regardless</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "eliminated") {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-white mb-2">You&apos;re Out!</h2>
        <p className="text-gray-400 mb-4">Eliminated on round {round}</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
          🪙 +{simScore * GAME_COINS_PER_CORRECT} coins earned
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setGameState("lobby"); setSimIdx(0); setSimScore(0); setRound(1); setSelected(null); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Try Again</button>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Game Modes</button>
        </div>
      </div>
    );
  }

  if (gameState === "won") {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-white mb-2">You Won DinoRex!</h2>
        <p className="text-gray-400 mb-4">Survived all {round} rounds!</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
          🪙 +{(simScore * GAME_COINS_PER_CORRECT) + DINOREX_WIN_BONUS_COINS} coins (incl. {DINOREX_WIN_BONUS_COINS} winner bonus)
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setGameState("lobby"); setSimIdx(0); setSimScore(0); setRound(1); setSelected(null); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Play Again</button>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Game Modes</button>
        </div>
      </div>
    );
  }

  const q = simQuestions[simIdx];
  if (!q) return <div className="p-8 text-gray-400 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-green-400 font-bold">Round {round}</span>
        <div className={`text-xl font-bold px-4 py-1.5 rounded-xl border ${timeLeft <= DINOREX_TIMER_WARNING_S ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse" : "text-green-400 border-green-500/30 bg-green-500/10"}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      {/* Survivors bar */}
      <div className="flex gap-2 mb-4">
        {simPlayers.map((p, i) => (
          <div key={p} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${i === 0 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-gray-400"}`}>
            {i === 0 ? "You ✓" : `Bot ${i}`}
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <p className="text-lg font-semibold text-white">{q.text}</p>
      </div>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let style = "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-green-500/50";
          if (selected !== null) {
            if (idx === q.correctIndex) style = "bg-green-500/20 border-green-500 text-green-300";
            else if (idx === selected) style = "bg-red-500/20 border-red-500 text-red-300";
            else style = "bg-white/3 border-white/5 text-gray-600";
          }
          return (
            <button key={idx} onClick={() => handleSimAnswer(idx)} disabled={selected !== null}
              className={`w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium ${style}`}>
              <span className="text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
