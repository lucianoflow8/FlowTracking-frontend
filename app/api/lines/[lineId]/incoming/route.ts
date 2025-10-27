// app/api/lines/[lineId]/incoming/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // evita pre-render y “collect page data” en build

const BUCKET = 'receipts';

export async function POST(
  req: NextRequest,
  { params }: { params: { lineId: string } }
) {
  try {
    const supabase = getSupabaseServer();

    // projectId por query (?projectId=...)
    const projectId = req.nextUrl.searchParams.get('projectId') || '';
    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: 'Missing projectId' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { mediaUrl, fileName, mime, customerName, caption } = body || {};

    if (!mediaUrl) {
      // Nada que procesar; respondemos 200 para no reintentar
      return NextResponse.json({ ok: true, skipped: 'no mediaUrl' });
    }

    // descarga del archivo
    const res = await fetch(mediaUrl);
    if (!res.ok) throw new Error('No se pudo descargar el archivo');
    const arrayBuf = await res.arrayBuffer();

    const ext = (mime?.split('/')[1] || 'jpg').toLowerCase();
    const safeName = fileName?.replace(/[^\w.\-]/g, '') || crypto.randomUUID();
    const path = `receipts/${projectId}/${params.lineId}/${Date.now()}-${safeName}.${ext}`;

    // subida a Storage
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, Buffer.from(arrayBuf), {
        contentType: mime || 'image/jpeg',
        upsert: false,
      });
    if (upErr) throw upErr;

    // Encolar para OCR
    const { error: insErr } = await supabase.from('receipt_queue').insert({
      project_id: projectId,
      line_id: params.lineId,
      customer_name: customerName || null,
      caption: caption || null,
      file_path: path,
      status: 'pending',
    });
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true, file_path: path });
  } catch (e: any) {
    console.error('incoming error:', e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}