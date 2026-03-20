import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pusherServer, dinorexChannel } from "@/lib/pusher";
import type { DinoRexPlayer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json() as { code: string };
  if (!code) return NextResponse.json({ error: "Room code required" }, { status: 400 });

  const room = await prisma.dinoRexRoom.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Game already started" }, { status: 409 });

  const players = room.players as DinoRexPlayer[];
  const { id: userId, name, image } = session.user;

  // Already in room → return current state
  if (players.find((p) => p.userId === userId)) {
    return NextResponse.json({ code: room.code, players });
  }

  if (players.length >= 8) return NextResponse.json({ error: "Room is full (max 8)" }, { status: 409 });

  const newPlayer: DinoRexPlayer = {
    userId: userId!,
    name: name ?? "Player",
    image: image ?? null,
    eliminated: false,
    score: 0,
  };

  const updated = await prisma.dinoRexRoom.update({
    where: { code: code.toUpperCase() },
    data: { players: [...players, newPlayer] as object[] },
  });

  await pusherServer.trigger(dinorexChannel(room.code), "player-joined", { player: newPlayer });

  return NextResponse.json({ code: room.code, players: updated.players });
}
