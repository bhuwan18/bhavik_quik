import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminQuizletSubmissionsClient from "./AdminQuizletSubmissionsClient";

export default async function AdminQuizletSubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect("/dashboard");

  return <AdminQuizletSubmissionsClient />;
}
