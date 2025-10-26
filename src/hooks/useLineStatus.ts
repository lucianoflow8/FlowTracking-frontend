import { useEffect, useRef, useState } from 'react';

export type LineStatus =
  | 'not_initialized'
  | 'initializing'
  | 'loading'
  | 'qr'
  | 'authenticated'
  | 'ready'          // backend usa "ready" (equiv. conectada)
  | 'connected'      // por si en DB figura así
  | 'disconnected'
  | 'error';

type ServerEvent = { status: string; phone?: string | null; qr?: string | null };

export function useLineStatus(apiBase: string, lineId: string) {
  const [status, setStatus] = useState<LineStatus>('initializing');
  const [phone, setPhone] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!apiBase || !lineId) return;

    const url = `${apiBase.replace(/\/$/, '')}/lines/${encodeURIComponent(lineId)}/events`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data: ServerEvent = JSON.parse(ev.data);
        setStatus(mapStatusToFront(data.status));
        setPhone(data.phone ?? null);
      } catch {
        /* noop */
      }
    };

    es.onerror = () => {
      // reintento simple si se corta la conexión SSE
      es.close();
      setTimeout(() => {
        if (!esRef.current || esRef.current.readyState === 2) {
          esRef.current = new EventSource(url);
        }
      }, 1500);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [apiBase, lineId]);

  return { status, phone };
}

function mapStatusToFront(s: string): LineStatus {
  if (s === 'connected') return 'ready';
  return (s as LineStatus) ?? 'initializing';
}
