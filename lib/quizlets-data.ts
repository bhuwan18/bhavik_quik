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
  { name: "Loopix", rarity: "uncommon", pack: "tech-pack", icon: "🔄", colorFrom: "#2dd4bf", colorTo: "#0d9488", description: "An infinite loop that somehow terminates at exactly the right moment.", isHidden: false, sellValue: 25 },

  // ── SPORTS PACK ────────────────────────────────────────────────
  { name: "Kicksy", rarity: "common", pack: "sports-pack", icon: "⚽", colorFrom: "#bbf7d0", colorTo: "#86efac", description: "A spirited football that scores on its own.", isHidden: false, sellValue: 10 },
  { name: "Stumpy", rarity: "common", pack: "sports-pack", icon: "🏏", colorFrom: "#fde68a", colorTo: "#fbbf24", description: "A cricket stump with extraordinary defensive skills.", isHidden: false, sellValue: 10 },
  { name: "Goalie", rarity: "uncommon", pack: "sports-pack", icon: "🥅", colorFrom: "#4ade80", colorTo: "#16a34a", description: "An unbeatable goalkeeper spirit that never lets a ball through.", isHidden: false, sellValue: 25 },
  { name: "Pacer", rarity: "uncommon", pack: "sports-pack", icon: "🏃", colorFrom: "#fb923c", colorTo: "#ea580c", description: "The fastest bowler in the spirit realm, 150 mph guaranteed.", isHidden: false, sellValue: 25 },
  { name: "HatTrick", rarity: "rare", pack: "sports-pack", icon: "🎩", colorFrom: "#38bdf8", colorTo: "#0369a1", description: "Scores three in a row every single time.", isHidden: false, sellValue: 60 },
  { name: "Centurion", rarity: "epic", pack: "sports-pack", icon: "💯", colorFrom: "#c084fc", colorTo: "#9333ea", description: "A legendary batsman who never gets out before a century.", isHidden: false, sellValue: 150 },
  { name: "The Captain", rarity: "legendary", pack: "sports-pack", icon: "👑", colorFrom: "#fcd34d", colorTo: "#f59e0b", description: "The eternal captain who has led every championship team.", isHidden: false, sellValue: 400 },
  { name: "OffsideGhost", rarity: "secret", pack: "sports-pack", icon: "👻", colorFrom: "#1e293b", colorTo: "#0f172a", description: "A specter that appears just behind the defensive line, invisible to referees.", isHidden: true, sellValue: 1000 },
  { name: "SwiftKick", rarity: "common", pack: "sports-pack", icon: "🦵", colorFrom: "#fef9c3", colorTo: "#fde047", description: "The fastest kick in the spirit realm — blink and you'll miss it.", isHidden: false, sellValue: 10 },

  // ── MAGIC PACK ─────────────────────────────────────────────────
  { name: "Spellette", rarity: "common", pack: "magic-pack", icon: "✨", colorFrom: "#ddd6fe", colorTo: "#c4b5fd", description: "A tiny spell in the shape of a sparkling star.", isHidden: false, sellValue: 10 },
  { name: "Wandy", rarity: "common", pack: "magic-pack", icon: "🪄", colorFrom: "#e9d5ff", colorTo: "#d8b4fe", description: "A wand with a mind of its own, casting spells randomly.", isHidden: false, sellValue: 10 },
  { name: "Owlet", rarity: "uncommon", pack: "magic-pack", icon: "🦉", colorFrom: "#a78bfa", colorTo: "#7c3aed", description: "A wise magical owl that delivers prophecies by post.", isHidden: false, sellValue: 25 },
  { name: "Cauldrina", rarity: "uncommon", pack: "magic-pack", icon: "🫧", colorFrom: "#6ee7b7", colorTo: "#059669", description: "A living cauldron that brews perfect potions automatically.", isHidden: false, sellValue: 25 },
  { name: "Patronix", rarity: "rare", pack: "magic-pack", icon: "🦌", colorFrom: "#93c5fd", colorTo: "#3b82f6", description: "A silvery patronus who defends against all dark forces.", isHidden: false, sellValue: 60 },
  { name: "Horcruxus", rarity: "epic", pack: "magic-pack", icon: "💀", colorFrom: "#7c3aed", colorTo: "#4c1d95", description: "A fractured soul vessel containing unimaginable power.", isHidden: false, sellValue: 150 },
  { name: "The Chosen One", rarity: "legendary", pack: "magic-pack", icon: "⚡", colorFrom: "#f59e0b", colorTo: "#d97706", description: "The destined hero whose lightning scar holds the secret of victory.", isHidden: false, sellValue: 400 },
  { name: "DeathlyHollow", rarity: "secret", pack: "magic-pack", icon: "☠️", colorFrom: "#111827", colorTo: "#030712", description: "A being that has mastered all three Deathly Hallows and conquered death itself.", isHidden: true, sellValue: 1000 },
  { name: "Grimoire", rarity: "rare", pack: "magic-pack", icon: "📖", colorFrom: "#818cf8", colorTo: "#4338ca", description: "A self-writing spellbook that updates with forbidden knowledge each night.", isHidden: false, sellValue: 60 },

  // ── HERO PACK ──────────────────────────────────────────────────
  { name: "Shieldlet", rarity: "common", pack: "hero-pack", icon: "🛡️", colorFrom: "#bfdbfe", colorTo: "#93c5fd", description: "A tiny vibranium shield that blocks all incoming attacks.", isHidden: false, sellValue: 10 },
  { name: "Sparky", rarity: "common", pack: "hero-pack", icon: "⚡", colorFrom: "#fef08a", colorTo: "#fde047", description: "A small lightning bolt with big hero energy.", isHidden: false, sellValue: 10 },
  { name: "Gauntlet Jr.", rarity: "uncommon", pack: "hero-pack", icon: "🧤", colorFrom: "#f97316", colorTo: "#c2410c", description: "A miniature infinity gauntlet with half the power.", isHidden: false, sellValue: 25 },
  { name: "Webslinger", rarity: "uncommon", pack: "hero-pack", icon: "🕷️", colorFrom: "#ef4444", colorTo: "#b91c1c", description: "A web-shooting spirit with spectacular neighbourhood patrol skills.", isHidden: false, sellValue: 25 },
  { name: "Mjolnic", rarity: "rare", pack: "hero-pack", icon: "🔨", colorFrom: "#60a5fa", colorTo: "#1d4ed8", description: "A worthy hammer that only the noble may lift.", isHidden: false, sellValue: 60 },
  { name: "Starkbot", rarity: "epic", pack: "hero-pack", icon: "🤖", colorFrom: "#f97316", colorTo: "#dc2626", description: "An ultra-smart AI suit built by the greatest genius in the universe.", isHidden: false, sellValue: 150 },
  { name: "Infinity Quizlet", rarity: "legendary", pack: "hero-pack", icon: "💎", colorFrom: "#f59e0b", colorTo: "#7c3aed", description: "Born from all six infinity stones. Reality bends to its will.", isHidden: false, sellValue: 400 },
  { name: "The Snap", rarity: "secret", pack: "hero-pack", icon: "👆", colorFrom: "#1f2937", colorTo: "#030712", description: "A snap that erases half of anything. Handle with extreme care.", isHidden: true, sellValue: 1000 },
  { name: "CloakDagger", rarity: "uncommon", pack: "hero-pack", icon: "🗡️", colorFrom: "#4d7c0f", colorTo: "#1a2e05", description: "A shadow hero who operates from the darkness and never takes credit.", isHidden: false, sellValue: 25 },

  // ── MUSIC PACK ─────────────────────────────────────────────────
  { name: "Noteling", rarity: "common", pack: "music-pack", icon: "🎵", colorFrom: "#fca5a5", colorTo: "#f87171", description: "A cheerful musical note that hums itself to sleep.", isHidden: false, sellValue: 10 },
  { name: "Brushy", rarity: "common", pack: "music-pack", icon: "🎨", colorFrom: "#fdba74", colorTo: "#fb923c", description: "A paintbrush that creates masterpieces without a hand to hold it.", isHidden: false, sellValue: 10 },
  { name: "Stringy", rarity: "uncommon", pack: "music-pack", icon: "🎸", colorFrom: "#fb7185", colorTo: "#e11d48", description: "An electric guitar string that plays legendary solos independently.", isHidden: false, sellValue: 25 },
  { name: "Canvassi", rarity: "uncommon", pack: "music-pack", icon: "🖼️", colorFrom: "#86efac", colorTo: "#22c55e", description: "A living canvas that absorbs and reflects the emotions of its viewer.", isHidden: false, sellValue: 25 },
  { name: "Maestrix", rarity: "rare", pack: "music-pack", icon: "🎼", colorFrom: "#818cf8", colorTo: "#4f46e5", description: "A conducting wand that orchestrates entire symphonies.", isHidden: false, sellValue: 60 },
  { name: "VinylGod", rarity: "epic", pack: "music-pack", icon: "💿", colorFrom: "#a78bfa", colorTo: "#6d28d9", description: "An ancient vinyl disc containing the universe's first song.", isHidden: false, sellValue: 150 },
  { name: "The Muse", rarity: "legendary", pack: "music-pack", icon: "🌟", colorFrom: "#fbbf24", colorTo: "#f59e0b", description: "The eternal source of all artistic inspiration since the dawn of creation.", isHidden: false, sellValue: 400 },
  { name: "SilentNote", rarity: "secret", pack: "music-pack", icon: "🔇", colorFrom: "#1e293b", colorTo: "#0f172a", description: "A note so powerful it cannot be heard — only felt in the soul.", isHidden: true, sellValue: 1000 },
  { name: "Beatdrop", rarity: "common", pack: "music-pack", icon: "🥁", colorFrom: "#f9a8d4", colorTo: "#db2777", description: "A drumbeat spirit that arrives exactly one second before the bass drops.", isHidden: false, sellValue: 10 },

  // ── SCIENCE PACK ───────────────────────────────────────────────
  { name: "Atomlet", rarity: "common", pack: "science-pack", icon: "⚛️", colorFrom: "#bae6fd", colorTo: "#7dd3fc", description: "The friendliest atom in the periodic table.", isHidden: false, sellValue: 10 },
  { name: "Formulix", rarity: "common", pack: "science-pack", icon: "🔢", colorFrom: "#d9f99d", colorTo: "#a3e635", description: "A formula that solves itself before you finish writing it.", isHidden: false, sellValue: 10 },
  { name: "Prismara", rarity: "uncommon", pack: "science-pack", icon: "🔭", colorFrom: "#6ee7b7", colorTo: "#10b981", description: "A prism that reveals the hidden spectrum of dark matter.", isHidden: false, sellValue: 25 },
  { name: "Problix", rarity: "uncommon", pack: "science-pack", icon: "🧪", colorFrom: "#fda4af", colorTo: "#f43f5e", description: "A probability particle that is always in two places at once.", isHidden: false, sellValue: 25 },
  { name: "Neutrina", rarity: "rare", pack: "science-pack", icon: "💫", colorFrom: "#93c5fd", colorTo: "#2563eb", description: "A neutrino that passes through walls, planets, and logic.", isHidden: false, sellValue: 60 },
  { name: "Singulara", rarity: "epic", pack: "science-pack", icon: "🌀", colorFrom: "#7c3aed", colorTo: "#4c1d95", description: "A miniature black hole that bends space around your equations.", isHidden: false, sellValue: 150 },
  { name: "Einstein's Ghost", rarity: "legendary", pack: "science-pack", icon: "👨‍🔬", colorFrom: "#f59e0b", colorTo: "#b45309", description: "The spirit of relativity itself, still working on the unified theory.", isHidden: false, sellValue: 400 },
  { name: "Dark Matter", rarity: "secret", pack: "science-pack", icon: "🌑", colorFrom: "#030712", colorTo: "#111827", description: "Comprises 27% of the universe. You have somehow collected it.", isHidden: true, sellValue: 1000 },
  { name: "Polymere", rarity: "rare", pack: "science-pack", icon: "🧬", colorFrom: "#6ee7b7", colorTo: "#059669", description: "A long-chain molecular being that can fold into any shape imaginable.", isHidden: false, sellValue: 60 },

  // ── MATH PACK ──────────────────────────────────────────────────
  { name: "Numblet", rarity: "common", pack: "math-pack", icon: "🔢", colorFrom: "#bfdbfe", colorTo: "#93c5fd", description: "A tiny number sprite that counts everything it sees — twice, just to be sure.", isHidden: false, sellValue: 10 },
  { name: "Fraxion", rarity: "common", pack: "math-pack", icon: "➗", colorFrom: "#bbf7d0", colorTo: "#86efac", description: "Half of a whole, one-third of chaos — Fraxion lives between the integers.", isHidden: false, sellValue: 10 },
  { name: "Algy", rarity: "uncommon", pack: "math-pack", icon: "🔡", colorFrom: "#60a5fa", colorTo: "#2563eb", description: "An algebra spirit that solves for X before you even write the equation.", isHidden: false, sellValue: 25 },
  { name: "Geometrix", rarity: "uncommon", pack: "math-pack", icon: "📐", colorFrom: "#34d399", colorTo: "#059669", description: "A shape-shifting entity that proves every theorem by simply existing.", isHidden: false, sellValue: 25 },
  { name: "Primelock", rarity: "rare", pack: "math-pack", icon: "🔒", colorFrom: "#818cf8", colorTo: "#4338ca", description: "Guardian of all prime numbers — divisible only by itself and one.", isHidden: false, sellValue: 60 },
  { name: "Calculus Rex", rarity: "epic", pack: "math-pack", icon: "📈", colorFrom: "#a78bfa", colorTo: "#6d28d9", description: "Master of derivatives and integrals — it finds the rate of change in your soul.", isHidden: false, sellValue: 150 },
  { name: "The Infinite", rarity: "legendary", pack: "math-pack", icon: "♾️", colorFrom: "#fbbf24", colorTo: "#b45309", description: "A being without end, without bound — mathematics itself given consciousness.", isHidden: false, sellValue: 400 },
  { name: "Zero Divide", rarity: "secret", pack: "math-pack", icon: "💥", colorFrom: "#1e1b4b", colorTo: "#0f0a23", description: "The catastrophic result of dividing by zero. Reality cracks wherever it appears.", isHidden: true, sellValue: 1000 },

  // ── ENGLISH PACK ───────────────────────────────────────────────
  { name: "Syllaby", rarity: "common", pack: "english-pack", icon: "🔤", colorFrom: "#fce7f3", colorTo: "#fbcfe8", description: "A cheerful syllable spirit that breaks every word into its smallest happy pieces.", isHidden: false, sellValue: 10 },
  { name: "Punctus", rarity: "common", pack: "english-pack", icon: "❗", colorFrom: "#fde68a", colorTo: "#fbbf24", description: "A punctuation spirit that arrives at the end of every sentence — always on time.", isHidden: false, sellValue: 10 },
  { name: "Metaphoria", rarity: "uncommon", pack: "english-pack", icon: "🌊", colorFrom: "#c084fc", colorTo: "#9333ea", description: "A metaphor weaver whose words paint pictures that outlast a thousand images.", isHidden: false, sellValue: 25 },
  { name: "Rhymix", rarity: "uncommon", pack: "english-pack", icon: "🎤", colorFrom: "#f9a8d4", colorTo: "#db2777", description: "A rhyming spirit that turns any sentence into poetry without missing a beat.", isHidden: false, sellValue: 25 },
  { name: "Grammara", rarity: "rare", pack: "english-pack", icon: "📝", colorFrom: "#a3e635", colorTo: "#4d7c0f", description: "The strict guardian of grammar — it corrects your tenses before you finish thinking.", isHidden: false, sellValue: 60 },
  { name: "Lexicon", rarity: "epic", pack: "english-pack", icon: "📖", colorFrom: "#7c3aed", colorTo: "#4c1d95", description: "Master of every word ever spoken — its vocabulary has no limits and no end.", isHidden: false, sellValue: 150 },
  { name: "The Bard", rarity: "legendary", pack: "english-pack", icon: "🎭", colorFrom: "#f59e0b", colorTo: "#d97706", description: "The eternal spirit of Shakespeare — to collect or not to collect was never a question.", isHidden: false, sellValue: 400 },
  { name: "Plagiarix", rarity: "secret", pack: "english-pack", icon: "📋", colorFrom: "#18181b", colorTo: "#09090b", description: "A forbidden entity that copies everything perfectly. Every librarian fears its presence.", isHidden: true, sellValue: 1000 },

  // ── RAINBOW PACK ───────────────────────────────────────────────
  { name: "Spectrox", rarity: "rare", pack: "rainbow-pack", icon: "🌈", colorFrom: "#f87171", colorTo: "#818cf8", description: "A prismatic spirit born from seven simultaneous rainbows.", isHidden: false, sellValue: 60 },
  { name: "Chromara", rarity: "epic", pack: "rainbow-pack", icon: "🎆", colorFrom: "#c084fc", colorTo: "#38bdf8", description: "A chromatic entity that shifts colour every millisecond.", isHidden: false, sellValue: 150 },
  { name: "Aurorex", rarity: "legendary", pack: "rainbow-pack", icon: "🌌", colorFrom: "#fbbf24", colorTo: "#a78bfa", description: "The spirit of the northern lights, wandering the cosmos.", isHidden: false, sellValue: 400 },
  { name: "The Impossible One", rarity: "impossible", pack: "rainbow-pack", icon: "🌟", colorFrom: "#f43f5e", colorTo: "#3b82f6", description: "A being so rare it should not exist. 0.001% chance. You defied all odds.", isHidden: true, sellValue: 99999 },
  { name: "Prismixa", rarity: "epic", pack: "rainbow-pack", icon: "💠", colorFrom: "#f0abfc", colorTo: "#a855f7", description: "A chromatic entity that splits pure white light into an infinite spectrum of colour.", isHidden: false, sellValue: 150 },

  // ── GLOBAL UNIQUE QUIZLETS (3 total, hidden, cross-pack) ───────
  { name: "Omnivex", rarity: "unique", pack: "rainbow-pack", icon: "🔮", colorFrom: "#ec4899", colorTo: "#8b5cf6", description: "One of three unique beings. Omnivex knows the answer before the question is asked.", isHidden: true, sellValue: 5000 },
  { name: "Voidheart", rarity: "unique", pack: "tech-pack", icon: "🫀", colorFrom: "#1d4ed8", colorTo: "#6d28d9", description: "One of three unique beings. Voidheart beats with pure digital emotion.", isHidden: true, sellValue: 5000 },
  { name: "Eternia", rarity: "unique", pack: "magic-pack", icon: "♾️", colorFrom: "#d97706", colorTo: "#dc2626", description: "One of three unique beings. Eternia has existed since before the universe.", isHidden: true, sellValue: 5000 },

  // ── MYSTICAL QUIZLETS (achievement-based, not pack-openable) ──────
  { name: "Language Nerd", rarity: "mystical", pack: "mystical", icon: "🗣️", colorFrom: "#f59e0b", colorTo: "#7c3aed", description: "Fluent in quizzes. Ten world languages challenges conquered — a true polyglot of knowledge.", isHidden: false, sellValue: 500 },
  { name: "Atypical Choices", rarity: "mystical", pack: "mystical", icon: "🌀", colorFrom: "#2dd4bf", colorTo: "#6d28d9", description: "Awarded to the explorer who dares to play the road less travelled — the quiz nobody else bothered to try.", isHidden: false, sellValue: 500 },
  { name: "Hogwarts Legend", rarity: "mystical", pack: "mystical", icon: "⚡", colorFrom: "#7c3aed", colorTo: "#b45309", description: "A true master of the wizarding world, forged through ten legendary quests inside Hogwarts' hallowed halls.", isHidden: false, sellValue: 500 },
  { name: "Arc Reactor", rarity: "mystical", pack: "mystical", icon: "🔵", colorFrom: "#38bdf8", colorTo: "#1e40af", description: "Power source of a hero. Earned by those who answered Earth's Mightiest questions ten times over.", isHidden: false, sellValue: 500 },
  { name: "Mathematician", rarity: "mystical", pack: "mystical", icon: "📐", colorFrom: "#60a5fa", colorTo: "#4338ca", description: "Numbers bend to their will. A scholar who has proven mastery of math across ten rigorous challenges.", isHidden: false, sellValue: 500 },
  { name: "Global Expert", rarity: "mystical", pack: "mystical", icon: "🗺️", colorFrom: "#34d399", colorTo: "#0f766e", description: "Ten geography quizzes conquered. They know the mountains, rivers, and borders of the world like their own backyard.", isHidden: false, sellValue: 500 },
  { name: "Master of Travel", rarity: "mystical", pack: "mystical", icon: "✈️", colorFrom: "#f97316", colorTo: "#0284c7", description: "Destination: everywhere. Ten world travel quizzes completed — passport stamps from the quiz realm.", isHidden: false, sellValue: 500 },
  { name: "Lord of Laughs", rarity: "mystical", pack: "mystical", icon: "😂", colorFrom: "#fbbf24", colorTo: "#dc2626", description: "The internet bows before them. Ten meme quizzes mastered — they speak fluent internet.", isHidden: false, sellValue: 500 },
  { name: "Technological Wonder", rarity: "mystical", pack: "mystical", icon: "💡", colorFrom: "#22d3ee", colorTo: "#1d4ed8", description: "A digital prodigy who has conquered ten technology challenges. The future is already their present.", isHidden: false, sellValue: 500 },
  { name: "Technoblade Never Dies", rarity: "mystical", pack: "mystical", icon: "🐷", colorFrom: "#dc2626", colorTo: "#1c1917", description: "In memory of a gaming legend. Earned by those who've proven their skill across ten gaming quizzes. Never dies.", isHidden: false, sellValue: 500 },
  { name: "Newton's Spirit", rarity: "mystical", pack: "mystical", icon: "🍎", colorFrom: "#4ade80", colorTo: "#065f46", description: "An apple fell, and a universe of knowledge opened. Ten science quizzes completed — gravity of intellect.", isHidden: false, sellValue: 500 },
  { name: "Back of the Net", rarity: "mystical", pack: "mystical", icon: "⚽", colorFrom: "#16a34a", colorTo: "#15803d", description: "Ten football quizzes scored. The net knows their name — perfect technique, relentless accuracy.", isHidden: false, sellValue: 500 },
  { name: "Out of the Park", rarity: "mystical", pack: "mystical", icon: "🏏", colorFrom: "#f59e0b", colorTo: "#c2410c", description: "Hit ten cricket quizzes straight to the boundary. A batsman of pure knowledge and unyielding patience.", isHidden: false, sellValue: 500 },
  { name: "Flag of India", rarity: "mystical", pack: "mystical", icon: "🇮🇳", colorFrom: "#f97316", colorTo: "#16a34a", description: "Unfurled with pride. Ten flags quizzes completed — a patriot who knows the colours of every nation.", isHidden: false, sellValue: 500 },
  { name: "Senku Ishigami", rarity: "mystical", pack: "mystical", icon: "🧪", colorFrom: "#84cc16", colorTo: "#166534", description: "Ten billion percent certain. Ten anime quizzes cleared — science and anime knowledge combined into one force.", isHidden: false, sellValue: 500 },
  { name: "Laws of Physics", rarity: "mystical", pack: "mystical", icon: "⚛️", colorFrom: "#38bdf8", colorTo: "#4f46e5", description: "The universe follows their logic. Ten physics quizzes mastered — bending the laws only in the quiz realm.", isHidden: false, sellValue: 500 },
  { name: "Animal Lover", rarity: "mystical", pack: "mystical", icon: "🐾", colorFrom: "#34d399", colorTo: "#92400e", description: "From the deep sea to the treetops — ten animals quizzes tamed. Every creature's champion.", isHidden: false, sellValue: 500 },
  { name: "Ready", rarity: "mystical", pack: "mystical", icon: "🎒", colorFrom: "#2dd4bf", colorTo: "#0e7490", description: "More than ready. Ten Grade 6 quizzes completed — the foundation of knowledge, solidly built.", isHidden: false, sellValue: 500 },
  { name: "Picasso", rarity: "mystical", pack: "mystical", icon: "🎨", colorFrom: "#3b82f6", colorTo: "#be185d", description: "A masterpiece of art knowledge. Ten artist quizzes completed — they see the world through every brushstroke.", isHidden: false, sellValue: 500 },
  { name: "Prodigy", rarity: "mystical", pack: "mystical", icon: "🎵", colorFrom: "#a78bfa", colorTo: "#db2777", description: "Born with music in their soul. Ten musician quizzes conquered — every note, every beat, every legend known.", isHidden: false, sellValue: 500 },
  { name: "Follow the Path", rarity: "mystical", pack: "mystical", icon: "🌟", colorFrom: "#f59e0b", colorTo: "#ef4444", description: "You walked the road most taken. Awarded for completing the most popular quiz in the realm — the one everyone comes to conquer.", isHidden: false, sellValue: 500 },
  { name: "Spending Machine", rarity: "mystical", pack: "mystical", icon: "💸", colorFrom: "#22c55e", colorTo: "#064e3b", description: "Coins burn a hole in their pocket. Earned by spending over 5,000 coins in a single day — a true high-roller of the quiz economy.", isHidden: false, sellValue: 500 },
  { name: "Completion", rarity: "mystical", pack: "mystical", icon: "🎯", colorFrom: "#e879f9", colorTo: "#7c3aed", description: "A collector's dream realized. Every common, uncommon, rare, epic, and legendary quizlet in the realm is yours.", isHidden: false, sellValue: 500 },

  // ── FESTIVAL PACK QUIZLETS ─────────────────────────────────────
  { name: "Fireworksy", rarity: "rare", pack: "newyear-pack", icon: "🎇", colorFrom: "#fbbf24", colorTo: "#7c3aed", description: "Born at midnight every new year — explodes with joy and fades into stardust.", isHidden: false, sellValue: 60 },
  { name: "Lovette", rarity: "uncommon", pack: "love-pack", icon: "💝", colorFrom: "#fda4af", colorTo: "#be123c", description: "A love-struck spirit that makes everything it touches a little warmer.", isHidden: false, sellValue: 25 },
  { name: "Gulalia", rarity: "uncommon", pack: "holi-pack", icon: "🌺", colorFrom: "#f472b6", colorTo: "#be185d", description: "A colour-drenched spirit born from the most vibrant Holi celebration ever played.", isHidden: false, sellValue: 25 },
  { name: "Spooklet", rarity: "rare", pack: "spooky-pack", icon: "🕯️", colorFrom: "#c2410c", colorTo: "#431407", description: "A flickering candle spirit that appears in haunted houses at the stroke of midnight.", isHidden: false, sellValue: 60 },
  { name: "Diyaling", rarity: "uncommon", pack: "diwali-pack", icon: "🌠", colorFrom: "#fcd34d", colorTo: "#b45309", description: "A tiny earthen lamp spirit that drives away darkness with its eternal golden warmth.", isHidden: false, sellValue: 25 },
  { name: "Jinglix", rarity: "rare", pack: "xmas-pack", icon: "🔔", colorFrom: "#fcd34d", colorTo: "#15803d", description: "A golden bell that rings once a year — its sound brings good fortune to all who hear it.", isHidden: false, sellValue: 60 },
];

export const PACK_QUIZLETS = (packSlug: string) =>
  QUIZLETS_DATA.filter((q) => q.pack === packSlug);
