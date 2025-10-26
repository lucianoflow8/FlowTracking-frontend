// src/handlers/onImageReceipt.ts
import { createClient } from "@supabase/supabase-js";
import { ocrAndParse } from "../ocr/parseReceipt";

// ⚠️ Usar SERVICE ROLE para poder actualizar sin RLS
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type InsertedRow = {
  id: number;
  project_id: string;
  contact: string;
  amount?: number | null;
  file_url?: string | null;
  file_mime?: string | null;
};

export async function onImageReceipt(row: InsertedRow) {
  try {
    if (!row.file_url) return;

    // Traer binario del comprobante
    const resp = await fetch(row.file_url);
    if (!resp.ok) throw new Error(`No se pudo descargar: ${row.file_url}`);
    const buf = Buffer.from(await resp.arrayBuffer());

    // OCR + parse
    const parsed = await ocrAndParse(buf);

    // por seguridad, conservamos el monto mayor
    const finalAmount =
      Math.max(parsed.amount ?? 0, Number(row.amount ?? 0)) ||
      parsed.amount ||
      row.amount ||
      null;

    // UPDATE en analytics_conversions
    const { error } = await sb
      .from("analytics_conversions")
      .update({
        amount: finalAmount,
        operation_no: parsed.operation_no,
        reference: parsed.reference,
        origin_name: parsed.origin_name,
        origin_cuit: parsed.origin_cuit,
        origin_account: parsed.origin_account,
        origin_bank: parsed.origin_bank,
        dest_name: parsed.dest_name,
        dest_cuit: parsed.dest_cuit,
        dest_account: parsed.dest_account,
        dest_bank: parsed.dest_bank,
      })
      .eq("id", row.id);

    if (error) {
      console.error("UPDATE analytics_conversions error:", error);
    } else {
      console.log("✅ Fila actualizada con OCR:", row.id, parsed);
    }
  } catch (e) {
    console.error("onImageReceipt error:", e);
  }
}