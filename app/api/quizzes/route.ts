import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const official = searchParams.get("official");

  const quizzes = await prisma.quiz.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(official === "true" ? { isOfficial: true } : {}),
      ...(official === "false" ? { isOfficial: false } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      author: { select: { name: true, image: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(quizzes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, category, difficulty, questions } = body;

  if (!title || !category || !questions?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      category,
      difficulty: Number(difficulty) || 1,
      authorId: session.user.id,
      questions: {
        create: questions.map((q: { text: string; options: string[]; correctIndex: number }, i: number) => ({
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          order: i,
        })),
      },
    },
  });

  return NextResponse.json(quiz, { status: 201 });
}
