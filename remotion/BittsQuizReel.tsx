/**
 * BittsQuizReel — portrait 1080×1920 (Instagram Reels / TikTok / YouTube Shorts)
 *
 * Same four scenes as BittsQuizVideo but re-laid-out for a 9:16 canvas:
 * larger cards, more vertical breathing room, oversized type.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { tokens } from "./tokens";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const FontFace: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
  `}</style>
);

const Orb: React.FC<{
  x: number; y: number; size: number; color: string; phase?: number;
}> = ({ x, y, size, color, phase = 0 }) => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin((frame + phase) * 0.04);
  return (
    <div style={{
      position: "absolute",
      left: x - size / 2, top: y - size / 2,
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      opacity: 0.12 + 0.07 * pulse,
      filter: `blur(${Math.round(size * 0.42)}px)`,
      pointerEvents: "none",
    }} />
  );
};

const SceneBG: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(160deg, #070511 0%, #0d0822 55%, #070511 100%)" }} />
);

const Vignette: React.FC = () => (
  <AbsoluteFill style={{
    background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 45%, rgba(7,5,17,0.7) 100%)",
    pointerEvents: "none",
  }} />
);

// ─── Scene 1 · Intro ─────────────────────────────────────────────────────────

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const boltScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const boltGlow  = interpolate(frame, [0, 20, 50, 89], [0, 1, 0.65, 1], CLAMP);

  const titleOpacity = interpolate(frame, [18, 44], [0, 1], CLAMP);
  const titleY       = interpolate(frame, [18, 44], [56, 0], CLAMP);

  const tagOpacity = interpolate(frame, [46, 70], [0, 1], CLAMP);
  const tagY       = interpolate(frame, [46, 70], [28, 0], CLAMP);

  // Decorative stat pills fade in at bottom
  const pillOpacity = interpolate(frame, [58, 78], [0, 1], CLAMP);
  const pillY       = interpolate(frame, [58, 78], [24, 0], CLAMP);

  const sceneOpacity = interpolate(frame, [80, 89], [1, 0], CLAMP);

  const stats = [
    { icon: "🧠", label: "55 Quizzes" },
    { icon: "🃏", label: "99 Quizlets" },
    { icon: "🏆", label: "Leaderboard" },
  ];

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <SceneBG />
      {/* Portrait orbs — spread vertically */}
      <Orb x={width * 0.2}  y={height * 0.18} size={600} color="#7c3aed" phase={0}  />
      <Orb x={width * 0.82} y={height * 0.52} size={500} color="#ec4899" phase={50} />
      <Orb x={width * 0.5}  y={height * 0.78} size={420} color="#8b5cf6" phase={25} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {/* ⚡ */}
        <div style={{
          fontSize: 180,
          lineHeight: 1,
          marginBottom: 44,
          transform: `scale(${boltScale})`,
          filter: `drop-shadow(0 0 ${Math.round(52 * boltGlow)}px rgba(139,92,246,0.9))`,
        }}>
          ⚡
        </div>

        {/* BittsQuiz 2026 */}
        <div style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          flexDirection: "column",
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 36,
        }}>
          <span style={{
            fontFamily: tokens.fonts.heading,
            fontSize: 136,
            fontWeight: 700,
            color: tokens.colors.text,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}>
            BittsQuiz
          </span>
          <span style={{
            fontFamily: tokens.fonts.heading,
            fontSize: 136,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {new Date().getFullYear()}
          </span>
        </div>

        {/* Tagline */}
        <div style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          fontFamily: tokens.fonts.body,
          fontSize: 38,
          fontWeight: 500,
          color: tokens.colors.textMuted,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 72,
        }}>
          Quiz · Collect · Compete
        </div>

        {/* Stat pills */}
        <div style={{
          opacity: pillOpacity,
          transform: `translateY(${pillY}px)`,
          display: "flex",
          gap: 22,
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {stats.map(({ icon, label }) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 100,
              padding: "14px 30px",
              fontFamily: tokens.fonts.body,
              fontSize: 24,
              fontWeight: 600,
              color: tokens.colors.textMuted,
            }}>
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Scene 2 · Quiz Interaction ───────────────────────────────────────────────

const ANSWERS = [
  { label: "A", text: "Dollar" },
  { label: "B", text: "Pound" },
  { label: "C", text: "Euro", correct: true },
  { label: "D", text: "Franc" },
];

const QuizScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cardY = interpolate(frame, [0, 28], [height * 0.5, 0], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const cardOpacity = interpolate(frame, [0, 18], [0, 1], CLAMP);
  const qOpacity    = interpolate(frame, [12, 32], [0, 1], CLAMP);

  const getAnswerAnim = (i: number) => {
    const s = 28 + i * 14;
    return {
      opacity:   interpolate(frame, [s, s + 20], [0, 1], CLAMP),
      transform: `translateX(${interpolate(frame, [s, s + 20], [52, 0], CLAMP)}px)`,
    };
  };

  const correctPct    = interpolate(frame, [84, 100], [0, 1], CLAMP);
  const isHighlighted = correctPct > 0;

  const coinVisible = frame >= 102;
  const coinOpacity = interpolate(frame, [102, 118], [0, 1], CLAMP);
  const coinY       = interpolate(frame, [102, 139], [0, -88], CLAMP);
  const coinScale   = spring({ frame: Math.max(0, frame - 102), fps, config: { damping: 8, stiffness: 130 } });
  const coinCount   = Math.round(interpolate(frame, [102, 122], [340, 360], CLAMP));

  const sceneOpacity = interpolate(frame, [128, 139], [1, 0], CLAMP);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <SceneBG />
      <Orb x={width * 0.5}  y={height * 0.14} size={700} color="#7c3aed" phase={12} />
      <Orb x={width * 0.88} y={height * 0.65} size={400} color="#ec4899" phase={32} />

      {/* Category pill — upper area */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 140 }}>
        <div style={{
          opacity: qOpacity,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(139,92,246,0.14)",
          border: "1px solid rgba(139,92,246,0.32)",
          borderRadius: 100,
          padding: "12px 30px",
          fontFamily: tokens.fonts.body,
          fontSize: 24,
          fontWeight: 600,
          color: tokens.colors.accent,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          <span>🌍</span>
          <span>World Languages</span>
          <span style={{ color: tokens.colors.border, margin: "0 4px" }}>·</span>
          <span style={{ color: tokens.colors.textMuted }}>Difficulty 3</span>
        </div>
      </AbsoluteFill>

      {/* Coin counter — top right */}
      <AbsoluteFill style={{ alignItems: "flex-end", paddingTop: 132, paddingRight: 48 }}>
        <div style={{
          opacity: qOpacity,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(250,204,21,0.12)",
          border: "1.5px solid rgba(250,204,21,0.35)",
          borderRadius: 100,
          padding: "12px 24px",
        }}>
          <span style={{ fontSize: 28 }}>🪙</span>
          <span style={{
            fontFamily: tokens.fonts.heading,
            fontSize: 28,
            fontWeight: 700,
            color: tokens.colors.gold,
          }}>
            {coinCount}
          </span>
        </div>
      </AbsoluteFill>

      {/* Quiz card */}
      <AbsoluteFill style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
      }}>
        <div style={{
          width: width * 0.9,
          background: tokens.colors.surface,
          border: `1.5px solid ${tokens.colors.border}`,
          borderRadius: 32,
          padding: "44px 44px 40px",
          boxShadow: "0 32px 90px rgba(0,0,0,0.6), 0 0 50px rgba(139,92,246,0.12)",
        }}>
          {/* Progress bar */}
          <div style={{
            height: 5, borderRadius: 3,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 32, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: "42%",
              background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
              borderRadius: 3,
            }} />
          </div>

          {/* Question */}
          <div style={{
            opacity: qOpacity,
            fontFamily: tokens.fonts.heading,
            fontSize: 44,
            fontWeight: 600,
            color: tokens.colors.text,
            lineHeight: 1.4,
            marginBottom: 44,
            letterSpacing: "-0.01em",
          }}>
            What is the primary currency used in France? 🇫🇷
          </div>

          {/* Answers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {ANSWERS.map((ans, i) => {
              const isCorrect = !!ans.correct;
              const lit = isCorrect && isHighlighted;
              const anim = getAnswerAnim(i);
              return (
                <div key={ans.label} style={{
                  ...anim,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "20px 24px",
                  borderRadius: 22,
                  border: `1.5px solid ${lit ? `rgba(74,222,128,${correctPct})` : "rgba(45,31,94,0.9)"}`,
                  background: lit ? `rgba(74,222,128,${0.1 * correctPct})` : "rgba(255,255,255,0.025)",
                  boxShadow: lit ? `0 0 26px rgba(74,222,128,${0.28 * correctPct})` : "none",
                }}>
                  <div style={{
                    width: 54, height: 54,
                    borderRadius: 14, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: tokens.fonts.heading,
                    fontSize: 22, fontWeight: 700,
                    background: lit ? `rgba(74,222,128,${0.25 * correctPct})` : "rgba(139,92,246,0.18)",
                    border: `1.5px solid ${lit ? `rgba(74,222,128,${correctPct})` : "rgba(139,92,246,0.38)"}`,
                    color: lit ? "#4ade80" : tokens.colors.accent,
                  }}>
                    {lit && correctPct > 0.85 ? "✓" : ans.label}
                  </div>
                  <span style={{
                    fontFamily: tokens.fonts.body,
                    fontSize: 32, fontWeight: 500,
                    color: lit ? "#4ade80" : tokens.colors.text,
                  }}>
                    {ans.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* +20 🪙 popup */}
        {coinVisible && (
          <div style={{
            position: "absolute",
            bottom: height * 0.1,
            opacity: coinOpacity,
            transform: `translateY(${coinY}px) scale(${coinScale})`,
            fontFamily: tokens.fonts.heading,
            fontSize: 72,
            fontWeight: 700,
            color: tokens.colors.gold,
            filter: "drop-shadow(0 0 22px rgba(250,204,21,0.8))",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            +20 🪙
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Scene 3 · Pack Opening ───────────────────────────────────────────────────

const PackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const headerOpacity = interpolate(frame, [6, 28], [0, 1], CLAMP);
  const headerY       = interpolate(frame, [6, 28], [-36, 0], CLAMP);

  const cardEnter = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 12, stiffness: 100 } });
  const floatY    = Math.sin(frame * 0.065) * 11;

  const flipDeg   = interpolate(frame, [52, 76], [0, 180], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const postFlip  = interpolate(frame, [76, 92], [0, 1], CLAMP);

  const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.13);
  const glowR     = 34 + 22 * glowPulse;
  const glowA     = (0.45 + 0.3 * glowPulse) * postFlip;

  const detailsOpacity = interpolate(frame, [90, 110], [0, 1], CLAMP);
  const detailsY       = interpolate(frame, [90, 110], [24, 0], CLAMP);

  const badgeScale = spring({ frame: Math.max(0, frame - 76), fps, config: { damping: 7, stiffness: 160 } });

  const sceneOpacity = interpolate(frame, [118, 129], [1, 0], CLAMP);

  // Portrait card — bigger
  const CW = 320, CH = 460;

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <SceneBG />
      <Orb x={width * 0.5}  y={height * 0.28} size={820} color="#7c3aed" phase={6}  />
      <Orb x={width * 0.1}  y={height * 0.72} size={400} color="#ec4899" phase={55} />
      <Orb x={width * 0.9}  y={height * 0.55} size={340} color="#8b5cf6" phase={20} />

      {/* Header */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 140 }}>
        <div style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <div style={{
            fontFamily: tokens.fonts.body,
            fontSize: 22, fontWeight: 600,
            letterSpacing: "0.16em", textTransform: "uppercase",
            color: tokens.colors.textMuted,
          }}>
            Tech Pack · 75 coins
          </div>
          <div style={{
            fontFamily: tokens.fonts.heading,
            fontSize: 64, fontWeight: 700,
            color: tokens.colors.text, letterSpacing: "-0.02em",
          }}>
            Opening a Pack…
          </div>
        </div>
      </AbsoluteFill>

      {/* 3-D card — centered vertically */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
        {/* Glow halo */}
        <div style={{
          position: "absolute",
          width: CW + glowR * 2,
          height: CH + glowR * 2,
          borderRadius: 50,
          background: `radial-gradient(ellipse, rgba(250,204,21,${glowA}) 0%, transparent 65%)`,
          pointerEvents: "none",
        }} />

        {/* Perspective wrapper */}
        <div style={{
          perspective: 1600,
          width: CW, height: CH,
          transform: `scale(${cardEnter}) translateY(${floatY}px)`,
        }}>
          <div style={{
            width: "100%", height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateY(${flipDeg}deg)`,
          }}>
            {/* Front — Pack */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: 28,
              backfaceVisibility: "hidden",
              background: "linear-gradient(145deg, #1e0a5e 0%, #3b0764 55%, #1a0a3e 100%)",
              border: "2.5px solid rgba(139,92,246,0.5)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 22,
              overflow: "hidden",
            }}>
              {/* Shimmer sweep */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(${frame * 4}deg, transparent 38%, rgba(255,255,255,0.05) 50%, transparent 62%)`,
                pointerEvents: "none",
              }} />
              <div style={{ fontSize: 110 }}>💻</div>
              <div style={{
                fontFamily: tokens.fonts.heading,
                fontSize: 40, fontWeight: 700,
                color: tokens.colors.text,
              }}>
                Tech Pack
              </div>
              <div style={{
                fontFamily: tokens.fonts.body,
                fontSize: 22, color: tokens.colors.textMuted,
                background: "rgba(139,92,246,0.18)",
                border: "1px solid rgba(139,92,246,0.32)",
                borderRadius: 20,
                padding: "8px 26px",
                letterSpacing: "0.05em",
              }}>
                Tap to reveal ✨
              </div>
            </div>

            {/* Back — Legendary Quizlet */}
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: 28,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: tokens.rarity.legendary.bg,
              border: `3px solid ${tokens.rarity.legendary.border}`,
              boxShadow: `0 0 ${glowR}px rgba(250,204,21,${glowA}), 0 24px 70px rgba(0,0,0,0.75)`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 14,
              overflow: "hidden",
            }}>
              {/* Inner glow */}
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 30%, rgba(250,204,21,0.2) 0%, transparent 60%)",
                pointerEvents: "none",
              }} />
              <div style={{
                fontSize: 110,
                filter: `drop-shadow(0 0 ${Math.round(24 + 12 * glowPulse)}px rgba(250,204,21,0.75))`,
              }}>
                ⚡
              </div>
              <div style={{
                background: "rgba(250,204,21,0.2)",
                border: "1.5px solid #facc15",
                borderRadius: 20,
                padding: "6px 24px",
                fontFamily: tokens.fonts.heading,
                fontSize: 18, fontWeight: 700,
                color: tokens.colors.gold,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                ★ Legendary
              </div>
              <div style={{
                fontFamily: tokens.fonts.heading,
                fontSize: 46, fontWeight: 700,
                color: "#fef9c3",
                letterSpacing: "-0.01em",
              }}>
                StormBolt
              </div>
              <div style={{
                fontFamily: tokens.fonts.body,
                fontSize: 20, color: "rgba(254,249,195,0.65)",
                textAlign: "center", padding: "0 26px",
                lineHeight: 1.55,
              }}>
                Master of circuits and code
              </div>
              <div style={{
                marginTop: 6,
                fontFamily: tokens.fonts.body,
                fontSize: 22, color: "rgba(250,204,21,0.7)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                🪙 400 coins
              </div>
            </div>
          </div>
        </div>

        {/* NEW! badge */}
        {frame >= 76 && (
          <div style={{
            position: "absolute",
            top: height * 0.19,
            right: width * 0.08,
            transform: `scale(${badgeScale})`,
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            borderRadius: 100,
            padding: "12px 30px",
            fontFamily: tokens.fonts.heading,
            fontSize: 24, fontWeight: 700,
            color: "white",
            boxShadow: "0 6px 28px rgba(139,92,246,0.55)",
          }}>
            NEW! ✨
          </div>
        )}

        {/* Details row */}
        {frame >= 90 && (
          <div style={{
            position: "absolute",
            bottom: height * 0.065,
            opacity: detailsOpacity,
            transform: `translateY(${detailsY}px)`,
            display: "flex", gap: 16, alignItems: "center",
          }}>
            {["💻 Tech Pack", "Quizlet #47", "1 of 99"].map((label) => (
              <div key={label} style={{
                fontFamily: tokens.fonts.body,
                fontSize: 20, color: tokens.colors.textMuted,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "10px 22px",
              }}>
                {label}
              </div>
            ))}
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Scene 4 · Outro ──────────────────────────────────────────────────────────

const WORDS = ["Collect.", "Compete.", "Conquer."];
const WORD_COLORS = [tokens.colors.accent, tokens.colors.accent2, tokens.colors.gold];

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const logoOpacity = interpolate(frame, [40, 58], [0, 1], CLAMP);
  const logoScale   = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 12, stiffness: 100 } });

  const ctaOpacity = interpolate(frame, [56, 74], [0, 1], CLAMP);
  const ctaScale   = spring({ frame: Math.max(0, frame - 56), fps, config: { damping: 10, stiffness: 90 } });
  const ctaGlow    = 0.4 + 0.22 * Math.sin(frame * 0.15);

  const subOpacity = interpolate(frame, [70, 84], [0, 1], CLAMP);

  return (
    <AbsoluteFill>
      <SceneBG />
      <Orb x={width * 0.5}  y={height * 0.32} size={820} color="#7c3aed" phase={0}  />
      <Orb x={width * 0.15} y={height * 0.68} size={440} color="#ec4899" phase={38} />
      <Orb x={width * 0.85} y={height * 0.18} size={350} color="#8b5cf6" phase={18} />

      <AbsoluteFill style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
      }}>
        {/* Tagline words — stacked vertically for portrait */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {WORDS.map((word, i) => {
            const s = i * 10;
            const wOpacity = interpolate(frame, [s, s + 22], [0, 1], CLAMP);
            const wY       = interpolate(frame, [s, s + 22], [48, 0], CLAMP);
            const wScale   = spring({
              frame: Math.max(0, frame - s),
              fps,
              config: { damping: 10, stiffness: 80 },
            });
            return (
              <div key={word} style={{
                opacity: wOpacity,
                transform: `translateY(${wY}px) scale(${wScale})`,
                fontFamily: tokens.fonts.heading,
                fontSize: 120,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: WORD_COLORS[i],
                filter: `drop-shadow(0 0 22px ${WORD_COLORS[i]}88)`,
                lineHeight: 1,
              }}>
                {word}
              </div>
            );
          })}
        </div>

        {/* Logo */}
        <div style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex", alignItems: "center", gap: 16,
          marginTop: 12,
        }}>
          <span style={{ fontSize: 70, filter: "drop-shadow(0 0 22px rgba(139,92,246,0.8))" }}>⚡</span>
          <span style={{
            fontFamily: tokens.fonts.heading,
            fontSize: 72, fontWeight: 700,
            color: tokens.colors.text, letterSpacing: "-0.025em",
          }}>
            BittsQuiz{" "}
            <span style={{
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {new Date().getFullYear()}
            </span>
          </span>
        </div>

        {/* CTA */}
        <div style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          padding: "28px 80px",
          borderRadius: 100,
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
          fontFamily: tokens.fonts.heading,
          fontSize: 36, fontWeight: 700,
          color: "white", letterSpacing: "-0.01em",
          boxShadow: `0 10px 44px rgba(139,92,246,${ctaGlow}), 0 0 80px rgba(236,72,153,0.2)`,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          Play for Free
          <span style={{ fontSize: 32 }}>→</span>
        </div>

        {/* Sub-text */}
        <div style={{
          opacity: subOpacity,
          fontFamily: tokens.fonts.body,
          fontSize: 26, color: tokens.colors.textDim,
          letterSpacing: "0.05em",
        }}>
          Free to play · No sign-up needed
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export const BittsQuizReel: React.FC = () => (
  <AbsoluteFill style={{ background: tokens.colors.bg, fontFamily: tokens.fonts.body }}>
    <FontFace />
    <Sequence from={0}   durationInFrames={90}><IntroScene /></Sequence>
    <Sequence from={90}  durationInFrames={140}><QuizScene /></Sequence>
    <Sequence from={230} durationInFrames={130}><PackScene /></Sequence>
    <Sequence from={360} durationInFrames={90}><OutroScene /></Sequence>
  </AbsoluteFill>
);
