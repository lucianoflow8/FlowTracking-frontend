// app/p/[slug]/page.jsx
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabasePublic";
import { renderTemplatePublicFull } from "@/lib/pageTemplates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicPage({ params, searchParams }) {
  const slug = decodeURIComponent(params.slug || "");

  // 1) Traer datos de la landing de forma tolerante
  const { data, error } = await supabasePublic
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[pages] select error:", error);
    return notFound();
  }
  if (!data) return notFound();

  // Bandera de publicación si existe
  const isPublished =
    (typeof data.is_published === "boolean" && data.is_published) ||
    (typeof data.published === "boolean" && data.published) ||
    true;

  if (!isPublished) return notFound();

  const content = data.content || {};
  const meta = {
    slug: data.slug,
    whatsapp_phone: data.whatsapp_phone || data.wa_phone || null,
    whatsapp_text: data.whatsapp_text || null,
    cta_whatsapp: data.cta_whatsapp || null,
  };

  // 2) UTM params (si vienen)
  const utm = {
    utm_source: searchParams?.utm_source || null,
    utm_medium: searchParams?.utm_medium || null,
    utm_campaign: searchParams?.utm_campaign || null,
    utm_term: searchParams?.utm_term || null,
    utm_content: searchParams?.utm_content || null,
  };

  return (
    <main className="min-h-screen w-full">
      {renderTemplatePublicFull({
        templateId: data.template || "online-apps",
        content,
        meta,
      })}

      {/* ===== Config global accesible desde los scripts del cliente ===== */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__FLOW_PAGE = {
              project_id: ${JSON.stringify(data.project_id)},
              page_id: ${JSON.stringify(data.id)},
              slug: ${JSON.stringify(data.slug)},
              // no usamos fb_pixel_id en cliente para ocultarlo del browser
              utm: ${JSON.stringify(utm)}
            };
          `,
        }}
      />

      {/* ❌ Sin Pixel en el navegador (solo CAPI) */}

      {/* ===== Tu analítica: page-view ===== */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              try {
                const p = window.__FLOW_PAGE;
                const payload = {
                  project_id: p.project_id,
                  page_id: p.page_id,
                  slug: p.slug,
                  utm_source: p.utm?.utm_source || null,
                  utm_medium: p.utm?.utm_medium || null,
                  utm_campaign: p.utm?.utm_campaign || null,
                  utm_term: p.utm?.utm_term || null,
                  utm_content: p.utm?.utm_content || null
                };
                const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
                navigator.sendBeacon("/api/analytics/page-view", blob);
              } catch (err) {
                console.warn("page-view beacon error", err);
              }
            })();
          `,
        }}
      />

      {/* ===== CAPI puro: PageView + Lead en click de WhatsApp ===== */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              function readCookie(n){
                const m=document.cookie.match('(?:^|; )'+encodeURIComponent(n)+'=([^;]*)');
                return m?decodeURIComponent(m[1]):null;
              }
              function capi(evtName){
                try{
                  const p = window.__FLOW_PAGE || {};
                  if (!p.page_id) return;
                  const body = {
                    page_id: p.page_id,
                    event_name: evtName,
                    event_time: Math.floor(Date.now()/1000),
                    source_url: location.href,
                    client_user_agent: navigator.userAgent,
                    fbp: readCookie('_fbp'),
                    fbc: readCookie('_fbc')
                  };
                  fetch("/api/meta/capi", {
                    method:"POST",
                    headers:{ "Content-Type":"application/json" },
                    body: JSON.stringify(body)
                  }).catch(()=>{});
                }catch(e){ console.warn('CAPI post error', e); }
              }

              // CAPI: PageView al cargar
              capi("PageView");

              function isWhatsAppEl(el){
                if (!el) return false;
                const href = el.getAttribute('href') || '';
                const dataHref = el.dataset?.href || '';
                const text = (el.innerText || '').toLowerCase();
                return href.includes('whatsapp.com') || dataHref.includes('whatsapp') || text.includes('whatsapp');
              }

              function sendBeacon(url, payload){
                try {
                  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
                  navigator.sendBeacon(url, blob);
                } catch {
                  fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                }
              }

              document.addEventListener('click', function(ev){
                try{
                  const t = ev.target.closest('a,button,div,span');
                  if (!t || !isWhatsAppEl(t)) return;

                  const p = window.__FLOW_PAGE || {};
                  const small = { project_id: p.project_id, page_id: p.page_id, slug: p.slug };
                  sendBeacon('/api/analytics/click', small);
                  sendBeacon('/api/analytics/chat', small);

                  capi("Lead");
                }catch(e){
                  console.warn('click/chat/capi handler error', e);
                }
              }, true);
            })();
          `,
        }}
      />
    </main>
  );
}