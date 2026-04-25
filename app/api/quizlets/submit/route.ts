import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SELL_VALUES } from "@/lib/utils";

const HIDDEN_RARITIES = new Set(["secret", "unique", "impossible"]);
const VALID_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];
const ALLOWED_PACKS = ["tech-pack", "sports-pack", "magic-pack", "hero-pack", "music-pack", "science-pack", "math-pack", "english-pack"];

// Ensure SELL_VALUES is imported — used only for type-checking the rarity is mappable
void (SELL_VALUES satisfies Record<string, number>);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isBlacksmith: true, blacksmithExpiresAt: true, isLocked: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  const isBlacksmithActive = dbUser.isBlacksmith && (!dbUser.blacksmithExpiresAt || dbUser.blacksmithExpiresAt > new Date());
  if (!isBlacksmithActive) return NextResponse.json({ error: "Blacksmith subscription required" }, { status: 403 });

  let name: string, icon: string, colorFrom: string, colorTo: string, rarity: string, description: string, pack: string;
  try {
    const body = await req.json();
    name = body.name?.trim() ?? "";
    icon = body.icon?.trim() ?? "";
    colorFrom = body.colorFrom?.trim() ?? "";
    colorTo = body.colorTo?.trim() ?? "";
    rarity = body.rarity ?? "";
    description = body.description?.trim() ?? "";
    pack = body.pack ?? "";

    if (!name) throw new Error("Name is required");
    if (!icon) throw new Error("Icon is required");
    if (!colorFrom) throw new Error("Color from is required");
    if (!colorTo) throw new Error("Color to is required");
    if (!description) throw new Error("Description is required");
    if (name.length > 40) throw new Error("Name too long (max 40 characters)");
    if (description.length > 200) throw new Error("Description too long (max 200 characters)");
    if ([...icon].length > 2) throw new Error("Icon must be 1–2 emoji characters");
    if (!VALID_RARITIES.includes(rarity)) throw new Error("Invalid rarity");
    if (!ALLOWED_PACKS.includes(pack)) throw new Error("Invalid pack selection");
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 });
  }

  // Monthly limit check — count ALL statuses to prevent spam
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const monthlyCount = await prisma.quizletSubmission.count({
    where: {
      userId: session.user.id,
      rarity,
      createdAt: { gte: monthStart, lt: monthEnd },
    },
  });

  const limit = HIDDEN_RARITIES.has(rarity) ? 1 : 2;
  if (monthlyCount >= limit) {
    return NextResponse.json({
      error: `Monthly limit reached for ${rarity} rarity (${limit} per month)`,
    }, { status: 429 });
  }

  // Prevent duplicate name
  const existing = await prisma.quizlet.findUnique({ where: { name }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "A quizlet with this name already exists" }, { status: 409 });

  const submission = await prisma.quizletSubmission.create({
    data: {
      userId: session.user.id,
      name,
      icon,
      colorFrom,
      colorTo,
      rarity,
      description,
      pack,
      status: "pending",
    },
  });

  return NextResponse.json({ success: true, submissionId: submission.id });
}
