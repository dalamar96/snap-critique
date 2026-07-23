import { describe, it, expect, vi } from 'vitest'
import {
    buildScoreTrend,
    buildCategoryBreakdown,
    calculateStreakWeeks,
    findPersonalBests,
    analyzeGearCorrelation,
    analyzeGoalAlignment,
    analyzeLearningImpact,
    extractRecurringThemes,
    comparePeerBenchmark,
    type ProgressRow,
} from './progress-data'

function row(overrides: Partial<ProgressRow> = {}): ProgressRow {
    return {
        submissionId: 'sub-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        category: 'portrait',
        goals: null,
        metadata: null,
        score: 70,
        scores: null,
        goalScore: null,
        improvements: null,
        strengths: null,
        ...overrides,
    }
}

describe('buildScoreTrend', () => {
    it('maps scored rows into trend points and drops unscored ones', () => {
        const rows = [
            row({ score: 80, scores: { composition: 75, technique: 85, creativity: 70 } }),
            row({ score: null }),
        ]

        expect(buildScoreTrend(rows)).toEqual([
            { date: '2026-01-01T00:00:00.000Z', overall: 80, composition: 75, technique: 85, creativity: 70 },
        ])
    })
})

describe('buildCategoryBreakdown', () => {
    it('groups by category, averages scores, and sorts descending', () => {
        const rows = [
            row({ category: 'portrait', score: 60 }),
            row({ category: 'portrait', score: 80 }),
            row({ category: 'landscape', score: 90 }),
            row({ category: null, score: 50 }), // no category, excluded
            row({ category: 'street', score: null }), // no score, excluded
        ]

        expect(buildCategoryBreakdown(rows)).toEqual([
            { category: 'landscape', averageScore: 90, count: 1 },
            { category: 'portrait', averageScore: 70, count: 2 },
        ])
    })
})

describe('calculateStreakWeeks', () => {
    const now = new Date('2026-03-15T12:00:00.000Z')

    it('returns 0 for no submissions', () => {
        expect(calculateStreakWeeks([], now)).toBe(0)
    })

    it('returns 0 when there is nothing in the current week', () => {
        expect(calculateStreakWeeks(['2026-02-01T00:00:00.000Z'], now)).toBe(0)
    })

    it('counts consecutive weeks with at least one submission', () => {
        const dates = [
            now.toISOString(), // this week
            new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // last week
            new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        ]
        expect(calculateStreakWeeks(dates, now)).toBe(3)
    })

    it('stops counting at the first gap', () => {
        const dates = [
            now.toISOString(), // this week
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // ~4 weeks ago, gap in between
        ]
        expect(calculateStreakWeeks(dates, now)).toBe(1)
    })
})

describe('findPersonalBests', () => {
    it('finds the highest-scoring submission', () => {
        const rows = [row({ submissionId: 'a', score: 60 }), row({ submissionId: 'b', score: 95 }), row({ submissionId: 'c', score: 80 })]

        expect(findPersonalBests(rows).highestScore).toEqual({ score: 95, submissionId: 'b', date: '2026-01-01T00:00:00.000Z' })
    })

    it('does not surface a most-improved category with fewer than 4 entries', () => {
        const rows = [
            row({ category: 'portrait', score: 50, createdAt: '2026-01-01' }),
            row({ category: 'portrait', score: 90, createdAt: '2026-02-01' }),
        ]

        expect(findPersonalBests(rows).mostImprovedCategory).toBeNull()
    })

    it('identifies the category with the largest first-half vs second-half improvement', () => {
        const rows = [
            row({ category: 'portrait', score: 50, createdAt: '2026-01-01' }),
            row({ category: 'portrait', score: 55, createdAt: '2026-01-02' }),
            row({ category: 'portrait', score: 58, createdAt: '2026-01-03' }),
            row({ category: 'portrait', score: 60, createdAt: '2026-01-04' }), // portrait: +6.5 avg
            row({ category: 'landscape', score: 80, createdAt: '2026-01-01' }),
            row({ category: 'landscape', score: 80, createdAt: '2026-01-02' }),
            row({ category: 'landscape', score: 79, createdAt: '2026-01-03' }),
            row({ category: 'landscape', score: 81, createdAt: '2026-01-04' }), // landscape: ~0 avg change
        ]

        expect(findPersonalBests(rows).mostImprovedCategory?.category).toBe('portrait')
    })

    it('never reports a negative delta as "most improved"', () => {
        const rows = [
            row({ category: 'portrait', score: 90, createdAt: '2026-01-01' }),
            row({ category: 'portrait', score: 85, createdAt: '2026-01-02' }),
            row({ category: 'portrait', score: 70, createdAt: '2026-01-03' }),
            row({ category: 'portrait', score: 60, createdAt: '2026-01-04' }),
        ]

        expect(findPersonalBests(rows).mostImprovedCategory).toBeNull()
    })
})

describe('analyzeGearCorrelation', () => {
    it('buckets aperture values and computes average score per bucket', () => {
        const rows = [
            row({ score: 90, metadata: { aperture: 'f/1.8' } }),
            row({ score: 85, metadata: { aperture: 'f/2.0' } }),
            row({ score: 80, metadata: { aperture: 'f/2.8' } }),
        ]

        const insights = analyzeGearCorrelation(rows)
        const apertureInsight = insights.find((i) => i.dimension === 'aperture')

        expect(apertureInsight).toEqual({
            dimension: 'aperture',
            bucketLabel: 'f/1.4–f/2.8 (wide open)',
            averageScore: 85,
            count: 3,
        })
    })

    it('excludes buckets with fewer than 3 data points', () => {
        const rows = [row({ score: 90, metadata: { aperture: 'f/1.8' } }), row({ score: 85, metadata: { aperture: 'f/2.0' } })]

        expect(analyzeGearCorrelation(rows)).toEqual([])
    })

    it('ignores unparseable or missing EXIF values without throwing', () => {
        const rows = [
            row({ score: 90, metadata: { aperture: 'unknown' } }),
            row({ score: 85, metadata: {} }),
            row({ score: 80, metadata: null }),
        ]

        expect(analyzeGearCorrelation(rows)).toEqual([])
    })
})

describe('analyzeGoalAlignment', () => {
    it('returns [] when there is no scored data', () => {
        expect(analyzeGoalAlignment([])).toEqual([])
    })

    it('computes average score per goal relative to the overall average', () => {
        const rows = [
            row({ score: 90, goals: ['composition'] }),
            row({ score: 80, goals: ['composition'] }),
            row({ score: 50, goals: ['lighting'] }),
            row({ score: 60, goals: ['lighting'] }),
        ]

        const insights = analyzeGoalAlignment(rows)
        const composition = insights.find((i) => i.goal === 'composition')
        expect(composition?.averageScore).toBe(85)
        expect(composition?.deltaFromOverall).toBeCloseTo(15, 5) // overall avg = 70
    })

    it('excludes goals with fewer than 2 data points', () => {
        const rows = [row({ score: 90, goals: ['storytelling'] })]
        expect(analyzeGoalAlignment(rows)).toEqual([])
    })
})

describe('analyzeLearningImpact', () => {
    it('surfaces a meaningful score delta around a lesson completion', () => {
        const rows = [
            row({ score: 50, createdAt: '2026-01-01T00:00:00.000Z' }),
            row({ score: 52, createdAt: '2026-01-05T00:00:00.000Z' }),
            row({ score: 70, createdAt: '2026-01-16T00:00:00.000Z' }),
            row({ score: 72, createdAt: '2026-01-20T00:00:00.000Z' }),
        ]
        const completions = [{ lessonId: 'l1', lessonTitle: 'Composition 101', completedAt: '2026-01-15T00:00:00.000Z' }]

        const [impact] = analyzeLearningImpact(rows, completions)

        expect(impact.lessonTitle).toBe('Composition 101')
        expect(impact.delta).toBeCloseTo(20, 5)
    })

    it('does not surface a lesson without enough before/after data', () => {
        const rows = [row({ score: 50, createdAt: '2026-01-01T00:00:00.000Z' })]
        const completions = [{ lessonId: 'l1', lessonTitle: 'Composition 101', completedAt: '2026-01-15T00:00:00.000Z' }]

        expect(analyzeLearningImpact(rows, completions)).toEqual([])
    })

    it('does not surface a change smaller than the meaningful-delta threshold', () => {
        const rows = [
            row({ score: 70, createdAt: '2026-01-01T00:00:00.000Z' }),
            row({ score: 71, createdAt: '2026-01-05T00:00:00.000Z' }),
            row({ score: 71, createdAt: '2026-01-16T00:00:00.000Z' }),
            row({ score: 72, createdAt: '2026-01-20T00:00:00.000Z' }),
        ]
        const completions = [{ lessonId: 'l1', lessonTitle: 'Composition 101', completedAt: '2026-01-15T00:00:00.000Z' }]

        expect(analyzeLearningImpact(rows, completions)).toEqual([])
    })
})

describe('extractRecurringThemes', () => {
    it('counts a term once per analysis even if it appears multiple times in one critique', () => {
        const rows = [
            row({
                improvements: [{ title: 'Fix the exposure' }, { title: 'Exposure is uneven' }],
                strengths: ['Great exposure control'],
            }),
            row({ improvements: [{ title: 'Watch your exposure' }] }),
        ]

        const [top] = extractRecurringThemes(rows, 2)
        expect(top.term).toBe('exposure')
        expect(top.occurrences).toBe(2) // 2 analyses, not 4 mentions
    })

    it('filters out stopwords and short words', () => {
        const rows = [row({ strengths: ['This is a good photo overall'] }), row({ strengths: ['This is a good photo overall'] })]

        expect(extractRecurringThemes(rows, 2)).toEqual([])
    })

    it('respects the minimum-occurrences threshold', () => {
        const rows = [row({ strengths: ['Beautiful lighting'] })]
        expect(extractRecurringThemes(rows, 2)).toEqual([])
    })
})

describe('comparePeerBenchmark', () => {
    it('computes the delta between the user and the peer average per category', () => {
        const userBreakdown = [
            { category: 'portrait', averageScore: 80, count: 5 },
            { category: 'macro', averageScore: 60, count: 2 },
        ]
        const globalBreakdown = [{ category: 'portrait', averageScore: 65 }]

        expect(comparePeerBenchmark(userBreakdown, globalBreakdown)).toEqual([
            { category: 'portrait', userAverage: 80, peerAverage: 65, delta: 15 },
        ])
    })
})

describe('getProgressData', () => {
    it('fetches, aggregates, and shapes progress data end-to-end against a fake Supabase client', async () => {
        vi.resetModules()
        vi.doMock('@/lib/supabase/admin', () => ({
            createAdminClient: () => ({
                from: (table: string) => {
                    if (table === 'submissions') {
                        return {
                            select: () => ({
                                eq: () => ({
                                    is: () =>
                                        Promise.resolve({
                                            data: [
                                                { category: 'portrait', analyses: { score: 60 } },
                                                { category: 'portrait', analyses: { score: 70 } },
                                            ],
                                        }),
                                }),
                            }),
                        }
                    }
                    return { select: () => ({ eq: () => ({ is: () => Promise.resolve({ data: [] }) }) }) }
                },
            }),
        }))

        const { getProgressData } = await import('./progress-data')

        const submissionRows = [
            {
                id: 'sub-1',
                created_at: '2026-01-01T00:00:00.000Z',
                category: 'portrait',
                goals: ['composition'],
                metadata: { aperture: 'f/2.0' },
                analyses: { score: 90, full_critique: { scores: { composition: 88 } }, goal_score: null },
            },
        ]

        const fakeUserDb = {
            from: (table: string) => {
                if (table === 'submissions') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    is: () => ({
                                        order: () => Promise.resolve({ data: submissionRows }),
                                    }),
                                }),
                            }),
                        }),
                    }
                }
                if (table === 'user_lesson_progress') {
                    return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }
                }
                throw new Error(`Unexpected table: ${table}`)
            },
        }

        const result = await getProgressData(fakeUserDb as never, 'user-1')

        expect(result.totalAnalyses).toBe(1)
        // Below MIN_FOR_TRENDS (3), so the trend line is deliberately withheld.
        expect(result.scoreTrend).toEqual([])
        expect(result.categoryBreakdown).toEqual([{ category: 'portrait', averageScore: 90, count: 1 }])
        expect(result.peerBenchmark).toEqual([{ category: 'portrait', userAverage: 90, peerAverage: 65, delta: 25 }])

        vi.doUnmock('@/lib/supabase/admin')
    })
})
