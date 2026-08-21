"use client";

import { useId } from "react";

export type CreatureVariant = "round" | "spiky" | "serpentine";
export type CreaturePhase = "idle" | "hit" | "taunt" | "dead";

type Props = {
  colorFrom: string;
  colorTo: string;
  variant: CreatureVariant;
  phase: CreaturePhase;
  /** Swaps the idle loop for a faster, agitated one once the boss is critically low. */
  lowHp?: boolean;
  size?: number;
};

/**
 * A hand-built, articulated SVG monster — no external art assets. The face (eyes + mouth)
 * is rigged as four alternate states per feature (normal/hit/taunt/dead), cross-faded via
 * CSS opacity keyed off a `phase-*` class on the root; the body plays a matching macro
 * transform animation (bob, recoil, laugh-bounce, collapse) defined in globals.css.
 * Limbs (claws/wings/antennae depending on variant) run their own independent secondary
 * motion at all times, and the eyes blink on a loop while idle — both layer on top of
 * the macro transform since nested SVG transforms compose.
 */
export default function BossCreature({ colorFrom, colorTo, variant, phase, lowHp = false, size = 150 }: Props) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={`boss-creature phase-${phase}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>

      <g
        className={[
          "boss-creature-body",
          phase === "idle" ? (lowHp ? "creature-idle-lowhp-anim" : "creature-idle-anim") : "",
          phase === "hit" ? "creature-hit-anim" : "",
          phase === "taunt" ? "creature-laugh-anim" : "",
          phase === "dead" ? "creature-dead-anim" : "",
        ].join(" ")}
      >
        {variant === "round" && <RoundBody gradientId={gradientId} />}
        {variant === "spiky" && <SpikyBody gradientId={gradientId} />}
        {variant === "serpentine" && <SerpentineBody gradientId={gradientId} />}

        <Eye cx={variant === "serpentine" ? 84 : 78} blinkDelay={0} phase={phase} />
        <Eye cx={variant === "serpentine" ? 136 : 142} blinkDelay={0.15} phase={phase} />
        <Mouth />
      </g>
    </svg>
  );
}

// ─── Body silhouettes ────────────────────────────────────────────────────────

function RoundBody({ gradientId }: { gradientId: string }) {
  const fill = `url(#${gradientId})`;
  const stroke = "rgba(255,255,255,0.4)";
  return (
    <g>
      {/* whiskers / antennae — sway independently of the body */}
      <g className="creature-antenna" style={{ transformOrigin: "80px 45px" }}>
        <path d="M 80 45 Q 74 20 68 12" stroke={fill} strokeWidth={5} strokeLinecap="round" fill="none" />
        <circle cx={68} cy={12} r={5} fill={fill} />
      </g>
      <g className="creature-antenna creature-antenna-r" style={{ transformOrigin: "140px 45px" }}>
        <path d="M 140 45 Q 146 20 152 12" stroke={fill} strokeWidth={5} strokeLinecap="round" fill="none" />
        <circle cx={152} cy={12} r={5} fill={fill} />
      </g>
      {/* nub arms */}
      <ellipse cx={26} cy={128} rx={17} ry={11} fill={fill} stroke={stroke} strokeWidth={2.5} />
      <ellipse cx={194} cy={128} rx={17} ry={11} fill={fill} stroke={stroke} strokeWidth={2.5} />
      {/* main body */}
      <ellipse cx={110} cy={118} rx={88} ry={82} fill={fill} stroke={stroke} strokeWidth={3} />
    </g>
  );
}

function SpikyBody({ gradientId }: { gradientId: string }) {
  const fill = `url(#${gradientId})`;
  const stroke = "rgba(255,255,255,0.4)";
  const spikeAngles = [-150, -120, -90, -60, -30];
  return (
    <g>
      {/* tail */}
      <polygon points="180,175 210,195 178,190" fill={fill} stroke={stroke} strokeWidth={2.5} />
      {/* claws — pinch independently of the body */}
      <g className="creature-claw" style={{ transformOrigin: "22px 118px" }}>
        <path d="M 24 110 Q 4 100 8 118 Q 4 130 22 128 Z" fill={fill} stroke={stroke} strokeWidth={2.5} />
      </g>
      <g className="creature-claw creature-claw-r" style={{ transformOrigin: "198px 118px" }}>
        <path d="M 196 110 Q 216 100 212 118 Q 216 130 198 128 Z" fill={fill} stroke={stroke} strokeWidth={2.5} />
      </g>
      {/* main body */}
      <ellipse cx={110} cy={124} rx={82} ry={74} fill={fill} stroke={stroke} strokeWidth={3} />
      {/* back spikes */}
      {spikeAngles.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const bx = 110 + 82 * Math.cos(rad) * 0.92;
        const by = 124 + 74 * Math.sin(rad) * 0.92;
        const tipX = 110 + 82 * Math.cos(rad) * 1.3;
        const tipY = 124 + 74 * Math.sin(rad) * 1.3 - 6;
        return (
          <polygon
            key={i}
            points={`${bx - 10},${by + 6} ${tipX},${tipY} ${bx + 10},${by + 6}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}

function SerpentineBody({ gradientId }: { gradientId: string }) {
  const fill = `url(#${gradientId})`;
  const stroke = "rgba(255,255,255,0.4)";
  return (
    <g>
      {/* tail */}
      <path d="M 110 200 Q 130 215 150 205 Q 132 208 118 195 Z" fill={fill} stroke={stroke} strokeWidth={2.5} />
      {/* wings — flap independently of the body */}
      <g className="creature-wing" style={{ transformOrigin: "45px 120px" }}>
        <polygon points="42,120 4,85 30,150 55,140" fill={fill} stroke={stroke} strokeWidth={2.5} opacity={0.92} />
      </g>
      <g className="creature-wing creature-wing-r" style={{ transformOrigin: "175px 120px" }}>
        <polygon points="178,120 216,85 190,150 165,140" fill={fill} stroke={stroke} strokeWidth={2.5} opacity={0.92} />
      </g>
      {/* main body */}
      <ellipse cx={110} cy={112} rx={66} ry={92} fill={fill} stroke={stroke} strokeWidth={3} />
      {/* horns */}
      <polygon points="72,38 62,10 84,32" fill={fill} stroke={stroke} strokeWidth={2} />
      <polygon points="148,38 158,10 136,32" fill={fill} stroke={stroke} strokeWidth={2} />
    </g>
  );
}

// ─── Face rig ─────────────────────────────────────────────────────────────────

function Eye({ cx, blinkDelay, phase }: { cx: number; blinkDelay: number; phase: CreaturePhase }) {
  return (
    <g
      className={phase === "idle" ? "creature-eye-blink" : ""}
      style={{ transformOrigin: `${cx}px 95px`, animationDelay: `${blinkDelay}s` }}
    >
      <ellipse cx={cx} cy={95} rx={17} ry={21} fill="white" />
      {/* normal */}
      <circle className="creature-eye-normal" cx={cx} cy={98} r={8} fill="#161616" />
      {/* taunt / laugh — happy crescent */}
      <path
        className="creature-eye-happy"
        d={`M ${cx - 11} 100 Q ${cx} 86 ${cx + 11} 100`}
        stroke="#161616"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      {/* hit / hurt — small pupil + tear */}
      <g className="creature-eye-hurt">
        <circle cx={cx} cy={98} r={4} fill="#161616" />
        <path d={`M ${cx - 4} 110 q -4 9 0 15 q 4 -6 0 -15`} fill="#7dd3fc" />
      </g>
      {/* dead — X */}
      <g className="creature-eye-dead" stroke="#161616" strokeWidth={4} strokeLinecap="round">
        <line x1={cx - 9} y1={89} x2={cx + 9} y2={107} />
        <line x1={cx + 9} y1={89} x2={cx - 9} y2={107} />
      </g>
    </g>
  );
}

function Mouth() {
  return (
    <g>
      <path className="creature-mouth-normal" d="M 90 145 Q 110 155 130 145" stroke="#161616" strokeWidth={5} strokeLinecap="round" fill="none" />
      <ellipse className="creature-mouth-hurt" cx={110} cy={149} rx={10} ry={15} fill="#4c1d0e" stroke="#161616" strokeWidth={3} />
      <path
        className="creature-mouth-laugh"
        d="M 84 140 Q 110 180 136 140 Q 110 152 84 140 Z"
        fill="#4c1d0e"
        stroke="#161616"
        strokeWidth={3}
      />
      <line className="creature-mouth-dead" x1={95} y1={149} x2={125} y2={149} stroke="#161616" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}
