import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verify } from "otplib";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return null;
  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { secret?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { secret, code } = body;
  if (!secret || !code) {
    return NextResponse.json({ error: "Missing secret or code" }, { status: 400 });
  }

  const result = await verify({ token: code, secret });
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key: "adminTotpSecret" },
    update: { value: secret },
    create: { key: "adminTotpSecret", value: secret },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.appSetting.deleteMany({ where: { key: "adminTotpSecret" } });

  return NextResponse.json({ ok: true });
}
