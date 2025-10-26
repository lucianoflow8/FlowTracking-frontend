// /lib/WhatsAppCTA.jsx
"use client";

import React from "react";

/** Saca sólo dígitos */
const onlyDigits = (v) => (v || "").replace(/[^\d]/g, "");

/**
 * content.__waOverrides.phone y content.__waOverrides.text
 * llegan desde /app/p/[slug]/page.jsx
 * Además soporta content.whatsapp_phone y content.whatsapp_text.
 */
export default function WhatsAppCTA({ content, label = "CREAR USUARIO", className = "" }) {
  const phone =
    onlyDigits(content?.__waOverrides?.phone) ||
    onlyDigits(content?.whatsapp_phone) ||
    ""; // 👈 sin fallback a ningún número fijo

  const text = content?.__waOverrides?.text ?? content?.whatsapp_text ?? "";

  const handleClick = () => {
    if (!phone) {
      alert("WhatsApp no configurado aún.");
      return;
    }
    const url =
      `https://api.whatsapp.com/send?phone=${phone}` +
      (text ? `&text=${encodeURIComponent(text)}` : "");
    // redirección en la MISMA pestaña (como Convertix)
    window.location.href = url;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        // estilos base (ajustá a tu diseño)
        "text-lg md:text-xl rounded flex items-center justify-center gap-2 px-4 py-3 " +
          "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
      }
    >
      {/* Iconito opcional de WA */}
      <svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19.11 17.27a4.8 4.8 0 0 1-2.05-.45c-.64-.28-1.44-.9-2.2-1.78c-.64-.73-1.08-1.55-1.3-2.41c-.2-.8-.07-1.47.22-2.02l.09-.17c.07-.14.12-.24.16-.32c.12-.22.2-.4.24-.54c.08-.26.01-.49-.21-.67a.86.86 0 0 0-.64-.21c-.16 0-.35.03-.55.1c-.36.12-.66.3-.91.53c-.3.28-.56.64-.77 1.09c-.22.46-.33.94-.33 1.43c0 .52.1 1.05.3 1.59c.23.62.57 1.23 1.02 1.84c.63.86 1.32 1.59 2.06 2.18c.76.6 1.63 1.12 2.6 1.54c.64.27 1.26.46 1.86.57c.64.11 1.23.17 1.79.17c.5 0 1.01-.08 1.5-.24c.58-.2 1.02-.46 1.33-.79c.26-.27.47-.6.65-.98c.11-.24.17-.45.18-.62c.02-.31-.1-.54-.36-.66l-.14-.06c-.27-.13-.61-.27-1.02-.43c-.4-.15-.72-.26-.95-.34c-.27-.1-.51-.08-.71.05c-.2.12-.34.3-.43.55c-.02.06-.06.16-.12.31c-.06.15-.11.26-.16.35c-.08.16-.18.27-.3.34c-.13.08-.3.1-.5.06Z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}