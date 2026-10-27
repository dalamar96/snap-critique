'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { ArrowLeft, Gift, Play, X, Loader2, Ban, CheckCircle2, Table2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { getReferralAdminData } from './actions'
import {
    releaseReferralRewardNow,
    cancelReferralReward,
    setReferrerSuspended,
    removeReferral,
    runReferralReleaseJob,
} from './actions'
import type { AdminReward, ReferrerSummary, RewardStatus, WeeklyPoint } from './referral-stats'

type Data = Awaited<ReturnType<typeof getReferralAdminData>>

const STATUS_STYLES: Record<RewardStatus, string> = {
    pending: 'bg-blue-500/10 text-blue-400',
    released: 'bg-green-500/10 text-green-500',
    voided: 'bg-white/5 text-slate-500',
    reversed: 'bg-red-500/10 text-red-500',
}

const STATUS_HELP: Record<RewardStatus, string> = {
    pending: 'In hold period — not yet paid',
    released: 'Paid to referrer',
    voided: 'Cancelled before payout (refund, chargeback, or admin)',
    reversed: 'Paid, then clawed back (refund, chargeback, or admin)',
}

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`
const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export function AdminReferralsClient({ data }: { data: Data }) {
    const router = useRouter()
    const { stats, referrals, rewards, config } = data
    const [selectedReferrerId, setSelectedReferrerId] = useState<string | null>(null)
    const [runningJob, setRunningJob] = useState(false)

    const emailByReferralId = useMemo(
        () => new Map(referrals.map((r) => [r.id, r.referred_email])),
        [referrals],
    )
    const emailByReferrerId = useMemo(
        () => new Map(stats.referrers.map((r) => [r.referrer_id, r.email])),
        [stats.referrers],
    )
    const selectedReferrer = stats.referrers.find((r) => r.referrer_id === selectedReferrerId) ?? null

    const handleRunJob = async () => {
        setRunningJob(true)
        const result = await runReferralReleaseJob()
        setRunningJob(false)
        if (result.error) return toast.error(result.error)
        toast.success(`Released ${result.released} matured reward(s)`)
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-slate-950 font-mono text-white">
            <div className="border-b border-white/10 bg-black p-4 flex justify-between items-center gap-4 sticky top-0 z-10">
                <div className="flex items-center gap-4 min-w-0">
                    <Link href="/admin" className="text-slate-500 hover:text-white" title="Back to admin">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest truncate">
                        <Gift className="w-5 h-5 shrink-0" />
                        Referrals
                    </div>
                </div>
                <button
                    onClick={handleRunJob}
                    disabled={runningJob}
                    title="Pay out every pending reward whose hold period has ended (normally done by the daily cron)"
                    className="shrink-0 flex items-center gap-2 text-[10px] uppercase font-bold text-primary border border-primary/30 px-3 py-2 hover:bg-primary hover:text-black transition-colors disabled:opacity-50"
                >
                    {runningJob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run Release Job
                </button>
            </div>

            <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-10">
                <p className="text-xs text-slate-500">
                    Policy: referrers earn <span className="text-white">{config.percent}%</span> of credits bought by referrals
                    {config.windowMonths ? <> in their first <span className="text-white">{config.windowMonths} months</span></> : <> for <span className="text-white">life</span></>},
                    held <span className="text-white">{config.holdDays} days</span>. Set in src/lib/referrals.ts.
                </p>

                {data.truncated && (
                    <div className="border border-orange-500/50 bg-orange-500/10 p-3 text-xs text-orange-400">
                        Showing the most recent 5,000 rows only — totals below are incomplete.
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Stat label="Referral Signups" value={stats.signups} />
                    <Stat label="Paying Referrals" value={stats.paying} sub={`${percent(stats.conversionRate)} conversion`} />
                    <Stat label="Referred Revenue" value={dollars(stats.revenueCents)} sub="net of refunds" />
                    <Stat label="Refund / Chargeback Rate" value={percent(stats.refundRate)} sub="of rewarded purchases" />
                    <Stat label="Credits Pending" value={stats.creditsPending} sub="in hold period" />
                    <Stat label="Credits Paid" value={stats.creditsReleased} />
                    <Stat label="Credits Clawed Back" value={stats.creditsClawedBack} sub="reversed after payout" />
                    <Stat label="Credits Voided" value={stats.creditsVoided} sub="cancelled before payout" />
                </div>

                {/* Trends */}
                <TrendSection weekly={stats.weekly} />

                {/* Leaderboard */}
                <section>
                    <h2 className="text-lg font-bold uppercase mb-4">Referrers</h2>
                    <ReferrersTable referrers={stats.referrers} onSelect={setSelectedReferrerId} />
                </section>

                {/* All rewards */}
                <section>
                    <h2 className="text-lg font-bold uppercase mb-4">Rewards</h2>
                    <RewardsTable
                        rewards={rewards}
                        referrerEmail={(id) => emailByReferrerId.get(id) ?? null}
                        referredEmail={(id) => emailByReferralId.get(id) ?? null}
                        onChanged={() => router.refresh()}
                        showReferrer
                    />
                </section>
            </div>

            {selectedReferrer && (
                <ReferrerModal
                    referrer={selectedReferrer}
                    referrals={referrals.filter((r) => r.referrer_id === selectedReferrer.referrer_id)}
                    rewards={rewards.filter((r) => r.referrer_id === selectedReferrer.referrer_id)}
                    referredEmail={(id) => emailByReferralId.get(id) ?? null}
                    onClose={() => setSelectedReferrerId(null)}
                    onChanged={() => router.refresh()}
                />
            )}
        </div>
    )
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-black border border-white/10 p-4 rounded-lg min-w-0">
            <div className="text-slate-500 text-[10px] uppercase tracking-widest truncate">{label}</div>
            <div className="text-2xl font-bold text-white mt-1">{value}</div>
            {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

function TrendTooltip({ active, payload, label, format }: {
    active?: boolean
    payload?: { value: number }[]
    label?: string
    format: (v: number) => string
}) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-950 border border-white/20 px-3 py-2 text-xs font-mono">
            <div className="text-slate-400 mb-1">Week of {label}</div>
            <div className="text-white">{format(payload[0].value)}</div>
        </div>
    )
}

function WeeklyBarChart({ weekly, dataKey, format }: {
    weekly: WeeklyPoint[]
    dataKey: 'signups' | 'revenue'
    format: (v: number) => string
}) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={2}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} interval="preserveStartEnd" />
                <YAxis
                    allowDecimals={false}
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                    tickFormatter={dataKey === 'revenue' ? (v: number) => `$${v}` : undefined}
                />
                <Tooltip content={<TrendTooltip format={format} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey={dataKey} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
        </ResponsiveContainer>
    )
}

function TrendSection({ weekly }: { weekly: WeeklyPoint[] }) {
    const [showTable, setShowTable] = useState(false)
    const signupFmt = (v: number) => `${v} signup${v === 1 ? '' : 's'}`
    const revenueFmt = (v: number) => `$${v.toFixed(2)}`

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold uppercase">Last {weekly.length} Weeks</h2>
                <button
                    onClick={() => setShowTable(!showTable)}
                    className="flex items-center gap-1 text-[10px] uppercase text-slate-400 hover:text-white border border-white/10 px-2 py-1"
                >
                    {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
                    {showTable ? 'Chart' : 'Table'}
                </button>
            </div>
            {showTable ? (
                <div className="border border-white/10 bg-black rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                                <th className="p-3">Week of</th>
                                <th className="p-3 text-right">Signups</th>
                                <th className="p-3 text-right">Referred Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {weekly.map((w) => (
                                <tr key={w.weekStart}>
                                    <td className="p-3 text-slate-400">{w.label}</td>
                                    <td className="p-3 text-right">{w.signups}</td>
                                    <td className="p-3 text-right">{revenueFmt(w.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black border border-white/10 p-4 rounded-lg">
                        <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-3">Signups per week</h3>
                        <WeeklyBarChart weekly={weekly} dataKey="signups" format={signupFmt} />
                    </div>
                    <div className="bg-black border border-white/10 p-4 rounded-lg">
                        <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-3">Referred revenue per week (net)</h3>
                        <WeeklyBarChart weekly={weekly} dataKey="revenue" format={revenueFmt} />
                    </div>
                </div>
            )}
        </section>
    )
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function ReferrersTable({ referrers, onSelect }: { referrers: ReferrerSummary[]; onSelect: (id: string) => void }) {
    if (referrers.length === 0) {
        return <Empty>No referrals yet.</Empty>
    }
    return (
        <div className="border border-white/10 bg-black rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
                <thead>
                    <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                        <th className="p-3">Referrer</th>
                        <th className="p-3 text-right">Signups</th>
                        <th className="p-3 text-right">Paying</th>
                        <th className="p-3 text-right">Revenue</th>
                        <th className="p-3 text-right">Credits Paid</th>
                        <th className="p-3 text-right">Pending</th>
                        <th className="p-3 text-right">Clawed Back</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {referrers.map((r) => (
                        <tr key={r.referrer_id} onClick={() => onSelect(r.referrer_id)} className="hover:bg-white/5 cursor-pointer group">
                            <td className="p-3">
                                <div className="font-bold group-hover:text-primary transition-colors">{r.email ?? r.referrer_id.slice(0, 8)}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-600">{r.code}</span>
                                    {r.suspended && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold">Suspended</span>}
                                </div>
                            </td>
                            <td className="p-3 text-right">{r.signups}</td>
                            <td className="p-3 text-right">{r.paying}</td>
                            <td className="p-3 text-right">{dollars(r.revenueCents)}</td>
                            <td className="p-3 text-right text-green-500">{r.creditsEarned}</td>
                            <td className="p-3 text-right text-slate-400">{r.creditsPending}</td>
                            <td className={cn('p-3 text-right', r.creditsClawedBack ? 'text-red-500' : 'text-slate-600')}>{r.creditsClawedBack}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function RewardsTable({ rewards, referrerEmail, referredEmail, onChanged, showReferrer = false }: {
    rewards: AdminReward[]
    referrerEmail?: (referrerId: string) => string | null
    referredEmail: (referralId: string) => string | null
    onChanged: () => void
    showReferrer?: boolean
}) {
    const [filter, setFilter] = useState<RewardStatus | 'all'>('all')
    const [busyId, setBusyId] = useState<string | null>(null)
    const visible = filter === 'all' ? rewards : rewards.filter((r) => r.status === filter)

    const run = async (rewardId: string, action: () => Promise<{ error?: string }>, success: string) => {
        setBusyId(rewardId)
        const result = await action()
        setBusyId(null)
        if (result.error) return toast.error(result.error)
        toast.success(success)
        onChanged()
    }

    const handleRelease = (r: AdminReward) => {
        if (!confirm(`Pay ${r.reward_credits} credits to the referrer now, skipping the rest of the hold?`)) return
        run(r.id, () => releaseReferralRewardNow(r.id), 'Reward released')
    }

    const handleCancel = (r: AdminReward) => {
        const msg = r.status === 'released'
            ? `Claw back ${r.reward_credits} credits from the referrer?`
            : `Cancel this pending ${r.reward_credits}-credit reward?`
        if (!confirm(msg)) return
        run(r.id, () => cancelReferralReward(r.id), r.status === 'released' ? 'Reward reversed' : 'Reward voided')
    }

    return (
        <div>
            <div className="flex flex-wrap gap-1 mb-3">
                {(['all', 'pending', 'released', 'voided', 'reversed'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                            'text-[10px] uppercase px-2 py-1 border transition-colors',
                            filter === s ? 'bg-primary text-black border-primary font-bold' : 'border-white/10 text-slate-400 hover:text-white',
                        )}
                    >
                        {s} ({s === 'all' ? rewards.length : rewards.filter((r) => r.status === s).length})
                    </button>
                ))}
            </div>
            {visible.length === 0 ? (
                <Empty>No rewards{filter === 'all' ? '' : ` with status "${filter}"`}.</Empty>
            ) : (
                <div className="border border-white/10 bg-black rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[860px]">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                                <th className="p-3">Purchased</th>
                                {showReferrer && <th className="p-3">Referrer</th>}
                                <th className="p-3">Referred User</th>
                                <th className="p-3 text-right">Purchase</th>
                                <th className="p-3 text-right">Reward</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Releases / Released</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {visible.map((r) => (
                                <tr key={r.id} className="hover:bg-white/5">
                                    <td className="p-3 text-slate-400 whitespace-nowrap">{shortDate(r.created_at)}</td>
                                    {showReferrer && <td className="p-3 text-slate-300 truncate max-w-[180px]">{referrerEmail?.(r.referrer_id) ?? '—'}</td>}
                                    <td className="p-3 text-slate-300 truncate max-w-[180px]">{referredEmail(r.referral_id) ?? '—'}</td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        {r.purchase_credits} cr
                                        {r.purchase_amount != null && <span className="text-slate-500"> · {dollars(r.purchase_amount)}</span>}
                                    </td>
                                    <td className="p-3 text-right font-bold">{r.reward_credits}</td>
                                    <td className="p-3">
                                        <span title={STATUS_HELP[r.status]} className={cn('px-2 py-0.5 rounded text-[10px] uppercase font-bold', STATUS_STYLES[r.status])}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-400 whitespace-nowrap text-xs">
                                        {r.status === 'pending' && shortDate(r.release_after)}
                                        {r.status !== 'pending' && r.released_at && shortDate(r.released_at)}
                                        {r.status !== 'pending' && !r.released_at && '—'}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-end gap-2">
                                            {busyId === r.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                            ) : (
                                                <>
                                                    {r.status === 'pending' && (
                                                        <ActionButton onClick={() => handleRelease(r)} title="Release now" tone="green">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Release
                                                        </ActionButton>
                                                    )}
                                                    {(r.status === 'pending' || r.status === 'released') && (
                                                        <ActionButton
                                                            onClick={() => handleCancel(r)}
                                                            title={r.status === 'released' ? 'Claw back credits' : 'Void reward'}
                                                            tone="red"
                                                        >
                                                            <Ban className="w-3.5 h-3.5" /> {r.status === 'released' ? 'Claw back' : 'Void'}
                                                        </ActionButton>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function ActionButton({ onClick, title, tone, children }: {
    onClick: () => void
    title: string
    tone: 'green' | 'red'
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                'flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors',
                tone === 'green' ? 'bg-green-500/10 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white',
            )}
        >
            {children}
        </button>
    )
}

function Empty({ children }: { children: React.ReactNode }) {
    return <div className="text-center p-10 text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">{children}</div>
}

// ---------------------------------------------------------------------------
// Referrer detail
// ---------------------------------------------------------------------------

function ReferrerModal({ referrer, referrals, rewards, referredEmail, onClose, onChanged }: {
    referrer: ReferrerSummary
    referrals: Data['referrals']
    rewards: AdminReward[]
    referredEmail: (referralId: string) => string | null
    onClose: () => void
    onChanged: () => void
}) {
    const [busy, setBusy] = useState(false)

    const handleSuspend = async () => {
        const next = !referrer.suspended
        const msg = next
            ? 'Suspend this referrer? Their referrals still attribute, but no new rewards will be queued. Existing rewards are unaffected.'
            : 'Resume rewards for this referrer?'
        if (!confirm(msg)) return
        setBusy(true)
        const result = await setReferrerSuspended(referrer.referrer_id, next)
        setBusy(false)
        if (result.error) return toast.error(result.error)
        toast.success(next ? 'Referrer suspended' : 'Referrer resumed')
        onChanged()
    }

    const handleRemove = async (referralId: string, email: string | null) => {
        if (!confirm(`Remove the referral link for ${email ?? 'this user'}? Future purchases won't reward this referrer.`)) return
        setBusy(true)
        const result = await removeReferral(referralId)
        setBusy(false)
        if (result.error) return toast.error(result.error)
        toast.success('Referral removed')
        onChanged()
    }

    const rewardsByReferral = (referralId: string) => rewards.filter((r) => r.referral_id === referralId)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                            <span className="truncate">{referrer.email ?? referrer.referrer_id}</span>
                            {referrer.suspended && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase">Suspended</span>}
                        </h3>
                        <div className="text-slate-500 text-xs mt-1">Code: {referrer.code} · ID: {referrer.referrer_id}</div>
                        <div className="flex flex-wrap gap-4 mt-3 text-xs">
                            <span>Signups <b>{referrer.signups}</b></span>
                            <span>Paying <b>{referrer.paying}</b></span>
                            <span>Revenue <b>{dollars(referrer.revenueCents)}</b></span>
                            <span>Paid <b className="text-green-500">{referrer.creditsEarned}</b></span>
                            <span>Pending <b>{referrer.creditsPending}</b></span>
                            <span>Clawed back <b className="text-red-500">{referrer.creditsClawedBack}</b></span>
                        </div>
                        <button
                            onClick={handleSuspend}
                            disabled={busy}
                            className={cn(
                                'mt-4 text-[10px] uppercase font-bold px-3 py-1.5 border transition-colors disabled:opacity-50',
                                referrer.suspended
                                    ? 'border-green-500/40 text-green-500 hover:bg-green-600 hover:text-white'
                                    : 'border-red-500/40 text-red-500 hover:bg-red-600 hover:text-white',
                            )}
                        >
                            {referrer.suspended ? 'Resume Rewards' : 'Suspend Rewards'}
                        </button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Referred Users ({referrals.length})</h4>
                        <div className="border border-white/10 bg-black rounded-lg overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-white/10 text-slate-500 bg-white/5 uppercase text-xs">
                                        <th className="p-3">User</th>
                                        <th className="p-3">Signed Up</th>
                                        <th className="p-3 text-right">Purchases</th>
                                        <th className="p-3 text-right">Revenue</th>
                                        <th className="p-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {referrals.map((ref) => {
                                        const refRewards = rewardsByReferral(ref.id)
                                        const active = refRewards.filter((r) => r.status === 'pending' || r.status === 'released')
                                        return (
                                            <tr key={ref.id}>
                                                <td className="p-3 text-slate-300">{ref.referred_email ?? ref.referred_id.slice(0, 8)}</td>
                                                <td className="p-3 text-slate-400 whitespace-nowrap">{shortDate(ref.created_at)}</td>
                                                <td className="p-3 text-right">{active.length}</td>
                                                <td className="p-3 text-right">{dollars(active.reduce((s, r) => s + (r.purchase_amount ?? 0), 0))}</td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => handleRemove(ref.id, ref.referred_email)}
                                                        disabled={busy || active.length > 0}
                                                        title={active.length > 0 ? 'Void or claw back this user\'s rewards first' : 'Remove referral link'}
                                                        className="text-[10px] uppercase text-slate-500 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-500"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Rewards ({rewards.length})</h4>
                        <RewardsTable rewards={rewards} referredEmail={referredEmail} onChanged={onChanged} />
                    </section>
                </div>
            </div>
        </div>
    )
}
