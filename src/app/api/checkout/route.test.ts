import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const { mockUserClient, mockCreateSession } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() } }
    const mockCreateSession = vi.fn()
    return { mockUserClient, mockCreateSession }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => mockUserClient),
}))
vi.mock('@/lib/stripe', () => ({
    stripe: { checkout: { sessions: { create: mockCreateSession } } },
}))

import { POST } from './route'

function fakeRequest(body: unknown): NextRequest {
    return {
        json: async () => body,
        headers: { get: (name: string) => (name === 'origin' ? 'https://www.snapcritique.com' : null) },
    } as unknown as NextRequest
}

describe('POST /api/checkout', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockCreateSession.mockReset()
    })

    it('returns 400 when no packageId is provided', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

        const res = await POST(fakeRequest({}))

        expect(res.status).toBe(400)
        expect(mockCreateSession).not.toHaveBeenCalled()
    })

    it('returns 401 when a packageId is given but there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        const res = await POST(fakeRequest({ packageId: 'pro' }))

        expect(res.status).toBe(401)
        expect(mockCreateSession).not.toHaveBeenCalled()
    })

    it('returns 400 for an unknown packageId', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

        const res = await POST(fakeRequest({ packageId: 'not-a-real-package' }))

        expect(res.status).toBe(400)
        expect(mockCreateSession).not.toHaveBeenCalled()
    })

    it('creates a Stripe session with the correct credit metadata for a valid package', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockCreateSession.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/session/abc' })

        const res = await POST(fakeRequest({ packageId: 'pro' }))
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.url).toBe('https://checkout.stripe.com/session/abc')
        expect(mockCreateSession).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: { userId: 'user-1', creditAmount: 20, packageId: 'pro' },
            })
        )
    })

    it('returns 500 with the error message when Stripe throws', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockCreateSession.mockRejectedValueOnce(new Error('stripe is down'))

        const res = await POST(fakeRequest({ packageId: 'starter' }))
        const json = await res.json()

        expect(res.status).toBe(500)
        expect(json.error).toBe('stripe is down')
    })
})
