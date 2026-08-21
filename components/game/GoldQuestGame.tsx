"use client";

import { useCallback, useRef, useState } from "react";
import { useQuizRun } from "./use-quiz-run";
import CategoryPicker from "./CategoryPicker";
import { useBoss } from "@/components/boss/BossProvider";
import { rollChestOutcome, applyChestOutcome, CHEST_GOLD_BASE, type ChestOutcome, type GoldQuestState } from "@/lib/gold-quest";
import { GQ_ROUNDS, GQ_AI_COUNT, GQ_CHEST_COUNT, GAME_DAMAGE_PER_CORRECT } from "@/lib/game-config";

type Phase = "intro" | "question" | "chest" | "result" | "done";

const RIVAL_NAMES = ["Bot Blaze", "Bot Nova", "Bot Quartz"];
const OUTCOME_LABEL: Record<ChestOutcome["kind"], string> = {
  gold: "Gold!",
  double: "Double Up!",
  swap: "Swapped!",
  steal: "Stole from the leader!",
  trap: "Trap!",
};
const OUTCOME_STYLE: Record<ChestOutcome["kind"], { icon: string; bg: string; border: string; color: string }> = {
  gold: { icon: "🪙", bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.35)", color: "#facc15" },
  double: { icon: "✨", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", color: "#34d399" },
  swap: { icon: "🔄", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.35)", color: "#c084fc" },
  steal: { icon: "🥷", bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.35)", color: "#fb923c" },
  trap: { icon: "💥", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)", color: "#f87171" },
};

export default function GoldQuestGame({ onBack }: { onBack: () => void }) {
  const boss = useBoss();
  const run = useQuizRun();

  const [phase, setPhase] = useState<Phase>("intro");
  const [category, setCategory] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [state, setState] = useState<GoldQuestState>({ playerGold: 0, rivalGold: Array(GQ_AI_COUNT).fill(0) });
  const [resultText, setResultText] = useState("");
  const [resultKind, setResultKind] = useState<ChestOutcome["kind"] | null>(null);
  const [finalCoins, setFinalCoins] = useState<number | null>(null);

  const submittedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const endRun = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("done");
    const res = await run.submit();
    setFinalCoins(res?.coinsEarned ?? 0);
  }, [run]);

  const startRun = async () => {
    const ok = await run.load(category);
    if (!ok) return;
    submittedRef.current = false;
    setRound(1);
    setQIndex(0);
    setFinalCoins(null);
    setState({ playerGold: 0, rivalGold: Array(GQ_AI_COUNT).fill(0) });
    setPhase("question");
  };

  const advanceRound = () => {
    if (round >= GQ_ROUNDS) {
      endRun();
      return;
    }
    // Rivals quietly earn gold each round so there's a race to watch on the results screen.
    setState((prev) => ({
      ...prev,
      rivalGold: prev.rivalGold.map((g) => g + 20 + Math.floor(Math.random() * 40)),
    }));
    setRound((r) => r + 1);
    setQIndex((i) => i + 1);
    setPhase("question");
  };

  const answerQuestion = (idx: number) => {
    const q = run.questions[qIndex % Math.max(1, run.questions.length)];
    if (!q) return;
    run.recordAnswer(q.id, idx);
    const correct = idx === q.correctIndex;
    if (correct) {
      boss.registerHit(GAME_DAMAGE_PER_CORRECT);
      setPhase("chest");
    } else {
      boss.registerMiss();
      setResultText("No chest this round — answer correctly to earn one.");
      setResultKind(null);
      setPhase("result");
    }
  };

  const pickChest = (goldAmount: number) => {
    const outcome = rollChestOutcome(goldAmount);
    const next = applyChestOutcome(stateRef.current, outcome);
    setState(next);
    setResultText(`${OUTCOME_LABEL[outcome.kind]}`);
    setResultKind(outcome.kind);
    setPhase("result");
  };

  if (phase === "intro") {
    const instructions = [
      { icon: "📦", text: "Gold, ×2 multiplier, swap totals, steal from the leader, or a trap" },
      { icon: "🤖", text: "3 rivals build their pile every round — watch your rank" },
      { icon: "🏁", text: `${GQ_ROUNDS} rounds, then coins are settled` },
    ];
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm block text-left">
          ← Back
        </button>
        <div className="text-center">
          <div
            className="float-anim inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 text-5xl"
            style={{
              background: "radial-gradient(circle at 35% 30%, #fde68a, #d97706 55%, #78350f 100%)",
              boxShadow: "0 0 40px 8px rgba(217,119,6,0.35), inset 0 2px 4px rgba(255,255,255,0.25)",
            }}
          >
            💰
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            Gold <span className="text-amber-400">Quest</span>
          </h1>
          <p className="text-gray-400 mb-6">Answer correctly, then pick a chest. Race 3 rival bots to the top pile.</p>
          <div className="rounded-2xl p-5 mb-6 text-left space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {instructions.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-base">
                  {item.icon}
                </span>
                <span className="text-sm text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>
          <CategoryPicker selected={category} onSelect={setCategory} />
          {run.loadError && (
            <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{run.loadError}</p>
          )}
          <button
            onClick={startRun}
            disabled={run.loading}
            className="w-full py-4 text-white font-bold text-lg rounded-2xl transition-all duration-200 disabled:opacity-50 hover:scale-[1.015] active:scale-[0.98] shadow-xl"
            style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", boxShadow: "0 8px 24px -6px rgba(217,119,6,0.5)" }}
          >
            {run.loading ? "Loading..." : "Start Quest! 💰"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const board = [
      { name: "You", gold: state.playerGold, mine: true },
      ...state.rivalGold.map((g, i) => ({ name: RIVAL_NAMES[i] ?? `Bot ${i + 1}`, gold: g, mine: false })),
    ].sort((a, b) => b.gold - a.gold);
    const won = board[0]?.mine;
    const medals = ["🥇", "🥈", "🥉", "🏅"];

    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 text-5xl"
          style={{
            background: won
              ? "radial-gradient(circle at 35% 30%, #fde68a, #d97706 55%, #78350f 100%)"
              : "radial-gradient(circle at 35% 30%, #64748b, #334155 55%, #0f172a 100%)",
            boxShadow: won ? "0 0 40px 8px rgba(217,119,6,0.4)" : "0 0 30px 6px rgba(51,65,85,0.4)",
          }}
        >
          {won ? "🏆" : "💰"}
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Quest Complete!</h2>
        <div className="rounded-2xl p-4 mb-6 text-left space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {board.map((row, i) => (
            <div
              key={row.name}
              className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${row.mine ? "bg-amber-500/10" : ""}`}
            >
              <span className={row.mine ? "text-amber-400 font-bold" : "text-gray-400"}>
                {medals[i] ?? "🏅"} {row.name}
              </span>
              <span className={row.mine ? "text-amber-400 font-bold" : "text-gray-400"}>💰 {row.gold}</span>
            </div>
          ))}
        </div>
        <div
          className="px-6 py-4 rounded-2xl inline-flex items-center gap-2 text-xl font-bold mb-8"
          style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.35)", color: "#facc15" }}
        >
          {finalCoins === null ? "Calculating…" : `🪙 +${finalCoins} coins`}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setPhase("intro")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
            Play Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 text-white font-semibold rounded-xl transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}
          >
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  const q = run.questions[qIndex % Math.max(1, run.questions.length)];

  const resultStyle = resultKind ? OUTCOME_STYLE[resultKind] : { icon: "❌", bg: "rgba(255,255,255,0.05)", border: "var(--border)", color: "#9ca3af" };

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto">
      <div
        className="flex items-center justify-between mb-4 px-3.5 py-2.5 rounded-2xl text-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <span className="text-gray-400 font-semibold">🏁 {round}/{GQ_ROUNDS}</span>
        <span className="text-amber-400 font-bold">💰 {state.playerGold}</span>
        <button onClick={endRun} className="text-gray-500 hover:text-white text-xs font-semibold">Give Up</button>
      </div>

      {phase === "question" && q && (
        <div>
          <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-lg font-semibold text-white">{q.text}</p>
          </div>
          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => answerQuestion(idx)}
                className="w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium bg-white/5 border-white/10 text-gray-300 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-white"
              >
                <span className="text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "chest" && (
        <div className="text-center">
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-5"
            style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.35)", color: "#facc15" }}
          >
            ✅ Correct! Pick a chest
          </span>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: GQ_CHEST_COUNT }).map((_, i) => (
              <button
                key={i}
                onClick={() => pickChest(CHEST_GOLD_BASE + round * 5)}
                className="card-shimmer rounded-2xl p-6 text-5xl transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(160deg, rgba(217,119,6,0.18), rgba(217,119,6,0.05))",
                  border: "1px solid rgba(234,179,8,0.3)",
                  boxShadow: "0 0 24px -8px rgba(217,119,6,0.5)",
                }}
              >
                📦
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="text-center">
          <div
            className="inline-flex flex-col items-center gap-1 px-8 py-6 rounded-2xl mb-6"
            style={{ background: resultStyle.bg, border: `1px solid ${resultStyle.border}` }}
          >
            <span className="text-4xl">{resultStyle.icon}</span>
            <p className="font-bold text-lg" style={{ color: resultStyle.color }}>{resultText}</p>
            <p className="text-gray-400 text-sm">💰 {state.playerGold} gold</p>
          </div>
          <button
            onClick={advanceRound}
            className="px-6 py-3 text-white font-semibold rounded-xl transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)" }}
          >
            {round >= GQ_ROUNDS ? "See Results" : "Next Round"}
          </button>
        </div>
      )}
    </div>
  );
}
