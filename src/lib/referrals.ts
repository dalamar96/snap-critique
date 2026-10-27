import type { SupabaseClient } from '@supabase/supabase-js'

// Referral reward policy. Passed to the queue_referral_reward RPC on each
// purchase; see supabase/migrations/20261026000000_referrals.sql.
//
// Referrers earn this percentage of the credits each referred user buys
// (rounded down, minimum 1)...
export const REFERRAL_REWARD_PERCENT = 20
// ...held this long so a refund/chargeback can void it before it's paid...
export const REFERRAL_HOLD_DAYS = 7
// ...on purchases made within this many months of the referred user's
// signup. null = for the lifetime of the referral.
export const REFERRAL_WINDOW_MONTHS: number | null = 12

export const REFERRAL_COOKIE = 'referral_code'
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const CODE_PATTERN = /^[a-z0-9]{4,32}$/

export function normalizeReferralCode(raw: string | null | undefined): string | null {
    if (!raw) return null
    const code = raw.trim().toLowerCase()
    return CODE_PATTERN.test(code) ? code : null
}

/**
 * Links a newly-signed-up user to the owner of `rawCode`. No-ops (returns
 * false) for an invalid/unknown code, a self-referral, or a user who is
 * already attributed — referred_id is unique, so the first attribution wins.
 */
export async function recordReferral(
    adminDb: SupabaseClient,
    referredUserId: string,
    rawCode: string | null | undefined,
): Promise<boolean> {
    const code = normalizeReferralCode(rawCode)
    if (!code) return false

    const { data: referrer } = await adminDb
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle()

    if (!referrer || referrer.id === referredUserId) return false

    const { error } = await adminDb
        .from('referrals')
        .upsert(
            { referrer_id: referrer.id, referred_id: referredUserId },
            { onConflict: 'referred_id', ignoreDuplicates: true },
        )

    if (error) {
        console.error('[Referrals] Failed to record referral:', error)
        return false
    }
    return true
}
