"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import ProjectDetailClient from "./ProjectDetailClient";

export default function Page({ params }) {
  return (
    <Suspense fallback={<div className="p-6 text-white/60">Cargando…</div>}>
      <ProjectDetailClient id={params.id} />
    </Suspense>
  );
}