import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_req, { params }) {
  const { id } = params;

  const { data: line, error } = await supabaseAdmin
    .from("lines")
    .select("id, status, last_seen, expires_at")
    .eq("id", id)
    .single();

  if (error || !line) return new Response("Not found", { status: 404 });

  // activo si hay crédito
  const active = line.expires_at && new Date(line.expires_at) > new Date();

  return Response.json({
    status: active ? (line.status || "connected") : "pending",
    last_seen: line.last_seen,
    active,
  });
}

// opcional: endpoint para marcar conectado manual (simulación)
export async function POST(_req, { params }) {
  const { id } = params;
  const { error } = await supabaseAdmin
    .from("lines")
    .update({ status: "connected", last_seen: new Date().toISOString() })
    .eq("id", id);

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
}