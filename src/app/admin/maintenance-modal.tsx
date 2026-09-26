'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Wrench, Mail, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    getUnlockReminderCandidates,
    sendUnlockReminders,
    getGuestPurgePreview,
    purgeExpiredGuestSubmissions,
    type ReminderCandidate,
    type GuestPurgePreview,
} from './maintenance-actions'
import { REMINDER_COOLDOWN_DAYS } from '@/lib/maintenance'

type Confirm = 'remind-all' | 'purge' | null

export function MaintenanceModal({ onClose }: { onClose: () => void }) {
    const [candidates, setCandidates] = useState<ReminderCandidate[] | null>(null)
    const [preview, setPreview] = useState<GuestPurgePreview | null>(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string | null>(null) // 'purge' | 'remind-all' | userId
    const [confirm, setConfirm] = useState<Confirm>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [c, p] = await Promise.all([getUnlockReminderCandidates(), getGuestPurgePreview()])
            setCandidates(c)
            setPreview(p)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to load maintenance data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        queueMicrotask(() => { load() })
    }, [load])

    const dueCandidates = (candidates ?? []).filter(c => c.due)

    const sendReminders = async (userIds?: string[]) => {
        setBusy(userIds?.length === 1 ? userIds[0] : 'remind-all')
        try {
            const r = await sendUnlockReminders(userIds)
            if (r.failed > 0) {
                toast.error(`Sent ${r.sent}, failed ${r.failed}: ${r.errors[0]?.error ?? 'unknown error'}`)
            } else {
                toast.success(`Sent ${r.sent} reminder${r.sent === 1 ? '' : 's'}` + (r.remaining > 0 ? ` — ${r.remaining} more due, run again` : ''))
            }
            await load()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to send reminders')
        } finally {
            setBusy(null)
        }
    }

    const purge = async () => {
        setBusy('purge')
        try {
            const r = await purgeExpiredGuestSubmissions()
            toast.success(`Deleted ${r.deleted} guest submission${r.deleted === 1 ? '' : 's'} and ${r.filesRemoved} files` + (r.remaining > 0 ? ` — ${r.remaining} remaining, run again` : ''))
            await load()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Cleanup failed')
        } finally {
            setBusy(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-primary/10">
                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                        <Wrench className="w-6 h-6" />
                        Maintenance
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={load} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Refresh">
                            <RefreshCw className={loading ? 'w-5 h-5 animate-spin' : 'w-5 h-5'} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-10">
                    {/* ---------------- Unlock reminders ---------------- */}
                    <section>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" />
                                    Unlock Reminders
                                </h4>
                                <p className="text-slate-400 text-sm mt-1">
                                    Users who signed up but haven&apos;t unlocked their critique. Each person can be
                                    reminded once every {REMINDER_COOLDOWN_DAYS} days, and anyone who
                                    unsubscribed is skipped automatically.
                                </p>
                            </div>
                            <button
                                disabled={loading || busy !== null || dueCandidates.length === 0}
                                onClick={() => setConfirm('remind-all')}
                                className="shrink-0 bg-primary text-black font-bold uppercase text-xs px-4 py-2 rounded disabled:opacity-40 flex items-center gap-2"
                            >
                                {busy === 'remind-all' && <Loader2 className="w-4 h-4 animate-spin" />}
                                Send to all due ({dueCandidates.length})
                            </button>
                        </div>

                        {loading && !candidates ? (
                            <div className="h-24 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : candidates && candidates.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded">
                                Nobody has an unlocked-pending critique right now.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-white/10 rounded">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="bg-black text-slate-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Locked</th>
                                            <th className="p-3">Waiting since</th>
                                            <th className="p-3">Credits</th>
                                            <th className="p-3">Last reminder</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(candidates ?? []).map((c) => (
                                            <tr key={c.userId} className="hover:bg-white/5">
                                                <td className="p-3 text-white">{c.email}</td>
                                                <td className="p-3">{c.lockedCount}</td>
                                                <td className="p-3 text-slate-400">
                                                    {c.oldestLockedAt ? formatDistanceToNow(new Date(c.oldestLockedAt), { addSuffix: true }) : '—'}
                                                </td>
                                                <td className="p-3">{c.credits}</td>
                                                <td className="p-3 text-slate-400">
                                                    {c.lastReminderAt ? formatDistanceToNow(new Date(c.lastReminderAt), { addSuffix: true }) : 'Never'}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        disabled={!c.due || busy !== null}
                                                        onClick={() => sendReminders([c.userId])}
                                                        className="text-xs uppercase font-bold border border-primary/40 text-primary px-3 py-1 rounded hover:bg-primary hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary"
                                                    >
                                                        {busy === c.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : c.optedOut ? 'Unsubscribed' : c.due ? 'Send' : 'Cooling down'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* ---------------- Guest cleanup ---------------- */}
                    <section>
                        <h4 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Guest Cleanup
                        </h4>
                        <p className="text-slate-400 text-sm mt-1 mb-4">
                            Permanently deletes guest critiques (no account) older than {preview?.retentionDays ?? 14} days —
                            photos, previews, comments, and analysis data. They can no longer be claimed or contacted.
                        </p>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-500/30 bg-red-500/5 rounded p-4">
                            <div className="text-sm">
                                {preview ? (
                                    <>
                                        <span className="text-2xl font-bold text-white">{preview.eligibleCount}</span>{' '}
                                        <span className="text-slate-400">
                                            guest submission{preview.eligibleCount === 1 ? '' : 's'} eligible
                                            {preview.oldestCreatedAt && <> · oldest {formatDistanceToNow(new Date(preview.oldestCreatedAt), { addSuffix: true })}</>}
                                        </span>
                                    </>
                                ) : (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                )}
                            </div>
                            <button
                                disabled={loading || busy !== null || !preview || preview.eligibleCount === 0}
                                onClick={() => setConfirm('purge')}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs px-4 py-2 rounded disabled:opacity-40 flex items-center gap-2"
                            >
                                {busy === 'purge' && <Loader2 className="w-4 h-4 animate-spin" />}
                                Delete expired guest data
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm === 'purge' ? 'Permanently delete guest data?' : 'Send reminder emails?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm === 'purge'
                                ? `This deletes up to ${Math.min(preview?.eligibleCount ?? 0, 200)} guest submissions (of ${preview?.eligibleCount ?? 0} eligible) older than ${preview?.retentionDays ?? 14} days, along with their photos and analyses. This cannot be undone.`
                                : `This emails ${Math.min(dueCandidates.length, 100)} user${dueCandidates.length === 1 ? '' : 's'} about their locked critiques.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                const action = confirm
                                setConfirm(null)
                                if (action === 'purge') purge()
                                else sendReminders()
                            }}
                        >
                            {confirm === 'purge' ? 'Delete permanently' : 'Send'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
