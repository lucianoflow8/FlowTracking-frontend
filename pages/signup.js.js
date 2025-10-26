// pages/signup.js
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMsg(error ? error.message : "¡Revisá tu correo para confirmar la cuenta!");
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0f1512] border border-[#1b2a23] rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-6">Crear cuenta</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#0c1210] border border-[#1b2a23] px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full rounded-lg bg-[#0c1210] border border-[#1b2a23] px-3 py-2 outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 font-medium"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        {msg && <p className="mt-4 text-sm text-emerald-300">{msg}</p>}
      </div>
    </div>
  );
}


