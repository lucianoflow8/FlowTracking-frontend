// app/api/analytics/conversion/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

export async function POST(req) {
  try {
    const body = await req.json();
    await admin.from("analytics_conversions").insert({
      project_id: body.project_id,
      page_id: body.page_id,
      slug: body.slug,
      amount: body.amount || 0,
      wa_phone: body.wa_phone || null,
      user_phone: body.user_phone || null,
      notes: body.notes || null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Conversion] error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}