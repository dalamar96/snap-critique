import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Camera, LogOut, User, LayoutDashboard, Database } from 'lucide-react'
import { signout } from '@/app/auth/actions'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white hover:text-primary transition-colors group">
            <div className="p-1.5 border border-white/20 rounded group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                <Camera className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono font-bold uppercase tracking-widest text-sm hidden md:block">
                Snap<span className="text-primary">Critique</span>
            </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
            <Link href="/about" className="text-sm font-mono text-slate-400 hover:text-white uppercase tracking-wider transition-colors">
                About
            </Link>
             <Link href="/gallery" className="text-sm font-mono text-slate-400 hover:text-white uppercase tracking-wider transition-colors">
                Explore
            </Link>
            {user ? (
                <>
                    <Link href="/dashboard" className="text-sm font-mono text-slate-400 hover:text-white flex items-center gap-2 uppercase tracking-wider">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    
                    {/* Sign Out Button (Form) */}
                    <form action={signout}>
                        <button className="text-sm font-mono text-red-500 hover:text-red-400 flex items-center gap-2 uppercase tracking-wider">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
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
      </div>
    </header>
  )
}
