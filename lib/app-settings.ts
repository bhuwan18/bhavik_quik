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

/**
 * Returns true if users can earn coins when retaking a quiz (re-answering
 * questions they have already answered correctly before).
 * Defaults to true if the setting has never been saved.
 */
export async function getRetakeCoinsEnabled(): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "retakeCoinsEnabled" },
  });
  return setting ? setting.value === "true" : true;
}
