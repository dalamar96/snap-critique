import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeFakeSupabase } from '@/test/fake-supabase'

const { mockAdminClient } = vi.hoisted(() => ({ mockAdminClient: {} as Record<string, unknown> }))

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))

import { GET } from './route'

function fakeRequest(authorization?: string): Request {
    return {
        headers: { get: (name: string) => (name === 'authorization' ? authorization ?? null : null) },
    } as unknown as Request
}

describe('GET /api/cron/release-referral-rewards', () => {
    beforeEach(() => {
        vi.stubEnv('CRON_SECRET', 'secret')
        Object.assign(mockAdminClient, makeFakeSupabase({ rpc: () => ({ data: 3, error: null }) }))
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('rejects requests without the cron secret', async () => {
        const res = await GET(fakeRequest('Bearer wrong'))

        expect(res.status).toBe(401)
        expect(mockAdminClient.rpc).not.toHaveBeenCalled()
    })

    it('rejects all requests when CRON_SECRET is not configured', async () => {
        vi.stubEnv('CRON_SECRET', '')

        const res = await GET(fakeRequest('Bearer '))

        expect(res.status).toBe(401)
    })

    it('releases matured rewards and reports the count', async () => {
        const res = await GET(fakeRequest('Bearer secret'))

        expect(res.status).toBe(200)
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('release_referral_rewards')
        expect(await res.json()).toEqual({ released: 3 })
    })

    it('returns 500 when the release RPC fails', async () => {
        Object.assign(mockAdminClient, makeFakeSupabase({ rpc: () => ({ data: null, error: { message: 'db down' } }) }))

        const res = await GET(fakeRequest('Bearer secret'))

        expect(res.status).toBe(500)
    })
})
