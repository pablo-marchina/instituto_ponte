import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não configurados.");
  }

  client ??= createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
    },
  });

  return client;
}
