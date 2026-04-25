import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SELL_VALUES } from "@/lib/utils";

function adminOnly(session: Session | null): boolean {
  return !!(session?.user?.id && (session.user as { isAdmin?: boolean }).isAdmin);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let action: string, adminNote: string | undefined;
  try {
    const body = await req.json();
    action = body.action;
    adminNote = body.adminNote;
    if (action !== "approve" && action !== "reject") throw new Error("Invalid action");
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 });
  }

  const submission = await prisma.quizletSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 409 });

  if (action === "reject") {
    await prisma.quizletSubmission.update({
      where: { id },
      data: { status: "rejected", adminNote: adminNote ?? null },
    });
    return NextResponse.json({ success: true, status: "rejected" });
  }

  // Check for name collision before creating
  const existingQuizlet = await prisma.quizlet.findUnique({ where: { name: submission.name }, select: { id: true } });
  if (existingQuizlet) {
    await prisma.quizletSubmission.update({
      where: { id },
      data: { status: "rejected", adminNote: "Name conflict with existing quizlet" },
    });
    return NextResponse.json({ error: "A quizlet with this name already exists — submission rejected" }, { status: 409 });
  }

  const sellValue = SELL_VALUES[submission.rarity] ?? SELL_VALUES.common;
  const isHidden = ["secret", "unique", "impossible"].includes(submission.rarity);

  await prisma.$transaction([
    prisma.quizlet.create({
      data: {
        name: submission.name,
        rarity: submission.rarity,
        pack: submission.pack,
        icon: submission.icon,
        colorFrom: submission.colorFrom,
        colorTo: submission.colorTo,
        description: submission.description,
        isHidden,
        sellValue,
        createdByUserId: submission.userId,
      },
    }),
    prisma.quizletSubmission.update({
      where: { id },
      data: { status: "approved", adminNote: adminNote ?? null },
    }),
  ]);

  // Publish creation event to creator's feed (followers will see it)
  prisma.feedActivity.create({
    data: {
      userId: submission.userId,
      type: "quizlet_created",
      data: {
        quizletName: submission.name,
        icon: submission.icon,
        colorFrom: submission.colorFrom,
        colorTo: submission.colorTo,
        rarity: submission.rarity,
        pack: submission.pack,
      },
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, status: "approved" });
}
