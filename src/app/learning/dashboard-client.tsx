'use client'

import { useState, useMemo } from 'react'
import { LessonNode } from './actions'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { CheckCircle, Circle, Lock, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper to render dynamic icon
const DynamicIcon = ({ name, className }: { name: string | null, className?: string }) => {
    if (!name) return <Icons.BookOpen className={className} />
    const IconComponent = (Icons as any)[name]
    return IconComponent ? <IconComponent className={className} /> : <Icons.BookOpen className={className} />
}

type FilterLevel = 'All' | 'Beginner' | 'Intermediate' | 'Advanced'
type FilterStatus = 'All' | 'Completed' | 'Incomplete'
type SortBy = 'Order' | 'Points'

export function LearningDashboardClient({ initialTree }: { initialTree: LessonNode[] }) {
    const [levelFilter, setLevelFilter] = useState<FilterLevel>('All')
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('All')
    const [sortBy, setSortBy] = useState<SortBy>('Order')

    // Filter and Sort Root Nodes (Modules/Standalone Lessons)
    const filteredNodes = useMemo(() => {
        let nodes = [...initialTree]

        // Level Filter
        if (levelFilter !== 'All') {
            nodes = nodes.filter(n => n.level === levelFilter)
        }

        // Status Filter
        if (statusFilter !== 'Completed') {
             // If user wants "Incomplete", filter out completed
             if (statusFilter === 'Incomplete') nodes = nodes.filter(n => !n.is_completed)
        } else {
             // If user wants "Completed", filter out incomplete
             nodes = nodes.filter(n => n.is_completed)
        }

        // Sort
        if (sortBy === 'Points') {
            nodes.sort((a, b) => b.points - a.points)
        } else {
            // Default order
            nodes.sort((a, b) => (a.order_index - b.order_index) || a.title.localeCompare(b.title))
        }

        return nodes
    }, [initialTree, levelFilter, statusFilter, sortBy])

    return (
        <div>
            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs uppercase text-slate-500 mr-2">Level:</span>
                    {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(l => (
                        <button 
                            key={l}
                            onClick={() => setLevelFilter(l)}
                            className={cn(
                                "px-3 py-1 text-xs uppercase border rounded-full transition-colors",
                                levelFilter === l 
                                    ? "bg-primary text-black border-primary font-bold" 
                                    : "bg-transparent text-slate-400 border-white/20 hover:border-white"
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 items-center lg:ml-auto">
                    <span className="text-xs uppercase text-slate-500 mr-2">Status:</span>
                    {(['All', 'Completed', 'Incomplete'] as const).map(s => (
                        <button 
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                "px-3 py-1 text-xs uppercase border rounded-full transition-colors",
                                statusFilter === s 
                                    ? "bg-white text-black border-white font-bold" 
                                    : "bg-transparent text-slate-400 border-white/20 hover:border-white"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                    
                    <div className="w-px h-4 bg-white/20 mx-2 hidden lg:block" />

                    <span className="text-xs uppercase text-slate-500 mr-2">Sort:</span>
                     <button 
                        onClick={() => setSortBy(prev => prev === 'Order' ? 'Points' : 'Order')}
                        className="px-3 py-1 text-xs uppercase border border-white/20 rounded-full hover:bg-white/10 text-slate-300"
                    >
                        {sortBy === 'Order' ? 'Default' : 'Points High-Low'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNodes.map(node => {
                    const isModule = node.children && node.children.length > 0
                    const childCount = node.children?.length || 0
                    const completedChildCount = node.children?.filter(c => c.is_completed).length || 0
                    const progressPercent = childCount > 0 ? (completedChildCount / childCount) * 100 : 0

                    return (
                        <Link 
                            key={node.id} 
                            href={`/learning/${node.slug}`}
                            className={cn(
                                "group relative block bg-black border transition-all p-6 select-none flex flex-col justify-between h-full",
                                node.is_completed 
                                    ? "border-green-900/50 hover:border-green-500" 
                                    : isModule ? "border-primary/20 hover:border-primary" : "border-white/10 hover:border-primary"
                            )}
                        >
                            {/* Status Icon Top Right */}
                            <div className="absolute top-4 right-4">
                                {node.is_completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-700 group-hover:text-slate-500" />
                                )}
                            </div>

                            <div className="mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                    node.is_completed ? "text-green-500" : "text-primary",
                                    isModule && !node.is_completed && "bg-primary/10"
                                )}>
                                    <DynamicIcon name={node.icon} className="w-6 h-6" />
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn(
                                        "text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded-full",
                                        node.level === 'Beginner' ? "text-blue-400 border-blue-900 bg-blue-900/20" :
                                        node.level === 'Intermediate' ? "text-yellow-400 border-yellow-900 bg-yellow-900/20" :
                                        "text-red-400 border-red-900 bg-red-900/20"
                                    )}>
                                        {node.level}
                                    </span>
                                    {isModule ? (
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white uppercase font-bold flex items-center gap-1">
                                            <Layers className="w-3 h-3" /> Module
                                        </span>
                                    ) : (
                                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded", node.is_completed ? "bg-green-900/30 text-green-500" : "text-slate-500 bg-white/5")}>
                                            {node.is_completed ? `${node.gained_xp} XP Gained` : `${node.points} XP Available`}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors mb-2">
                                    {node.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-2">
                                    {node.description}
                                </p>
                            </div>

                            {/* Module Footer: Progress Bar */}
                            {isModule ? (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                        <span>{completedChildCount} / {childCount} Completed</span>
                                        <span className={cn("font-bold", node.gained_xp > 0 ? "text-green-500" : "text-slate-600")}>
                                            {node.gained_xp} XP Earned
                                        </span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={cn("h-full transition-all duration-500", node.is_completed ? "bg-green-500" : "bg-primary")}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2 flex justify-between items-center text-xs font-mono">
                                   <span className="text-slate-600">Single Lesson</span>
                                   {node.gained_xp > 0 && <span className="text-green-500 font-bold">+{node.gained_xp} XP Included</span>}
                                </div>
                            )}
                        </Link>
                    )
                })}

                {filteredNodes.length === 0 && (
                     <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-lg">
                        <p className="text-slate-500 text-sm uppercase tracking-widest">No lessons match filters</p>
                     </div>
                )}
            </div>
        </div>
    )
}
