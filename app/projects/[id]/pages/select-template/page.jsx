"use client";

import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function SelectTemplatePage() {
  const router = useRouter();
  const { id } = useParams();

  const handleSelect = (template) => {
    router.push(`/projects/${id}/pages/editor?template=${template}`);
  };

  const templates = [
    {
      name: "Landing Page",
      image: "/templates/landing-preview.png", // imagen previa
      description: "Hero + botón de WhatsApp",
      key: "landing",
    },
    {
      name: "Online Apps",
      image: "/templates/online-apps-preview.png",
      description: "Hero con íconos y CTA WhatsApp",
      key: "apps",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white p-8">
      <h1 className="text-2xl font-semibold mb-8 text-center">
        Selecciona una plantilla para empezar
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-center max-w-5xl mx-auto">
        {templates.map((tpl) => (
          <div
            key={tpl.key}
            onClick={() => handleSelect(tpl.key)}
            className="bg-[#18181b] rounded-xl p-4 cursor-pointer border border-transparent hover:border-green-500 transition-all"
          >
            <div className="relative w-full h-56 mb-4">
              <Image
                src={tpl.image}
                alt={tpl.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <h2 className="text-lg font-semibold text-center mb-1">
              {tpl.name}
            </h2>
            <p className="text-gray-400 text-center text-sm">{tpl.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}