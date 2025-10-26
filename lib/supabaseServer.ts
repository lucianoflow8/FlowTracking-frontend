// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// Variables de entorno (asegurate de tenerlas en tu .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Crear cliente de Supabase con permisos de servidor
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false, // No guarda sesión en el servidor
  },
});



