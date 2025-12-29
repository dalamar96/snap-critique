'use client'

import { useState, useEffect } from 'react'
import { getAllConversations, getConversation, replyToUser, markAdminRead, adminResolveConversation, adminDeleteConversation } from './actions'
import { ChatInterface } from '@/components/chat-interface'
import { X, Search, Mail, CheckCircle, Trash2, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationSummary {
    userId: string
    email: string
    unreadCount: number
    status: 'open' | 'resolved'
    lastMessage?: {
        content: string
        created_at: string
    }
}

export function SupportInbox({ onClose }: { onClose: () => void }) {
    const [conversations, setConversations] = useState<ConversationSummary[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [activeMessages, setActiveMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Poll for updates
    useEffect(() => {
        loadConversations()
        const interval = setInterval(loadConversations, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (selectedUserId) {
            loadMessages(selectedUserId)
            // Mark as read immediately
            markAdminRead(selectedUserId)
        }
    }, [selectedUserId])

    const loadConversations = async () => {
        const data = await getAllConversations()
        setConversations(data)
        setLoading(false)
    }

    const loadMessages = async (userId: string) => {
        const msgs = await getConversation(userId)
        setActiveMessages(msgs)
    }

    const handleSendMessage = async (content: string) => {
        if (!selectedUserId) return
        await replyToUser(selectedUserId, content)
        // Also ensure it's open
        await adminResolveConversation(selectedUserId, 'open')
        
        await loadMessages(selectedUserId) // Refresh instantly
        await loadConversations() // Update sidebar
    }

    const handleResolve = async (e: React.MouseEvent, status: 'open' | 'resolved') => {
        e.stopPropagation()
        if (!selectedUserId) return
        
        // Optimistic update
        setConversations(prev => prev.map(c => 
            c.userId === selectedUserId ? { ...c, status } : c
        ))

        await adminResolveConversation(selectedUserId, status)
        await loadConversations()
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!selectedUserId) return
        if (!confirm('Delete this conversation thread? This cannot be undone.')) return
        
        await adminDeleteConversation(selectedUserId)
        setSelectedUserId(null)
        await loadConversations()
    }

    const selectedConv = conversations.find(c => c.userId === selectedUserId)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-slate-950 border border-white/10 w-full max-w-6xl h-full md:h-[85vh] rounded-none md:rounded-xl flex overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className={cn(
                    "w-full md:w-1/3 border-r border-white/10 flex-col bg-slate-900",
                    selectedUserId ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" /> Inbox
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={loadConversations} className="text-slate-500 hover:text-white" title="Refresh">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white" title="Close">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading && <div className="p-4 text-slate-500 text-sm">Loading...</div>}
                        {!loading && conversations.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">No conversations found.</div>
                        )}
                        {conversations.map(conv => (
                            <div 
                                key={conv.userId}
                                onClick={() => setSelectedUserId(conv.userId)}
                                className={cn(
                                    "p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 relative",
                                    selectedUserId === conv.userId ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn("font-bold text-sm truncate pr-2 flex items-center gap-2", conv.unreadCount > 0 ? "text-white" : "text-slate-400")}>
                                        {conv.email}
                                        {conv.status === 'resolved' && (
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                        )}
                                    </span>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {conv.lastMessage?.content || 'No messages'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={cn(
                    "flex-1 flex-col bg-black relative",
                    selectedUserId ? "flex" : "hidden md:flex"
                )}>
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors hidden md:block"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {selectedUserId ? (
                        <div className="flex-1 flex flex-col h-full">
                            <div className="p-4 border-b border-white/10 bg-slate-900/50 flex justify-between items-center pr-4 md:pr-16 shrink-0">
                                <div className="flex items-center gap-2">
                                     {/* Mobile Back Button */}
                                     <button 
                                        onClick={() => setSelectedUserId(null)}
                                        className="md:hidden p-1 mr-2 text-slate-400 hover:text-white"
                                     >
                                        <ArrowLeft className="w-5 h-5" />
                                     </button>

                                    <div>
                                        <h3 className="text-white font-bold flex items-center gap-2 text-sm md:text-base">
                                            {selectedConv?.email}
                                            {selectedConv?.status === 'resolved' && (
                                                <span className="text-[10px] bg-green-900/30 text-green-500 px-2 py-0.5 rounded border border-green-900 uppercase">Resolved</span>
                                            )}
                                        </h3>
                                        <div className="text-[10px] md:text-xs text-slate-500 font-mono">ID: {selectedUserId.slice(0, 8)}...</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedConv?.status === 'resolved' ? (
                                        <button 
                                            onClick={(e) => handleResolve(e, 'open')}
                                            className="px-2 py-1 md:px-3 md:py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase"
                                        >
                                            Re-open
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => handleResolve(e, 'resolved')}
                                            className="px-2 py-1 md:px-3 md:py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-500 text-xs font-bold uppercase flex items-center gap-1"
                                        >
                                            <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">Resolve</span>
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={handleDelete}
                                        className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded transition-colors"
                                        title="Delete Conversation"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden p-0 md:p-4 bg-black">
                                <ChatInterface 
                                    initialMessages={activeMessages} 
                                    onSendMessage={handleSendMessage} 
                                    isAdminView={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4">
                            <Mail className="w-16 h-16 opacity-20" />
                            <p>Select a conversation to reply.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
