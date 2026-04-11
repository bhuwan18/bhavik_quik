import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSecret, generateURI } from "otplib";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return null;
  return session;
}

export async function POST() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: "BittsQuiz", label: "admin@bittsquiz", secret });

  return NextResponse.json({ secret, otpauthUrl });
}
