"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 💵 Precio por crédito
const PRICE_USD = 4; 

export default function CreditsDialog({ onClose, onUpdated }) {
  const [balance, setBalance] = useState(0);
  const [qty, setQty] = useState(15);
  const [loading, setLoading] = useState(false);
  const [hist, setHist] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);

  const totalUSD = useMemo(() => Math.max(0, qty) * PRICE_USD, [qty]);

  const presets = [15, 30, 45, 90, 120, 240, 480, 600, 800, 1000];

  useEffect(() => {
    (async () => {
      const { data: bal } = await supabase.rpc("credits_my_balance");
      setBalance(bal || 0);

      const { data: h } = await supabase
        .from("my_credits_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setHist(h || []);
    })();
  }, []);

  const buyMock = async () => {
    if (!qty || qty <= 0) return;
    setLoading(true);
    const { error } = await supabase.rpc("credits_mock_purchase", {
      qty,
      note: "Compra (mock)",
    });
    setLoading(false);
    if (error) {
      alert(error.message || "No se pudo comprar");
      return;
    }
    await refreshData();
    onUpdated?.();
  };

  const refreshData = async () => {
    const { data: bal } = await supabase.rpc("credits_my_balance");
    setBalance(bal || 0);
    const { data: h } = await supabase
      .from("my_credits_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setHist(h || []);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3">
      <div className="w-full max-w-3xl rounded-xl bg-neutral-900 border border-white/10 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Créditos</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>

        {/* Secciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Compra */}
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-sm text-white/60">Balance actual</div>
            <div className="mt-1 text-2xl font-semibold">{balance} créditos</div>

            <div className="mt-4 text-sm text-white/70">Seleccioná la cantidad</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setQty(p)}
                  className={`px-3 py-1.5 rounded-md border ${
                    qty === p
                      ? "bg-white/15 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="text-sm text-white/70">Cantidad (manual)</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value || "0", 10))}
                className="mt-1 w-full h-10 rounded-md bg-white/5 px-3 outline-none border border-white/10 text-sm"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div>Precio: <b>USD {PRICE_USD.toFixed(2)}</b> / crédito</div>
              <div>Total: <b>USD {totalUSD.toFixed(2)}</b></div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                disabled={loading || !qty || qty <= 0}
                onClick={buyMock}
                className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Comprar (mock)"}
              </button>

              <button
                onClick={() => setShowTransfer(true)}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Transferir créditos
              </button>
            </div>
          </div>

          {/* Historial */}
          <div className="rounded-lg border border-white/10 p-4">
            <div className="mb-2 text-sm font-medium text-white/80">Historial</div>
            <div className="max-h-[320px] overflow-auto divide-y divide-white/5">
              {hist.length === 0 ? (
                <div className="text-sm text-white/60">Sin movimientos</div>
              ) : (
                hist.map((r) => (
                  <div
                    key={r.id}
                    className="py-2 flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium">{labelKind(r.kind)}</div>
                      <div className="text-white/50 text-xs">
                        {new Date(r.created_at).toLocaleString("es-AR")}
                      </div>
                    </div>
                    <div
                      className={`font-semibold ${
                        r.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {r.amount >= 0 ? `+${r.amount}` : r.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal de transferir */}
        {showTransfer && (
          <TransferDialog
            onClose={() => setShowTransfer(false)}
            onDone={async () => {
              await refreshData();
              onUpdated?.();
            }}
          />
        )}
      </div>
    </div>
  );
}

function labelKind(kind) {
  switch (kind) {
    case "purchase":
      return "Compra";
    case "transfer_in":
      return "Recibido";
    case "transfer_out":
      return "Enviado";
    case "use":
      return "Uso";
    case "adjust":
      return "Ajuste";
    default:
      return kind;
  }
}

function TransferDialog({ onClose, onDone }) {
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState(15);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !qty || qty <= 0) return;
    setLoading(true);
    const { error } = await supabase.rpc("credits_transfer", {
      recipient_email: email.trim(),
      qty,
      note: null,
    });
    setLoading(false);
    if (error) {
      alert(error.message || "Error al transferir créditos");
      return;
    }
    onClose?.();
    onDone?.();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-3">
      <div className="w-full max-w-md rounded-xl bg-neutral-900 border border-white/10 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Transferir créditos</h4>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-3">
          <label className="text-sm text-white/70">Email destino</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            className="mt-1 w-full h-10 rounded-md bg-white/5 px-3 outline-none border border-white/10 text-sm"
          />
        </div>

        <div className="mt-3">
          <label className="text-sm text-white/70">Cantidad</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full h-10 rounded-md bg-white/5 px-3 outline-none border border-white/10 text-sm"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}