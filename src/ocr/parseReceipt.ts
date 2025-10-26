// src/ocr/parseReceipt.ts
import sharp from "sharp";
import Tesseract from "tesseract.js";

const RE = {
  // $ 120.000  /  $120,000  /  120.000,00
  AMOUNT: /\$?\s*([0-9]{1,3}([.\s][0-9]{3})+|[0-9]+)(,[0-9]{2})?/g,
  CUIT: /\b(20|23|24|25|26|27|30|33|34)[-.]?\d{8}[-.]?\d\b/g,
  CBU_CVU: /\b\d{22}\b/g,
  OP_NO: /\b(?:N[°º]\s*Operaci[oó]n|N[°º]\s*de\s*operaci[oó]n|Operaci[oó]n)\s*[:#-]?\s*([A-Z0-9]{6,})\b/i,
  REF: /\b(C[oó]digo\s+de\s+identificaci[oó]n|Referencia)\s*[:#-]?\s*([A-Z0-9]{6,})\b/i,
  DATE: /\b(\d{1,2}\s+de\s+\w+\s+de\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})\b/i,
};

const BANK_TOKENS = [
  "Mercado Pago",
  "MercadoPago",
  "Ualá",
  "Uala",
  "BBVA",
  "Galicia",
  "Santander",
  "Macro",
  "Provincia",
  "HSBC",
  "ICBC",
  "Brubank",
  "Rebanking",
  "Naranja X",
];

function normalizeAmountMatch(s: string) {
  // "120.000,00" -> 120000 ; "120,000" -> 120000 ; "120000" -> 120000
  let clean = s.replace(/[^\d,\.]/g, "");
  // si tiene coma y punto, asumimos formato ES: 120.000,50
  if (clean.includes(".") && clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.includes(",")) {
    // si solo coma, puede ser decimal (poco común en AR para recibos)
    clean = clean.replace(",", ".");
  }
  const n = Number(clean);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export type ParsedReceipt = {
  amount?: number | null;
  operation_no?: string | null;
  reference?: string | null;

  origin_name?: string | null;
  origin_cuit?: string | null;
  origin_account?: string | null;
  origin_bank?: string | null;

  dest_name?: string | null;
  dest_cuit?: string | null;
  dest_account?: string | null;
  dest_bank?: string | null;

  rawText: string;
};

export async function ocrAndParse(buffer: Buffer): Promise<ParsedReceipt> {
  // 1) pre-process: escala + B/W
  const pre = await sharp(buffer)
    .rotate()
    .resize(1600, null, { withoutEnlargement: true })
    .grayscale()
    .normalise()
    .toBuffer();

  // 2) OCR (español)
  const { data } = await Tesseract.recognize(pre, "spa", {
    tessedit_pageseg_mode: 6,
  });

  const text = (data?.text || "").replace(/\s+\n/g, "\n").trim();

  // 3) parsing
  // monto: tomamos el mayor "candidato" encontrado en el comprobante
  let amount: number | null = null;
  const allAmounts = Array.from(text.matchAll(RE.AMOUNT)).map((m) =>
    normalizeAmountMatch(m[0])
  ).filter(Boolean) as number[];

  if (allAmounts.length) {
    amount = allAmounts.sort((a, b) => b - a)[0] ?? null;
  }

  const op = text.match(RE.OP_NO);
  const ref = text.match(RE.REF);

  const cuits = Array.from(text.matchAll(RE.CUIT)).map((m) => m[0]);
  const cuentas = Array.from(text.matchAll(RE.CBU_CVU)).map((m) => m[0]);

  // Heurística bancos
  const bankFound = BANK_TOKENS.find((b) => text.toLowerCase().includes(b.toLowerCase())) || null;

  // Heurística nombres (líneas cerca de “De” / “Para”)
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const idxDe = lines.findIndex((l) => /^de\b/i.test(l));
  const idxPara = lines.findIndex((l) => /^(para|destino)\b/i.test(l));

  const origin_name =
    idxDe >= 0 ? (lines[idxDe + 1]?.replace(/CUIT|C.U.I.T|CVU|CBU.*/i, "").trim() || null) : null;
  const dest_name =
    idxPara >= 0 ? (lines[idxPara + 1]?.replace(/CUIT|C.U.I.T|CVU|CBU.*/i, "").trim() || null) : null;

  // Asignación simple de CUIT/CVU (si hay dos, primero para origen, segundo para destino)
  const origin_cuit = cuits[0] || null;
  const dest_cuit = cuits[1] || null;

  const origin_account = cuentas[0] || null;
  const dest_account = cuentas[1] || null;

  return {
    amount,
    operation_no: op?.[1] || null,
    reference: ref?.[2] || null,

    origin_name,
    origin_cuit,
    origin_account,
    origin_bank: bankFound,

    dest_name,
    dest_cuit,
    dest_account,
    dest_bank: bankFound, // muchos comprobantes repiten el mismo "banco" en ambas secciones

    rawText: text,
  };
}