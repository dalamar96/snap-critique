import { describe, it, expect, vi } from 'vitest'
import { makeFakeSupabase, makeQueryBuilder } from '@/test/fake-supabase'
import { normalizeReferralCode, recordReferral } from './referrals'

describe('normalizeReferralCode', () => {
    it('lowercases and trims valid codes', () => {
        expect(normalizeReferralCode(' AB12cd34 ')).toBe('ab12cd34')
    })

    it('rejects empty or malformed codes', () => {
        expect(normalizeReferralCode(null)).toBeNull()
        expect(normalizeReferralCode('')).toBeNull()
        expect(normalizeReferralCode('ab')).toBeNull()
        expect(normalizeReferralCode("x' or 1=1")).toBeNull()
    })
})

describe('recordReferral', () => {
    function setup(referrer: { id: string } | null) {
        const referralsBuilder = makeQueryBuilder({ data: null, error: null })
        const db = makeFakeSupabase({
            from: (table) =>
                table === 'profiles'
                    ? makeQueryBuilder({ data: referrer, error: null })
                    : referralsBuilder,
        })
        return { db, referralsBuilder }
    }

    it('links the new user to the referrer', async () => {
        const { db, referralsBuilder } = setup({ id: 'referrer-1' })

        const ok = await recordReferral(db, 'new-user', 'abcd1234')

        expect(ok).toBe(true)
        expect(referralsBuilder.upsert).toHaveBeenCalledWith(
            { referrer_id: 'referrer-1', referred_id: 'new-user' },
            { onConflict: 'referred_id', ignoreDuplicates: true },
        )
    })

    it('ignores a missing cookie without querying', async () => {
        const { db } = setup({ id: 'referrer-1' })

        expect(await recordReferral(db, 'new-user', undefined)).toBe(false)
        expect(db.from).not.toHaveBeenCalled()
    })

    it('ignores unknown codes', async () => {
        const { db, referralsBuilder } = setup(null)

        expect(await recordReferral(db, 'new-user', 'abcd1234')).toBe(false)
        expect(referralsBuilder.upsert).not.toHaveBeenCalled()
    })

    it('blocks self-referral', async () => {
        const { db, referralsBuilder } = setup({ id: 'same-user' })

        expect(await recordReferral(db, 'same-user', 'abcd1234')).toBe(false)
        expect(referralsBuilder.upsert).not.toHaveBeenCalled()
    })

    it('returns false when the insert fails', async () => {
        const db = makeFakeSupabase({
            from: (table) =>
                table === 'profiles'
                    ? makeQueryBuilder({ data: { id: 'referrer-1' }, error: null })
                    : makeQueryBuilder({ data: null, error: { message: 'fk violation' } }),
        })
        vi.spyOn(console, 'error').mockImplementation(() => {})

        expect(await recordReferral(db, 'new-user', 'abcd1234')).toBe(false)
    })
})
