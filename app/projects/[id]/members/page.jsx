// app/projects/[id]/members/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const isValidEmail = (v = "") => /^\S+@\S+\.\S+$/.test(v.trim());

export default function MembersPage() {
  const { id: projectId } = useParams();

  const [projectName, setProjectName] = useState("tu proyecto");
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [msg, setMsg] = useState("");

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setMsg("");
    try {
      // Nombre del proyecto (usa la columna que tengas: name o title)
      const { data: proj } = await supabase
        .from("projects")
        .select("name, title")
        .eq("id", projectId)
        .single();
      if (proj) setProjectName(proj.name || proj.title || "tu proyecto");

      // Ambas son funciones RPC (no tocan tablas directo)
      const [{ data: m, error: em }, { data: i, error: ei }] = await Promise.all([
        supabase.rpc("list_project_members", { _project_id: projectId }),
        supabase.rpc("list_project_invites", { _project_id: projectId }),
      ]);
      if (em) throw em;
      if (ei) throw ei;
      setMembers(m || []);
      setInvites(i || []);
    } catch (e) {
      console.error("[members load]", e);
      setMsg(e.message || "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  async function invite() {
    setMsg("");
    const _email = email.trim();
    const _role = (role || "editor").trim().toLowerCase();

    if (!isValidEmail(_email)) return alert("Ingresá un email válido");

    try {
      setSending(true);

      // 1) Crear invitación (RPC) -> devuelve { id, token, email, role }
      const { data, error } = await supabase.rpc("invite_user_to_project", {
        _project_id: projectId,
        _email,
        _role,
      });
      console.log("[RPC] invite_user_to_project →", { data, error });
      if (error) throw error;

      // 2) Enviar correo con el botón "Unirme a la organización"
      //    Endpoint propio en /api/invite-email (debe existir)
      const res = await fetch("/api/invite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: _email,
          projectName,
          token: data?.token, // importante
        }),
      });

      const emailResult = await res.json().catch(() => ({}));
      if (!res.ok || emailResult?.ok === false) {
        console.error("Fallo al enviar email:", emailResult);
        alert("Invitación creada, pero el email no se pudo enviar.");
      } else {
        alert(`✅ Invitación enviada correctamente a ${_email}`);
      }

      setEmail("");
      await load();
    } catch (e) {
      console.error("[invite]", e);
      alert(e.message || "No se pudo invitar");
    } finally {
      setSending(false);
    }
  }

  async function revoke(id) {
    if (!confirm("¿Revocar invitación?")) return;
    setRevokingId(id);
    setMsg("");
    try {
      const { data, error } = await supabase.rpc("revoke_project_invite", { _invite_id: id });
      console.log("[RPC] revoke_project_invite →", { data, error });
      if (error) throw error;
      await load();
    } catch (e) {
      console.error("[revoke]", e);
      alert(e.message || "No se pudo revocar la invitación");
    } finally {
      setRevokingId(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <main className="p-6 text-white">
      <h1 className="text-xl font-semibold mb-4">Miembros del proyecto</h1>

      {/* Invitar */}
      <div className="flex gap-2 mb-6 items-center">
        <input
          type="email"
          placeholder="Email para invitar"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md bg-white/10 px-3 py-2 flex-1 outline-none border border-white/15"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-md bg-white/10 px-3 py-2 outline-none border border-white/15 text-sm"
        >
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={invite}
          disabled={sending || !emailOk}
          className="bg-emerald-500 px-4 py-2 rounded-md text-black disabled:opacity-50"
          title={!emailOk ? "Ingresá un email válido" : ""}
        >
          {sending ? "Enviando…" : "Invitar"}
        </button>
      </div>

      {msg && <div className="mb-4 text-sm text-white/70">{msg}</div>}

      {/* Miembros */}
      <section className="mb-8">
        <h2 className="text-lg mb-2">Miembros activos</h2>
        {loading ? (
          <div className="text-white/60">Cargando…</div>
        ) : members.length === 0 ? (
          <div className="text-white/50">No hay miembros todavía.</div>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.user_id} className="bg-white/5 p-2 rounded-md flex justify-between">
                <span>{m.email || m.user_id}</span>
                <span className="text-white/50">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invitaciones */}
      <section>
        <h2 className="text-lg mb-2">Invitaciones pendientes</h2>
        {loading ? (
          <div className="text-white/60">Cargando…</div>
        ) : invites.length === 0 ? (
          <div className="text-white/50">No hay invitaciones pendientes.</div>
        ) : (
          <ul className="space-y-1">
            {invites.map((i) => (
              <li key={i.id} className="bg-white/5 p-2 rounded-md flex items-center justify-between">
                <div className="flex flex-col">
                  <span>{i.email}</span>
                  <span className="text-white/40 text-xs">rol: {i.role || "editor"}</span>
                </div>
                <button
                  onClick={() => revoke(i.id)}
                  disabled={revokingId === i.id}
                  className="text-red-400 text-sm disabled:opacity-50"
                >
                  {revokingId === i.id ? "Revocando…" : "Revocar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}