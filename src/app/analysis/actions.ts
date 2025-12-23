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
