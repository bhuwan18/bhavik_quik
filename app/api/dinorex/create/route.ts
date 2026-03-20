import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { DinoRexPlayer } from "@/lib/pusher";

function genCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId, name, image } = session.user;

  // Clean up stale rooms (older than 2h) to avoid clutter
  await prisma.dinoRexRoom.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
  });

  let code = genCode();
  // Ensure uniqueness
  while (await prisma.dinoRexRoom.findUnique({ where: { code } })) {
    code = genCode();
  }

  const hostPlayer: DinoRexPlayer = {
    userId: userId!,
    name: name ?? "Player",
    image: image ?? null,
    eliminated: false,
    score: 0,
  };

  const room = await prisma.dinoRexRoom.create({
    data: {
      code,
      hostId: userId!,
      players: [hostPlayer] as object[],
    },
  });

  return NextResponse.json({ code: room.code, roomId: room.id });
}
