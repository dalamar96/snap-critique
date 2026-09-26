'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Camera, LogOut, User, LayoutDashboard, Database, LifeBuoy, BookOpen, Info, Compass, Users } from 'lucide-react'
import { signout } from '@/app/auth/actions'
import { MobileNav } from './mobile-nav'

// Client component on purpose: reading the session server-side here (cookies())
// made every route in the app dynamic, defeating static rendering and the
// `revalidate` settings on /gallery and /community. getSession() reads the
// local cookie with no network call; this is display-only, and every
// protected page/action still verifies the user server-side.
export function Header() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id } : null)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null)
      setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 pointer-events: none;">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white hover:text-primary transition-colors group">
            <div className="p-1.5 border border-white/20 rounded group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                <Camera className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono font-bold uppercase tracking-widest text-sm block">
                Snap<span className="text-primary">Critique</span>
            </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={`hidden md:flex items-center gap-6 transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`}>
            {!user && (
                <>
                     <Link href="/about" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider transition-colors">
                        <Info className="w-4 h-4" />
                        About
                    </Link>
                    <Link href="/pricing" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider transition-colors">
                        <Database className="w-4 h-4" />
                        Pricing
                    </Link>
                </>
            )}

            <Link href="/gallery" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider transition-colors">
                <Compass className="w-4 h-4" />
                Explore
            </Link>
             <Link href="/community" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider transition-colors">
                <Users className="w-4 h-4" />
                Community
            </Link>
            {user ? (
                <>
                    <Link href="/learning" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Learn</span>
                    </Link>
                    <Link href="/dashboard" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>

                    <Link href={`/profile/${user.id}`} className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Profile</span>
                    </Link>

                    <Link href="/support" className="text-sm font-mono text-slate-400 hover:text-[#FF7A00] flex items-center gap-2 uppercase tracking-wider" title="Support">
                        <LifeBuoy className="w-4 h-4" />
                        <span className="hidden sm:inline">Support</span>
                    </Link>
                    
                    {/* Sign Out Button (Form) */}
                    <form action={signout}>
                        <button className="text-sm font-mono text-red-500 hover:text-red-800 flex items-center gap-2 uppercase tracking-wider">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </form>
                </>
            ) : (
                <Link href="/login" className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Log In / Sign Up
                </Link>
            )}
        </nav>

        {/* Mobile Nav */}
        <MobileNav user={ready ? user : null} />
      </div>
    </header>
  )
}
