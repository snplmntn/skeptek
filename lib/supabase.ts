
import { createClient } from '@supabase/supabase-js';

// safe fallback to prevent build crash if env vars are missing
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'placeholder';

export const supabase = createClient(url, key);
