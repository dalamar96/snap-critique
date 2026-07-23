import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'

const { mockUserClient, mockAdminClient } = vi.hoisted(() => {
    const mockUserClient = {
        auth: {
            getUser: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(async () => ({ error: null })),
        },
    }
    const mockAdminClient: Record<string, unknown> = {}
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

import { deleteAccount } from './actions'

function formData(fields: Record<string, string>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
}

describe('deleteAccount', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.auth.signInWithPassword.mockReset()
        mockUserClient.auth.signOut.mockClear()

        const base = makeFakeSupabase()
        Object.assign(mockAdminClient, base)
        mockAdminClient.auth = { admin: { deleteUser: vi.fn(async () => ({ error: null })) } }
    })

    it('returns Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await deleteAccount(formData({ password: 'x' }))).toEqual({ error: 'Unauthorized' })
    })

    it('requires a password to be entered', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1', email: 'a@b.com' } } })

        const result = await deleteAccount(formData({}))

        expect(result.error).toMatch(/password/i)
        expect(mockUserClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('rejects an incorrect password without deleting anything', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1', email: 'a@b.com' } } })
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'bad creds' } })

        const result = await deleteAccount(formData({ password: 'wrong' }))

        expect(result).toEqual({ error: 'Incorrect password.' })
        expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('anonymizes transactions, deletes everything else, and removes the auth user on success', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1', email: 'a@b.com' } } })
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })

        const submissionsBuilder = makeQueryBuilder({
            data: [{ id: 'sub-1', image_path: 'uploads/a.jpg', thumbnail_path: 'previews/a.jpg' }],
            error: null,
        })
        const transactionsBuilder = makeQueryBuilder({ data: null, error: null })
        const profilesDeleteBuilder = makeQueryBuilder({ data: null, error: null })
        const removeFn = vi.fn(async () => ({ data: null, error: null }))
        const deleteUserFn = vi.fn(async () => ({ error: null }))

        mockAdminClient.from = vi.fn((table: string) => {
            if (table === 'submissions') return submissionsBuilder
            if (table === 'transactions') return transactionsBuilder
            if (table === 'profiles') return profilesDeleteBuilder
            return makeQueryBuilder({ data: null, error: null })
        })
        mockAdminClient.storage = { from: vi.fn(() => ({ remove: removeFn })) }
        mockAdminClient.auth = { admin: { deleteUser: deleteUserFn } }

        const result = await deleteAccount(formData({ password: 'correct' }))

        expect(result).toEqual({ success: true })
        expect(transactionsBuilder.update).toHaveBeenCalledWith({ user_id: null })
        expect(profilesDeleteBuilder.delete).toHaveBeenCalled()
        expect(removeFn).toHaveBeenCalledWith(['uploads/a.jpg', 'previews/a.jpg'])
        expect(deleteUserFn).toHaveBeenCalledWith('user-1')
        expect(mockUserClient.auth.signOut).toHaveBeenCalled()
    })

    it('reports an error (without losing the already-removed data) if the final auth-user deletion fails', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1', email: 'a@b.com' } } })
        mockUserClient.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
        mockAdminClient.auth = { admin: { deleteUser: vi.fn(async () => ({ error: { message: 'auth delete failed' } })) } }

        const result = await deleteAccount(formData({ password: 'correct' }))

        expect(result.error).toMatch(/went wrong finalizing/i)
        expect(mockUserClient.auth.signOut).not.toHaveBeenCalled()
    })
})
