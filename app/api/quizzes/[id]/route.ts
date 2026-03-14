import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/utils";
import type { Session } from "next-auth";

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.slug));

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      author: { select: { name: true, image: true } },
      _count: { select: { attempts: true } },
    },
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quiz);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: {
    title?: string;
    description?: string;
    category?: string;
    difficulty?: number;
    questions?: Array<{ text: string; options: string[]; correctIndex: number; order: number; explanation?: string; readMoreUrl?: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.quiz.update({
    where: { id },
    data: {
      ...(body.title !== undefined       ? { title: body.title.slice(0, 200) } : {}),
      ...(body.description !== undefined ? { description: body.description.slice(0, 1000) } : {}),
      ...(body.category !== undefined    ? { category: (VALID_CATEGORIES as Set<string>).has(body.category) ? (body.category as typeof quiz.category) : quiz.category } : {}),
      ...(body.difficulty !== undefined  ? { difficulty: Math.max(1, Math.min(5, body.difficulty)) } : {}),
    },
  });

  if (Array.isArray(body.questions) && body.questions.length > 0) {
    await prisma.question.deleteMany({ where: { quizId: id } });
    await prisma.question.createMany({
      data: body.questions.map((q, i) => ({
        quizId: id,
        text: q.text.slice(0, 500),
        options: q.options,
        correctIndex: q.correctIndex,
        order: q.order ?? i,
        points: 1,
        ...(q.explanation !== undefined ? { explanation: q.explanation.slice(0, 2000) } : {}),
        ...(q.readMoreUrl !== undefined ? { readMoreUrl: q.readMoreUrl.slice(0, 500) } : {}),
      })),
    });
  }

  const updated = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(updated);
}
