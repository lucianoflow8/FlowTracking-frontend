"use client";

import { useMemo } from "react";
import { renderTemplatePreview } from "@/lib/pageTemplates";

/**
 * Renderiza el contenido público de una landing.
 * - Usa renderTemplatePreview(templateId, content) (sin drag).
 * - Si el template no existe o falla, muestra un fallback legible.
 */
export default function PageClient({ templateId, content }) {
  // Normalizá el contenido a objeto
  const data = useMemo(() => {
    if (!content) return {};
    if (typeof content === "string") {
      try { return JSON.parse(content); } catch { return {}; }
    }
    return content;
  }, [content]);

  // Intento de render con tus templates
  let rendered = null;
  try {
    rendered = renderTemplatePreview({
      templateId,
      content: data,
      draggable: false,
    });
  } catch (e) {
    // Silenciar para no romper render público
    console.warn("renderTemplatePreview error:", e);
  }

  // Si el template devolvió null/undefined, mostramos un fallback
  if (!rendered) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <div className="text-white/90 font-medium">
          No hay renderer para el template <code>{templateId}</code> o el contenido está vacío.
        </div>
        <div className="text-xs text-white/60">
          Mostrando contenido en crudo como fallback:
        </div>
        <pre className="whitespace-pre-wrap text-xs text-white/70 bg-black/40 p-3 rounded-md overflow-auto">
{JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return <>{rendered}</>;
}