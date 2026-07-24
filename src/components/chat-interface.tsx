'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User as UserIcon, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    content: string
    is_from_admin: boolean
    created_at: string
}

interface ChatInterfaceProps {
    initialMessages: Message[]
    onSendMessage: (content: string) => Promise<void>
    isAdminView?: boolean
}

export function ChatInterface({ initialMessages, onSendMessage, isAdminView = false }: ChatInterfaceProps) {
    const [input, setInput] = useState('')
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [messages, setMessages] = useState(initialMessages)

    useEffect(() => {
        setMessages(initialMessages)
    }, [initialMessages])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isSending) return
        
        setIsSending(true)
        const tempMsg = {
            id: 'temp-' + Date.now(),
            content: input,
            is_from_admin: isAdminView,
            created_at: new Date().toISOString()
        }

        // Optimistic UI updates could happen here, but for simplicity we wait for parent reload or manual set
        // Adding visually for instant feedback
        setMessages(prev => [...prev, tempMsg])
        
        await onSendMessage(input)
        setInput('')
        setIsSending(false)
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
           
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
                         <div className="p-4 bg-white/5 rounded-full"><UserIcon className="w-8 h-8"/></div>
                         <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                
                {messages.map((msg) => {
                    const isMe = isAdminView ? msg.is_from_admin : !msg.is_from_admin
                    return (
                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm relative group",
                                isMe ? "bg-primary text-black rounded-tr-none" : "bg-white/10 text-white rounded-tl-none"
                            )}>
                                {!isMe && (
                                    <div className="text-[10px] text-white/50 mb-1 flex items-center gap-1 uppercase tracking-wide font-bold">
                                         {isAdminView ? 'User' : 'Support Team'}
                                         {isAdminView ? null : <ShieldCheck className="w-3 h-3 text-primary" />}
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={cn("text-[10px] mt-1 opacity-50", isMe ? "text-black" : "text-white")}>
                                     {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="bg-primary text-black p-3 rounded-full hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
