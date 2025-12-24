'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getUserAnalyses } from './actions'
import { X, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Profile {
    id: string
    email: string | null
    created_at: string
    credits_balance: number
    is_admin: boolean
}

export function UserTable({ profiles }: { profiles: Profile[] }) {
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [analyses, setAnalyses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

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

    return (
        <>
            <div className="border border-white/10 bg-black overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                                <th className="p-4">Date Joined</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Credits</th>
                                <th className="p-4">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles?.map((profile) => (
                                <tr 
                                    key={profile.id} 
                                    onClick={() => handleUserClick(profile)}
                                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4 text-slate-400 whitespace-nowrap">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                        <div className="text-xs text-slate-600">{new Date(profile.created_at).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4 font-bold text-white group-hover:text-primary transition-colors">
                                        {profile.email}
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "font-mono font-bold",
                                            profile.credits_balance > 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {profile.credits_balance}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {profile.is_admin 
                                        ? <span className="text-purple-500 text-xs font-bold uppercase bg-purple-950/30 px-2 py-1 rounded">ADMIN</span> 
                                        : <span className="text-slate-700 text-xs">-</span>
                                        }
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
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    User Details
                                    {selectedUser.is_admin && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded uppercase">Admin</span>}
                                </h3>
                                <div className="text-slate-400 text-sm mt-1">{selectedUser.email}</div>
                                <div className="text-slate-500 text-xs font-mono mt-1">ID: {selectedUser.id}</div>
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
                                            <Link 
                                                href={`/analysis/${submission.id}`} 
                                                key={submission.id}
                                                target="_blank"
                                                className="flex items-center gap-4 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                            >
                                                {/* Thumbnail Fallback */}
                                                <div className="w-16 h-16 bg-black rounded overflow-hidden flex-shrink-0 relative border border-white/10">
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

                                                <div className="flex-1 min-w-0">
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
                                                            <span className="px-2 py-0.5 rounded uppercase font-bold bg-red-950/40 text-red-500 border border-red-900/50">
                                                                Deleted
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                            </Link>
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
