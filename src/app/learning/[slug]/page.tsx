import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLessonBySlug } from '../actions'
import { LessonViewClient } from './lesson-view-client'
import { GroupViewClient } from '../group-view-client'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
    // Await params as per Next.js 15+ changes
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?view=signup')
    }

    const lesson = await getLessonBySlug(slug)

    if (!lesson) {
        notFound()
    }

    let userCredits = 0
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('credits_balance').eq('id', user.id).single()
        userCredits = profile?.credits_balance || 0
    }

    // If it's a Group (Module), render the Group View
    if (lesson.children && lesson.children.length > 0) {
        return (
            <div className="min-h-screen bg-slate-950 font-mono">
                <GroupViewClient lesson={lesson} />
            </div>
        )
    }

    // Otherwise render the Lesson Content View
    return (
        <div className="min-h-screen bg-slate-950 font-mono">
            {/* Top Nav */}
            <div className="border-b border-white/10 bg-black/50 backdrop-blur sticky top-16 z-40">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                     <Link href="/learning" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs uppercase tracking-widest">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Learning
                     </Link>
                     <div className="text-xs uppercase font-bold text-primary">
                        {lesson.points} Points
                     </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                 <div className="mb-8">
                     <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{lesson.title}</h1>
                     <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] uppercase text-slate-400">
                            {lesson.level}
                        </span>
                     </div>
                 </div>

                 {/* Content Wrapper */}
                 <LessonViewClient lesson={lesson} userCredits={userCredits} />
            </div>
        </div>
    )
}
