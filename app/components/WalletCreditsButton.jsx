"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BuyCreditsModal from "@/app/components/BuyCreditsModal";

export default function WalletCreditsButton() {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  const refresh = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return setBalance(0);
    const { data } = await supabase.from("user_credits").select("credits").eq("user_id", uid).single();
    setBalance(data?.credits ?? 0);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
          {balance} créditos
        </span>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + créditos
        </button>
      </div>

      <BuyCreditsModal
        open={open}
        onClose={() => setOpen(false)}
        onPurchased={() => refresh()}
      />
    </>
  );
}