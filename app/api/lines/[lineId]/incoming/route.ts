// app/api/lines/[lineId]/incoming/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import crypto from "node:crypto";

const BUCKET = "receipts";

export async function POST(req: NextRequest, { params }: { params: { lineId: string }}) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId")!; // pásalo en la URL o resuélvelo por token
    const body = await req.json();

    // 1) Valida firma si usás WhatsApp Cloud API (X-Hub-Signature-256)
    // const signature = req.headers.get("x-hub-signature-256");
    // verifySignature(signature, await req.text(), process.env.WHATSAPP_APP_SECRET!)

    // 2) Extrae media URL + nombre cliente
    // Estructura de ejemplo: { mediaUrl, fileName, mime, customerName, caption }
    const { mediaUrl, fileName, mime, customerName, caption } = body;

    if (!mediaUrl) return NextResponse.json({ ok: true });

    // 3) Descarga el archivo
    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error("No se pudo descargar el archivo");
    const arrayBuf = await res.arrayBuffer();

    const ext = mime?.split("/")[1] || "jpg";
    const path = `receipts/${projectId}/${params.lineId}/${Date.now()}-${fileName || crypto.randomUUID()}.${ext}`;

    // 4) Sube a Storage
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(arrayBuf), {
      contentType: mime || "image/jpeg",
      upsert: false,
    });
    if (upErr) throw upErr;

    // 5) Encola para OCR
    const { error: insErr } = await supabase.from("receipt_queue").insert({
      project_id: projectId,
      line_id: params.lineId,
      customer_name: customerName || null,
      caption: caption || null,
      file_path: path,
      status: "pending",
    });
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}