'use client';
import React, { useEffect, useState } from 'react';

type Props = {
  apiBase: string;        // ej: "http://localhost:4000"
  lineId: string;         // ej: "linea22"
  onClose: () => void;
};

type QrResponse = {
  status: 'ready' | 'connected' | 'qr' | 'initializing' | 'loading' | 'disconnected' | 'error' | string;
  phone?: string | null;
  qr?: string | null;     // dataURL
  error?: string;
};

export default function GenerateQrModal({ apiBase, lineId, onClose }: Props) {
  const [img, setImg] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('initializing');
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchQr() {
    setLoading(true);
    setErr(null);
    setImg(null);
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/lines/${encodeURIComponent(lineId)}/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const js: QrResponse = await res.json();

      setStatus(js.status || 'initializing');
      if ('phone' in js && js.phone) setPhone(js.phone || null);
      if (js.qr) setImg(js.qr);

      if (!res.ok) setErr(js.error || 'qr_failed');
    } catch (e: any) {
      setErr(e?.message || 'network_error');
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial
  useEffect(() => {
    fetchQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connected = status === 'ready' || status === 'connected';

  return (
    <div style={backdrop}>
      <div style={card}>
        <div style={header}>
          <h3 style={{ margin: 0 }}>Conectar WhatsApp</h3>
          <button onClick={onClose} style={closeBtn} aria-label="Cerrar">✕</button>
        </div>

        <ol style={steps}>
          <li>En tu teléfono abrí <b>WhatsApp</b></li>
          <li>Entrá a <b>Dispositivos vinculados</b></li>
          <li>Tocá <b>Vincular dispositivo</b></li>
          <li>Escaneá el QR de abajo</li>
        </ol>

        <div style={qrBox}>
          {connected ? (
            <div style={connectedBox}>
              <div>✓ Conectado{phone ? ` (${phone})` : ''}</div>
            </div>
          ) : img ? (
            <img src={img} width={260} height={260} alt="QR" style={{ borderRadius: 12 }} />
          ) : (
            <div>Generando QR…</div>
          )}
        </div>

        {err && <div style={errorBox}>Error: {err}</div>}

        <div style={footer}>
          <span style={muted}>Línea: <b>{lineId}</b> · Estado: {status}{phone ? ` · ${phone}` : ''}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`${apiBase.replace(/\/$/, '')}/qr?line_id=${encodeURIComponent(lineId)}`}
              target="_blank" rel="noreferrer"
              style={secondaryBtn}
            >
              Abrir página de QR
            </a>
            {!connected && (
              <button onClick={fetchQr} disabled={loading} style={primaryBtn}>
                {loading ? 'Generando…' : 'Volver a generar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======= estilos inline minimalistas ======= */
const backdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
  display: 'grid', placeItems: 'center', zIndex: 1000,
};

const card: React.CSSProperties = {
  width: 520, background: '#0f1115', color: '#eee',
  border: '1px solid #222', borderRadius: 16, padding: 20,
  boxShadow: '0 10px 30px rgba(0,0,0,.4)', fontFamily: 'system-ui, sans-serif'
};

const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8
};

const closeBtn: React.CSSProperties = {
  border: 0, background: 'transparent', color: '#aaa', fontSize: 18, cursor: 'pointer'
};

const steps: React.CSSProperties = {
  margin: '0 0 12px', paddingLeft: 18, opacity: .85, lineHeight: 1.4
};

const qrBox: React.CSSProperties = {
  display: 'grid', placeItems: 'center', height: 300,
  border: '1px dashed #333', borderRadius: 12, marginBottom: 12
};

const connectedBox: React.CSSProperties = {
  color: '#16a34a', fontSize: 18, fontWeight: 600
};

const errorBox: React.CSSProperties = {
  color: '#ef4444', background: '#ef444422', border: '1px solid #ef444455',
  borderRadius: 8, padding: '8px 10px', marginBottom: 8, fontSize: 13
};

const footer: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
};

const muted: React.CSSProperties = { opacity: .65, fontSize: 12 };

const primaryBtn: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: 0, cursor: 'pointer',
  background: '#2563eb', color: 'white', fontWeight: 600
};

const secondaryBtn: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: '1px solid #2a2a2a',
  background: '#17181c', color: '#ddd', textDecoration: 'none'
};
