import { prisma } from "@/lib/db";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;

  const quizzes = await prisma.quiz.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  const difficultyLabel = (d: number) => {
    const labels = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
    return labels[d] ?? "Medium";
  };
  const difficultyColor = (d: number) => {
    const colors = ["", "text-green-400", "text-green-300", "text-yellow-400", "text-orange-400", "text-red-400"];
    return colors[d] ?? "text-yellow-400";
  };

  const activeCat = CATEGORIES.find((c) => c.slug === category);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Discover Quizzes</h1>
        <p className="text-gray-400 mt-1">Browse official and community quizzes</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <Link
          href="/discover"
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            !category ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map(({ slug, label, icon }) => (
          <Link
            key={slug}
            href={`/discover?category=${slug}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              category === slug ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {icon} {label}
          </Link>
        ))}
      </div>

      {/* Search form */}
      <form className="mb-6">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search quizzes..."
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </form>

      {activeCat && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-4xl">{activeCat.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{activeCat.label}</h2>
            <p className="text-gray-400 text-sm">{quizzes.length} quizzes available</p>
          </div>
        </div>
      )}

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz: any) => {
          const cat = CATEGORIES.find((c) => c.slug === quiz.category);
          return (
            <Link
              key={quiz.id}
              href={`/quiz/${quiz.id}`}
              className="bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{cat?.icon ?? "📝"}</span>
                <div className="flex items-center gap-2">
                  {quiz.isOfficial && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      Official
                    </span>
                  )}
                  <span className={`text-xs font-medium ${difficultyColor(quiz.difficulty)}`}>
                    {difficultyLabel(quiz.difficulty)}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{quiz.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{quiz._count.questions} questions</span>
                <span>{quiz._count.attempts.toLocaleString()} plays</span>
                <span>by {quiz.author.name?.split(" ")[0] ?? "Unknown"}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg">No quizzes found. Try a different search!</p>
        </div>
      )}
    </div>
  );
}
