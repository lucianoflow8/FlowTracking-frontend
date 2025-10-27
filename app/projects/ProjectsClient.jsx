// app/projects/ProjectsClient.jsx
"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/components/Header";
import CreateProjectModal from "@/app/components/CreateProjectModal";
import ProjectCard from "@/app/components/ProjectCard";
import BuyCreditsModal from "@/app/components/BuyCreditsModal";

export default function ProjectsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");

  const [credits, setCredits] = useState(0);
  const [openBuy, setOpenBuy] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data: ures, error: uerr } = await supabase.auth.getUser();
      if (uerr || !ures?.user) throw new Error("No hay sesión activa");

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllProjects(data ?? []);
    } catch (e) {
      setErrMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCredits = async () => {
    const { data: ures } = await supabase.auth.getUser();
    const uid = ures?.user?.id;
    if (!uid) return;
    const { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", uid)
      .single();
    setCredits(error ? 0 : data?.credits ?? 0);
  };

  useEffect(() => {
    loadProjects();
    loadCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") setOpenCreate(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProjects;
    return allProjects.filter((p) => p.name?.toLowerCase().includes(q));
  }, [allProjects, search]);

  const onCreateProject = async (nameFromModal) => {
    const name =
      (nameFromModal ?? "").trim() || `Proyecto ${new Date().toLocaleString()}`;
    const { data: ures } = await supabase.auth.getUser();
    if (!ures?.user) return;

    const { data, error } = await supabase
      .from("projects")
      .insert([{ name, user_id: ures.user.id }])
      .select("id")
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setOpenCreate(false);
    router.push(`/projects/${data.id}`);
  };

  return (
    <div className="p-6 space-y-4">
      <Header
        onSearch={(v) => setSearch(v)}
        onClickCreate={() => setOpenCreate(true)}
        credits={credits}
        onClickBuyCredits={() => setOpenBuy(true)}
      />

      <CreateProjectModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={onCreateProject}
      />

      <BuyCreditsModal
        open={openBuy}
        onClose={() => setOpenBuy(false)}
        onPurchased={async () => {
          await loadCredits();
          setOpenBuy(false);
        }}
      />

      {loading && <div className="text-white/60">Cargando proyectos…</div>}
      {errMsg && !loading && <div className="text-red-300">Error: {errMsg}</div>}

      {!loading && !errMsg && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}