import { describe, it, expect } from 'vitest'
import { buildReferralStats, type AdminReferral, type AdminReward, type RewardStatus } from './referral-stats'

const NOW = new Date('2026-10-28T12:00:00Z') // a Wednesday

function referral(id: string, referrerId: string, createdAt: string, extra: Partial<AdminReferral> = {}): AdminReferral {
    return {
        id,
        referrer_id: referrerId,
        referred_id: `user-${id}`,
        created_at: createdAt,
        referrer_email: `${referrerId}@example.com`,
        referrer_code: `code${referrerId}`,
        referrer_suspended: false,
        referred_email: `${id}@example.com`,
        ...extra,
    }
}

function reward(id: string, referralId: string, referrerId: string, status: RewardStatus, opts: Partial<AdminReward> = {}): AdminReward {
    return {
        id,
        referral_id: referralId,
        referrer_id: referrerId,
        stripe_session_id: `cs_${id}`,
        purchase_credits: 20,
        purchase_amount: 1499,
        reward_credits: 4,
        status,
        release_after: '2026-11-01T00:00:00Z',
        released_at: status === 'released' ? '2026-10-20T00:00:00Z' : null,
        voided_at: null,
        created_at: '2026-10-27T00:00:00Z',
        ...opts,
    }
}

describe('buildReferralStats', () => {
    it('returns zeroed stats and an empty 12-week trend with no data', () => {
        const stats = buildReferralStats([], [], NOW)

        expect(stats.signups).toBe(0)
        expect(stats.conversionRate).toBe(0)
        expect(stats.refundRate).toBe(0)
        expect(stats.weekly).toHaveLength(12)
        expect(stats.weekly.every((w) => w.signups === 0 && w.revenue === 0)).toBe(true)
        expect(stats.referrers).toEqual([])
    })

    it('counts conversion and revenue only from rewards still backed by a payment', () => {
        const referrals = [
            referral('r1', 'a', '2026-10-01T00:00:00Z'),
            referral('r2', 'a', '2026-10-02T00:00:00Z'),
            referral('r3', 'b', '2026-10-03T00:00:00Z'),
            referral('r4', 'b', '2026-10-04T00:00:00Z'),
        ]
        const rewards = [
            reward('w1', 'r1', 'a', 'released'),
            reward('w2', 'r1', 'a', 'pending'),
            reward('w3', 'r2', 'a', 'reversed'), // refunded after payout
            reward('w4', 'r3', 'b', 'voided'), // refunded during hold
        ]

        const stats = buildReferralStats(referrals, rewards, NOW)

        expect(stats.signups).toBe(4)
        expect(stats.paying).toBe(1) // only r1 still has an un-refunded purchase
        expect(stats.conversionRate).toBe(0.25)
        expect(stats.revenueCents).toBe(1499 * 2)
        expect(stats.creditsReleased).toBe(4)
        expect(stats.creditsPending).toBe(4)
        expect(stats.creditsClawedBack).toBe(4)
        expect(stats.creditsVoided).toBe(4)
        expect(stats.refundRate).toBe(0.5)
    })

    it('treats a missing purchase_amount as $0 rather than NaN', () => {
        const stats = buildReferralStats(
            [referral('r1', 'a', '2026-10-01T00:00:00Z')],
            [reward('w1', 'r1', 'a', 'released', { purchase_amount: null })],
            NOW,
        )

        expect(stats.revenueCents).toBe(0)
        expect(stats.referrers[0].revenueCents).toBe(0)
    })

    it('buckets signups and revenue into Monday-start weeks, oldest first, ignoring older data', () => {
        const referrals = [
            referral('r1', 'a', '2026-10-26T09:00:00'), // Monday of the current week
            referral('r2', 'a', '2026-10-25T09:00:00'), // Sunday -> previous week
            referral('r3', 'a', '2025-01-01T09:00:00'), // outside the window
        ]
        const rewards = [reward('w1', 'r1', 'a', 'pending', { created_at: '2026-10-27T09:00:00' })]

        const stats = buildReferralStats(referrals, rewards, NOW)
        const last = stats.weekly[stats.weekly.length - 1]
        const prev = stats.weekly[stats.weekly.length - 2]

        expect(last.signups).toBe(1)
        expect(last.revenue).toBeCloseTo(14.99)
        expect(prev.signups).toBe(1)
        expect(stats.weekly.reduce((s, w) => s + w.signups, 0)).toBe(2)
    })

    it('ranks referrers by net revenue, then signups', () => {
        const referrals = [
            referral('r1', 'a', '2026-10-01T00:00:00Z'),
            referral('r2', 'b', '2026-10-01T00:00:00Z'),
            referral('r3', 'b', '2026-10-01T00:00:00Z'),
            referral('r4', 'c', '2026-10-01T00:00:00Z', { referrer_suspended: true }),
        ]
        const rewards = [reward('w1', 'r4', 'c', 'released', { purchase_amount: 2999 })]

        const stats = buildReferralStats(referrals, rewards, NOW)

        expect(stats.referrers.map((r) => r.referrer_id)).toEqual(['c', 'b', 'a'])
        expect(stats.referrers[0]).toMatchObject({ suspended: true, paying: 1, creditsEarned: 4, signups: 1 })
        expect(stats.referrers[1]).toMatchObject({ signups: 2, paying: 0 })
    })
})
