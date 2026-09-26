import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token'

/**
 * Marks the token's user as opted out of marketing/reminder email.
 * Idempotent. Returns false only for an invalid token or a failed write.
 * Uses the service-role client because the requester is not logged in — the
 * signed token is the authorization.
 */
export async function unsubscribeByToken(token: string | null | undefined): Promise<boolean> {
    const userId = verifyUnsubscribeToken(token)
    if (!userId) return false

    const { error } = await createAdminClient()
        .from('profiles')
        .update({ marketing_opt_out: true, marketing_opt_out_at: new Date().toISOString() })
        .eq('id', userId)

    return !error
}
