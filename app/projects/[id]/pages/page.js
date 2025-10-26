"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { renderTemplatePreview, TEMPLATES } from "@/lib/pageTemplates";

export default function PagesList() {
  const router = useRouter();
  const { id: projectId } = useParams();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  // -------- fetch ----------
  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("No se pudieron cargar las páginas.");
    } else {
      setPages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, [projectId]);

  const duplicatePage = async (p) => {
    try {
      const newSlug = (p.slug
        ? `${p.slug}-copy-${Date.now().toString().slice(-4)}`
        : `page-${Date.now()}`).toLowerCase();
      const payload = {
        project_id: projectId,
        title: p.title ? `${p.title} (copia)` : "Copia",
        slug: newSlug,
        template: p.template,
        pixel_id: p.pixel_id || "",
        access_token: p.access_token || "",
        wa_message: p.wa_message || "",
        content: p.content || {},
        published: false,
      };
      const { data, error } = await supabase
        .from("pages")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      alert("Página duplicada.");
      router.push(`/projects/${projectId}/pages/editor?pid=${data.id}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo duplicar.");
    }
  };

  const deletePage = async (p) => {
    const ok = confirm(
      `¿Eliminar “${p.title || "Página"}”? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    const { error } = await supabase.from("pages").delete().eq("id", p.id);
    if (error) {
      console.error(error);
      alert("No se pudo eliminar.");
    } else {
      setPages((arr) => arr.filter((x) => x.id !== p.id));
    }
  };

  // Mini preview cuadrado (no draggable)
  const Preview = ({ page }) => {
    const content = useMemo(() => {
      const tpl = TEMPLATES.find((t) => t.id === page.template) || TEMPLATES[0];
      return { ...(tpl?.defaults || {}), ...(page?.content || {}) };
    }, [page]);

    return (
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#0f0f14] border border-white/10">
        <div className="h-full w-full p-3">
          {renderTemplatePreview({
            templateId: page.template || "free-composer",
            content,
            draggable: false,
          })}
        </div>
      </div>
    );
  };

  // Skeleton de tarjeta (preview + textos)
  const CardSkeleton = () => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="w-full aspect-square rounded-xl bg-white/10 animate-pulse" />
      <div className="mt-3 h-4 w-1/2 rounded bg-white/10 animate-pulse" />
      <div className="mt-2 h-3 w-1/3 rounded bg-white/10 animate-pulse" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Páginas</h1>
          <button
            onClick={() =>
              router.push(`/projects/${projectId}/pages/select-template`)
            }
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 transition"
          >
            Crear página
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="grid place-items-center py-20">
            <div className="text-center max-w-md">
              <div className="text-lg font-semibold mb-2">No hay páginas</div>
              <p className="text-white/60 mb-6">
                Creá tu primera página para iniciar tu campaña.
              </p>
              <button
                onClick={() =>
                  router.push(`/projects/${projectId}/pages/select-template`)
                }
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400 transition"
              >
                Crear página
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                {/* Preview cuadrado */}
                <Preview page={p} />

                {/* Info + menú */}
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {p.title || "Untitled Page"}
                    </div>
                    <div className="text-xs text-white/50">
                      {p.slug ? `/${p.slug}` : "sin-slug"}
                      {p.published ? " • publicado" : ""}
                    </div>
                  </div>

                  {/* Kebab */}
                  <div className="relative z-20">
                    <button
                      onClick={() =>
                        setOpenMenuId((cur) => (cur === p.id ? null : p.id))
                      }
                      className="rounded-md border border-white/15 px-2 py-1 text-white/70 hover:bg-white/10"
                      title="Acciones"
                    >
                      ⋮
                    </button>

                    {/* Overlay para cerrar al click afuera */}
                    {openMenuId === p.id && (
                      <button
                        aria-hidden
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setOpenMenuId(null)}
                      />
                    )}

                    {openMenuId === p.id && (
                      <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border border-white/10 bg-[#121215] text-sm shadow-lg">
                        {/* VISITAR con Link (abre /p/slug en nueva pestaña) */}
                        <Link
                          href={p.slug ? `/p/${p.slug}` : "#"}
                          target="_blank"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-white/10"
                        >
                          Visitar
                        </Link>

                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            router.push(
                              `/projects/${projectId}/pages/editor?pid=${p.id}`
                            );
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-white/10"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            duplicatePage(p);
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-white/10"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            deletePage(p);
                          }}
                          className="block w-full px-3 py-2 text-left text-red-300 hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}