"use client";

function Bar({ label, value }) {
  const pct = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
        <span>{label}</span>
        <span>{pct.toFixed(2)}%</span>
      </div>
      <div className="h-3 w-full rounded bg-white/5">
        <div
          className="h-3 rounded bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ConversionBars({ visits = 0, clicks = 0, chats = 0, conversions = 0 }) {
  const safeDiv = (a, b) => (!b ? 0 : (a / b) * 100);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/80">Tasa de conversión</h3>
      <Bar label="Visitas de página → Clicks" value={safeDiv(clicks, visits)} />
      <Bar label="Clicks → Chats" value={safeDiv(chats, clicks)} />
      <Bar label="Chats → Conversiones" value={safeDiv(conversions, chats)} />
      <Bar label="Visitas de página → Conversiones" value={safeDiv(conversions, visits)} />
    </div>
  );
}



