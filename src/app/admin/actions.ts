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

export async function getAdminDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()

    // Verify Admin
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    // 1. Fetch all profiles
    const { data: profiles } = await adminDb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    // 2. Fetch all submissions (lightweight) to aggregate
    // inner join analyses to get lock status
    const { data: submissions } = await adminDb
        .from('submissions')
        .select('user_id, id, created_at, deleted_at, analyses(is_unlocked)')

    // 2.1 Fetch Auth Users for Verification Status
    // 2.1 Fetch Auth Users for Verification Status
    let authUsers: any[] = []
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
        try {
            // Reduced page size to prevent JSON parsing errors on large payloads
            const { data, error: authError } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 50 })

            if (authError) {
                console.warn(`Auth Fetch Attempt ${retryCount + 1} Warning:`, authError.message)
                throw new Error(authError.message)
            }

            if (data?.users) {
                authUsers = data.users
                break // Success
            }
        } catch (e: any) {
            retryCount++
            if (retryCount >= maxRetries) {
                if (e.message?.includes('JSON')) {
                    console.warn("Auth Fetch Warning: Could not parse user list (JSON Error) after retries. Verification status may be incomplete.")
                } else {
                    console.error("Auth Fetch Critical Failure after retries", e)
                }
            } else {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }
    }

    // 3. Aggregate Stats per User
    const userStats = (profiles || []).map(p => {
        const userSubs = submissions?.filter(s => s.user_id === p.id) || []
        const authUser = authUsers?.find(u => u.id === p.id)

        // Partition into Active and Deleted
        const deletedSubs = userSubs.filter(s => s.deleted_at)
        const activeSubs = userSubs.filter(s => !s.deleted_at)

        const totalActive = activeSubs.length
        const unlocked = activeSubs.filter(s => s.analyses?.[0]?.is_unlocked).length
        const locked = totalActive - unlocked
        const deleted = deletedSubs.length

        return {
            ...p,
            email_confirmed_at: authUser?.email_confirmed_at || null,
            stats: {
                total_analyses: totalActive,
                unlocked_analyses: unlocked,
                locked_analyses: locked,
                deleted_analyses: deleted
            }
        }
    })

    // 4. Aggregate Unclaimed Stats
    const unclaimedSubs = submissions?.filter(s => !s.user_id && !s.deleted_at) || [] // Only active unclaimed

    // 5. Calculate Real Revenue from Transactions
    const { data: transactions } = await adminDb
        .from('transactions')
        .select('amount')

    // Amount is in cents
    const totalRevenueCents = transactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

    // 6. Fetch Error Count (Last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: errorCount } = await adminDb
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', oneDayAgo)

    // 7. Fetch Support Unread Count
    const { count: unreadSupport } = await adminDb
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_from_admin', false)
        .is('read_at', null)

    return {
        users: userStats,
        unclaimedCount: unclaimedSubs.length,
        totalRevenue: totalRevenueCents / 100,
        recentErrors: errorCount || 0,
        supportUnreadCount: unreadSupport || 0
    }
}

export async function getAllSubmissions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    const { data: submissions } = await adminDb
        .from('submissions')
        .select('*, profiles(email), analyses(title, score, is_unlocked)')
        .order('created_at', { ascending: false })
        .limit(100)

    // Sign URLs
    const submissionsWithImages = await Promise.all((submissions || []).map(async (sub) => {
        let imageUrl = null
        if (sub.image_path) {
            const { data: previewData } = await adminDb.storage
                .from('submissions')
                .createSignedUrl(sub.image_path, 3600)
            imageUrl = previewData?.signedUrl
        }
        return { ...sub, signedUrl: imageUrl }
    }))

    return submissionsWithImages
}



export async function restoreSubmission(submissionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    const { error } = await adminDb
        .from('submissions')
        .update({ deleted_at: null })
        .eq('id', submissionId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
}

export async function hardDeleteSubmission(submissionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    // 1. Get File Paths
    const { data: submission } = await adminDb
        .from('submissions')
        .select('image_path, thumbnail_path')
        .eq('id', submissionId)
        .single()

    if (submission) {
        // 2. Delete Files
        const filesToDelete = []
        if (submission.image_path) filesToDelete.push(submission.image_path)
        if (submission.thumbnail_path) filesToDelete.push(submission.thumbnail_path)
        // Also check if there's a convention-based preview even if not explicitly stored in thumbnail_path
        if (submission.image_path && !submission.thumbnail_path) {
            filesToDelete.push(submission.image_path.replace('uploads/', 'previews/'))
        }

        if (filesToDelete.length > 0) {
            const { error: storageError } = await adminDb.storage
                .from('submissions')
                .remove(filesToDelete)

            if (storageError) {
                console.error("Storage Delete Error:", storageError)
            }
        }
    }

    // 3. Delete Dependent Records (Manual Cascade)
    // Delete analyses first
    const { error: analysesError } = await adminDb
        .from('analyses')
        .delete()
        .eq('submission_id', submissionId)

    if (analysesError) throw new Error(`Failed to delete analyses: ${analysesError.message}`)

    // 4. Delete DB Record (Submission)
    const { error } = await adminDb
        .from('submissions')
        .delete()
        .eq('id', submissionId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
}

export async function getUnclaimedSubmissions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    const { data: submissions } = await adminDb
        .from('submissions')
        .select('*, analyses(title, score)')
        .is('user_id', null)
        .order('created_at', { ascending: false })

    // Sign URLs
    const submissionsWithImages = await Promise.all((submissions || []).map(async (sub) => {
        let imageUrl = null
        if (sub.image_path) {
            const { data: previewData } = await adminDb.storage
                .from('submissions')
                .createSignedUrl(sub.image_path, 3600)
            imageUrl = previewData?.signedUrl
        }
        return { ...sub, signedUrl: imageUrl }
    }))

    return submissionsWithImages
}

export async function updateUserCredits(userId: string, amount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    // 1. Perform Update (Direct Admin Write)
    // We fetch first to ensure we have the latest (though atomic RPC is better, strictly speaking, but this is admin panel)
    const { data: currentProfile } = await adminDb
        .from('profiles')
        .select('credits_balance')
        .eq('id', userId)
        .single()

    const currentBalance = currentProfile?.credits_balance || 0
    const newBalance = currentBalance + amount

    const { error: updateError } = await adminDb
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('id', userId)

    if (updateError) {
        console.error('Update Failed', updateError)
        throw new Error('Failed to update credits')
    }

    // 2. Log Admin Transaction
    await adminDb.from('transactions').insert({
        user_id: userId,
        amount: 0, // No real money
        currency: 'USD',
        credits: amount,
        type: 'admin_adjustment',
        stripe_session_id: `admin_${user.id}_${Date.now()}` // Pseudo-ID for tracking
    })

    revalidatePath('/admin')
}

export async function getErrorLogs(limit = 100) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    // 1. Fetch Logs (Raw)
    const { data: logs, error } = await adminDb
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch error logs', error)
        return []
    }

    if (!logs || logs.length === 0) return []

    // 2. Manual Join for Profiles
    const userIds = Array.from(new Set(logs.map(l => l.user_id).filter(Boolean)))

    let profilesMap: Record<string, string> = {}

    if (userIds.length > 0) {
        const { data: profiles } = await adminDb
            .from('profiles')
            .select('id, email')
            .in('id', userIds)

        profiles?.forEach(p => {
            profilesMap[p.id] = p.email
        })
    }

    // 3. Merge
    return logs.map(log => ({
        ...log,
        profiles: log.user_id ? { email: profilesMap[log.user_id] } : null
    }))
}

export async function deleteErrorLog(logId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    // Verify admin
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    await adminDb.from('error_logs').delete().eq('id', logId)
    revalidatePath('/admin')
}

// --- MESSAGING ---

export async function getAllConversations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    // Fetch all messages ordered by latest
    const { data: messages, error } = await adminDb
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to fetch conversations', error)
        return []
    }

    // Group by user
    const conversationsMap = new Map()

    messages?.forEach(msg => {
        if (!conversationsMap.has(msg.user_id)) {
            conversationsMap.set(msg.user_id, {
                userId: msg.user_id,
                lastMessage: msg,
                unreadCount: 0
            })
        }

        const conv = conversationsMap.get(msg.user_id)
        if (!msg.is_from_admin && !msg.read_at) {
            conv.unreadCount++
        }
    })

    const conversations = Array.from(conversationsMap.values())

    // Fetch Emails
    if (conversations.length > 0) {
        const userIds = conversations.map(c => c.userId)
        const { data: profiles } = await adminDb.from('profiles').select('id, email').in('id', userIds)

        conversations.forEach(c => {
            const p = profiles?.find(prof => prof.id === c.userId)
            c.email = p?.email || 'Unknown User'
        })
    }

    return conversations
}

export async function getConversation(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: messages } = await adminDb
        .from('messages')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: true })

    return messages || []
}

export async function replyToUser(targetUserId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    await adminDb.from('messages').insert({
        user_id: targetUserId,
        content,
        is_from_admin: true,
        read_at: null
    })

    revalidatePath('/admin')
}

export async function markAdminRead(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const adminDb = createAdminClient()
    await adminDb
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('is_from_admin', false)
        .is('read_at', null)

    revalidatePath('/admin')
}

export async function adminResolveConversation(targetUserId: string, status: 'open' | 'resolved') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    // Verify admin
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    await adminDb.from('conversation_status').upsert({
        user_id: targetUserId,
        status: status,
        updated_at: new Date().toISOString()
    })

    revalidatePath('/admin')
}

export async function adminDeleteConversation(targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminDb = createAdminClient()
    // Verify admin
    const { data: profile } = await adminDb.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Forbidden')

    await adminDb.from('messages').delete().eq('user_id', targetUserId)
    await adminDb.from('conversation_status').delete().eq('user_id', targetUserId)

    revalidatePath('/admin')
}


