import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminQuizzesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect("/dashboard");

  const quizzes = await prisma.quiz.findMany({
    orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  const DIFF_LABEL: Record<number, string> = { 1: "Beginner", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Expert" };
  const DIFF_COLOR: Record<number, string> = {
    1: "text-green-400", 2: "text-blue-400", 3: "text-yellow-400",
    4: "text-orange-400", 5: "text-red-400",
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Edit Quizzes</h1>
        <p className="text-gray-400 text-sm">{quizzes.length} quizzes total — click Edit to modify any quiz.</p>
      </div>

      <div className="space-y-2">
        {quizzes.map((q: any) => (
          <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-white font-semibold text-sm truncate">{q.title}</span>
                {q.isOfficial && (
                  <span className="text-xs bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full">Official</span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                <span className="capitalize">{q.category}</span>
                <span className={DIFF_COLOR[q.difficulty]}>{DIFF_LABEL[q.difficulty] ?? q.difficulty}</span>
                <span>{q._count.questions} questions</span>
                <span>{q._count.attempts} attempts</span>
              </div>
            </div>
            <Link
              href={`/admin/quizzes/${q.id}/edit`}
              className="shrink-0 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition-colors"
            >
              ✏️ Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
