import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

const admin = createClient(url, key, { auth: { persistSession: false } });

export async function GET(req) {
  const u = new URL(req.url);
  const project = u.searchParams.get("project");
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");

  if (!project) return NextResponse.json({ error: "project missing" }, { status: 400 });

  let q = admin
    .from("v_agenda_contacts")
    .select("*")
    .eq("project_id", project)
    .order("last_message_at", { ascending: false });

  if (from) q = q.gte("last_message_at", from);
  if (to) q = q.lte("last_message_at", to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["user_phone","leads","first_seen_at","last_message_at","last_message","pages"].join(",");
  const lines = (data || []).map(r =>
    [
      r.user_phone,
      r.leads,
      r.first_seen_at,
      r.last_message_at,
      (r.last_message || "").replaceAll('"','""'),
      `"${(r.pages||[]).join(" | ")}"`,
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agenda_${project}.csv"`
    }
  });
}