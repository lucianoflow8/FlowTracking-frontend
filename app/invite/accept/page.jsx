"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AcceptInvitePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";

  const [status, setStatus] = useState("checking"); // checking | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      if (!token) {
        setStatus("error");
        setMessage("Token inválido.");
        return;
      }
      const { error } = await supabase.rpc("accept_project_invite", { _token: token });
      if (error) {
        setStatus("error");
        setMessage(error.message || "No se pudo aceptar la invitación.");
      } else {
        setStatus("ok");
        setMessage("¡Listo! Ya sos miembro del proyecto.");
        // redirigí a donde quieras (dashboard o proyectos)
        setTimeout(() => router.push("/projects"), 1600);
      }
    })();
  }, [token, router]);

  return (
    <main className="min-h-screen grid place-items-center bg-[#0b0b0d] text-white p-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 max-w-md w-full text-center">
        {status === "checking" && <div>Verificando invitación…</div>}
        {status === "ok" && <div className="text-emerald-400">{message}</div>}
        {status === "error" && <div className="text-red-400">{message}</div>}
      </div>
    </main>
  );
}