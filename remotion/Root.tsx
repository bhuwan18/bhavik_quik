import React from "react";
import { Composition } from "remotion";
import { BittsQuizVideo } from "./BittsQuizVideo";
import { BittsQuizReel } from "./BittsQuizReel";

// Total: 450 frames @ 30 fps = 15 seconds
// Scene 1 Intro:       0–90
// Scene 2 Quiz:       90–230
// Scene 3 Pack Open: 230–360
// Scene 4 Outro:     360–450

export const Root: React.FC = () => (
  <>
    {/* Square — general use */}
    <Composition
      id="BittsQuizPromo"
      component={BittsQuizVideo}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1080}
    />
    {/* Portrait 9:16 — Instagram Reels */}
    <Composition
      id="BittsQuizReels"
      component={BittsQuizReel}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
