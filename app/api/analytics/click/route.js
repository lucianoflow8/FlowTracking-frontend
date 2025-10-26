// app/api/analytics/click/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[Click] Faltan variables de entorno SUPABASE_URL o SERVICE_ROLE_KEY");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req) {
  try {
    const body = await req.json();

    const referrer = req.headers.get("referer") || req.headers.get("referrer") || null;
    const ua = req.headers.get("user-agent") || null;
    const ip =
      (req.headers.get("x-forwarded-for") || "")
        .split(",")[0]
        .trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const { error } = await admin.from("analytics_clicks").insert({
      project_id: body.project_id || null,
      page_id: body.page_id || null,
      slug: body.slug || null,
      referrer,
      ua,
      ip,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Click] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}