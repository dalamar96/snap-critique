'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { Logger } from '@/lib/logger'

export async function updateAvatar(url: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const adminDb = createAdminClient()
    const { error } = await adminDb
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath(`/profile/${user.id}`)
    revalidatePath('/profile/edit')
    revalidatePath('/community')

    return { success: true }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const fullName = formData.get('full_name') as string
    const businessName = formData.get('business_name') as string
    const websiteUrl = formData.get('website_url') as string
    const bio = formData.get('bio') as string
    const isPublic = formData.get('is_public') === 'on'

    // Arrays need JSON parsing or FormData handling
    // For simplicity, we will assume multi-selects submit multiple entries with same name? 
    // Or we handle client-side. Let's assume we receive a JSON string or handle getAll.

    // NOTE: FormData.getAll('brands') returns array of strings
    const brands = formData.getAll('brands') as string[]
    const types = formData.getAll('types') as string[]

    const adminDb = createAdminClient()

    const avatarUrl = formData.get('avatar_url') as string

    const updates = {
        full_name: fullName,
        business_name: businessName,
        website_url: websiteUrl,
        bio: bio,
        is_public: isPublic,
        camera_brands: brands,
        photography_types: types,
        avatar_url: avatarUrl // Add this line
    }

    const { error } = await adminDb
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath(`/profile/${user.id}`)
    revalidatePath('/profile/edit')
    revalidatePath('/community')

    return { success: true }
}

/**
 * Permanently deletes the current user's account and all associated data.
 * Requires re-entering the account password as a confirmation step (same
 * credential check login() uses) — this is a destructive, irreversible
 * action, and account deletion is the one place in the app that removes
 * an auth.users row entirely.
 *
 * Transactions are ANONYMIZED (user_id set to null) rather than deleted,
 * to preserve accounting/payment records without keeping them linked to
 * a specific person. Everything else the user owns is hard-deleted.
 *
 * Deletion order matters for foreign-key integrity: children before
 * parents (comments/analyses before submissions, everything before the
 * profile row, the profile before the auth user). Explicit deletes are
 * used throughout rather than relying on assumed ON DELETE CASCADE
 * behavior, so this is correct regardless of exactly which cascades exist
 * in the live schema — a delete that matches 0 rows (because a cascade
 * already handled it) is a harmless no-op.
 */
export async function deleteAccount(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) return { error: 'Unauthorized' }

    const password = formData.get('password') as string
    if (!password) return { error: 'Enter your password to confirm account deletion.' }

    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
    })
    if (authError) return { error: 'Incorrect password.' }

    const adminDb = createAdminClient()
    const userId = user.id

    // Collect everything needed for cleanup before deleting any rows.
    const { data: submissions } = await adminDb
        .from('submissions')
        .select('id, image_path, thumbnail_path')
        .eq('user_id', userId)

    const submissionIds = (submissions || []).map((s) => s.id)
    const storageFiles = (submissions || [])
        .flatMap((s) => [s.image_path, s.thumbnail_path])
        .filter((path): path is string => !!path)

    const { data: profile } = await adminDb.from('profiles').select('avatar_url').eq('id', userId).single()
    if (profile?.avatar_url && !profile.avatar_url.startsWith('http')) {
        storageFiles.push(profile.avatar_url)
    }

    // Children first, in dependency order.
    if (submissionIds.length > 0) {
        await adminDb.from('comments').delete().in('submission_id', submissionIds)
        await adminDb.from('analyses').delete().in('submission_id', submissionIds)
    }
    await adminDb.from('comments').delete().eq('user_id', userId)
    await adminDb.from('user_homework_progress').delete().eq('user_id', userId)
    await adminDb.from('user_lesson_progress').delete().eq('user_id', userId)
    await adminDb.from('messages').delete().eq('user_id', userId)
    await adminDb.from('conversation_status').delete().eq('user_id', userId)

    // Anonymize rather than delete — preserves accounting records.
    await adminDb.from('transactions').update({ user_id: null }).eq('user_id', userId)

    await adminDb.from('submissions').delete().eq('user_id', userId)
    await adminDb.from('profiles').delete().eq('id', userId)

    if (storageFiles.length > 0) {
        await adminDb.storage.from('submissions').remove(storageFiles)
    }

    const { error: deleteAuthError } = await adminDb.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
        Logger.error('Failed to delete auth user during account deletion', deleteAuthError, { userId })
        return { error: 'Your data was removed, but something went wrong finalizing the deletion. Please contact support.' }
    }

    await supabase.auth.signOut()
    return { success: true }
}

/**
 * Lets the signed-in user opt in or out of reminder/marketing email from
 * their profile. The mirror of the emailed unsubscribe link: `enabled: false`
 * sets marketing_opt_out (with a timestamp); `enabled: true` clears both, so
 * the admin reminder tools may email them again.
 */
export async function setMarketingEmails(enabled: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const adminDb = createAdminClient()
    const { error } = await adminDb
        .from('profiles')
        .update({
            marketing_opt_out: !enabled,
            marketing_opt_out_at: enabled ? null : new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile/edit')
    return { success: true }
}
