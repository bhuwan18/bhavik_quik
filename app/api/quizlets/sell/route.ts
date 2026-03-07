import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizletId } = await req.json();

  const ownership = await prisma.userQuizlet.findUnique({
    where: { userId_quizletId: { userId: session.user.id, quizletId } },
    include: { quizlet: true },
  });

  if (!ownership) return NextResponse.json({ error: "You don't own this quizlet" }, { status: 404 });

  const sellValue = ownership.quizlet.sellValue;

  await prisma.userQuizlet.delete({
    where: { userId_quizletId: { userId: session.user.id, quizletId } },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coins: { increment: sellValue } },
  });

  return NextResponse.json({ coinsEarned: sellValue, quizletName: ownership.quizlet.name });
}
