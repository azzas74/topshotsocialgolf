// Supabase client for Top Shot Social Golf Club
//
// Reads credentials from Vite environment variables. In Vite, ONLY variables
// prefixed with VITE_ are exposed to browser code. These two values are
// designed to be public — the publishable key is safe to ship in a client
// bundle because Row Level Security controls what it can actually read and
// write. Your service_role key is NOT here and must never appear in this repo.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_PUBLISHABLE_KEY in your .env file locally, and in ' +
    'Vercel under Settings -> Environment Variables for deployment.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,      // keep members signed in across app restarts
    autoRefreshToken: true,    // refresh JWTs before they expire
    detectSessionInUrl: true,  // needed for password-reset / magic links later
  },
})

// ---------------------------------------------------------------------------
// Course search helper
// ---------------------------------------------------------------------------
// Calls the golf-course-search Edge Function, which proxies golfcourseapi.com
// server-side so the GolfCourse API key never reaches the browser.
//
// The Edge Function has verify_jwt enabled, so the caller must be signed in.
// supabase.functions.invoke() attaches the current session JWT automatically.
//
// Returns the raw upstream JSON from golfcourseapi.com so the caller can map
// whatever shape the API provides (including full hole/tee data when present).

export async function searchGolfCourses(courseName) {
  const { data, error } = await supabase.functions.invoke('golf-course-search', {
    body: { courseName },
  })

  if (error) throw error
  return data
}
