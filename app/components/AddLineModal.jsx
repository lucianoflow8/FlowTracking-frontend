"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddLineModal({ open, onClose, projectId, onCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const handleCreate = async () => {
    const clean = name.trim();
    if (!clean) {
      setErr("Poné un nombre para la línea.");
      return;
    }
    setSaving(true);
    setErr("");

    const { data, error } = await supabase
      .from("lines")
      .insert([{ project_id: projectId, name: clean }])
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      setErr(error.message || "No se pudo crear la línea.");
      return;
    }

    setName("");
    onClose?.();
    onCreated?.(data);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90%] max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-3">Nueva línea</h2>

        <label className="text-xs text-white/60">Nombre</label>
        <input
          type="text"
          placeholder="Ej: Línea Ventas Norte"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white/80 outline-none placeholder:text-white/40"
        />
        {err && <div className="mt-2 text-sm text-red-400">{err}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? "Creando…" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
