'use client'

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { ProgressData } from '../progress-data'
import { ProgressInsights } from './progress-insights'

// Fixed, never-cycled series colors — reuses this app's existing (previously
// unused) shadcn chart-1..4 tokens from globals.css, with the overall score
// carrying the brand primary since it's the headline series.
const SERIES_COLORS = {
    overall: 'var(--primary)',
    composition: 'var(--chart-1)',
    technique: 'var(--chart-2)',
    creativity: 'var(--chart-3)',
}

const MIN_ANALYSES_FOR_PROGRESS = 3

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-black border border-white/10 p-4 md:p-6">
            <h3 className="text-white font-bold uppercase text-sm tracking-widest mb-4">{title}</h3>
            {children}
        </div>
    )
}

interface ChartTooltipEntry {
    dataKey: string
    value: number
    stroke?: string
    fill?: string
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipEntry[]; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-950 border border-white/20 px-3 py-2 text-xs font-mono">
            <div className="text-slate-400 mb-1">{formatDate(label ?? '')}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.stroke || p.fill }}>
                    <span className="capitalize">{p.dataKey}</span>: {p.value}
                </div>
            ))}
        </div>
    )
}

function ScoreTrendChart({ trend }: { trend: ProgressData['scoreTrend'] }) {
    return (
        <SectionCard title="Score Trend">
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                    />
                    <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    <Line type="monotone" dataKey="overall" stroke={SERIES_COLORS.overall} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line
                        type="monotone"
                        dataKey="composition"
                        stroke={SERIES_COLORS.composition}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                    />
                    <Line type="monotone" dataKey="technique" stroke={SERIES_COLORS.technique} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line
                        type="monotone"
                        dataKey="creativity"
                        stroke={SERIES_COLORS.creativity}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </SectionCard>
    )
}

function CategoryBreakdownChart({ breakdown }: { breakdown: ProgressData['categoryBreakdown'] }) {
    return (
        <SectionCard title="Average Score by Category">
            <ResponsiveContainer width="100%" height={Math.max(180, breakdown.length * 40)}>
                <BarChart data={breakdown} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <YAxis
                        type="category"
                        dataKey="category"
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                        width={90}
                        className="capitalize"
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                                <div className="bg-slate-950 border border-white/20 px-3 py-2 text-xs font-mono capitalize">
                                    <div className="text-white">{d.category}</div>
                                    <div className="text-primary">{d.averageScore.toFixed(1)} avg · {d.count} analyses</div>
                                </div>
                            )
                        }}
                    />
                    <Bar dataKey="averageScore" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </SectionCard>
    )
}

export function ProgressSection({ data }: { data: ProgressData }) {
    if (data.totalAnalyses < MIN_ANALYSES_FOR_PROGRESS) {
        return (
            <div className="bg-black border border-dashed border-white/10 p-6 md:p-8 text-center">
                <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <h3 className="text-white font-bold uppercase text-sm mb-1">Your Progress</h3>
                <p className="text-slate-500 text-xs uppercase tracking-wide">
                    Upload {MIN_ANALYSES_FOR_PROGRESS - data.totalAnalyses} more photo{MIN_ANALYSES_FOR_PROGRESS - data.totalAnalyses === 1 ? '' : 's'} to unlock score trends and insights
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" />
                Your Progress
            </div>

            {data.scoreTrend.length > 0 && <ScoreTrendChart trend={data.scoreTrend} />}
            {data.categoryBreakdown.length > 0 && <CategoryBreakdownChart breakdown={data.categoryBreakdown} />}

            <ProgressInsights data={data} />
        </div>
    )
}
