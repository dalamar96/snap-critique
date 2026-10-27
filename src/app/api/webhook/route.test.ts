import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'

const { mockAdminClient, mockConstructEvent, mockListSessions } = vi.hoisted(() => {
    const mockAdminClient: Record<string, unknown> = {}
    const mockConstructEvent = vi.fn()
    const mockListSessions = vi.fn()
    return { mockAdminClient, mockConstructEvent, mockListSessions }
})

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))
vi.mock('@/lib/stripe', () => ({
    stripe: {
        webhooks: { constructEvent: mockConstructEvent },
        checkout: { sessions: { list: mockListSessions } },
    },
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
        mockListSessions.mockReset()
        mockListSessions.mockResolvedValue({ data: [{ id: 'cs_test_123' }] })
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

    it('queues a pending referral reward for the purchase after a credit-pack purchase', async () => {
        mockConstructEvent.mockReturnValueOnce(
            checkoutSessionEvent({ payment_intent: 'pi_123', metadata: { userId: 'user-1', creditAmount: '20' } })
        )

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('queue_referral_reward', {
            p_referred_id: 'user-1',
            p_session_id: 'cs_test_123',
            p_payment_intent: 'pi_123',
            p_purchase_credits: 20,
            p_purchase_amount: 1499,
            p_percent: 20,
            p_hold_days: 7,
            p_window_months: 12,
        })
    })

    it('does not queue a referral reward for the legacy unlock flow', async () => {
        mockConstructEvent.mockReturnValueOnce(checkoutSessionEvent({ metadata: { analysisId: 'sub-1' } }))

        await POST(fakeRequest({}))

        expect(mockAdminClient.rpc).not.toHaveBeenCalledWith('queue_referral_reward', expect.anything())
    })

    it.each(['charge.refunded', 'charge.dispute.created'])('voids referral rewards for the payment on %s', async (type) => {
        mockConstructEvent.mockReturnValueOnce({ type, data: { object: { payment_intent: 'pi_123' } } })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('void_referral_rewards', { p_payment_intent: 'pi_123' })
    })

    it.each(['charge.refunded', 'charge.dispute.created'])('takes the buyer\'s purchased credits back on %s', async (type) => {
        mockConstructEvent.mockReturnValueOnce({ type, data: { object: { payment_intent: 'pi_123' } } })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(mockListSessions).toHaveBeenCalledWith({ payment_intent: 'pi_123', limit: 1 })
        expect(mockAdminClient.rpc).toHaveBeenCalledWith('reverse_credit_purchase', { p_session_id: 'cs_test_123' })
    })

    it('skips the purchase reversal when no checkout session matches the payment', async () => {
        mockConstructEvent.mockReturnValueOnce({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_other' } } })
        mockListSessions.mockResolvedValueOnce({ data: [] })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(200)
        expect(mockAdminClient.rpc).not.toHaveBeenCalledWith('reverse_credit_purchase', expect.anything())
    })

    it('returns 500 so Stripe retries when the checkout session lookup fails', async () => {
        mockConstructEvent.mockReturnValueOnce({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_123' } } })
        mockListSessions.mockRejectedValueOnce(new Error('stripe down'))

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(500)
    })

    it('returns 500 so Stripe retries when reversing the purchase fails', async () => {
        mockConstructEvent.mockReturnValueOnce({ type: 'charge.dispute.created', data: { object: { payment_intent: 'pi_123' } } })
        mockAdminClient.rpc = vi.fn(async (fn: string) =>
            fn === 'reverse_credit_purchase'
                ? { data: null, error: { message: 'db down' } }
                : { data: null, error: null }
        )

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(500)
    })

    it('returns 500 so Stripe retries when voiding referral rewards fails', async () => {
        mockConstructEvent.mockReturnValueOnce({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_123' } } })
        mockAdminClient.rpc = vi.fn(async () => ({ data: null, error: { message: 'db down' } }))

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(500)
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
