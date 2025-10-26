import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { to, projectName, token } = await req.json();

    if (!to || !token) {
      return NextResponse.json({ ok: false, error: "to y token requeridos" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${appUrl}/invite/accept?token=${encodeURIComponent(token)}`;

    const html = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#121218;border-radius:16px;color:#fff;padding:32px">
            <tr><td style="font-size:14px;color:#c7ffd9;background:#0f1e17;display:inline-block;padding:6px 10px;border-radius:8px">Convertix</td></tr>
            <tr><td style="height:16px"></td></tr>
            <tr><td style="font-size:28px;font-weight:700">¡Hola!</td></tr>
            <tr><td style="height:8px"></td></tr>
            <tr><td style="font-size:16px;color:#c7c7d1;line-height:1.6">
              Has sido invitado a unirte a <b>${projectName || "un proyecto"}</b> en Convertix.
            </td></tr>
            <tr><td style="height:24px"></td></tr>
            <tr><td align="center">
              <a href="${acceptUrl}" 
                 style="background:#32d583;color:#0b0b0d;text-decoration:none;padding:14px 22px;border-radius:12px;display:inline-block;font-weight:700">
                 Unirme a la organización
              </a>
            </td></tr>
            <tr><td style="height:20px"></td></tr>
            <tr><td style="font-size:12px;color:#9aa0a6">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <span style="word-break:break-all;color:#c7c7d1">${acceptUrl}</span>
            </td></tr>
            <tr><td style="height:12px"></td></tr>
            <tr><td style="font-size:11px;color:#7c7f86">Powered by Convertix</td></tr>
          </table>
        </td></tr>
      </table>
    `;

    const { error } = await resend.emails.send({
      from: process.env.INVITES_FROM_EMAIL || "invites@your-domain.com",
      to,
      subject: `Te invitaron a colaborar ${projectName ? "en " + projectName : ""}`,
      html,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "send_error" }, { status: 500 });
  }
}