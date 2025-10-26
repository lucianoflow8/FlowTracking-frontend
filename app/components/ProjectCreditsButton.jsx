"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BuyCreditsModal from "./BuyCreditsModal";

export default function ProjectCreditsButton({ projectId }) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  const load = async () => {
    const { data, error } = await supabase
      .from("project_credits")
      .select("credits")
      .eq("project_id", projectId)
      .single();
    if (!error && data) setBalance(data.credits);
    if (error && error.code === "PGRST116") setBalance(0);
  };

  useEffect(() => {
    if (projectId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        title="Comprar créditos para este proyecto"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        {balance} créditos
        <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs text-black font-semibold">+</span>
      </button>

      <BuyCreditsModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        onPurchased={async (_pid, newCredits) => {
          setBalance(newCredits);
          setOpen(false);
        }}
      />
    </>
  );
}