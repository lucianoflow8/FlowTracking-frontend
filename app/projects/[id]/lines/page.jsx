"use client";

import { listLines as apiListLines, createLine as apiCreateLine } from "@/utils/linesApi.js";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Phone, QrCode, Pencil, Trash2, Plus, CreditCard, Clock3 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_WA_API_URL || "http://localhost:4000";

/* ---------- UI helpers ---------- */
function StatusBadge({ connected }) {
  const cls = connected
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/25"
    : "bg-rose-500/15 text-rose-300 border-rose-400/25";
  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-medium ${cls}`}>
      {connected ? "Conectada" : "Desconectada"}
    </span>
  );
}
function SectionCard({ children }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">{children}</div>;
}

/* ---------- phone helpers ---------- */
const normalizePhone = (raw) => (raw || "").replace(/[^\d]/g, "");

export default function LinesPage() {
  const { id: projectId } = useParams();

  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  // créditos globales del usuario
  const [credits, setCredits] = useState(0);

  // crear línea
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  // renombrar
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameLine, setRenameLine] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // QR
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLine, setQrLine] = useState(null);
  const [qrImgUrl, setQrImgUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // agregar crédito
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditLine, setCreditLine] = useState(null);
  const [running, setRunning] = useState(false);

  /* ---------- helpers de visual ---------- */
  const fmt = (d) =>
    d ? new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-";
  const isConnected = (ln) => {
    const st = String(ln?.wa_status || "").toLowerCase();
    return st === "connected" || st === "ready";
  };

  /* ---------- data ---------- */
  const loadLines = async () => {
    setLoading(true);
    try {
      // 1) traer líneas base desde Supabase
      const base = await apiListLines(projectId);

      // 2) enriquecer con estado live del WA server
      const withStatus = await Promise.all(
        (base || []).map(async (ln) => {
          try {
            const res = await fetch(`${API_BASE}/lines/${encodeURIComponent(ln.id)}/status`);
            if (!res.ok) return ln;
            const j = await res.json(); // { status, phone }
            return {
              ...ln,
              wa_status: j?.status || null,
              wa_phone: j?.phone || null,
              status: j?.status || null,
              phone: j?.phone || null,
            };
          } catch {
            return ln;
          }
        })
      );

      setLines(withStatus);
    } catch (error) {
      console.error("listLines error:", error);
      alert(`No pude listar líneas: ${error.message || error}`);
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCredits = async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) {
        setCredits(0);
        return;
      }
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", uid)
        .single();
      if (error) {
        setCredits(0);
        return;
      }
      setCredits(data?.credits ?? 0);
    } catch {
      setCredits(0);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    loadLines();
    loadCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /* ---------- acciones ---------- */

  // Crear línea sin enviar un id manual
  const createLineAction = async () => {
    try {
      await apiCreateLine({ name: createName || null, projectId });
      setCreateName("");
      setCreateOpen(false);
      await loadLines();
    } catch (err) {
      alert(err.message || "Error creando línea");
    }
  };

  const openRename = (line) => {
    setRenameLine(line);
    setRenameValue(line.name || "");
    setRenameOpen(true);
  };

  const saveRename = async () => {
    if (!renameLine) return;
    const { error } = await supabase
      .from("lines")
      .update({ name: renameValue || null })
      .eq("id", renameLine.id)
      .eq("project_id", projectId);
    if (error) return alert(error.message);
    setRenameOpen(false);
    setRenameLine(null);
    setRenameValue("");
    await loadLines();
  };

  const deleteLine = async (line) => {
    if (!confirm("¿Eliminar esta línea?")) return;
    const { error } = await supabase
      .from("lines")
      .delete()
      .eq("id", line.id)
      .eq("project_id", projectId);
    if (error) return alert(error.message);
    await loadLines();
  };

  // ✅ Guarda el número (solo dígitos) en pages.whatsapp_phone para TODAS las landings del proyecto
  const assignPhoneToLanding = async ({ wa_phone }) => {
    try {
      const phone = (wa_phone || "").replace(/[^\d]/g, ""); // normaliza: deja solo números
      if (!phone) return;

      const { error } = await supabase
        .from("pages")
        .update({
          whatsapp_phone: phone, // 👈 la landing pública lee esta columna
          // whatsapp_text: "Quiero crear mi usuario", // opcional
        })
        .eq("project_id", projectId);

      if (error) throw error;
      // console.log(`Actualicé whatsapp_phone a ${phone} en todas las páginas del proyecto`);
    } catch (e) {
      console.error("No pude asignar el teléfono a la landing:", e);
    }
  };

  // ----- QR real -----
  const generateQr = async () => {
    if (!qrLine) return;
    try {
      setQrLoading(true);
      setQrImgUrl(null);
      const res = await fetch(`${API_BASE}/lines/${encodeURIComponent(qrLine.id)}/qr`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json(); // { status, qr }
      if (json.qr) setQrImgUrl(json.qr);
    } catch (e) {
      alert(e.message || "No se pudo generar el QR.");
    } finally {
      setQrLoading(false);
    }
  };

  // Al abrir el modal, nos suscribimos a SSE para actualizar QR/estado en vivo
  useEffect(() => {
    if (!qrOpen || !qrLine) return;
    const es = new EventSource(`${API_BASE}/lines/${encodeURIComponent(qrLine.id)}/events`);

    es.onmessage = async (ev) => {
      try {
        const d = JSON.parse(ev.data); // { status, phone, qr }
        if (d.qr) setQrImgUrl(d.qr);

        // ✅ Cuando la línea queda lista, guardamos el número en pages.whatsapp_phone
        if (d.status === "ready") {
          try {
            if (d.phone) {
              await assignPhoneToLanding({ wa_phone: d.phone });
            } else {
              await loadLines();
              const refreshed = (await apiListLines(projectId)) || [];
              const me = refreshed.find((x) => x.id === qrLine.id);
              if (me?.wa_phone) await assignPhoneToLanding({ wa_phone: me.wa_phone });
            }
          } catch (e) {
            console.error("Error asignando CTA automáticamente:", e);
          }

          await loadLines();
          setQrOpen(false);
          setQrLine(null);
        }
      } catch {}
    };

    es.onerror = () => {};
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrOpen, qrLine]);

  // Nueva función: Agregar crédito (consume 1 crédito, extiende expiración 24hs)
  const addCredit = async () => {
    if (!creditLine || credits < 1) return;
    setRunning(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) throw new Error("Usuario no autenticado");

      // Calcular nueva expiración (actual + 24hs)
      const currentExpires = new Date(creditLine.expires_at || Date.now());
      const newExpires = new Date(currentExpires.getTime() + 24 * 60 * 60 * 1000); // +24 horas

      // Actualizar línea con nueva expiración
      const { error: lineError } = await supabase
        .from("lines")
        .update({ expires_at: newExpires.toISOString() })
        .eq("id", creditLine.id)
        .eq("project_id", projectId);
      if (lineError) throw lineError;

      // Restar 1 crédito al usuario
      const { error: creditError } = await supabase
        .from("user_credits")
        .update({ credits: credits - 1 })
        .eq("user_id", uid);
      if (creditError) throw creditError;

      // Recargar datos
      await loadLines();
      await loadCredits();
      setCreditOpen(false);
      setCreditLine(null);
    } catch (err) {
      alert(err.message || "Error agregando crédito");
    } finally {
      setRunning(false);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Líneas</h1>
          <p className="text-sm text-white/60">Administrá tus líneas. 1 crédito = 24 hs.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          <Plus size={16} />
          Agregar línea
        </button>
      </div>

      <SectionCard>
        {loading ? (
          <div className="py-16 text-center text-white/60">Cargando…</div>
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <Phone className="h-8 w-8 text-white/60" />
            </div>
            <div className="text-lg font-medium">No hay líneas</div>
            <div className="text-sm text-white/60">Creá tu primera línea y asignale créditos.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((ln) => (
              <div
                key={ln.id}
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
              >
                {/* izquierda */}
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/5">
                    <Phone size={16} className="text-white/70" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{ln.name || "Sin nombre"}</div>
                    <div className="text-xs text-white/50">
                      Creada: {fmt(ln.created_at)} · Expira: {fmt(ln.expires_at)}
                      {ln.wa_phone ? (
                        <>
                          {" "}
                          · Tel: <b>{ln.wa_phone}</b>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* derecha */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge connected={isConnected(ln)} />

                  <button
                    onClick={() => {
                      setCreditLine(ln);
                      setCreditOpen(true);
                    }}
                    className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/15 inline-flex items-center gap-1"
                    title="Agregar crédito (24hs)"
                  >
                    <CreditCard size={14} />
                    Agregar crédito
                  </button>

                  <button
                    onClick={() => {
                      setQrLine(ln);
                      setQrOpen(true);
                      setQrImgUrl(null);
                    }}
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 inline-flex items-center gap-1"
                    title="Escanear QR"
                  >
                    <QrCode size={14} />
                    Escanear QR
                  </button>

                  <button
                    onClick={() => openRename(ln)}
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 inline-flex items-center gap-1"
                    title="Renombrar"
                  >
                    <Pencil size={14} />
                    Renombrar
                  </button>

                  <button
                    onClick={() => deleteLine(ln)}
                    className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/15 inline-flex items-center gap-1"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Modal Crear */}
      {createOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f1012] p-4">
            <div className="text-lg font-semibold mb-2">Agregar línea</div>
            <label className="text-sm text-white/70">Nombre (opcional)</label>
            <input
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Ej: Ventas Norte"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />