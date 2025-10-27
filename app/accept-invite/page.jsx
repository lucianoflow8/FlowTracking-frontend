"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState("Verificando invitación...");

  useEffect(() => {
    (async () => {
      if (!token) {
        setStatus("❌ Token inválido o inexistente");
        return;
      }
      const { error } = await supabase.rpc("accept_project_invite", { _token: token });
      if (error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus("✅ Invitación aceptada. Redirigiendo…");
        setTimeout(() => router.push("/projects"), 2000);
      }
    })();
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0b0d] text-white">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">FlowTracking</h1>
        <p className="text-lg">{status}</p>
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  );
}