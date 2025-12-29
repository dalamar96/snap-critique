'use client'

import { useState } from 'react'
import { LessonNode } from '@/app/learning/actions'
import { deleteLesson } from '../actions'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash, BookOpen, Layers } from 'lucide-react'
import { LessonDialog } from './lesson-dialog'
import { toast } from 'sonner'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Helper
const DynamicIcon = ({ name, className }: { name: string | null, className?: string }) => {
    if (!name) return <Icons.BookOpen className={className} />
    const IconComponent = (Icons as any)[name]
    return IconComponent ? <IconComponent className={className} /> : <Icons.BookOpen className={className} />
}

export function AdminLessonsClient({ initialLessons }: { initialLessons: LessonNode[] }) {
    const [lessons, setLessons] = useState<LessonNode[]>(initialLessons)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingLesson, setEditingLesson] = useState<LessonNode | null>(null)

    const handleCreate = () => {
        setEditingLesson(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (lesson: LessonNode) => {
        setEditingLesson(lesson)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return

        try {
            await deleteLesson(id)
            setLessons(prev => prev.filter(l => l.id !== id))
            toast.success("Lesson deleted")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    // Refresh function to reload data if needed without full page reload?
    // Actually simpler to just rely on props being refreshed by router cache invalidation which happens after server action?
    // But router.refresh() is manual. `revalidatePath` on server should trigger it.
    // However, props won't update automatically in client state unless we listen or router refreshes.
    // Let's assume revalidatePath works and just refresh the route or use `window.location.reload` if needed, OR just update local state optimistically.
    // Server action `upsertLesson` calls revalidatePath. Next.js App Router should propagate this.
    // BUT we are using local state `lessons` initialized from props. It won't update when props change unless we sync.
    // Better: Don't use local state for the list. Use `useRouter` and `refresh`.
    // But that might be slow.
    // For now, I'll stick to a simple page reload call in `onSuccess` or let the parent force a reload.

    const handleSuccess = () => {
        // window.location.reload() // Force reload to get fresh data
        // Ideally we use router.refresh() 
        // But let's just use the server revalidation to handle the data source of truth.
        // We can create a hidden action to re-fetch?
        // simplest: reload for now.
        location.reload()
    }

    return (
        <div className="min-h-screen bg-slate-950 font-mono text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <Link href="/admin" className="text-xs text-slate-500 hover:text-white uppercase mb-2 block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Layers className="w-8 h-8 text-primary" />
                            Lesson Management
                        </h1>
                    </div>
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="w-4 h-4" /> New Lesson
                    </Button>
                </div>

                {/* List */}
                <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 uppercase text-xs text-slate-400 font-bold border-b border-white/10">
                            <tr>
                                <th className="p-4">Icon</th>
                                <th className="p-4">Title / Slug</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Points</th>
                                <th className="p-4 text-center">Published</th>
                                <th className="p-4 text-center">Order</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {lessons.map(lesson => (
                                <tr key={lesson.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-primary">
                                            <DynamicIcon name={lesson.icon} className="w-4 h-4" />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-white">{lesson.title}</div>
                                        <div className="text-xs text-slate-500 font-mono">{lesson.slug}</div>
                                        {lesson.parent_id && (
                                            <div className="mt-1 text-[10px] text-slate-600 uppercase tracking-wide flex items-center gap-1">
                                                <Layers className="w-3 h-3" /> Child Item
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {lesson.children && lesson.children.length > 0 ? (
                                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded textxs uppercase font-bold text-[10px]">Module</span>
                                        ) : (
                                            <span className="bg-white/10 text-slate-400 px-2 py-0.5 rounded textxs uppercase font-bold text-[10px]">Lesson</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] uppercase border",
                                            lesson.level === 'Beginner' ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                            lesson.level === 'Intermediate' ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                                            "border-red-500/30 text-red-400 bg-red-500/10"
                                        )}>
                                            {lesson.level}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-slate-400">
                                        {lesson.points} XP
                                    </td>
                                    <td className="p-4 text-center">
                                         {lesson.published ? (
                                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                         ) : (
                                            <span className="w-2 h-2 rounded-full bg-slate-700 inline-block"></span>
                                         )}
                                    </td>
                                    <td className="p-4 text-center font-mono">
                                        {lesson.order_index}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEdit(lesson)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(lesson.id, lesson.title)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {lessons.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500 uppercase tracking-widest">
                                        No lessons found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <LessonDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
                lesson={editingLesson} 
                allLessons={lessons}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
