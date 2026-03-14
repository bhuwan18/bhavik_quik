import { prisma } from "@/lib/db";

/**
 * Returns true if the school hours restriction is globally enabled.
 * Defaults to true if the setting has never been saved.
 */
export async function getSchoolHoursEnabled(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "schoolHoursEnabled" },
  });
  return setting ? setting.value === "true" : true;
}
