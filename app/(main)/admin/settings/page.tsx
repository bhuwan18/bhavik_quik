import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";
import { getSchoolHoursEnabled } from "@/lib/app-settings";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin) redirect("/dashboard");

  const schoolHoursEnabled = await getSchoolHoursEnabled();

  return <AdminSettingsClient schoolHoursEnabled={schoolHoursEnabled} />;
}
