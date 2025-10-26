"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------- helpers ---------- */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso ?? "-";
  }
}

/** CSV SOLO nombre,telefono (con BOM y CRLF para Excel) */
function downloadCSV(filename, rows) {
  if (!rows?.length) return;

  const headers = ["nombre", "telefono"];
  const body = rows.map((r) =>
    headers
      .map((h) => {
        const v = r[h] ?? "";
        const s = typeof v === "string" ? v : JSON.stringify(v);
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  // BOM + CRLF para Excel
  const csv = "\uFEFF" + [headers.join(","), ...body].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- avatar ---------- */
function Avatar({ name, src }) {
  const initial = (name?.[0] || "U").toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white">
      {initial}
    </div>
  );
}

/* ---------- page ---------- */
export default function AgendaPage() {
  const { id: projectId } = useParams();

  const [q, setQ] = useState("");
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 864e5));
  const [to, setTo] = useState(() => new Date());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar contactos desde la vista v_agenda_contacts
  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("v_agenda_contacts")
        .select(
          `
          project_id,
          phone,
          contact_name,
          avatar_url,
          wa_phone,
          pages,
          first_seen_at,
          last_message_at,
          leads,
          status
        `
        )
        .eq("project_id", projectId)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.warn("[Agenda] select error:", error);
        setRows([]);
      } else {
        setRows(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Filtro por texto (nombre, teléfono, páginas)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      const name = (r.contact_name || "").toLowerCase();
      const phone = (r.phone || "").toLowerCase();
      const pages = Array.isArray(r.pages) ? r.pages.join(" ").toLowerCase() : "";
      return name.includes(term) || phone.includes(term) || pages.includes(term);
    });
  }, [rows, q]);

  // Filtro por rango (sobre last_message_at)
  const ranged = useMemo(() => {
    const f = new Date(new Date(from).setHours(0, 0, 0, 0));
    const t = new Date(new Date(to).setHours(23, 59, 59, 999));
    return filtered.filter((r) => {
      const last = new Date(r.last_message_at);
      return last >= f && last <= t;
    });
  }, [filtered, from, to]);

  // Exportar CSV **solo nombre y telefono** (deduplicado por teléfono)
  const onExport = () => {
    if (!ranged.length) return alert("No hay contactos para exportar.");

    const mapped = ranged.map((r) => ({
      nombre: r.contact_name || "Usuario anónimo",
      telefono: r.phone || "",
    }));

    // dedupe por teléfono
    const seen = new Set();
    const uniq = [];
    for (const row of mapped) {
      const key = row.telefono || "__empty__";
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(row);
    }

    if (!uniq.length) return alert("No hay contactos para exportar.");
    downloadCSV(`agenda_${projectId}.csv`, uniq);
  };

  return (
    <div className="w-full space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono o página…"
          className="h-9 min-w-[280px] flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none"
        />
       <DateInput value={from} onChange={setFrom} />
<span className="text-white/50">→</span>
<DateInput value={to} onChange={setTo} />
        <button
          onClick={load}
          className="h-9 rounded-md border border-white/10 bg-white/10 px-3 text-sm hover:bg-white/15"
        >
          Actualizar
        </button>
        <div className="flex-1" />
        <button
          onClick={onExport}
          disabled={!ranged.length}
          className="h-9 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-3 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Exportar contactos
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="p-6 text-white/60">Cargando…</div>
        ) : !ranged.length ? (
          <div className="p-6 text-white/60">No hay contactos</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {ranged.map((r) => {
              const name = r.contact_name || "Usuario anónimo";
              const pages =
                Array.isArray(r.pages) && r.pages.length ? r.pages.join(", ") : "-";
              const isConversion = r.status === "conversion";
              return (
                <li
                  key={`${r.project_id}-${r.phone}`}
                  className="flex items-center gap-3 p-4"
                >
                  <Avatar name={name} src={r.avatar_url} />

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="truncate font-medium">{name}</div>

                      {/* número en VERDE */}
                      <span className="truncate text-emerald-400">{r.phone}</span>

                      {/* Badge por estado */}
                      {isConversion ? (
                        <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          Conversión
                        </span>
                      ) : (
                        <span className="ml-2 rounded-full border border-yellow-400/30 bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-300">
                          Inició conversación
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-white/60">
                      Último: {formatDate(r.last_message_at)} · Páginas: {pages}
                    </div>
                  </div>

                  <div className="text-right text-sm text-white/70">
                    <div>
                      Leads: <b>{r.leads ?? 0}</b>
                    </div>
                    <div className="text-xs text-white/50">WA: {r.wa_phone || "—"}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DateInput({ value, onChange, className = "h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm" }) {
  const isValidDate = (d) => d instanceof Date && !isNaN(d);

  const inputValue = isValidDate(value)
    ? new Date(value).toISOString().slice(0, 10)
    : "";

  return (
    <input
      type="date"
      value={inputValue}
      onChange={(e) => {
        const v = e.target.value;               // 'YYYY-MM-DD' o ''
        if (!v) return;                          // ignorar mientras escribe/borra
        const next = new Date(`${v}T00:00:00`);
        if (isValidDate(next)) onChange(next);
      }}
      className={className}
    />
  );
}