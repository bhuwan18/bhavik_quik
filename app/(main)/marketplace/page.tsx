import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveFestivalPackSlugs, getTodaysFestival } from "@/lib/festivals";
import MarketplaceClient from "@/components/marketplace/MarketplaceClient";

export default async function MarketplacePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  const festivalSlugs = getActiveFestivalPackSlugs();
  const festival = getTodaysFestival();

  const packs = await prisma.pack.findMany({
    where: {
      OR: [
        { isActive: true, isFestival: false },
        { slug: { in: festivalSlugs } },
      ],
    },
    orderBy: [{ isFestival: "desc" }, { cost: "asc" }],
  });

  return (
    <MarketplaceClient
      packs={packs}
      userCoins={user?.coins ?? 0}
      festival={festival}
    />
  );
}
