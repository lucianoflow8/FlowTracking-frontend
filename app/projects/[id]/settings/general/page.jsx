"use client";
import { useState } from "react";

export default function ProjectGeneralSettings() {
  const [name, setName] = useState("Rosario cliente 1");
  const [metaAds, setMetaAds] = useState({
    views: true,
    clicks: true,
    chats: true,
    conversions: true,
  });

  const handleSave = () => {
    console.log("Guardar configuración", { name, metaAds });
    alert("Configuración guardada (demo)");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">General</h1>

      {/* Nombre del proyecto */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Nombre de la organización
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-md rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white"
        />
      </div>

      {/* Meta Ads */}
      <div>
        <h2 className="text-sm font-medium text-white/70 mb-3">
          Meta Ads – atribución de campañas
        </h2>
        {[
          ["views", "Vistas de página", "Cuando un visitante visita una página"],
          ["clicks", "Clicks en botón", "Cuando un visitante hace click en un botón"],
          ["chats", "Inicio de conversaciones", "Cuando inicia una conversación en WhatsApp"],
          ["conversions", "Conversiones", "Cuando ocurre una venta en tu chat de WhatsApp"],
        ].map(([key, title, desc]) => (
          <label key={key} className="flex items-start gap-2 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={metaAds[key]}
              onChange={() => setMetaAds({ ...metaAds, [key]: !metaAds[key] })}
              className="mt-1 accent-emerald-500"
            />
            <div>
              <div className="text-white/90 text-sm font-medium">{title}</div>
              <div className="text-white/40 text-xs">{desc}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          className="rounded-md bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-medium text-black"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}