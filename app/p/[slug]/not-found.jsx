// app/p/[slug]/not-found.jsx
export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-[#0b0b0d] text-white grid place-items-center p-6">
      <div className="text-center">
        <div className="text-2xl font-semibold mb-2">Página no encontrada</div>
        <div className="opacity-60">Verificá el slug o que esté publicada.</div>
      </div>
    </main>
  );
}