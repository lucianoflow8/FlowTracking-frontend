"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children, params }) {
  const pathname = usePathname();
  const base = `/projects/${params.id}/settings`;

  const tabs = [
    { slug: "general", label: "General" },
    { slug: "members", label: "Miembros" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((t) => {
          const href = `${base}/${t.slug}`;
          const active =
            pathname === href || pathname?.startsWith(`${href}?`);
          return (
            <Link
              key={t.slug}
              href={href}
              className={[
                "rounded-t-md px-3 py-2 text-sm",
                active
                  ? "bg-white/[0.06] text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Contenido de la pestaña */}
      {children}
    </div>
  );
}