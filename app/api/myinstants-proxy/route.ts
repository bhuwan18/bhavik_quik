import { NextRequest, NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.myinstants.com/",
};

// Public proxy — only serves content from myinstants.com; slug and path validation prevents abuse.
export async function GET(req: NextRequest) {
  // ?audio=/media/sounds/file.mp3 — stream the audio bytes (same-origin, bypasses iOS CORS)
  const audioPath = req.nextUrl.searchParams.get("audio");
  if (audioPath !== null) {
    if (!/^\/media\/sounds\/[^/]+\.mp3$/.test(audioPath)) {
      return new NextResponse("Bad request", { status: 400 });
    }
    try {
      const upstreamHeaders: Record<string, string> = { "Referer": "https://www.myinstants.com/" };
      const rangeHeader = req.headers.get("range");
      if (rangeHeader) upstreamHeaders["Range"] = rangeHeader;

      const upstream = await fetch(`https://www.myinstants.com${audioPath}`, {
        headers: upstreamHeaders,
      });
      if (!upstream.ok && upstream.status !== 206) return new NextResponse(null, { status: 404 });

      const responseHeaders: Record<string, string> = {
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      };
      const contentRange = upstream.headers.get("content-range");
      const contentLength = upstream.headers.get("content-length");
      if (contentRange) responseHeaders["Content-Range"] = contentRange;
      if (contentLength) responseHeaders["Content-Length"] = contentLength;

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
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
    const resolvedPath = match[0];
    const proxyUrl = `/api/myinstants-proxy?audio=${encodeURIComponent(resolvedPath)}`;
    return NextResponse.json({ proxyUrl }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
