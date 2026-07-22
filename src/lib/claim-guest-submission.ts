import type { SupabaseClient } from '@supabase/supabase-js'

export type ClaimResult = {
    claimed: boolean
    unlocked: boolean
    reason?: 'missing_or_invalid_guest_token' | 'claim_update_failed' | 'already_claimed_or_not_found'
}

/**
 * Links an anonymous guest submission to a newly authenticated user, and
 * spends a credit to unlock it if the user has one available.
 *
 * Single implementation shared by login(), signup(), and the analysis page's
 * explicit claim flow — those previously had three independently hand-rolled
 * versions that drifted out of sync (missing token checks, missing unlock
 * step, missing ownership-race guard).
 *
 * Requires a valid `guest_token_<submissionId>` cookie, and only claims
 * submissions that are still unowned (`user_id is null`) — the ownership
 * update itself carries that guard atomically via `.is('user_id', null)`,
 * so concurrent claim attempts (or an attacker guessing a submission ID)
 * can't steal an already-claimed submission.
 */
export async function claimGuestSubmission(params: {
    adminDb: SupabaseClient
    userId: string
    submissionId: string
    guestToken: string | undefined
}): Promise<ClaimResult> {
    const { adminDb, userId, submissionId, guestToken } = params

    if (guestToken !== 'true') {
        return { claimed: false, unlocked: false, reason: 'missing_or_invalid_guest_token' }
    }

    // Atomic claim: the `.is('user_id', null)` guard means this only affects
    // a row if it's still unowned, closing the race between "check ownership"
    // and "assign ownership" that the old per-call-site implementations had.
    const { data: claimedRows, error: claimError } = await adminDb
        .from('submissions')
        .update({ user_id: userId })
        .eq('id', submissionId)
        .is('user_id', null)
        .select('id')

    if (claimError) {
        return { claimed: false, unlocked: false, reason: 'claim_update_failed' }
    }

    if (!claimedRows || claimedRows.length === 0) {
        // Either the submission doesn't exist, or it was already claimed
        // (by this user or someone else) before this call landed.
        return { claimed: false, unlocked: false, reason: 'already_claimed_or_not_found' }
    }

    // NOTE: analyses has no user_id column (confirmed against the live
    // schema) — ownership lives only on submissions.user_id. An earlier
    // version of this code (and the pre-existing app code it replaced)
    // tried to mirror ownership onto analyses.user_id too; that update
    // silently errored every time since the column doesn't exist, so it's
    // intentionally not here.

    // Spend a credit and unlock, if the user has one. check_and_decrement_credits
    // is atomic (check-and-deduct in one statement), so this can't be raced
    // into a double-spend the way a separate check-then-decrement could.
    const { data: deducted } = await adminDb.rpc('check_and_decrement_credits', {
        userid: userId,
        count: 1,
    })

    let unlocked = false
    if (deducted === true) {
        const { error: unlockError } = await adminDb
            .from('analyses')
            .update({ is_unlocked: true })
            .eq('submission_id', submissionId)
        unlocked = !unlockError
    }

    return { claimed: true, unlocked }
}
