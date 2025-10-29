// app/login/LoginClient.jsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // ← sin tipos TS

  const redirectTo = searchParams.get("redirect") || "/projects";

  async function onSubmit(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!email || !pass) {
      setMsg({ type: "error", text: "Completá email y contraseña." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("email not confirmed") || error.status === 401) {
          setMsg({ type: "error", text: "Verificá tu email antes de iniciar sesión." });
        } else if (m.includes("invalid login")) {
          setMsg({ type: "error", text: "Credenciales inválidas." });
        } else {
          setMsg({ type: "error", text: error.message || "Error al ingresar." });
        }
        return;
      }
      if (data?.user) {
        setMsg({ type: "success", text: "¡Sesión iniciada! Redirigiendo…" });
        router.push(redirectTo);
      }
    } catch (err) {
      setMsg({ type: "error", text: (err && err.message) || "Error inesperado." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">FlowTracking</h1>
        {msg.text ? (
          <div className={msg.type === "error" ? "text-red-300" : "text-emerald-300"}>{msg.text}</div>
        ) : null}
        <input
          className="w-full rounded-md bg-white/5 px-3 py-2 border border-white/10 outline-none"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-md bg-white/5 px-3 py-2 border border-white/10 outline-none"
          placeholder="Contraseña"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <button
          disabled={loading}
          className="w-full rounded-md bg-emerald-600/80 hover:bg-emerald-600 px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <div className="text-sm text-white/60">
          ¿No tenés cuenta? <Link href="/signup" className="text-white hover:underline">Registrate</Link>
        </div>
      </form>
    </main>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}