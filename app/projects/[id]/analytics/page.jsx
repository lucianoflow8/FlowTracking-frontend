// app/projects/[id]/analytics/page.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createSbWithProject } from "@/lib/supabaseClient";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ---------- helpers ---------- */
const peso = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fechaCorta = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
};

export default function AnalyticsPage() {
  const { id } = useParams(); // projectId
  const sb = useMemo(() => createSbWithProject(String(id)), [id]);

  const [pageFilter, setPageFilter] = useState("all");
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 864e5));
  const [to, setTo] = useState(() => new Date());
  const [pages, setPages] = useState([]);

  const [kpis, setKpis] = useState({
    visits: 0,
    clicks: 0,
    chats: 0,
    convs: 0,
    revenue: 0,
  });

  const [series, setSeries] = useState([]);

  /* ---------- cargar páginas ---------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await sb
        .from("pages")
        .select("id,name")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
      if (!error) setPages(data || []);
    })();
  }, [id, sb]);

  /* ---------- KPIs + serie ---------- */
  useEffect(() => {
    (async () => {
      const fromISO = new Date(new Date(from).setHours(0, 0, 0, 0)).toISOString();
      const toISO = new Date(new Date(to).setHours(23, 59, 59, 999)).toISOString();

      const byProject = { project_id: id };
      const byPage = pageFilter === "all" ? {} : { page_id: pageFilter };

      // Visitas / Clicks / Conversiones (cuentas simples)
      const [visitsQ, clicksQ, convsQ] = await Promise.all([
        sb.from("analytics_page_views")
          .select("id", { count: "exact", head: true })
          .match(byProject)
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .match(byPage),
        sb.from("analytics_clicks")
          .select("id", { count: "exact", head: true })
          .match(byProject)
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .match(byPage),
        sb.from("analytics_conversions")
          .select("amount", { count: "exact" })
          .match(byProject)
          .gte("created_at", fromISO)
          .lte("created_at", toISO)
          .match(byPage),
      ]);

      // 💬 Chats únicos por (contacto, slug) via RPC con header de proyecto
      const in_page = pageFilter === "all" ? null : pageFilter;
      const { data: uniqueChats, error: chatErr } = await sb.rpc(
        "analytics_chats_unique_by_slug",
        { from_ts: fromISO, to_ts: toISO, in_page }
      );
      if (chatErr) console.error("[RPC analytics_chats_unique_by_slug] error:", chatErr);

      const convs = convsQ?.count || 0;
      const revenue = (convsQ?.data || []).reduce(
        (a, r) => a + (r.amount || 0),
        0
      );

      setKpis({
        visits: visitsQ?.count || 0,
        clicks: clicksQ?.count || 0,
        chats:
          (Array.isArray(uniqueChats) && uniqueChats[0]?.total)
            ? Number(uniqueChats[0].total)
            : 0,
        convs,
        revenue,
      });

      // Serie diaria (conversiones e ingresos)
      const { data: convData } = await sb
        .from("analytics_conversions")
        .select("amount, created_at")
        .match(byProject)
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .match(byPage)
        .order("created_at", { ascending: true });

      const bucket = new Map();
      const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

      (convData || []).forEach((row) => {
        const key = dayKey(row.created_at);
        if (!bucket.has(key)) bucket.set(key, { conv: 0, revenue: 0, date: key });
        const b = bucket.get(key);
        b.conv += 1;
        b.revenue += row.amount || 0;
      });

      const days = [];
      const start = new Date(fromISO);
      const end = new Date(toISO);
      for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 864e5)) {
        const key = d.toISOString().slice(0, 10);
        if (!bucket.has(key)) bucket.set(key, { conv: 0, revenue: 0, date: key });
        days.push(key);
      }

      const finalSeries = days
        .map((key) => bucket.get(key))
        .sort((a, b) => a.date.localeCompare(b.date));

      setSeries(finalSeries.length ? finalSeries : [{ date: fromISO, conv: 0, revenue: 0 }]);
    })();
  }, [id, sb, pageFilter, from, to]);

  const conversionRates = useMemo(() => {
    const { visits, clicks, chats, convs } = kpis;
    const pct = (num, den) => (den ? (num / den) * 100 : 0);
    return [
      { label: "Visitas → Clicks", value: pct(clicks, visits) },
      { label: "Clicks → Chats", value: pct(chats, clicks) },
      { label: "Chats → Conversiones", value: pct(convs, chats) },
      { label: "Visitas → Conversiones", value: pct(convs, visits) },
    ];
  }, [kpis]);

  return (
    <div className="w-full min-w-0 space-y-6 px-2 md:px-4">
      {/* Filtros */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <select
          className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm"
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
        >
          <option value="all">Todas las páginas</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Filtro de fechas con validación segura */}
<input
  type="date"
  className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm"
  value={
    from instanceof Date && !isNaN(from)
      ? from.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  }
  onChange={(e) => {
    const val = e.target.value ? new Date(e.target.value) : new Date();
    setFrom(val);
  }}
/>
<span className="text-white/50">→</span>
<input
  type="date"
  className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm"
  value={
    to instanceof Date && !isNaN(to)
      ? to.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  }
  onChange={(e) => {
    const val = e.target.value ? new Date(e.target.value) : new Date();
    setTo(val);
  }}
/>
      </div>

      {/* KPIs */}
<div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-4">
  <KpiCard title="Visitas de página" value={kpis.visits} />
  <KpiCard title="Clicks al botón" value={kpis.clicks} />
  <KpiCard title="Chats" value={kpis.chats} />
  <KpiCard
    title="Conversiones"
    value={kpis.convs}
    right={<span className="text-emerald-400 text-[1.2rem] font-semibold">{peso(kpis.revenue)}</span>}
  />
</div>

      {/* Gráfico */}
      <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-3 md:p-4">
        <div className="mb-2 text-sm text-white/60">
          Analytics · Página:{" "}
          <span className="text-white">
            {pageFilter === "all"
              ? "Todas las páginas"
              : pages.find((p) => p.id === pageFilter)?.name || pageFilter}
          </span>
        </div>

        <div className="mt-2 h-[520px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 20, right: 60, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopOpacity={0.35} stopColor="#60A5FA" />
                  <stop offset="100%" stopOpacity={0} stopColor="#60A5FA" />
                </linearGradient>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopOpacity={0.35} stopColor="#10B981" />
                  <stop offset="100%" stopOpacity={0} stopColor="#10B981" />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#ffffff14" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fechaCorta} stroke="#9ca3af" tickMargin={8} />
              <YAxis yAxisId="left" stroke="#9ca3af" tickMargin={8} width={40} allowDecimals={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
                width={60}
              />

              <Tooltip
                contentStyle={{
                  background: "rgba(17,17,17,.85)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 10,
                }}
                labelFormatter={(l) => `Fecha: ${fechaCorta(l)}`}
                formatter={(value, name) => {
                  if (name === "Ingresos") return [peso(value), name];
                  return [value, name];
                }}
              />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="conv"
                name="Conversiones"
                stroke="#60A5FA"
                strokeWidth={2.5}
                fill="url(#gConv)"
                activeDot={{ r: 4 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="Ingresos"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#gRev)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center gap-5 text-sm">
          <LegendDot color="#60A5FA" label="Conversiones" />
          <LegendDot color="#10B981" label="Ingresos" />
        </div>
      </div>

      {/* Tasas */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-sm font-medium text-white/90">Tasa de conversión</h3>
        <div className="space-y-3">
          {conversionRates.map((r) => (
            <ProgressRow key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function KpiCard({ title, value, right }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <div className="text-2xl font-semibold">{value}</div>
        {right ? <div className="text-sm">{right}</div> : null}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-white/80">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-white/80">{label}</span>
        <span className="text-white/60">{value.toFixed(2)}%</span>
      </div>
      <div className="h-2 w-full rounded bg白/10">
        <div
          className="h-2 rounded bg-emerald-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}