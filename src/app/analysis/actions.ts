'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function unlockAnalysis(analysisId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const adminDb = createAdminClient()

    // Check credits
    const { data: profile } = await adminDb.from('profiles').select('credits_balance').eq('id', user.id).single()

    if (!profile || (profile.credits_balance || 0) < 1) {
        return { error: 'Insufficient credits' }
    }

    // Deduct Credit
    const { error: rpcError } = await adminDb.rpc('decrement_credits', { userid: user.id, count: 1 })

    // Fallback if RPC fails (best effort deduction)
    if (rpcError) {
        await adminDb.from('profiles').update({ credits_balance: (profile.credits_balance || 1) - 1 }).eq('id', user.id)
    }

    // Unlock
    // We need to fetch submission ID? Or is analysisId actually submission Id?
    // In `CritiqueDisplay`, `analysisId` passed is actually the `submission.id` (based on `page.tsx` code).
    // `eq('submission_id', id)` in page.tsx.

    const { error: updateError } = await adminDb
        .from('analyses')
        .update({ is_unlocked: true })
        .eq('submission_id', analysisId)

    if (updateError) {
        return { error: 'Update failed' }
    }

    revalidatePath(`/analysis/${analysisId}`)
    return { success: true }
}


export async function deleteSubmission(submissionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership
    const { data: submission } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('id', submissionId)
        .single()

    if (!submission || submission.user_id !== user.id) {
        // Check if admin
        const isAdmin = (await supabase.from('profiles').select('is_admin').eq('id', user.id).single()).data?.is_admin
        if (!isAdmin) return { error: 'Unauthorized' }
    }

    const { data: updated, error } = await supabase
        .from('submissions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', submissionId)
        .select()

    if (error) {
        console.error('Delete error:', error)
        return { error: 'Failed to delete analysis' }
    }

    if (!updated || updated.length === 0) {
        console.error('Delete failed: No rows updated. Check RLS policies.')
        return { error: 'Failed to delete: Permission denied or record not found' }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/analysis/${submissionId}`)
    return { success: true }
}

export async function togglePublicStatus(submissionId: string, isPublic: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify ownership
    const { data: submission } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('id', submissionId)
        .single()

    if (!submission || submission.user_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    const adminDb = createAdminClient()
    const { error } = await adminDb
        .from('analyses')
        .update({ is_public: isPublic })
        .eq('submission_id', submissionId)

    if (error) {
        return { error: 'Update failed' }
    }

    revalidatePath(`/analysis/${submissionId}`)
    revalidatePath('/sitemap.xml')
    return { success: true }
}

export async function addComment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const submissionId = formData.get('submission_id') as string
    const text = formData.get('text') as string
    const category = formData.get('category') as string
    const parentId = formData.get('parent_id') as string
    const locX = formData.get('location_x')
    const locY = formData.get('location_y')

    if (!text || !submissionId) return { error: 'Missing Required Fields' }

    console.log(`[addComment] Attempting insert: user=${user.id}, sub=${submissionId}, cat=${category}, parent=${parentId}`)

    const { error } = await createAdminClient().from('comments').insert({
        submission_id: submissionId,
        user_id: user.id,
        parent_id: parentId || null,
        text,
        category,
        location_x: locX ? parseFloat(locX as string) : null,
        location_y: locY ? parseFloat(locY as string) : null
    })

    if (error) {
        console.error("Add Comment Error:", error)
        return { error: `Failed to post comment: ${error.message}` }
    }

    console.log("Comment added successfully")

    revalidatePath(`/analysis/${submissionId}`)
    return { success: true }
}

export async function deleteComment(commentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check ownership
    const { data: comment } = await supabase.from('comments').select('user_id, submission_id').eq('id', commentId).single()
    if (!comment) return { error: 'Not found' }

    // Check Admin Status
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    const isAdmin = profile?.is_admin

    // Verify Permission
    if (comment.user_id !== user.id && !isAdmin) {
        return { error: 'Unauthorized' }
    }

    // Use Admin Client to delete (bypasses RLS) to ensure Admins can always delete
    // and to avoid complex RLS policies for "is_admin".
    const adminDb = createAdminClient()
    const { error } = await adminDb.from('comments').delete().eq('id', commentId)

    if (error) {
        console.error("Delete Comment Error:", error)
        return { error: 'Failed to delete' }
    }

    revalidatePath(`/analysis/${comment.submission_id}`)
    console.log(`[deleteComment] Successfully deleted comment ${commentId}`)
    return { success: true }
}
