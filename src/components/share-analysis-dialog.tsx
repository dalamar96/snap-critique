'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Check, Copy, Globe, Lock, Share2, Twitter, Facebook, Linkedin } from 'lucide-react'
import { togglePublicStatus } from '@/app/analysis/actions'
import { toast } from 'sonner' // Assuming sonner is used, typical for shadcn

interface ShareAnalysisDialogProps {
  submissionId: string
  initialIsPublic: boolean
  trigger?: React.ReactNode
}

export function ShareAnalysisDialog({ submissionId, initialIsPublic, trigger }: ShareAnalysisDialogProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/analysis/${submissionId}` : ''

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true)
    // Optimistic update
    setIsPublic(checked)
    
    try {
        const result = await togglePublicStatus(submissionId, checked)
        if (result.error) {
            // Revert on error
            setIsPublic(!checked)
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Link copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = "Check out my AI photography critique on SnapCritique!"
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
            <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" /> Share
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Verification
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Make your analysis public to share it with friends or on social media.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
            {/* Toggle Section */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-white">
                        {isPublic ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-slate-500" />}
                        {isPublic ? "Public Access" : "Private Access"}
                    </div>
                    <p className="text-xs text-slate-400">
                        {isPublic ? "Anyone with the link can view this. It will also appear in the 'Explore' gallery." : "Only you can view this analysis."}
                    </p>
                </div>
                <Switch 
                    checked={isPublic}
                    onCheckedChange={handleToggle}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-green-500"
                />
            </div>

            {/* Link Section */}
            {isPublic && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <div className="grid flex-1 gap-2">
                            <div className="relative">
                                <input 
                                    readOnly 
                                    value={shareUrl}
                                    className="w-full bg-black border border-white/10 rounded-md h-9 px-3 text-sm text-slate-300 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            size="sm" 
                            className="px-3" 
                            onClick={copyToClipboard}
                            disabled={copied}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="flex gap-2 justify-center pt-2">
                        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#1DA1F2] transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#4267B2] transition-colors">
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#0077b5] transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
