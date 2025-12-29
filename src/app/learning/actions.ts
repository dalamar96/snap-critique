'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type LessonNode = {
    id: string
    slug: string
    title: string
    description: string | null
    level: 'Beginner' | 'Intermediate' | 'Advanced'
    points: number
    icon: string | null
    published: boolean
    order_index: number
    parent_id: string | null
    has_homework: boolean
    learning_goals: string | null

    // Computed / Joined
    is_completed: boolean
    children?: LessonNode[]
    homework_progress?: any
    gained_xp: number
}

export async function getLearningTree() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Fetch All Published Lessons
    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('published', true)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Error fetching lessons:', error)
        return []
    }

    // 2. Fetch User Progress (Theory)
    const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, points_awarded')
        .eq('user_id', user.id)

    // 3. Fetch User Progress (Homework)
    const { data: homework } = await supabase
        .from('user_homework_progress')
        .select('lesson_id, points_awarded')
        .eq('user_id', user.id)

    const progressMap = new Map(progress?.map(p => [p.lesson_id, p]))
    const homeworkMap = new Map(homework?.map(h => [h.lesson_id, h]))

    // 4. Build Tree
    const nodes: Record<string, LessonNode> = {}
    const rootNodes: LessonNode[] = []

    // Initialize nodes
    lessons?.forEach(l => {
        const theoryPoints = progressMap.get(l.id)?.points_awarded || 0
        const homeworkPoints = homeworkMap.get(l.id)?.points_awarded || 0

        nodes[l.id] = {
            ...l,
            is_completed: progressMap.has(l.id),
            gained_xp: theoryPoints + homeworkPoints,
            children: []
        }
    })

    // Nest
    lessons?.forEach(l => {
        const node = nodes[l.id]
        if (l.parent_id && nodes[l.parent_id]) {
            nodes[l.parent_id].children?.push(node)
        } else {
            rootNodes.push(node)
        }
    })

    // Sum Group XP (Post-nesting)
    // We iterate over all nodes. Since we have references in `nodes`, updates reflect in `rootNodes`.
    // We need to ensure we don't double count if we run this multiple times, but this is one pass.
    // However, if we process a parent before its children are fully processed... wait.
    // Children `gained_xp` is already calculated (base points).
    // Start with parents? No, we need children sums.
    // Since it's a tree, we can just iterate `nodes` again?
    // If multiple levels deep, we need recursion or bottom-up.
    // Assuming max 1 level of nesting (Modules -> Lessons) for now based on current schema usage.
    // If deep nesting, use recursion.
    // Let's safe-guard with a recursive join helper or just iterate roots.

    const sumXp = (node: LessonNode): number => {
        if (!node.children || node.children.length === 0) return node.gained_xp

        // Sum children
        const childrenTotal = node.children.reduce((acc, child) => acc + sumXp(child), 0)

        // Update parent (Module) totals
        // NOTE: Module might have its own completion points (Bonus).
        // So we ADD children total to existing self total.
        node.gained_xp += childrenTotal
        return node.gained_xp
    }

    rootNodes.forEach(root => sumXp(root))

    return rootNodes
}

export async function getLessonBySlug(slug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch Lesson
    const { data: lesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

    if (!lesson) return null

    // Fetch Progress for this lesson
    const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single()

    // Fetch Children (if valid parent)
    const { data: children } = await supabase
        .from('lessons')
        .select('*')
        .eq('parent_id', lesson.id)
        .eq('published', true)
        .order('order_index', { ascending: true })

    let childrenWithProgress: LessonNode[] = []

    if (children && children.length > 0) {
        const childIds = children.map(c => c.id)
        const { data: childProgress } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .in('lesson_id', childIds)

        const completedSet = new Set(childProgress?.map(p => p.lesson_id))

        childrenWithProgress = children.map(c => ({
            ...c,
            is_completed: completedSet.has(c.id),
            children: []
        })) as LessonNode[]
    }

    // Fetch Homework Progress
    const { data: homeworkProgress } = await supabase
        .from('user_homework_progress')
        .select('*, submissions(id, image_path)')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .single()

    return {
        ...lesson,
        is_completed: !!progress,
        homework_progress: homeworkProgress,
        children: childrenWithProgress
    }
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function completeLesson(lessonId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // Fetch lesson to get points and parent info
    const { data: lesson } = await supabase
        .from('lessons')
        .select('points, parent_id')
        .eq('id', lessonId)
        .single()

    if (!lesson) throw new Error("Lesson not found")

    // Use Admin Client to bypass RLS for insertion
    const adminDb = createAdminClient()

    const { error } = await adminDb
        .from('user_lesson_progress')
        .insert({
            user_id: user.id,
            lesson_id: lessonId,
            points_awarded: lesson.points
        })

    if (error && error.code !== '23505') { // Ignore duplicate key error (already completed)
        throw new Error(error.message)
    }

    // Check for Group Completion (Bonus XP)
    if (lesson.parent_id) {
        // Fetch all siblings (including self) to verify total count
        const { data: siblings } = await supabase
            .from('lessons')
            .select('id')
            .eq('parent_id', lesson.parent_id)
            .eq('published', true)

        if (siblings && siblings.length > 0) {
            const siblingIds = siblings.map(s => s.id)

            // Check how many of these the user has completed
            // (Using adminDb to ensure we see the write we just made)
            const { count: completedCount } = await adminDb
                .from('user_lesson_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('lesson_id', siblingIds)

            if (completedCount === siblings.length) {
                console.log(`[Bonus XP] User ${user.id} completed group ${lesson.parent_id}`)
                // Recursively complete the parent to award its points
                // We don't await this to speed up response? Or we do to ensure consistency?
                // Let's await it to be safe.
                await completeLesson(lesson.parent_id)
            }
        }
    }

    revalidatePath('/learning')
    revalidatePath(`/learning`)
    return { success: true }
}

export async function getUserTotalLearningPoints() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data: theory } = await supabase
        .from('user_lesson_progress')
        .select('points_awarded')
        .eq('user_id', user.id)

    const { data: practical } = await supabase
        .from('user_homework_progress')
        .select('points_awarded')
        .eq('user_id', user.id)

    const totalTheory = theory?.reduce((acc, curr) => acc + curr.points_awarded, 0) || 0
    const totalPractical = practical?.reduce((acc, curr) => acc + curr.points_awarded, 0) || 0

    return totalTheory + totalPractical
}
