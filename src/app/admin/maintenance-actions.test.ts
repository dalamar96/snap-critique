import { describe, it, expect, vi, beforeEach } from 'vitest'

const ops: string[] = []
let selectBatch: { id: string; image_path: string | null; thumbnail_path: string | null }[] = []
let storageError: { message: string } | null = null
let removedPaths: string[] = []

// Records every table operation in order; `.select` on submissions resolves
// to the configured batch, everything else resolves to an empty success.
function builderFor(table: string) {
    let verb = 'select'
    const b: Record<string, unknown> = {}
    const chain = (name: string) => vi.fn((...args: unknown[]) => {
        if (name === 'delete') { verb = 'delete' }
        if (name === 'in' && verb === 'delete') ops.push(`delete:${table}:${JSON.stringify(args[1])}`)
        return b
    })
    for (const m of ['select', 'delete', 'is', 'lt', 'order', 'limit', 'in', 'eq']) b[m] = chain(m)
    b.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve(
            table === 'submissions' && verb === 'select'
                ? { data: selectBatch, error: null, count: 0 }
                : { data: [], error: null, count: 0 }
        ).then(resolve)
    return b
}

const adminDb = {
    from: vi.fn((table: string) => builderFor(table)),
    storage: {
        from: vi.fn(() => ({
            remove: vi.fn(async (paths: string[]) => {
                ops.push('storage:remove')
                removedPaths = paths
                return { error: storageError }
            }),
        })),
    },
}

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/require-admin', () => ({
    requireAdmin: vi.fn(async () => ({ user: { id: 'admin-1' }, adminDb })),
    logAdminAction: vi.fn(async (_db: unknown, _id: string, action: string) => { ops.push(`audit:${action}`) }),
}))

import { purgeExpiredGuestSubmissions } from './maintenance-actions'

describe('purgeExpiredGuestSubmissions', () => {
    beforeEach(() => {
        ops.length = 0
        storageError = null
        removedPaths = []
        selectBatch = [
            { id: 's1', image_path: 'uploads/a.jpg', thumbnail_path: 'previews/a.jpg' },
            { id: 's2', image_path: 'uploads/b.jpg', thumbnail_path: null },
        ]
    })

    it('removes files, then comments, analyses, submissions, then audits', async () => {
        const result = await purgeExpiredGuestSubmissions()

        expect(result.deleted).toBe(2)
        expect(ops).toEqual([
            'storage:remove',
            'delete:comments:["s1","s2"]',
            'delete:analyses:["s1","s2"]',
            'delete:submissions:["s1","s2"]',
            'audit:purge_guest_submissions',
        ])
        // original + convention preview + stored thumbnail, de-duplicated
        expect(removedPaths.sort()).toEqual(
            ['previews/a.jpg', 'previews/b.jpg', 'uploads/a.jpg', 'uploads/b.jpg'].sort()
        )
        expect(result.filesRemoved).toBe(4)
    })

    it('aborts before deleting any rows when storage removal fails', async () => {
        storageError = { message: 'boom' }

        await expect(purgeExpiredGuestSubmissions()).rejects.toThrow(/nothing was deleted/)
        expect(ops).toEqual(['storage:remove'])
    })

    it('does nothing when there are no expired guest submissions', async () => {
        selectBatch = []
        const result = await purgeExpiredGuestSubmissions()

        expect(result).toEqual({ deleted: 0, filesRemoved: 0, remaining: 0 })
        expect(ops).toEqual([])
    })
})
