export const tokens = {
  colors: {
    bg: "#070511",
    surface: "#110d2a",
    border: "#2d1f5e",
    accent: "#8b5cf6",
    accent2: "#ec4899",
    text: "#f0f0ff",
    textMuted: "rgba(240,240,255,0.55)",
    textDim: "rgba(240,240,255,0.28)",
    success: "#4ade80",
    gold: "#facc15",
  },
  fonts: {
    body: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    heading: '"Space Grotesk", "Inter", system-ui, sans-serif',
  },
  rarity: {
    legendary: {
      border: "#facc15",
      glow: "rgba(250,204,21,0.65)",
      text: "#facc15",
      bg: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)",
    },
    epic: {
      border: "#a855f7",
      glow: "rgba(168,85,247,0.5)",
      text: "#a855f7",
      bg: "linear-gradient(135deg, #3b0764 0%, #4c1d95 100%)",
    },
    rare: {
      border: "#60a5fa",
      glow: "rgba(96,165,250,0.4)",
      text: "#60a5fa",
      bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
    },
  },
  milestones: {
    bronze: "#b45309",
    silver: "#94a3b8",
    gold: "#facc15",
    platinum: "#22d3ee",
    diamond: "#c084fc",
  },
} as const;
