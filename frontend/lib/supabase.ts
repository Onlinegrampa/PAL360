import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// createBrowserClient stores the session in cookies so the middleware can read it
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
