import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, type } = await req.json();
  if (!message || typeof message !== "string" || message.trim().length < 5) {
    return NextResponse.json({ error: "Message too short" }, { status: 400 });
  }

  const userName = session.user.name ?? "Anonymous";
  const userEmail = session.user.email ?? "unknown";
  const feedbackType = type ?? "General";

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[BittsQuiz Feedback] ${feedbackType} from ${userName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">New Feedback — BittsQuiz</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:8px;color:#666;width:120px">From</td><td style="padding:8px;font-weight:600">${userName} &lt;${userEmail}&gt;</td></tr>
          <tr><td style="padding:8px;color:#666">Type</td><td style="padding:8px">${feedbackType}</td></tr>
        </table>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;padding:16px;border-radius:4px">
          <p style="margin:0;white-space:pre-wrap">${message.trim()}</p>
        </div>
        <p style="color:#999;font-size:12px;margin-top:16px">Sent from BittsQuiz ${new Date().getFullYear()}</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
