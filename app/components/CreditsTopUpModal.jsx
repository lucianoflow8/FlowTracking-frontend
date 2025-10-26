"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CreditsTopUpModal({
  open,
  onClose,
  onMockPurchase,
}) {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(15);
  const [balance, setBalance] = useState(0);

  // ✅ Cargar créditos reales desde Supabase
  const loadCredits = async () => {
    const { data: ures } = await supabase.auth.getUser();
    const uid = ures?.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", uid)
      .single();
    setBalance(data?.credits ?? 0);
  };

  useEffect(() => {
    if (open) loadCredits();
  }, [open]);

  if (!open) return null;

  const handlePurchase = async () => {
    setLoading(true);
    await onMockPurchase?.(qty);
    setLoading(false);
  };

  const pricePerCredit = 4; // 💰 USD 4 por crédito
  const total = qty * pricePerCredit;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#0f1012] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* IZQUIERDA */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Agregar créditos</h2>
          <ul className="list-disc list-inside text-sm text-white/70 space-y-1 mb-3">
            <li>1 crédito activa una línea por <b>24 horas</b>.</li>
            <li>Podés usarlos en <b>cualquier proyecto</b>.</li>
            <li>Disponibles inmediatamente después de la compra.</li>
          </ul>

          <div className="text-sm text-white/60 mt-4">
            Balance actual:{" "}
            <b className="text-white">{balance}</b> crédito(s)
          </div>
        </div>

        {/* DERECHA */}
        <div>
          <label className="text-sm text-white/70 font-medium mb-2 block">
            Seleccioná la cantidad de créditos
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {[15, 30, 45, 90, 120, 240, 480, 600, 800, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setQty(v)}
                className={`rounded-md border px-3 py-1 text-sm ${
                  qty === v
                    ? "bg-emerald-600 border-emerald-400 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="text-sm text-white/70 mb-4">
            Precio: <b>USD {pricePerCredit.toFixed(2)}</b> / crédito
            <br />
            Total: <b>USD {total.toFixed(2)}</b>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition"
            >
              {loading ? "Procesando..." : "Comprar con tarjeta (mock)"}
            </button>
          </div>

          <p className="mt-2 text-xs text-white/40">
            * En producción este botón redirigiría a Stripe/MercadoPago; en
            localhost se suman directo para probar.
          </p>
        </div>
      </div>
    </div>
  );
}