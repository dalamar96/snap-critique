'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Logger } from '@/lib/logger'

// Fetch messages for the current user
export async function getMessages() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (error) throw error
        return messages || []
    } catch (e) {
        Logger.error('Failed to get messages', e)
        return []
    }
}

// Send a message from the user to admin
export async function sendMessage(content: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        if (!content.trim()) return

        const { error } = await supabase.from('messages').insert({
            user_id: user.id,
            content: content,
            is_from_admin: false,
            read_at: null
        })

        if (error) throw error

        // Auto-reopen conversation if sent by user
        await supabase.from('conversation_status').upsert({
            user_id: user.id,
            status: 'open',
            updated_at: new Date().toISOString()
        })

        revalidatePath('/support')
    } catch (e) {
        Logger.error('Failed to send message', e)
        throw new Error('Failed to send message')
    }
}

// Mark messages as read by user (messages from admin)
export async function markAsRead() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('is_from_admin', true)
            .is('read_at', null)

            .is('read_at', null)

        // revalidatePath('/support') - Cannot be called during render
    } catch (e) {
        Logger.error('Failed to mark read', e)
    }
}

export async function getConversationStatus() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data } = await supabase
            .from('conversation_status')
            .select('status')
            .eq('user_id', user.id)
            .single()

        return data?.status || 'open'
    } catch (e) {
        return 'open'
    }
}

export async function resolveConversation() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('conversation_status').upsert({
            user_id: user.id,
            status: 'resolved',
            updated_at: new Date().toISOString()
        })
        revalidatePath('/support')
    } catch (e) {
        Logger.error('Failed to resolve', e)
    }
}

export async function deleteConversation() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Delete messages
        await supabase.from('messages').delete().eq('user_id', user.id)
        // Reset/Delete status
        await supabase.from('conversation_status').delete().eq('user_id', user.id)

        revalidatePath('/support')
    } catch (e) {
        Logger.error('Failed to delete conversation', e)
    }
}
