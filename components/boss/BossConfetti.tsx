"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const EMOJIS = ["🎉", "✨", "⭐", "💥", "🪙"];

/** A brief, non-blocking particle burst anchored near the boss avatar. Never full-screen —
 *  the kill moment must not interrupt an in-progress (possibly timed) quiz. */
export default function BossConfetti({ active, onDone }: { active: boolean; onDone: () => void }) {
  const reduceMotion = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        emoji: EMOJIS[i % EMOJIS.length],
        angle: (i / 14) * Math.PI * 2,
        distance: 40 + ((i * 37) % 50), // deterministic spread, no Math.random jitter needed
      })),
    []
  );

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed right-8 top-32 md:right-10 md:top-36 z-30 pointer-events-none">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute text-lg"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance - 20,
                opacity: 0,
                scale: 1.1,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {p.emoji}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
