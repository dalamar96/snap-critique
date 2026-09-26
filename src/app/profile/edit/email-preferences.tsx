'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { setMarketingEmails } from '../actions'

/**
 * Saves immediately on toggle (independent of the profile form's Save button),
 * since an opt-out should take effect right away, not depend on the user
 * remembering to submit a form. Optimistic, with rollback on failure.
 */
export function EmailPreferences({ initialEnabled }: { initialEnabled: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [saving, setSaving] = useState(false)

    const handleChange = async (next: boolean) => {
        const previous = enabled
        setEnabled(next)
        setSaving(true)

        const result = await setMarketingEmails(next)
        setSaving(false)

        if (result.error) {
            setEnabled(previous)
            toast.error('Could not update your email preferences')
            return
        }
        toast.success(next ? 'You will receive reminder emails' : 'You are unsubscribed from reminder emails')
    }

    return (
        <div className="mt-8 flex items-center justify-between gap-4 p-4 border border-white/10 bg-white/5 rounded">
            <div>
                <Label htmlFor="marketing-emails" className="font-bold text-white uppercase">Reminder Emails</Label>
                <p className="text-xs text-slate-500">
                    Occasional emails about critiques waiting for you. Essential account emails, like password
                    resets, are always sent.
                </p>
            </div>
            <Switch
                id="marketing-emails"
                checked={enabled}
                disabled={saving}
                onCheckedChange={handleChange}
                className="data-[state=checked]:bg-green-500"
            />
        </div>
    )
}
