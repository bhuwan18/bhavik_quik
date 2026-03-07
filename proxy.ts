import { NextRequest, NextResponse } from "next/server";

// ── Simple in-memory rate limiter ────────────────────────────────────────────
// Works for single-server / dev. For multi-instance production use Redis.
// Edge runtime compatible — no Node.js crypto required.
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMITS: Array<{ prefix: string; windowMs: number; max: number }> = [
  // Most specific prefixes first
  { prefix: "/api/attempt",          windowMs: 60_000, max: 20 },
  { prefix: "/api/packs/open",       windowMs: 60_000, max: 10 },
  { prefix: "/api/quizlets/sell",    windowMs: 60_000, max: 10 },
  { prefix: "/api/user/submit-payment",  windowMs: 60_000, max: 5  },
  { prefix: "/api/admin",            windowMs: 60_000, max: 60 },
  { prefix: "/api",                  windowMs: 60_000, max: 120 },
];

function checkRateLimit(ip: string, pathname: string): boolean {
  const rule = RATE_LIMITS.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return true;

  const key = `${rule.prefix}::${ip}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > rule.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= rule.max) return false;
  entry.count++;
  return true;
}

// Periodically clean up stale entries
let lastClean = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastClean < 60_000) return;
  lastClean = now;
  const cutoff = now - 120_000;
  for (const [key, val] of rateLimitStore.entries()) {
    if (val.windowStart < cutoff) rateLimitStore.delete(key);
  }
}

// ── Proxy (formerly middleware) ───────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  maybeCleanup();

  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // Security headers on all responses
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next internals
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
