// app/api/wa/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0; // evita estáticos

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[WA] ❌ Falta SUPABASE_URL o SERVICE ROLE KEY en el entorno");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Normaliza teléfono (solo dígitos)
const normPhone = (p) => (p ? String(p).replace(/\D+/g, "") : null);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "";
    const baseText =
      searchParams.get("text") || "Hola! Mi código de descuento es:";

    if (!slug) {
      return NextResponse.redirect(
        new URL(`/p/${encodeURIComponent(slug)}?no-wa=1&reason=no-slug`, req.url)
      );
    }

    // 1) Buscar la página (para project_id)
    const { data: page, error: pageErr } = await admin
      .from("pages")
      .select("id, slug, project_id")
      .eq("slug", slug)
      .maybeSingle();

    if (pageErr || !page) {
      console.warn("[WA] ⚠️ Página no encontrada", pageErr);
      return NextResponse.redirect(
        new URL(`/p/${encodeURIComponent(slug)}?no-wa=1&reason=no-page`, req.url)
      );
    }

    // 2) Rotar línea por RPC
    const { data: pick, error: pickErr } = await admin.rpc("pick_next_line", {
      p_project: page.project_id,
    });

    if (pickErr) {
      console.error("[WA] ❌ Error en pick_next_line:", pickErr);
      return NextResponse.redirect(
        new URL(`/p/${encodeURIComponent(slug)}?no-wa=1&reason=rpc-error`, req.url)
      );
    }

    if (!pick || pick.length === 0) {
      return NextResponse.redirect(
        new URL(`/p/${encodeURIComponent(slug)}?no-wa=1&reason=no-line`, req.url)
      );
    }

    const phone = normPhone(pick[0].wa_phone);
    const line_id = pick[0].line_id || null;

    if (!phone) {
      return NextResponse.redirect(
        new URL(`/p/${encodeURIComponent(slug)}?no-wa=1&reason=no-phone`, req.url)
      );
    }

    // 3) Tag de tracking #p:<slug>
    const tag = ` #p:${slug}`;
    const finalText = baseText.includes("#p:") ? baseText : `${baseText}${tag}`;

    // 4) Registrar click (best-effort)
    try {
      await admin.from("analytics_whatsapp_clicks").insert([
        {
          project_id: page.project_id,
          page_id: page.id,
          slug: page.slug,
          line_id,
          wa_phone: phone,
        },
      ]);
      console.log(`[WA] ✅ Click registrado para ${slug}`);
    } catch (insertErr) {
      console.warn("[WA] ⚠️ No se pudo registrar el click:", insertErr);
    }

    // 5) Redirect a WhatsApp
    const wa = `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
      phone
    )}&text=${encodeURIComponent(finalText)}&type=phone_number&app_absent=0`;

    return NextResponse.redirect(wa, { status: 302 });
  } catch (e) {
    console.error("[WA] ❌ Error en servidor:", e);
    const u = new URL(req.url);
    const slug = u.searchParams.get("slug") || "";
    return NextResponse.redirect(
      new URL(`/p/${encodeURIComponent(slug)}?no-wa=1&reason=server-error`, req.url)
    );
  }
}