import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'

const { mockAdminClient, mockConstructEvent } = vi.hoisted(() => {
    const mockAdminClient: Record<string, unknown> = {}
    const mockConstructEvent = vi.fn()
    return { mockAdminClient, mockConstructEvent }
})

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))
vi.mock('@/lib/stripe', () => ({
    stripe: { webhooks: { constructEvent: mockConstructEvent } },
}))

import { POST } from './route'

function fakeRequest(body: unknown): Request {
    return {
        text: async () => JSON.stringify(body),
        headers: { get: (name: string) => (name === 'stripe-signature' ? 'sig_test' : null) },
    } as unknown as Request
}

function checkoutSessionEvent(overrides: Record<string, unknown>) {
    return {
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'cs_test_123',
                amount_total: 1499,
                currency: 'usd',
                metadata: {},
                ...overrides,
            },
        },
    }
}

describe('POST /api/webhook', () => {
    let calledTables: string[]

    beforeEach(() => {
        mockConstructEvent.mockReset()
        calledTables = []
        const base = makeFakeSupabase()
        Object.assign(mockAdminClient, base)
        mockAdminClient.from = vi.fn((table: string) => {
            calledTables.push(table)
            return makeQueryBuilder({ data: null, error: null })
        })
        mockAdminClient.rpc = vi.fn(async () => ({ data: null, error: null }))
    })

    it('returns 400 and touches no tables when signature verification fails', async () => {
        mockConstructEvent.mockImplementationOnce(() => {
            throw new Error('invalid signature')
        })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(400)
        expect(calledTables).toHaveLength(0)
    })

    it('logs a transaction and increments credits for a credit-pack purchase', async () => {
        mockConstructEvent.mockReturnValueOnce(
            checkoutSessionEvent({ metadata: { userId: 'user-1', creditAmount: '20' } })
        )

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(calledTables).toContain('transactions')
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('increment_credits', { userid: 'user-1', count: 20 })
    })

    it('falls back to a manual read-modify-write when increment_credits RPC fails', async () => {
        mockConstructEvent.mockReturnValueOnce(
            checkoutSessionEvent({ metadata: { userId: 'user-1', creditAmount: '20' } })
        )
        mockAdminClient.rpc = vi.fn(async () => ({ data: null, error: { message: 'rpc down' } }))
        mockAdminClient.from = vi.fn((table: string) => {
            calledTables.push(table)
            if (table === 'profiles') return makeQueryBuilder({ data: { credits_balance: 5 }, error: null })
            return makeQueryBuilder({ data: null, error: null })
        })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(calledTables).toContain('profiles')
    })

    it('logs an unlock transaction and unlocks the analysis for the legacy single-analysis flow', async () => {
        mockConstructEvent.mockReturnValueOnce(checkoutSessionEvent({ metadata: { analysisId: 'sub-1' } }))

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(calledTables).toContain('transactions')
        expect(calledTables).toContain('analyses')
    })

    it('does nothing to the database for unrelated Stripe event types', async () => {
        mockConstructEvent.mockReturnValueOnce({ type: 'payment_intent.succeeded', data: { object: {} } })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(calledTables).toHaveLength(0)
    })

    it('is idempotent: a redelivered event for an already-processed session does not credit twice', async () => {
        mockConstructEvent.mockReturnValueOnce(
            checkoutSessionEvent({ metadata: { userId: 'user-1', creditAmount: '20' } })
        )
        mockAdminClient.from = vi.fn((table: string) => {
            calledTables.push(table)
            if (table === 'transactions') return makeQueryBuilder({ data: { id: 'existing-tx' }, error: null })
            return makeQueryBuilder({ data: null, error: null })
        })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(mockAdminClient.rpc).not.toHaveBeenCalled()
    })
})
