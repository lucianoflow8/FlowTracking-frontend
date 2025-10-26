"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const PRICE = 4;                // USD por crédito
const MIN_QTY = 15;             // mínimo permitido
const TIERS = [15, 30, 45, 90, 120, 240, 480, 600, 800, 1000];

export default function BuyCreditsModal({ open, onClose, onPurchased }) {
  // cantidad como string para permitir borrar libre
  const [qtyStr, setQtyStr] = useState("");
  const qty = qtyStr === "" ? NaN : parseInt(qtyStr || "0", 10);
  const isValidQty = Number.isInteger(qty) && qty >= MIN_QTY;

  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const total = useMemo(() => (isValidQty ? qty * PRICE : 0), [qty, isValidQty]);

  // Mapea (user_id -> email) para que la RPC encuentre destinatarios
  const ensureEmailMapping = async () => {
    const { data: ures } = await supabase.auth.getUser();
    const user = ures?.user;
    if (!user) return;
    await supabase
      .from("user_emails")
      .upsert({ user_id: user.id, email: (user.email || "").toLowerCase() });
  };

  const loadBalance = async () => {
    const { data: ures } = await supabase.auth.getUser();
    const uid = ures?.user?.id;
    if (!uid) return setBalance(0);
    const { data } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", uid)
      .single();
    setBalance(data?.credits ?? 0);
  };

  useEffect(() => {
    if (open) {
      ensureEmailMapping();
      loadBalance();
    }
  }, [open]);

  // escucha pedidos de refresco de saldo (post compra/transfer)
  useEffect(() => {
    const fn = () => loadBalance();
    window.addEventListener("refresh-credits-balance", fn);
    return () => window.removeEventListener("refresh-credits-balance", fn);
  }, []);

  const onQtyChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    setQtyStr(digits);
  };

  /* ---------------- COMPRA (mock) ---------------- */
  const purchaseMock = async () => {
    if (!isValidQty) {
      alert(`Ingresá una cantidad válida (mínimo ${MIN_QTY}).`);
      return;
    }
    setLoading(true);
    try {
      const { data: ures, error: uerr } = await supabase.auth.getUser();
      if (uerr || !ures?.user) throw new Error("Sesión no encontrada.");
      const uid = ures.user.id;

      // leer saldo
      const { data: cur, error: selErr } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", uid)
        .single();
      if (selErr && selErr.code !== "PGRST116") throw selErr;

      const newCredits = (cur?.credits ?? 0) + qty;

      // upsert saldo
      const { error: upErr } = await supabase
        .from("user_credits")
        .upsert({ user_id: uid, credits: newCredits, updated_at: new Date().toISOString() });
      if (upErr) throw upErr;

      // historial: compra
      await supabase.from("credits_ledger").insert({
        user_id: uid,
        type: "purchase",
        qty,
        note: `total=USD ${(qty * PRICE).toFixed(2)}${coupon ? `, coupon=${coupon}` : ""}`,
      });

      onPurchased?.(newCredits);
      window.dispatchEvent(new Event("refresh-credits-balance"));
      onClose?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo completar la compra.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- MODAL: TRANSFERIR (usa RPC do_transfer) ---------------- */
  function TransferCreditsModal() {
    const [openT, setOpenT] = useState(false);
    const [email, setEmail] = useState("");
    const [amount, setAmount] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
      const onOpen = () => setOpenT(true);
      window.addEventListener("open-transfer-credits", onOpen);
      return () => window.removeEventListener("open-transfer-credits", onOpen);
    }, []);

    const submit = async () => {
      const qtyT = parseInt((amount || "0").replace(/\D/g, ""), 10);
      if (!email || !Number.isInteger(qtyT) || qtyT < MIN_QTY) {
        alert(`Completá email y un monto válido (mínimo ${MIN_QTY}).`);
        return;
      }

      setSending(true);
      try {
        const { error } = await supabase.rpc("do_transfer", {
          p_to_email: email.trim().toLowerCase(),
          p_qty: qtyT,
        });
        if (error) throw error;

        alert("Transferencia realizada con éxito.");
        setOpenT(false);
        setEmail("");
        setAmount("");
        window.dispatchEvent(new Event("refresh-credits-balance"));
        // abrir historial para ver movimiento
        window.dispatchEvent(new CustomEvent("open-credits-history"));
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes("DEST_NOT_FOUND")) {
          alert("El destinatario no fue encontrado. Verificá el email.");
        } else if (msg.includes("NO_BALANCE")) {
          alert("No tenés saldo suficiente.");
        } else if (msg.includes("MIN_QTY")) {
          alert(`El mínimo es ${MIN_QTY} créditos.`);
        } else if (msg.includes("CANT_SELF")) {
          alert("No podés transferirte a vos mismo.");
        } else {
          alert("No se pudo completar la transferencia.");
        }
        console.error(e);
      } finally {
        setSending(false);
      }
    };

    if (!openT) return null;
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f1012] p-4">
          <div className="mb-2 text-lg font-semibold">Transferir créditos</div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1 text-white/70">Email destino</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 outline-none"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <div className="mb-1 text-white/70">Cantidad</div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="h-9 w-40 rounded-md border border-white/10 bg-white/5 px-3 outline-none"
                placeholder={String(MIN_QTY)}
              />
              <div className="mt-1 text-xs text-white/50">Mínimo {MIN_QTY} créditos.</div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setOpenT(false)}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              disabled={sending}
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={sending}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- MODAL: HISTORIAL ---------------- */
  function CreditsHistoryModal() {
    const [openH, setOpenH] = useState(false);
    const [rows, setRows] = useState([]);

    useEffect(() => {
      const onOpen = async () => {
        setOpenH(true);
        try {
          const { data: u } = await supabase.auth.getUser();
          const uid = u?.user?.id;
          if (!uid) return setRows([]);
          const { data } = await supabase
            .from("credits_ledger")
            .select("created_at,type,qty,note")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(100);
          setRows(data || []);
        } catch {
          setRows([]);
        }
      };
      window.addEventListener("open-credits-history", onOpen);
      return () => window.removeEventListener("open-credits-history", onOpen);
    }, []);

    const label = (t) =>
      t === "purchase"
        ? "Compra"
        : t === "transfer_out"
        ? "Transferencia salida"
        : t === "transfer_in"
        ? "Transferencia entrada"
        : t;

    if (!openH) return null;
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#0f1012] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg font-semibold">Historial de créditos</div>
            <button
              onClick={() => setOpenH(false)}
              className="rounded-md border border-white/10 px-2 py-1 text-sm text-white/70 hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
              Sin movimientos registrados todavía.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto rounded-md border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-left">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        {new Date(r.created_at).toLocaleString("es-AR")}
                      </td>
                      <td className="px-3 py-2">{label(r.type)}</td>
                      <td className="px-3 py-2 text-right">{r.qty}</td>
                      <td className="px-3 py-2">{r.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-white/10 bg-[#0f1012] p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Agregar créditos</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-credits-history"))}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Historial
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-transfer-credits"))}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Transferir créditos
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-white/10 px-2 py-1 text-sm text-white/70 hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Info + balance */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-sm font-medium text-white/80">
              ¿Cómo funcionan los créditos?
            </div>
            <ul className="ml-4 list-disc space-y-1 text-sm text-white/60">
              <li>1 crédito activa una línea por <b>24 horas</b>.</li>
              <li>Podés usarlos en <b>cualquier proyecto</b>.</li>
              <li>Disponibles inmediatamente después de la compra.</li>
            </ul>

            <div className="mt-4">
              <div className="mb-1 text-sm text-white/70">Balance actual</div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
                {balance ?? 0} crédito(s)
              </div>
            </div>
          </div>

          {/* Selección */}
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-sm font-medium text-white/80">Seleccioná la cantidad</div>

            {/* Input libre */}
            <div className="mb-1 flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={qtyStr}
                onChange={onQtyChange}
                className={`h-9 w-32 rounded-md border px-3 text-sm outline-none ${
                  qtyStr !== "" && !isValidQty
                    ? "border-red-500/60 bg-red-500/10 text-red-200"
                    : "border-white/10 bg-white/5 text-white/90"
                }`}
                placeholder={String(MIN_QTY)}
              />
              <span className="text-sm text-white/60">créditos</span>
            </div>
            {qtyStr !== "" && !isValidQty && (
              <div className="mb-2 text-xs font-medium text-red-400">
                Mínimo {MIN_QTY} créditos.
              </div>
            )}

            {/* Botones rápidos */}
            <div className="mt-2 flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setQtyStr(String(t))}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    qty === t
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Cupón opcional */}
            <div className="mt-4">
              <div className="mb-1 text-sm text-white/70">Código de descuento (opcional)</div>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none"
                placeholder="Ingresa tu código de descuento"
              />
            </div>

            {/* Totales */}
            <div className="mt-4 text-sm text-white/70">
              Precio: <b>USD {PRICE.toFixed(2)}</b> / crédito
            </div>
            <div className="mt-1 text-base">
              Total: <b>USD {total.toFixed(2)}</b>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={purchaseMock}
                disabled={loading || !isValidQty}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? "Procesando…" : "Comprar con tarjeta (mock)"}
              </button>
            </div>

            <div className="mt-2 text-xs text-white/50">
              * En producción, redirigir a Stripe/MercadoPago y acreditar al volver. En localhost se suman directo para probar.
            </div>
          </div>
        </div>
      </div>

      {/* Modales auxiliares */}
      <TransferCreditsModal />
      <CreditsHistoryModal />
    </div>
  );
}