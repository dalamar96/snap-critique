import { UploadZone } from '@/components/upload-zone'
import { Aperture, Crosshair, Target, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let credits = null
  let isGuest = true

  if (user) {
      isGuest = false
      const adminDb = createAdminClient()
      const { data: profile } = await adminDb
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single()
      
      credits = profile?.credits_balance || 0
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-24 bg-background relative overflow-hidden">
      
      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Text */}
        <div className="lg:col-span-5 text-left space-y-6">
          <div className="inline-flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.2em] border border-primary/20 px-2 py-1 bg-primary/5">
            <span className="w-2 h-2 bg-primary rounded-full" />
            AI Analysis Ready
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white font-mono leading-none">
            SNAP<br/>
            <span className="text-primary">CRITIQUE</span>
          </h1>
          
          <p className="text-lg text-slate-400 font-mono border-l-2 border-primary/30 pl-4 py-1">
            Because “looks fine” isn’t a plan. Get professional-grade feedback instantly.
          </p>

          <p className="text-sm text-slate-500 font-mono">
             Upload your photo. Tell us your intent. We’ll handle the rest.
          </p>
        </div>

        {/* Right Column: Upload HUD */}
        <div className="lg:col-span-7 w-full relative">
          {/* Corner Markers (Subtler) */}
          <div className="absolute -top-4 -left-4 w-4 h-4 border-t border-l border-primary/50 z-20" />
          <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b border-r border-primary/50 z-20" />
          
          <div className="bg-card border border-white/10 p-1 relative shadow-2xl">
             <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
             <UploadZone 
                userCredits={credits} 
                isGuest={isGuest} 
             />
          </div>
        </div>

      </div>

      {/* Feature Grid */}
      <div className="mt-24 w-full max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <Crosshair className="w-6 h-6"/>, title: "Composition", desc: "Detailed breakdown of framing and balance." },
          { icon: <Aperture className="w-6 h-6"/>, title: "Technical", desc: "Analysis of exposure, color, and focus." },
          { icon: <Target className="w-6 h-6"/>, title: "Actionable", desc: "Specific steps to improve your shot." },
          { icon: <CheckCircle className="w-6 h-6"/>, title: "Progress", desc: "Track your improvement over time." },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-white/5 p-6 hover:border-primary/50 transition-colors group rounded-lg">
            <div className="text-primary mb-4 opacity-70 group-hover:opacity-100 transition-opacity">{item.icon}</div>
            <h3 className="font-mono text-lg font-bold text-white uppercase mb-2">{item.title}</h3>
            <p className="text-sm text-slate-400 font-mono">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
