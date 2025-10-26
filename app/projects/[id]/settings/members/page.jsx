// app/projects/[id]/settings/members/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const isEmail = (v = "") => /^\S+@\S+\.\S+$/.test(v.trim());

export default function MembersPage() {
  const { id: projectId } = useParams();

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form invitar
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor"); // usa los mismos roles que tus policies: "editor" | "admin"
  const emailOk = useMemo(() => isEmail(email), [email]);

  async function loadAll() {
    if (!projectId) return;
    try {
      setLoading(true);
      setErr("");

      const [{ data: m, error: em }, { data: inv, error: ei }] = await Promise.all([
        supabase.rpc("list_project_members", { _project_id: projectId }),
        supabase.rpc("list_project_invites", { _project_id: projectId }),
      ]);
      if (em) throw em;
      if (ei) throw ei;

      setMembers(m || []);
      setInvites(inv || []);
    } catch (e) {
      console.error("[members load]", e);
      setErr(e.message || "Error cargando miembros");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function invite(e) {
    e.preventDefault();
    const _email = email.trim().toLowerCase();
    const _role = (role || "editor").trim().toLowerCase();
    if (!isEmail(_email)) return alert("Email inválido");

    try {
      const { data, error } = await supabase.rpc("invite_user_to_project", {
        _project_id: projectId,
        _email,
        _role,
      });
      console.log("[rpc invite_user_to_project]", { data, error });
      if (error) throw error;
      setEmail("");
      setRole("editor");
      await loadAll();
      alert("Invitación enviada.");
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo invitar.");
    }
  }

  async function revokeInvite(id) {
    if (!confirm("Cancelar esta invitación?")) return;
    try {
      const { data, error } = await supabase.rpc("revoke_project_invite", { _invite_id: id });
      console.log("[rpc revoke_project_invite]", { data, error });
      if (error) throw error;
      await loadAll();
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo cancelar la invitación.");
    }
  }

  // Si tienes una RPC remove_project_member(uuid, uuid) úsala; si no, deja el delete directo solo para admins.
  async function removeMember(userId) {
    if (!confirm("Quitar este miembro del proyecto?")) return;
    try {
      // Preferente (si existe): await supabase.rpc("remove_project_member", { _project_id: projectId, _user_id: userId });
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);
      if (error) throw error;
      await loadAll();
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo quitar el miembro.");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Columna izquierda: Invitaciones */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <h3 className="mb-3 text-base font-semibold">Invitar miembro</h3>
        <form onSubmit={invite} className="space-y-3">
          <input
            type="email"
            required
            placeholder="email@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/60">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!emailOk}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
            title={!emailOk ? "Email inválido" : ""}
          >
            Enviar invitación
          </button>
        </form>

        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium text-white/80">Invitaciones pendientes</h4>
          {invites.length === 0 ? (
            <div className="text-sm text-white/50">No hay invitaciones.</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm">{i.email}</div>
                    <div className="text-xs text-white/40">
                      Rol: {i.role} · {new Date(i.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeInvite(i.id)}
                    className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna derecha: Miembros */}
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 flex items-center gap-3">
          <h3 className="text-base font-semibold">Miembros</h3>
          {loading && <span className="text-xs text-white/40">cargando…</span>}
          {err && <span className="text-xs text-red-400">· {err}</span>}
        </div>

        {members.length === 0 ? (
          <div className="text-sm text-white/50">Aún no hay miembros.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm">Usuario: {m.email || m.user_id}</div>
                  <div className="text-xs text-white/40">Rol: {m.role}</div>
                </div>
                <button
                  onClick={() => removeMember(m.user_id)}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}