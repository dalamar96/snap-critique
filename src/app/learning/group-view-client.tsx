'use client'

import { LessonNode } from '@/app/learning/actions'
import { Card, CardContent } from '@/components/ui/card'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GroupViewClientProps {
    lesson: any // Typed as the specific return from getLessonBySlug + children
}

export function GroupViewClient({ lesson }: GroupViewClientProps) {
    const children = lesson.children as LessonNode[]
    const completedCount = children.filter(c => c.is_completed).length
    const totalCount = children.length
    const progress = Math.round((completedCount / totalCount) * 100) || 0

    // Dynamic Icon for the Header
    const IconComponent = (Icons as any)[lesson.icon || 'BookOpen'] || Icons.BookOpen

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
                <Link href="/learning" className="text-sm font-mono text-primary hover:underline uppercase tracking-wider">
                    ← Back to Learning Center
                </Link>

                <div className="flex items-start gap-6">
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 hidden sm:block">
                        <IconComponent className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold">{lesson.title}</h1>
                            {lesson.is_completed && (
                                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-mono border border-green-500/20">
                                    Completed
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-lg max-w-2xl">
                            {lesson.description || "Complete all lessons in this module to earn bonus XP."}
                        </p>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-4 pt-2">
                             <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                             </div>
                             <span className="font-mono text-sm text-slate-400 whitespace-nowrap">
                                {completedCount} / {totalCount} Completed
                             </span>
                        </div>
                         <p className="text-xs text-primary/80 font-mono pt-1">
                            Complete all lessons to earn {lesson.points} bonus points!
                        </p>
                    </div>
                </div>
            </div>

            {/* Children Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child) => {
                     const ChildIcon = (Icons as any)[child.icon || 'FileText'] || Icons.FileText
                     
                     return (
                        <Link 
                            key={child.id} 
                            href={`/learning/${child.slug}`}
                            className="group block"
                        >
                            <Card className="h-full bg-white/5 border-white/10 group-hover:border-primary/50 transition-colors">
                                <CardContent className="p-6 flex items-start gap-4">
                                     <div className={cn(
                                        "p-3 rounded-lg border transition-colors",
                                        child.is_completed 
                                            ? "bg-primary/20 border-primary/20 text-primary"
                                            : "bg-white/5 border-white/10 text-slate-400 group-hover:text-primary group-hover:border-primary/20"
                                     )}>
                                        <ChildIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-bold group-hover:text-primary transition-colors">
                                                {child.title}
                                            </h3>
                                             {child.is_completed ? (
                                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2">
                                            {child.description}
                                        </p>
                                        <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-500">
                                            <span>{child.points} XP</span>
                                            <span>•</span>
                                            <span>{child.level}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                     )
                })}

                {children.length === 0 && (
                     <div className="col-span-full py-12 text-center text-slate-500 font-mono">
                        No lessons in this module yet.
                    </div>
                )}
            </div>
        </div>
    )
}
