import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizMakerForm from "@/components/quiz/QuizMakerForm";

export default async function QuizMakerPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");
  return <QuizMakerForm />;
}
