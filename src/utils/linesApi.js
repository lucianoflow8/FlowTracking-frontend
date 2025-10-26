// frontend/src/utils/linesApi.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// CREA una línea (sin id → lo genera la DB)
export async function createLine({ name, projectId }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/lines`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([{ name, project_id: projectId }]),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error creando línea");
  return data;
}

// LISTA líneas (solo columnas que seguro existen)
export async function listLines(projectId) {
  const url =
    `${SUPABASE_URL}/rest/v1/lines` +
    `?select=id,name,project_id` +   // 👈 sin wa_status / wa_phone
    `&project_id=eq.${projectId}`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  let data = [];
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data?.message || `List lines failed (${res.status})`);
  return data;
}

