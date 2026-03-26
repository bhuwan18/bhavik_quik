import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ["schoolHoursEnabled", "retakeCoinsEnabled"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const schoolHoursEnabled = map.schoolHoursEnabled !== undefined ? map.schoolHoursEnabled === "true" : true;
  const retakeCoinsEnabled = map.retakeCoinsEnabled !== undefined ? map.retakeCoinsEnabled === "true" : true;

  return NextResponse.json({ schoolHoursEnabled, retakeCoinsEnabled });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ALLOWED_KEYS = ["schoolHoursEnabled", "retakeCoinsEnabled"] as const;
  type AllowedKey = (typeof ALLOWED_KEYS)[number];

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates = ALLOWED_KEYS.filter((k) => typeof body[k] === "boolean") as AllowedKey[];
  if (updates.length === 0) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await Promise.all(
    updates.map((key) =>
      prisma.appSetting.upsert({
        where: { key },
        update: { value: body[key] ? "true" : "false" },
        create: { key, value: body[key] ? "true" : "false" },
      })
    )
  );

  return NextResponse.json(Object.fromEntries(updates.map((k) => [k, body[k]])));
}
