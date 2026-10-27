'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, logAdminAction } from '@/lib/auth/require-admin'
import { REFERRAL_HOLD_DAYS, REFERRAL_REWARD_PERCENT, REFERRAL_WINDOW_MONTHS } from '@/lib/referrals'
import { buildReferralStats, type AdminReferral, type AdminReward } from './referral-stats'

// Upper bound on rows loaded for the admin view. Aggregation happens in
// app code; move it into SQL if the program outgrows this.
const MAX_ROWS = 5000

type ProfileEmbed = { email: string | null; referral_code?: string | null; referral_rewards_suspended?: boolean } | null

export async function getReferralAdminData() {
    const { adminDb } = await requireAdmin()

    const [referralsRel, rewardsRel] = await Promise.all([
        adminDb
            .from('referrals')
            .select(`
                id, referrer_id, referred_id, created_at,
                referrer:profiles!referrals_referrer_id_fkey(email, referral_code, referral_rewards_suspended),
                referred:profiles!referrals_referred_id_fkey(email)
            `)
            .order('created_at', { ascending: false })
            .limit(MAX_ROWS),
        adminDb
            .from('referral_rewards')
            .select('id, referral_id, referrer_id, stripe_session_id, purchase_credits, purchase_amount, reward_credits, status, release_after, released_at, voided_at, created_at')
            .order('created_at', { ascending: false })
            .limit(MAX_ROWS),
    ])

    if (referralsRel.error) throw new Error(referralsRel.error.message)
    if (rewardsRel.error) throw new Error(rewardsRel.error.message)

    const referrals: AdminReferral[] = (referralsRel.data ?? []).map((r) => {
        const referrer = r.referrer as unknown as ProfileEmbed
        const referred = r.referred as unknown as ProfileEmbed
        return {
            id: r.id,
            referrer_id: r.referrer_id,
            referred_id: r.referred_id,
            created_at: r.created_at,
            referrer_email: referrer?.email ?? null,
            referrer_code: referrer?.referral_code ?? null,
            referrer_suspended: !!referrer?.referral_rewards_suspended,
            referred_email: referred?.email ?? null,
        }
    })
    const rewards = (rewardsRel.data ?? []) as AdminReward[]

    return {
        referrals,
        rewards,
        stats: buildReferralStats(referrals, rewards),
        truncated: referrals.length === MAX_ROWS || rewards.length === MAX_ROWS,
        config: {
            percent: REFERRAL_REWARD_PERCENT,
            holdDays: REFERRAL_HOLD_DAYS,
            windowMonths: REFERRAL_WINDOW_MONTHS,
        },
    }
}

export async function releaseReferralRewardNow(rewardId: string) {
    const { user, adminDb } = await requireAdmin()

    const { data: released, error } = await adminDb.rpc('admin_release_referral_reward', { p_reward_id: rewardId })
    if (error) return { error: error.message }
    if (!released) return { error: 'Reward is no longer pending' }

    await logAdminAction(adminDb, user.id, 'release_referral_reward', { targetTable: 'referral_rewards', targetId: rewardId })
    revalidatePath('/admin/referrals')
    return { success: true }
}

export async function cancelReferralReward(rewardId: string) {
    const { user, adminDb } = await requireAdmin()

    const { data: newStatus, error } = await adminDb.rpc('admin_cancel_referral_reward', { p_reward_id: rewardId })
    if (error) return { error: error.message }
    if (!newStatus) return { error: 'Reward was already cancelled' }

    await logAdminAction(adminDb, user.id, 'cancel_referral_reward', {
        targetTable: 'referral_rewards',
        targetId: rewardId,
        details: { newStatus },
    })
    revalidatePath('/admin/referrals')
    return { success: true, status: newStatus as 'voided' | 'reversed' }
}

export async function setReferrerSuspended(referrerId: string, suspended: boolean) {
    const { user, adminDb } = await requireAdmin()

    const { error } = await adminDb
        .from('profiles')
        .update({ referral_rewards_suspended: suspended })
        .eq('id', referrerId)
    if (error) return { error: error.message }

    await logAdminAction(adminDb, user.id, suspended ? 'suspend_referrer' : 'unsuspend_referrer', {
        targetTable: 'profiles',
        targetId: referrerId,
    })
    revalidatePath('/admin/referrals')
    return { success: true }
}

/**
 * Unlinks a referred user from their referrer, e.g. a self-referral found
 * after the fact. Refused while the referral has pending or released
 * rewards — cancel those first so the credits are dealt with explicitly.
 */
export async function removeReferral(referralId: string) {
    const { user, adminDb } = await requireAdmin()

    const { count, error: countError } = await adminDb
        .from('referral_rewards')
        .select('id', { count: 'exact', head: true })
        .eq('referral_id', referralId)
        .in('status', ['pending', 'released'])
    if (countError) return { error: countError.message }
    if (count) return { error: 'Cancel this referral\'s active rewards before removing it' }

    const { error } = await adminDb.from('referrals').delete().eq('id', referralId)
    if (error) return { error: error.message }

    await logAdminAction(adminDb, user.id, 'remove_referral', { targetTable: 'referrals', targetId: referralId })
    revalidatePath('/admin/referrals')
    return { success: true }
}

export async function runReferralReleaseJob() {
    const { user, adminDb } = await requireAdmin()

    const { data: released, error } = await adminDb.rpc('release_referral_rewards')
    if (error) return { error: error.message }

    await logAdminAction(adminDb, user.id, 'run_referral_release_job', { details: { released } })
    revalidatePath('/admin/referrals')
    return { success: true, released: (released as number) ?? 0 }
}
