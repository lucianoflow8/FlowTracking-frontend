import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gzranqfizonlqzjfrgzx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cmFucWZpem9ubHF6amZyZ3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTEwNzQsImV4cCI6MjA3NTgyNzA3NH0.3w4683HHmsNCgFPpoOxswItsGqMRuRh75nj8nYOzYI4";

/**
 * 🔹 Crea un cliente Supabase con el header del proyecto
 * Se usa para leer datos filtrados por project_id en las políticas RLS.
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

/**
 * 🔹 Cliente sin header (para casos globales)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);