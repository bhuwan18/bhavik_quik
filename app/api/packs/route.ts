import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveFestivalPackSlugs } from "@/lib/festivals";

export async function GET() {
  const festivalSlugs = getActiveFestivalPackSlugs();

  const packs = await prisma.pack.findMany({
    where: {
      OR: [
        { isActive: true, isFestival: false },
        { slug: { in: festivalSlugs } },
      ],
    },
    orderBy: [{ isFestival: "desc" }, { cost: "asc" }],
  });

  return NextResponse.json(packs);
}
