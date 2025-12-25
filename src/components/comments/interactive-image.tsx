'use client'

import { useState, useRef, useEffect } from 'react'
import { Comment } from '@/types/comments'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InteractiveImageProps {
    src: string
    comments?: Comment[]
    onImageClick?: (x: number, y: number) => void
    activePin?: { x: number, y: number } | null
    className?: string
    isPinning?: boolean
}

export function InteractiveImage({ src, comments = [], onImageClick, activePin, className, isPinning }: InteractiveImageProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [wrapperStyle, setWrapperStyle] = useState<React.CSSProperties>({ opacity: 0 })
    const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)

    const updateDimensions = () => {
        const container = containerRef.current
        const img = imgRef.current
        if (!container || !img || !img.naturalWidth) return

        const cWidth = container.clientWidth
        const cHeight = container.clientHeight
        const iRatio = img.naturalWidth / img.naturalHeight
        const cRatio = cWidth / cHeight

        let width, height

        if (cRatio > iRatio) {
            // Container is wider than image -> Constrain by height
            height = cHeight
            width = height * iRatio
        } else {
            // Container is taller than image -> Constrain by width
            width = cWidth
            height = width / iRatio
        }

        setWrapperStyle({
            width: width,
            height: height,
            opacity: 1
        })
    }

    // Update on Resize
    useEffect(() => {
        if (!containerRef.current) return
        const resizeObserver = new ResizeObserver(() => updateDimensions())
        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!wrapperStyle.width || !onImageClick || !isPinning) return

        // Calculate relative to the WRAPPER (which matches image exactly now)
        // e.currentTarget is the image.
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        onImageClick(x, y)
    }

    const getPinColor = (category: string) => {
        switch(category) {
            case 'critique': return 'bg-orange-500'
            case 'praise': return 'bg-green-500'
            case 'question': return 'bg-blue-500'
            case 'suggestion': return 'bg-purple-500'
            default: return 'bg-white'
        }
    }

    return (
        <div ref={containerRef} className={cn("relative group select-none flex items-center justify-center w-full h-full bg-black/50 overflow-hidden", className)}>
            <div 
                className="relative"
                style={wrapperStyle}
            >
                <img 
                    ref={imgRef}
                    src={src} 
                    alt="Analysis Subject" 
                    className={cn(
                        "w-full h-full object-contain block",
                        isPinning && "cursor-crosshair"
                    )}
                    onLoad={updateDimensions}
                    onClick={handleClick}
                    draggable={false}
                />

                {/* Pins Layer relative to Wrapper */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Active (Draft) Pin */}
                    <AnimatePresence>
                        {activePin && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute w-6 h-6 -ml-3 -mt-3 bg-primary rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse z-20"
                                style={{ left: `${activePin.x}%`, top: `${activePin.y}%` }}
                            >
                                <div className="w-2 h-2 bg-black rounded-full" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Existing Comments */}
                    {comments.map(comment => {
                        if (!comment.location_x || !comment.location_y) return null
                        const isHovered = hoveredCommentId === comment.id

                        return (
                            <div 
                                key={comment.id}
                                className={cn(
                                    "absolute w-4 h-4 -ml-2 -mt-2 rounded-full border border-black/20 shadow-lg cursor-pointer pointer-events-auto transition-transform hover:scale-150 z-10",
                                    getPinColor(comment.category)
                                )}
                                style={{ left: `${comment.location_x}%`, top: `${comment.location_y}%` }}
                                onMouseEnter={() => setHoveredCommentId(comment.id)}
                                onMouseLeave={() => setHoveredCommentId(null)}
                                title={`${comment.profiles?.full_name}: ${comment.text}`}
                            >
                                 {isHovered && (
                                    <div className={cn(
                                        "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 p-2 rounded text-xs text-white z-50 pointer-events-none",
                                        "animate-in fade-in zoom-in-95 duration-200"
                                    )}>
                                        <div className="font-bold flex justify-between">
                                            {comment.profiles?.full_name}
                                            <span className="opacity-50 uppercase text-[9px]">{comment.category}</span>
                                        </div>
                                        <div className="truncate">{comment.text}</div>
                                    </div>
                                 )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* Overlay Hint */}
            {isPinning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-full pointer-events-none backdrop-blur animate-in fade-in slide-in-from-top-4 z-50">
                    Click anywhere to pin comment
                </div>
            )}
        </div>
    )
}
