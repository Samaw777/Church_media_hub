import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Removes someone from the team (admins only). Deletes their login so the app
// can't recreate their profile, which also deletes their members row, and clears
// them from upcoming Sundays. Past availability and assignments stay as history.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY isn't set in Vercel." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const name: string = (body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Who should be removed?" }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Who is asking? Checked server-side from their own sign-in, not from the request body.
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { data: me } = await admin.from("members").select("name, role").eq("user_id", caller.user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ error: "Only admins can remove people." }, { status: 403 });

  const { data: target } = await admin.from("members").select("id, name, role, user_id").eq("name", name).maybeSingle();
  if (!target) return NextResponse.json({ error: `${name} isn't on the team.` }, { status: 404 });
  if (target.user_id === caller.user.id) {
    return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: `${name} is an admin. Make them a regular member first.` }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  await Promise.all([
    admin.from("assignments").delete().eq("member_name", target.name).gte("sunday", today),
    admin.from("availability").delete().eq("member_name", target.name).gte("sunday", today),
  ]);

  if (target.user_id) {
    const { error } = await admin.auth.admin
      .deleteUser(target.user_id)
      .catch((e: Error) => ({ error: e }));
    if (error) {
      console.error("remove-member deleteUser failed:", error.message);
      return NextResponse.json({ error: "Couldn't remove their login. Try again." }, { status: 500 });
    }
  }
  // Covers profiles with no login, and makes sure the row is gone either way.
  await admin.from("members").delete().eq("id", target.id);

  return NextResponse.json({ removed: target.name });
}
