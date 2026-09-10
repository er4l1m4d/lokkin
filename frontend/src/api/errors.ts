import { ApiError } from './client'

/**
 * Map any thrown error to calm, user-facing copy. Raw backend strings,
 * HTTP status text, and "undefined" never reach the UI through this.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong — try again'): string {
  if (err instanceof ApiError) {
    // 409s carry real, actionable state conflicts — surface them, but friendly
    if (err.status === 409) return friendlyConflict(err.message)
    if (err.status === 404) return "We couldn't find that. It may have been removed."
    if (err.status === 429) return 'Slow down a moment, then try again.'
    if (err.status >= 500) return 'Our server hiccuped — try again in a moment.'
    if (err.status === 0 || err.status === 400) return fallback
  }
  if (err instanceof TypeError) {
    // fetch network failure
    return "Can't reach the server — check your connection."
  }
  return fallback
}

/** 409 messages are state conflicts ("Quiz is not open…") — soften known ones */
function friendlyConflict(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('not open') || m.includes('not available')) {
    return "This quiz isn't taking entries anymore."
  }
  if (m.includes('not live')) {
    return "The quiz hasn't started yet — hang tight in the lobby."
  }
  if (m.includes('time') && m.includes('up')) {
    return "Time is up for this question."
  }
  if (m.includes('already')) {
    return "You've already done that."
  }
  return message // known-safe, human-written backend copy
}
