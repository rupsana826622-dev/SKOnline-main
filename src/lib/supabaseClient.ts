import { createClient } from "@supabase/supabase-js";

// Production direct credentials
export const SUPABASE_URL = "https://wzervtowzffqcgxupjkq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Uh59v8TEI3sIC-DU58noOA_ifFNeqyQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
