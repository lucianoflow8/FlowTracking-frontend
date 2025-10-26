// app/api/lines/[id]/qr/route.js
import QR from "qrcode";

// Si tenés un backend que expone el QR real, seteá esto en .env.local
// WA_QR_ENDPOINT='http://localhost:4000/api/qr?lineId='
// y la ruta va a hacer proxy a ese servicio.
const UPSTREAM = process.env.WA_QR_ENDPOINT || "";

export async function GET(_req, { params }) {
  const { id } = params;

  // 1) Si hay backend de WhatsApp configurado, proxy directo
  if (UPSTREAM) {
    try {
      const upstreamRes = await fetch(`${UPSTREAM}${encodeURIComponent(id)}`, {
        // si tu upstream requiere headers, agregalos aquí
        // headers: { Authorization: `Bearer ${process.env.WA_API_KEY}` }
      });

      if (!upstreamRes.ok) {
        const txt = await upstreamRes.text();
        return new Response(`Upstream error: ${txt}`, { status: 502 });
      }

      // Pasar tal cual el stream de la imagen
      const ct = upstreamRes.headers.get("content-type") || "image/png";
      return new Response(upstreamRes.body, {
        status: 200,
        headers: {
          "Content-Type": ct,
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      return new Response(`Proxy failed: ${e.message}`, { status: 502 });
    }
  }

  // 2) Sin backend: generamos un QR local (placeholder) para validar el flujo
  // Codificamos un payload simple que identifique la línea
  const payload = JSON.stringify({ line: id, t: Date.now() });

  try {
    const dataUrl = await QR.toDataURL(payload, {
      width: 512,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const base64 = dataUrl.split(",")[1];
    return new Response(Buffer.from(base64, "base64"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(`QR error: ${e.message}`, { status: 500 });
  }
}