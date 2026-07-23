import { Trophy, Flame, ArrowUpRight, Camera, Target, GraduationCap, MessageSquare, Users } from 'lucide-react'
import type { ProgressData } from '../progress-data'

function StatTile({ icon, label, value, sublabel }: { icon: React.ReactNode; label: string; value: string; sublabel?: string }) {
    return (
        <div className="bg-black border border-white/10 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <span className="text-slate-500 text-[10px] uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {sublabel && <div className="text-[10px] text-slate-500 uppercase">{sublabel}</div>}
        </div>
    )
}

function InsightList({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
    if (items.length === 0) return null
    return (
        <div className="bg-black border border-white/10 p-4 md:p-6">
            <h3 className="text-white font-bold uppercase text-sm tracking-widest mb-3 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <ul className="space-y-2">
                {items.map((text, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">›</span>
                        {text}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function ProgressInsights({ data }: { data: ProgressData }) {
    const { personalBests, gearInsights, goalInsights, learningImpacts, recurringThemes, peerBenchmark } = data

    const bestGear = gearInsights[0]
    const bestGoal = goalInsights.find((g) => g.deltaFromOverall > 0)

    const goalItems = goalInsights.map(
        (g) =>
            `When you set "${g.goal}" as a goal, you average ${g.averageScore.toFixed(1)} (${
                g.deltaFromOverall >= 0 ? '+' : ''
            }${g.deltaFromOverall.toFixed(1)} vs. your overall average) across ${g.count} analyses.`
    )

    const learningItems = learningImpacts.map(
        (l) =>
            `Since completing "${l.lessonTitle}", your average score is ${l.delta >= 0 ? 'up' : 'down'} ${Math.abs(l.delta).toFixed(1)} points (${l.scoreBefore.toFixed(1)} → ${l.scoreAfter.toFixed(1)}).`
    )

    const gearItems = gearInsights
        .slice(0, 3)
        .map((g) => `Your best average scores (${g.averageScore.toFixed(1)}) come from shots at ${g.bucketLabel} — ${g.count} analyses.`)

    const themeItems = recurringThemes.map(
        (t) => `"${t.term}" comes up in ${t.occurrences} of your last ${t.totalAnalyses} critiques.`
    )

    const peerItems = peerBenchmark.map(
        (p) =>
            `Your average ${p.category} score (${p.userAverage.toFixed(1)}) is ${p.delta >= 0 ? 'above' : 'below'} the community average (${p.peerAverage.toFixed(1)}) by ${Math.abs(p.delta).toFixed(1)} points.`
    )

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {personalBests.highestScore && (
                    <StatTile
                        icon={<Trophy className="w-4 h-4 text-primary" />}
                        label="Personal Best"
                        value={String(personalBests.highestScore.score)}
                        sublabel={new Date(personalBests.highestScore.date).toLocaleDateString()}
                    />
                )}
                {personalBests.mostImprovedCategory && (
                    <StatTile
                        icon={<ArrowUpRight className="w-4 h-4 text-green-500" />}
                        label="Most Improved"
                        value={personalBests.mostImprovedCategory.category}
                        sublabel={`+${personalBests.mostImprovedCategory.delta.toFixed(1)} pts`}
                    />
                )}
                {personalBests.currentStreakWeeks > 0 && (
                    <StatTile
                        icon={<Flame className="w-4 h-4 text-orange-500" />}
                        label="Current Streak"
                        value={`${personalBests.currentStreakWeeks} wk${personalBests.currentStreakWeeks === 1 ? '' : 's'}`}
                        sublabel="Consecutive weeks with an upload"
                    />
                )}
                {bestGear && (
                    <StatTile
                        icon={<Camera className="w-4 h-4 text-primary" />}
                        label="Best Setup"
                        value={bestGear.bucketLabel}
                        sublabel={`${bestGear.averageScore.toFixed(1)} avg score`}
                    />
                )}
                {bestGoal && (
                    <StatTile
                        icon={<Target className="w-4 h-4 text-primary" />}
                        label="Strongest Goal Focus"
                        value={bestGoal.goal}
                        sublabel={`+${bestGoal.deltaFromOverall.toFixed(1)} pts vs. average`}
                    />
                )}
            </div>

            <InsightList title="Gear & Settings" icon={<Camera className="w-4 h-4 text-primary" />} items={gearItems} />
            <InsightList title="Goal Alignment" icon={<Target className="w-4 h-4 text-primary" />} items={goalItems} />
            <InsightList title="Learning Impact" icon={<GraduationCap className="w-4 h-4 text-primary" />} items={learningItems} />
            <InsightList
                title="Recurring Feedback Themes (approximate)"
                icon={<MessageSquare className="w-4 h-4 text-primary" />}
                items={themeItems}
            />
            <InsightList title="Community Benchmark" icon={<Users className="w-4 h-4 text-primary" />} items={peerItems} />
        </div>
    )
}
