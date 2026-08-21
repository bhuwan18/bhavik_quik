"use client";

import { useEffect, useRef } from "react";
import { MH_FIXED_STEP_MS, MH_MAX_FRAME_MS } from "@/lib/game-config";

/**
 * Shared requestAnimationFrame driver for canvas-based modes (Monster Hunter, Tower Defense).
 * Fixed-timestep simulation via an accumulator, decoupled from the variable-rate draw call.
 * `step`/`draw` are read through refs so the loop never restarts on re-render — the world
 * itself lives in a ref the caller owns, not in React state, so this never triggers a
 * re-render on its own. `running` toggling to false cancels the frame outright (used to pause
 * for level-up questions without any drift once resumed).
 */
export function useGameLoop(step: (dtSeconds: number) => void, draw: () => void, running: boolean): void {
  const stepRef = useRef(step);
  const drawRef = useRef(draw);
  stepRef.current = step;
  drawRef.current = draw;

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    if (!running) {
      lastRef.current = null;
      accumulatorRef.current = 0;
      return;
    }

    const fixedStepS = MH_FIXED_STEP_MS / 1000;

    const tick = (now: number) => {
      if (lastRef.current === null) lastRef.current = now;
      const rawDelta = now - lastRef.current;
      lastRef.current = now;
      const clampedDelta = Math.min(rawDelta, MH_MAX_FRAME_MS);
      accumulatorRef.current += clampedDelta;

      while (accumulatorRef.current >= MH_FIXED_STEP_MS) {
        stepRef.current(fixedStepS);
        accumulatorRef.current -= MH_FIXED_STEP_MS;
      }

      drawRef.current();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running]);
}
