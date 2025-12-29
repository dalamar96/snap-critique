'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, ScanLine, Terminal, CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'

interface HomeworkUploadProps {
    lessonId: string
    lessonTitle: string
    learningGoals: string
    userCredits: number
}

export function HomeworkUpload({ lessonId, lessonTitle, learningGoals, userCredits }: HomeworkUploadProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // States: 'upload' | 'context' | 'analyzing'
    const [step, setStep] = useState<'upload' | 'context' | 'analyzing'>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [imagePath, setImagePath] = useState<string | null>(null)
    const [context, setContext] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Reuse upload logic (simplified from UploadZone)
    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file.')
            return
        }
        if (file.size > 20 * 1024 * 1024) {
            toast.error('File is too large (Max 20MB).')
            return
        }

        setIsUploading(true)
        try {
            const { uploadImage } = await import('@/lib/storage')
            const path = await uploadImage(file)
            if (path) {
                setFile(file)
                setImagePath(path)
                setStep('context')
            } else {
                toast.error('Upload failed')
            }
        } catch (e) {
            toast.error('System error during upload')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.length > 0) {
            await processFile(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) await processFile(e.target.files[0])
    }

    const handleSubmit = async () => {
        if (!imagePath) return
        setStep('analyzing')

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imagePath,
                    lessonId,
                    context: context || 'Homework Assignment',
                    category: 'other', // Default, AI will figure it out or contexts matters more
                    goals: [] // Prompt uses lesson goals overrides via lessonId
                })
            })
            
            const data = await res.json()
            if (data.success) {
                router.push(`/analysis/${data.id}`)
            } else {
                toast.error(data.error || 'Analysis failed')
                setStep('context')
            }
        } catch (e) {
            toast.error('Network error')
            setStep('context')
        }
    }

    if (step === 'analyzing') {
        return (
             <div className="w-full bg-black border border-white/10 rounded-lg p-12 text-center font-mono space-y-6 min-h-[400px] flex flex-col items-center justify-center">
                <div className="text-primary animate-pulse text-6xl mb-4">
                    <Terminal className="w-16 h-16 mx-auto" />
                </div>
                <h2 className="text-xl font-bold uppercase text-white">Grading Assignment...</h2>
                <div className="w-full max-w-md bg-white/10 h-1 overflow-hidden rounded-full">
                    <div className="h-full bg-primary animate-progress-indeterminate" />
                </div>
                <p className="text-slate-400 uppercase tracking-widest text-xs">
                    Comparing against lesson goals...
                </p>
            </div>
        )
    }

    if (step === 'context') {
        return (
            <div className="w-full bg-black border border-white/10 rounded-lg p-8 font-mono animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-lg font-bold text-white uppercase mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    Image Uploaded
                </h3>
                
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded text-sm text-slate-300">
                        <span className="text-xs uppercase text-slate-500 block mb-1">Assignment Focus</span>
                        {learningGoals || "No specific goals set."}
                    </div>

                    <div className="space-y-2">
                         <label className="text-xs uppercase text-slate-500">Add Notes (Optional)</label>
                         <Textarea 
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            placeholder="Tell the AI about your shot, what you struggled with..."
                            className="bg-black border-white/20 min-h-[100px]"
                         />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <Button variant="ghost" onClick={() => { setStep('upload'); setFile(null); }}>
                             Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="gap-2">
                            Submit (1 Credit) <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => userCredits > 0 && fileInputRef.current?.click()}
            className={cn(
                "relative border-2 border-dashed border-white/10 bg-black/50 rounded-lg p-10 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[300px] hover:bg-white/5 group",
                isDragging && "border-primary bg-primary/10",
                (userCredits < 1) && "opacity-50 cursor-not-allowed hover:bg-black/50"
            )}
        >
            <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
                disabled={userCredits < 1}
            />

            <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                {isUploading ? (
                    <ScanLine className="w-8 h-8 text-primary animate-spin" />
                ) : (
                    <Upload className="w-8 h-8 text-primary" />
                )}
            </div>

            <h3 className="text-lg font-bold text-white uppercase mb-2">
                {isUploading ? 'Uploading...' : 'Upload Assignment'}
            </h3>
            
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 flex flex-col gap-1 items-center">
                <span>{userCredits < 1 ? 'Insufficient Credits' : 'Drag & Drop or Click'}</span>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", userCredits < 1 ? "bg-red-900/50 text-red-500" : "bg-primary/20 text-primary")}>
                    Cost: 1 Credit (Balance: {userCredits})
                </span>
            </p>

            {userCredits < 1 && (
                 <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/pricing'); }}>
                     Get Credits to Submit
                 </Button>
            )}
        </div>
    )
}
