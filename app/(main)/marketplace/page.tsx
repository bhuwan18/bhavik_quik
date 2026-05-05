import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveFestivalPackSlugs, getTodaysFestival } from "@/lib/festivals";
import { getISTDateString } from "@/lib/time";
import MarketplaceClient from "@/components/marketplace/MarketplaceClient";

export default async function MarketplacePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const todayIST = getISTDateString(now);

  const [user, maxOpenedRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true },
    }),
    prisma.packMaxOpen.findMany({
      where: { userId: session.user.id },
      select: { packSlug: true, usedAt: true },
    }),
  ]);

  const maxOpenedToday = maxOpenedRows
    .filter((r) => getISTDateString(r.usedAt) === todayIST)
    .map((r) => r.packSlug);

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
      maxOpenedToday={maxOpenedToday}
    />
  );
}
