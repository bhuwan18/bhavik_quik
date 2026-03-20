import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import type { DinoRexPlayer, DinoRexQuestion } from "@/lib/pusher";
import { DINOREX_TIMER_S, DINOREX_WIN_BONUS_COINS, GAME_COINS_PER_CORRECT } from "@/lib/game-config";

// Force-reveal called by any client when their timer expires.
// Server validates that enough time has passed, then eliminates all non-answerers and advances.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, questionIdx } = await req.json() as { code: string; questionIdx: number };

  const room = await prisma.dinoRexRoom.findUnique({ where: { code } });
  if (!room || room.status !== "playing") return NextResponse.json({ ok: true });
  if (room.currentQ !== questionIdx) return NextResponse.json({ ok: true }); // already advanced

  // Ensure timer has actually expired (client can't cheat early)
  const elapsed = room.roundStartedAt ? Date.now() - room.roundStartedAt.getTime() : Infinity;
  if (elapsed < (DINOREX_TIMER_S - 1) * 1000) {
    return NextResponse.json({ error: "Timer not expired" }, { status: 400 });
  }

  const players = room.players as DinoRexPlayer[];
  const questions = room.questions as DinoRexQuestion[];
  const currentAnswers = room.currentAnswers as Record<string, number>;
  const q = questions[questionIdx];
  if (!q) return NextResponse.json({ error: "Invalid question" }, { status: 400 });

  // Eliminate any alive players who haven't answered
  const newEliminations: string[] = [];
  const updatedPlayers = players.map((p) => {
    if (!p.eliminated && !(p.userId in currentAnswers)) {
      newEliminations.push(p.userId);
      return { ...p, eliminated: true };
    }
    return p;
  });

  // Save eliminations
  await prisma.dinoRexRoom.update({
    where: { code },
    data: {
      players: updatedPlayers as object[],
      currentAnswers: {
        ...currentAnswers,
        ...Object.fromEntries(newEliminations.map((id) => [id, -1])),
      },
    },
  });

  const scores: Record<string, number> = {};
  for (const p of updatedPlayers) scores[p.userId] = p.score;

  const alive = updatedPlayers.filter((p) => !p.eliminated);
  const isLastQ = questionIdx + 1 >= questions.length;
  const nextQuestion = isLastQ ? null : questions[questionIdx + 1] ?? null;

  let winner: DinoRexPlayer | null = null;
  if (alive.length === 1) {
    winner = alive[0];
  } else if (alive.length === 0 || isLastQ) {
    winner = updatedPlayers.reduce<DinoRexPlayer | null>(
      (best, p) => (!best || p.score > best.score ? p : best),
      null
    );
  }

  if (winner || isLastQ) {
    await prisma.dinoRexRoom.update({ where: { code }, data: { status: "ended", winner: winner?.userId ?? null } });

    if (winner) {
      const coinsWon = winner.score * 5 + DINOREX_WIN_BONUS_COINS;
      await prisma.user.update({
        where: { id: winner.userId },
        data: { coins: { increment: coinsWon }, totalCoinsEarned: { increment: coinsWon } },
      });
    }
    for (const p of alive.filter((p) => p.userId !== winner?.userId)) {
      const coins = p.score * GAME_COINS_PER_CORRECT;
      if (coins > 0) {
        await prisma.user.update({
          where: { id: p.userId },
          data: { coins: { increment: coins }, totalCoinsEarned: { increment: coins } },
        });
      }
    }

    await pusherServer.trigger(`dinorex-${code}`, "game-ended", { winner, scores });
    return NextResponse.json({ ok: true });
  }

  await prisma.dinoRexRoom.update({
    where: { code },
    data: { currentQ: questionIdx + 1, currentAnswers: {}, roundStartedAt: new Date() },
  });

  await pusherServer.trigger(`dinorex-${code}`, "round-ended", {
    correctIndex: q.correctIndex,
    eliminations: newEliminations,
    scores,
    nextQuestion,
    nextIdx: questionIdx + 1,
  });

  return NextResponse.json({ ok: true });
}
