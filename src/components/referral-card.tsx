'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Gift, Copy, Check } from 'lucide-react'

interface ReferralCardProps {
  referralLink: string
  rewardPercent: number
  holdDays: number
  windowMonths: number | null
  signups: number
  creditsPending: number
  creditsEarned: number
}

export function ReferralCard({ referralLink, rewardPercent, holdDays, windowMonths, signups, creditsPending, creditsEarned }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Referral link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="bg-black border border-primary/30 rounded-lg p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-primary text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Refer a Friend
          </div>
          <p className="text-slate-400 text-xs">
            Earn <span className="text-white font-bold">{rewardPercent}% back in free credits</span> on every credit pack your referrals buy{windowMonths ? ` in their first ${windowMonths} months` : ''}. Rewards unlock {holdDays} days after each purchase.
          </p>
        </div>
        <div className="flex gap-6 text-xs uppercase tracking-wide shrink-0">
          <div>
            <div className="text-slate-500 text-[10px]">Signups</div>
            <div className="text-white font-bold text-lg">{signups}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px]">Pending</div>
            <div className="text-slate-300 font-bold text-lg">{creditsPending}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px]">Credits Earned</div>
            <div className="text-primary font-bold text-lg">{creditsEarned}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 min-w-0">
        <input
          readOnly
          value={referralLink}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 px-3 py-2 text-xs text-white font-mono outline-none focus:border-primary"
        />
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-primary hover:text-black border border-primary/30 px-3 py-2 hover:bg-primary hover:border-primary transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
