// frontend/app/components/ComposerCanvas.jsx
"use client";
import { useRef, useState, useEffect } from "react";

/**
 * Canvas con selección y drag.
 * - value: { canvas: {ratio,bgColor,bgImage}, layers: [...] }
 * - onChange(nextValue)
 * - onSelect(id|null)
 * - selectedId (opcional, si querés controlarlo desde afuera)
 */
export default function ComposerCanvas({
  value,
  onChange,
  onSelect,
  selectedId: selectedIdCtrl,
}) {
  const ref = useRef(null);
  const [selectedIdInt, setSelectedIdInt] = useState(null);
  const [drag, setDrag] = useState(null);

  const selectedId = selectedIdCtrl ?? selectedIdInt;
  const setSelectedId = (id) =>
    selectedIdCtrl === undefined ? setSelectedIdInt(id) : onSelect?.(id);

  const layers = value.layers || [];
  const canvas = value.canvas || { ratio: "16:9", bgColor: "#0b0b0d" };

  useEffect(() => {
    // deseleccionar si se borra la capa
    if (selectedId && !layers.find((l) => l.id === selectedId)) {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  const pct = (n) => `${n}%`;

  const startDrag = (e, id) => {
    e.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setDrag({ id, dx: xPct - (layer.x ?? 0), dy: yPct - (layer.y ?? 0) });
    setSelectedId(id);
    onSelect?.(id);
  };

  const onMove = (e) => {
    if (!drag) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const nx = Math.max(0, Math.min(100, xPct - drag.dx));
    const ny = Math.max(0, Math.min(100, yPct - drag.dy));
    onChange({
      ...value,
      layers: layers.map((l) => (l.id === drag.id ? { ...l, x: nx, y: ny } : l)),
    });
  };

  const endDrag = () => setDrag(null);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endDrag);
    };
  });

  const ratioClass =
    canvas.ratio === "9:16"
      ? "aspect-[9/16]"
      : canvas.ratio === "1:1"
      ? "aspect-square"
      : "aspect-video";

  const canvasStyle = {
    backgroundColor: canvas.bgColor || "#0b0b0d",
    backgroundImage: canvas.bgImage ? `url(${canvas.bgImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      ref={ref}
      className={`relative w-full ${ratioClass} rounded-xl overflow-hidden border border-white/10`}
      style={canvasStyle}
      onMouseDown={() => {
        // click fuera: deselecciona
        if (!drag) {
          setSelectedId(null);
          onSelect?.(null);
        }
      }}
    >
      {(layers || []).map((l) => {
        const sel = selectedId === l.id;
        const style = {
          position: "absolute",
          left: pct(l.x ?? 0),
          top: pct(l.y ?? 0),
          width: pct(l.w ?? 30),
          cursor: "move",
        };
        return (
          <div
            key={l.id}
            style={style}
            onMouseDown={(e) => startDrag(e, l.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(l.id);
              onSelect?.(l.id);
            }}
          >
            {sel && (
              <div className="absolute -inset-1 rounded ring-2 ring-emerald-400 pointer-events-none" />
            )}

            {l.type === "text" && (
              <div
                className="px-1 whitespace-pre-line"
                style={{
                  color: l.color || "#fff",
                  fontSize: l.fontSize || 28,
                  textAlign: l.align || "left",
                  WebkitTextStroke: l?.stroke?.width
                    ? `${l.stroke.width}px ${l.stroke.color}`
                    : undefined,
                }}
              >
                {l.text}
              </div>
            )}

            {l.type === "image" && (
              <img
                src={l.src}
                alt={l.alt || "img"}
                className="w-full h-auto block"
                style={{ borderRadius: l.radius || 0, pointerEvents: "none" }}
              />
            )}

            {l.type === "whatsapp" && (
              <div
                className="px-4 py-3 font-semibold text-center shadow whitespace-pre-line"
                style={{
                  background: l.style?.bg || "#39FF14",
                  color: l.style?.txt || "#081c0f",
                  borderRadius: l.style?.radius ?? 12,
                  boxShadow: l.style?.glow ? "0 0 24px rgba(57,255,20,0.6)" : "none",
                  pointerEvents: "none",
                }}
              >
                {l.text || "WhatsApp"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}