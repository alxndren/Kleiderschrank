import { createClient } from '@supabase/supabase-js';

/** Configure only publishable keys in the browser. Never use service_role here. */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://amlnjmehzewluqaxmdcx.supabase.co';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = publishableKey ? createClient(supabaseUrl, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true },
}) : null;

export const isSupabaseConfigured = Boolean(supabase);
