import { useState, useEffect } from 'react'
import { getAdminAuditLog } from './actions'
import { X, ShieldCheck, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditLogEntry {
    id: string
    admin_id: string
    admin_email: string
    action: string
    target_table: string | null
    target_id: string | null
    details: unknown
    created_at: string
}

export function AuditLogTable({ onClose }: { onClose: () => void }) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        const data = await getAdminAuditLog(100)
        setLogs(data)
        setLoading(false)
    }

    useEffect(() => {
        // Defer to a microtask so the initial setLoading(true) inside
        // fetchLogs doesn't run synchronously within the effect.
        queueMicrotask(() => { fetchLogs() })
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-primary/10">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        Admin Audit Log
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={fetchLogs} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Refresh">
                            <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <table className="w-full text-left text-sm font-mono min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-500 uppercase text-xs">
                                <th className="p-3">Time</th>
                                <th className="p-3">Admin</th>
                                <th className="p-3">Action</th>
                                <th className="p-3">Target</th>
                                <th className="p-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-slate-400 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-slate-400">{log.admin_email}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-primary/20 text-primary">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400">
                                        {log.target_table ? `${log.target_table}:${log.target_id}` : '-'}
                                    </td>
                                    <td className="p-3 text-slate-500 text-xs truncate max-w-xs" title={JSON.stringify(log.details)}>
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && logs.length === 0 && (
                        <div className="text-center p-12 text-slate-500">
                            No audit log entries yet — this table only fills in once the hardening migration
                            (supabase/migrations/20260722000000_hardening.sql) has been applied.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
