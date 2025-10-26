// app/project/[id]/layout.jsx
"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import ProjectSidebar from "../../components/ProjectSidebar";
import WalletCreditsButton from "@/app/components/WalletCreditsButton"; // <-- nuevo

export const dynamic = "force-dynamic";

function TopBar() {
  const { id } = useParams();
  return (
    <div className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          aria-label="Volver a proyectos"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">Volver a proyectos</span>
        </Link>

        {/* Créditos globales del usuario */}
        <WalletCreditsButton />
      </div>
    </div>
  );
}

export default function ProjectLayout({ children }) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/pages/editor") || pathname.includes("/editor");

  if (isEditor) {
    return (
      <div className="min-h-screen w-full bg-[#0b0b0d] text-white">
        <TopBar />
        <main className="p-0 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0b0b0d] text-white">
      <TopBar />
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-[240px_1fr] gap-6">
        <ProjectSidebar />
        <main className="overflow-y-auto rounded-lg bg-[#111113] p-4">{children}</main>
      </div>
    </div>
  );
}