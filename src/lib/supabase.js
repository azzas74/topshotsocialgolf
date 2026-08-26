// Supabase client for Top Shot Social Golf Club
//
// Credentials resolve in this order:
//   1. Vite environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)
//   2. The literal values below
//
// Both values are designed to be public. The publishable key only grants what
// your Row Level Security policies allow, and all 32 policies are live on the
// database. Your service_role key is NOT here and must never appear in this repo.
//
// The fallback matters: Vite bakes VITE_* variables in at BUILD time. If they
// aren't present when Vercel builds, they're simply absent from the bundle.
// An earlier version of this file threw an Error in that case, which killed the
// app before React could mount and produced a blank green screen with no
// explanation. It now falls back instead, so a missing variable can never take
// the whole app down.

import { createClient } from '@supabase/supabase-js'

const FALLBACK_URL = 'https://gfzkjlfcajfrcazxkybi.supabase.co'
const FALLBACK_KEY = 'sb_publishable_UhuDN4NJQbYmY57UNPrnvw_NnUEzmZG'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // Visible in the browser console only — never blocks the app from starting.
  console.warn(
    'Supabase environment variables not found in this build; using built-in ' +
    'fallback credentials. To use environment variables instead, set ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel and then ' +
    'trigger a NEW deployment — Vite reads them at build time, so adding them ' +
    'to an existing build has no effect.'
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

export async function searchGolfCourses(courseName) {
  const { data, error } = await supabase.functions.invoke('golf-course-search', {
    body: { courseName },
  })

  if (error) throw error
  return data
}
