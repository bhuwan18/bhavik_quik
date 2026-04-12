import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.myinstants.com/en/instant/${encodeURIComponent(slug)}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.myinstants.com/",
      },
    });

    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const html = await res.text();
    const match = html.match(/\/media\/sounds\/[^'"<\s]+/);
    if (!match) return NextResponse.json({ error: "Audio not found" }, { status: 404 });

    const audioUrl = `https://www.myinstants.com${match[0]}`;
    return NextResponse.json({ audioUrl }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
