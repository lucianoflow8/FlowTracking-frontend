// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ✅ Usá variables de entorno (no claves hardcodeadas)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Cliente global (sin header de proyecto)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente con header de proyecto para RLS por project_id
 */
export function createSbWithProject(projectId: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-project-id": projectId,
      },
    },
  });
}