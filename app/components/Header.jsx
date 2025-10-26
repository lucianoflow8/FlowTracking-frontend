// app/components/Header.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // ⬅️ importa supabase
import ProfileMenu from "./ProfileMenu";

export default function Header({
  onSearch,
  onClickCreate,
  onClickBuyCredits, // botón de compra
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  // 🔐 Al montar (y ante cambios de sesión) guardamos el mapeo user_id ↔ email
  useEffect(() => {
    const upsertEmail = async (user) => {
      try {
        if (!user?.id || !user?.email) return;
        await supabase
          .from("user_emails")
          .upsert({
            user_id: user.id,
            email: user.email.toLowerCase(),
          });
      } catch (e) {
        // no rompemos la UI si falla
        console.warn("user_emails upsert failed:", e?.message || e);
      }
    };

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) await upsertEmail(data.user);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) upsertEmail(session.user);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    onSearch?.(q);
  }, [q, onSearch]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30">
      <div className="mx-auto flex h-14 max-w-full items-center justify-between px-6">
        {/* Logo */}
        <div
          onClick={() => router.push("/projects")}
          className="flex cursor-pointer items-center gap-2"
        >
          <span className="inline-flex h-6 w-6 rounded-lg bg-emerald-500/90 shadow-[0_0_20px_3px_rgba(16,185,129,0.35)]" />
          <span className="font-semibold tracking-tight text-white">Flow Panel</span>
        </div>

        {/* Buscador + +Créditos + Crear + Perfil */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar proyectos..."
              className="h-9 w-64 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/80 outline-none placeholder:text-white/40 transition focus:border-emerald-500/40"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>

          {/* Botón comprar créditos */}
          <button
            onClick={() => onClickBuyCredits?.()}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition"
          >
            + créditos
          </button>

          <button
            onClick={() => onClickCreate?.()}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 transition shadow-md"
          >
            Crear
          </button>

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}