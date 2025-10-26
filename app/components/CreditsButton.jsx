"use client";
console.log("[UI] CreditsButton v2 activo");

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CircleDollarSign, Plus } from "lucide-react";
import CreditsDialog from "./CreditsDialog"; // 👈 asegúrate que la ruta sea correcta

export default function CreditsButton({ projectId }) {
  const [credits, setCredits] = useState(0);
  const [open, setOpen] = useState(false);

  const loadCredits = async () => {
    if (!projectId) return;
    const { data, error } = await supabase
      .from("project_credits")
      .select("credits")
      .eq("project_id", projectId)
      .single();

    if (!error && data) setCredits(data.credits ?? 0);
    if (error && error.code !== "PGRST116") {
      console.error("loadCredits", error);
    }
  };

  useEffect(() => {
    loadCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          title="Comprar créditos"
        >
          <CircleDollarSign size={16} className="text-emerald-300" />
          <span className="font-medium">{credits}</span>
          <span className="opacity-60">créditos</span>
          <span className="ml-1 grid place-items-center rounded-sm bg-emerald-600 px-1 text-[11px] font-semibold text-black">
            <Plus size={12} />
          </span>
        </button>
      </div>

      {open && (
        <CreditsDialog
          onClose={() => setOpen(false)}
          onUpdated={async () => {
            await loadCredits();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}