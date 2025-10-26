// app/api/meta/capi/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* ============================
   🔹 Configuración base (NO públicas)
   ============================ */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/* ============================
   🔹 Helpers
   ============================ */
function sha256Lower(s) {
  if (!s) return undefined;
  return crypto.createHash("sha256").update(String(s).trim().toLowerCase()).digest("hex");
}
function onlyDigits(s = "") {
  return String(s).replace(/\D+/g, "");
}
function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = clean(v);
      if (Object.keys(nested).length) out[k] = nested;
    } else {
      out[k] = v;
    }
  }
  return out;
}

/* ============================
   🔹 Endpoint principal (POST)
   ============================ */
export async function POST(req) {
  try {
    const headers = Object.fromEntries(req.headers.entries());
    const referer = headers.referer || headers.referrer || undefined;
    const clientIp =
      headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      headers["x-real-ip"] ||
      undefined;
    const ua = headers["user-agent"] || undefined;

    const body = await req.json();

    const {
      page_id,                // requerido
      event_name,             // "PageView" | "Lead" | "Purchase" | ...
      event_time,             // epoch seconds (opcional)
      event_id,               // para dedupe (opcional)
      source_url,             // si no viene, usamos referer

      // user_data opcional (sin hash; acá se hashea)
      email,
      phone,
      external_id,
      fbp,
      fbc,
      client_user_agent,

      // custom_data (ej: Purchase)
      value,
      currency,
      content_name,
      content_category,
      contents,
      num_items,
    } = body || {};

    if (!page_id) {
      return NextResponse.json(
        { ok: false, error: "page_id es requerido" },
        { status: 400 }
      );
    }

    // Credenciales del Pixel guardadas en pages
    const { data: page, error } = await supabase
      .from("pages")
      .select("fb_pixel_id, fb_access_token, fb_test_event_code")
      .eq("id", page_id)
      .single();

    if (error || !page?.fb_pixel_id || !page?.fb_access_token) {
      return NextResponse.json(
        { ok: false, error: "Faltan credenciales de Meta en esta página." },
        { status: 400 }
      );
    }

    // user_data (CAPI requiere hash SHA-256 en minúsculas)
    const user_data = clean({
      client_ip_address: clientIp,
      client_user_agent: client_user_agent || ua,
      fbp,
      fbc,
      em: email ? sha256Lower(email) : undefined,
      ph: phone ? sha256Lower(onlyDigits(phone)) : undefined,
      external_id: external_id ? sha256Lower(external_id) : undefined,
    });

    // custom_data (solo se incluyen claves válidas)
    const custom_data = clean({
      value: typeof value === "number" ? value : undefined,
      currency: currency || undefined,
      content_name: content_name || undefined,
      content_category: content_category || undefined,
      contents: Array.isArray(contents) ? contents : undefined,
      num_items: Number.isFinite(num_items) ? num_items : undefined,
    });

    // Payload CAPI
    const payload = clean({
      data: [
        clean({
          event_name: event_name || "Lead",
          event_time: Number.isFinite(event_time) ? event_time : Math.floor(Date.now() / 1000),
          event_id: event_id || crypto.randomUUID(),
          action_source: "website",
          event_source_url: source_url || referer,
          user_data,
          custom_data,
          test_event_code: page.fb_test_event_code || undefined,
        }),
      ],
    });

    // Envío a Meta
    const url = `https://graph.facebook.com/v18.0/${page.fb_pixel_id}/events?access_token=${page.fb_access_token}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();

    if (!response.ok) {
      return NextResponse.json({ ok: false, meta: json }, { status: 400 });
    }

    return NextResponse.json({ ok: true, meta: json });
  } catch (err) {
    console.error("❌ Error en /api/meta/capi:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}