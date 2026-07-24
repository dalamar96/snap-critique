'use client'

import { useState, useEffect } from 'react'
import { getAllSubmissions, hardDeleteSubmission, restoreSubmission } from './actions'

type Submission = Awaited<ReturnType<typeof getAllSubmissions>>[number]
import { Loader2, ExternalLink, Image as ImageIcon, X, Trash2, Undo } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function AllAnalysesTable({ 
    isOpen, 
    onClose 
}: { 
    isOpen: boolean
    onClose: () => void 
}) {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && loading && submissions.length === 0) {
            getAllSubmissions().then(data => {
                setSubmissions(data || [])
                setLoading(false)
            })
        }
    }, [isOpen, loading, submissions.length])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
             <div 
                className="bg-slate-900 border border-white/10 w-full max-w-5xl h-full md:h-auto md:max-h-[80vh] rounded-none md:rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                         <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Recent Analyses (100)
                         </h3>
                         <p className="text-slate-400 text-sm">Overview of all system activity.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                         <div className="h-40 flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p>Fetching history...</p>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No submissions found.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm min-w-[800px]">
                            <thead className="sticky top-0 bg-slate-900 z-10">
                                <tr className="border-b border-white/10 text-slate-500 uppercase text-xs">
                                    <th className="p-4">Submission</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Unlocked</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className={cn("hover:bg-white/5 group", sub.deleted_at && "bg-red-950/10")}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-12 h-12 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10 relative">
                                                    {sub.signedUrl ? (
                                                        <img src={sub.signedUrl} alt={sub.analyses?.[0]?.title || 'Submission thumbnail'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-full h-full p-3 text-slate-700" />
                                                    )}
                                                 </div>
                                                 <div>
                                                     <div className="font-bold text-white mb-1">
                                                         {sub.analyses?.[0]?.title || 'Untitled'}
                                                     </div>
                                                     <div className="font-mono text-xs text-slate-500">{sub.id.slice(0,8)}...</div>
                                                 </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {sub.profiles ? (
                                                <div className="font-bold text-white max-w-[150px] truncate" title={sub.profiles.email}>
                                                    {sub.profiles.email}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 italic">Guest</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                             <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded uppercase font-bold text-[10px]",
                                                    sub.status === 'done' ? "bg-green-500/10 text-green-500" : 
                                                    sub.status === 'error' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                                )}>
                                                    {sub.status}
                                                </span>
                                                {sub.deleted_at && (
                                                     <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-red-950/40 text-red-500 border border-red-900/50">
                                                        Deleted
                                                    </span>
                                                )}
                                             </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {sub.analyses?.[0]?.is_unlocked ? (
                                                <span className="text-green-500 font-bold text-xs">YES</span>
                                            ) : (
                                                <span className="text-slate-700 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-500 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(sub.created_at))} ago
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {sub.deleted_at ? (
                                                    <>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                if (confirm('Restore this analysis?')) {
                                                                    await restoreSubmission(sub.id)
                                                                    // Optimistic update: mark as active
                                                                    setSubmissions(prev => prev.map(p => 
                                                                        p.id === sub.id ? { ...p, deleted_at: null } : p
                                                                    ))
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-blue-500/20 text-slate-500 hover:text-blue-500 rounded transition-colors"
                                                            title="Restore Analysis"
                                                        >
                                                            <Undo className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                if (confirm('Permanently delete this analysis? This cannot be undone.')) {
                                                                    await hardDeleteSubmission(sub.id)
                                                                    setSubmissions(prev => prev.filter(p => p.id !== sub.id))
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded transition-colors"
                                                            title="Permanently Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link 
                                                            href={`/analysis/${sub.id}`} 
                                                            target="_blank"
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-primary hover:text-black border border-white/10 rounded transition-all text-xs font-bold uppercase"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                        
                                                        {!sub.profiles && (
                                                             <button 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Permanently delete this unrelated analysis?')) {
                                                                        await hardDeleteSubmission(sub.id)
                                                                        // Optimistic update
                                                                        setSubmissions(prev => prev.filter(p => p.id !== sub.id))
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded transition-colors"
                                                                title="Delete Unclaimed Analysis"
                                                             >
                                                                 <Trash2 className="w-4 h-4" />
                                                             </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
