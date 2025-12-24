'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateSystemPrompt(content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const adminDb = createAdminClient()

    // Verify admin
    const { data: profile } = await adminDb
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        throw new Error('Forbidden')
    }

    // Deactivate old prompts
    await adminDb
        .from('system_prompts')
        .update({ is_active: false })
        .eq('is_active', true)

    // Insert new prompt
    // Assuming versioning strategy is just incremental or timestamp based. 
    // We can just use a simple 'v' + timestamp for now if version is a string.
    const version = `v${Date.now()}`

    const { error } = await adminDb
        .from('system_prompts')
        .insert({
            content,
            is_active: true,
            version
        })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin')
}

export async function getUserAnalyses(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()

    // Verify admin
    const { data: profile } = await adminDb
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) throw new Error('Forbidden')

    // Fetch submissions
    const { data: submissions, error } = await adminDb
        .from('submissions')
        .select('*, analyses(id, score, is_unlocked, title)') // Join logic might vary depending on schema, assuming analyses uses submission_id
        // Actually, analyses table has submission_id. But 'analyses' in select might not work if relationship name is different or not defined in Supabase client types exactly how we expect for joins without seeing schema introspection.
        // Let's rely on the previous admin page fetch which used: '*, profiles(email), analyses(is_unlocked, score)'
        // That implies 'analyses' is the correct relation name.
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const submissionsWithImages = await Promise.all((submissions || []).map(async (sub) => {
        let imageUrl = null
        if (sub.image_path) {
            // Try storage
            // 1. Try Preview Path first
            // Use stored thumbnail_path if available, otherwise fallback to convention
            const previewPath = sub.thumbnail_path || sub.image_path.replace('uploads/', 'previews/')
            const { data: previewData } = await adminDb.storage
                .from('submissions')
                .createSignedUrl(previewPath, 3600)

            if (previewData?.signedUrl) {
                imageUrl = previewData.signedUrl
            } else {
                // 2. Fallback to Original
                const { data: originalData } = await adminDb.storage
                    .from('submissions')
                    .createSignedUrl(sub.image_path, 3600)

                if (originalData?.signedUrl) {
                    imageUrl = originalData.signedUrl
                }
            }
        }
        return {
            ...sub,
            signedUrl: imageUrl
        }
    }))

    return submissionsWithImages
}
