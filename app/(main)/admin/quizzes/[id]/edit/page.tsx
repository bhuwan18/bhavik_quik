import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import QuizEditClient from "./QuizEditClient";

export default async function AdminQuizEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect("/dashboard");

  const { id } = await params;
  const raw = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!raw) redirect("/admin/quizzes");

  const data = raw as NonNullable<typeof raw>;
  const quiz = {
    ...data,
    questions: data.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      correctIndex: q.correctIndex,
      order: q.order,
    })),
  };

  return <QuizEditClient quiz={quiz} />;
}
