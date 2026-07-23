import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Logger } from '@/lib/logger'

/**
 * Plain boolean admin lookup, no throw. Use where the caller wants to
 * branch/render rather than fail the whole request (e.g. a page component
 * showing its own "Access Denied" screen).
 */
export async function getIsAdmin(adminDb: SupabaseClient, userId: string): Promise<boolean> {
    const { data: profile } = await adminDb
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

    return !!profile?.is_admin
}

/**
 * Server Action guard: throws 'Unauthorized' if there's no logged-in user,
 * 'Forbidden' if they're not an admin. Returns the user and a ready-to-use
 * service-role client so callers don't need to construct one separately.
 *
 * Replaces the same ~6-line "fetch profile, check is_admin, throw" block
 * that used to be hand-rolled at every admin-gated server action.
 */
export async function requireAdmin(): Promise<{ user: User; adminDb: SupabaseClient }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const adminDb = createAdminClient()
    const isAdmin = await getIsAdmin(adminDb, user.id)

    if (!isAdmin) {
        throw new Error('Forbidden')
    }

    return { user, adminDb }
}

/**
 * Records a destructive/mutating admin action to admin_audit_log
 * (supabase/migrations/20260722000000_hardening.sql). Best-effort: logs a
 * warning and continues rather than failing the calling action if the
 * write itself fails (e.g. the migration hasn't been applied yet) — an
 * admin action shouldn't be blocked by audit-log infrastructure being
 * unavailable.
 */
export async function logAdminAction(
    adminDb: SupabaseClient,
    adminId: string,
    action: string,
    opts?: { targetTable?: string; targetId?: string; details?: Record<string, unknown> }
): Promise<void> {
    try {
        const { error } = await adminDb.from('admin_audit_log').insert({
            admin_id: adminId,
            action,
            target_table: opts?.targetTable ?? null,
            target_id: opts?.targetId ?? null,
            details: opts?.details ?? null,
        })

        if (error) {
            Logger.warn('[AdminAudit] Failed to write audit log entry', { error: error.message, action })
        }
    } catch (e) {
        // Never let audit logging itself take down the admin action it's
        // recording — this is a best-effort side effect, not a gate.
        Logger.warn('[AdminAudit] Unexpected error writing audit log entry', { error: String(e), action })
    }
}
