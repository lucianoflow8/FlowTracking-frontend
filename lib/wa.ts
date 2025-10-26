export function waLink(phoneE164?: string, message?: string) {
  const base = "https://wa.me/";
  const p = (phoneE164 || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(message || "");
  return p ? `${base}${p}?text=${text}` : `${base}?text=${text}`;
}



