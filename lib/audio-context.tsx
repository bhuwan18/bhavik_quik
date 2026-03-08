"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const MUSIC_URL = process.env.NEXT_PUBLIC_MUSIC_URL ?? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const LS_ENABLED = "bq_music_enabled";
const LS_VOLUME  = "bq_music_volume";

type AudioCtx = {
  enabled: boolean;
  volume: number;
  playing: boolean;
  toggle: () => void;
  setVolume: (v: number) => void;
  pause: () => void;
  resume: () => void;
};

const Ctx = createContext<AudioCtx>({
  enabled: true, volume: 0.4, playing: false,
  toggle: () => {}, setVolume: () => {}, pause: () => {}, resume: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.4);
  const [playing, setPlaying] = useState(false);
  const pausedByRoute = useRef(false);

  // Init from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem(LS_ENABLED);
    const savedVolume  = localStorage.getItem(LS_VOLUME);
    if (savedEnabled !== null) setEnabled(savedEnabled === "true");
    if (savedVolume  !== null) setVolumeState(parseFloat(savedVolume));
  }, []);

  // Create audio element
  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop   = true;
    audio.volume = volume;
    audioRef.current = audio;
    audio.addEventListener("playing", () => setPlaying(true));
    audio.addEventListener("pause",   () => setPlaying(false));
    return () => { audio.pause(); audio.src = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync enabled state → play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enabled && !pausedByRoute.current) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [enabled]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      localStorage.setItem(LS_ENABLED, String(!prev));
      return !prev;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem(LS_VOLUME, String(clamped));
  }, []);

  const pause = useCallback(() => {
    pausedByRoute.current = true;
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    pausedByRoute.current = false;
    if (enabled) audioRef.current?.play().catch(() => {});
  }, [enabled]);

  return (
    <Ctx.Provider value={{ enabled, volume, playing, toggle, setVolume, pause, resume }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAudio = () => useContext(Ctx);
