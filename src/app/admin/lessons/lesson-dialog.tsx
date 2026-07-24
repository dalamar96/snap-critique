'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { LessonNode } from '@/app/learning/actions'
import { upsertLesson, getLessonComponents } from '../actions'
import { toast } from 'sonner'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

// Helper for Icon Selection
const IconSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    // Could build a fancy grid, but for now a simple input with preview is workable
    const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[value]
    return (
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 border rounded flex items-center justify-center bg-white/5">
                {IconComponent ? <IconComponent className="w-6 h-6" /> : <Icons.HelpCircle className="w-6 h-6 text-slate-500" />}
            </div>
            <Input 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder="Lucide Icon Name (e.g. Camera)" 
                className="flex-1"
            />
        </div>
    )
}

interface LessonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lesson?: LessonNode | null
    allLessons: LessonNode[] // For Parent Selection
    onSuccess: () => void
}

export function LessonDialog({ open, onOpenChange, lesson, allLessons, onSuccess }: LessonDialogProps) {
    const [loading, setLoading] = useState(false)
    const [availableComponents, setAvailableComponents] = useState<string[]>([])
    
    // Form State
    const [formData, setFormData] = useState<Partial<LessonNode>>({
        title: '',
        slug: '',
        description: '',
        level: 'Beginner',
        points: 50,
        icon: 'BookOpen',
        published: false,
        order_index: 0,
        parent_id: null
    })

    useEffect(() => {
        if (open) {
            // Load available components
            getLessonComponents().then(setAvailableComponents)

            if (lesson) {
                setFormData(lesson)
            } else {
                // Reset for creation (set max index + 1 optionally?)
                setFormData({
                    title: '',
                    slug: '',
                    description: '',
                    level: 'Beginner',
                    points: 50,
                    icon: 'BookOpen',
                    published: false,
                    order_index: (Math.max(...allLessons.map(l => l.order_index), 0) + 1),
                    parent_id: null
                })
            }
        }
    }, [open, lesson, allLessons])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await upsertLesson(formData)
            toast.success("Lesson saved successfully")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save lesson')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{lesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input 
                                value={formData.title} 
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug (Component Link)</Label>
                             <div className="relative">
                                <Input 
                                    list="component-slugs"
                                    value={formData.slug} 
                                    onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))}
                                    required
                                    placeholder="e.g. composition-101"
                                />
                                <datalist id="component-slugs">
                                    {availableComponents.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                             </div>
                             <p className="text-[10px] text-slate-500">
                                Match this with a file in `src/components/lessons/`.
                             </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                            value={formData.description || ''} 
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Level</Label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border text-sm bg-transparent"
                                value={formData.level}
                                onChange={e => setFormData(p => ({ ...p, level: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' }))}
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Points</Label>
                            <Input 
                                type="number"
                                value={formData.points} 
                                onChange={e => setFormData(p => ({ ...p, points: parseInt(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Parent Module (Optional)</Label>
                        <select 
                            className="w-full h-10 px-3 rounded-md border text-sm bg-transparent"
                            value={formData.parent_id || ''}
                            onChange={e => setFormData(p => ({ ...p, parent_id: e.target.value || null }))}
                        >
                            <option value="">(No Parent - Top Level)</option>
                            {allLessons
                                .filter(l => l.id !== lesson?.id && !l.parent_id) // Avoid circles, only show top level as parents?
                                .map(l => (
                                    <option key={l.id} value={l.id}>{l.title}</option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <IconSelector 
                            value={formData.icon || 'BookOpen'} 
                            onChange={v => setFormData(p => ({ ...p, icon: v }))} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Order Index</Label>
                        <Input 
                             type="number"
                             value={formData.order_index} 
                             onChange={e => setFormData(p => ({ ...p, order_index: parseInt(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={formData.has_homework || false} 
                                onCheckedChange={c => setFormData(p => ({ ...p, has_homework: c }))}
                            />
                            <Label>Enable Homework Assignment</Label>
                        </div>
                        
                        {formData.has_homework && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Learning Goals & Context</Label>
                                <span className="text-xs text-slate-500 block">
                                    Describe what the AI should look for in the student&apos;s photo. (e.g. &quot;Focus on leading lines and rule of thirds&quot;)
                                </span>
                                <Textarea 
                                    className="min-h-[100px]"
                                    value={formData.learning_goals || ''} 
                                    onChange={e => setFormData(p => ({ ...p, learning_goals: e.target.value }))}
                                    placeholder="Enter specific goals for the AI critique..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <Switch 
                            checked={formData.published} 
                            onCheckedChange={c => setFormData(p => ({ ...p, published: c }))}
                        />
                        <Label>Published (Visible to Users)</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Lesson'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
