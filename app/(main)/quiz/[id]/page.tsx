import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { CATEGORIES } from "@/lib/utils";
import { SCHOOL_EMAIL_DOMAIN, isSchoolHours } from "@/lib/time";
import { getSchoolHoursEnabled } from "@/lib/app-settings";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const email = session?.user?.email ?? "";

  // School hours + locked check for Oberoi students
  if (session?.user?.id) {
    const userFlags = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolAccessOverride: true, isLocked: true },
    });

    if (userFlags?.isLocked) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-300 mb-2">Account Locked</h2>
            <p className="text-gray-300">Your account has been locked. Contact the admin to regain access.</p>
          </div>
        </div>
      );
    }

    const isOberoi = email.endsWith(SCHOOL_EMAIL_DOMAIN);
    const schoolHoursEnabled = await getSchoolHoursEnabled();
    if (isOberoi && !userFlags?.schoolAccessOverride && schoolHoursEnabled && isSchoolHours()) {
        return (
          <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🏫</div>
              <h2 className="text-2xl font-bold text-orange-300 mb-2">Playing disabled during school hours</h2>
              <p className="text-gray-300 mb-4">
                BittsQuiz is not available Mon–Fri between 8:00 AM – 3:00 PM IST for Oberoi International School students.
              </p>
              <p className="text-gray-400 text-sm">You can play after school or ask your admin to grant you special access.</p>
            </div>
          </div>
        );
    }
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      author: { select: { name: true } },
    },
  });

  if (!quiz) notFound();

  const cat = CATEGORIES.find((c) => c.slug === quiz.category);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{cat?.icon ?? "📝"}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
            <p className="text-gray-400 text-sm">
              by {quiz.author.name} • {quiz.questions.length} questions
            </p>
          </div>
        </div>
        {quiz.description && <p className="text-gray-400 mt-2">{quiz.description}</p>}
      </div>

      <QuizPlayer
        quiz={{
          id: quiz.id,
          title: quiz.title,
          difficulty: quiz.difficulty,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options as string[],
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            readMoreUrl: q.readMoreUrl,
            imageUrl: q.imageUrl,
          })),
        }}
      />
    </div>
  );
}
