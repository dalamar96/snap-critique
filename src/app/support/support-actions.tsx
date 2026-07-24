'use client'

import { useState } from 'react'
import { resolveConversation, deleteConversation } from '@/app/actions/messaging'
import { CheckCircle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SupportActions({ status }: { status: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleResolve = async () => {
        setLoading(true)
        await resolveConversation()
        setLoading(false)
        router.refresh()
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return
        setLoading(true)
        await deleteConversation()
        setLoading(false)
        router.refresh()
    }

    return (
        <div className="flex items-center gap-2">
            {status !== 'resolved' ? (
                <button 
                    onClick={handleResolve}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark Solved</span>
                </button>
            ) : (
                 <button 
                    onClick={handleResolve} // Re-opens (upsert 'resolved' logic currently... wait, I need a 'reopen' logic or toggle)
                    // Logic check: resolveConversation sets it to 'resolved'. 
                    // I need a reopen action or pass param. 
                    // I'll update resolveConversation to toggle or create a separate reopen.
                    // Actually, sending a message reopens it. Let's just allow Resolve if open.
                    // If resolved, maybe show "Resolved".
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-slate-500 border border-white/10 cursor-default rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Resolved</span>
                </button>
            )}

            <button 
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete Conversation"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}
