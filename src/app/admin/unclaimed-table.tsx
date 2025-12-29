'use client'

import { useState, useEffect } from 'react'
import { getUnclaimedSubmissions } from './actions'
import { Loader2, ExternalLink, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export function UnclaimedTable({ 
    isOpen, 
    onClose 
}: { 
    isOpen: boolean
    onClose: () => void 
}) {
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && loading && submissions.length === 0) {
            getUnclaimedSubmissions().then(data => {
                setSubmissions(data || [])
                setLoading(false)
            })
        }
    }, [isOpen, loading, submissions.length])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
             <div 
                className="bg-slate-900 border border-white/10 w-full max-w-4xl h-full md:h-auto md:max-h-[80vh] rounded-none md:rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                         <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Unclaimed Analysis Queue
                         </h3>
                         <p className="text-slate-400 text-sm">Guest submissions waiting to be claimed.</p>
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
                            <p>Fetching queue...</p>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No unclaimed submissions found.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="sticky top-0 bg-slate-900 z-10">
                                <tr className="border-b border-white/10 text-slate-500 uppercase text-xs">
                                    <th className="p-4">Submission</th>
                                    <th className="p-4">Aging</th>
                                    <th className="p-4">Created At</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-white/5 group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-12 h-12 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10">
                                                    {sub.signedUrl ? (
                                                        <img src={sub.signedUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-full h-full p-3 text-slate-700" />
                                                    )}
                                                 </div>
                                                 <div>
                                                     <div className="font-bold text-white mb-1">
                                                         {sub.analyses?.[0]?.title || 'Processing...'}
                                                     </div>
                                                     <div className="font-mono text-xs text-slate-500">{sub.id.slice(0,8)}...</div>
                                                 </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-orange-400 font-mono font-bold">
                                                 {formatDistanceToNow(new Date(sub.created_at))}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">
                                            {new Date(sub.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link 
                                                href={`/analysis/${sub.id}`} 
                                                target="_blank"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-primary hover:text-black border border-white/10 rounded transition-all text-xs font-bold uppercase"
                                            >
                                                View <ExternalLink className="w-3 h-3" />
                                            </Link>
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
