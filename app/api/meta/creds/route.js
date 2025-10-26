// app/api/meta/creds/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only (no NEXT_PUBLIC)

export async function POST(req) {
  if (req.method && req.method !== "POST") {
    return NextResponse.json({ ok: false, error: "Método no permitido" }, { status: 405 });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json(
        { ok: false, error: "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const { page_id, pixel_id, access_token, test_event_code } = body || {};

    if (!page_id) {
      return NextResponse.json(
        { ok: false, error: "page_id requerido" },
        { status: 400 }
      );
    }

    const patch = {
      fb_pixel_id: (pixel_id || "").trim() || null,
      fb_access_token: (access_token || "").trim() || null,
      fb_test_event_code: (test_event_code || "").trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("pages").update(patch).eq("id", page_id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}