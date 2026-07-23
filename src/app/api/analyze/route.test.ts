import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { makeFakeSupabase } from '@/test/fake-supabase'

const { mockUserClient, mockAdminClient, mockGenerateContent } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() } }
    const mockAdminClient: Record<string, unknown> = {}
    const mockGenerateContent = vi.fn()
    return { mockUserClient, mockAdminClient, mockGenerateContent }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => mockUserClient),
}))
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))
vi.mock('@/lib/gemini', () => ({
    model: { generateContent: mockGenerateContent },
}))
vi.mock('exifreader', () => ({
    default: { load: vi.fn(() => null) },
}))

import { POST } from './route'

function fakeRequest(body: unknown): NextRequest {
    return { json: async () => body } as unknown as NextRequest
}

function fakeFileData() {
    return {
        arrayBuffer: async () => new ArrayBuffer(8),
        type: 'image/jpeg',
    }
}

describe('POST /api/analyze — credit gate', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockGenerateContent.mockReset()

        // Rebuild the fake admin client fresh each test: a configurable
        // `.from()`/`.rpc()` via makeFakeSupabase, plus storage overridden
        // per-test as needed.
        const base = makeFakeSupabase()
        Object.assign(mockAdminClient, base)
    })

    it('returns 429 and never calls Gemini or the credit RPC when rate-limited', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        const rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: false, error: null } : { data: null, error: null }
        )
        mockAdminClient.rpc = rpc

        const res = await POST(fakeRequest({ imagePath: 'uploads/test.jpg' }))

        expect(res.status).toBe(429)
        expect(mockGenerateContent).not.toHaveBeenCalled()
        expect(rpc).not.toHaveBeenCalledWith('check_and_decrement_credits', expect.anything())
    })

    it('returns 402 and never calls Gemini when the atomic credit deduction fails', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: true, error: null } : { data: null, error: null }
        )

        const res = await POST(fakeRequest({ imagePath: 'uploads/test.jpg' }))

        expect(res.status).toBe(402)
        expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('refunds the credit when Gemini returns unparsable output after a successful deduction', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

        const rpc = vi.fn(async (fn: string) =>
            fn === 'check_and_decrement_credits' || fn === 'check_rate_limit' ? { data: true, error: null } : { data: null, error: null }
        )
        mockAdminClient.rpc = rpc

        // Storage: downloads succeed with a fake file for both preview and original paths.
        mockAdminClient.storage = {
            from: vi.fn(() => ({
                download: vi.fn(async () => ({ data: fakeFileData(), error: null })),
                createSignedUrl: vi.fn(async () => ({ data: null, error: null })),
                remove: vi.fn(async () => ({ data: null, error: null })),
            })),
        }

        mockGenerateContent.mockResolvedValueOnce({ response: { text: () => 'not valid json' } })

        const res = await POST(fakeRequest({ imagePath: 'uploads/test.jpg' }))

        expect(res.status).toBe(500)
        expect(mockGenerateContent).toHaveBeenCalledOnce()
        expect(rpc).toHaveBeenCalledWith('increment_credits', { userid: 'user-1', count: 1 })
    })

    it('does not deduct or refund anything for guest (unauthenticated) requests', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        const rpc = vi.fn(async (fn: string) =>
            fn === 'check_rate_limit' ? { data: true, error: null } : { data: null, error: null }
        )
        mockAdminClient.rpc = rpc

        mockAdminClient.storage = {
            from: vi.fn(() => ({
                download: vi.fn(async () => ({ data: fakeFileData(), error: null })),
                createSignedUrl: vi.fn(async () => ({ data: null, error: null })),
                remove: vi.fn(async () => ({ data: null, error: null })),
            })),
        }

        mockGenerateContent.mockResolvedValueOnce({ response: { text: () => 'not valid json' } })

        await POST(fakeRequest({ imagePath: 'uploads/test.jpg' }))

        expect(rpc).not.toHaveBeenCalledWith('check_and_decrement_credits', expect.anything())
        expect(rpc).not.toHaveBeenCalledWith('increment_credits', expect.anything())
    })
})
