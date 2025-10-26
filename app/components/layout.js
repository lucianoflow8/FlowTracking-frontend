// frontend/app/app/layout.js
import "../../globals.css"; // ✅ sube dos niveles hasta app/globals.css
import Header from "../components/Header";

export const metadata = {
  title: "FlowTracking — Panel",
};

export default function AppLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0B0B0D] text-white">
        <Header />
        <main className="px-6 py-6">{children}</main>
      </body>
    </html>
  );
}



