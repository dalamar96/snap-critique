'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '../actions'
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
} from '@/components/ui/alert-dialog'

export function DangerZone() {
    const [password, setPassword] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!password) {
            setError('Enter your password to confirm.')
            return
        }

        setIsDeleting(true)
        setError(null)

        const formData = new FormData()
        formData.set('password', password)

        try {
            const result = await deleteAccount(formData)
            if (result?.error) {
                setError(result.error)
                setIsDeleting(false)
                return
            }
            toast.success('Your account has been deleted.')
            router.push('/')
        } catch {
            setError('Something went wrong. Please try again.')
            setIsDeleting(false)
        }
    }

    return (
        <div className="mt-12 p-4 border border-red-500/30 bg-red-950/10 rounded">
            <Label className="font-bold text-red-500 uppercase">Danger Zone</Label>
            <p className="text-xs text-slate-500 mt-1 mb-4">
                Permanently delete your account, submissions, analyses, and comments. This cannot be undone.
            </p>

            <AlertDialog onOpenChange={(open) => { if (!open) { setPassword(''); setError(null) } }}>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-950 border border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            This permanently deletes your profile, submissions, analyses, and comments. Your
                            past purchase records are kept for accounting purposes but are disconnected from
                            your identity. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2 py-2">
                        <Label htmlFor="delete-account-password">Confirm your password</Label>
                        <Input
                            id="delete-account-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border border-white/20 text-white hover:bg-white/10">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
