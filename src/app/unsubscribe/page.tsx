import Link from 'next/link'
import { MailX, CheckCircle2, AlertTriangle } from 'lucide-react'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token'
import { confirmUnsubscribe } from './actions'

export const metadata = {
  title: 'Unsubscribe | Snap Critique',
  robots: { index: false, follow: false },
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>
}) {
  const { token, done, error } = await searchParams

  // The GET only shows a confirm button — it never unsubscribes on its own,
  // because email security scanners and link previews prefetch URLs and would
  // otherwise silently unsubscribe people who never clicked.
  const validToken = !done && !error && verifyUnsubscribeToken(token) ? token : null

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-white/20 p-8 text-center font-mono">
        {done ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white uppercase tracking-widest mb-2">You&apos;re unsubscribed</h1>
            <p className="text-slate-400 text-sm mb-6">
              We won&apos;t send you reminder or marketing emails any more. You&apos;ll still get essential
              account emails, like password resets.
            </p>
          </>
        ) : validToken ? (
          <>
            <MailX className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Unsubscribe</h1>
            <p className="text-slate-400 text-sm mb-6">
              Stop receiving reminder and marketing emails from Snap Critique?
            </p>
            <form action={confirmUnsubscribe}>
              <input type="hidden" name="token" value={validToken} />
              <button type="submit" className="btn-primary w-full py-3 text-sm">Yes, unsubscribe me</button>
            </form>
          </>
        ) : (
          <>
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Link not valid</h1>
            <p className="text-slate-400 text-sm mb-6">
              This unsubscribe link is invalid or incomplete. Please use the link from the most recent email,
              or contact support and we&apos;ll remove you.
            </p>
          </>
        )}
        <Link href="/" className="text-primary text-xs uppercase tracking-widest hover:underline">
          &gt;&gt; Back to Snap Critique
        </Link>
      </div>
    </div>
  )
}
