import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail, verifySmtp, ADMIN_EMAIL } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Step 1: verify SMTP credentials connect OK
  const verify = await verifySmtp();
  if (!verify.ok) {
    return NextResponse.json({ ok: false, step: "verify", error: verify.error }, { status: 500 });
  }

  // Step 2: send a real test email
  const to = ADMIN_EMAIL();
  try {
    await sendEmail({
      to,
      subject: "[BittsQuiz] ✅ Test email — SMTP is working",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#7c3aed">✅ SMTP is configured correctly</h2>
          <p>This test email was sent from <strong>BittsQuiz</strong> at ${new Date().toLocaleString()}.</p>
          <p style="color:#999;font-size:12px">If you received this, new-user alerts and feedback emails will work.</p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true, sentTo: to });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, step: "send", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
