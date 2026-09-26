import { describe, it, expect, beforeEach } from 'vitest'
import { createUnsubscribeToken, verifyUnsubscribeToken, buildUnsubscribeUrl } from './unsubscribe-token'

describe('unsubscribe tokens', () => {
    beforeEach(() => {
        process.env.UNSUBSCRIBE_SECRET = 'test-secret'
    })

    it('round-trips a user id', () => {
        const token = createUnsubscribeToken('user-123')
        expect(verifyUnsubscribeToken(token)).toBe('user-123')
    })

    it('rejects a tampered payload (forging another user)', () => {
        const [, sig] = createUnsubscribeToken('user-123').split('.')
        const forgedPayload = Buffer.from('user-999').toString('base64url')
        expect(verifyUnsubscribeToken(`${forgedPayload}.${sig}`)).toBeNull()
    })

    it('rejects a token signed with a different secret', () => {
        const token = createUnsubscribeToken('user-123')
        process.env.UNSUBSCRIBE_SECRET = 'other-secret'
        expect(verifyUnsubscribeToken(token)).toBeNull()
    })

    it('rejects malformed input', () => {
        for (const bad of [null, undefined, '', 'abc', 'a.b.c', '.', 'a.']) {
            expect(verifyUnsubscribeToken(bad)).toBeNull()
        }
    })

    it('builds a URL whose token verifies', () => {
        const url = new URL(buildUnsubscribeUrl('https://x.test/', 'user-123'))
        expect(url.pathname).toBe('/unsubscribe')
        expect(verifyUnsubscribeToken(url.searchParams.get('token'))).toBe('user-123')
    })
})
