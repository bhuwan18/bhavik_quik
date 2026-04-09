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

// Google Fonts — inject once at the root so all scenes share them
const FontFace: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
  `}</style>
);

// Ambient glow orb — animates with a slow sine-wave pulse
const Orb: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  phase?: number;
}> = ({ x, y, size, color, phase = 0 }) => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin((frame + phase) * 0.04);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity: 0.1 + 0.07 * pulse,
        filter: `blur(${Math.round(size * 0.45)}px)`,
        pointerEvents: "none",
      }}
    />
  );
};

// Dark radial vignette pinned to canvas edges
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, transparent 45%, rgba(7,5,17,0.65) 100%)",
      pointerEvents: "none",
    }}
  />
);

// Full-canvas dark gradient background
const SceneBG: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(135deg, #070511 0%, #0d0822 50%, #070511 100%)",
    }}
  />
);

// ─── Scene 1 · Intro (local frames 0–89) ─────────────────────────────────────

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Lightning bolt springs in
  const boltScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const boltGlow = interpolate(frame, [0, 20, 50, 89], [0, 1, 0.65, 1], CLAMP);

  // Title slides up
  const titleOpacity = interpolate(frame, [18, 44], [0, 1], CLAMP);
  const titleY = interpolate(frame, [18, 44], [48, 0], CLAMP);

  // Tagline slides in from left
  const tagOpacity = interpolate(frame, [44, 70], [0, 1], CLAMP);
  const tagX = interpolate(frame, [44, 70], [-28, 0], CLAMP);

  // Fade out at end
  const sceneOpacity = interpolate(frame, [80, 89], [1, 0], CLAMP);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <SceneBG />
      <Orb x={width * 0.18} y={height * 0.28} size={520} color="#7c3aed" phase={0} />
      <Orb x={width * 0.82} y={height * 0.72} size={420} color="#ec4899" phase={50} />
      <Orb x={width * 0.6}  y={height * 0.12} size={270} color="#8b5cf6" phase={25} />

      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}
      >
        {/* ⚡ Lightning bolt */}
        <div
          style={{
            fontSize: 108,
            lineHeight: 1,
            marginBottom: 28,
            transform: `scale(${boltScale})`,
            filter: `drop-shadow(0 0 ${Math.round(32 * boltGlow)}px rgba(139,92,246,0.9))`,
          }}
        >
          ⚡
        </div>

        {/* BittsQuiz 2026 */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: tokens.fonts.heading,
              fontSize: 88,
              fontWeight: 700,
              color: tokens.colors.text,
              letterSpacing: "-0.025em",
            }}
          >
            BittsQuiz
          </span>
          <span
            style={{
              fontFamily: tokens.fonts.heading,
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {new Date().getFullYear()}
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: tagOpacity,
            transform: `translateX(${tagX}px)`,
            fontFamily: tokens.fonts.body,
            fontSize: 22,
            fontWeight: 500,
            color: tokens.colors.textMuted,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Quiz · Collect · Compete
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Scene 2 · Quiz Interaction (local frames 0–139) ─────────────────────────

const ANSWERS = [
  { label: "A", text: "Dollar" },
  { label: "B", text: "Pound" },
  { label: "C", text: "Euro", correct: true },
  { label: "D", text: "Franc" },
];

const QuizScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Whole card slides up from below
  const cardY = interpolate(frame, [0, 28], [height * 0.55, 0], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const cardOpacity = interpolate(frame, [0, 18], [0, 1], CLAMP);

  // Question fades in
  const qOpacity = interpolate(frame, [12, 32], [0, 1], CLAMP);

  // Answer options stagger in from the right
  const getAnswerAnim = (i: number) => {
    const s = 28 + i * 12;
    return {
      opacity: interpolate(frame, [s, s + 18], [0, 1], CLAMP),
      transform: `translateX(${interpolate(frame, [s, s + 18], [44, 0], CLAMP)}px)`,
    };
  };

  // Correct answer (C / index 2) highlights at frame 82
  const correctPct = interpolate(frame, [82, 98], [0, 1], CLAMP);
  const isHighlighted = correctPct > 0;

  // "+20 🪙" popup at frame 100
  const coinVisible = frame >= 100;
  const coinOpacity = interpolate(frame, [100, 114], [0, 1], CLAMP);
  const coinY = interpolate(frame, [100, 139], [0, -68], CLAMP);
  const coinScale = spring({
    frame: Math.max(0, frame - 100),
    fps,
    config: { damping: 8, stiffness: 130 },
  });

  // Coin counter increments from 340 → 360 (text)
  const coinCount = Math.round(interpolate(frame, [100, 120], [340, 360], CLAMP));

  // Scene fade out
  const sceneOpacity = interpolate(frame, [128, 139], [1, 0], CLAMP);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <SceneBG />
      <Orb x={width * 0.5}  y={height * 0.18} size={620} color="#7c3aed" phase={12} />
      <Orb x={width * 0.88} y={height * 0.82} size={320} color="#ec4899" phase={32} />

      {/* Category pill */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 56 }}>
        <div
          style={{
            opacity: qOpacity,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 100,
            padding: "6px 18px",
            fontFamily: tokens.fonts.body,
            fontSize: 14,
            fontWeight: 600,
            color: tokens.colors.accent,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>🌍</span>
          <span>World Languages</span>
          <span style={{ color: tokens.colors.border, margin: "0 2px" }}>·</span>
          <span style={{ color: tokens.colors.textMuted }}>Difficulty 3</span>
        </div>
      </AbsoluteFill>

      {/* Quiz card */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
        }}
      >
        <div
          style={{
            width: width * 0.78,
            background: tokens.colors.surface,
            border: `1.5px solid ${tokens.colors.border}`,
            borderRadius: 28,
            padding: "40px 44px 36px",
            boxShadow:
              "0 28px 80px rgba(0,0,0,0.55), 0 0 40px rgba(139,92,246,0.12)",
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
              marginBottom: 28,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${interpolate(frame, [0, 30], [42, 42], CLAMP)}%`,
                background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                borderRadius: 2,
              }}
            />
          </div>

          {/* Question */}
          <div
            style={{
              opacity: qOpacity,
              fontFamily: tokens.fonts.heading,
              fontSize: 26,
              fontWeight: 600,
              color: tokens.colors.text,
              lineHeight: 1.45,
              marginBottom: 34,
              letterSpacing: "-0.01em",
            }}
          >
            What is the primary currency used in France? 🇫🇷
          </div>

          {/* Answers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {ANSWERS.map((ans, i) => {
              const isCorrect = !!ans.correct;
              const lit = isCorrect && isHighlighted;
              const anim = getAnswerAnim(i);
              const borderColor = lit
                ? `rgba(74,222,128,${correctPct})`
                : "rgba(45,31,94,0.9)";
              const bgColor = lit
                ? `rgba(74,222,128,${0.1 * correctPct})`
                : "rgba(255,255,255,0.025)";
              return (
                <div
                  key={ans.label}
                  style={{
                    ...anim,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "13px 18px",
                    borderRadius: 16,
                    border: `1.5px solid ${borderColor}`,
                    background: bgColor,
                    boxShadow: lit
                      ? `0 0 22px rgba(74,222,128,${0.28 * correctPct})`
                      : "none",
                  }}
                >
                  {/* Label badge */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: tokens.fonts.heading,
                      fontSize: 15,
                      fontWeight: 700,
                      background: lit
                        ? `rgba(74,222,128,${0.25 * correctPct})`
                        : "rgba(139,92,246,0.18)",
                      border: `1.5px solid ${
                        lit
                          ? `rgba(74,222,128,${correctPct})`
                          : "rgba(139,92,246,0.38)"
                      }`,
                      color: lit ? "#4ade80" : tokens.colors.accent,
                    }}
                  >
                    {lit && correctPct > 0.85 ? "✓" : ans.label}
                  </div>
                  <span
                    style={{
                      fontFamily: tokens.fonts.body,
                      fontSize: 20,
                      fontWeight: 500,
                      color: lit ? "#4ade80" : tokens.colors.text,
                    }}
                  >
                    {ans.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coin counter */}
        <div
          style={{
            position: "absolute",
            top: 56,
            right: width * 0.08,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(250,204,21,0.12)",
            border: "1.5px solid rgba(250,204,21,0.35)",
            borderRadius: 100,
            padding: "6px 16px",
            opacity: qOpacity,
          }}
        >
          <span style={{ fontSize: 18 }}>🪙</span>
          <span
            style={{
              fontFamily: tokens.fonts.heading,
              fontSize: 18,
              fontWeight: 700,
              color: tokens.colors.gold,
            }}
          >
            {coinCount}
          </span>
        </div>

        {/* +20 popup */}
        {coinVisible && (
          <div
            style={{
              position: "absolute",
              bottom: height * 0.12,
              opacity: coinOpacity,
              transform: `translateY(${coinY}px) scale(${coinScale})`,
              fontFamily: tokens.fonts.heading,
              fontSize: 42,
              fontWeight: 700,
              color: tokens.colors.gold,
              filter: "drop-shadow(0 0 14px rgba(250,204,21,0.75))",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            +20 🪙
          </div>
        )}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Scene 3 · Pack Opening (local frames 0–129) ──────────────────────────────

const PackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Header
  const headerOpacity = interpolate(frame, [6, 26], [0, 1], CLAMP);
  const headerY = interpolate(frame, [6, 26], [-32, 0], CLAMP);

  // Card enters with spring
  const cardEnter = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  // Float
  const floatY = Math.sin(frame * 0.065) * 9;

  // 3-D flip: frames 52–76
  const flipDeg = interpolate(frame, [52, 76], [0, 180], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const postFlip = interpolate(frame, [76, 90], [0, 1], CLAMP);

  // Legendary glow pulse (post-flip)
  const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.13);
  const glowR = 28 + 18 * glowPulse;
  const glowA = (0.45 + 0.3 * glowPulse) * postFlip;

  // Details row under card
  const detailsOpacity = interpolate(frame, [88, 108], [0, 1], CLAMP);
  const detailsY = interpolate(frame, [88, 108], [22, 0], CLAMP);

  // "NEW!" badge bounces in
  const badgeScale = spring({
    frame: Math.max(0, frame - 76),
    fps,
    config: { damping: 7, stiffness: 160 },
  });

  // Scene fade out
  const sceneOpacity = interpolate(frame, [118, 129], [1, 0], CLAMP);

  const W = 264, H = 370;

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <SceneBG />
      <Orb x={width * 0.5}  y={height * 0.45} size={700} color="#7c3aed" phase={6}  />
      <Orb x={width * 0.12} y={height * 0.82} size={310} color="#ec4899" phase={55} />
      <Orb x={width * 0.88} y={height * 0.18} size={250} color="#8b5cf6" phase={20} />

      {/* Header */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 58 }}>
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: tokens.fonts.body,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: tokens.colors.textMuted,
            }}
          >
            Tech Pack · 75 coins
          </div>
          <div
            style={{
              fontFamily: tokens.fonts.heading,
              fontSize: 40,
              fontWeight: 700,
              color: tokens.colors.text,
              letterSpacing: "-0.02em",
            }}
          >
            Opening a Pack…
          </div>
        </div>
      </AbsoluteFill>

      {/* 3-D card */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Legendary glow halo */}
        <div
          style={{
            position: "absolute",
            width: W + glowR * 2,
            height: H + glowR * 2,
            borderRadius: 40,
            background: `radial-gradient(ellipse, rgba(250,204,21,${glowA}) 0%, transparent 68%)`,
            pointerEvents: "none",
          }}
        />

        {/* Perspective wrapper */}
        <div
          style={{
            perspective: 1400,
            width: W,
            height: H,
            transform: `scale(${cardEnter}) translateY(${floatY}px)`,
          }}
        >
          {/* Inner — rotates */}
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transform: `rotateY(${flipDeg}deg)`,
            }}
          >
            {/* ── Front face: Pack ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                backfaceVisibility: "hidden",
                background: "linear-gradient(145deg, #1e0a5e 0%, #3b0764 55%, #1a0a3e 100%)",
                border: "2px solid rgba(139,92,246,0.5)",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                overflow: "hidden",
              }}
            >
              {/* Shimmer sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(${frame * 4}deg, transparent 38%, rgba(255,255,255,0.045) 50%, transparent 62%)`,
                  pointerEvents: "none",
                }}
              />
              <div style={{ fontSize: 78 }}>💻</div>
              <div
                style={{
                  fontFamily: tokens.fonts.heading,
                  fontSize: 24,
                  fontWeight: 700,
                  color: tokens.colors.text,
                }}
              >
                Tech Pack
              </div>
              <div
                style={{
                  fontFamily: tokens.fonts.body,
                  fontSize: 13,
                  color: tokens.colors.textMuted,
                  background: "rgba(139,92,246,0.18)",
                  border: "1px solid rgba(139,92,246,0.32)",
                  borderRadius: 20,
                  padding: "5px 16px",
                  letterSpacing: "0.05em",
                }}
              >
                Tap to reveal ✨
              </div>
            </div>

            {/* ── Back face: Legendary Quizlet ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: tokens.rarity.legendary.bg,
                border: `3px solid ${tokens.rarity.legendary.border}`,
                boxShadow: `0 0 ${glowR}px rgba(250,204,21,${glowA}), 0 20px 60px rgba(0,0,0,0.7)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                overflow: "hidden",
              }}
            >
              {/* Inner glow */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at 50% 30%, rgba(250,204,21,0.18) 0%, transparent 62%)",
                  pointerEvents: "none",
                }}
              />
              {/* Icon */}
              <div
                style={{
                  fontSize: 82,
                  filter: `drop-shadow(0 0 ${Math.round(18 + 8 * glowPulse)}px rgba(250,204,21,0.7))`,
                }}
              >
                ⚡
              </div>
              {/* Rarity badge */}
              <div
                style={{
                  background: "rgba(250,204,21,0.2)",
                  border: "1.5px solid #facc15",
                  borderRadius: 20,
                  padding: "4px 18px",
                  fontFamily: tokens.fonts.heading,
                  fontSize: 12,
                  fontWeight: 700,
                  color: tokens.colors.gold,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                ★ Legendary
              </div>
              {/* Name */}
              <div
                style={{
                  fontFamily: tokens.fonts.heading,
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#fef9c3",
                  letterSpacing: "-0.01em",
                }}
              >
                StormBolt
              </div>
              {/* Description */}
              <div
                style={{
                  fontFamily: tokens.fonts.body,
                  fontSize: 13,
                  color: "rgba(254,249,195,0.65)",
                  textAlign: "center",
                  padding: "0 22px",
                  lineHeight: 1.5,
                }}
              >
                Master of circuits and code
              </div>
              {/* Sell value */}
              <div
                style={{
                  marginTop: 4,
                  fontFamily: tokens.fonts.body,
                  fontSize: 14,
                  color: "rgba(250,204,21,0.7)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🪙 400 coins
              </div>
            </div>
          </div>
        </div>

        {/* "NEW!" badge */}
        {frame >= 76 && (
          <div
            style={{
              position: "absolute",
              top: height * 0.15,
              right: width * 0.15,
              transform: `scale(${badgeScale})`,
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              borderRadius: 100,
              padding: "8px 20px",
              fontFamily: tokens.fonts.heading,
              fontSize: 16,
              fontWeight: 700,
              color: "white",
              boxShadow: "0 6px 24px rgba(139,92,246,0.55)",
            }}
          >
            NEW! ✨
          </div>
        )}

        {/* Details row */}
        {frame >= 88 && (
          <div
            style={{
              position: "absolute",
              bottom: height * 0.08,
              opacity: detailsOpacity,
              transform: `translateY(${detailsY}px)`,
              display: "flex",
              gap: 14,
              alignItems: "center",
            }}
          >
            {["💻 Tech Pack", "Quizlet #47", "1 of 99"].map((label) => (
              <div
                key={label}
                style={{
                  fontFamily: tokens.fonts.body,
                  fontSize: 13,
                  color: tokens.colors.textMuted,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20,
                  padding: "6px 16px",
                }}
              >
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

// ─── Scene 4 · Outro (local frames 0–89) ─────────────────────────────────────

const WORDS = ["Collect.", "Compete.", "Conquer."];
const WORD_COLORS = [tokens.colors.accent, tokens.colors.accent2, tokens.colors.gold];

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo & CTA
  const logoOpacity = interpolate(frame, [44, 62], [0, 1], CLAMP);
  const logoScale = spring({
    frame: Math.max(0, frame - 44),
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const ctaOpacity = interpolate(frame, [60, 78], [0, 1], CLAMP);
  const ctaScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 10, stiffness: 90 },
  });
  // CTA button glow pulse
  const ctaGlow = 0.4 + 0.2 * Math.sin(frame * 0.15);

  return (
    <AbsoluteFill>
      <SceneBG />
      <Orb x={width * 0.5}  y={height * 0.38} size={720} color="#7c3aed" phase={0}  />
      <Orb x={width * 0.18} y={height * 0.72} size={360} color="#ec4899" phase={38} />
      <Orb x={width * 0.85} y={height * 0.22} size={290} color="#8b5cf6" phase={18} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Tagline words — stagger in */}
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
          {WORDS.map((word, i) => {
            const s = i * 11;
            const wOpacity = interpolate(frame, [s, s + 20], [0, 1], CLAMP);
            const wY = interpolate(frame, [s, s + 20], [44, 0], CLAMP);
            const wScale = spring({
              frame: Math.max(0, frame - s),
              fps,
              config: { damping: 10, stiffness: 80 },
            });
            return (
              <div
                key={word}
                style={{
                  opacity: wOpacity,
                  transform: `translateY(${wY}px) scale(${wScale})`,
                  fontFamily: tokens.fonts.heading,
                  fontSize: 72,
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  color: WORD_COLORS[i],
                  filter: `drop-shadow(0 0 18px ${WORD_COLORS[i]}88)`,
                }}
              >
                {word}
              </div>
            );
          })}
        </div>

        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 44,
              filter: "drop-shadow(0 0 14px rgba(139,92,246,0.75))",
            }}
          >
            ⚡
          </span>
          <span
            style={{
              fontFamily: tokens.fonts.heading,
              fontSize: 48,
              fontWeight: 700,
              color: tokens.colors.text,
              letterSpacing: "-0.025em",
            }}
          >
            BittsQuiz{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {new Date().getFullYear()}
            </span>
          </span>
        </div>

        {/* CTA button */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            padding: "18px 52px",
            borderRadius: 100,
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            fontFamily: tokens.fonts.heading,
            fontSize: 22,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.01em",
            boxShadow: `0 8px 36px rgba(139,92,246,${ctaGlow}), 0 0 64px rgba(236,72,153,0.18)`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          Play for Free
          <span style={{ fontSize: 20 }}>→</span>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ─── Root composition ─────────────────────────────────────────────────────────

export const BittsQuizVideo: React.FC = () => (
  <AbsoluteFill style={{ background: tokens.colors.bg, fontFamily: tokens.fonts.body }}>
    <FontFace />
    {/* Scene 1 — Intro */}
    <Sequence from={0} durationInFrames={90}>
      <IntroScene />
    </Sequence>
    {/* Scene 2 — Quiz interaction */}
    <Sequence from={90} durationInFrames={140}>
      <QuizScene />
    </Sequence>
    {/* Scene 3 — Pack opening */}
    <Sequence from={230} durationInFrames={130}>
      <PackScene />
    </Sequence>
    {/* Scene 4 — Outro */}
    <Sequence from={360} durationInFrames={90}>
      <OutroScene />
    </Sequence>
  </AbsoluteFill>
);
