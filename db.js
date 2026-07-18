import { supabase } from './supabaseClient'

/* ============================================================
   MEMBERS
   ============================================================ */

// Committee/Administrator only (enforced by RLS) — full member list
// for the Admin Panel / Members tab. Players will just get their own row.
export async function getMembers() {
  const { data, error } = await supabase.from('members').select('*').order('name')
  if (error) throw error
  return data
}

// Administrator-only write (enforced by RLS + trigger)
export async function updateMemberHandicap(memberId, handicap) {
  const { data, error } = await supabase
    .from('members')
    .update({ handicap, agu_handicap: handicap })
    .eq('id', memberId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMemberRole(memberId, role) {
  const { data, error } = await supabase
    .from('members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()
  if (error) throw error
  return data
}

/* ============================================================
   COURSES & HOLES
   ============================================================ */

export async function getCourses() {
  const { data, error } = await supabase.from('courses').select('*').order('name')
  if (error) throw error
  return data
}

export async function getCourseWithHoles(courseId) {
  const { data: course, error: courseError } = await supabase
    .from('courses').select('*').eq('id', courseId).single()
  if (courseError) throw courseError

  const { data: holes, error: holesError } = await supabase
    .from('holes').select('*').eq('course_id', courseId).order('hole_number')
  if (holesError) throw holesError

  return { ...course, holes }
}

// Committee/Administrator only (enforced by RLS)
export async function addCourse(course) {
  const { data, error } = await supabase.from('courses').insert(course).select().single()
  if (error) throw error
  return data
}

export async function addHoles(courseId, holes) {
  const rows = holes.map(h => ({ ...h, course_id: courseId }))
  const { data, error } = await supabase.from('holes').insert(rows).select()
  if (error) throw error
  return data
}

export async function updateCourse(courseId, updates) {
  const { data, error } = await supabase
    .from('courses').update(updates).eq('id', courseId).select().single()
  if (error) throw error
  return data
}

// Calls the golf-course-search Edge Function (server-side API key —
// see supabase/functions/golf-course-search). Requires a signed-in session.
export async function searchCourseApi(courseName) {
  const { data, error } = await supabase.functions.invoke('golf-course-search', {
    body: { courseName },
  })
  if (error) throw error
  return data
}

/* ============================================================
   SCHEDULE
   ============================================================ */

export async function getSchedule(seasonYear) {
  let query = supabase
    .from('schedule_events')
    .select('*, courses(*)')
    .order('event_date')
  if (seasonYear) query = query.eq('season_year', seasonYear)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Administrator only (enforced by RLS)
export async function addScheduleEvent(event) {
  const { data, error } = await supabase.from('schedule_events').insert(event).select().single()
  if (error) throw error
  return data
}

export async function updateScheduleEvent(eventId, updates) {
  const { data, error } = await supabase
    .from('schedule_events').update(updates).eq('id', eventId).select().single()
  if (error) throw error
  return data
}

export async function deleteScheduleEvent(eventId) {
  const { error } = await supabase.from('schedule_events').delete().eq('id', eventId)
  if (error) throw error
}

/* ============================================================
   ROUNDS & SCORING
   ============================================================ */

export async function getRoundsForMember(memberId) {
  const { data, error } = await supabase
    .from('rounds')
    .select('*, courses(name), hole_scores(*)')
    .eq('member_id', memberId)
    .order('played_at', { ascending: false })
  if (error) throw error
  return data
}

// Used by the Leaderboard — readable by everyone per RLS.
export async function getRoundsForLeaderboard({ scheduleEventId } = {}) {
  let query = supabase
    .from('rounds')
    .select('*, members(name, handicap), courses(name)')
  if (scheduleEventId) query = query.eq('schedule_event_id', scheduleEventId)
  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Submits a completed LIVE round (not historical) for the currently
 * signed-in member: inserts the round, its 18 hole_scores, then triggers
 * the AGU handicap recalculation via the recalculate_handicap() RPC.
 *
 * roundData: { member_id, course_id, schedule_event_id, format,
 *              gross_score, net_score, stableford_points,
 *              daily_handicap, score_differential }
 * holeScores: [{ hole_number, gross_score, stableford_points }, ...]
 */
export async function submitLiveRound(roundData, holeScores) {
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ ...roundData, is_historical: false })
    .select()
    .single()
  if (roundError) throw roundError

  if (holeScores?.length) {
    const rows = holeScores.map(h => ({ ...h, round_id: round.id }))
    const { error: holeError } = await supabase.from('hole_scores').insert(rows)
    if (holeError) throw holeError
  }

  // Recalculates handicap if 3+ rounds are now on file (AGU rules).
  // Safe for a Player to call for their own round — see migration notes.
  const { error: rpcError } = await supabase.rpc('recalculate_handicap', {
    p_round_id: round.id,
  })
  if (rpcError) throw rpcError

  return round
}

// Administrator only (enforced by RLS) — used by the Admin Panel's
// "+ Round" button and the Historical Round Input screen.
export async function addHistoricalRound(roundData, holeScores) {
  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ ...roundData, is_historical: true })
    .select()
    .single()
  if (roundError) throw roundError

  if (holeScores?.length) {
    const rows = holeScores.map(h => ({ ...h, round_id: round.id }))
    const { error: holeError } = await supabase.from('hole_scores').insert(rows)
    if (holeError) throw holeError
  }

  const { error: rpcError } = await supabase.rpc('recalculate_handicap', {
    p_round_id: round.id,
  })
  if (rpcError) throw rpcError

  return round
}

// Administrator only (enforced by RLS)
export async function deleteRound(roundId) {
  const { error } = await supabase.from('rounds').delete().eq('id', roundId)
  if (error) throw error
}

/* ============================================================
   HANDICAP HISTORY
   ============================================================ */

export async function getHandicapHistory(memberId) {
  const { data, error } = await supabase
    .from('handicap_history')
    .select('*')
    .eq('member_id', memberId)
    .order('calculated_at', { ascending: false })
  if (error) throw error
  return data
}

/* ============================================================
   AMBROSE TEAMS
   ============================================================ */

export async function getAmbroseTeams(scheduleEventId) {
  const { data, error } = await supabase
    .from('ambrose_teams')
    .select('*, member_1:member_1_id(name), member_2:member_2_id(name), member_3:member_3_id(name), member_4:member_4_id(name)')
    .eq('schedule_event_id', scheduleEventId)
  if (error) throw error
  return data
}

// Administrator only (enforced by RLS)
export async function saveAmbroseTeam(team) {
  const { data, error } = await supabase.from('ambrose_teams').upsert(team).select().single()
  if (error) throw error
  return data
}
