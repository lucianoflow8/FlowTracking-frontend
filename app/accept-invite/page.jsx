"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState("Verificando invitación...");

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token) {
        setStatus("❌ Token inválido o inexistente");
        return;
      }

      const { data, error } = await supabase.rpc("accept_project_invite", { _token: token });

      if (error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus("✅ Invitación aceptada correctamente. Redirigiendo...");
        setTimeout(() => router.push("/projects"), 2500);
      }
    };

    acceptInvite();
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0b0d] text-white">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">FlowTracking</h1>
        <p className="text-lg">{status}</p>
      </div>
    </main>
  );
}



