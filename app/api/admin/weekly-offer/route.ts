import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verify } from "otplib";
import { prisma } from "@/lib/db";
import { getCurrentWeekStart, getWeeklyOffers, OFFER_KEY_MAP, type WeeklyOfferType } from "@/lib/app-settings";

// Public GET — used by the shop page (no auth required)
export async function GET() {
  const offers = await getWeeklyOffers();
  return NextResponse.json(offers);
}

const ALLOWED_TYPES: WeeklyOfferType[] = ["pro", "max", "daily_reset", "coins"];

const TYPE_LABELS: Record<WeeklyOfferType, string> = {
  pro: "Pro Membership",
  max: "Max Membership",
  daily_reset: "Daily Reset",
  coins: "Coin Purchase",
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return null;
  return session;
}

async function validateTotp(code: string): Promise<boolean> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "adminTotpSecret" } });
  if (!setting) return false;
  const result = await verify({ token: code, secret: setting.value });
  return result.valid;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { type?: string; discountPercent?: number; totpCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { type, discountPercent, totpCode } = body;

  if (!type || !ALLOWED_TYPES.includes(type as WeeklyOfferType)) {
    return NextResponse.json({ error: "Invalid offer type" }, { status: 400 });
  }
  if (
    typeof discountPercent !== "number" ||
    discountPercent < 1 ||
    discountPercent > 75 ||
    !Number.isInteger(discountPercent)
  ) {
    return NextResponse.json({ error: "discountPercent must be an integer between 1 and 75" }, { status: 400 });
  }
  if (!totpCode) {
    return NextResponse.json({ error: "Missing TOTP code" }, { status: 400 });
  }

  const validTotp = await validateTotp(totpCode);
  if (!validTotp) {
    return NextResponse.json({ error: "Invalid or expired authenticator code" }, { status: 401 });
  }

  const offerType = type as WeeklyOfferType;
  const weekStart = getCurrentWeekStart().toISOString();
  const offerValue = JSON.stringify({ discountPercent, weekStart });

  await prisma.appSetting.upsert({
    where: { key: OFFER_KEY_MAP[offerType] },
    update: { value: offerValue },
    create: { key: OFFER_KEY_MAP[offerType], value: offerValue },
  });

  // Broadcast notification to all non-admin users (fire-and-forget)
  const label = TYPE_LABELS[offerType];
  const message = `🎉 Special offer: ${discountPercent}% off ${label} this week only! Head to the Shop to grab it.`;

  prisma.user
    .findMany({ where: { isAdmin: false }, select: { id: true } })
    .then(async (users) => {
      if (users.length === 0) return;
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "admin_message",
          message,
          isRead: false,
          createdAt: new Date(),
        })),
        skipDuplicates: true,
      });
      import("@/lib/push")
        .then(({ sendPushToUser: push }) => {
          for (const u of users) {
            push(u.id, "BittsQuiz Offer", message, "/shop").catch(() => {});
          }
        })
        .catch(() => {});
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { type } = body;
  if (!type || !ALLOWED_TYPES.includes(type as WeeklyOfferType)) {
    return NextResponse.json({ error: "Invalid offer type" }, { status: 400 });
  }

  await prisma.appSetting.deleteMany({ where: { key: OFFER_KEY_MAP[type as WeeklyOfferType] } });

  return NextResponse.json({ ok: true });
}
