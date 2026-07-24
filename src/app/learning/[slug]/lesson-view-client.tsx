'use client'

import React, { useState, useTransition } from 'react'
import { LessonRegistry } from '@/config/lesson-registry'
import { completeLesson } from '../actions'
import { CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { HomeworkUpload } from '../homework-upload'
import { LessonNode } from '../actions'

export function LessonViewClient({ lesson, userCredits }: { lesson: LessonNode, userCredits: number }) {
    const Component = LessonRegistry[lesson.slug]
    const [isCompleted, setIsCompleted] = useState(lesson.is_completed)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleComplete = () => {
        if (isCompleted || isPending) return

        startTransition(async () => {
            try {
                await completeLesson(lesson.id)
                setIsCompleted(true)
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })
                router.refresh()
            } catch (error) {
                console.error("Failed to complete", error)
                alert("Something went wrong marking this lesson as complete.")
            }
        })
    }

    if (!Component) {
        return (
             <div className="py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <h3 className="text-xl text-white font-bold mb-2">Content Coming Soon</h3>
                <p className="text-slate-500">This lesson content hasn&apos;t been written yet.</p>
             </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* The Lesson Content */}
            <div className="lesson-content">
                <Component />
            </div>

            {/* Homework Section */}
            {lesson.has_homework && (
                <div className="mb-16 border-t border-white/10 pt-12">
                    <h2 className="text-2xl font-bold text-white mb-2">Practice Assignment</h2>
                    
                    {lesson.homework_progress ? (
                        <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="space-y-2">
                                <h3 className="text-green-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> Assignment Completed
                                </h3>
                                <p className="text-slate-400 text-sm max-w-lg">
                                    Great job! You&apos;ve submitted your homework and earned <span className="text-white font-bold">+{lesson.homework_progress.points_awarded || 0} Bonus XP</span> based on how well you met the lesson goals.
                                </p>
                            </div>
                             <button
                                onClick={() => router.push(`/analysis/${lesson.homework_progress?.submission_id}`)}
                                className="px-6 py-3 rounded bg-primary/10 text-primary border border-primary/50 font-bold uppercase text-xs tracking-widest hover:bg-primary hover:text-black transition-all"
                            >
                                View Critique &gt;&gt;
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-400 mb-8 max-w-2xl">
                                Apply what you&apos;ve learned! Upload a photo that demonstrates the concepts from this lesson to get an AI critique and earn Bonus XP.
                            </p>
                            <HomeworkUpload
                                lessonId={lesson.id}
                                lessonTitle={lesson.title}
                                learningGoals={lesson.learning_goals || ''}
                                userCredits={userCredits}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="border-t border-white/10 pt-12 flex justify-center">
                <button
                    onClick={handleComplete}
                    disabled={isCompleted || isPending}
                    className={cn(
                        "px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all",
                        isCompleted 
                            ? "bg-green-500/10 text-green-500 border border-green-500/50 cursor-default"
                            : "bg-primary text-black hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                    )}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCompleted ? (
                        <>
                            <CheckCircle className="w-6 h-6" />
                            Lesson Completed
                        </>
                    ) : (
                        <>
                            Mark as Complete
                            <span className="text-xs opacity-70 bg-black/10 px-2 py-0.5 rounded ml-2">
                                +{lesson.points} XP
                            </span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
