import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { unlockAnalysis } from './actions'
import { makeQueryBuilder } from '@/test/fake-supabase'

describe('unlockAnalysis', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockAdminClient.from.mockReset()
        mockAdminClient.rpc.mockReset()
    })

    it('returns Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        const result = await unlockAnalysis('sub-1')

        expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('returns Insufficient credits and never touches analyses when the atomic deduction fails — regression test for the old free-unlock loophole', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.rpc.mockResolvedValueOnce({ data: null, error: null }) // insufficient balance

        const result = await unlockAnalysis('sub-1')

        expect(result).toEqual({ error: 'Insufficient credits' })
        expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('unlocks when the atomic deduction succeeds', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.rpc.mockResolvedValueOnce({ data: true, error: null })
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))

        const result = await unlockAnalysis('sub-1')

        expect(result).toEqual({ success: true })
    })

    it('refunds the credit if the unlock write fails after a successful deduction', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.rpc.mockResolvedValueOnce({ data: true, error: null }) // deduction succeeds
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: { message: 'boom' } })) // unlock write fails

        const result = await unlockAnalysis('sub-1')

        expect(result).toEqual({ error: 'Update failed' })
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('increment_credits', { userid: 'user-1', count: 1 })
    })
})
