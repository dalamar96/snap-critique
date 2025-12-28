import { getMessages, sendMessage, markAsRead, getConversationStatus } from '@/app/actions/messaging'
import { ChatInterface } from '@/components/chat-interface'
import { SupportActions } from './support-actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function SupportPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/support')
    }

    // Mark admin messages as read when entering
    await markAsRead()
    const messages = await getMessages()
    const status = await getConversationStatus()

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-mono uppercase tracking-widest text-primary flex items-center gap-3">
                                Support Center
                                {status === 'resolved' && (
                                    <span className="text-[10px] bg-green-500/20 text-green-500 border border-green-500/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Resolved
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 text-sm">Direct line to the SnapCritique team.</p>
                        </div>
                    </div>
                    <SupportActions status={status} />
                </div>

                <div className="flex-1 min-h-[600px]">
                    <ChatInterface 
                        initialMessages={messages} 
                        onSendMessage={sendMessage} 
                        currentUserEmail={user.email}
                    />
                </div>
            </div>
        </main>
    )
}
