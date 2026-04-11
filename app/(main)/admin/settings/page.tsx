import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSettingsClient from "./AdminSettingsClient";
import { getSchoolHoursEnabled, getRetakeCoinsEnabled, getWeeklyOffers } from "@/lib/app-settings";
import { prisma } from "@/lib/db";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin) redirect("/dashboard");

  const [schoolHoursEnabled, retakeCoinsEnabled, weeklyOffers] = await Promise.all([
    getSchoolHoursEnabled(),
    getRetakeCoinsEnabled(),
    getWeeklyOffers(),
  ]);

  const totpSetting = await prisma.appSetting.findUnique({ where: { key: "adminTotpSecret" } });
  const totpConfigured = !!totpSetting;

  return (
    <AdminSettingsClient
      schoolHoursEnabled={schoolHoursEnabled}
      retakeCoinsEnabled={retakeCoinsEnabled}
      weeklyOffers={weeklyOffers}
      totpConfigured={totpConfigured}
    />
  );
}
