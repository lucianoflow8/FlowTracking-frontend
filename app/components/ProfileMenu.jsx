"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function initialsFrom(str = "") {
  const parts = String(str).trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "U";
}

export default function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUser(u);
      const email = u?.email ?? "";
      setDisplayEmail(email);

      // 1) intentá sacar nombre desde metadata con varias claves comunes
      const m = u?.user_metadata || {};
      const metaName =
        m.full_name ||
        m.name ||
        [m.given_name, m.family_name].filter(Boolean).join(" ") ||
        m.user_name ||
        "";

      // 2) si no hay en metadata, probá tabla profiles
      let profName = "";
      let profAvatar = "";
      if (u?.id) {
        const { data: prow } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", u.id)
          .maybeSingle();
        profName = prow?.full_name || "";
        profAvatar = prow?.avatar_url || "";
      }

      // 3) fallback: parte izquierda del email
      const emailName = email?.split("@")[0] ?? "";

      const finalName = metaName || profName || emailName || email;
      setDisplayName(finalName);
      setAvatarUrl(profAvatar || m.avatar_url || "");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_OUT") router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
      setTimeout(() => (window.location.href = "/login"), 120);
    } catch (e) {
      alert(e.message || "No se pudo cerrar sesión");
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm"
        title={displayEmail}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          initialsFrom(displayName)
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initialsFrom(displayName)
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="truncate text-xs text-white/60">{displayEmail}</div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-1 w-full rounded-md bg-white/10 px-3 py-1.5 text-left text-sm hover:bg-white/15 disabled:opacity-60"
          >
            {signingOut ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}