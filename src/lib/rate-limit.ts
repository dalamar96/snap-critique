import type { SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { Logger } from '@/lib/logger'

/**
 * Checks (and atomically increments) a rate-limit bucket via the
 * check_rate_limit Postgres RPC (supabase/migrations/20260722000000_hardening.sql).
 *
 * Fails OPEN (returns true / allowed) if the RPC errors — e.g. because that
 * migration hasn't been applied yet — logging a warning instead of hard
 * breaking the feature it's protecting. Same "don't let missing
 * infrastructure become an outage" posture as check_and_decrement_credits'
 * callers already use elsewhere in this codebase.
 */
export async function checkRateLimit(
    adminDb: SupabaseClient,
    key: string,
    limit: number,
    windowSeconds: number
): Promise<boolean> {
    const { data, error } = await adminDb.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
    })

    if (error) {
        Logger.warn('[RateLimit] check_rate_limit RPC failed, failing open', { error: error.message, key })
        return true
    }

    return data === true
}

/**
 * Best-effort client IP from the standard forwarding header set by
 * Vercel/most reverse proxies. Server Actions have no direct request
 * object, so this is the only way to key rate limits by IP there.
 */
export async function getClientIp(): Promise<string> {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    return forwarded?.split(',')[0]?.trim() || 'unknown'
}
