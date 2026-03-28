import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { getActiveFestivalPackSlugs } from "@/lib/festivals";

// Cache packs per unique festival-slug set; revalidate every 5 minutes
const getCachedPacks = unstable_cache(
  async (festivalSlugsKey: string) => {
    const festivalSlugs = festivalSlugsKey ? festivalSlugsKey.split(",") : [];
    return prisma.pack.findMany({
      where: {
        OR: [
          { isActive: true, isFestival: false },
          { slug: { in: festivalSlugs } },
        ],
      },
      orderBy: [{ isFestival: "desc" }, { cost: "asc" }],
    });
  },
  ["packs-list"],
  { revalidate: 300 }
);

export async function GET() {
  const festivalSlugs = getActiveFestivalPackSlugs();
  const packs = await getCachedPacks(festivalSlugs.join(","));
  return NextResponse.json(packs);
}
