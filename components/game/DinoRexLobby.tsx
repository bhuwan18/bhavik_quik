"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import {
  DINOREX_TIMER_S,
  DINOREX_QUESTION_COUNT,
  DINOREX_WIN_BONUS_COINS,
  DINOREX_TIMER_WARNING_S,
  DINOREX_BOT_NAMES,
  GAME_COINS_PER_CORRECT,
} from "@/lib/game-config";
import type { DinoRexPlayer, DinoRexQuestion } from "@/lib/pusher";

// ─── Types ────────────────────────────────────────────────────────────────────

type LobbyScreen = "home" | "create" | "join" | "waiting";
type GameScreen = "playing" | "reveal" | "eliminated" | "won" | "ended";
type Screen = LobbyScreen | GameScreen;

type RoundReveal = {
  correctIndex: number;
  eliminations: string[];
  nextQuestion: DinoRexQuestion | null;
  nextIdx: number;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function DinoRexLobby({ onBack }: { onBack: () => void }) {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <>
      {screen === "home" && <HomeScreen onBack={onBack} onSelect={setScreen} />}
      {(screen === "create" || screen === "join" || screen === "waiting") && (
        <MultiplayerFlow
          session={session}
          initialScreen={screen as LobbyScreen}
          onBack={() => setScreen("home")}
        />
      )}
      {(screen === "playing" || screen === "reveal" || screen === "eliminated" || screen === "won" || screen === "ended") && (
        <SimulatedGame onBack={() => setScreen("home")} />
      )}
    </>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function HomeScreen({ onBack, onSelect }: { onBack: () => void; onSelect: (s: Screen) => void }) {
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">← Back</button>
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🦖</div>
        <h1 className="text-3xl font-bold text-white mb-2">DinoRex</h1>
        <p className="text-gray-400">Elimination quiz — one wrong answer and you&apos;re out!</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onSelect("create")}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors text-lg"
        >
          🎮 Create Room
        </button>
        <button
          onClick={() => onSelect("join")}
          className="w-full py-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl transition-colors text-lg border border-white/10"
        >
          🔗 Join Room
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-white/10" />
          <span className="mx-3 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        <button
          onClick={() => onSelect("playing")}
          className="w-full py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-semibold rounded-2xl transition-colors border border-green-500/30"
        >
          🤖 Practice vs AI Bots
        </button>
      </div>

      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-white font-semibold mb-2 text-sm">How to Play</h3>
        <ul className="space-y-1.5 text-sm text-gray-400">
          <li>🦖 Answer correctly every round to survive</li>
          <li>❌ Wrong answer or timeout = eliminated</li>
          <li>⏱️ {DINOREX_TIMER_S} seconds per question</li>
          <li>🏆 Last survivor wins +{DINOREX_WIN_BONUS_COINS} bonus coins</li>
          <li>🪙 {GAME_COINS_PER_CORRECT} coins per correct answer</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Multiplayer Flow ─────────────────────────────────────────────────────────

function MultiplayerFlow({
  session,
  initialScreen,
  onBack,
}: {
  session: ReturnType<typeof useSession>["data"];
  initialScreen: LobbyScreen;
  onBack: () => void;
}) {
  const [screen, setScreen] = useState<LobbyScreen>(initialScreen);
  const [code, setCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [players, setPlayers] = useState<DinoRexPlayer[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameScreen, setGameScreen] = useState<GameScreen | null>(null);
  const [question, setQuestion] = useState<DinoRexQuestion | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [totalQ, setTotalQ] = useState(DINOREX_QUESTION_COUNT);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(DINOREX_TIMER_S);
  const [reveal, setReveal] = useState<RoundReveal | null>(null);
  const [winner, setWinner] = useState<DinoRexPlayer | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [answeredUsers, setAnsweredUsers] = useState<Set<string>>(new Set());

  const pusherRef = useRef<Pusher | null>(null);
  const isHost = session?.user?.id === players[0]?.userId;
  const myId = session?.user?.id ?? "";

  const submitAnswer = useCallback(async (answerIdx: number) => {
    if (selected !== null && answerIdx !== -1) return;
    if (answerIdx !== -1) setSelected(answerIdx);
    await fetch("/api/dinorex/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, questionIdx, answerIdx }),
    });
  }, [selected, code, questionIdx]);

  // Timer effect (playing state)
  useEffect(() => {
    if (gameScreen !== "playing" || selected !== null) return;
    if (timeLeft <= 0) {
      // Submit timeout
      // eslint-disable-next-line react-hooks/set-state-in-effect
      submitAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameScreen, selected, submitAnswer]);

  const connectPusher = useCallback((roomCode: string) => {
    if (pusherRef.current) pusherRef.current.disconnect();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap2",
    });

    const channel = pusher.subscribe(`dinorex-${roomCode}`);

    channel.bind("player-joined", ({ player }: { player: DinoRexPlayer }) => {
      setPlayers((prev) => (prev.find((p) => p.userId === player.userId) ? prev : [...prev, player]));
    });

    channel.bind("player-left", ({ userId, roomClosed }: { userId: string; roomClosed: boolean }) => {
      if (roomClosed) { onBack(); return; }
      setPlayers((prev) => prev.filter((p) => p.userId !== userId));
    });

    channel.bind("game-started", ({ question, questionIdx, total }: { question: DinoRexQuestion; questionIdx: number; total: number }) => {
      setQuestion(question);
      setQuestionIdx(questionIdx);
      setTotalQ(total);
      setSelected(null);
      setTimeLeft(DINOREX_TIMER_S);
      setAnsweredUsers(new Set());
      setReveal(null);
      setGameScreen("playing");
    });

    channel.bind("player-answered", ({ userId }: { userId: string }) => {
      setAnsweredUsers((prev) => new Set([...prev, userId]));
    });

    channel.bind("round-ended", (data: RoundReveal & { scores: Record<string, number> }) => {
      setReveal(data);
      setScores(data.scores);
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          eliminated: p.eliminated || data.eliminations.includes(p.userId),
          score: data.scores[p.userId] ?? p.score,
        }))
      );
      setGameScreen("reveal");

      // Advance to next question after 2.5s
      setTimeout(() => {
        if (data.nextQuestion) {
          setQuestion(data.nextQuestion);
          setQuestionIdx(data.nextIdx);
          setSelected(null);
          setTimeLeft(DINOREX_TIMER_S);
          setAnsweredUsers(new Set());
          setReveal(null);
          setGameScreen("playing");
        }
      }, 2500);
    });

    channel.bind("game-ended", ({ winner, scores }: { winner: DinoRexPlayer | null; scores: Record<string, number> }) => {
      setWinner(winner);
      setScores(scores);
      setPlayers((prev) => prev.map((p) => ({ ...p, score: scores[p.userId] ?? p.score })));
      setGameScreen(winner?.userId === myId ? "won" : "ended");
    });

    pusherRef.current = pusher;
  }, [myId, onBack]);

  useEffect(() => {
    return () => { pusherRef.current?.disconnect(); };
  }, []);

  async function createRoom() {
    setLoading(true); setError("");
    const res = await fetch("/api/dinorex/create", { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    const roomCode: string = data.code;
    setCode(roomCode);
    // Fetch room state (includes self as first player)
    const stateRes = await fetch(`/api/dinorex/${roomCode}`);
    const state = await stateRes.json();
    setPlayers(state.players ?? []);
    connectPusher(roomCode);
    setScreen("waiting");
    setLoading(false);
  }

  async function joinRoom() {
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) { setError("Enter a room code"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/dinorex/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setCode(trimmed);
    setPlayers(data.players ?? []);
    connectPusher(trimmed);
    setScreen("waiting");
    setLoading(false);
  }

  async function startGame() {
    setLoading(true); setError("");
    const res = await fetch("/api/dinorex/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed to start");
    setLoading(false);
  }

  async function leaveRoom() {
    await fetch(`/api/dinorex/${code}`, { method: "DELETE" });
    pusherRef.current?.disconnect();
    onBack();
  }

  // ── Render game states ──
  if (gameScreen === "playing" && question) {
    const myPlayer = players.find((p) => p.userId === myId);
    if (myPlayer?.eliminated) {
      return <EliminatedScreen score={myPlayer.score} round={questionIdx + 1} onBack={onBack} />;
    }
    return (
      <PlayingScreen
        question={question}
        questionIdx={questionIdx}
        totalQ={totalQ}
        players={players}
        answeredUsers={answeredUsers}
        selected={selected}
        timeLeft={timeLeft}
        myId={myId}
        onAnswer={submitAnswer}
      />
    );
  }

  if (gameScreen === "reveal" && question && reveal) {
    return (
      <RevealScreen
        question={question}
        reveal={reveal}
        players={players}
        myId={myId}
      />
    );
  }

  if (gameScreen === "eliminated") {
    const myPlayer = players.find((p) => p.userId === myId);
    return <EliminatedScreen score={myPlayer?.score ?? 0} round={questionIdx + 1} onBack={onBack} />;
  }

  if (gameScreen === "won") {
    const myPlayer = players.find((p) => p.userId === myId);
    return (
      <WonScreen
        coinsEarned={(myPlayer?.score ?? 0) * GAME_COINS_PER_CORRECT + DINOREX_WIN_BONUS_COINS}
        onBack={onBack}
      />
    );
  }

  if (gameScreen === "ended") {
    return <EndedScreen winner={winner} players={players} scores={scores} myId={myId} onBack={onBack} />;
  }

  // ── Lobby screens ──
  if (screen === "create") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-6">Create Room</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={createRoom}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
        >
          {loading ? "Creating..." : "Create Room →"}
        </button>
      </div>
    );
  }

  if (screen === "join") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-6">Join Room</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <input
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          placeholder="Enter room code (e.g. X7K2Q)"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 uppercase font-mono text-lg tracking-widest mb-4 focus:outline-none focus:border-indigo-500"
          maxLength={6}
        />
        <button
          onClick={joinRoom}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
        >
          {loading ? "Joining..." : "Join →"}
        </button>
      </div>
    );
  }

  // Waiting room
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={leaveRoom} className="text-gray-400 hover:text-white text-sm">← Leave</button>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-xl font-bold text-white tracking-widest">
          {code}
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-1">Waiting for players…</h2>
      <p className="text-gray-400 text-sm mb-6">Share the room code above. Need at least 2 to start.</p>

      <div className="space-y-2 mb-6">
        {players.map((p, i) => (
          <div key={p.userId} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-lg">{i === 0 ? "👑" : "🦖"}</span>
            <span className="text-white font-medium">{p.name}</span>
            {i === 0 && <span className="text-xs text-yellow-400 ml-auto">Host</span>}
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {isHost ? (
        <button
          onClick={startGame}
          disabled={loading || players.length < 2}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
        >
          {loading ? "Starting…" : players.length < 2 ? "Waiting for more players…" : "Start Game 🚀"}
        </button>
      ) : (
        <div className="text-center text-gray-400 py-4">Waiting for host to start…</div>
      )}
    </div>
  );
}

// ─── Playing Screen ───────────────────────────────────────────────────────────

function PlayingScreen({
  question,
  questionIdx,
  totalQ,
  players,
  answeredUsers,
  selected,
  timeLeft,
  myId,
  onAnswer,
}: {
  question: DinoRexQuestion;
  questionIdx: number;
  totalQ: number;
  players: DinoRexPlayer[];
  answeredUsers: Set<string>;
  selected: number | null;
  timeLeft: number;
  myId: string;
  onAnswer: (idx: number) => void;
}) {
  const alive = players.filter((p) => !p.eliminated);

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-indigo-400 font-bold text-sm">
          Question {questionIdx + 1}/{totalQ}
        </span>
        <div className={`text-xl font-bold px-4 py-1.5 rounded-xl border ${
          timeLeft <= DINOREX_TIMER_WARNING_S
            ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse"
            : "text-green-400 border-green-500/30 bg-green-500/10"
        }`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      {/* Players alive bar */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {players.map((p) => (
          <div
            key={p.userId}
            title={p.name}
            className={`px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[80px] ${
              p.eliminated
                ? "bg-red-500/10 text-red-400/50 line-through"
                : answeredUsers.has(p.userId)
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : p.userId === myId
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {p.userId === myId ? "You" : p.name.split(" ")[0]}
            {answeredUsers.has(p.userId) && !p.eliminated ? " ✓" : ""}
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
        <p className="text-lg font-semibold text-white leading-snug">{question.text}</p>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, idx) => {
          let style = "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-indigo-500/40";
          if (selected !== null) {
            if (idx === selected) style = "bg-indigo-500/20 border-indigo-500 text-indigo-300";
            else style = "bg-white/3 border-white/5 text-gray-600";
          }
          return (
            <button
              key={idx}
              onClick={() => onAnswer(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium ${style}`}
            >
              <span className="text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-center text-gray-400 text-sm mt-4 animate-pulse">
          Waiting for others… ({alive.filter(p => !answeredUsers.has(p.userId) && p.userId !== myId).length} left)
        </p>
      )}
    </div>
  );
}

// ─── Reveal Screen ────────────────────────────────────────────────────────────

function RevealScreen({
  question,
  reveal,
  players,
  myId,
}: {
  question: DinoRexQuestion;
  reveal: RoundReveal;
  players: DinoRexPlayer[];
  myId: string;
}) {
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
        <p className="text-base text-white mb-4 font-semibold">{question.text}</p>
        {question.options.map((opt, idx) => (
          <div
            key={idx}
            className={`px-4 py-2.5 rounded-xl mb-2 text-sm font-medium ${
              idx === reveal.correctIndex
                ? "bg-green-500/20 border border-green-500 text-green-300"
                : "bg-white/3 text-gray-600"
            }`}
          >
            <span className="mr-2">{idx === reveal.correctIndex ? "✓" : String.fromCharCode(65 + idx) + "."}</span>
            {opt}
          </div>
        ))}
      </div>

      {reveal.eliminations.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm font-medium">
            ❌ Eliminated:{" "}
            {reveal.eliminations
              .map((id) => (id === myId ? "You" : players.find((p) => p.userId === id)?.name ?? id))
              .join(", ")}
          </p>
        </div>
      )}

      {reveal.nextQuestion ? (
        <p className="text-center text-gray-400 text-sm animate-pulse">Next question in a moment…</p>
      ) : (
        <p className="text-center text-gray-400 text-sm">Game ending…</p>
      )}
    </div>
  );
}

// ─── Result Screens ───────────────────────────────────────────────────────────

function EliminatedScreen({ score, round, onBack }: { score: number; round: number; onBack: () => void }) {
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
      <div className="text-6xl mb-4">💀</div>
      <h2 className="text-2xl font-bold text-white mb-2">You&apos;re Out!</h2>
      <p className="text-gray-400 mb-4">Eliminated on round {round}</p>
      <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
        🪙 +{score * GAME_COINS_PER_CORRECT} coins earned
      </div>
      <div>
        <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
          Game Modes
        </button>
      </div>
    </div>
  );
}

function WonScreen({ coinsEarned, onBack }: { coinsEarned: number; onBack: () => void }) {
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
      <div className="text-6xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold text-white mb-2">You Won DinoRex!</h2>
      <p className="text-gray-400 mb-4">Last survivor!</p>
      <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
        🪙 +{coinsEarned} coins (incl. {DINOREX_WIN_BONUS_COINS} winner bonus)
      </div>
      <div>
        <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
          Game Modes
        </button>
      </div>
    </div>
  );
}

function EndedScreen({
  winner,
  players,
  scores,
  myId,
  onBack,
}: {
  winner: DinoRexPlayer | null;
  players: DinoRexPlayer[];
  scores: Record<string, number>;
  myId: string;
  onBack: () => void;
}) {
  const myCoins = (scores[myId] ?? 0) * GAME_COINS_PER_CORRECT;
  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
      <div className="text-6xl mb-4">🎮</div>
      <h2 className="text-2xl font-bold text-white mb-1">Game Over</h2>
      {winner && (
        <p className="text-gray-400 mb-4">
          Winner: <span className="text-yellow-400 font-semibold">{winner.name}</span>
        </p>
      )}

      <div className="space-y-2 mb-6 text-left">
        {players
          .slice()
          .sort((a, b) => (scores[b.userId] ?? 0) - (scores[a.userId] ?? 0))
          .map((p, i) => (
            <div
              key={p.userId}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                p.userId === winner?.userId
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <span className="text-gray-400 text-sm w-5">#{i + 1}</span>
              <span className="text-white flex-1">{p.userId === myId ? "You" : p.name}</span>
              <span className="text-yellow-400 text-sm font-medium">{scores[p.userId] ?? 0} correct</span>
            </div>
          ))}
      </div>

      {myCoins > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl inline-flex items-center gap-2 font-medium mb-6 text-sm">
          🪙 +{myCoins} coins earned
        </div>
      )}

      <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
        Game Modes
      </button>
    </div>
  );
}

// ─── AI Practice (Simulated) Mode ────────────────────────────────────────────

function SimulatedGame({
  onBack,
}: {
  onBack: () => void;
}) {
  const [questions, setQuestions] = useState<Array<{ text: string; options: string[]; correctIndex: number }>>([]);
  const [idx, setIdx] = useState(0);
  const question = questions[idx] ?? null;
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(DINOREX_TIMER_S);
  const [gameState, setGameState] = useState<"loading" | "playing" | "eliminated" | "won">("loading");
  const [coinsEarned, setCoinsEarned] = useState(0);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/quizzes?official=true");
      const quizzes = await res.json();
      if (!quizzes.length) return;
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      const qs = full.questions.slice(0, DINOREX_QUESTION_COUNT);
      setQuestions(qs);
      setGameState("playing");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuestions();
  }, [loadQuestions]);

  const handleAnswer = useCallback((answerIdx: number) => {
    if (selected !== null && answerIdx !== -1) return;
    if (answerIdx !== -1) setSelected(answerIdx);

    const q = questions[idx];
    if (!q) return;
    const correct = answerIdx === q.correctIndex;

    if (!correct) {
      const coins = score * GAME_COINS_PER_CORRECT;
      setCoinsEarned(coins);
      setGameState("eliminated");
      return;
    }

    const newScore = score + 1;
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const coins = newScore * GAME_COINS_PER_CORRECT + DINOREX_WIN_BONUS_COINS;
        setCoinsEarned(coins);
        setScore(newScore);
        setGameState("won");
      } else {
        setScore(newScore);
        setIdx(idx + 1);
        setSelected(null);
        setTimeLeft(DINOREX_TIMER_S);
        setRound((r) => r + 1);
      }
    }, 800);
    setScore(newScore);
  }, [selected, questions, idx, score]);

  useEffect(() => {
    if (gameState !== "playing" || selected !== null) return;
    if (timeLeft <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, selected, handleAnswer]);

  if (gameState === "loading") {
    return <div className="p-8 text-center text-gray-400">Loading questions…</div>;
  }

  if (gameState === "eliminated") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-white mb-2">Eliminated!</h2>
        <p className="text-gray-400 mb-4">Eliminated on round {round}</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
          🪙 +{coinsEarned} coins earned
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setIdx(0); setScore(0); setRound(1); setSelected(null); setTimeLeft(DINOREX_TIMER_S); loadQuestions(); }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
          >
            Try Again
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "won") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-white mb-2">You Beat All AI Bots!</h2>
        <p className="text-gray-400 mb-4">Survived all {round} rounds!</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
          🪙 +{coinsEarned} coins (incl. {DINOREX_WIN_BONUS_COINS} winner bonus)
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setIdx(0); setScore(0); setRound(1); setSelected(null); setTimeLeft(DINOREX_TIMER_S); loadQuestions(); }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
          >
            Play Again
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  if (!question) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-bold text-sm">Round {round}</span>
          <span className="text-gray-500 text-xs">vs AI 🤖</span>
        </div>
        <div className={`text-xl font-bold px-4 py-1.5 rounded-xl border ${
          timeLeft <= DINOREX_TIMER_WARNING_S
            ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse"
            : "text-green-400 border-green-500/30 bg-green-500/10"
        }`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      {/* Survivors bar */}
      <div className="flex gap-1.5 mb-4">
        {["You", ...DINOREX_BOT_NAMES].map((name, i) => (
          <div
            key={name}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium truncate px-1 ${
              i === 0
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {i === 0 ? "You" : `Bot ${i}`}
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
        <p className="text-lg font-semibold text-white leading-snug">{question.text}</p>
      </div>
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          let style = "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-green-500/50";
          if (selected !== null) {
            if (i === question.correctIndex) style = "bg-green-500/20 border-green-500 text-green-300";
            else if (i === selected) style = "bg-red-500/20 border-red-500 text-red-300";
            else style = "bg-white/3 border-white/5 text-gray-600";
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium ${style}`}
            >
              <span className="text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
