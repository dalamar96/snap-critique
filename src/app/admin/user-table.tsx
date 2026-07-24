'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getUserAnalyses, restoreSubmission, hardDeleteSubmission, updateUserCredits } from './actions'
import { X, ExternalLink, Loader2, Image as ImageIcon, Trash2, RefreshCw, AlertTriangle, Plus, Minus, Coins } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export interface Profile {
    id: string
    email: string | null
    created_at: string
    credits_balance: number
    is_admin: boolean
    email_confirmed_at?: string | null
    stats?: {
        total_analyses: number
        unlocked_analyses: number
        locked_analyses: number
        deleted_analyses: number
    }
}

type UserAnalyses = Awaited<ReturnType<typeof getUserAnalyses>>

export function UserTable({ profiles }: { profiles: Profile[] }) {
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [analyses, setAnalyses] = useState<UserAnalyses>([])
    const [loading, setLoading] = useState(false)
    const [creditAmount, setCreditAmount] = useState(1)
    const [updatingCredits, setUpdatingCredits] = useState(false)

    const handleUserClick = async (profile: Profile) => {
        setSelectedUser(profile)
        setLoading(true)
        setAnalyses([])
        try {
            const data = await getUserAnalyses(profile.id)
            setAnalyses(data || [])
        } catch (error) {
            console.error('Failed to fetch analyses', error)
        } finally {
            setLoading(false)
        }
    }
    
    const handleCreditUpdate = async (amount: number) => {
        if (!selectedUser) return
        if (!confirm(`Are you sure you want to ${amount > 0 ? 'add' : 'remove'} ${Math.abs(amount)} credits?`)) return

        setUpdatingCredits(true)
        try {
            await updateUserCredits(selectedUser.id, amount)
            // Optimistic update locally or wait for revalidate
            setSelectedUser({
                ...selectedUser,
                credits_balance: selectedUser.credits_balance + amount
            })
        } catch {
            alert('Failed to update credits')
        } finally {
            setUpdatingCredits(false)
        }
    }

    return (
        <>
            <div className="border border-white/10 bg-black overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                                <th className="p-4">User</th>
                                <th className="p-4 text-center">Active</th>
                                <th className="p-4 text-center">Unlocked</th>
                                <th className="p-4 text-center">Locked</th>
                                <th className="p-4 text-center">Deleted</th>
                                <th className="p-4">Credits</th>
                                <th className="p-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles?.map((profile) => (
                                <tr 
                                    key={profile.id} 
                                    onClick={() => handleUserClick(profile)}
                                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className={cn("font-bold transition-colors", 
                                            !profile.email_confirmed_at ? "text-red-500" : "text-white group-hover:text-primary"
                                        )}>
                                            {profile.email}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {profile.is_admin && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold">Admin</span>}
                                            {!profile.email_confirmed_at && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold">Unverified</span>}
                                            <span className="text-[10px] text-slate-600 font-mono">{profile.id.slice(0,8)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-mono text-white font-bold bg-white/10 px-2 py-1 rounded">
                                            {profile.stats?.total_analyses || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-mono text-green-500 font-bold">
                                            {profile.stats?.unlocked_analyses || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                            <span className="font-mono text-slate-500">
                                            {profile.stats?.locked_analyses || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {profile.stats?.deleted_analyses ? (
                                            <span className="font-mono text-red-500 font-bold bg-red-950/30 px-2 py-1 rounded">
                                                {profile.stats.deleted_analyses}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-slate-700">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "font-mono font-bold",
                                            profile.credits_balance > 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {profile.credits_balance}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 whitespace-nowrap text-xs">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
                    <div 
                        className="bg-slate-900 border border-white/10 w-full max-w-3xl max-h-[80vh] rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    User Details
                                    {selectedUser.is_admin && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded uppercase">Admin</span>}
                                </h3>
                                <div className="text-slate-400 text-sm mt-1">{selectedUser.email}</div>
                                <div className="text-slate-500 text-xs font-mono mt-1">ID: {selectedUser.id}</div>
                                
                                {/* Credit Management */}
                                <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-lg flex items-center gap-4 max-w-fit">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white px-2">
                                        <Coins className="w-4 h-4 text-yellow-500" />
                                        Credits: <span className="text-green-500">{selectedUser.credits_balance}</span>
                                    </div>
                                    <div className="h-4 w-px bg-white/10" />
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={creditAmount} 
                                            onChange={(e) => setCreditAmount(parseInt(e.target.value) || 1)}
                                            className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-center text-xs text-white"
                                        />
                                        <button 
                                            onClick={() => handleCreditUpdate(creditAmount)}
                                            disabled={updatingCredits}
                                            className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                                            title="Add Credits"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                         <button 
                                            onClick={() => handleCreditUpdate(-creditAmount)}
                                            disabled={updatingCredits}
                                            className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                            title="Remove Credits"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-500 space-y-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p>Loading user history...</p>
                                </div>
                            ) : analyses.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                                    <p>No analyses found for this user.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Submission History ({analyses.length})</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {analyses.map((submission) => (
                                            <div 
                                                key={submission.id}
                                                className={cn(
                                                    "flex items-center gap-4 p-3 rounded-lg border transition-all group relative",
                                                    submission.deleted_at 
                                                        ? "border-red-900/30 bg-red-950/10" 
                                                        : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                                )}
                                            >
                                                <Link 
                                                    href={`/analysis/${submission.id}`} 
                                                    target="_blank"
                                                    className="absolute inset-0 z-0"
                                                />

                                                {/* Thumbnail Fallback */}
                                                <div className="w-16 h-16 bg-black rounded overflow-hidden flex-shrink-0 relative border border-white/10 z-10 pointer-events-none">
                                                    {submission.signedUrl ? (
                                                        <img 
                                                           src={submission.signedUrl} 
                                                           alt="Thumbnail" 
                                                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 z-10 pointer-events-none">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-white truncate max-w-[200px]">
                                                            {submission.analyses?.[0]?.title || 'Untitled'}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            {new Date(submission.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded uppercase font-bold",
                                                            submission.status === 'done' ? "bg-green-500/10 text-green-500" : 
                                                            submission.status === 'error' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                                        )}>
                                                            {submission.status}
                                                        </span>
                                                        {submission.analyses?.[0]?.is_unlocked && (
                                                            <span className="px-2 py-0.5 rounded uppercase font-bold bg-yellow-500/10 text-yellow-500">
                                                                Unlocked
                                                            </span>
                                                        )}
                                                        {submission.deleted_at && (
                                                            <span className="px-2 py-0.5 rounded uppercase font-bold bg-red-950/40 text-red-500 border border-red-900/50 flex items-center gap-1">
                                                                <Trash2 className="w-3 h-3" />
                                                                Deleted {formatDistanceToNow(new Date(submission.deleted_at))} ago
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="z-20 flex items-center gap-2 pl-2 border-l border-white/10 ml-2">
                                                    {submission.deleted_at ? (
                                                        <>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation()
                                                                    if (confirm('Restore this submission?')) {
                                                                        await restoreSubmission(submission.id)
                                                                        handleUserClick(selectedUser!) // Refresh
                                                                    }
                                                                }}
                                                                className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded transition-colors"
                                                                title="Restore"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation()
                                                                    if (confirm('PERMANENTLY DESTROY? This cannot be undone.')) {
                                                                        await hardDeleteSubmission(submission.id)
                                                                        handleUserClick(selectedUser!) // Refresh
                                                                    }
                                                                }}
                                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded transition-colors"
                                                                title="Hard Delete"
                                                            >
                                                                <AlertTriangle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <Link 
                                                            href={`/analysis/${submission.id}`} 
                                                            target="_blank"
                                                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-600 hover:text-white"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
