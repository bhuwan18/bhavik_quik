import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminPaymentsClient from "./AdminPaymentsClient";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect("/dashboard");

  return <AdminPaymentsClient />;
}
