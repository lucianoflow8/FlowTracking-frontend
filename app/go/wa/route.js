import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabasePublic";

/** 🔧 Helpers */
const norm = (s) => (s || "").replace(/[^0-9]/g, "");
const waUrl = ({ phone, text }) =>
  `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
    text || ""
  )}&type=phone_number&app_absent=0`;

/**
 * 🔍 Busca la línea global conectada en Supabase
 * (tabla lines, whatsapp_lines o wa_lines)
 */
async function findActiveLine() {
  const candidates = [
    { table: "lines", phoneCol: "phone", statusCol: "status" },
    { table: "wa_lines", phoneCol: "phone", statusCol: "status" },
    { table: "whatsapp_lines", phoneCol: "phone", statusCol: "status" },
  ];

  for (const c of candidates) {
    const { data, error } = await supabasePublic
      .from(c.table)
      .select(`${c.phoneCol}, ${c.statusCol}`)
      .limit(1);

    if (!error && Array.isArray(data) && data[0]) {
      const row = data[0];
      const isConnected =
        (row[c.statusCol] || "")
          .toString()
          .toLowerCase()
          .includes("conect") ||
        (row[c.statusCol] || "").toLowerCase() === "connected";
      const phone = norm(row[c.phoneCol]);
      if (isConnected && phone) return phone;
    }
  }

  return null;
}

/**
 * ✅ Redirección dinámica: usa la línea escaneada o el número de la página
 * Ejemplo final:
 * https://api.whatsapp.com/send?phone=549XXXXXXXX&text=Hola%21+Mi+c%C3%B3digo...
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const text = searchParams.get("text") || "Hola! Mi código de descuento es:";

  try {
    // 1️⃣ Buscar si la página tiene un número propio
    const { data: page, error } = await supabasePublic
      .from("pages")
      .select("whatsapp_phone, whatsapp_text")
      .eq("slug", slug)
      .maybeSingle();

    if (error) console.error("Supabase page error:", error);

    let phone = norm(page?.whatsapp_phone);
    let message = page?.whatsapp_text || text;

    // 2️⃣ Si la página no tiene número, usar la línea conectada global
    if (!phone) {
      const globalPhone = await findActiveLine();
      if (globalPhone) phone = globalPhone;
    }

    // 3️⃣ Si no hay ningún número, redirigir de vuelta a la landing
    if (!phone) {
      return NextResponse.redirect(`/p/${encodeURIComponent(slug)}?no-wa=1`, {
        status: 302,
      });
    }

    // 4️⃣ Redirigir directo a WhatsApp
    const to = waUrl({ phone, text: message });
    return NextResponse.redirect(to, { status: 302 });
  } catch (e) {
    console.error("WA redirect error:", e);
    return NextResponse.redirect(`/p/${encodeURIComponent(slug)}?no-wa=1`, {
      status: 302,
    });
  }
}

/** Permitir POST también (formularios) */
export async function POST(req) {
  return GET(req);
}