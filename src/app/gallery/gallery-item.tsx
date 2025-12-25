'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryItemProps {
    item: {
        id: string
        title: string
        score: number
        submission_id: string
        imageUrl: string
        nsfw_score?: number
    }
}

export function GalleryItem({ item }: GalleryItemProps) {
    // Determine initial blur state based on NSFW score
    // If nsfw_score > 75, it's considered potential NSFW
    const isPotentiallyNSFW = (item.nsfw_score || 0) > 75
    const [isRevealed, setIsRevealed] = useState(!isPotentiallyNSFW)

    return (
        <div className="break-inside-avoid group relative rounded-xl overflow-hidden border border-white/10 bg-black hover:border-primary/50 transition-colors">
            <Link 
                prefetch={false}
                href={`/analysis/${item.submission_id}`} 
                className="block relative"
                onClick={(e) => {
                    // Prevent navigation if the content is not revealed (NSFW blur active)
                    if (!isRevealed) {
                       e.preventDefault()
                    }
                }}
            >
                {/* Image */}
                <div className="relative overflow-hidden">
                    <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className={cn(
                            "w-full h-auto object-cover transition-all duration-500",
                            !isRevealed ? "blur-xl scale-110 grayscale brightness-50" : "group-hover:scale-105"
                        )}
                        loading="lazy"
                    />
                    
                    {/* NSFW Warning Overlay */}
                    {!isRevealed && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                            <div className="bg-red-500/20 text-red-500 border border-red-500/50 p-3 rounded-full mb-3">
                                <EyeOff className="w-6 h-6" />
                            </div>
                            <span className="text-white font-bold uppercase text-xs tracking-widest mb-1">Potentially Sensitive</span>
                            <span className="text-slate-400 text-[10px] mb-4">Content may be NSFW</span>
                            
                            <button 
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsRevealed(true)
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                            >
                                <Eye className="w-3 h-3" /> Show Content
                            </button>
                        </div>
                    )}

                    {/* Gradient Overlay (only visible when revealed) */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity",
                        isRevealed ? "opacity-60 group-hover:opacity-80" : "opacity-0"
                    )} />
                </div>

                {/* Content Overlay (Hidden if blurred) */}
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-all",
                    !isRevealed && "opacity-0 translate-y-10"
                )}>
                    <div className="flex items-end justify-between gap-2">
                        <div>
                            <h3 className="text-white font-bold text-sm leading-tight uppercase mb-1 line-clamp-2">{item.title}</h3>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                View Analysis
                            </div>
                        </div>
                        <div className="text-3xl font-black text-primary leading-none">
                            {item.score || 0}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}
