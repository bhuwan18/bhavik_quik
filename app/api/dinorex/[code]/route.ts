import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await params;
  const room = await prisma.dinoRexRoom.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  return NextResponse.json({
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    players: room.players,
    currentQ: room.currentQ,
    totalQ: (room.questions as unknown[]).length,
    winner: room.winner,
  });
}

// Leave room
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await params;
  const room = await prisma.dinoRexRoom.findUnique({ where: { code } });
  if (!room || room.status !== "waiting") return NextResponse.json({ ok: true });

  const { pusherServer, dinorexChannel } = await import("@/lib/pusher");
  const userId = session.user.id!;

  if (room.hostId === userId) {
    // Host leaving → delete room
    await prisma.dinoRexRoom.delete({ where: { code } });
    await pusherServer.trigger(dinorexChannel(code), "player-left", { userId, roomClosed: true });
  } else {
    const players = (room.players as { userId: string }[]).filter((p) => p.userId !== userId);
    await prisma.dinoRexRoom.update({ where: { code }, data: { players: players as object[] } });
    await pusherServer.trigger(dinorexChannel(code), "player-left", { userId, roomClosed: false });
  }

  return NextResponse.json({ ok: true });
}
