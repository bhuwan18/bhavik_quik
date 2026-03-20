import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "ap2",
  useTLS: true,
});

export function dinorexChannel(code: string) {
  return `dinorex-${code}`;
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type DinoRexPlayer = {
  userId: string;
  name: string;
  image: string | null;
  eliminated: boolean;
  score: number;
};

export type DinoRexQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
};

export type DinoRexRoomState = {
  id: string;
  code: string;
  hostId: string;
  status: string;
  players: DinoRexPlayer[];
  questions: DinoRexQuestion[];
  currentQ: number;
  currentAnswers: Record<string, number>;
  roundStartedAt: string | null;
  winner: string | null;
};

// ─── Pusher Event Payloads ────────────────────────────────────────────────────

export type PusherEvent =
  | { event: "player-joined"; player: DinoRexPlayer }
  | { event: "player-left"; userId: string }
  | { event: "game-started"; question: DinoRexQuestion; questionIdx: number; total: number }
  | { event: "player-answered"; userId: string; eliminated: boolean }
  | { event: "round-ended"; correctIndex: number; eliminations: string[]; scores: Record<string, number>; nextQuestion: DinoRexQuestion | null; nextIdx: number }
  | { event: "game-ended"; winner: DinoRexPlayer | null; scores: Record<string, number> };
