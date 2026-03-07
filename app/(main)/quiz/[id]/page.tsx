import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import { CATEGORIES } from "@/lib/utils";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    <div className="p-8 max-w-3xl mx-auto">
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
          questions: quiz.questions.map((q) => ({
            id: q.id,
            text: q.text,
            options: q.options as string[],
            correctIndex: q.correctIndex,
          })),
        }}
      />
    </div>
  );
}
