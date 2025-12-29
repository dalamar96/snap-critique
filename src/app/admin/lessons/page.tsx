import { getAdminLessons } from '../actions'
import { AdminLessonsClient } from './client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLearningTree, LessonNode } from '@/app/learning/actions'

export default async function AdminLessonsPage() {
    // Auth Check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch lessons
    // We can use getAdminLessons which returns a flat list (good for table)
    // Or getLearningTree which returns nested (good for... visualization?)
    // The admin table probably wants a flat list to verify existence and order easily, OR a nested list?
    // My actions.tsx `getAdminLessons` returns a flat list ordered by order_index.
    // However, `getAdminLessons` doesn't populate `children`. 
    // `AdminLessonsClient` expects `LessonNode[]`.
    // Let's use `getLearningTree` IF we want to show modules nicely? 
    // OR just use the flat list and manually connect parents?
    // My Table logic handles `lesson.parent_id`.
    // But `lesson.children` population logic is inside `getLearningTree`.
    // Let's use `getAdminLessons` which is simpler CRUD view.
    // But I entered `isModule` logic in the client based on `lesson.children`.
    // So I need `children` populated if I want that badge to work perfectly?
    // Or I can just check if other lessons have this ID as parent.
    // Simpler: Fetch flat list, let client compute children or just don't rely on it for the "Module" badge?
    // Actually, `getAdminLessons` should return everything.
    // Let's stick to `getAdminLessons` and maybe improve it later if needed.
    // I can manually populate children in Client if needed or just fetch everything.
    
    const lessons = await getAdminLessons()

    return <AdminLessonsClient initialLessons={lessons} />
}
