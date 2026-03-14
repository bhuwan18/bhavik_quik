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

  const setting = await prisma.appSetting.findUnique({
    where: { key: "schoolHoursEnabled" },
  });
  const schoolHoursEnabled = setting ? setting.value === "true" : true;

  return NextResponse.json({ schoolHoursEnabled });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let schoolHoursEnabled: boolean;
  try {
    const body = await req.json();
    if (typeof body.schoolHoursEnabled !== "boolean") throw new Error();
    schoolHoursEnabled = body.schoolHoursEnabled;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key: "schoolHoursEnabled" },
    update: { value: schoolHoursEnabled ? "true" : "false" },
    create: { key: "schoolHoursEnabled", value: schoolHoursEnabled ? "true" : "false" },
  });

  return NextResponse.json({ schoolHoursEnabled });
}
