'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LayoutDashboard, User, LifeBuoy, LogOut, BookOpen, Info, Compass, Users, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signout } from '@/app/auth/actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface MobileNavProps {
    user: SupabaseUser | null
}

export function MobileNav({ user }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="md:hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-slate-400 hover:text-white"
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 top-16 bg-black/80 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu Content */}
            <div 
                className={cn(
                    "fixed top-16 right-0 w-full sm:w-80 h-[calc(100dvh-4rem)] bg-black border-l border-white/20 z-[60] transform transition-all duration-200 ease-in-out px-6 py-8 flex flex-col gap-6 shadow-2xl overflow-y-auto",
                    isOpen ? "translate-x-0 opacity-100 visible" : "translate-x-full opacity-0 invisible"
                )}
                style={{ backgroundColor: '#000000' }}
            >
                <nav className="flex flex-col gap-6">
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Menu</h4>
                        {!user && (
                            <>
                                <Link 
                                    href="/about" 
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                                >
                                    <Info className="w-5 h-5" /> About
                                </Link>
                                <Link 
                                    href="/pricing" 
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                                >
                                    <Database className="w-5 h-5" /> Pricing
                                </Link>
                            </>
                        )}
                        <Link 
                            href="/gallery" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                        >
                            <Compass className="w-5 h-5" /> Explore
                        </Link>
                        <Link 
                            href="/community" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                        >
                            <Users className="w-5 h-5" /> Community
                        </Link>
                    </div>

                    <div className="w-full h-px bg-white/10" />

                    {user ? (
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Account</h4>
                            <Link 
                                href="/learning" 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                            >
                                <BookOpen className="w-5 h-5" /> Learn
                            </Link>
                            <Link 
                                href="/dashboard" 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                            >
                                <LayoutDashboard className="w-5 h-5" /> Dashboard
                            </Link>

                            <Link 
                                href={`/profile/${user.id}`} 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                            >
                                <User className="w-5 h-5" /> Profile
                            </Link>

                            <Link 
                                href="/support" 
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 text-lg font-mono text-slate-300 hover:!text-[#FF7A00]"
                            >
                                <LifeBuoy className="w-5 h-5" /> Support
                            </Link>
                            
                            <form action={signout} className="pt-4">
                                <button className="flex items-center gap-3 text-lg font-mono text-red-500 hover:text-red-400 w-full">
                                    <LogOut className="w-5 h-5" /> Sign Out
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="pt-4">
                             <Link 
                                href="/login" 
                                onClick={() => setIsOpen(false)}
                                className="btn-primary w-full justify-center py-3 flex items-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                Log In / Sign Up
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </div>
    )
}
