"use client";
export const dynamic = "force-dynamic";

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
        if (
          error.message?.toLowerCase().includes("email not confirmed") ||
          error.status === 401
        ) {
          setMsg({ type: "error", text: "Verificá tu email antes de iniciar sesión." });
        } else if (error.message?.toLowerCase().includes("invalid login")) {
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
      setMsg({ type: "error", text: err.message || "Error inesperado." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white flex items-center justify-center px-4">
      {/* …tu mismo JSX… */}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}