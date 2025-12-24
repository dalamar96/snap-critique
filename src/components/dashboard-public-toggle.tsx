'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { togglePublicStatus, deleteSubmission } from '@/app/analysis/actions'
import { toast } from 'sonner'
import { Globe, Lock, Trash2, Loader2 } from 'lucide-react'
import { ShareAnalysisDialog } from '@/components/share-analysis-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DashboardPublicToggleProps {
  submissionId: string
  initialIsPublic: boolean
}

export function DashboardPublicToggle({ submissionId, initialIsPublic }: DashboardPublicToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false) // Local state to hide item

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

  const handleDelete = async () => {
      setIsDeleting(true)
      try {
          const result = await deleteSubmission(submissionId)
          if (result.error) {
              toast.error(result.error)
              setIsDeleting(false)
          } else {
              toast.success("Analysis deleted")
              setIsDeleted(true) // Hide the item
          }
      } catch (e) {
          toast.error("Failed to delete")
          setIsDeleting(false)
      }
  }

  if (isDeleted) return null

  return (
    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {/* Delete Action */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-slate-600 hover:text-red-500 transition-colors" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-950 border border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will delete the analysis. It will no longer be visible to anyone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="w-px h-8 bg-white/10" />

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
