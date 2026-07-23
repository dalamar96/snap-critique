import { describe, it, expect, vi, beforeEach } from 'vitest'
import { makeQueryBuilder } from '@/test/fake-supabase'

const { mockUserClient, mockAdminClient } = vi.hoisted(() => {
    const mockUserClient = { auth: { getUser: vi.fn() } }
    const mockAdminClient = { from: vi.fn(), storage: { from: vi.fn() } }
    return { mockUserClient, mockAdminClient }
})

function defaultQueryBuilder() {
    return makeQueryBuilder({ data: null, error: null })
}

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => mockUserClient),
}))
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(() => mockAdminClient),
}))
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

import { updateUserCredits, restoreSubmission, hardDeleteSubmission, deleteErrorLog } from './actions'

// Every admin action goes through requireAdmin() first, whose is_admin check
// is always the *first* adminDb.from(...) call. These helpers queue that
// check up front so each test only has to set up its own function-specific
// calls afterward.
function mockAsAdmin() {
    mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } })
    mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { is_admin: true }, error: null }))
}

function mockAsNonAdmin() {
    mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { is_admin: false }, error: null }))
}

beforeEach(() => {
    mockUserClient.auth.getUser.mockReset()
    // Persistent default so calls beyond what a test explicitly queues
    // (e.g. the admin_audit_log insert every mutating action now makes)
    // resolve to a harmless empty result instead of undefined.
    mockAdminClient.from.mockReset().mockImplementation(defaultQueryBuilder)
    mockAdminClient.storage.from.mockReset()
})

describe('updateUserCredits', () => {
    it('throws Unauthorized when there is no logged-in user', async () => {
        mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

        await expect(updateUserCredits('user-1', 10)).rejects.toThrow('Unauthorized')
    })

    it('throws Forbidden when the caller is not an admin', async () => {
        mockAsNonAdmin()

        await expect(updateUserCredits('user-1', 10)).rejects.toThrow('Forbidden')
    })

    it('adds the adjustment to the current balance and logs a transaction', async () => {
        mockAsAdmin()
        const currentBalanceBuilder = makeQueryBuilder({ data: { credits_balance: 5 }, error: null })
        const updateBuilder = makeQueryBuilder({ data: null, error: null })
        const transactionBuilder = makeQueryBuilder({ data: null, error: null })

        mockAdminClient.from.mockImplementationOnce(() => currentBalanceBuilder) // select current balance
        mockAdminClient.from.mockImplementationOnce(() => updateBuilder) // update balance
        mockAdminClient.from.mockImplementationOnce(() => transactionBuilder) // log transaction

        await updateUserCredits('user-1', 10)

        expect(updateBuilder.update).toHaveBeenCalledWith({ credits_balance: 15 })
        expect(transactionBuilder.insert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: 'user-1', credits: 10, type: 'admin_adjustment' })
        )
    })

    it('treats a missing profile as a starting balance of 0', async () => {
        mockAsAdmin()
        const missingProfileBuilder = makeQueryBuilder({ data: null, error: null })
        const updateBuilder = makeQueryBuilder({ data: null, error: null })
        const transactionBuilder = makeQueryBuilder({ data: null, error: null })

        mockAdminClient.from.mockImplementationOnce(() => missingProfileBuilder)
        mockAdminClient.from.mockImplementationOnce(() => updateBuilder)
        mockAdminClient.from.mockImplementationOnce(() => transactionBuilder)

        await updateUserCredits('user-1', 7)

        expect(updateBuilder.update).toHaveBeenCalledWith({ credits_balance: 7 })
    })

    it('throws and does not log a transaction when the balance update fails', async () => {
        mockAsAdmin()
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: { credits_balance: 5 }, error: null }))
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: { message: 'db error' } }))
        const transactionBuilder = makeQueryBuilder({ data: null, error: null })
        mockAdminClient.from.mockImplementationOnce(() => transactionBuilder)

        await expect(updateUserCredits('user-1', 10)).rejects.toThrow('Failed to update credits')
        expect(transactionBuilder.insert).not.toHaveBeenCalled()
    })
})

describe('restoreSubmission', () => {
    it('throws Forbidden when the caller is not an admin', async () => {
        mockAsNonAdmin()

        await expect(restoreSubmission('sub-1')).rejects.toThrow('Forbidden')
    })

    it('clears deleted_at for an admin, and records the action in the audit log', async () => {
        mockAsAdmin()
        const updateBuilder = makeQueryBuilder({ data: null, error: null })
        const auditLogBuilder = makeQueryBuilder({ data: null, error: null })
        mockAdminClient.from.mockImplementationOnce(() => updateBuilder)
        mockAdminClient.from.mockImplementationOnce((table: string) =>
            table === 'admin_audit_log' ? auditLogBuilder : defaultQueryBuilder()
        )

        await restoreSubmission('sub-1')

        expect(updateBuilder.update).toHaveBeenCalledWith({ deleted_at: null })
        expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'sub-1')
        expect(auditLogBuilder.insert).toHaveBeenCalledWith(
            expect.objectContaining({ admin_id: 'admin-1', action: 'restore_submission', target_id: 'sub-1' })
        )
    })

    it('throws the DB error message when the update fails', async () => {
        mockAsAdmin()
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: { message: 'row not found' } }))

        await expect(restoreSubmission('sub-1')).rejects.toThrow('row not found')
    })
})

describe('hardDeleteSubmission', () => {
    it('throws Forbidden when the caller is not an admin', async () => {
        mockAsNonAdmin()

        await expect(hardDeleteSubmission('sub-1')).rejects.toThrow('Forbidden')
    })

    it('removes storage files, then analyses, then the submission row, for an admin', async () => {
        mockAsAdmin()
        const submissionLookupBuilder = makeQueryBuilder({
            data: { image_path: 'uploads/a.jpg', thumbnail_path: 'previews/a.jpg' },
            error: null,
        })
        const analysesDeleteBuilder = makeQueryBuilder({ data: null, error: null })
        const submissionDeleteBuilder = makeQueryBuilder({ data: null, error: null })

        mockAdminClient.from.mockImplementationOnce(() => submissionLookupBuilder)
        mockAdminClient.from.mockImplementationOnce(() => analysesDeleteBuilder)
        mockAdminClient.from.mockImplementationOnce(() => submissionDeleteBuilder)

        const removeFn = vi.fn(async () => ({ data: null, error: null }))
        mockAdminClient.storage.from.mockImplementationOnce(() => ({ remove: removeFn }))

        await hardDeleteSubmission('sub-1')

        expect(removeFn).toHaveBeenCalledWith(['uploads/a.jpg', 'previews/a.jpg'])
        expect(analysesDeleteBuilder.delete).toHaveBeenCalled()
        expect(submissionDeleteBuilder.delete).toHaveBeenCalled()
    })

    it('throws when deleting the dependent analyses row fails, before ever deleting the submission', async () => {
        mockAsAdmin()
        mockAdminClient.from.mockImplementationOnce(() => makeQueryBuilder({ data: null, error: null })) // no submission found, skip storage
        const analysesDeleteBuilder = makeQueryBuilder({ data: null, error: { message: 'fk violation' } })
        const submissionDeleteBuilder = makeQueryBuilder({ data: null, error: null })
        mockAdminClient.from.mockImplementationOnce(() => analysesDeleteBuilder)
        mockAdminClient.from.mockImplementationOnce(() => submissionDeleteBuilder)

        await expect(hardDeleteSubmission('sub-1')).rejects.toThrow('Failed to delete analyses')
        expect(submissionDeleteBuilder.delete).not.toHaveBeenCalled()
    })
})

describe('deleteErrorLog', () => {
    it('throws Forbidden when the caller is not an admin', async () => {
        mockAsNonAdmin()

        await expect(deleteErrorLog('log-1')).rejects.toThrow('Forbidden')
    })

    it('deletes the log row for an admin', async () => {
        mockAsAdmin()
        const deleteBuilder = makeQueryBuilder({ data: null, error: null })
        mockAdminClient.from.mockImplementationOnce(() => deleteBuilder)

        await deleteErrorLog('log-1')

        expect(deleteBuilder.delete).toHaveBeenCalled()
        expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'log-1')
    })
})
