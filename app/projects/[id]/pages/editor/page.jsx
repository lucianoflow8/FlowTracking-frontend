// app/projects/[id]/pages/editor/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { TemplateCard, renderTemplatePreview, TEMPLATES } from "@/lib/pageTemplates";

/* ------------------------- helpers ------------------------- */
const mapTemplateParam = (val) => {
  if (!val) return null;
  const v = String(val).toLowerCase();
  if (v === "landing") return "basic-landing";
  if (v === "apps" || v === "online-apps") return "online-apps";
  if (v === "free" || v === "poster" || v === "free-composer") return "free-composer";
  return v;
};

// Subir archivo al bucket "uploads" (carpeta configurable)
async function uploadToSupabase(file, folder = "editor") {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("uploads").getPublicUrl(path);
  return pub.publicUrl;
}

/* ======================= EDITOR ======================= */
export default function PagesEditor() {
  const router = useRouter();
  const { id: projectId } = useParams();
  const sp = useSearchParams();

  const pageId = sp.get("pid");
  const tplParam = sp.get("template") || sp.get("tpl");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState("desktop");

  const [form, setForm] = useState({
    title: "Untitled Page",
    slug: "",
    template: "online-apps",
    pixel_id: "",
    access_token: "",
    test_event_code: "",
    wa_message: "Hola! Mi código de descuento es:",
    content: {},
    published: false,
  });

  // selección / drag
  const [activeElId, setActiveElId] = useState(null);
  const containerElRef = useRef(null);
  const dragRef = useRef({ id: null, startX: 0, startY: 0, startPctX: 0, startPctY: 0 });

  // inputs file
  const bgFileInputRef = useRef(null);
  const addImgFileInputRef = useRef(null);
  const replaceImgFileInputRef = useRef(null);

  /* ---------- init template by query ---------- */
  useEffect(() => {
    if (pageId) return;
    const mapped = mapTemplateParam(tplParam);
    if (mapped) setForm((f) => ({ ...f, template: mapped }));
  }, [pageId, tplParam]);

  /* ---------- load page ---------- */
  useEffect(() => {
    if (!pageId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("pages").select("*").eq("id", pageId).single();
      if (!error && data) {
        setForm({
          title: data.title ?? "Untitled Page",
          slug: data.slug ?? "",
          template: data.template ?? "online-apps",
          // 👇 leer desde columnas fb_*
          pixel_id: data.fb_pixel_id ?? "",
          access_token: data.fb_access_token ?? "",
          test_event_code: data.fb_test_event_code ?? "",
          wa_message: data.wa_message ?? "",
          content: data.content ?? {},
          published: !!data.published,
        });
      }
      setLoading(false);
    })();
  }, [pageId]);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === form.template) ?? TEMPLATES[0],
    [form.template]
  );

  // tratamos online-apps y free-composer como “composer”
  const isComposerTemplate = ["free-composer", "online-apps"].includes(selectedTemplate.id);

  // Mezcla defaults + contenido guardado
  const mergedContent = useMemo(
    () => ({ ...(selectedTemplate?.defaults || {}), ...(form.content || {}) }),
    [form.content, selectedTemplate]
  );

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateContent = (patch) => setForm((f) => ({ ...f, content: { ...f.content, ...patch } }));

  /* ----------------- LAYERS ----------------- */
  const layers = mergedContent.layers || [];

  const setLayers = (next) => {
    const prev = Array.isArray(mergedContent.layers) ? mergedContent.layers : [];
    const value = typeof next === "function" ? next(prev) : next;
    updateContent({ layers: value });
  };

  const addText = () => {
    setLayers((prev) => [
      ...prev,
      {
        id: `txt_${Date.now()}`,
        type: "text",
        text: "Nuevo texto",
        x: 50,
        y: 50,
        w: 60,
        align: "center",
        fontSize: 28,
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 0,
      },
    ]);
  };

  // Subir imagen desde PC (nueva capa)
  const addImageFromPc = () => addImgFileInputRef.current?.click();
  const handleAddNewImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToSupabase(file, "images");
      const newId = `img_${Date.now()}`;
      setLayers((prev) => [
        ...prev,
        { id: newId, type: "image", src: url, x: 50, y: 55, w: 40, radius: 8, shadow: true },
      ]);
      setActiveElId(newId);
    } catch (err) {
      console.error(err);
      alert("No se pudo subir la imagen.");
    } finally {
      e.target.value = "";
    }
  };

  // Reemplazar imagen de la capa seleccionada
  const replaceImageOnActive = () => replaceImgFileInputRef.current?.click();
  const handleReplaceImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeElId) return;
    const el = layers.find((l) => l.id === activeElId);
    if (!el || el.type !== "image") return;
    try {
      const url = await uploadToSupabase(file, "images");
      patchActive({ src: url });
    } catch (err) {
      console.error(err);
      alert("No se pudo subir la imagen.");
    } finally {
      e.target.value = "";
    }
  };

  const addWhatsApp = () =>
    setLayers((prev) => [
      ...prev,
      {
        id: `wa_${Date.now()}`,
        type: "whatsapp",
        text: "Contactar por\nWhatsApp",
        phone: "",
        message: "¡Hola! Quiero más info 👋",
        x: 50,
        y: 80,
        w: 50,
        style: { bg: "#39FF14", txt: "#081c0f", radius: 14, glow: true },
      },
    ]);

  const patchActive = (patch) => {
    if (!activeElId) return;
    setLayers(layers.map((e) => (e.id === activeElId ? { ...e, ...patch } : e)));
  };

  const removeActive = () => {
    if (!activeElId) return;
    setLayers(layers.filter((e) => e.id !== activeElId));
    setActiveElId(null);
  };

  /* ----------------- DRAG ----------------- */
  const setContainerEl = (el) => {
    containerElRef.current = el;
  };
  const onPick = (id) => setActiveElId(id);

  const onDragStart = (e, id) => {
    if (!isComposerTemplate) return;
    const el = layers.find((x) => x.id === id);
    if (!el || !containerElRef.current) return;

    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      id,
      startX: clientX,
      startY: clientY,
      startPctX: el.x ?? 0,
      startPctY: el.y ?? 0,
    };

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
  };

  const onDragMove = (e) => {
    const cont = containerElRef.current;
    if (!cont || dragRef.current.id == null) return;

    const rect = cont.getBoundingClientRect();
    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    if (isTouch) e.preventDefault();

    const dx = ((clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((clientY - dragRef.current.startY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, dragRef.current.startPctX + dx));
    const newY = Math.max(0, Math.min(100, dragRef.current.startPctY + dy));
    const id = dragRef.current.id;

    setLayers(layers.map((el) => (el.id === id ? { ...el, x: newX, y: newY } : el)));
  };

  const onDragEnd = () => {
    dragRef.current.id = null;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("touchend", onDragEnd);
  };

  /* ----------------- FONDO ----------------- */
  const onUploadBgClick = () => bgFileInputRef.current?.click();
  const handleBgSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToSupabase(file, "backgrounds");
      updateContent({ bgImage: url });
    } catch (err) {
      console.error(err);
      alert("No se pudo subir el fondo.");
    } finally {
      e.target.value = "";
    }
  };

  /* ----------------- SAVE / PUBLISH ----------------- */
  const saveDraft = async () => {
    if (!form.slug) {
      alert("Definí una ruta (slug) antes de guardar.");
      return;
    }
    setSaving(true);
    const payload = {
      project_id: projectId,
      title: form.title,
      slug: form.slug.trim(),
      template: form.template,
      // 👇 guardar en columnas fb_*
      fb_pixel_id: form.pixel_id.trim() || null,
      fb_access_token: form.access_token.trim() || null,
      fb_test_event_code: form.test_event_code.trim() || null,
      wa_message: form.wa_message,
      content: { ...mergedContent, ...form.content, layers },
      published: false,
    };
    let resp;
    if (pageId) {
      resp = await supabase.from("pages").update(payload).eq("id", pageId).select("id").single();
    } else {
      resp = await supabase.from("pages").insert(payload).select("id").single();
    }
    if (resp.error) {
      console.error(resp.error);
      alert("No se pudo guardar.");
    } else {
      router.replace(`/projects/${projectId}/pages/editor?pid=${resp.data.id}`);
    }
    setSaving(false);
  };

  const publish = async () => {
    if (!pageId) await saveDraft();
    if (!form.slug) {
      alert("Definí una ruta (slug) antes de publicar.");
      return;
    }
    const { error } = await supabase
      .from("pages")
      .update({ published: true })
      .eq("id", pageId || "")
      .select("id")
      .single();
    if (error) {
      console.error(error);
      alert("No se pudo publicar.");
      return;
    }
    alert("¡Publicado!");
  };

  /* ----------------- UI ----------------- */
  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar izq */}
      <aside className="w-72 shrink-0 border-r border-white/10 bg-black/30 p-4 space-y-3">
        <div className="text-xs font-semibold uppercase text-white/50 mb-2">
          Plantilla seleccionada
        </div>
        <TemplateCard tpl={selectedTemplate} active onSelect={() => {}} />
        <hr className="my-4 border-white/10" />
        <button
          onClick={() => router.push(`/projects/${projectId}/pages`)}
          className="w-full rounded-md border border-white/15 py-2 text-sm hover:bg-white/5"
        >
          ← Volver al listado
        </button>

        {isComposerTemplate && (
          <>
            <hr className="my-4 border-white/10" />
            <div className="text-xs font-semibold uppercase text-white/50">
              Elementos
            </div>
            <div className="grid gap-2 mt-2">
              <button onClick={addText} className="rounded-md border border-white/15 py-1.5 text-sm hover:bg-white/5">
                + Texto
              </button>

              {/* Imagen desde PC (nueva capa) */}
              <button onClick={addImageFromPc} className="rounded-md border border-white/15 py-1.5 text-sm hover:bg-white/5">
                📁 Subir imagen
              </button>
              <input
                ref={addImgFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAddNewImageSelected}
                className="hidden"
              />

              <button onClick={addWhatsApp} className="rounded-md border border-white/15 py-1.5 text-sm hover:bg-white/5">
                + Botón WhatsApp
              </button>
            </div>

            {layers.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="text-[11px] text-white/40">Seleccionar:</div>
                <select
                  value={activeElId || ""}
                  onChange={(e) => setActiveElId(e.target.value || null)}
                  className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                >
                  <option value="">(ninguno)</option>
                  {layers.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.type} — {e.id}
                    </option>
                  ))}
                </select>
                {activeElId && (
                  <button
                    onClick={removeActive}
                    className="w-full rounded-md border border-red-400/40 text-red-300 py-1.5 text-sm hover:bg-red-400/10"
                  >
                    Eliminar seleccionado
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </aside>

      {/* Preview */}
      <section className="flex-1 grid place-items-center bg-[#0b0b0d] overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <button
            className={`rounded-md px-2 py-1 text-xs border ${viewport==="desktop"?"border-emerald-400 text-emerald-300":"border-white/20 text-white/60"}`}
            onClick={()=>setViewport("desktop")}
          >
            🖥 Desktop
          </button>
          <button
            className={`rounded-md px-2 py-1 text-xs border ${viewport==="mobile"?"border-emerald-400 text-emerald-300":"border-white/20 text-white/60"}`}
            onClick={()=>setViewport("mobile")}
          >
            📱 Mobile
          </button>
        </div>

        <div
          className="rounded-xl border border-white/10 bg-[#0f0f14] p-6"
          style={{ width: viewport === "mobile" ? 420 : 920, maxWidth: "92vw" }}
        >
          {loading ? (
            <div className="p-10 text-center text-white/60">Cargando…</div>
          ) : (
            renderTemplatePreview({
              templateId: selectedTemplate.id,
              content: { ...mergedContent, layers },
              draggable: isComposerTemplate,
              onPick,
              onDragStart,
              setContainerEl,
            })
          )}
        </div>
      </section>

      {/* Panel derecho */}
      <aside className="w-[360px] shrink-0 border-l border-white/10 bg-black/30 p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Configuración</div>
          <div className="space-x-2">
            <button
              onClick={saveDraft}
              disabled={saving}
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={publish}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-black hover:bg-emerald-500"
            >
              Publicar
            </button>
          </div>
        </div>

        {/* Campos base */}
        <div className="space-y-2">
          <label className="text-xs text-white/60">Título</label>
          <input
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/60">Ruta (slug)</label>
          <input
            placeholder="ej: promo-50"
            value={form.slug}
            onChange={(e) => update({ slug: e.target.value.replace(/\s+/g, "-").toLowerCase() })}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
          />
          <div className="text-[11px] text-white/40">URL pública: <code>/p/{form.slug || "…"}</code></div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/60">ID de Píxel (Meta)</label>
          <input
            value={form.pixel_id}
            onChange={(e) => update({ pixel_id: e.target.value })}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/60">Token de Acceso (Meta)</label>
          <input
            value={form.access_token}
            onChange={(e) => update({ access_token: e.target.value })}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>
               <div className="space-y-2">
          <label className="text-xs text-white/60">Mensaje de WhatsApp (por defecto)</label>
          <textarea
            rows={2}
            value={form.wa_message}
            onChange={(e) => update({ wa_message: e.target.value })}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Canvas (composer) */}
        {isComposerTemplate && (
          <>
            <hr className="my-4 border-white/10" />
            <div className="text-sm font-semibold">Canvas</div>

            <div className="text-[11px] text-white/50">Relación</div>
            <select
              value={mergedContent.canvasRatio || "16:9"}
              onChange={(e) => updateContent({ canvasRatio: e.target.value })}
              className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
            >
              <option value="16:9">16:9 (Desktop)</option>
              <option value="9:16">9:16 (Mobile)</option>
              <option value="1:1">1:1</option>
            </select>

            {/* Fondo */}
            <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <button
                onClick={onUploadBgClick}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
              >
                Cambiar fondo (PC)
              </button>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBgSelected}
                className="hidden"
              />
              <div className="text-[11px] text-white/50 truncate">
                {mergedContent.bgImage ? "Fondo cargado" : "Sin fondo"}
              </div>
              {mergedContent.bgImage && (
                <button
                  onClick={() => updateContent({ bgImage: "" })}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                >
                  Quitar
                </button>
              )}
            </div>

            {/* Elemento seleccionado */}
            {activeElId && (
              <>
                <hr className="my-4 border-white/10" />
                <div className="text-sm font-semibold">Elemento seleccionado</div>
                {(() => {
                  const el = layers.find((e) => e.id === activeElId);
                  if (!el) return null;

                  return (
                    <div className="grid gap-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-white/50">Posición X %</div>
                          <input
                            type="number" min={0} max={100}
                            value={el.x ?? 0}
                            onChange={(e) => patchActive({ x: Number(e.target.value) })}
                            className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-white/50">Posición Y %</div>
                          <input
                            type="number" min={0} max={100}
                            value={el.y ?? 0}
                            onChange={(e) => patchActive({ y: Number(e.target.value) })}
                            className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-white/50">Ancho %</div>
                        <input
                          type="number" min={5} max={100}
                          value={el.w ?? 60}
                          onChange={(e) => patchActive({ w: Number(e.target.value) })}
                          className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                        />
                      </div>

                      {el.type === "text" && (
                        <>
                          <div>
                            <div className="text-[11px] text-white/50">Texto</div>
                            <textarea
                              rows={2}
                              value={el.text || ""}
                              onChange={(e) => patchActive({ text: e.target.value })}
                              className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[11px] text-white/50">Tamaño px</div>
                              <input
                                type="number"
                                value={el.fontSize || 28}
                                onChange={(e) => patchActive({ fontSize: Number(e.target.value) })}
                                className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <div className="text-[11px] text-white/50">Color</div>
                              <input
                                type="color"
                                value={el.color || "#ffffff"}
                                onChange={(e) => patchActive({ color: e.target.value })}
                                className="h-9 w-full rounded-md border border-white/15 bg-white/5"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[11px] text-white/50">Stroke color</div>
                              <input
                                type="color"
                                value={el.strokeColor || "#000000"}
                                onChange={(e) => patchActive({ strokeColor: e.target.value })}
                                className="h-9 w-full rounded-md border border-white/15 bg-white/5"
                              />
                            </div>
                            <div>
                              <div className="text-[11px] text-white/50">Stroke ancho</div>
                              <input
                                type="number" min={0} max={8}
                                value={el.strokeWidth || 0}
                                onChange={(e) => patchActive({ strokeWidth: Number(e.target.value) })}
                                className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {el.type === "image" && (
                        <>
                          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
                            <div>
                              <div className="text-[11px] text-white/50">URL imagen</div>
                              <input
                                value={el.src || ""}
                                onChange={(e) => patchActive({ src: e.target.value })}
                                className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                                placeholder="https://…"
                              />
                            </div>
                            <button
                              onClick={replaceImageOnActive}
                              className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                            >
                              Reemplazar
                            </button>
                            <button
                              onClick={() => patchActive({ src: "" })}
                              className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                            >
                              Quitar
                            </button>
                            <input
                              ref={replaceImgFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleReplaceImageSelected}
                              className="hidden"
                            />
                          </div>
                          <div>
                            <div className="text-[11px] text-white/50">Borde redondeado (px)</div>
                            <input
                              type="number"
                              value={el.radius || 0}
                              onChange={(e) => patchActive({ radius: Number(e.target.value) })}
                              className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                        </>
                      )}

                      {el.type === "whatsapp" && (
                        <>
                          <div>
                            <div className="text-[11px] text-white/50">Texto del botón</div>
                            <input
                              value={el.text || ""}
                              onChange={(e) => patchActive({ text: e.target.value })}
                              className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[11px] text-white/50">Color de fondo</div>
                              <input
                                type="color"
                                value={el.style?.bg || "#39FF14"}
                                onChange={(e) => patchActive({ style: { ...(el.style||{}), bg: e.target.value } })}
                                className="h-9 w-full rounded-md border border-white/15 bg-white/5"
                              />
                            </div>
                            <div>
                              <div className="text-[11px] text-white/50">Color de texto</div>
                              <input
                                type="color"
                                value={el.style?.txt || "#081c0f"}
                                onChange={(e) => patchActive({ style: { ...(el.style||{}), txt: e.target.value } })}
                                className="h-9 w-full rounded-md border border-white/15 bg-white/5"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-white/50">Mensaje (opcional)</div>
                            <textarea
                              rows={2}
                              value={el.message || ""}
                              onChange={(e) => patchActive({ message: e.target.value })}
                              className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}