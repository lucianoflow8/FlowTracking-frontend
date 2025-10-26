// pages/signup.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; // ruta ajustada a app/signup

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);

    const { name, lastname, email, password } = form;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, lastname },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      },
    });

    setLoading(false);

    if (error) {
      setMsg({ type: "error", text: error.message || "Error al registrar." });
      return;
    }
    setMsg({
      type: "success",
      text: "¡Cuenta creada! Verificá tu email y luego iniciá sesión.",
    });
    setForm({ name: "", lastname: "", email: "", password: "" });
  };

  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white flex items-center justify-center px-4">
      {/* Glow suave de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-24 -translate-x-1/2 h-72 w-[680px] rounded-full blur-[100px] bg-emerald-500/10" />
      </div>

      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur">
          <div className="p-6 sm:p-8">
            <div className="mb-1 text-center text-xs text-white/50">
              Beta pública
            </div>
            <h1 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight">
              Crear una cuenta
            </h1>
            <p className="mt-2 text-center text-white/60">
              Empezá gratis. Autogestionado, rápido y seguro.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">Nombre</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="w-full h-11 rounded-md border border-white/10 bg-white/5 px-3 outline-none placeholder:text-white/35 focus:border-white/20"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/70">Apellido</label>
                <input
                  name="lastname"
                  value={form.lastname}
                  onChange={onChange}
                  required
                  className="w-full h-11 rounded-md border border-white/10 bg-white/5 px-3 outline-none placeholder:text-white/35 focus:border-white/20"
                  placeholder="Tu apellido"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="w-full h-11 rounded-md border border-white/10 bg-white/5 px-3 outline-none placeholder:text-white/35 focus:border-white/20"
                  placeholder="tu@ejemplo.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/70">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  minLength={6}
                  className="w-full h-11 rounded-md border border-white/10 bg-white/5 px-3 outline-none placeholder:text-white/35 focus:border-white/20"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center h-11 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition shadow-[0_0_35px_-8px_rgba(16,185,129,0.8)] disabled:opacity-60"
              >
                {loading ? "Creando..." : "Registrarse"}
              </button>

              {msg.text && (
                <p
                  className={`text-sm ${
                    msg.type === "error" ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {msg.text}
                </p>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-white/60">
              ¿Ya tenés una cuenta?{" "}
              <Link href="/login" className="text-white hover:text-emerald-300">
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}



