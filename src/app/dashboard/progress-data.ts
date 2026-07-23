import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================================
// Types
// ============================================================================

export interface ProgressRow {
    submissionId: string
    createdAt: string
    category: string | null
    goals: string[] | null
    metadata: Record<string, unknown> | null
    score: number | null
    scores: { composition?: number; technique?: number; creativity?: number } | null
    goalScore: number | null
    improvements: { title?: string; description?: string }[] | null
    strengths: string[] | null
}

export interface ScoreTrendPoint {
    date: string
    overall: number | null
    composition: number | null
    technique: number | null
    creativity: number | null
}

export interface CategoryBreakdown {
    category: string
    averageScore: number
    count: number
}

export interface PersonalBests {
    highestScore: { score: number; submissionId: string; date: string } | null
    mostImprovedCategory: { category: string; delta: number } | null
    currentStreakWeeks: number
}

export interface GearInsight {
    dimension: 'aperture' | 'iso' | 'shutterSpeed'
    bucketLabel: string
    averageScore: number
    count: number
}

export interface GoalInsight {
    goal: string
    averageScore: number
    count: number
    deltaFromOverall: number
}

export interface LessonCompletion {
    lessonId: string
    lessonTitle: string
    completedAt: string
}

export interface LearningImpact {
    lessonTitle: string
    completedAt: string
    scoreBefore: number
    scoreAfter: number
    delta: number
}

export interface ThemeInsight {
    term: string
    occurrences: number
    totalAnalyses: number
}

export interface PeerBenchmark {
    category: string
    userAverage: number
    peerAverage: number
    delta: number
}

export interface ProgressData {
    scoreTrend: ScoreTrendPoint[]
    categoryBreakdown: CategoryBreakdown[]
    personalBests: PersonalBests
    gearInsights: GearInsight[]
    goalInsights: GoalInsight[]
    learningImpacts: LearningImpact[]
    recurringThemes: ThemeInsight[]
    peerBenchmark: PeerBenchmark[]
    totalAnalyses: number
}

// Minimum sample sizes below which an insight is withheld rather than shown
// noisy/misleading with too little data.
const MIN_FOR_TRENDS = 3
const MIN_PER_CATEGORY_FOR_MOST_IMPROVED = 4
const MIN_PER_GEAR_BUCKET = 3
const MIN_PER_GOAL = 2
const MIN_BEFORE_AFTER_FOR_LEARNING_IMPACT = 2
const LEARNING_IMPACT_WINDOW_DAYS = 30
const LEARNING_IMPACT_MIN_DELTA = 3
const THEME_MIN_OCCURRENCES = 2

function average(nums: number[]): number {
    if (nums.length === 0) return 0
    return nums.reduce((a, b) => a + b, 0) / nums.length
}

// ============================================================================
// Compute functions — pure, no Supabase dependency, unit-testable in isolation
// ============================================================================

export function buildScoreTrend(rows: ProgressRow[]): ScoreTrendPoint[] {
    return rows
        .filter((r) => r.score !== null)
        .map((r) => ({
            date: r.createdAt,
            overall: r.score,
            composition: r.scores?.composition ?? null,
            technique: r.scores?.technique ?? null,
            creativity: r.scores?.creativity ?? null,
        }))
}

export function buildCategoryBreakdown(rows: ProgressRow[]): CategoryBreakdown[] {
    const groups = new Map<string, number[]>()
    for (const r of rows) {
        if (r.score === null || !r.category) continue
        const arr = groups.get(r.category) ?? []
        arr.push(r.score)
        groups.set(r.category, arr)
    }
    return Array.from(groups.entries())
        .map(([category, scores]) => ({ category, averageScore: average(scores), count: scores.length }))
        .sort((a, b) => b.averageScore - a.averageScore)
}

export function calculateStreakWeeks(dates: string[], now: Date = new Date()): number {
    if (dates.length === 0) return 0
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const weeksAgo = new Set(dates.map((d) => Math.floor((now.getTime() - new Date(d).getTime()) / weekMs)))
    let streak = 0
    while (weeksAgo.has(streak)) streak++
    return streak
}

export function findPersonalBests(rows: ProgressRow[]): PersonalBests {
    const scored = rows.filter((r): r is ProgressRow & { score: number } => r.score !== null)

    let highestScore: PersonalBests['highestScore'] = null
    for (const r of scored) {
        if (!highestScore || r.score > highestScore.score) {
            highestScore = { score: r.score, submissionId: r.submissionId, date: r.createdAt }
        }
    }

    const byCategory = new Map<string, (ProgressRow & { score: number })[]>()
    for (const r of scored) {
        if (!r.category) continue
        const arr = byCategory.get(r.category) ?? []
        arr.push(r)
        byCategory.set(r.category, arr)
    }

    let mostImprovedCategory: PersonalBests['mostImprovedCategory'] = null
    for (const [category, catRows] of byCategory) {
        if (catRows.length < MIN_PER_CATEGORY_FOR_MOST_IMPROVED) continue
        const sorted = [...catRows].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        const mid = Math.floor(sorted.length / 2)
        const delta = average(sorted.slice(mid).map((r) => r.score)) - average(sorted.slice(0, mid).map((r) => r.score))
        if (delta > 0 && (!mostImprovedCategory || delta > mostImprovedCategory.delta)) {
            mostImprovedCategory = { category, delta }
        }
    }

    return {
        highestScore,
        mostImprovedCategory,
        currentStreakWeeks: calculateStreakWeeks(rows.map((r) => r.createdAt)),
    }
}

// --- Gear/settings correlation -------------------------------------------

// EXIF values come from ExifReader's `.description` field via api/analyze/route.ts
// and are stored in submissions.metadata as-is. The TS type says `string`,
// but that's only a compile-time assertion — in practice ExifReader returns
// some tags (observed: ISO) as a raw number rather than a string, so this
// coerces defensively rather than trusting the declared type.
function asString(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null
    return typeof raw === 'string' ? raw : String(raw)
}

function parseAperture(raw: unknown): number | null {
    const match = asString(raw)?.match(/f\/?\s*([\d.]+)/i)
    return match ? parseFloat(match[1]) : null
}

function parseIso(raw: unknown): number | null {
    const match = asString(raw)?.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : null
}

function parseShutterSpeed(raw: unknown): number | null {
    const str = asString(raw)
    if (!str) return null
    const fraction = str.match(/1\s*\/\s*(\d+)/)
    if (fraction) return 1 / parseInt(fraction[1], 10)
    const seconds = str.match(/([\d.]+)\s*s/i)
    if (seconds) return parseFloat(seconds[1])
    return null
}

type Bucket = { label: string; test: (v: number) => boolean }

const APERTURE_BUCKETS: Bucket[] = [
    { label: 'f/1.4–f/2.8 (wide open)', test: (v) => v <= 2.8 },
    { label: 'f/2.8–f/5.6', test: (v) => v > 2.8 && v <= 5.6 },
    { label: 'f/5.6+ (stopped down)', test: (v) => v > 5.6 },
]

const ISO_BUCKETS: Bucket[] = [
    { label: 'ISO ≤400', test: (v) => v <= 400 },
    { label: 'ISO 400–1600', test: (v) => v > 400 && v <= 1600 },
    { label: 'ISO 1600+', test: (v) => v > 1600 },
]

const SHUTTER_BUCKETS: Bucket[] = [
    { label: 'Faster than 1/500s', test: (v) => v <= 1 / 500 },
    { label: '1/500s–1/60s', test: (v) => v > 1 / 500 && v <= 1 / 60 },
    { label: 'Slower than 1/60s', test: (v) => v > 1 / 60 },
]

function bucketAndScore(
    rows: ProgressRow[],
    dimension: GearInsight['dimension'],
    extract: (metadata: Record<string, unknown>) => number | null,
    buckets: Bucket[]
): GearInsight[] {
    const byBucket = new Map<string, number[]>()
    for (const r of rows) {
        if (r.score === null || !r.metadata) continue
        const value = extract(r.metadata)
        if (value === null) continue
        const bucket = buckets.find((b) => b.test(value))
        if (!bucket) continue
        const arr = byBucket.get(bucket.label) ?? []
        arr.push(r.score)
        byBucket.set(bucket.label, arr)
    }
    return Array.from(byBucket.entries()).map(([bucketLabel, scores]) => ({
        dimension,
        bucketLabel,
        averageScore: average(scores),
        count: scores.length,
    }))
}

export function analyzeGearCorrelation(rows: ProgressRow[]): GearInsight[] {
    const insights = [
        ...bucketAndScore(rows, 'aperture', (m) => parseAperture(m.aperture), APERTURE_BUCKETS),
        ...bucketAndScore(rows, 'iso', (m) => parseIso(m.iso), ISO_BUCKETS),
        ...bucketAndScore(rows, 'shutterSpeed', (m) => parseShutterSpeed(m.shutter_speed), SHUTTER_BUCKETS),
    ]
    return insights.filter((i) => i.count >= MIN_PER_GEAR_BUCKET).sort((a, b) => b.averageScore - a.averageScore)
}

// --- Goal alignment --------------------------------------------------------

export function analyzeGoalAlignment(rows: ProgressRow[]): GoalInsight[] {
    const scored = rows.filter((r): r is ProgressRow & { score: number } => r.score !== null)
    if (scored.length === 0) return []
    const overallAvg = average(scored.map((r) => r.score))

    const byGoal = new Map<string, number[]>()
    for (const r of scored) {
        for (const goal of Array.isArray(r.goals) ? r.goals : []) {
            const arr = byGoal.get(goal) ?? []
            arr.push(r.score)
            byGoal.set(goal, arr)
        }
    }

    return Array.from(byGoal.entries())
        .filter(([, scores]) => scores.length >= MIN_PER_GOAL)
        .map(([goal, scores]) => {
            const averageScore = average(scores)
            return { goal, averageScore, count: scores.length, deltaFromOverall: averageScore - overallAvg }
        })
        .sort((a, b) => b.deltaFromOverall - a.deltaFromOverall)
}

// --- Learning impact --------------------------------------------------------

export function analyzeLearningImpact(rows: ProgressRow[], lessonCompletions: LessonCompletion[]): LearningImpact[] {
    const scored = rows.filter((r): r is ProgressRow & { score: number } => r.score !== null)
    const windowMs = LEARNING_IMPACT_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const results: LearningImpact[] = []

    for (const lesson of lessonCompletions) {
        const completedTime = new Date(lesson.completedAt).getTime()

        const before = scored.filter((r) => {
            const t = new Date(r.createdAt).getTime()
            return t < completedTime && t >= completedTime - windowMs
        })
        const after = scored.filter((r) => {
            const t = new Date(r.createdAt).getTime()
            return t >= completedTime && t <= completedTime + windowMs
        })

        if (before.length < MIN_BEFORE_AFTER_FOR_LEARNING_IMPACT || after.length < MIN_BEFORE_AFTER_FOR_LEARNING_IMPACT) continue

        const scoreBefore = average(before.map((r) => r.score))
        const scoreAfter = average(after.map((r) => r.score))
        const delta = scoreAfter - scoreBefore

        if (Math.abs(delta) < LEARNING_IMPACT_MIN_DELTA) continue

        results.push({ lessonTitle: lesson.lessonTitle, completedAt: lesson.completedAt, scoreBefore, scoreAfter, delta })
    }

    return results.sort((a, b) => b.delta - a.delta)
}

// --- Recurring themes (rough/naive — no NLP, no Gemini prompt change) -----

const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'this', 'that', 'these', 'those', 'it', 'its', 'your', 'you', 'more', 'could', 'can',
    'should', 'would', 'also', 'into', 'from', 'as', 'by', 'than', 'then', 'so', 'such', 'not', 'no', 'very',
    'well', 'good', 'image', 'photo', 'photograph', 'picture', 'shot', 'overall', 'consider', 'try', 'using',
])

export function extractRecurringThemes(rows: ProgressRow[], minOccurrences = THEME_MIN_OCCURRENCES): ThemeInsight[] {
    const counts = new Map<string, number>()

    for (const r of rows) {
        const seenInThisRow = new Set<string>()
        // full_critique is Gemini's JSON output — shape isn't guaranteed at
        // runtime the way an app-controlled column would be, so this
        // doesn't trust improvements/strengths to actually be arrays of the
        // expected element shape (same class of bug as the EXIF parsing
        // below: a declared TS type is not a runtime guarantee for jsonb).
        const improvementTitles = Array.isArray(r.improvements)
            ? r.improvements.map((i) => (typeof i?.title === 'string' ? i.title : ''))
            : []
        const strengthTexts = Array.isArray(r.strengths) ? r.strengths.filter((s): s is string => typeof s === 'string') : []
        const texts = [...improvementTitles, ...strengthTexts]
        for (const text of texts) {
            if (!text) continue
            const words = text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter((w) => w.length > 3 && !STOPWORDS.has(w))
            words.forEach((w) => seenInThisRow.add(w))
        }
        seenInThisRow.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1))
    }

    return Array.from(counts.entries())
        .filter(([, count]) => count >= minOccurrences)
        .map(([term, occurrences]) => ({ term, occurrences, totalAnalyses: rows.length }))
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 6)
}

// --- Peer benchmark ---------------------------------------------------------

export function comparePeerBenchmark(
    userBreakdown: CategoryBreakdown[],
    globalBreakdown: { category: string; averageScore: number }[]
): PeerBenchmark[] {
    const globalMap = new Map(globalBreakdown.map((g) => [g.category, g.averageScore]))
    return userBreakdown
        .filter((u) => globalMap.has(u.category))
        .map((u) => {
            const peerAverage = globalMap.get(u.category) as number
            return { category: u.category, userAverage: u.averageScore, peerAverage, delta: u.averageScore - peerAverage }
        })
        .sort((a, b) => b.delta - a.delta)
}

// ============================================================================
// Fetch layer
// ============================================================================

interface SubmissionJoinRow {
    id: string
    created_at: string
    category: string | null
    goals: string[] | null
    metadata: Record<string, unknown> | null
    analyses: { score: number | null; full_critique: Record<string, unknown> | null; goal_score: number | null }[] | { score: number | null; full_critique: Record<string, unknown> | null; goal_score: number | null } | null
}

function toRow(s: SubmissionJoinRow): ProgressRow {
    const analysis = Array.isArray(s.analyses) ? s.analyses[0] : s.analyses
    const critique = (analysis?.full_critique ?? {}) as {
        scores?: { composition?: number; technique?: number; creativity?: number }
        improvements?: { title?: string; description?: string }[]
        strengths?: string[]
    }
    return {
        submissionId: s.id,
        createdAt: s.created_at,
        category: s.category,
        goals: s.goals,
        metadata: s.metadata,
        score: analysis?.score ?? null,
        scores: critique.scores ?? null,
        goalScore: analysis?.goal_score ?? null,
        improvements: critique.improvements ?? null,
        strengths: critique.strengths ?? null,
    }
}

export async function getProgressData(supabase: SupabaseClient, userId: string): Promise<ProgressData> {
    const { data: submissions } = await supabase
        .from('submissions')
        .select('id, created_at, category, goals, metadata, analyses(score, full_critique, goal_score)')
        .eq('user_id', userId)
        .eq('status', 'done')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

    const rows: ProgressRow[] = ((submissions ?? []) as unknown as SubmissionJoinRow[]).map(toRow)

    const { data: lessonProgress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, completed_at, lessons(title)')
        .eq('user_id', userId)

    const lessonCompletions: LessonCompletion[] = ((lessonProgress ?? []) as unknown as {
        lesson_id: string
        completed_at: string
        lessons: { title: string } | { title: string }[] | null
    }[]).map((lp) => {
        const lesson = Array.isArray(lp.lessons) ? lp.lessons[0] : lp.lessons
        return { lessonId: lp.lesson_id, lessonTitle: lesson?.title ?? 'Lesson', completedAt: lp.completed_at }
    })

    // Peer benchmark needs an aggregate across ALL users, which RLS would
    // otherwise scope to just this user — deliberate, server-side-only use
    // of the admin client. Only aggregate (category, score) pairs are read;
    // no individual row is ever returned to the client.
    const adminDb = createAdminClient()
    const { data: globalSubmissions } = await adminDb
        .from('submissions')
        .select('category, analyses(score)')
        .eq('status', 'done')
        .is('deleted_at', null)

    const globalGroups = new Map<string, number[]>()
    for (const s of (globalSubmissions ?? []) as unknown as { category: string | null; analyses: { score: number | null }[] | { score: number | null } | null }[]) {
        const analysis = Array.isArray(s.analyses) ? s.analyses[0] : s.analyses
        if (!s.category || analysis?.score == null) continue
        const arr = globalGroups.get(s.category) ?? []
        arr.push(analysis.score)
        globalGroups.set(s.category, arr)
    }
    const globalBreakdown = Array.from(globalGroups.entries()).map(([category, scores]) => ({
        category,
        averageScore: average(scores),
    }))

    const categoryBreakdown = buildCategoryBreakdown(rows)

    return {
        scoreTrend: rows.length >= MIN_FOR_TRENDS ? buildScoreTrend(rows) : [],
        categoryBreakdown,
        personalBests: findPersonalBests(rows),
        gearInsights: analyzeGearCorrelation(rows),
        goalInsights: analyzeGoalAlignment(rows),
        learningImpacts: analyzeLearningImpact(rows, lessonCompletions),
        recurringThemes: extractRecurringThemes(rows),
        peerBenchmark: comparePeerBenchmark(categoryBreakdown, globalBreakdown),
        totalAnalyses: rows.length,
    }
}
