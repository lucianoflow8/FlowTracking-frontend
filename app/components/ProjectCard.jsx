"use client";
import Link from "next/link";

export default function ProjectCard({ project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition"
    >
      <div className="text-lg font-medium">{project.name}</div>
      <div className="mt-1 text-xs text-white/45">
        {new Date(project.created_at).toLocaleDateString()}
      </div>
    </Link>
  );
}
