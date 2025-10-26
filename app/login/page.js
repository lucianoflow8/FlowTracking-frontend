// app/login/page.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

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
        // Mensajes más claros para algunos casos comunes
        if (
          error.message?.toLowerCase().includes("email not confirmed") ||
          error.status === 401
        ) {
          setMsg({
            type: "error",
            text: "Verificá tu email antes de iniciar sesión.",
          });
        } else if (error.message?.toLowerCase().includes("invalid login")) {
          setMsg({
            type: "error",
            text: "Credenciales inválidas. Revisá email y contraseña.",
          });
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
      setMsg({ type: "error", text: err.message || "Error inesperado." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-white/60">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Beta pública
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-white/60">
            Ingresá con tu correo y contraseña.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur"
        >
          <label className="block text-sm text-white/70 mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block text-sm text-white/70 mt-4 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
            placeholder="********"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>

          {msg.text ? (
            <p
              className={`mt-3 text-sm ${
                msg.type === "error"
                  ? "text-red-400"
                  : msg.type === "success"
                  ? "text-emerald-400"
                  : "text-white/70"
              }`}
            >
              {msg.text}
            </p>
          ) : null}

          <p className="mt-4 text-center text-sm text-white/60">
            ¿No tenés una cuenta?{" "}
            <Link href="/signup" className="text-emerald-300 hover:text-emerald-200">
              Crear cuenta
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}



