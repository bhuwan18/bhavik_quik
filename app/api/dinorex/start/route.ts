import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pusherServer, dinorexChannel } from "@/lib/pusher";
import type { DinoRexPlayer, DinoRexQuestion } from "@/lib/pusher";
import { DINOREX_QUESTION_COUNT } from "@/lib/game-config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json() as { code: string };
  const room = await prisma.dinoRexRoom.findUnique({ where: { code } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.hostId !== session.user.id) return NextResponse.json({ error: "Only host can start" }, { status: 403 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Already started" }, { status: 409 });

  const players = room.players as DinoRexPlayer[];
  if (players.length < 2) return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });

  // Load questions from a random official quiz (count + skip avoids fetching all IDs)
  const quizCount = await prisma.quiz.count({ where: { isOfficial: true } });
  if (!quizCount) return NextResponse.json({ error: "No quizzes available" }, { status: 500 });

  const [randomQuiz] = await prisma.quiz.findMany({
    where: { isOfficial: true },
    select: { id: true },
    skip: Math.floor(Math.random() * quizCount),
    take: 1,
  });
  const dbQuestions = await prisma.question.findMany({
    where: { quizId: randomQuiz.id },
    orderBy: { order: "asc" },
    take: DINOREX_QUESTION_COUNT,
  });

  const questions: DinoRexQuestion[] = dbQuestions.map((q) => ({
    text: q.text,
    options: q.options as string[],
    correctIndex: q.correctIndex,
  }));

  await prisma.dinoRexRoom.update({
    where: { code },
    data: {
      status: "playing",
      questions: questions as object[],
      currentQ: 0,
      currentAnswers: {},
      roundStartedAt: new Date(),
    },
  });

  await pusherServer.trigger(dinorexChannel(code), "game-started", {
    question: questions[0],
    questionIdx: 0,
    total: questions.length,
  });

  return NextResponse.json({ ok: true });
}
