"use client";

import { useState } from "react";
import HackDevGame from "./HackDevGame";
import DinoRexLobby from "./DinoRexLobby";
import SpeedBlitzGame from "./SpeedBlitzGame";

type Mode = "select" | "hackdev" | "dinorex" | "speedblitz";

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

export default function GameModesClient() {
  const [mode, setMode] = useState<Mode>("select");

  if (mode === "hackdev") return <HackDevGame onBack={() => setMode("select")} />;
  if (mode === "dinorex") return <DinoRexLobby onBack={() => setMode("select")} />;
  if (mode === "speedblitz") return <SpeedBlitzGame onBack={() => setMode("select")} />;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🎮 Game Modes</h1>
        <p className="text-gray-400 mt-1">Choose your battle style — earn coins for every correct answer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map((m) => (
          <div
            key={m.id}
            onClick={() => {
              if ("href" in m && m.href) {
                window.location.href = m.href;
              } else {
                setMode(m.id as Mode);
              }
            }}
            className={`bg-gradient-to-br ${m.color} border rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:shadow-xl group`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform">{m.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${m.tagColor}`}>{m.tag}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{m.name}</h3>
            <p className="text-gray-400 text-sm">{m.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm text-center">
        🪙 All game modes award 5 coins per correct answer. Multiplayer winners get bonus coins!
      </div>
    </div>
  );
}
