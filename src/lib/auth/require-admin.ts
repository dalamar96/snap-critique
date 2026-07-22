import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
