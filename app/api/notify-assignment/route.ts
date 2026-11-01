import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function longDate(sunday: string) {
  return new Date(`${sunday}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPassword) {
    return NextResponse.json({ error: "Email isn't set up yet." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const sunday: string = body?.sunday ?? "";
  const roleId: string = body?.roleId ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sunday) || !roleId) {
    return NextResponse.json({ error: "Sunday and role are required." }, { status: 400 });
  }

  // Runs as the signed-in person, so the database decides whether they're an admin.
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
  const { data, error } = await db.rpc("assignment_recipient", { p_sunday: sunday, p_role_id: roleId });
  if (error) {
    console.error("assignment_recipient failed:", error.message);
    return NextResponse.json({ error: "Couldn't look up that assignment." }, { status: 500 });
  }

  const recipient = data?.[0] as { member_name: string; role_name: string; email: string } | undefined;
  if (!recipient?.email) {
    return NextResponse.json({ error: "No email address for that person." }, { status: 404 });
  }

  const date = longDate(sunday);
  const firstName = recipient.member_name.split(" ")[0];
  const calendarUrl = `${req.nextUrl.origin}/calendar`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPassword },
  });

  try {
    await transporter.sendMail({
      from: `"Media Team Hub" <${gmailUser}>`,
      to: recipient.email,
      subject: `You're on ${recipient.role_name} for ${date}`,
      text:
        `Hi ${firstName},\n\n` +
        `You've been assigned to ${recipient.role_name} on ${date}.\n\n` +
        `See the full calendar: ${calendarUrl}\n`,
      html:
        `<p>Hi ${escapeHtml(firstName)},</p>` +
        `<p>You've been assigned to <strong>${escapeHtml(recipient.role_name)}</strong> on <strong>${escapeHtml(date)}</strong>.</p>` +
        `<p><a href="${escapeHtml(calendarUrl)}">See the full calendar</a></p>`,
    });
  } catch (err) {
    console.error("Assignment email failed:", err);
    return NextResponse.json({ error: "The email didn't send." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
