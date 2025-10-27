// lib/supabaseServer.ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) throw new Error('supabaseUrl is required.');
if (!serviceRoleKey) throw new Error('supabaseKey is required.');

export function getSupabaseServer() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }, // no sesiones en server
    global: { headers: { 'x-ft-runtime': 'server' } },
  });
}