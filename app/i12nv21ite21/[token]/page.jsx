"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [msg, setMsg] = useState("Procesando invitación…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Asegúrate de que el usuario esté logueado antes de aceptar.
        // Si no lo está, lo mandamos al login y volvemos.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // redirige a tu ruta de login con redirect de vuelta
          router.replace(`/login?next=/invite/${token}`);
          return;
        }

        const { error } = await supabase.rpc("accept_project_invite", { _token: token });
        if (error) throw error;

        setMsg("¡Invitación aceptada! Redirigiendo al proyecto…");
        // Si querés, buscá el proyecto y redirigí. Si no, manda al dashboard:
        setTimeout(() => router.replace("/projects"), 1200);
      } catch (e) {
        console.error(e);
        setMsg(e.message || "No se pudo aceptar la invitación.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  return (
    <main className="min-h-screen grid place-items-center text-white">
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 w-[420px] max-w-[92vw] text-center">
        <h1 className="text-xl font-semibold mb-3">Invitación</h1>
        <p className="text-white/80">{msg}</p>
        {loading ? null : (
          <div className="mt-4 text-sm text-white/60">
            Si no pasa nada, <a href="/projects" className="underline">entrar al panel</a>.
          </div>
        )}
      </div>
    </main>
  );
}