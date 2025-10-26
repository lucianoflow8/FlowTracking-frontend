// app/api/analytics/page-view/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[PageView] ❌ Faltan variables SUPABASE_URL o SERVICE_ROLE_KEY");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req) {
  try {
    // 📦 Leer el cuerpo enviado por el beacon
    const body = await req.json();

    // 🌐 Extraer headers útiles para tracking
    const referrer = req.headers.get("referer") || req.headers.get("referrer") || null;
    const ua = req.headers.get("user-agent") || null;
    const ip =
      (req.headers.get("x-forwarded-for") || "")
        .split(",")[0]
        .trim() ||
      req.headers.get("x-real-ip") ||
      null;

    // ⚙️ Insertar el evento en Supabase
    const { error } = await admin.from("analytics_page_views").insert({
      project_id: body.project_id || null,
      page_id: body.page_id || null,
      slug: body.slug || null,
      referrer,
      ua,
      ip,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_term: body.utm_term || null,
      utm_content: body.utm_content || null,
    });

    if (error) {
      console.error("[PageView] ❌ Error al registrar vista:", error);
      return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });
    }

    console.log(`[PageView] ✅ Vista registrada: ${body.slug}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PageView] ❌ Error general:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}