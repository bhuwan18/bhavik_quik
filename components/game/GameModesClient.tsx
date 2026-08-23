"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import HackDevGame from "./HackDevGame";
import DinoRexLobby from "./DinoRexLobby";
import SpeedBlitzGame from "./SpeedBlitzGame";
import SurvivalGame from "./SurvivalGame";
import DailyChallengeGame from "./DailyChallengeGame";
import MonsterHunterGame from "./MonsterHunterGame";
import TowerDefenseGame from "./TowerDefenseGame";
import GoldQuestGame from "./GoldQuestGame";

type Mode = "select" | "hackdev" | "dinorex" | "speedblitz" | "survival" | "daily" | "monsterhunter" | "towerdefense" | "goldquest";

const MODES = [
  {
    id: "hackdev",
    name: "HackDev",
    description: "Tech questions only. 60-second sprint — answer as fast as you can!",
    icon: "💻",
    tag: "Single Player",
    color: "from-cyan-900/50 to-blue-900/30 border-cyan-500/30",
    tagColor: "bg-cyan-500/20 text-cyan-400",
  },
  {
    id: "dinorex",
    name: "DinoRex",
    description: "Multiplayer elimination. Wrong answer = you're out. Last one standing wins!",
    icon: "🦖",
    tag: "Multiplayer",
    color: "from-green-900/50 to-emerald-900/30 border-green-500/30",
    tagColor: "bg-green-500/20 text-green-400",
  },
  {
    id: "speedblitz",
    name: "Speed Blitz",
    description: "20 questions. 30 seconds. No time to think — just answer!",
    icon: "⚡",
    tag: "Single Player",
    color: "from-yellow-900/50 to-orange-900/30 border-yellow-500/30",
    tagColor: "bg-yellow-500/20 text-yellow-400",
  },
  {
    id: "survival",
    name: "Survival",
    description: "Answer correctly to stay alive. One wrong answer = game over. How far can you go?",
    icon: "❤️",
    tag: "Single Player",
    color: "from-red-900/50 to-rose-900/30 border-red-500/30",
    tagColor: "bg-red-500/20 text-red-400",
  },
  {
    id: "daily",
    name: "Daily Challenge",
    description: "5 questions, same for everyone today. Come back daily for a new challenge!",
    icon: "📅",
    tag: "Single Player",
    color: "from-teal-900/50 to-cyan-900/30 border-teal-500/30",
    tagColor: "bg-teal-500/20 text-teal-400",
  },
  {
    id: "monsterhunter",
    name: "Monster Hunter",
    description: "A dark maze, chasing monsters, auto-firing lasers. Level up and earn rarity-tiered perks.",
    icon: "🐛",
    tag: "🎮 Visual Game",
    color: "from-emerald-900/50 to-green-900/30 border-emerald-500/30",
    tagColor: "bg-fuchsia-500/20 text-fuchsia-400",
    isNew: true,
    glowRgb: "16,185,129",
  },
  {
    id: "towerdefense",
    name: "Tower Defense",
    description: "6 tower types, real monsters, 3 themed stages with boss waves. Answer questions to fund your defense.",
    icon: "🏰",
    tag: "🎮 Visual Game",
    color: "from-blue-900/50 to-indigo-900/30 border-blue-500/30",
    tagColor: "bg-fuchsia-500/20 text-fuchsia-400",
    isNew: true,
    glowRgb: "59,130,246",
  },
  {
    id: "goldquest",
    name: "Gold Quest",
    description: "Answer, then pick a chest — gold, a multiplier, a steal, or a trap. Race 3 rival bots.",
    icon: "💰",
    tag: "🎮 Visual Game",
    color: "from-amber-900/50 to-yellow-900/30 border-amber-500/30",
    tagColor: "bg-fuchsia-500/20 text-fuchsia-400",
    isNew: true,
    glowRgb: "245,158,11",
  },
  {
    id: "classic",
    name: "Classic Mode",
    description: "Standard quiz — no pressure, just enjoy the quiz from Discover.",
    icon: "📚",
    tag: "Single Player",
    color: "from-purple-900/50 to-indigo-900/30 border-purple-500/30",
    tagColor: "bg-purple-500/20 text-purple-400",
    disabled: false,
    href: "/discover",
  },
];

const DEEP_LINKABLE_MODES = new Set<Mode>([
  "hackdev", "dinorex", "speedblitz", "survival", "daily", "monsterhunter", "towerdefense", "goldquest",
]);

export default function GameModesClient() {
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const initialMode: Mode =
    requestedMode && DEEP_LINKABLE_MODES.has(requestedMode as Mode) ? (requestedMode as Mode) : "select";
  const [mode, setMode] = useState<Mode>(initialMode);

  if (mode === "hackdev") return <HackDevGame onBack={() => setMode("select")} />;
  if (mode === "dinorex") return <DinoRexLobby onBack={() => setMode("select")} />;
  if (mode === "speedblitz") return <SpeedBlitzGame onBack={() => setMode("select")} />;
  if (mode === "survival") return <SurvivalGame onBack={() => setMode("select")} />;
  if (mode === "daily") return <DailyChallengeGame onBack={() => setMode("select")} />;
  if (mode === "monsterhunter") return <MonsterHunterGame onBack={() => setMode("select")} />;
  if (mode === "towerdefense") return <TowerDefenseGame onBack={() => setMode("select")} />;
  if (mode === "goldquest") return <GoldQuestGame onBack={() => setMode("select")} />;

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🎮 Game Modes</h1>
        <p className="text-gray-400 mt-1">Choose your battle style — earn coins for every correct answer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map((m) => {
          const isVisualGame = "isNew" in m && m.isNew;
          return (
            <div
              key={m.id}
              onClick={() => {
                if ("href" in m && m.href) {
                  window.location.href = m.href;
                } else {
                  setMode(m.id as Mode);
                }
              }}
              className={`${isVisualGame ? "visual-mode-card" : ""} bg-gradient-to-br ${m.color} border rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-transform duration-200 group`}
              style={isVisualGame ? { ["--glow-rgb" as string]: (m as { glowRgb: string }).glowRgb } : undefined}
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`${isVisualGame ? "float-anim" : ""} text-4xl group-hover:scale-110 transition-transform`}>{m.icon}</span>
                <div className="flex items-center gap-1.5">
                  {isVisualGame && (
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      New
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${m.tagColor}`}>{m.tag}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{m.name}</h3>
              <p className="text-gray-400 text-sm">{m.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm text-center">
        🪙 All game modes award coins per correct answer. Pro members earn 1.5× — Max members earn 2×!
      </div>
    </div>
  );
}
