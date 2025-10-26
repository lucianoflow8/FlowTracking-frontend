'use client';
import React from 'react';
import { useLineStatus } from '@/hooks/useLineStatus';

interface Props {
  apiBase: string;
  lineId: string;
}

export const LineStatusBadge: React.FC<Props> = ({ apiBase, lineId }) => {
  const { status, phone } = useLineStatus(apiBase, lineId);

  const { label, color } = mapStatus(status);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        padding: '6px 10px',
        borderRadius: 8,
        fontWeight: 500,
        fontSize: 14,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
      {phone && (
        <span style={{ opacity: 0.6, marginLeft: 6, fontSize: 12 }}>
          ({phone})
        </span>
      )}
    </div>
  );
};

function mapStatus(status: string) {
  switch (status) {
    case 'ready':
    case 'connected':
      return { label: 'Conectada ✅', color: '#16a34a' };
    case 'qr':
      return { label: 'Esperando QR 📱', color: '#f59e0b' };
    case 'initializing':
    case 'loading':
      return { label: 'Inicializando…', color: '#3b82f6' };
    case 'disconnected':
      return { label: 'Desconectada ❌', color: '#ef4444' };
    default:
      return { label: status || '—', color: '#6b7280' };
  }
}
