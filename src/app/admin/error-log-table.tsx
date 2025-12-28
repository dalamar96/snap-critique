'use client'
import { useState, useEffect } from 'react'
import { getErrorLogs } from './actions'
import { X, AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorLog {
    id: string
    timestamp: string
    level: string
    message: string
    stack?: string
    context?: any
    source: string
    profiles?: { email: string }
}

export function ErrorLogTable({ onClose }: { onClose: () => void }) {
    const [logs, setLogs] = useState<ErrorLog[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedLog, setExpandedLog] = useState<string | null>(null)

    const fetchLogs = async () => {
        setLoading(true)
        const data = await getErrorLogs(100)
        setLogs(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-slate-900 border border-white/10 w-full max-w-6xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-red-950/20">
                    <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        System Error Logs
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={fetchLogs} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Refresh">
                            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-4">
                    <table className="w-full text-left text-sm font-mono">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-500 uppercase text-xs">
                                <th className="p-3 w-10"></th>
                                <th className="p-3">Time</th>
                                <th className="p-3">Level</th>
                                <th className="p-3">Source</th>
                                <th className="p-3">Message</th>
                                <th className="p-3">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map(log => (
                                <>
                                    <tr 
                                        key={log.id} 
                                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                        className="hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <td className="p-3 text-slate-500">
                                            {expandedLog === log.id ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                                        </td>
                                        <td className="p-3 text-slate-400 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-3">
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs font-bold uppercase",
                                                log.level === 'error' ? "bg-red-500/20 text-red-500" :
                                                log.level === 'warn' ? "bg-yellow-500/20 text-yellow-500" :
                                                "bg-blue-500/20 text-blue-500"
                                            )}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-400 uppercase text-xs">{log.source}</td>
                                        <td className="p-3 text-white truncate max-w-sm" title={log.message}>
                                            {log.message}
                                        </td>
                                        <td className="p-3 text-slate-400">
                                            {log.profiles?.email || '-'}
                                        </td>
                                    </tr>
                                    {expandedLog === log.id && (
                                        <tr className="bg-black/40">
                                            <td colSpan={6} className="p-4">
                                                <div className="space-y-4">
                                                    {log.stack && (
                                                        <div>
                                                            <div className="text-xs uppercase text-slate-500 mb-1">Stack Trace</div>
                                                            <pre className="text-xs text-red-400 overflow-x-auto p-2 bg-red-950/10 border border-red-900/20 rounded">
                                                                {log.stack}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {log.context && (
                                                        <div>
                                                            <div className="text-xs uppercase text-slate-500 mb-1">Context</div>
                                                            <pre className="text-xs text-green-400 overflow-x-auto p-2 bg-green-950/10 border border-green-900/20 rounded">
                                                                {JSON.stringify(log.context, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                    {!loading && logs.length === 0 && (
                        <div className="text-center p-12 text-slate-500">No error logs found.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
