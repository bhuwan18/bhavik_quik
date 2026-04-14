import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/utils";

const VALID_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawCategory = searchParams.get("category");
  const rawSearch = searchParams.get("search");
  const official = searchParams.get("official");
  const rawOffset = searchParams.get("offset");

  // Validate and sanitize inputs
  const category = rawCategory && VALID_CATEGORY_SLUGS.includes(rawCategory as (typeof VALID_CATEGORY_SLUGS)[number]) ? rawCategory : null;
  const search = rawSearch ? rawSearch.slice(0, 100) : null;
  const offset = Math.max(0, parseInt(rawOffset ?? "0", 10) || 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.quiz.findMany({
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
    orderBy: [{ attempts: { _count: "desc" } }],
    skip: offset,
    take: PAGE_SIZE + 1,
  });

  const hasMore = rows.length > PAGE_SIZE;
  const quizzes = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map((q) => ({
    ...q,
    isNew: q.createdAt >= sevenDaysAgo,
  }));

  return NextResponse.json({ quizzes, hasMore });
}

const VALID_CATEGORIES = CATEGORIES.map((c) => c.slug);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Authoritative DB check for lock and admin status
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true, isAdmin: true },
  });
  if (dbUser?.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });
  if (!dbUser?.isAdmin) return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });

  let body: { title?: unknown; description?: unknown; category?: unknown; difficulty?: unknown; questions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, category, difficulty, questions } = body;

  if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 200)
    return NextResponse.json({ error: "Title must be 3–200 characters" }, { status: 400 });
  if (typeof category !== "string" || !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number]))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  const diff = Number(difficulty);
  if (!Number.isInteger(diff) || diff < 1 || diff > 5)
    return NextResponse.json({ error: "Difficulty must be 1–5" }, { status: 400 });
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 50)
    return NextResponse.json({ error: "Provide 1–50 questions" }, { status: 400 });
  for (const q of questions) {
    if (
      typeof q.text !== "string" || q.text.trim().length < 5 ||
      !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6 ||
      !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length
    ) return NextResponse.json({ error: "Invalid question format" }, { status: 400 });
  }
  if (description !== undefined && (typeof description !== "string" || description.length > 500))
    return NextResponse.json({ error: "Description max 500 chars" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      title: title.trim(),
      description: description ? String(description).trim() : undefined,
      category,
      difficulty: diff,
      authorId: session.user.id,
      questions: {
        create: (questions as { text: string; options: string[]; correctIndex: number }[]).map((q, i) => ({
          text: q.text.trim(),
          options: q.options.map((o) => String(o).trim()),
          correctIndex: q.correctIndex,
          order: i,
        })),
      },
    },
  });

  return NextResponse.json(quiz, { status: 201 });
}
