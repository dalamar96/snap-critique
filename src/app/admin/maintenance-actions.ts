'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { requireAdmin, logAdminAction } from '@/lib/auth/require-admin'
import { sendEmail } from '@/lib/email'
import { buildUnsubscribeUrl } from '@/lib/unsubscribe-token'
import {
    GUEST_RETENTION_DAYS,
    PURGE_BATCH_SIZE,
    REMINDER_BATCH_SIZE,
    daysAgoIso,
    groupLockedByUser,
    isReminderDue,
    buildUnlockReminderEmail,
    type LockedAnalysisRow,
} from '@/lib/maintenance'

// ============================================================================
// Unlock reminders
// Registered users (they gave us an email) who own a critique they haven't
// unlocked. Guests can't be contacted and are handled by the purge below.
// ============================================================================

export interface ReminderCandidate {
    userId: string
    email: string
    lockedCount: number
    oldestLockedAt: string | null
    latestSubmissionId: string
    credits: number
    lastReminderAt: string | null
    /** User clicked unsubscribe: never emailed again by these tools. */
    optedOut: boolean
    /** False while the cooldown is running or the user has opted out. */
    due: boolean
}

const PAGE = 1000

async function loadReminderCandidates(adminDb: SupabaseClient): Promise<ReminderCandidate[]> {
    // 1. Every still-locked analysis owned by a real user (paged past PostgREST's row cap).
    const rows: LockedAnalysisRow[] = []
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await adminDb
            .from('analyses')
            .select('submission_id, created_at, submissions!inner(user_id, deleted_at)')
            .eq('is_unlocked', false)
            .not('submissions.user_id', 'is', null)
            .is('submissions.deleted_at', null)
            .order('created_at', { ascending: true })
            .range(from, from + PAGE - 1)

        if (error) throw new Error(`Failed to load locked analyses: ${error.message}`)
        rows.push(...((data ?? []) as unknown as LockedAnalysisRow[]))
        if (!data || data.length < PAGE) break
    }

    const groups = groupLockedByUser(rows)
    if (groups.length === 0) return []

    // 2. Contact + cooldown info for those users.
    const profiles = new Map<string, { email: string | null; credits_balance: number | null; last_unlock_reminder_at: string | null; marketing_opt_out: boolean | null }>()
    const ids = groups.map(g => g.userId)
    for (let i = 0; i < ids.length; i += 200) {
        const { data, error } = await adminDb
            .from('profiles')
            .select('id, email, credits_balance, last_unlock_reminder_at, marketing_opt_out')
            .in('id', ids.slice(i, i + 200))
        if (error) throw new Error(`Failed to load profiles: ${error.message}`)
        for (const p of data ?? []) profiles.set(p.id, p)
    }

    const now = new Date()
    const candidates: ReminderCandidate[] = []
    for (const g of groups) {
        const p = profiles.get(g.userId)
        if (!p?.email) continue
        candidates.push({
            userId: g.userId,
            email: p.email,
            lockedCount: g.lockedCount,
            oldestLockedAt: g.oldestLockedAt,
            latestSubmissionId: g.latestSubmissionId,
            credits: p.credits_balance ?? 0,
            lastReminderAt: p.last_unlock_reminder_at,
            optedOut: !!p.marketing_opt_out,
            due: isReminderDue(p.last_unlock_reminder_at, now, !!p.marketing_opt_out),
        })
    }

    // Due first, then longest-waiting first.
    return candidates.sort((a, b) =>
        Number(b.due) - Number(a.due) || (a.oldestLockedAt ?? '').localeCompare(b.oldestLockedAt ?? '')
    )
}

export async function getUnlockReminderCandidates(): Promise<ReminderCandidate[]> {
    const { adminDb } = await requireAdmin()
    return loadReminderCandidates(adminDb)
}

export interface SendRemindersResult {
    sent: number
    failed: number
    /** Due candidates left over because of the per-call batch cap. */
    remaining: number
    errors: { email: string; error: string }[]
}

/**
 * Emails users about critiques they haven't unlocked. With `userIds`, only
 * those users are targeted; without, every due candidate is. Users still in
 * their cooldown or who have unsubscribed are always skipped (re-checked here
 * on the server, whatever the client sent), and at most REMINDER_BATCH_SIZE are sent
 * per call — run it again for the remainder.
 */
export async function sendUnlockReminders(userIds?: string[]): Promise<SendRemindersResult> {
    const { user, adminDb } = await requireAdmin()

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        throw new Error('Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.')
    }

    const wanted = userIds ? new Set(userIds) : null
    const due = (await loadReminderCandidates(adminDb)).filter(c => c.due && (!wanted || wanted.has(c.userId)))
    const batch = due.slice(0, REMINDER_BATCH_SIZE)

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.snapcritique.com').replace(/\/$/, '')

    let sent = 0
    let failed = 0
    const errors: { email: string; error: string }[] = []

    // Small fixed concurrency: fast enough, gentle on the email provider's rate limit.
    for (let i = 0; i < batch.length; i += 5) {
        await Promise.all(batch.slice(i, i + 5).map(async (c) => {
            const email = buildUnlockReminderEmail({
                lockedCount: c.lockedCount,
                link: `${siteUrl}/analysis/${c.latestSubmissionId}`,
                unsubscribeUrl: buildUnsubscribeUrl(siteUrl, c.userId),
            })
            const result = await sendEmail({ to: c.email, ...email })

            if (result.ok) {
                sent++
                await adminDb
                    .from('profiles')
                    .update({ last_unlock_reminder_at: new Date().toISOString() })
                    .eq('id', c.userId)
            } else {
                failed++
                if (errors.length < 10) errors.push({ email: c.email, error: result.error })
            }
        }))
    }

    await logAdminAction(adminDb, user.id, 'send_unlock_reminders', {
        details: { sent, failed, targeted: userIds?.length ?? 'all_due' },
    })
    revalidatePath('/admin')

    return { sent, failed, remaining: due.length - batch.length, errors }
}

// ============================================================================
// Guest cleanup
// Guest = submission with no owner. The claim cookie lasts 7 days, so after
// GUEST_RETENTION_DAYS nobody can ever claim it; delete everything.
// ============================================================================

export interface GuestPurgePreview {
    eligibleCount: number
    oldestCreatedAt: string | null
    cutoff: string
    retentionDays: number
}

export async function getGuestPurgePreview(): Promise<GuestPurgePreview> {
    const { adminDb } = await requireAdmin()
    const cutoff = daysAgoIso(GUEST_RETENTION_DAYS)

    const { count, error } = await adminDb
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .is('user_id', null)
        .lt('created_at', cutoff)
    if (error) throw new Error(error.message)

    const { data: oldest } = await adminDb
        .from('submissions')
        .select('created_at')
        .is('user_id', null)
        .lt('created_at', cutoff)
        .order('created_at', { ascending: true })
        .limit(1)

    return {
        eligibleCount: count ?? 0,
        oldestCreatedAt: oldest?.[0]?.created_at ?? null,
        cutoff,
        retentionDays: GUEST_RETENTION_DAYS,
    }
}

export interface GuestPurgeResult {
    deleted: number
    filesRemoved: number
    remaining: number
}

/**
 * Permanently deletes guest submissions older than GUEST_RETENTION_DAYS:
 * storage files (original + preview), comments, analyses, then the
 * submission rows. Irreversible. Processes at most PURGE_BATCH_SIZE per
 * call; the returned `remaining` says whether to run it again.
 *
 * The cutoff is recomputed here on the server, never taken from the client.
 * Order matters: files first (a failure aborts before any row is deleted, so
 * nothing is left pointing at half-deleted data and a retry is safe), then
 * dependent rows, then the submissions with the ownership guard repeated.
 */
export async function purgeExpiredGuestSubmissions(): Promise<GuestPurgeResult> {
    const { user, adminDb } = await requireAdmin()
    const cutoff = daysAgoIso(GUEST_RETENTION_DAYS)

    const { data: batch, error: selectError } = await adminDb
        .from('submissions')
        .select('id, image_path, thumbnail_path')
        .is('user_id', null)
        .lt('created_at', cutoff)
        .order('created_at', { ascending: true })
        .limit(PURGE_BATCH_SIZE)

    if (selectError) throw new Error(selectError.message)
    if (!batch || batch.length === 0) return { deleted: 0, filesRemoved: 0, remaining: 0 }

    const ids = batch.map(s => s.id)

    // 1. Storage: original, stored thumbnail, and the conventional preview path.
    const paths = new Set<string>()
    for (const s of batch) {
        if (s.image_path) {
            paths.add(s.image_path)
            paths.add(s.image_path.replace('uploads/', 'previews/'))
        }
        if (s.thumbnail_path) paths.add(s.thumbnail_path)
    }
    const fileList = Array.from(paths)
    const { error: storageError } = await adminDb.storage.from('submissions').remove(fileList)
    if (storageError) throw new Error(`Storage cleanup failed, nothing was deleted from the database: ${storageError.message}`)

    // 2. Dependent rows (no ON DELETE CASCADE on these FKs).
    const { error: commentsError } = await adminDb.from('comments').delete().in('submission_id', ids)
    if (commentsError) throw new Error(`Failed to delete comments: ${commentsError.message}`)

    const { error: analysesError } = await adminDb.from('analyses').delete().in('submission_id', ids)
    if (analysesError) throw new Error(`Failed to delete analyses: ${analysesError.message}`)

    // 3. The submissions themselves (guard: still unowned).
    const { error: submissionsError } = await adminDb
        .from('submissions')
        .delete()
        .in('id', ids)
        .is('user_id', null)
    if (submissionsError) throw new Error(`Failed to delete submissions: ${submissionsError.message}`)

    const { count: remaining } = await adminDb
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .is('user_id', null)
        .lt('created_at', cutoff)

    await logAdminAction(adminDb, user.id, 'purge_guest_submissions', {
        targetTable: 'submissions',
        details: { deleted: ids.length, filesRemoved: fileList.length, cutoff, retentionDays: GUEST_RETENTION_DAYS },
    })
    revalidatePath('/admin')

    return { deleted: ids.length, filesRemoved: fileList.length, remaining: remaining ?? 0 }
}
