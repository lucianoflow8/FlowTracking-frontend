"use client";
import { useEffect, useState } from "react";
import BuyCreditsModal from "./BuyCreditsModal";
import { supabase } from "@/lib/supabaseClient";

export default function GlobalCreditsButton() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name")
        .order("created_at", { ascending: false });
      if (!error) setProjects(data || []);
    })();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        title="Comprar créditos"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        0 créditos
        <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs text-black font-semibold">+</span>
      </button>

      <BuyCreditsModal
        open={open}
        onClose={() => setOpen(false)}
        projectOptions={projects}
        onPurchased={() => setOpen(false)}
      />
    </>
  );
}