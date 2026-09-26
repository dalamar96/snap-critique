// Pure helpers for the admin Maintenance tools (guest cleanup + unlock
// reminders). Kept free of I/O so they can be unit-tested directly.

export const GUEST_RETENTION_DAYS = 14
export const REMINDER_COOLDOWN_DAYS = 7
export const PURGE_BATCH_SIZE = 200
export const REMINDER_BATCH_SIZE = 100

const DAY_MS = 24 * 60 * 60 * 1000

export function daysAgoIso(days: number, now: Date = new Date()): string {
    return new Date(now.getTime() - days * DAY_MS).toISOString()
}

export interface LockedAnalysisRow {
    submission_id: string
    created_at: string | null
    submissions: { user_id: string | null } | { user_id: string | null }[] | null
}

export interface LockedGroup {
    userId: string
    lockedCount: number
    /** Most recent locked submission — the reminder deep-links to it. */
    latestSubmissionId: string
    oldestLockedAt: string | null
}

/** Groups still-locked analyses by owning user (guests, user_id null, are skipped). */
export function groupLockedByUser(rows: LockedAnalysisRow[]): LockedGroup[] {
    const groups = new Map<string, LockedGroup & { latestAt: string }>()

    for (const row of rows) {
        const sub = Array.isArray(row.submissions) ? row.submissions[0] : row.submissions
        const userId = sub?.user_id
        if (!userId) continue

        const createdAt = row.created_at ?? ''
        const existing = groups.get(userId)
        if (!existing) {
            groups.set(userId, {
                userId,
                lockedCount: 1,
                latestSubmissionId: row.submission_id,
                latestAt: createdAt,
                oldestLockedAt: row.created_at,
            })
            continue
        }

        existing.lockedCount += 1
        if (createdAt > existing.latestAt) {
            existing.latestAt = createdAt
            existing.latestSubmissionId = row.submission_id
        }
        if (row.created_at && (!existing.oldestLockedAt || row.created_at < existing.oldestLockedAt)) {
            existing.oldestLockedAt = row.created_at
        }
    }

    return Array.from(groups.values()).map((g) => ({
        userId: g.userId,
        lockedCount: g.lockedCount,
        latestSubmissionId: g.latestSubmissionId,
        oldestLockedAt: g.oldestLockedAt,
    }))
}

/**
 * True when a reminder may be sent: the user hasn't unsubscribed, and they've
 * either never been reminded or the cooldown has elapsed.
 */
export function isReminderDue(
    lastReminderAt: string | null | undefined,
    now: Date = new Date(),
    optedOut = false
): boolean {
    if (optedOut) return false
    if (!lastReminderAt) return true
    return new Date(lastReminderAt).getTime() <= now.getTime() - REMINDER_COOLDOWN_DAYS * DAY_MS
}

export function buildUnlockReminderEmail(params: { lockedCount: number; link: string; unsubscribeUrl: string }): {
    subject: string
    html: string
    text: string
    headers: Record<string, string>
} {
    const { lockedCount, link, unsubscribeUrl } = params
    const plural = lockedCount > 1
    const subject = plural
        ? `Your ${lockedCount} photo critiques are waiting for you`
        : 'Your photo critique is waiting for you'

    const lead = plural
        ? `You have ${lockedCount} photo critiques on Snap Critique that you haven't unlocked yet.`
        : `Your photo critique is ready on Snap Critique, but you haven't unlocked it yet.`

    const text = [
        lead,
        '',
        `View it here: ${link}`,
        '',
        '— The Snap Critique team',
        '',
        `Don't want these reminders? Unsubscribe: ${unsubscribeUrl}`,
    ].join('\n')

    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
<h2 style="margin:0 0 12px">${plural ? `${lockedCount} critiques are ready` : 'Your critique is ready'}</h2>
<p style="line-height:1.5">${lead}</p>
<p style="margin:24px 0"><a href="${link}" style="background:#FF7A00;color:#000;padding:12px 20px;text-decoration:none;font-weight:bold;border-radius:4px">View my critique</a></p>
<p style="color:#666;font-size:12px">— The Snap Critique team</p>
<p style="color:#999;font-size:11px;margin-top:24px">Don't want these reminders? <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a></p>
</div>`

    // RFC 8058 one-click unsubscribe: mail clients show their own button and POST to the API route.
    const headers = {
        'List-Unsubscribe': `<${unsubscribeUrl.replace('/unsubscribe?', '/api/unsubscribe?')}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }

    return { subject, html, text, headers }
}
