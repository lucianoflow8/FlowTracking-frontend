// app/api/lines/[lineId]/incoming/route.ts

// ⬇️ Evita el intento de prerender y fuerza runtime Node.js en Vercel
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import crypto from "node:crypto";

const BUCKET = "receipts";

export async function POST(
  req: NextRequest,
  { params }: { params: { lineId: string } }
) {
  try {
    // Podés pasarlo por query (?projectId=...) o resolverlo por token
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Falta projectId" },
        { status: 400 }
      );
    }

    // Body esperado: { mediaUrl, fileName, mime, customerName, caption }
    const { mediaUrl, fileName, mime, customerName, caption } =
      (await req.json()) as {
        mediaUrl?: string;
        fileName?: string;
        mime?: string;
        customerName?: string;
        caption?: string;
      };

    if (!mediaUrl) {
      // nada que procesar; devolvemos ok para no reintentar
      return NextResponse.json({ ok: true });
    }

    // 1) Descargar archivo
    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error("No se pudo descargar el archivo remoto");

    const arrayBuf = await res.arrayBuffer();

    // 2) Armar path destino en Storage
    const ext = (mime?.split("/")[1] || "jpg").toLowerCase();
    const safeName =
      fileName?.replace(/[^\w.\-]/g, "_") || `${crypto.randomUUID()}.${ext}`;
    const path = `receipts/${projectId}/${params.lineId}/${Date.now()}-${safeName}`;

    // 3) Subir a Supabase Storage
    const { error: upErr } = await supabaseServer.storage
      .from(BUCKET)
      .upload(path, Buffer.from(arrayBuf), {
        contentType: mime || "image/jpeg",
        upsert: false,
      });
    if (upErr) throw upErr;

    // 4) Encolar para OCR
    const { error: insErr } = await supabaseServer
      .from("receipt_queue")
      .insert({
        project_id: projectId,
        line_id: params.lineId,
        customer_name: customerName || null,
        caption: caption || null,
        file_path: path,
        status: "pending",
      });
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true, path });
  } catch (e: any) {
    console.error("[incoming route] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}