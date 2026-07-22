import { describe, it, expect } from 'vitest'
import { claimGuestSubmission } from './claim-guest-submission'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'

describe('claimGuestSubmission', () => {
    it('rejects when the guest token is missing or invalid', async () => {
        const adminDb = makeFakeSupabase()

        const result = await claimGuestSubmission({
            adminDb,
            userId: 'user-1',
            submissionId: 'sub-1',
            guestToken: undefined,
        })

        expect(result).toEqual({ claimed: false, unlocked: false, reason: 'missing_or_invalid_guest_token' })
        expect(adminDb.from).not.toHaveBeenCalled()
    })

    it('rejects a stale token (e.g. "false") the same as a missing one', async () => {
        const adminDb = makeFakeSupabase()

        const result = await claimGuestSubmission({
            adminDb,
            userId: 'user-1',
            submissionId: 'sub-1',
            guestToken: 'false',
        })

        expect(result.claimed).toBe(false)
        expect(result.reason).toBe('missing_or_invalid_guest_token')
    })

    it('rejects when the submission is already claimed — the .is(user_id, null) guard filters out the row, so 0 rows come back from the update', async () => {
        const adminDb = makeFakeSupabase({
            from: (table) => {
                if (table === 'submissions') return makeQueryBuilder({ data: [], error: null })
                return makeQueryBuilder({ data: null, error: null })
            },
        })

        const result = await claimGuestSubmission({
            adminDb,
            userId: 'user-1',
            submissionId: 'sub-1',
            guestToken: 'true',
        })

        expect(result).toEqual({ claimed: false, unlocked: false, reason: 'already_claimed_or_not_found' })
    })

    it('claims and unlocks when the user has a credit available', async () => {
        const adminDb = makeFakeSupabase({
            from: (table) => {
                if (table === 'submissions') return makeQueryBuilder({ data: [{ id: 'sub-1' }], error: null })
                if (table === 'analyses') return makeQueryBuilder({ data: null, error: null })
                return makeQueryBuilder({ data: null, error: null })
            },
            rpc: (fn) => (fn === 'check_and_decrement_credits' ? { data: true, error: null } : { data: null, error: null }),
        })

        const result = await claimGuestSubmission({
            adminDb,
            userId: 'user-1',
            submissionId: 'sub-1',
            guestToken: 'true',
        })

        expect(result).toEqual({ claimed: true, unlocked: true })
        expect(adminDb.rpc).toHaveBeenCalledWith('check_and_decrement_credits', { userid: 'user-1', count: 1 })
    })

    it('claims but does not unlock (and does not fabricate a deduction) when the user has no credits', async () => {
        const adminDb = makeFakeSupabase({
            from: (table) => {
                if (table === 'submissions') return makeQueryBuilder({ data: [{ id: 'sub-1' }], error: null })
                return makeQueryBuilder({ data: null, error: null })
            },
            // check_and_decrement_credits returns null when balance is insufficient
            rpc: () => ({ data: null, error: null }),
        })

        const result = await claimGuestSubmission({
            adminDb,
            userId: 'user-1',
            submissionId: 'sub-1',
            guestToken: 'true',
        })

        expect(result).toEqual({ claimed: true, unlocked: false })
    })
})
