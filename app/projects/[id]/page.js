"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProjectDetail({ params }) {
  const { id } = params;
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, created_at")
          .eq("id", id)
          .single();
        if (error) throw error;
        setProject(data);
      } catch (e) {
        console.error("Error cargando proyecto:", e);
        setError(e.message);
      }
    };
    load();
  }, [id]);

  if (error)
    return (
      <div className="p-6 text-red-400">
        Error cargando el proyecto: {error}
      </div>
    );

  if (!project)
    return <div className="p-6 text-white/60">Cargando proyecto…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <p className="text-sm text-white/50">
        Creado el {new Date(project.created_at).toLocaleString()}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "analytics", title: "Analytics" },
          { href: "conversions", title: "Conversiones" },
          { href: "agenda", title: "Agenda" },
        ].map((c) => (
          <Link
            key={c.href}
            href={`/projects/${id}/${c.href}`} // ✅ corregido (sin /app)
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 hover:bg-white/10 transition"
          >
            <div className="text-lg font-medium">{c.title}</div>
            <div className="text-sm text-white/60">Ir a {c.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}