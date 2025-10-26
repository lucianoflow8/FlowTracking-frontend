// app/api/analytics/view/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: "slug_required" });

    const { data: page } = await admin
      .from("pages")
      .select("id, project_id")
      .eq("slug", slug)
      .maybeSingle();

    if (!page) return NextResponse.json({ error: "page_not_found" });

    await admin.from("analytics_page_views").insert([
      { project_id: page.project_id, page_id: page.id, slug },
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[analytics/view]", e);
    return NextResponse.json({ error: "server_failed" });
  }
}