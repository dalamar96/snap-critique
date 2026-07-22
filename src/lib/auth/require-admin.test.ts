import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock factories are hoisted above imports, so the fake clients they
// return must be created via vi.hoisted() rather than referencing
// module-scope consts declared below (those wouldn't be initialized yet).
const { mockUserClient, mockAdminClient } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() } }
    const mockAdminClient = { from: vi.fn(), auth: { getUser: vi.fn() } }
    return { mockUserClient, mockAdminClient }
})

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => mockUserClient),
}))
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))

import { requireAdmin, getIsAdmin } from './require-admin'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'

describe('requireAdmin', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockAdminClient.from.mockReset()
    })

    it('throws Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        await expect(requireAdmin()).rejects.toThrow('Unauthorized')
        expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('throws Forbidden when the user is logged in but not an admin', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { is_admin: false }, error: null }))

        await expect(requireAdmin()).rejects.toThrow('Forbidden')
    })

    it('returns the user and adminDb when the user is an admin', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { is_admin: true }, error: null }))

        const result = await requireAdmin()

        expect(result.user).toEqual({ id: 'user-1' })
        expect(result.adminDb).toBe(mockAdminClient)
    })
})

describe('getIsAdmin', () => {
    it('returns false when no profile row is found', async () => {
        const adminDb = makeFakeSupabase({ from: () => makeQueryBuilder({ data: null, error: null }) })
        expect(await getIsAdmin(adminDb, 'user-1')).toBe(false)
    })

    it('returns false when is_admin is false', async () => {
        const adminDb = makeFakeSupabase({ from: () => makeQueryBuilder({ data: { is_admin: false }, error: null }) })
        expect(await getIsAdmin(adminDb, 'user-1')).toBe(false)
    })

    it('returns true when is_admin is true', async () => {
        const adminDb = makeFakeSupabase({ from: () => makeQueryBuilder({ data: { is_admin: true }, error: null }) })
        expect(await getIsAdmin(adminDb, 'user-1')).toBe(true)
    })
})
