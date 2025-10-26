// frontend/app/components/ComposerTools.jsx
"use client";
import { useMemo } from "react";

const rid = () => Math.random().toString(36).slice(2, 9);

export default function ComposerTools({ value, onChange, selectedId, onSelect }) {
  const layers = value.layers || [];
  const selected = useMemo(
    () => layers.find((l) => l.id === selectedId) || null,
    [layers, selectedId]
  );

  const pushLayer = (l) => onChange({ ...value, layers: [...layers, l] });

  const addText = () =>
    pushLayer({
      id: `txt-${rid()}`,
      type: "text",
      text: "Nuevo texto",
      x: 50,
      y: 40,
      w: 40,
      fontSize: 28,
      color: "#ffffff",
      align: "center",
      stroke: { width: 0, color: "#000" },
    });

  const addImage = async () => {
    const src = prompt("URL de la imagen:");
    if (!src) return;
    pushLayer({
      id: `img-${rid()}`,
      type: "image",
      src,
      x: 50,
      y: 50,
      w: 40,
      radius: 0,
    });
  };

  const addLogo = async () => {
    const src = prompt("URL del logo (PNG con fondo transparente ideal):");
    if (!src) return;
    pushLayer({
      id: `logo-${rid()}`,
      type: "image",
      src,
      x: 10,
      y: 10,
      w: 15,
      radius: 0,
    });
  };

  const addWhatsApp = () =>
    pushLayer({
      id: `wa-${rid()}`,
      type: "whatsapp",
      text: "CREAR USUARIO",
      x: 50,
      y: 75,
      w: 40,
      style: { radius: 12, bg: "#34d399", txt: "#0b0b0d", glow: true },
    });

  const removeSelected = () => {
    if (!selected) return;
    if (!confirm("¿Eliminar capa seleccionada?")) return;
    onChange({ ...value, layers: layers.filter((l) => l.id !== selected.id) });
    onSelect?.(null);
  };

  const set = (patch) =>
    onChange({
      ...value,
      layers: layers.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)),
    });

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Agregar</div>
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10" onClick={addText}>
          Texto
        </button>
        <button className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10" onClick={addImage}>
          Imagen
        </button>
        <button className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10" onClick={addLogo}>
          Logo
        </button>
        <button className="rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10" onClick={addWhatsApp}>
          Botón WhatsApp
        </button>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="text-sm font-semibold mb-2">Canvas</div>
        <div className="grid grid-cols-3 gap-2">
          {["16:9", "9:16", "1:1"].map((r) => (
            <button
              key={r}
              className={`rounded-md px-2 py-1 text-xs border ${
                value.canvas?.ratio === r ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/15"
              }`}
              onClick={() => onChange({ ...value, canvas: { ...(value.canvas || {}), ratio: r } })}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs">
          Fondo (URL):{" "}
          <input
            className="mt-1 w-full rounded border border-white/15 bg-white/5 px-2 py-1"
            placeholder="https://…"
            value={value.canvas?.bgImage || ""}
            onChange={(e) =>
              onChange({
                ...value,
                canvas: { ...(value.canvas || {}), bgImage: e.target.value },
              })
            }
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="text-sm font-semibold mb-2">Seleccionado</div>
        {!selected && <div className="text-xs text-white/60">No hay capa seleccionada.</div>}
        {selected && (
          <div className="space-y-2 text-xs">
            <div>ID: {selected.id}</div>
            {selected.type === "text" && (
              <>
                <label className="block">Texto</label>
                <textarea
                  className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                  rows={3}
                  value={selected.text || ""}
                  onChange={(e) => set({ text: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    Tamaño
                    <input
                      type="number"
                      className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                      value={selected.fontSize || 28}
                      onChange={(e) => set({ fontSize: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    Color
                    <input
                      type="color"
                      className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                      value={selected.color || "#ffffff"}
                      onChange={(e) => set({ color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {["left", "center", "right"].map((al) => (
                    <button
                      key={al}
                      className={`rounded-md px-2 py-1 border ${
                        selected.align === al ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/15"
                      }`}
                      onClick={() => set({ align: al })}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </>
            )}
            {selected.type === "image" && (
              <>
                <label className="block">URL</label>
                <input
                  className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                  value={selected.src || ""}
                  onChange={(e) => set({ src: e.target.value })}
                />
                <label className="block">Radio</label>
                <input
                  type="number"
                  className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                  value={selected.radius || 0}
                  onChange={(e) => set({ radius: Number(e.target.value) })}
                />
              </>
            )}
            {selected.type === "whatsapp" && (
              <>
                <label className="block">Texto del botón</label>
                <input
                  className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                  value={selected.text || ""}
                  onChange={(e) => set({ text: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    Radio
                    <input
                      type="number"
                      className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                      value={selected.style?.radius ?? 12}
                      onChange={(e) =>
                        set({ style: { ...(selected.style || {}), radius: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div>
                    BG
                    <input
                      type="color"
                      className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                      value={selected.style?.bg || "#34d399"}
                      onChange={(e) => set({ style: { ...(selected.style || {}), bg: e.target.value } })}
                    />
                  </div>
                  <div>
                    Texto
                    <input
                      type="color"
                      className="w-full rounded border border-white/15 bg-white/5 px-2 py-1"
                      value={selected.style?.txt || "#0b0b0d"}
                      onChange={(e) => set({ style: { ...(selected.style || {}), txt: e.target.value } })}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              className="mt-2 w-full rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-200 hover:bg-rose-500/15"
              onClick={removeSelected}
            >
              Eliminar capa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}