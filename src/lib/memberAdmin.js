// src/lib/memberAdmin.js
// -----------------------------------------------------------------------------
// Client helpers for member administration.
//
// All privileged work happens in the `admin-members` Edge Function, which
// re-checks that the caller is an Administrator server-side. Nothing here can be
// abused by editing the bundle — the browser only ever asks; the server decides.
// -----------------------------------------------------------------------------

/**
 * supabase.functions.invoke() returns a generic FunctionsHttpError on any
 * non-2xx response and puts the real message in error.context. This unwraps it
 * so the UI can show something useful instead of "Edge Function returned a
 * non-2xx status code".
 */
async function callAdmin(supabase, body) {
  const { data, error } = await supabase.functions.invoke("admin-members", {
    body,
  });

  if (error) {
    let message = error.message;
    try {
      const detail = await error.context?.json();
      if (detail?.error) message = detail.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  return data;
}

// --- Member CRUD -------------------------------------------------------------

/**
 * Create a member. Email is optional — members without one (e.g. Louis Inns)
 * get a record and appear in scoring, but cannot sign in.
 * Returns { member, tempPassword } — tempPassword is null when no email given.
 */
export function createMember(supabase, { name, email, handicap, role }) {
  return callAdmin(supabase, {
    action: "create",
    name,
    email: email || null,
    handicap,
    role: role || "player",
  });
}

/**
 * Update a member. Only pass the fields you want changed.
 * If you add an email to a member who had none, a sign-in account is created
 * and a tempPassword is returned.
 */
export function updateMember(supabase, memberId, changes) {
  return callAdmin(supabase, { action: "update", memberId, ...changes });
}

/**
 * Archive a member: blocks sign-in and hides them from the active roster,
 * but every round, score and handicap record they own is preserved.
 */
export function archiveMember(supabase, memberId) {
  return callAdmin(supabase, { action: "archive", memberId });
}

export function restoreMember(supabase, memberId) {
  return callAdmin(supabase, { action: "restore", memberId });
}

/**
 * Issue a temporary password. The member is forced to set a new one before
 * they can use the app again.
 * Returns { tempPassword, member } — show tempPassword to the admin once.
 */
export function resetMemberPassword(supabase, memberId, tempPassword) {
  return callAdmin(supabase, {
    action: "reset_password",
    memberId,
    tempPassword: tempPassword || undefined,
  });
}

// --- Forced password change --------------------------------------------------

/**
 * Called by the member from the forced-change screen. Sets the new password,
 * then clears the flag. Order matters: if clearing the flag ran first and the
 * password update failed, the member would be let in on the temp password.
 */
export async function completePasswordChange(supabase, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const { error: pwError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (pwError) throw new Error(pwError.message);

  const { error: rpcError } = await supabase.rpc("complete_password_change");
  if (rpcError) throw new Error(rpcError.message);
}

// --- Session gate ------------------------------------------------------------

/**
 * Run this straight after sign-in and on every auth state change.
 * Returns one of:
 *   { status: 'ok', member }
 *   { status: 'must_change_password', member }
 *   { status: 'archived' }   — caller should sign the user out
 *   { status: 'no_member' }  — auth account with no member row
 */
export async function checkMemberGate(supabase, authUserId) {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return { status: "no_member" };
  if (!data.active) return { status: "archived" };
  if (data.must_change_password) {
    return { status: "must_change_password", member: data };
  }
  return { status: "ok", member: data };
}

// --- Roster loading ----------------------------------------------------------

/**
 * Load members. Archived members are excluded unless includeArchived is true
 * (the admin panel passes true so they can be reviewed and restored).
 */
export async function loadMembers(supabase, { includeArchived = false } = {}) {
  let query = supabase.from("members").select("*").order("name");
  if (!includeArchived) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
