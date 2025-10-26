// lib/pageTemplates.js

/** Utils */
function pct(n) { return `${n}%`; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function canvasStyle(canvas) {
  return {
    backgroundColor: canvas?.bgColor || "#0b0b0d",
    backgroundImage: canvas?.bgImage ? `url(${canvas.bgImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

/** ===========================
 *  TEMPLATES
 *  =========================== */
export const TEMPLATES = [
  {
    id: "online-apps",
    name: "Online Apps",
    description: "Canvas libre con fondo, textos, imágenes y botón WhatsApp.",
    defaults: {
      canvasRatio: "16:9",
      bgImage: "",
      bgColor: "#0b0b0d",
      layers: [
        {
          id: "title-1",
          type: "text",
          text: "Tu Título Aquí",
          x: 50,
          y: 35,
          w: 70,
          fontSize: 6,
          color: "#ffd84d",
          align: "center",
          strokeColor: "rgba(0,0,0,0.6)",
          strokeWidth: 2,
        },
        {
          id: "wa-btn-1",
          type: "whatsapp",
          text: "Contactar por WhatsApp",
          x: 50,
          y: 65,
          w: 60,
          style: { radius: 9999 },
          url: "",
        },
      ],
    },
  },
];

/** Tarjeta para selector de plantilla (se usa en el editor – cliente) */
export function TemplateCard({ tpl, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
        active ? "border-emerald-500/60 bg-emerald-500/10"
               : "border-white/15 hover:bg-white/5"
      }`}
    >
      <div className="text-sm font-medium">{tpl.name}</div>
      <div className="text-[11px] text-white/50">{tpl.description}</div>
    </button>
  );
}

/* ====== EDITOR PREVIEW (aspect ratio fijo) ====== */
function ratioClass(ratio) {
  if (ratio === "9:16") return "aspect-[9/16]";
  if (ratio === "1:1")  return "aspect-square";
  return "aspect-video"; // 16:9
}

export function renderTemplatePreview({
  templateId,
  content,
  draggable = false,
  onPick,
  onDragStart,
  setContainerEl,
}) {
  const tpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const c = { ...(tpl.defaults || {}), ...(content || {}) };

  const ratio = c.canvasRatio || "16:9";
  const canvas = { bgImage: c.bgImage, bgColor: c.bgColor };

  const handleDown = (e, id) => {
    onPick?.(id);
    if (draggable) onDragStart?.(e, id);
  };

  return (
    <div className={`relative w-full ${ratioClass(ratio)}`} ref={setContainerEl}>
      <div className="absolute inset-0 rounded-xl overflow-hidden" style={canvasStyle(canvas)}>
        {(c.layers || []).map((layer, idx) => {
          const baseStyle = {
            position: "absolute",
            left: `${Math.max(0, Math.min(100, (layer.x ?? 0) - (layer.w ?? 30) / 2))}%`,
            top:  `${Math.max(0, Math.min(100, layer.y ?? 0))}%`,
            width: `${Math.max(0, Math.min(100, layer.w ?? 30))}%`,
            cursor: draggable ? "move" : "default",
            userSelect: "none",
            transform: "translateY(-50%)",
            zIndex: 10 + idx,
          };

          if (layer.type === "text") {
            return (
              <div key={layer.id} style={baseStyle} className="px-1"
                   onMouseDown={(e) => handleDown(e, layer.id)}
                   onTouchStart={(e) => handleDown(e, layer.id)}>
                <div
                  className="whitespace-pre-line"
                  style={{
                    color: layer.color || "#fff",
                    fontSize: layer.fontSize || 28,
                    textAlign: layer.align || "left",
                    WebkitTextStroke:
                      (layer.strokeWidth || 0) > 0
                        ? `${layer.strokeWidth}px ${layer.strokeColor || "#000"}`
                        : undefined,
                    textShadow:
                      (layer.strokeWidth || 0) > 0 ? "none" : "0 2px 12px rgba(0,0,0,.45)",
                  }}
                >
                  {layer.text || ""}
                </div>
              </div>
            );
          }

          if (layer.type === "image") {
            return (
              <div key={layer.id} style={baseStyle} className="overflow-hidden"
                   onMouseDown={(e) => handleDown(e, layer.id)}
                   onTouchStart={(e) => handleDown(e, layer.id)}>
                <img
                  src={layer.src}
                  alt={layer.alt || "img"}
                  className="w-full h-auto block"
                  style={{
                    borderRadius: layer.radius || 0,
                    boxShadow: layer.shadow ? "0 8px 30px rgba(0,0,0,.35)" : "none",
                    pointerEvents: "none",
                  }}
                />
              </div>
            );
          }

          if (layer.type === "whatsapp") {
            const radius = layer.style?.radius ?? 9999;
            return (
              <div key={layer.id} style={{ ...baseStyle, zIndex: 999 }}
                   onMouseDown={(e) => handleDown(e, layer.id)}
                   onTouchStart={(e) => handleDown(e, layer.id)}>
                <div
                  className="wa-preview"
                  style={{
                    height: 52,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: "0 28px",
                    borderRadius: radius,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "clamp(14px, 3.2vw, 18px)",
                    background: "linear-gradient(90deg, #40e27a 0%, #16a34a 100%)",
                    border: "1px solid rgba(34,197,94,.6)",
                    boxShadow: "0 8px 22px rgba(34,197,94,.35), inset 0 -2px 0 rgba(0,0,0,.12)",
                  }}
                >
                  {/* Ícono blanco y más grande */}
                  <svg width="26" height="26" viewBox="0 0 32 32" fill="#fff" aria-hidden="true"
                       style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,.5))" }}>
                    <path d="M19.11 17.41c-.28-.14-1.64-.81-1.89-.9s-.44-.14-.62.14s-.71.9-.87 1.08s-.32.21-.59.07a9.77 9.77 0 0 1-2.87-1.77a10.55 10.55 0 0 1-1.95-2.44c-.2-.34 0-.52.15-.66s.34-.38.49-.59s.2-.35.3-.59s.05-.45-.02-.63s-.62-1.48-.85-2.03s-.45-.48-.62-.49h-.52a1 1 0 0 0-.73.35a3.05 3.05 0 0 0-.97 2.26a5.31 5.31 0 0 0 1.11 2.83a12.17 12.17 0 0 0 4.64 4.53a15.93 15.93 0 0 0 1.6.74a3.86 3.86 0 0 0 1.78.28a3.1 3.1 0 0 0 2.07-1.45a2.54 2.54 0 0 0 .17-1.46z" />
                  </svg>
                  {layer.text || "CREAR USUARIO"}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

/* ====== RENDER PÚBLICO (SSR, sin handlers) ====== */
export function renderTemplatePublicFull({ templateId, content, meta }) {
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const c = { ...(tpl.defaults || {}), ...(content || {}) };
  const canvas = { bgImage: c.bgImage, bgColor: c.bgColor };

  const merged = {
    ...c,
    slug: meta?.slug || content?.slug || null,
  };

  const wrapperStyle = {
    ...canvasStyle(canvas),
    width: "100%",
    minHeight: "100vh",
    position: "relative",
  };

  return (
    <div style={wrapperStyle}>
      {(c.layers || []).map((layer, idx) => {
        const leftPct = (layer.x ?? 50) - (layer.w ?? 30) / 2;
        const baseStyle = {
          position: "absolute",
          left: `${Math.max(0, Math.min(100, leftPct))}%`,
          top:  `${Math.max(0, Math.min(100, layer.y ?? 0))}%`,
          width: `${Math.max(0, Math.min(100, layer.w ?? 30))}%`,
          transform: "translateY(-50%)",
          userSelect: "none",
          zIndex: 10 + idx,
        };

        if (layer.type === "text") {
          const vwSize = layer.fontSize ?? 5;
          return (
            <div key={layer.id} style={baseStyle} className="px-2">
              <div
                className="whitespace-pre-line"
                style={{
                  color: layer.color || "#fff",
                  fontWeight: 700,
                  textAlign: layer.align || "center",
                  fontSize: `clamp(16px, ${vwSize}vw, 72px)`,
                  lineHeight: 1.1,
                  textShadow: "0 2px 12px rgba(0,0,0,.45)",
                }}
              >
                {layer.text || ""}
              </div>
            </div>
          );
        }

        if (layer.type === "whatsapp") {
          const radius = layer.style?.radius ?? 9999;
          const slug = merged.slug || meta?.slug || content?.slug || "";

          return (
            <div key={layer.id} style={{ ...baseStyle, zIndex: 999 }}>
              {/* Misma pestaña, sin exponer el link final en el DOM */}
              <form method="GET" action="/api/wa" style={{ margin: 0 }}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="text" value="Hola! Mi código de descuento es:" />
                <button
                  type="submit"
                  className="wa-cta"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: "16px 32px",
                    fontWeight: 700,
                    fontSize: "clamp(15px, 3.6vw, 20px)",
                    color: "#ffffff",
                    background: "linear-gradient(90deg, rgb(59,225,106) 0%, rgb(20,170,85) 100%)",
                    border: "1px solid rgba(34,197,94,.6)",
                    borderRadius: radius,
                    boxShadow: "0 8px 22px rgba(34,197,94,.4), inset 0 -2px 0 rgba(0,0,0,.15)",
                    cursor: "pointer",
                    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
                  }}
                >
                  {/* Ícono blanco grande */}
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="#fff" aria-hidden="true"
                       style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,.6))", flexShrink: 0 }}>
                    <path d="M19.11 17.41c-.28-.14-1.64-.81-1.89-.9s-.44-.14-.62.14s-.71.9-.87 1.08s-.32.21-.59.07a9.77 9.77 0 0 1-2.87-1.77a10.55 10.55 0 0 1-1.95-2.44c-.2-.34 0-.52.15-.66s.34-.38.49-.59s.2-.35.3-.59s.05-.45-.02-.63s-.62-1.48-.85-2.03s-.45-.48-.62-.49h-.52a1 1 0 0 0-.73.35a3.05 3.05 0 0 0-.97 2.26a5.31 5.31 0 0 0 1.11 2.83a12.17 12.17 0 0 0 4.64 4.53a15.93 15.93 0 0 0 1.6.74a3.86 3.86 0 0 0 1.78.28a3.1 3.1 0 0 0 2.07-1.45a2.54 2.54 0 0 0 .17-1.46z" />
                  </svg>
                  {layer.text || "CREAR USUARIO"}
                </button>
              </form>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}