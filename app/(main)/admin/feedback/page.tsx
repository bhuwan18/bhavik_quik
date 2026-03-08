import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminFeedbackClient from "./AdminFeedbackClient";

export default async function AdminFeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect("/dashboard");

  return <AdminFeedbackClient />;
}
