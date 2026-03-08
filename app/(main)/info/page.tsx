import { prisma } from "@/lib/db";
import { RARITY_COLORS } from "@/lib/utils";
import { auth } from "@/lib/auth";

export default async function InfoPage() {
  const session = await auth();
  const visibleQuizlets = await prisma.quizlet.findMany({
    where: { isHidden: false },
    orderBy: [{ pack: "asc" }, { rarity: "asc" }],
  });

  const ownedIds = session?.user?.id
    ? (await prisma.userQuizlet.findMany({
        where: { userId: session.user.id },
        select: { quizletId: true },
      })).map((r: any) => r.quizletId)
    : [];

  const packGroups = visibleQuizlets.reduce<Record<string, typeof visibleQuizlets>>((acc: any, q: any) => {
    if (!acc[q.pack]) acc[q.pack] = [];
    acc[q.pack].push(q);
    return acc;
  }, {});

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">ℹ️ Quizlet Info</h1>
        <p className="text-gray-400 mt-1">
          All discoverable quizlets — open packs to collect them!
          <span className="text-gray-600 ml-2">(Secret, Unique & Impossible are hidden)</span>
        </p>
      </div>

      {/* Rarity Guide */}
      <div className="mb-10 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Rarity Guide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {RARITY_ORDER.map((rarity) => {
            const info = RARITY_COLORS[rarity];
            return (
              <div key={rarity} className={`p-3 rounded-xl border-2 ${info.border} text-center`}>
                <p className={`font-bold text-sm ${info.text}`}>{info.label}</p>
              </div>
            );
          })}
        </div>
        <p className="text-gray-600 text-xs mt-3">
          ✨ There are also Secret, Unique (3 in the game), and one Impossible quizlet — find them by opening packs!
        </p>
      </div>

      {/* Pack Sections */}
      {Object.entries(packGroups).map(([packSlug, quizlets]) => (
        <div key={packSlug} className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4 capitalize">
            {packSlug.replace("-pack", "").replace(/-/g, " ")} Pack
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(quizlets as any).map((quizlet: any) => {
              const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
              const owned = ownedIds.includes(quizlet.id);
              return (
                <div
                  key={quizlet.id}
                  className={`relative border-2 rounded-2xl overflow-hidden transition-all ${rarityInfo.border} ${
                    owned ? rarityInfo.glow : "opacity-50 grayscale"
                  }`}
                  style={{
                    background: owned
                      ? `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})`
                      : "linear-gradient(135deg, #1a1a2e, #0f0f1a)",
                  }}
                >
                  {owned && (
                    <div className="absolute top-2 right-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      ✓
                    </div>
                  )}
                  <div className="p-4 flex flex-col items-center text-center">
                    <span className="text-3xl mb-2">{owned ? quizlet.icon : "❓"}</span>
                    <p className="text-white font-bold text-sm leading-tight mb-1">
                      {owned ? quizlet.name : "???"}
                    </p>
                    <span className={`text-xs font-medium ${rarityInfo.text}`}>{rarityInfo.label}</span>
                    {owned && (
                      <p className="text-white/60 text-xs mt-2 line-clamp-2">{quizlet.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
