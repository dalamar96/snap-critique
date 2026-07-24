'use client'

import { useState, useRef, useEffect } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { Comment, CommentType } from '@/types/comments'
import { User, MessageSquare, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addComment, deleteComment } from '@/app/analysis/actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface CommentSectionProps {
    submissionId: string
    currentUser: SupabaseUser | null
    comments: Comment[]
    activePin: { x: number, y: number } | null
    onOpenPinModal: () => void
    onClearPin: () => void
}

const CATEGORIES: { id: CommentType, label: string, color: string }[] = [
    { id: 'critique', label: 'Critique', color: 'bg-orange-500 text-white' },
    { id: 'praise', label: 'Praise', color: 'bg-green-500 text-white' },
    { id: 'suggestion', label: 'Suggestion', color: 'bg-purple-500 text-white' },
    { id: 'question', label: 'Question', color: 'bg-blue-500 text-white' },
    { id: 'general', label: 'General', color: 'bg-slate-700 text-white' },
]

export function CommentSection({ 
    submissionId, 
    currentUser, 
    comments, 
    activePin, 
    onOpenPinModal, 
    onClearPin 
}: CommentSectionProps) {
    const router = useRouter()
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [category, setCategory] = useState<CommentType>('general')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    // Auto-scroll to form when pin is dropped
    useEffect(() => {
        if (activePin) {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [activePin])

    async function handlePost(formData: FormData) {
        if (!currentUser) return
        setIsSubmitting(true)

        // Append Pin Data
        if (activePin) {
            formData.set('location_x', activePin.x.toString())
            formData.set('location_y', activePin.y.toString())
        }
        
        // Append Category (only for top level)
        if (!formData.get('parent_id')) {
             formData.set('category', category)
        } else {
             formData.set('category', 'general') // Replies are general by default or inherit? Let's say general.
        }

        const result = await addComment(formData)
        
        setIsSubmitting(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Comment posted")
            if (!formData.get('parent_id')) {
                formRef.current?.reset()
                onClearPin()
                setCategory('general')
            } else {
                setReplyingTo(null)
            }
        }
    }

    const handleDelete = async (id: string) => {
        if(!confirm("Delete comment?")) return
        const result = await deleteComment(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Comment deleted")
            router.refresh()
        }
    }

    // Recursive render function
    const renderComment = (comment: Comment, depth = 0) => {
        const isReply = depth > 0
        const children = comments.filter(c => c.parent_id === comment.id)

        return (
            <div key={comment.id} className={cn("flex gap-4 group", isReply && "mt-4 ml-8 md:ml-12")}>
                 <div className={cn(
                     "shrink-0 rounded-full bg-white/5 overflow-hidden border border-white/10",
                     isReply ? "w-8 h-8" : "w-10 h-10"
                 )}>
                    {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt={comment.profiles?.full_name || 'Commenter avatar'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500"><User className={isReply ? "w-4 h-4" : "w-5 h-5"}/></div>
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-baseline justify-between">
                        <span className="font-bold text-white text-sm">{comment.profiles?.full_name || 'Anonymous'}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest" suppressHydrationWarning>
                            {formatDistanceToNow(new Date(comment.created_at))} ago
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                        {!isReply && CATEGORIES.find(c => c.id === comment.category) && (
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", 
                                    CATEGORIES.find(c => c.id === comment.category)?.color
                                )}>
                                    {CATEGORIES.find(c => c.id === comment.category)?.label}
                                </span>
                        )}
                        {comment.location_x && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> Pinned
                            </span>
                        )}
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed">{comment.text}</p>

                    <div className="flex items-center justify-end gap-3 mt-2">
                        {currentUser && (
                            <button 
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-[10px] text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-wider"
                            >
                                Reply
                            </button>
                        )}
                        {currentUser?.id === comment.user_id && (
                            <button onClick={() => handleDelete(comment.id)} className="text-[10px] text-red-500 hover:underline">
                                Delete
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <form action={handlePost} className="mt-4 animate-in fade-in slide-in-from-top-2">
                             <input type="hidden" name="submission_id" value={submissionId} />
                             <input type="hidden" name="parent_id" value={comment.id} />
                             <div className="flex gap-2">
                                <input 
                                    name="text" 
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    placeholder="Write a reply..."
                                    autoFocus
                                    required
                                />
                                <button type="submit" disabled={isSubmitting} className="bg-white text-black text-xs font-bold uppercase px-3 rounded hover:bg-slate-200">
                                    {isSubmitting ? '...' : 'Send'}
                                </button>
                             </div>
                        </form>
                    )}

                    {/* Render Children */}
                    {children.length > 0 && (
                        <div className="border-l border-white/10 pl-0 mt-2">
                            {children.map(child => renderComment(child, depth + 1))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const topLevelComments = comments.filter(c => !c.parent_id)

    return (
        <div className="bg-black border border-white/10 p-6 md:p-8 space-y-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> 
                Discussion ({comments.length})
            </h3>

            {/* List */}
            <div className="space-y-6">
                {comments.length === 0 && (
                    <div className="text-slate-500 italic text-sm">No comments yet. Be the first to critique!</div>
                )}
                
                {topLevelComments.map(comment => renderComment(comment))}
            </div>

            {/* Main Form */}
            {currentUser ? (
                <form ref={formRef} action={handlePost} className="border-t border-white/10 pt-6 space-y-4">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-black shrink-0">
                            You
                        </div>
                        <div className="flex-1 space-y-3">
                            <input type="hidden" name="submission_id" value={submissionId} />
                         
                            {/* Toolbar */}
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={cn(
                                            "px-3 py-1 text-xs uppercase font-bold rounded border transition-all",
                                            category === cat.id 
                                                ? cat.color + " border-transparent ring-1 ring-white/50" 
                                                : "bg-transparent text-slate-500 border-white/10 hover:border-white/30"
                                        )}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                                
                                <div className="w-px bg-white/10 mx-1" />

                                <button
                                    type="button"
                                    onClick={onOpenPinModal}
                                    className={cn(
                                        "px-3 py-1 text-xs uppercase font-bold rounded border flex items-center gap-1 transition-all",
                                        activePin
                                            ? "bg-primary text-black border-transparent"
                                            : "bg-transparent text-slate-500 border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <MapPin className="w-3 h-3" />
                                    {activePin ? 'Pin Set' : 'Pin Location'}
                                </button>

                                {activePin && (
                                    <button 
                                        type="button" 
                                        onClick={onClearPin} 
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Remove Pin
                                    </button>
                                )}
                            </div>

                            <textarea 
                                name="text"
                                className="w-full bg-white/5 border border-white/10 rounded p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary min-h-[100px]"
                                placeholder={activePin ? "What's wrong with this spot?" : "Add your critique..."}
                                required
                            />

                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-white text-black font-bold uppercase text-xs px-6 py-2 rounded hover:bg-slate-200 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                     </div>
                </form>
            ) : (
                <div className="border border-white/10 bg-white/5 p-6 text-center">
                    <p className="text-slate-400 mb-4">Log in to join the discussion.</p>
                    <a href={`/login?next=/analysis/${submissionId}`} className="inline-block bg-primary text-black px-6 py-2 rounded font-bold uppercase text-xs hover:bg-white">
                        Log In
                    </a>
                </div>
            )}
        </div>
    )
}
