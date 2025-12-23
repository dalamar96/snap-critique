'use client'

import { useState } from 'react'
import { updateSystemPrompt } from './actions'
import { Save, Loader2 } from 'lucide-react'

export function PromptForm({ initialContent }: { initialContent: string }) {
    const [content, setContent] = useState(initialContent)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateSystemPrompt(content)
            setLastSaved(new Date())
        } catch (e) {
            console.error(e)
            alert('Failed to save prompt')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 flex-1">
            <textarea 
                className="flex-1 w-full bg-black border border-white/20 p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-primary resize-none h-[400px] rounded"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter system prompt..."
            />
            <div className="flex justify-between items-center">
                <div className="text-xs text-slate-500">
                    {lastSaved && `Saved at ${lastSaved.toLocaleTimeString()}`}
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold uppercase text-sm hover:bg-slate-200 disabled:opacity-50 rounded"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Deploy New Version'}
                </button>
            </div>
        </div>
    )
}
