"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Users2,
  FileText,
  Settings,
  BookOpen,
} from "lucide-react";

const sections = [
  {
    label: "GESTIÓN",
    items: [
      { slug: "analytics", icon: BarChart3, label: "Analytics" },
      { slug: "conversions", icon: TrendingUp, label: "Conversiones" },
      { slug: "agenda", icon: Users2, label: "Agenda" },
    ],
  },
  {
    label: "HERRAMIENTAS",
    items: [
      { slug: "pages", icon: FileText, label: "Páginas" },
      {
        slug: "lines",
        icon: () => (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-[18px] h-[18px] text-white/70"
          >
            <path d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.96L0 24l6.25-1.63A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22.07c-1.87 0-3.69-.5-5.28-1.45l-.38-.23-3.7.97.99-3.61-.25-.37A9.93 9.93 0 0 1 2.07 12C2.07 6.52 6.52 2.07 12 2.07c2.66 0 5.16 1.04 7.03 2.93A9.94 9.94 0 0 1 21.93 12c0 5.48-4.45 9.93-9.93 9.93z" />
            <path d="M17.6 14.32c-.27-.14-1.58-.78-1.82-.87-.24-.09-.41-.14-.58.14-.17.27-.66.87-.81 1.05-.15.18-.3.2-.57.07-.27-.14-1.14-.42-2.17-1.33-.8-.71-1.34-1.58-1.5-1.85-.16-.27-.02-.42.12-.55.12-.12.27-.3.4-.45.14-.15.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.58-1.4-.79-1.93-.21-.5-.43-.43-.58-.44-.15 0-.32-.01-.49-.01-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.85.14.18 1.93 2.94 4.68 4.12.65.28 1.16.45 1.56.57.65.21 1.24.18 1.7.11.52-.08 1.58-.65 1.8-1.29.22-.64.22-1.19.15-1.29-.06-.1-.24-.16-.51-.3z" />
          </svg>
        ),
        label: "Líneas",
      },
      { slug: "settings", icon: Settings, label: "Configuración" },
      { slug: "guide", icon: BookOpen, label: "Guía de uso" },
    ],
  },
];

export default function ProjectSidebar() {
  const { id } = useParams();
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-black/30 backdrop-blur-md">
      <div className="p-5 space-y-8">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="px-2 pb-2 text-[11px] uppercase tracking-wide text-white/40">
              {sec.label}
            </div>
            <nav className="space-y-1">
              {sec.items.map((it) => {
                // 👇 base correcta sin /app
                const href = `/projects/${id}/${it.slug}`;
                const active = pathname.startsWith(href);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.slug}
                    href={href}
                    className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200
                      ${
                        active
                          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <Icon
                      size={18}
                      className={`transition-all ${
                        active
                          ? "text-emerald-400 scale-110"
                          : "opacity-80 group-hover:text-white"
                      }`}
                    />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}



