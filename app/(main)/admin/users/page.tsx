import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  return <AdminUsersClient />;
}
