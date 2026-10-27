import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeQueryBuilder } from '@/test/fake-supabase'

const { mockUserClient, mockAdminClient } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() } }
    const mockAdminClient = { from: vi.fn(), rpc: vi.fn() }
    return { mockUserClient, mockAdminClient }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => mockUserClient),
}))
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

import {
    releaseReferralRewardNow,
    cancelReferralReward,
    setReferrerSuspended,
    removeReferral,
    runReferralReleaseJob,
} from './actions'

// requireAdmin()'s is_admin lookup is always the first adminDb.from() call.
function mockAsAdmin() {
    mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
    mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { is_admin: true }, error: null }))
}

function auditCalls() {
    return mockAdminClient.from.mock.calls.filter(([table]) => table === 'admin_audit_log')
}

beforeEach(() => {
    mockUserClient.auth.getUser.mockReset()
    mockAdminClient.from.mockReset().mockImplementation(() => makeQueryBuilder({ data: null, error: null }))
    mockAdminClient.rpc.mockReset().mockResolvedValue({ data: null, error: null })
})

describe('admin referral actions', () => {
    it('reject non-admins', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { is_admin: false }, error: null }))

        await expect(cancelReferralReward('reward-1')).rejects.toThrow('Forbidden')
        expect(mockAdminClient.rpc).not.toHaveBeenCalled()
    })

    it('releases a pending reward and audit-logs it', async () => {
        mockAsAdmin()
        mockAdminClient.rpc.mockResolvedValueOnce({ data: true, error: null })

        const result = await releaseReferralRewardNow('reward-1')

        expect(result).toEqual({ success: true })
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('admin_release_referral_reward', { p_reward_id: 'reward-1' })
        expect(auditCalls()).toHaveLength(1)
    })

    it('reports an error when the reward is no longer pending', async () => {
        mockAsAdmin()
        mockAdminClient.rpc.mockResolvedValueOnce({ data: false, error: null })

        const result = await releaseReferralRewardNow('reward-1')

        expect(result.error).toMatch(/no longer pending/)
        expect(auditCalls()).toHaveLength(0)
    })

    it('returns the new status when cancelling a reward', async () => {
        mockAsAdmin()
        mockAdminClient.rpc.mockResolvedValueOnce({ data: 'reversed', error: null })

        const result = await cancelReferralReward('reward-1')

        expect(result).toEqual({ success: true, status: 'reversed' })
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('admin_cancel_referral_reward', { p_reward_id: 'reward-1' })
    })

    it('suspends a referrer', async () => {
        mockAsAdmin()
        const profilesBuilder = makeQueryBuilder({ data: null, error: null })
        mockAdminClient.from.mockImplementationOnce(() => profilesBuilder)

        const result = await setReferrerSuspended('referrer-1', true)

        expect(result).toEqual({ success: true })
        expect(profilesBuilder.update).toHaveBeenCalledWith({ referral_rewards_suspended: true })
        expect(profilesBuilder.eq).toHaveBeenCalledWith('id', 'referrer-1')
    })

    it('refuses to remove a referral that still has active rewards', async () => {
        mockAsAdmin()
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null, count: 2 }))

        const result = await removeReferral('referral-1')

        expect(result.error).toMatch(/active rewards/)
        expect(mockAdminClient.from).not.toHaveBeenCalledWith('referrals')
    })

    it('removes a referral with no active rewards', async () => {
        mockAsAdmin()
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null, count: 0 }))
        const referralsBuilder = makeQueryBuilder({ data: null, error: null })
        mockAdminClient.from.mockImplementationOnce(() => referralsBuilder)

        const result = await removeReferral('referral-1')

        expect(result).toEqual({ success: true })
        expect(referralsBuilder.delete).toHaveBeenCalled()
        expect(referralsBuilder.eq).toHaveBeenCalledWith('id', 'referral-1')
    })

    it('runs the release job and reports the count', async () => {
        mockAsAdmin()
        mockAdminClient.rpc.mockResolvedValueOnce({ data: 3, error: null })

        const result = await runReferralReleaseJob()

        expect(result).toEqual({ success: true, released: 3 })
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('release_referral_rewards')
    })
})
