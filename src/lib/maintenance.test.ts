import { describe, it, expect } from 'vitest'
import {
    daysAgoIso,
    groupLockedByUser,
    isReminderDue,
    buildUnlockReminderEmail,
    REMINDER_COOLDOWN_DAYS,
} from './maintenance'

describe('daysAgoIso', () => {
    it('returns the instant N days before now', () => {
        const now = new Date('2026-09-26T12:00:00.000Z')
        expect(daysAgoIso(14, now)).toBe('2026-09-12T12:00:00.000Z')
    })
})

describe('groupLockedByUser', () => {
    it('groups by user, counts, tracks latest/oldest, and skips guests', () => {
        const groups = groupLockedByUser([
            { submission_id: 's1', created_at: '2026-09-01T00:00:00Z', submissions: { user_id: 'u1' } },
            { submission_id: 's2', created_at: '2026-09-10T00:00:00Z', submissions: [{ user_id: 'u1' }] },
            { submission_id: 's3', created_at: '2026-09-05T00:00:00Z', submissions: { user_id: 'u2' } },
            { submission_id: 's4', created_at: '2026-09-06T00:00:00Z', submissions: { user_id: null } },
            { submission_id: 's5', created_at: '2026-09-07T00:00:00Z', submissions: null },
        ])
        expect(groups).toHaveLength(2)
        expect(groups.find(g => g.userId === 'u1')).toEqual({
            userId: 'u1',
            lockedCount: 2,
            latestSubmissionId: 's2',
            oldestLockedAt: '2026-09-01T00:00:00Z',
        })
        expect(groups.find(g => g.userId === 'u2')!.lockedCount).toBe(1)
    })
})

describe('isReminderDue', () => {
    const now = new Date('2026-09-26T00:00:00.000Z')
    it('is due when never reminded', () => {
        expect(isReminderDue(null, now)).toBe(true)
    })
    it('is not due inside the cooldown', () => {
        expect(isReminderDue(daysAgoIso(REMINDER_COOLDOWN_DAYS - 1, now), now)).toBe(false)
    })
    it('is due once the cooldown has elapsed', () => {
        expect(isReminderDue(daysAgoIso(REMINDER_COOLDOWN_DAYS, now), now)).toBe(true)
    })
    it('is never due for an unsubscribed user, even if never reminded', () => {
        expect(isReminderDue(null, now, true)).toBe(false)
        expect(isReminderDue(daysAgoIso(365, now), now, true)).toBe(false)
    })
})

describe('buildUnlockReminderEmail', () => {
    it('pluralises and includes the link in both bodies', () => {
        const unsubscribeUrl = 'https://x.test/unsubscribe?token=abc'
        const one = buildUnlockReminderEmail({ lockedCount: 1, link: 'https://x.test/analysis/1', unsubscribeUrl })
        const many = buildUnlockReminderEmail({ lockedCount: 3, link: 'https://x.test/analysis/1', unsubscribeUrl })
        expect(one.subject).toContain('critique is waiting')
        expect(many.subject).toContain('3 photo critiques')
        for (const e of [one, many]) {
            expect(e.html).toContain('https://x.test/analysis/1')
            expect(e.text).toContain('https://x.test/analysis/1')
            // visible unsubscribe link in both bodies
            expect(e.html).toContain(unsubscribeUrl)
            expect(e.text).toContain(unsubscribeUrl)
        }
    })

    it('adds one-click List-Unsubscribe headers pointing at the API route', () => {
        const e = buildUnlockReminderEmail({ lockedCount: 1, link: 'l', unsubscribeUrl: 'https://x.test/unsubscribe?token=abc' })
        expect(e.headers['List-Unsubscribe']).toBe('<https://x.test/api/unsubscribe?token=abc>')
        expect(e.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    })
})
