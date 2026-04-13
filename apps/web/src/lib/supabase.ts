/**
 * Supabase client for authentication.
 *
 * In demo mode (VITE_ENABLE_DEMO_MODE=true), the client is still
 * created but auth is bypassed by AuthContext.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
