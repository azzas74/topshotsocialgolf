import { supabase } from './supabaseClient'

/**
 * Sign in with email + password via Supabase Auth.
 * Throws on failure — catch in the login screen and show error.message.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Fetches the `members` row linked to the currently signed-in auth user.
 * Returns null if:
 *   - nobody is signed in, or
 *   - this auth user hasn't been linked to a members row yet
 *     (see "Linking a member to their login" in the integration README).
 */
export async function getCurrentMember() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Subscribe to auth state changes (sign in / sign out / token refresh).
 * Call the returned unsubscribe function on component unmount.
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => subscription.unsubscribe()
}

/** Convenience role checks — mirror the RLS policies, for UI gating only.
 *  (The database is the real enforcement layer; these just control what
 *  buttons/screens render.) */
export const can = {
  viewOtherProfiles: (member) => member?.role === 'committee' || member?.role === 'administrator',
  manageCourses: (member) => member?.role === 'committee' || member?.role === 'administrator',
  editSchedule: (member) => member?.role === 'administrator',
  addPastRoundForAnyone: (member) => member?.role === 'administrator',
  editAnyHandicap: (member) => member?.role === 'administrator',
  editAnyRound: (member) => member?.role === 'administrator',
  fullAdminPanel: (member) => member?.role === 'administrator',
  editMemberRoles: (member) => member?.role === 'administrator',
}
