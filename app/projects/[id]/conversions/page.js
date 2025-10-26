// app/projects/[id]/conversions/page.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createSbWithProject } from "@/lib/supabaseClient";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  FileText,
  Trash2,
} from "lucide-react";

/* ================== Utils ================== */
const peso = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fechaCorta = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const PAGE_SIZE = 20;

/* ================== Page ================== */
export default function ConversionsPage() {
  const { id: projectId } = useParams();
  const sb = useMemo(() => createSbWithProject(String(projectId)), [projectId]);

  // filtros
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 864e5));
  const [to, setTo] = useState(() => new Date());
  const [page, setPage] = useState(1);

  // datos
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // detalle
  const [sel, setSel] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  const resetAndSearch = () => setPage(1);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // rango [from 00:00, to+1d 00:00)
    const fromStart = new Date(new Date(from).setHours(0, 0, 0, 0)).toISOString();
    const toExclusive = new Date(
      new Date(to).setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000
    ).toISOString();

    // columnas completas que ahora llena el backend
    let query = sb
      .from("analytics_conversions")
      .select(
        [
          "id", "created_at", "amount", "contact",
          "file_url", "file_mime",
          "concept", "reference", "operation_no",
          "origin_name", "origin_cuit", "origin_account", "origin_bank",
          "dest_name", "dest_cuit", "dest_account", "dest_bank",
        ].join(", "),
        { count: "exact" }
      )
      .eq("project_id", String(projectId))
      .gte("created_at", fromStart)
      .lt("created_at", toExclusive)
      .order("created_at", { ascending: false });

    if (q.trim()) {
      const like = `%${q.trim()}%`;
      // server-side por contacto
      query = query.or([`contact.ilike.${like}`].join(","));
    }

    const fromIdx = (page - 1) * PAGE_SIZE;
    const toIdx = fromIdx + PAGE_SIZE - 1;
    query = query.range(fromIdx, toIdx);

    const { data, error, count } = await query;
    if (error) {
      console.error("[conversions] select error:", error);
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    // nombres/avatars desde wa_contact_names
    const phones = [...new Set((data || []).map((d) => d.contact).filter(Boolean))];
    let namesMap = new Map();
    if (phones.length) {
      const { data: names, error: e2 } = await sb
        .from("wa_contact_names")
        .select("phone, name, avatar_url")
        .in("phone", phones);
      if (e2) console.error("[wa_contact_names] error:", e2);
      (names || []).forEach((n) => namesMap.set(String(n.phone), n));
    }

    const enriched = (data || []).map((r) => {
      const nrow = namesMap.get(String(r.contact));
      return {
        id: r.id,
        created_at: r.created_at,
        amount: r.amount,
        contact: r.contact,

        customer_name: nrow?.name || null,
        customer_avatar: nrow?.avatar_url || null,

        receipt_url: r.file_url,
        file_mime: r.file_mime,

        concept: r.concept || null,
        reference: r.reference || null,
        operation_no: r.operation_no || null,

        origin_name: r.origin_name || null,
        origin_cuit: r.origin_cuit || null,
        origin_account: r.origin_account || null,
        origin_bank: r.origin_bank || null,

        dest_name: r.dest_name || null,
        dest_cuit: r.dest_cuit || null,
        dest_account: r.dest_account || null,
        dest_bank: r.dest_bank || null,
      };
    });

    // filtro adicional por nombre (client-side)
    const filtered = q.trim()
      ? enriched.filter((r) =>
          (r.customer_name || "").toLowerCase().includes(q.trim().toLowerCase())
        )
      : enriched;

    setRows(filtered);
    setTotal(count ?? filtered.length ?? 0);

    // si el seleccionado ya no está, limpiar (evita parpadeo)
    if (sel && !filtered.some((x) => x.id === sel.id)) setSel(null);

    setLoading(false);
  }, [sb, projectId, from, to, page, q]); // <- sin `sel` para evitar re-fetch al click

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // eliminar (optimista)
  const handleDelete = async (row) => {
    if (!row) return;
    if (!window.confirm("¿Eliminar esta conversión? Esta acción es permanente.")) return;

    const backup = rows;
    setRows((prev) => prev.filter((x) => x.id !== row.id));
    setSel(null);
    setTotal((t) => Math.max(0, t - 1));

    const { error } = await sb.from("analytics_conversions").delete().eq("id", row.id);
    if (error) {
      console.error("[conversions] delete error:", error);
      alert("No se pudo eliminar la conversión.");
      setRows(backup);
      setTotal(backup.length);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetAndSearch();
            }}
            placeholder="Buscar por nombre, teléfono, referencia o concepto…"
            className="w-full h-10 rounded-md bg-white/5 pl-9 pr-3 outline-none border border-white/10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <DateInput value={from} onChange={(d) => { setFrom(d); resetAndSearch(); }} />
          <span className="text-white/40">→</span>
          <DateInput value={to} onChange={(d) => { setTo(d); resetAndSearch(); }} />
        </div>
      </div>

      {/* contenido */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* listado */}
        <div className="col-span-12 lg:col-span-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-white/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando conversiones…
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <ConversionRow
                  key={r.id}
                  row={r}
                  onClick={() => setSel(r)}
                  active={sel?.id === r.id}
                />
              ))}

              {/* paginación */}
              <div className="mt-3 flex items-center justify-between text-sm text-white/60">
                <div>
                  Página {page} de {totalPages} · Total: {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md border border-white/10 px-2.5 py-1.5 hover:bg-white/5 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-2.5 py-1.5 hover:bg-white/5 disabled:opacity-40"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* detalle */}
        <div className="col-span-12 lg:col-span-4">
          <DetailPanel row={sel} onDelete={() => handleDelete(sel)} />
        </div>
      </div>
    </div>
  );
}

/* ================== Subcomponentes ================== */

function DateInput({ value, onChange }) {
  const isValidDate = (d) => d instanceof Date && !isNaN(d);

  // Evita llamar toISOString sobre un valor inválido
  const inputValue = isValidDate(value)
    ? new Date(value).toISOString().slice(0, 10)
    : "";

  return (
    <div className="relative">
      {/* Si usás un ícono, dejalo aquí */}
      <input
        type="date"
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value;               // 'YYYY-MM-DD' o ''
          if (!v) return;                          // no hagas nada si quedó vacío
          const next = new Date(`${v}T00:00:00`);  // evita problemas de TZ
          if (isValidDate(next)) onChange(next);
        }}
        className="h-10 rounded-md bg-white/5 pl-9 pr-3 outline-none border border-white/10 text-sm"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <FileText className="h-6 w-6 text-white/50" />
      </div>
      <div className="mt-3 text-lg font-medium">No hay conversiones</div>
      <div className="mt-1 max-w-md text-center text-white/60 text-sm">
        Cuando subas o recibas comprobantes, las conversiones aparecerán aquí.
      </div>
    </div>
  );
}

/** Ítem de lista: monto (verde) + avatar+nombre+fecha (sin número) */
function ConversionRow({ row, onClick, active }) {
  const name = row.customer_name || "Sin nombre";
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border px-4 py-2 text-left transition-colors
        ${active ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-emerald-400">{peso(row.amount)}</div>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar src={row.customer_avatar} alt={name} />
          <div className="min-w-0">
            <div className="truncate text-sm">{name}</div>
            <div className="text-xs text-white/50">{fechaCorta(row.created_at)}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function Avatar({ src, alt }) {
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
        <rect width='100%' height='100%' fill='#232323'/>
        <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#8a8a8a' font-size='16' font-family='system-ui'>👤</text>
      </svg>`
    );
  return (
    <img
      src={src || fallback}
      alt={alt || "avatar"}
      className="h-7 w-7 rounded-full object-cover border border-white/10"
    />
  );
}

/** Panel derecho con previsualización y botón rojo “Eliminar conversión” */
function DetailPanel({ row, onDelete }) {
  if (!row) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">
        Seleccioná una conversión para ver el detalle.
      </div>
    );
  }

  const Field = ({ label, value }) => (
    <div className="flex items-start justify-between gap-3">
      <div className="text-white/50">{label}</div>
      <div className="text-right break-all">{value || "—"}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={row.customer_avatar} alt={row.customer_name || "Sin nombre"} />
          <div>
            <div className="text-sm text-white/80">{row.customer_name || "Sin nombre"}</div>
            <div className="text-xs text-white/50">{row.contact || "—"}</div>
          </div>
        </div>
        <div className="text-lg font-semibold text-white">{peso(row.amount)}</div>
      </div>

      <div className="rounded-lg border border-white/10 p-3">
        <div className="space-y-2 text-sm">
          <Field label="Concepto" value={row.concept} />
          <Field label="Nº Operación" value={row.operation_no} />
          <Field label="Referencia" value={row.reference} />
          <Field label="Fecha" value={fechaCorta(row.created_at)} />
        </div>
      </div>

      <Section title="Origen">
        <KV label="Nombre" value={row.origin_name} />
        <KV label="CUIT" value={row.origin_cuit} />
        <KV label="Cuenta" value={row.origin_account} />
        <KV label="Banco" value={row.origin_bank} />
      </Section>

      <Section title="Destino" className="mt-3">
        <KV label="Nombre" value={row.dest_name} />
        <KV label="CUIT" value={row.dest_cuit} />
        <KV label="Cuenta" value={row.dest_account} />
        <KV label="Banco" value={row.dest_bank} />
      </Section>

      {/* Archivo: previsualización + descargar */}
      <div className="mt-3">
        <div className="mb-2 text-sm font-medium text-white/80">Comprobante</div>

        {!row.receipt_url ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
            Sin archivo adjunto
          </div>
        ) : (
          <div className="space-y-2">
            {row.file_mime?.startsWith("image/") ? (
              <button
                onClick={() => window.open(row.receipt_url, "_blank", "noopener")}
                className="block rounded-lg overflow-hidden border border-white/10 hover:border-white/20"
                title="Abrir comprobante"
              >
                <img
                  src={row.receipt_url}
                  alt="Comprobante"
                  className="max-h-72 w-full object-contain bg-white/5"
                  loading="lazy"
                />
              </button>
            ) : row.file_mime?.includes("pdf") ? (
              <div className="rounded-lg overflow-hidden border border-white/10 bg-white">
                <iframe
                  src={row.receipt_url}
                  className="w-full h-72"
                  title="Comprobante PDF"
                />
              </div>
            ) : (
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
                Archivo no previsualizable ({row.file_mime || "desconocido"})
              </div>
            )}

            <a
              href={row.receipt_url}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Descargar comprobante
            </a>
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-500/40 bg-red-600/20 px-3 py-2 text-sm text-red-200 hover:bg-red-600/30"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar conversión
      </button>
    </div>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <div className={`mt-3 rounded-lg border border-white/10 p-3 ${className}`}>
      <div className="mb-2 text-sm font-medium text-white/80">{title}</div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-white/50">{label}</div>
      <div className="text-right break-all">{value || "—"}</div>
    </div>
  );
}