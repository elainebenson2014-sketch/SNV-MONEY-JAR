// Money Jars — Supabase client.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel
// project's Environment Variables (Settings → Environment Variables),
// using the NEW Money Jars project's URL and anon (publishable) key
// from Supabase → Project Settings → API.

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
