'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { togglePublicStatus } from '@/app/analysis/actions'
import { toast } from 'sonner'
import { Globe, Lock } from 'lucide-react'
import { ShareAnalysisDialog } from '@/components/share-analysis-dialog'

interface DashboardPublicToggleProps {
  submissionId: string
  initialIsPublic: boolean
}

export function DashboardPublicToggle({ submissionId, initialIsPublic }: DashboardPublicToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    setIsPublic(checked) // Optimistic
    
    try {
        const result = await togglePublicStatus(submissionId, checked)
        if (result.error) {
            setIsPublic(!checked) // Revert
            toast.error("Failed to update status")
        } else {
            toast.success(checked ? "Analysis is now public" : "Analysis is now private")
        }
    } catch (e) {
        setIsPublic(!checked)
        toast.error("Something went wrong")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                {isPublic ? <Globe className="w-3 h-3 text-sky-500" /> : <Lock className="w-3 h-3" />}
                {isPublic ? 'Public' : 'Private'}
            </div>
            <div className="flex items-center gap-2">
                 {isPublic && (
                     <ShareAnalysisDialog 
                        submissionId={submissionId} 
                        initialIsPublic={isPublic}
                        trigger={
                            <button className="text-[10px] uppercase font-bold text-primary hover:text-white border border-primary/30 px-2 py-0.5 rounded transition-colors mr-2">
                                Get Link
                            </button>
                        }
                     />
                 )}
                 <Switch 
                    checked={isPublic}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-sky-500 scale-90"
                 />
            </div>
        </div>
    </div>
  )
}
