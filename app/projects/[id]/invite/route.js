import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE;

// ⚠️ Opcional: clave de seguridad para evitar spam de invitaciones
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export async function POST(req, { params }) {
  try {
    const project_id = params.id;
    const { email, role = "editor", invited_by = null } = await req.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    // (opcional) validación por header
    if (ADMIN_API_KEY) {
      const key = req.headers.get("x-admin-key");
      if (key !== ADMIN_API_KEY) {
        return NextResponse.json({ ok: false, error: "Acceso no autorizado" }, { status: 403 });
      }
    }

    const supa = createClient(url, service);

    // crear token único para aceptar invitación
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 días

    const { error } = await supa.from("project_invites").insert({
      project_id,
      email,
      role,
      invited_by,
      token,
      status: "pending",
      expires_at,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error creando invitación:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}