import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockUserClient, mockAdminClient } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() }, from: vi.fn() }
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

import { unlockAnalysis, deleteSubmission, togglePublicStatus, addComment, deleteComment } from './actions'
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

describe('deleteSubmission', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
        mockAdminClient.from.mockReset()
    })

    it('returns Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await deleteSubmission('sub-1')).toEqual({ error: 'Unauthorized' })
    })

    it('lets the owner soft-delete their own submission', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementation((table: string) => {
            if (table === 'submissions')
                return makeQueryBuilder({ data: { user_id: 'user-1' }, error: null })
            return makeQueryBuilder({ data: null, error: null })
        })

        const result = await deleteSubmission('sub-1')

        expect(result).toEqual({ success: true })
    })

    it('rejects a non-owner who is not an admin', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-2' } } })
        mockUserClient.from.mockImplementation(() => makeQueryBuilder({ data: { user_id: 'user-1' }, error: null }))
        mockAdminClient.from.mockImplementation(() => makeQueryBuilder({ data: { is_admin: false }, error: null }))

        expect(await deleteSubmission('sub-1')).toEqual({ error: 'Unauthorized' })
    })

    it('lets an admin delete a submission they do not own', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
        mockUserClient.from.mockImplementation((table: string) => {
            if (table === 'submissions') {
                // First call: ownership check (mismatched owner). Second call: the actual update.
                return makeQueryBuilder({ data: { user_id: 'user-1' }, error: null })
            }
            return makeQueryBuilder({ data: null, error: null })
        })
        mockAdminClient.from.mockImplementation(() => makeQueryBuilder({ data: { is_admin: true }, error: null }))

        const result = await deleteSubmission('sub-1')

        expect(result).toEqual({ success: true })
    })

    it('reports failure when the update matches no rows (RLS or bad id)', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

        // First `.from('submissions')` call is the ownership check (finds the
        // owner); the second is the update itself, which matches 0 rows.
        const qbOwner = makeQueryBuilder({ data: { user_id: 'user-1' }, error: null })
        const qbEmptyUpdate = makeQueryBuilder<{ id: string }[]>({ data: [], error: null })
        let callCount = 0
        mockUserClient.from.mockImplementation((table: string) => {
            if (table !== 'submissions') return makeQueryBuilder({ data: null, error: null })
            callCount += 1
            return callCount === 1 ? qbOwner : qbEmptyUpdate
        })

        const result = await deleteSubmission('sub-1')

        expect(result).toEqual({ error: 'Failed to delete: Permission denied or record not found' })
    })
})

describe('togglePublicStatus', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
        mockAdminClient.from.mockReset()
    })

    it('returns Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await togglePublicStatus('sub-1', true)).toEqual({ error: 'Unauthorized' })
    })

    it('rejects a non-owner (there is no admin bypass for this action)', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-2' } } })
        mockUserClient.from.mockImplementation(() => makeQueryBuilder({ data: { user_id: 'user-1' }, error: null }))

        expect(await togglePublicStatus('sub-1', true)).toEqual({ error: 'Unauthorized' })
        expect(mockAdminClient.from).not.toHaveBeenCalled()
    })

    it('lets the owner toggle their submission public/private', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementation(() => makeQueryBuilder({ data: { user_id: 'user-1' }, error: null }))
        mockAdminClient.from.mockImplementation(() => makeQueryBuilder({ data: null, error: null }))

        expect(await togglePublicStatus('sub-1', true)).toEqual({ success: true })
        expect(mockAdminClient.from).toHaveBeenCalledWith('analyses')
    })
})

describe('addComment', () => {
    function commentFormData(fields: Record<string, string>) {
        const fd = new FormData()
        for (const [k, v] of Object.entries(fields)) fd.set(k, v)
        return fd
    }

    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockAdminClient.from.mockReset()
    })

    it('returns Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        const result = await addComment(commentFormData({ submission_id: 'sub-1', text: 'hi' }))

        expect(result).toEqual({ error: 'Unauthorized' })
    })

    it('rejects a comment missing required fields', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

        const result = await addComment(commentFormData({ submission_id: 'sub-1' })) // no text

        expect(result).toEqual({ error: 'Missing Required Fields' })
    })

    it('inserts the comment on success', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.from.mockImplementation(() => makeQueryBuilder({ data: null, error: null }))

        const result = await addComment(commentFormData({ submission_id: 'sub-1', text: 'nice shot', category: 'praise' }))

        expect(result).toEqual({ success: true })
        expect(mockAdminClient.from).toHaveBeenCalledWith('comments')
    })

    it('surfaces the DB error message on insert failure', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockAdminClient.from.mockImplementation(() => makeQueryBuilder({ data: null, error: { message: 'insert failed' } }))

        const result = await addComment(commentFormData({ submission_id: 'sub-1', text: 'nice shot' }))

        expect(result).toEqual({ error: 'Failed to post comment: insert failed' })
    })
})

describe('deleteComment', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
        mockAdminClient.from.mockReset()
    })

    it('returns Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await deleteComment('comment-1')).toEqual({ error: 'Unauthorized' })
    })

    it('returns Not found when the comment does not exist', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementation(() => makeQueryBuilder({ data: null, error: null }))

        expect(await deleteComment('comment-1')).toEqual({ error: 'Not found' })
    })

    it('lets the comment owner delete their own comment', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementation(() =>
            makeQueryBuilder({ data: { user_id: 'user-1', submission_id: 'sub-1' }, error: null })
        )
        mockAdminClient.from.mockImplementation(() => makeQueryBuilder({ data: null, error: null }))

        expect(await deleteComment('comment-1')).toEqual({ success: true })
    })

    it('rejects a non-owner who is not an admin', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-2' } } })
        mockUserClient.from.mockImplementation(() =>
            makeQueryBuilder({ data: { user_id: 'user-1', submission_id: 'sub-1' }, error: null })
        )
        mockAdminClient.from.mockImplementation((table: string) => {
            if (table === 'profiles') return makeQueryBuilder({ data: { is_admin: false }, error: null })
            return makeQueryBuilder({ data: null, error: null })
        })

        expect(await deleteComment('comment-1')).toEqual({ error: 'Unauthorized' })
    })

    it('lets an admin delete a comment they do not own', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
        mockUserClient.from.mockImplementation(() =>
            makeQueryBuilder({ data: { user_id: 'user-1', submission_id: 'sub-1' }, error: null })
        )
        mockAdminClient.from.mockImplementation((table: string) => {
            if (table === 'profiles') return makeQueryBuilder({ data: { is_admin: true }, error: null })
            return makeQueryBuilder({ data: null, error: null })
        })

        expect(await deleteComment('comment-1')).toEqual({ success: true })
    })
})
