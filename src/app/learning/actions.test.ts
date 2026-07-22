import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeQueryBuilder } from '@/test/fake-supabase'

const { mockUserClient, mockAdminClient } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() }, from: vi.fn() }
    const mockAdminClient = { from: vi.fn() }
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

import { completeLesson, getUserTotalLearningPoints, getLearningTree, getLessonBySlug } from './actions'

describe('completeLesson', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
        mockAdminClient.from.mockReset()
    })

    it('throws Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        await expect(completeLesson('lesson-1')).rejects.toThrow('Unauthorized')
    })

    it('throws Lesson not found when the lesson does not exist', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))

        await expect(completeLesson('lesson-1')).rejects.toThrow('Lesson not found')
    })

    it('completes a top-level lesson (no parent) with no bonus-XP logic triggered', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: { points: 50, parent_id: null }, error: null })
        )
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))

        const result = await completeLesson('lesson-1')

        expect(result).toEqual({ success: true })
        expect(mockAdminClient.from).toHaveBeenCalledTimes(1) // just the one insert, no bonus-check queries
    })

    it('ignores a duplicate-key insert error (lesson already completed) instead of throwing', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: { points: 50, parent_id: null }, error: null })
        )
        mockAdminClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: null, error: { code: '23505', message: 'duplicate key' } })
        )

        await expect(completeLesson('lesson-1')).resolves.toEqual({ success: true })
    })

    it('throws on a non-duplicate insert error', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: { points: 50, parent_id: null }, error: null })
        )
        mockAdminClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: null, error: { code: '23503', message: 'fk violation' } })
        )

        await expect(completeLesson('lesson-1')).rejects.toThrow('fk violation')
    })

    it('does not award bonus XP when not all sibling lessons are completed yet', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        // 1st call: fetch the child lesson being completed
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: { points: 50, parent_id: 'module-1' }, error: null })
        )
        // 2nd call: fetch siblings under module-1
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: [{ id: 'child-1' }, { id: 'child-2' }], error: null })
        )
        // 1st adminDb call: insert child progress
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))
        // 2nd adminDb call: count of completed siblings — only 1 of 2 done
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null, count: 1 }))

        const result = await completeLesson('child-1')

        expect(result).toEqual({ success: true })
        // Only the one insert for the child — no recursive completeLesson(parent) call
        expect(mockAdminClient.from).toHaveBeenCalledTimes(2)
    })

    it('awards bonus XP by recursively completing the parent module when all siblings are done', async () => {
        // completeLesson() calls createClient()/auth.getUser() again on its
        // recursive invocation for the parent, so this needs to resolve twice.
        mockUserClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        // Child lesson fetch
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: { points: 50, parent_id: 'module-1' }, error: null })
        )
        // Siblings under module-1 (just this one lesson)
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: [{ id: 'child-1' }], error: null })
        )
        // Recursive call: parent module lesson fetch (module-1 has no parent itself)
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: { points: 100, parent_id: null }, error: null })
        )

        // adminDb: insert child progress
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))
        // adminDb: count completed siblings — 1 of 1, triggers bonus
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null, count: 1 }))
        // adminDb: insert parent (module) progress, from the recursive completeLesson call
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))

        const result = await completeLesson('child-1')

        expect(result).toEqual({ success: true })
        expect(mockAdminClient.from).toHaveBeenCalledTimes(3)
    })
})

describe('getUserTotalLearningPoints', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
    })

    it('returns 0 when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await getUserTotalLearningPoints()).toBe(0)
    })

    it('sums theory and homework points together', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: [{ points_awarded: 50 }, { points_awarded: 30 }], error: null })
        )
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: [{ points_awarded: 20 }], error: null })
        )

        expect(await getUserTotalLearningPoints()).toBe(100)
    })
})

describe('getLearningTree', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
    })

    it('returns an empty array when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await getLearningTree()).toEqual([])
    })

    it('builds a nested tree and sums child XP up into the parent module', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({
                data: [
                    { id: 'module-1', parent_id: null, order_index: 0, points: 0 },
                    { id: 'child-1', parent_id: 'module-1', order_index: 0, points: 50 },
                    { id: 'child-2', parent_id: 'module-1', order_index: 1, points: 50 },
                ],
                error: null,
            })
        )
        mockUserClient.from.mockImplementationOnce(() =>
            makeQueryBuilder({ data: [{ lesson_id: 'child-1', points_awarded: 50 }], error: null })
        )
        mockUserClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: [], error: null }))

        const tree = await getLearningTree()

        expect(tree).toHaveLength(1)
        const moduleNode = tree[0]
        expect(moduleNode.id).toBe('module-1')
        expect(moduleNode.children).toHaveLength(2)
        expect(moduleNode.children?.find((c) => c.id === 'child-1')?.is_completed).toBe(true)
        expect(moduleNode.children?.find((c) => c.id === 'child-2')?.is_completed).toBe(false)
        // module itself has 0 base points but gains its children's total (50 + 0 = 50, only child-1 has awarded points)
        expect(moduleNode.gained_xp).toBe(50)
    })
})

describe('getLessonBySlug', () => {
    beforeEach(() => {
        mockUserClient.auth.getUser.mockReset()
        mockUserClient.from.mockReset()
    })

    it('returns null when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        expect(await getLessonBySlug('composition-101')).toBeNull()
    })

    it('returns null when no published lesson matches the slug', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
        mockUserClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null }))

        expect(await getLessonBySlug('does-not-exist')).toBeNull()
    })
})
