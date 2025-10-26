export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Visitas de página", value: 0 },
          { label: "Clicks al botón", value: 0 },
          { label: "Chats", value: 0 },
          { label: "Conversiones", value: 0 },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-semibold">{k.value}</div>
            <div className="text-sm text-white/60">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-5">
        <div className="text-sm text-white/60 mb-2">Gráfico (placeholder)</div>
        <div className="h-56 rounded-md border border-white/10 bg-black/20" />
      </div>
    </div>
  );
}