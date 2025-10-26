// app/layout.js
import "./globals.css";

export const metadata = { title: "Flow Panel" };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#0b0b0d] text-white">
        {children}

        {/* 🔒 Anti-Pixel (bloquea fbevents.js / fbq en cliente, solo CAPI activo) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  const BAD = /(^https?:\\/\\/connect\\.facebook\\.net\\/)|(^https?:\\/\\/www\\.facebook\\.com\\/tr\\?)/i;

  // Neutraliza fbq si alguien intenta definirlo
  Object.defineProperty(window, 'fbq', {
    configurable: true,
    get(){ return function(){ /* bloqueado */ }; },
    set(){ /* ignorado */ }
  });

  // Bloquea creación de <script src="...fbevents.js">
  const _create = Document.prototype.createElement;
  Document.prototype.createElement = new Proxy(_create, {
    apply(target, thisArg, args){
      const el = Reflect.apply(target, thisArg, args);
      if (String(args?.[0]).toLowerCase() === 'script') {
        const _setAttr = el.setAttribute;
        el.setAttribute = function(name, value){
          try {
            if (name === 'src' && BAD.test(String(value))) return; // ignora
          } catch {}
          return _setAttr.apply(this, arguments);
        };
        Object.defineProperty(el, 'src', {
          set(v){ if (!BAD.test(String(v))) this.setAttribute('src', v); },
          get(){ return ''; }
        });
      }
      return el;
    }
  });

  // Bloquea inyecciones por appendChild o insertBefore
  const patch = (proto, fn) => {
    const orig = proto[fn];
    proto[fn] = function(node){
      try {
        if (node && node.tagName === 'SCRIPT' && BAD.test(node.src || '')) {
          console.warn('⛔ Bloqueado intento de carga Meta Pixel');
          return node; // cancelar
        }
      } catch {}
      return orig.apply(this, arguments);
    };
  };
  patch(Node.prototype, 'appendChild');
  patch(Node.prototype, 'insertBefore');
})();
            `,
          }}
        />
      </body>
    </html>
  );
}