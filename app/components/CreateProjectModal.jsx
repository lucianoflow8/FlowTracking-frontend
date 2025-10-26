"use client";
import { useState } from "react";

export default function CreateProjectModal({ open, onClose, onCreate, onSubmit }) {
  const [name, setName] = useState("");
  if (!open) return null;

  const handleCreate = () => {
    const cb = onCreate || onSubmit; // soporta ambos nombres
    if (!cb) return;
    const v = name.trim();
    if (!v) return;
    cb(v);
    setName("");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90%] max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-3">Nuevo proyecto</h2>
        <input
          type="text"
          placeholder="Nombre del proyecto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 p-2 text-sm text-white/80 outline-none placeholder:text-white/40"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
