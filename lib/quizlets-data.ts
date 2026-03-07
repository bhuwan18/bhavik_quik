export type QuizletDef = {
  name: string;
  rarity: string;
  pack: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  description: string;
  isHidden: boolean;
  sellValue: number;
};

export const QUIZLETS_DATA: QuizletDef[] = [
  // ── TECH PACK ──────────────────────────────────────────────────
  { name: "Bitling", rarity: "common", pack: "tech-pack", icon: "🤖", colorFrom: "#94a3b8", colorTo: "#cbd5e1", description: "A tiny digital creature made of pure binary code.", isHidden: false, sellValue: 10 },
  { name: "Pixbot", rarity: "common", pack: "tech-pack", icon: "🖥️", colorFrom: "#a1a1aa", colorTo: "#d4d4d8", description: "A friendly pixel-art robot that loves debugging.", isHidden: false, sellValue: 10 },
  { name: "Hexara", rarity: "uncommon", pack: "tech-pack", icon: "🔷", colorFrom: "#38bdf8", colorTo: "#0284c7", description: "A hexadecimal sprite with memory manipulation powers.", isHidden: false, sellValue: 25 },
  { name: "Codex", rarity: "uncommon", pack: "tech-pack", icon: "📟", colorFrom: "#34d399", colorTo: "#059669", description: "An ancient coding spirit revived by modern algorithms.", isHidden: false, sellValue: 25 },
  { name: "NullByte", rarity: "rare", pack: "tech-pack", icon: "💾", colorFrom: "#60a5fa", colorTo: "#2563eb", description: "The void of data — absorbs any corrupt information.", isHidden: false, sellValue: 60 },
  { name: "Quantrix", rarity: "epic", pack: "tech-pack", icon: "⚡", colorFrom: "#a78bfa", colorTo: "#7c3aed", description: "A quantum processor that exists in superposition.", isHidden: false, sellValue: 150 },
  { name: "Cypher X", rarity: "legendary", pack: "tech-pack", icon: "🔐", colorFrom: "#fbbf24", colorTo: "#d97706", description: "The legendary unbreakable cipher from the future net.", isHidden: false, sellValue: 400 },
  { name: "GlitchGod", rarity: "secret", pack: "tech-pack", icon: "👾", colorFrom: "#1f2937", colorTo: "#111827", description: "A being born from the most catastrophic system error ever recorded.", isHidden: true, sellValue: 1000 },

  // ── SPORTS PACK ────────────────────────────────────────────────
  { name: "Kicksy", rarity: "common", pack: "sports-pack", icon: "⚽", colorFrom: "#bbf7d0", colorTo: "#86efac", description: "A spirited football that scores on its own.", isHidden: false, sellValue: 10 },
  { name: "Stumpy", rarity: "common", pack: "sports-pack", icon: "🏏", colorFrom: "#fde68a", colorTo: "#fbbf24", description: "A cricket stump with extraordinary defensive skills.", isHidden: false, sellValue: 10 },
  { name: "Goalie", rarity: "uncommon", pack: "sports-pack", icon: "🥅", colorFrom: "#4ade80", colorTo: "#16a34a", description: "An unbeatable goalkeeper spirit that never lets a ball through.", isHidden: false, sellValue: 25 },
  { name: "Pacer", rarity: "uncommon", pack: "sports-pack", icon: "🏃", colorFrom: "#fb923c", colorTo: "#ea580c", description: "The fastest bowler in the spirit realm, 150 mph guaranteed.", isHidden: false, sellValue: 25 },
  { name: "HatTrick", rarity: "rare", pack: "sports-pack", icon: "🎩", colorFrom: "#38bdf8", colorTo: "#0369a1", description: "Scores three in a row every single time.", isHidden: false, sellValue: 60 },
  { name: "Centurion", rarity: "epic", pack: "sports-pack", icon: "💯", colorFrom: "#c084fc", colorTo: "#9333ea", description: "A legendary batsman who never gets out before a century.", isHidden: false, sellValue: 150 },
  { name: "The Captain", rarity: "legendary", pack: "sports-pack", icon: "👑", colorFrom: "#fcd34d", colorTo: "#f59e0b", description: "The eternal captain who has led every championship team.", isHidden: false, sellValue: 400 },
  { name: "OffsideGhost", rarity: "secret", pack: "sports-pack", icon: "👻", colorFrom: "#1e293b", colorTo: "#0f172a", description: "A specter that appears just behind the defensive line, invisible to referees.", isHidden: true, sellValue: 1000 },

  // ── MAGIC PACK ─────────────────────────────────────────────────
  { name: "Spellette", rarity: "common", pack: "magic-pack", icon: "✨", colorFrom: "#ddd6fe", colorTo: "#c4b5fd", description: "A tiny spell in the shape of a sparkling star.", isHidden: false, sellValue: 10 },
  { name: "Wandy", rarity: "common", pack: "magic-pack", icon: "🪄", colorFrom: "#e9d5ff", colorTo: "#d8b4fe", description: "A wand with a mind of its own, casting spells randomly.", isHidden: false, sellValue: 10 },
  { name: "Owlet", rarity: "uncommon", pack: "magic-pack", icon: "🦉", colorFrom: "#a78bfa", colorTo: "#7c3aed", description: "A wise magical owl that delivers prophecies by post.", isHidden: false, sellValue: 25 },
  { name: "Cauldrina", rarity: "uncommon", pack: "magic-pack", icon: "🫧", colorFrom: "#6ee7b7", colorTo: "#059669", description: "A living cauldron that brews perfect potions automatically.", isHidden: false, sellValue: 25 },
  { name: "Patronix", rarity: "rare", pack: "magic-pack", icon: "🦌", colorFrom: "#93c5fd", colorTo: "#3b82f6", description: "A silvery patronus who defends against all dark forces.", isHidden: false, sellValue: 60 },
  { name: "Horcruxus", rarity: "epic", pack: "magic-pack", icon: "💀", colorFrom: "#7c3aed", colorTo: "#4c1d95", description: "A fractured soul vessel containing unimaginable power.", isHidden: false, sellValue: 150 },
  { name: "The Chosen One", rarity: "legendary", pack: "magic-pack", icon: "⚡", colorFrom: "#f59e0b", colorTo: "#d97706", description: "The destined hero whose lightning scar holds the secret of victory.", isHidden: false, sellValue: 400 },
  { name: "DeathlyHollow", rarity: "secret", pack: "magic-pack", icon: "☠️", colorFrom: "#111827", colorTo: "#030712", description: "A being that has mastered all three Deathly Hallows and conquered death itself.", isHidden: true, sellValue: 1000 },

  // ── HERO PACK ──────────────────────────────────────────────────
  { name: "Shieldlet", rarity: "common", pack: "hero-pack", icon: "🛡️", colorFrom: "#bfdbfe", colorTo: "#93c5fd", description: "A tiny vibranium shield that blocks all incoming attacks.", isHidden: false, sellValue: 10 },
  { name: "Sparky", rarity: "common", pack: "hero-pack", icon: "⚡", colorFrom: "#fef08a", colorTo: "#fde047", description: "A small lightning bolt with big hero energy.", isHidden: false, sellValue: 10 },
  { name: "Gauntlet Jr.", rarity: "uncommon", pack: "hero-pack", icon: "🧤", colorFrom: "#f97316", colorTo: "#c2410c", description: "A miniature infinity gauntlet with half the power.", isHidden: false, sellValue: 25 },
  { name: "Webslinger", rarity: "uncommon", pack: "hero-pack", icon: "🕷️", colorFrom: "#ef4444", colorTo: "#b91c1c", description: "A web-shooting spirit with spectacular neighbourhood patrol skills.", isHidden: false, sellValue: 25 },
  { name: "Mjolnic", rarity: "rare", pack: "hero-pack", icon: "🔨", colorFrom: "#60a5fa", colorTo: "#1d4ed8", description: "A worthy hammer that only the noble may lift.", isHidden: false, sellValue: 60 },
  { name: "Starkbot", rarity: "epic", pack: "hero-pack", icon: "🤖", colorFrom: "#f97316", colorTo: "#dc2626", description: "An ultra-smart AI suit built by the greatest genius in the universe.", isHidden: false, sellValue: 150 },
  { name: "Infinity Quizlet", rarity: "legendary", pack: "hero-pack", icon: "💎", colorFrom: "#f59e0b", colorTo: "#7c3aed", description: "Born from all six infinity stones. Reality bends to its will.", isHidden: false, sellValue: 400 },
  { name: "The Snap", rarity: "secret", pack: "hero-pack", icon: "👆", colorFrom: "#1f2937", colorTo: "#030712", description: "A snap that erases half of anything. Handle with extreme care.", isHidden: true, sellValue: 1000 },

  // ── MUSIC PACK ─────────────────────────────────────────────────
  { name: "Noteling", rarity: "common", pack: "music-pack", icon: "🎵", colorFrom: "#fca5a5", colorTo: "#f87171", description: "A cheerful musical note that hums itself to sleep.", isHidden: false, sellValue: 10 },
  { name: "Brushy", rarity: "common", pack: "music-pack", icon: "🎨", colorFrom: "#fdba74", colorTo: "#fb923c", description: "A paintbrush that creates masterpieces without a hand to hold it.", isHidden: false, sellValue: 10 },
  { name: "Stringy", rarity: "uncommon", pack: "music-pack", icon: "🎸", colorFrom: "#fb7185", colorTo: "#e11d48", description: "An electric guitar string that plays legendary solos independently.", isHidden: false, sellValue: 25 },
  { name: "Canvassi", rarity: "uncommon", pack: "music-pack", icon: "🖼️", colorFrom: "#86efac", colorTo: "#22c55e", description: "A living canvas that absorbs and reflects the emotions of its viewer.", isHidden: false, sellValue: 25 },
  { name: "Maestrix", rarity: "rare", pack: "music-pack", icon: "🎼", colorFrom: "#818cf8", colorTo: "#4f46e5", description: "A conducting wand that orchestrates entire symphonies.", isHidden: false, sellValue: 60 },
  { name: "VinylGod", rarity: "epic", pack: "music-pack", icon: "💿", colorFrom: "#a78bfa", colorTo: "#6d28d9", description: "An ancient vinyl disc containing the universe's first song.", isHidden: false, sellValue: 150 },
  { name: "The Muse", rarity: "legendary", pack: "music-pack", icon: "🌟", colorFrom: "#fbbf24", colorTo: "#f59e0b", description: "The eternal source of all artistic inspiration since the dawn of creation.", isHidden: false, sellValue: 400 },
  { name: "SilentNote", rarity: "secret", pack: "music-pack", icon: "🔇", colorFrom: "#1e293b", colorTo: "#0f172a", description: "A note so powerful it cannot be heard — only felt in the soul.", isHidden: true, sellValue: 1000 },

  // ── SCIENCE PACK ───────────────────────────────────────────────
  { name: "Atomlet", rarity: "common", pack: "science-pack", icon: "⚛️", colorFrom: "#bae6fd", colorTo: "#7dd3fc", description: "The friendliest atom in the periodic table.", isHidden: false, sellValue: 10 },
  { name: "Formulix", rarity: "common", pack: "science-pack", icon: "🔢", colorFrom: "#d9f99d", colorTo: "#a3e635", description: "A formula that solves itself before you finish writing it.", isHidden: false, sellValue: 10 },
  { name: "Prismara", rarity: "uncommon", pack: "science-pack", icon: "🔭", colorFrom: "#6ee7b7", colorTo: "#10b981", description: "A prism that reveals the hidden spectrum of dark matter.", isHidden: false, sellValue: 25 },
  { name: "Problix", rarity: "uncommon", pack: "science-pack", icon: "🧪", colorFrom: "#fda4af", colorTo: "#f43f5e", description: "A probability particle that is always in two places at once.", isHidden: false, sellValue: 25 },
  { name: "Neutrina", rarity: "rare", pack: "science-pack", icon: "💫", colorFrom: "#93c5fd", colorTo: "#2563eb", description: "A neutrino that passes through walls, planets, and logic.", isHidden: false, sellValue: 60 },
  { name: "Singulara", rarity: "epic", pack: "science-pack", icon: "🌀", colorFrom: "#7c3aed", colorTo: "#4c1d95", description: "A miniature black hole that bends space around your equations.", isHidden: false, sellValue: 150 },
  { name: "Einstein's Ghost", rarity: "legendary", pack: "science-pack", icon: "👨‍🔬", colorFrom: "#f59e0b", colorTo: "#b45309", description: "The spirit of relativity itself, still working on the unified theory.", isHidden: false, sellValue: 400 },
  { name: "Dark Matter", rarity: "secret", pack: "science-pack", icon: "🌑", colorFrom: "#030712", colorTo: "#111827", description: "Comprises 27% of the universe. You have somehow collected it.", isHidden: true, sellValue: 1000 },

  // ── RAINBOW PACK ───────────────────────────────────────────────
  { name: "Spectrox", rarity: "rare", pack: "rainbow-pack", icon: "🌈", colorFrom: "#f87171", colorTo: "#818cf8", description: "A prismatic spirit born from seven simultaneous rainbows.", isHidden: false, sellValue: 60 },
  { name: "Chromara", rarity: "epic", pack: "rainbow-pack", icon: "🎆", colorFrom: "#c084fc", colorTo: "#38bdf8", description: "A chromatic entity that shifts colour every millisecond.", isHidden: false, sellValue: 150 },
  { name: "Aurorex", rarity: "legendary", pack: "rainbow-pack", icon: "🌌", colorFrom: "#fbbf24", colorTo: "#a78bfa", description: "The spirit of the northern lights, wandering the cosmos.", isHidden: false, sellValue: 400 },
  { name: "The Impossible One", rarity: "impossible", pack: "rainbow-pack", icon: "🌟", colorFrom: "#f43f5e", colorTo: "#3b82f6", description: "A being so rare it should not exist. 0.001% chance. You defied all odds.", isHidden: true, sellValue: 99999 },

  // ── GLOBAL UNIQUE QUIZLETS (3 total, hidden, cross-pack) ───────
  { name: "Omnivex", rarity: "unique", pack: "rainbow-pack", icon: "🔮", colorFrom: "#ec4899", colorTo: "#8b5cf6", description: "One of three unique beings. Omnivex knows the answer before the question is asked.", isHidden: true, sellValue: 5000 },
  { name: "Voidheart", rarity: "unique", pack: "tech-pack", icon: "🫀", colorFrom: "#1d4ed8", colorTo: "#6d28d9", description: "One of three unique beings. Voidheart beats with pure digital emotion.", isHidden: true, sellValue: 5000 },
  { name: "Eternia", rarity: "unique", pack: "magic-pack", icon: "♾️", colorFrom: "#d97706", colorTo: "#dc2626", description: "One of three unique beings. Eternia has existed since before the universe.", isHidden: true, sellValue: 5000 },
];

export const PACK_QUIZLETS = (packSlug: string) =>
  QUIZLETS_DATA.filter((q) => q.pack === packSlug);
