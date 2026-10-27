import { format, startOfWeek, subWeeks } from 'date-fns'

export type RewardStatus = 'pending' | 'released' | 'voided' | 'reversed'

export interface AdminReferral {
    id: string
    referrer_id: string
    referred_id: string
    created_at: string
    referrer_email: string | null
    referrer_code: string | null
    referrer_suspended: boolean
    referred_email: string | null
}

export interface AdminReward {
    id: string
    referral_id: string
    referrer_id: string
    stripe_session_id: string
    purchase_credits: number
    purchase_amount: number | null // cents
    reward_credits: number
    status: RewardStatus
    release_after: string
    released_at: string | null
    voided_at: string | null
    created_at: string
}

export interface ReferrerSummary {
    referrer_id: string
    email: string | null
    code: string | null
    suspended: boolean
    signups: number
    paying: number
    revenueCents: number
    creditsEarned: number
    creditsPending: number
    creditsClawedBack: number
}

export interface WeeklyPoint {
    weekStart: string // ISO date
    label: string
    signups: number
    revenue: number // dollars
}

export interface ReferralStats {
    signups: number
    paying: number
    conversionRate: number // 0..1
    revenueCents: number
    creditsPending: number
    creditsReleased: number
    creditsClawedBack: number // reversed after release
    creditsVoided: number // cancelled before release
    refundRate: number // share of rewards voided or reversed, 0..1
    weekly: WeeklyPoint[]
    referrers: ReferrerSummary[]
}

// A reward still backed by a payment (not refunded or charged back).
const isActive = (r: AdminReward) => r.status === 'pending' || r.status === 'released'

const sumCredits = (rewards: AdminReward[], status: RewardStatus) =>
    rewards.filter((r) => r.status === status).reduce((sum, r) => sum + r.reward_credits, 0)

/**
 * Aggregates raw referral + reward rows into the /admin/referrals view.
 * Revenue counts only rewards still backed by a payment, i.e. net of
 * refunds and chargebacks, and only purchases inside the reward window
 * (purchases after it don't create reward rows).
 */
export function buildReferralStats(
    referrals: AdminReferral[],
    rewards: AdminReward[],
    now: Date = new Date(),
    weeks = 12,
): ReferralStats {
    const active = rewards.filter(isActive)
    const payingReferralIds = new Set(active.map((r) => r.referral_id))
    const revenueCents = active.reduce((sum, r) => sum + (r.purchase_amount ?? 0), 0)
    const cancelled = rewards.filter((r) => !isActive(r)).length

    // Weekly trend (weeks start Monday), oldest first.
    const currentWeek = startOfWeek(now, { weekStartsOn: 1 })
    const weekly: WeeklyPoint[] = Array.from({ length: weeks }, (_, i) => {
        const start = subWeeks(currentWeek, weeks - 1 - i)
        return { weekStart: start.toISOString(), label: format(start, 'MMM d'), signups: 0, revenue: 0 }
    })
    const bucket = (iso: string) => {
        const key = startOfWeek(new Date(iso), { weekStartsOn: 1 }).toISOString()
        return weekly.find((w) => w.weekStart === key)
    }
    for (const ref of referrals) {
        const week = bucket(ref.created_at)
        if (week) week.signups++
    }
    for (const reward of active) {
        const week = bucket(reward.created_at)
        if (week) week.revenue += (reward.purchase_amount ?? 0) / 100
    }

    // Per-referrer leaderboard.
    const byReferrer = new Map<string, ReferrerSummary>()
    for (const ref of referrals) {
        let row = byReferrer.get(ref.referrer_id)
        if (!row) {
            row = {
                referrer_id: ref.referrer_id,
                email: ref.referrer_email,
                code: ref.referrer_code,
                suspended: ref.referrer_suspended,
                signups: 0,
                paying: 0,
                revenueCents: 0,
                creditsEarned: 0,
                creditsPending: 0,
                creditsClawedBack: 0,
            }
            byReferrer.set(ref.referrer_id, row)
        }
        row.signups++
        if (payingReferralIds.has(ref.id)) row.paying++
    }
    for (const reward of rewards) {
        const row = byReferrer.get(reward.referrer_id)
        if (!row) continue
        if (isActive(reward)) row.revenueCents += reward.purchase_amount ?? 0
        if (reward.status === 'released') row.creditsEarned += reward.reward_credits
        if (reward.status === 'pending') row.creditsPending += reward.reward_credits
        if (reward.status === 'reversed') row.creditsClawedBack += reward.reward_credits
    }
    const referrers = [...byReferrer.values()].sort(
        (a, b) => b.revenueCents - a.revenueCents || b.signups - a.signups,
    )

    return {
        signups: referrals.length,
        paying: payingReferralIds.size,
        conversionRate: referrals.length ? payingReferralIds.size / referrals.length : 0,
        revenueCents,
        creditsPending: sumCredits(rewards, 'pending'),
        creditsReleased: sumCredits(rewards, 'released'),
        creditsClawedBack: sumCredits(rewards, 'reversed'),
        creditsVoided: sumCredits(rewards, 'voided'),
        refundRate: rewards.length ? cancelled / rewards.length : 0,
        weekly,
        referrers,
    }
}
