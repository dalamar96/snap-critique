'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/auth/require-admin'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'
import { LessonNode } from '../learning/actions'

export async function updateSystemPrompt(content: string) {
    const { adminDb } = await requireAdmin()

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
    const { adminDb } = await requireAdmin()

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
    const { adminDb } = await requireAdmin()

    // 1. Get Totals (Efficiently)
    const { count: userCount } = await adminDb.from('profiles').select('*', { count: 'exact', head: true })
    const { count: submissionCount } = await adminDb.from('submissions').select('*', { count: 'exact', head: true })

    // 2. Fetch Recent Profiles (Paginated - Top 50)
    const { data: profiles } = await adminDb
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    // 2a. Fetch their stats specifically (instead of ALL submissions)
    // We only need stats for these 50 users to show in the table.
    // For the global "Total Analyses" KPI, we use submissionCount.
    const userIds = profiles?.map(p => p.id) || []

    // Fetch submissions only for these users
    const { data: userSubmissions } = await adminDb
        .from('submissions')
        .select('user_id, analyses(is_unlocked), deleted_at')
        .in('user_id', userIds)

    // 2b. Fetch Auth Data for these users only
    const { data: authUsersData } = await adminDb.auth.admin.listUsers()
    // Note: listUsers() doesn't support .in filter easily without hacking, 
    // and it's paginated. For 50 users, we might miss some if they aren't in first page of auth.
    // However, connecting auth.users to profiles is always tricky. 
    // For now, we'll skip the "email_confirmed" check for the table or just fetch first page.
    const authUsers = authUsersData?.users || []

    // 3. Aggregate Stats per Recent User
    const userStats = (profiles || []).map(p => {
        const userSubs = userSubmissions?.filter(s => s.user_id === p.id) || []
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

    // 4. Unclaimed Count
    const { count: unclaimedCount } = await adminDb
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .is('user_id', null)
        .is('deleted_at', null)

    // 5. Total Revenue (Approximation for performance, or use separate query)
    // Loading all transactions is bad. 
    // We will limit to recent 1000 for calculation or assume 0 for now to stop crash.
    // ideally: .rpc('get_total_revenue')
    const { data: transactions } = await adminDb
        .from('transactions')
        .select('amount')
        .order('created_at', { ascending: false })
        .limit(1000)

    const totalRevenueCents = transactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

    // 6. Recent Errors
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: errorCount } = await adminDb
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', oneDayAgo)

    // 7. Support
    const { count: unreadSupport } = await adminDb
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_from_admin', false)
        .is('read_at', null)

    // 8. Orphaned Files (Limited check)
    const { data: allFiles } = await adminDb.storage.from('submissions').list('uploads', { limit: 100 })
    const { data: recentSubs } = await adminDb.from('submissions').select('image_path').order('created_at', { ascending: false }).limit(200)
    const usedPaths = new Set(recentSubs?.map(s => s.image_path) || [])

    // This is an estimation now, not exact count of all orphans
    const orphanCount = (allFiles || []).filter(f => {
        const isImage = f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        return !usedPaths.has(`uploads/${f.name}`) && isImage
    }).length

    return {
        users: userStats, // Only top 50
        userCount: userCount || 0, // Total count
        unclaimedCount: unclaimedCount || 0,
        totalRevenue: totalRevenueCents / 100,
        recentErrors: errorCount || 0,
        supportUnreadCount: unreadSupport || 0,
        orphanedCount: orphanCount,
        totalAnalysesCount: submissionCount || 0 // Total analyses
    }
}

export async function getAllSubmissions() {
    const { adminDb } = await requireAdmin()

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
    const { user, adminDb } = await requireAdmin()

    const { error } = await adminDb
        .from('submissions')
        .update({ deleted_at: null })
        .eq('id', submissionId)

    if (error) throw new Error(error.message)
    await logAdminAction(adminDb, user.id, 'restore_submission', { targetTable: 'submissions', targetId: submissionId })
    revalidatePath('/admin')
}

export async function hardDeleteSubmission(submissionId: string) {
    const { user, adminDb } = await requireAdmin()

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
    await logAdminAction(adminDb, user.id, 'hard_delete_submission', { targetTable: 'submissions', targetId: submissionId })
    revalidatePath('/admin')
}

export async function getUnclaimedSubmissions() {
    const { adminDb } = await requireAdmin()

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
    const { user, adminDb } = await requireAdmin()

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

    await logAdminAction(adminDb, user.id, 'update_user_credits', {
        targetTable: 'profiles',
        targetId: userId,
        details: { amount, newBalance },
    })

    revalidatePath('/admin')
}

export async function getErrorLogs(limit = 100) {
    const { adminDb } = await requireAdmin()

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

    const profilesMap: Record<string, string> = {}

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

export async function getAdminAuditLog(limit = 100) {
    const { adminDb } = await requireAdmin()

    const { data: logs, error } = await adminDb
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Failed to fetch admin audit log', error)
        return []
    }

    if (!logs || logs.length === 0) return []

    // Manual join for admin emails (same pattern as getErrorLogs)
    const adminIds = Array.from(new Set(logs.map((l) => l.admin_id).filter(Boolean)))
    const adminsMap: Record<string, string> = {}

    if (adminIds.length > 0) {
        const { data: admins } = await adminDb.from('profiles').select('id, email').in('id', adminIds)
        admins?.forEach((a) => {
            adminsMap[a.id] = a.email
        })
    }

    return logs.map((log) => ({
        ...log,
        admin_email: adminsMap[log.admin_id] || log.admin_id,
    }))
}

export async function deleteErrorLog(logId: string) {
    const { user, adminDb } = await requireAdmin()

    await adminDb.from('error_logs').delete().eq('id', logId)
    await logAdminAction(adminDb, user.id, 'delete_error_log', { targetTable: 'error_logs', targetId: logId })
    revalidatePath('/admin')
}

// --- MESSAGING ---

export async function getAllConversations() {
    const { adminDb } = await requireAdmin()

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
    const { adminDb } = await requireAdmin()

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
    const { adminDb } = await requireAdmin()

    await adminDb.from('conversation_status').upsert({
        user_id: targetUserId,
        status: status,
        updated_at: new Date().toISOString()
    })

    revalidatePath('/admin')
}

export async function adminDeleteConversation(targetUserId: string) {
    const { user, adminDb } = await requireAdmin()

    await adminDb.from('messages').delete().eq('user_id', targetUserId)
    await adminDb.from('conversation_status').delete().eq('user_id', targetUserId)

    await logAdminAction(adminDb, user.id, 'delete_conversation', { targetTable: 'messages', targetId: targetUserId })
    revalidatePath('/admin')
}



// --- LESSON MANAGEMENT ---

export async function getAdminLessons() {
    const { adminDb } = await requireAdmin()

    const { data: lessons, error } = await adminDb
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true })

    if (error) throw new Error(error.message)
    return lessons as LessonNode[]
}

export async function upsertLesson(lesson: Partial<LessonNode>) {
    const { user, adminDb } = await requireAdmin()

    // Clean payload
    const payload: Record<string, unknown> = { ...lesson }
    delete payload.is_completed
    delete payload.children

    const { error } = await adminDb
        .from('lessons')
        .upsert(payload)

    if (error) throw new Error(error.message)
    await logAdminAction(adminDb, user.id, 'upsert_lesson', { targetTable: 'lessons', targetId: lesson.id })
    revalidatePath('/learning')
    revalidatePath('/admin')
}

export async function deleteLesson(id: string) {
    const { user, adminDb } = await requireAdmin()

    const { error } = await adminDb.from('lessons').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await logAdminAction(adminDb, user.id, 'delete_lesson', { targetTable: 'lessons', targetId: id })
    revalidatePath('/learning')
    revalidatePath('/admin')
}

export async function getLessonComponents() {
    // Only available on server
    const componentsDir = path.join(process.cwd(), 'src', 'components', 'lessons')

    try {
        if (!fs.existsSync(componentsDir)) return []

        const files = fs.readdirSync(componentsDir)
        return files
            .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'))
            .map(f => f.replace(/\.(tsx|jsx)$/, ''))
    } catch (e) {
        console.error("Failed to scan lesson components", e)
        return []
    }
}

export async function getOrphanedFiles() {
    const adminDb = createAdminClient()

    // 1. Get all files in storage
    const { data: files, error: storageError } = await adminDb
        .storage
        .from('submissions')
        .list('uploads', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (storageError || !files) {
        console.error('List storage error:', storageError)
        return []
    }

    // 2. Get all active image paths from DB
    const { data: submissions, error: dbError } = await adminDb
        .from('submissions')
        .select('image_path')

    if (dbError) {
        console.error('List db error:', dbError)
        return []
    }

    const activePaths = new Set(submissions?.map(s => s.image_path) || [])

    // 3. Filter orphans
    const orphansList = files.filter(f => {
        const fullPath = `uploads/${f.name}`
        const isImage = f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        return !activePaths.has(fullPath) && isImage
    })

    const orphans = await Promise.all(orphansList.map(async f => {
        const { data } = await adminDb.storage
            .from('submissions')
            .createSignedUrl(`previews/${f.name}`, 3600)

        return {
            name: f.name,
            size: f.metadata?.size || 0,
            marketing_url: f.id,
            created_at: f.created_at,
            preview_url: data?.signedUrl || ''
        }
    }))

    return orphans
}

export async function deleteStorageFile(filename: string) {
    const adminDb = createAdminClient()

    const { error: uploadError } = await adminDb
        .storage
        .from('submissions')
        .remove([`uploads/${filename}`])

    const { error: previewError } = await adminDb
        .storage
        .from('submissions')
        .remove([`previews/${filename}`])

    if (uploadError) return { error: 'Failed to delete upload' }
    if (previewError) return { error: 'Failed to delete preview' }

    return { success: true }
}
