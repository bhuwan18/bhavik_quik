import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const COINS_PER_CORRECT = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId, answers } = await req.json();
  // answers: { questionId: string; selectedIndex: number }[]

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  let score = 0;
  for (const answer of answers) {
    const question = quiz.questions.find((q) => q.id === answer.questionId);
    if (question && question.correctIndex === answer.selectedIndex) {
      score++;
    }
  }

  const total = quiz.questions.length;
  const coinsEarned = score * COINS_PER_CORRECT;

  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score,
      total,
      coinsEarned,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      coins: { increment: coinsEarned },
      totalCorrect: { increment: score },
      totalAnswered: { increment: total },
    },
  });

  return NextResponse.json({ score, total, coinsEarned });
}
