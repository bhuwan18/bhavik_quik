import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pusherServer, dinorexChannel } from "@/lib/pusher";
import type { DinoRexPlayer, DinoRexQuestion } from "@/lib/pusher";
import {
  DINOREX_WIN_BONUS_COINS,
  GAME_COINS_PER_CORRECT,
  DAILY_LIMIT_REGULAR,
  DAILY_LIMIT_PRO,
  DAILY_LIMIT_MAX,
  MULTIPLIER_PRO,
  MULTIPLIER_MAX,
} from "@/lib/game-config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, questionIdx, answerIdx } = await req.json() as {
    code: string;
    questionIdx: number;
    answerIdx: number; // -1 = timed out
  };

  const room = await prisma.dinoRexRoom.findUnique({ where: { code } });
  if (!room || room.status !== "playing") {
    return NextResponse.json({ error: "Game not active" }, { status: 409 });
  }

  const players = room.players as DinoRexPlayer[];
  const questions = room.questions as DinoRexQuestion[];
  const currentAnswers = room.currentAnswers as Record<string, number>;
  const userId = session.user.id!;

  // Validate the player is alive and this is the right round
  const player = players.find((p) => p.userId === userId);
  if (!player) return NextResponse.json({ error: "Not in this game" }, { status: 403 });
  if (player.eliminated) return NextResponse.json({ ok: true }); // already out
  if (questionIdx !== room.currentQ) return NextResponse.json({ ok: true }); // stale
  if (userId in currentAnswers) return NextResponse.json({ ok: true }); // already answered

  const q = questions[questionIdx];
  if (!q) return NextResponse.json({ error: "Invalid question" }, { status: 400 });

  const correct = answerIdx === q.correctIndex;
  const eliminated = !correct; // wrong or timeout (-1)

  // Update player state
  const updatedPlayers = players.map((p) =>
    p.userId === userId
      ? { ...p, eliminated: p.eliminated || eliminated, score: p.score + (correct ? 1 : 0) }
      : p
  );
  const updatedAnswers = { ...currentAnswers, [userId]: answerIdx };

  await prisma.dinoRexRoom.update({
    where: { code },
    data: {
      players: updatedPlayers as object[],
      currentAnswers: updatedAnswers,
    },
  });

  // Notify others this player answered (without revealing correct)
  await pusherServer.trigger(dinorexChannel(code), "player-answered", {
    userId,
    eliminated,
  });

  // Check if all alive players have answered → advance round
  const alivePlayers = updatedPlayers.filter((p) => !p.eliminated);

  // Players eliminated THIS round are counted as answered too
  const justEliminated = updatedPlayers
    .filter((p) => p.eliminated && p.userId in updatedAnswers)
    .map((p) => p.userId);

  const allAnswered =
    alivePlayers.length === 0 || // everyone eliminated
    alivePlayers.every((p) => p.userId in updatedAnswers);

  if (allAnswered) {
    await advanceRound(code, updatedPlayers, questions, updatedAnswers, room.currentQ, justEliminated);
  }

  return NextResponse.json({ ok: true, correct, eliminated });
}

async function advanceRound(
  code: string,
  players: DinoRexPlayer[],
  questions: DinoRexQuestion[],
  currentAnswers: Record<string, number>,
  currentQ: number,
  eliminations: string[]
) {
  const q = questions[currentQ];
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.userId] = p.score;

  const alive = players.filter((p) => !p.eliminated);
  const isLastQ = currentQ + 1 >= questions.length;
  const nextQuestion = isLastQ ? null : questions[currentQ + 1] ?? null;

  // Determine winner
  let winner: DinoRexPlayer | null = null;
  if (alive.length === 1) {
    winner = alive[0];
  } else if (alive.length === 0 || isLastQ) {
    // Most correct answers wins
    winner = players.reduce<DinoRexPlayer | null>((best, p) => (!best || p.score > best.score ? p : best), null);
  }

  if (winner || isLastQ) {
    // Game ended
    await prisma.dinoRexRoom.update({
      where: { code },
      data: { status: "ended", winner: winner?.userId ?? null },
    });

    // Award coins to winner + participation coins to non-winners, respecting daily limits
    const participantIds = players.map((p) => p.userId);
    const dbUsers = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        isPro: true,
        proExpiresAt: true,
        isMax: true,
        maxExpiresAt: true,
        dailyCoinsEarned: true,
        dailyCoinsReset: true,
      },
    });
    const dbUserMap = new Map(dbUsers.map((u) => [u.id, u]));

    const now = new Date();
    const coinUpdates: Promise<unknown>[] = [];

    function cappedCoins(userId: string, rawCoins: number): number {
      const u = dbUserMap.get(userId);
      if (!u || rawCoins <= 0) return 0;
      const isMaxActive = u.isMax && (!u.maxExpiresAt || u.maxExpiresAt > now);
      const isProActive = !isMaxActive && u.isPro && (!u.proExpiresAt || u.proExpiresAt > now);
      const multiplier = isMaxActive ? MULTIPLIER_MAX : isProActive ? MULTIPLIER_PRO : 1;
      const dailyLimit = isMaxActive ? DAILY_LIMIT_MAX : isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;
      const resetDate = new Date(u.dailyCoinsReset);
      const isNewDay =
        now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
        now.getUTCMonth() !== resetDate.getUTCMonth() ||
        now.getUTCDate() !== resetDate.getUTCDate();
      const currentDailyEarned = isNewDay ? 0 : u.dailyCoinsEarned;
      const remaining = Math.max(0, dailyLimit - currentDailyEarned);
      return Math.min(Math.round(rawCoins * multiplier), remaining);
    }

    if (winner) {
      const coinsWon = cappedCoins(winner.userId, winner.score * 5 + DINOREX_WIN_BONUS_COINS);
      if (coinsWon > 0) {
        const u = dbUserMap.get(winner.userId);
        const resetDate = u ? new Date(u.dailyCoinsReset) : now;
        const isNewDay =
          now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
          now.getUTCMonth() !== resetDate.getUTCMonth() ||
          now.getUTCDate() !== resetDate.getUTCDate();
        coinUpdates.push(
          prisma.user.update({
            where: { id: winner.userId },
            data: {
              coins: { increment: coinsWon },
              totalCoinsEarned: { increment: coinsWon },
              dailyCoinsEarned: isNewDay ? coinsWon : { increment: coinsWon },
              dailyCoinsReset: isNewDay ? now : undefined,
            },
          })
        );
      }
    }
    for (const p of alive.filter((p) => p.userId !== winner?.userId)) {
      const coins = cappedCoins(p.userId, p.score * GAME_COINS_PER_CORRECT);
      if (coins > 0) {
        const u = dbUserMap.get(p.userId);
        const resetDate = u ? new Date(u.dailyCoinsReset) : now;
        const isNewDay =
          now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
          now.getUTCMonth() !== resetDate.getUTCMonth() ||
          now.getUTCDate() !== resetDate.getUTCDate();
        coinUpdates.push(
          prisma.user.update({
            where: { id: p.userId },
            data: {
              coins: { increment: coins },
              totalCoinsEarned: { increment: coins },
              dailyCoinsEarned: isNewDay ? coins : { increment: coins },
              dailyCoinsReset: isNewDay ? now : undefined,
            },
          })
        );
      }
    }
    await Promise.all(coinUpdates);

    await pusherServer.trigger(code ? `dinorex-${code}` : "", "game-ended", {
      winner,
      scores,
    });
    return;
  }

  // Advance to next round
  await prisma.dinoRexRoom.update({
    where: { code },
    data: {
      currentQ: currentQ + 1,
      currentAnswers: {},
      roundStartedAt: new Date(),
    },
  });

  await pusherServer.trigger(`dinorex-${code}`, "round-ended", {
    correctIndex: q.correctIndex,
    eliminations,
    scores,
    nextQuestion,
    nextIdx: currentQ + 1,
  });
}
