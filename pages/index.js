// pages/index.js
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 rounded-lg bg-emerald-500/90 shadow-[0_0_25px_4px_rgba(16,185,129,0.35)]" />
            <span className="font-semibold tracking-tight">FlowTracking</span>
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/60">
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition">Funciones</a>
            <a href="#precio" className="hover:text-white transition">Precio</a>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[680px] rounded-full blur-[90px] bg-emerald-500/10" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-12">
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
              Convierte chats en{" "}
              <span className="text-emerald-400">ventas reales.</span>
            </h1>
            <p className="mt-4 text-white/70">
              La manera más eficiente de escalar tus campañas en Meta Ads con datos reales.
              FlowTracking conecta tus chats, detecta comprobantes de pago y transforma
              tus conversaciones en resultados medibles. Optimización basada en ventas reales,
              no en clics o mensajes.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition shadow-[0_0_35px_-8px_rgba(16,185,129,0.80)]"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-md border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition"
              >
                Iniciar sesión
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/40">
              Sin contratos. Pagás solo créditos activos.{" "}
              <span className="text-white/60">$4 USD</span> c/u.
            </p>
          </div>

          {/* Imagen del panel (encaja completa) */}
          <div className="lg:ml-6">
            <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] shadow-2xl shadow-black/40">
              {/* brillo de fondo */}
              <div className="pointer-events-none absolute -inset-8 rounded-[32px] bg-emerald-500/10 blur-2xl" />
              {/* padding + borde interior */}
              <div className="relative z-10 h-full w-full p-3">
                <div className="relative h-full w-full rounded-lg bg-black/10 overflow-hidden">
                  <Image
                    src="/dashboard-preview.jpg"
                    alt="Vista previa del panel FlowTracking"
                    fill
                    priority
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(min-width:1024px) 560px, 100vw"
                  />
                </div>
              </div>
              {/* degradé para contraste */}
              <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="mt-4 text-xs text-white/40">Vista previa del panel</div>
          </div>
        </div>
      </section>

      {/* Features con íconos animados */}
      <section id="features" className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Escaneo QR WhatsApp Web",
                desc: "Sumá tu línea en segundos con un QR seguro.",
                icon: "/icons/qr.png",
              },
              {
                title: "Optimizamos tus campañas",
                desc: "Cada comprobante que tus clientes comparten se procesa automáticamente y se asocia a tus campañas, permitiendo que el sistema publicitario aprenda de cada venta y mejore tus resultados.",
                icon: "/icons/optimize.png",
              },
              {
                title: "Leads que nunca responden",
                desc: "🚀 Con FlowTracking se terminan los leads de mala calidad. Gracias a nuestro software y detección automática de comprobantes, optimizamos tus campañas a partir de cada venta real. 💰 No pagás por mensaje, pagás por compra.",
                icon: "/icons/leads.png",
              },
              {
                title: "Sin bloqueos de WhatsApp",
                desc: "Nuestro sistema intermedia entre Meta y tus líneas, garantizando comunicación fluida y estable. Gracias a nuestro software y píxeles inteligentes, podés operar sin límites ni interrupciones en tus chats.",
                icon: "/icons/shield.png",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 transition"
              >
                {/* Icono con animación */}
                <div className="relative mb-3 h-8 w-8 rounded-md border border-emerald-500/20 bg-emerald-500/10 overflow-hidden">
                  <Image
                    src={f.icon}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-contain transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                  />
                  {/* Glow sutil */}
                  <span className="pointer-events-none absolute inset-0 rounded-md shadow-[0_0_18px_2px_rgba(16,185,129,0.25)]" />
                </div>

                <h3 className="text-base font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-white/65">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing (conservado) */}
      <section id="precio" className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Precio</h2>
          <p className="mt-1 text-white/60">Un único plan. Créditos que incluyen todo.</p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">Crédito</div>
                <div className="mt-2 flex items-end gap-1">
                  <div className="text-4xl font-semibold">$4</div>
                  <div className="pb-1 text-white/50 text-sm">USD por crédito</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  <li>• Escaneo QR de WhatsApp Web</li>
                  <li>• Detección de comprobantes</li>
                  <li>• Atribución de conversaciones</li>
                  <li>• Autogestión total</li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="mt-6 inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition"
              >
                Crear cuenta
              </Link>

              <p className="mt-2 text-xs text-white/45">Mínimo 15 créditos por compra.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-medium">¿Cómo funcionan?</h3>
              <p className="mt-2 text-sm text-white/70">
                Cada crédito activa una línea por 24 horas. Podés sumar, pausar o agregar días cuando quieras.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-medium">¿Por qué FlowTracking?</h3>
              <p className="mt-2 text-sm text-white/70">
                Porque no medimos clics: medimos ventas reales.
                Tus campañas en Meta Ads se optimizan con datos de facturación, no con mensajes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between text-sm text-white/60">
          <span>©️ {new Date().getFullYear()} FlowTracking</span>
          <a href="#precio" className="hover:text-white transition">Ver precio</a>
        </div>
      </footer>
    </main>
  );
}