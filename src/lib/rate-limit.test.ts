import { describe, it, expect, vi } from 'vitest'
import { checkRateLimit } from './rate-limit'
import { makeFakeSupabase } from '@/test/fake-supabase'

vi.mock('next/headers', () => ({
    headers: vi.fn(async () => ({ get: () => null })),
}))
// Logger.warn (called on the fail-open path) constructs its own admin
// client to write to error_logs — mock it so that doesn't need real
// Supabase env vars in the test environment.
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({ insert: vi.fn(async () => ({ data: null, error: null })) })),
    })),
}))

describe('checkRateLimit', () => {
    it('returns true (allowed) when the RPC reports under the limit', async () => {
        const adminDb = makeFakeSupabase({ rpc: () => ({ data: true, error: null }) })

        expect(await checkRateLimit(adminDb, 'login:1.2.3.4', 10, 60)).toBe(true)
    })

    it('returns false (rejected) when the RPC reports over the limit', async () => {
        const adminDb = makeFakeSupabase({ rpc: () => ({ data: false, error: null }) })

        expect(await checkRateLimit(adminDb, 'login:1.2.3.4', 10, 60)).toBe(false)
    })

    it('fails open (returns true) when the RPC errors — e.g. migration not applied yet', async () => {
        const adminDb = makeFakeSupabase({ rpc: () => ({ data: null, error: { message: 'function not found' } }) })

        expect(await checkRateLimit(adminDb, 'login:1.2.3.4', 10, 60)).toBe(true)
    })

    it('calls the RPC with the expected parameter names', async () => {
        const rpc = vi.fn(async () => ({ data: true, error: null }))
        const adminDb = makeFakeSupabase({ rpc })

        await checkRateLimit(adminDb, 'analyze:user-1', 5, 60)

        expect(rpc).toHaveBeenCalledWith('check_rate_limit', { p_key: 'analyze:user-1', p_limit: 5, p_window_seconds: 60 })
    })
})
