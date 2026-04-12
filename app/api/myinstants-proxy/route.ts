import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.myinstants.com/",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ?audio=/media/sounds/file.mp3 — stream the audio bytes (same-origin, bypasses iOS CORS)
  const audioPath = req.nextUrl.searchParams.get("audio");
  if (audioPath !== null) {
    if (!/^\/media\/sounds\/[^/]+\.mp3$/.test(audioPath)) {
      return new NextResponse("Bad request", { status: 400 });
    }
    try {
      const upstream = await fetch(`https://www.myinstants.com${audioPath}`, {
        headers: { "Referer": "https://www.myinstants.com/" },
      });
      if (!upstream.ok) return new NextResponse(null, { status: 404 });
      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  // ?slug=bruh — resolve the real audio path from the myinstants page
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.myinstants.com/en/instant/${encodeURIComponent(slug)}/`, {
      headers: BROWSER_HEADERS,
    });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const html = await res.text();
    const match = html.match(/\/media\/sounds\/[^'"<\s]+/);
    if (!match) return NextResponse.json({ error: "Audio not found" }, { status: 404 });

    // Return a same-origin proxy URL instead of the cross-origin myinstants URL
    const audioPath = match[0];
    const proxyUrl = `/api/myinstants-proxy?audio=${encodeURIComponent(audioPath)}`;
    return NextResponse.json({ proxyUrl }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
