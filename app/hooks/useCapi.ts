"use client";

import { useEffect, useCallback } from "react";

type SendOpts = {
  page_id: string;
  event_name: "PageView" | "Lead" | "Purchase" | string;
  external_id?: string;   // tel o email en claro (el API lo hashea)
  value?: number;
  currency?: string;      // p.ej. "ARS"
  source_url?: string;    // opcional (si no, usa referer)
};

export function useCapi(page_id: string) {
  const send = useCallback(async (opts: Omit<SendOpts, "page_id">) => {
    try {
      const res = await fetch("/api/meta/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id, ...opts }),
      });
      // opcional: log suave
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.warn("[CAPI] send fail:", j);
      }
    } catch (e) {
      console.warn("[CAPI] send error:", (e as any)?.message || e);
    }
  }, [page_id]);

  // dispara PageView al montar
  useEffect(() => {
    if (!page_id) return;
    send({ event_name: "PageView" });
  }, [page_id, send]);

  return { send };
}