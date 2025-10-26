// lib/meta.js
// Utilidades para disparar Pixel y CAPI desde las landings

// ---------- cookies helpers (fbp/fbc) ----------
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// _fbp: si no existe, lo generamos (formato típico)
export function getOrCreateFbp() {
  if (typeof window === "undefined") return undefined;
  let fbp = getCookie("_fbp");
  if (!fbp) {
    const ver = "fb.1";
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 1e10);
    fbp = `${ver}.${ts}.${rand}`;
    document.cookie = `_fbp=${fbp}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=Lax`;
  }
  return fbp;
}

// _fbc: solo existe si hubo fbclid en la URL. Si lo vemos, seteamos cookie.
export function getOrCreateFbc() {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  let fbc = getCookie("_fbc");
  if (fbclid && !fbc) {
    const ver = "fb.1";
    const ts = Date.now();
    fbc = `${ver}.${ts}.${fbclid}`;
    document.cookie = `_fbc=${fbc}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=Lax`;
  }
  return fbc || undefined;
}

// ---------- Pixel (fbq) ----------
export function ensurePixel(pixelId) {
  if (typeof window === "undefined" || !pixelId) return;
  if (window.fbq) return; // ya inicializado

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script");

  window.fbq("init", pixelId);
}

export function trackPixel(eventName, params = {}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

// ---------- CAPI (a tu endpoint Next) ----------
export async function sendCapi({
  pageId,
  eventName,
  externalId, // opcional: email/phone (hash se hace en el server)
  sourceUrl,
}) {
  try {
    const fbp = getOrCreateFbp();
    const fbc = getOrCreateFbc();

    const payload = {
      page_id: pageId,
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      source_url: sourceUrl || (typeof window !== "undefined" ? window.location.href : undefined),
      client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      fbp,
      fbc,
      external_id: externalId || undefined,
    };

    const res = await fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      console.warn("[CAPI] error", json);
    }
    return json;
  } catch (e) {
    console.warn("[CAPI] exception", e);
    return null;
  }
}

// ---------- helper de alto nivel: dispara Pixel + CAPI ----------
export async function trackMetaEvent({
  pixelId,
  pageId,
  eventName,
  externalId, // ej: email/phone si lo tenés
  pixelParams = {},
}) {
  try {
    // Pixel (browser)
    if (pixelId) {
      ensurePixel(pixelId);
      trackPixel(eventName, pixelParams);
    }

    // CAPI (server)
    await sendCapi({ pageId, eventName, externalId });
  } catch (e) {
    console.warn("trackMetaEvent failed:", e);
  }
}