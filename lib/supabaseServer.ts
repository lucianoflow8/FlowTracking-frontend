// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

// Variables de entorno (definilas en .env.local o en Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ⚡ Cliente de Supabase con privilegios de servidor
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});