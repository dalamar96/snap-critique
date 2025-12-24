import Link from 'next/link'
import { ArrowRight, Check, Camera, Cpu, Zap, Star, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'About Snap Critique - AI Photography Mentor',
  description: 'Understand how Snap Critique uses AI to improve your photography with instant, objective feedback.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary/30 selection:text-primary-foreground">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
        
        <div className="container px-4 mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest mb-6 border border-primary/20">
            <Sparkles className="w-3 h-3" />
            The Future of Photo Education
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6">
            Learn Faster.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Shoot Smarter.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Snap Critique is an AI-powered critique tool that breaks down your photo’s composition, light, and technical choices, then turns them into clear takeaways you can apply on your next shot.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
             <Link href="/login?view=signup" className="btn-primary py-4 px-8 text-lg font-bold">
                Get 5 Free Critiques
             </Link>
             <Link href="#anatomy" className="px-8 py-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-bold flex items-center gap-2 justify-center">
                How it Works <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        </div>
      </section>
      {/* Anatomy of a Critique Section */}
      <section id="anatomy" className="py-20 border-t border-white/5 bg-black/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight mb-4">The Anatomy of a Critique</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every analysis is a deep dive into your image. Our AI breaks down your photography into four key dimensions.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start max-w-7xl mx-auto">
             
             {/* The Mock Report (Left Side) */}
             <div className="lg:col-span-7 bg-black border border-white/10 p-4 md:p-8 rounded-xl shadow-2xl font-mono relative overflow-hidden order-2 lg:order-1">
                 
                 {/* Header Section */}
                 <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between border-b border-white/10 pb-8 mb-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-primary text-[10px] uppercase tracking-widest mb-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         Analysis Complete
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white uppercase mb-4 leading-tight">
                        Shadow & Silhouette:<br/>
                        High-Contrast Boudoir Study
                      </h3>
                      <p className="text-slate-400 leading-relaxed text-sm border-l-2 border-white/10 pl-4 max-w-xl">
                        A dramatic low-key study that utilizes high-contrast rim lighting to define the subject&apos;s athletic curves and silhouette.
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4 min-w-[120px]">
                        <div className="flex flex-col items-center border border-white/10 bg-white/5 p-4 w-full text-center">
                           <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Score</span>
                           <div className="text-5xl font-black text-primary">82</div>
                        </div>
                    </div>
                 </div>

                 {/* Image Placeholder */}
                 <div className="w-full h-64 md:h-[400px] border border-white/10 bg-slate-900 overflow-hidden relative mb-8 group">
                    <img 
                        src="/example.png" 
                        alt="Analysis Example" 
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute top-0 right-0 p-2 bg-black/50 backdrop-blur text-[10px] text-primary font-mono uppercase border-b border-l border-white/10">
                        Analyzed Image
                    </div>
                 </div>

                 {/* Grid: Strengths & Technical */}
                 <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Strengths */}
                    <div className="border border-green-900/50 bg-green-900/5 p-6 relative">
                       <h3 className="text-green-500 font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-sm border-b border-green-900/50 pb-2">
                         <Check className="w-4 h-4"/> Key Strengths
                       </h3>
                       <ul className="space-y-3">
                         {[
                            "Masterful use of negative space to create a slimming and mysterious silhouette",
                            "Excellent emphasis on musculoskeletal definition in the lower back",
                            "Effective rim lighting that successfully separates the subject"
                         ].map((s, i) => (
                           <li key={i} className="flex gap-3 text-slate-300 text-xs">
                             <span className="text-green-500 font-bold">&gt;</span>
                             {s}
                           </li>
                         ))}
                       </ul>
                    </div>

                    {/* Technical */}
                    <div className="border border-white/10 bg-black p-6 relative">
                       <h3 className="font-bold flex items-center gap-2 mb-4 uppercase tracking-wider text-slate-300 text-sm border-b border-white/10 pb-2">
                        <Star className="w-4 h-4 text-yellow-500"/> Technical Details
                       </h3>
                       <p className="text-slate-400 text-xs leading-relaxed">
                         Exposure is correctly prioritized for the highlights to prevent &apos;clipping&apos; while allowing the shadows to fall to pure black. The high level of grain/noise adds a filmic grit.
                       </p>
                    </div>
                 </div>

                 {/* Areas for Improvement */}
                 <div className="mb-8">
                    <h3 className="text-lg font-bold mb-6 uppercase tracking-widest text-white border-l-4 border-primary pl-4 flex items-center gap-2">
                        Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                        {/* Item 1 */}
                        <div className="bg-black border border-white/10 p-4 flex flex-col md:flex-row gap-4">
                            <div className="w-1 md:w-1 bg-orange-500 shrink-0 h-1 md:h-auto" />
                            <div>
                                 <h4 className="font-bold text-sm text-white uppercase mb-1">Manage Micro-Texture</h4>
                                 <p className="text-slate-400 text-xs">The high contrast and sharpening emphasize skin texture; consider using a larger softbox.</p>
                            </div>
                        </div>
                        {/* Item 3 */}
                        <div className="bg-black border border-white/10 p-4 flex flex-col md:flex-row gap-4">
                            <div className="w-1 md:w-1 bg-red-500 shrink-0 h-1 md:h-auto" />
                            <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-sm text-white uppercase">Shoulder and Neck Elongation</h4>
                                    <span className="text-[8px] bg-red-900/30 text-red-500 px-1.5 py-0.5 border border-red-900 font-bold uppercase tracking-wider">High Priority</span>
                                 </div>
                                 <p className="text-slate-400 text-xs">The front shoulder appears slightly hunched; roll the shoulders back and down.</p>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Action Plan */}
                 <div className="bg-primary/5 p-6 border border-primary/20">
                     <h3 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-white">
                        <ArrowRight className="w-5 h-5 text-primary"/> Action Plan
                     </h3>
                     <div className="grid gap-3">
                        <div className="flex items-start gap-4 p-4 border border-white/5 bg-black">
                            <div className="text-primary/40 font-bold text-xl font-mono">01</div>
                            <span className="font-medium pt-1 text-slate-300 text-sm">Practice 'feathering' a single light source.</span>
                        </div>
                        <div className="flex items-start gap-4 p-4 border border-white/5 bg-black">
                            <div className="text-primary/40 font-bold text-xl font-mono">02</div>
                            <span className="font-medium pt-1 text-slate-300 text-sm">Experiment with a subtle 'v-flat' or reflector.</span>
                        </div>
                     </div>
                 </div>
             </div>

             {/* The Explainer (Right Side) */}
             <div className="lg:col-span-5 space-y-12 lg:sticky lg:top-32 order-1 lg:order-2">
                
                {/* 1. Score & Summary */}
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Star className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white uppercase">Objective Scoring</h3>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        We don&apos;t just say &quot;nice shot.&quot; You get a concrete <span className="text-primary font-bold">Composition Score (0-100)</span> and a summarized breakdown of the artistic intent, helping you understand how your image lands at a glance.
                    </p>
                </div>

                {/* 2. Technical */}
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500">
                        <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white uppercase">Technical Deep Dive</h3>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        Our AI simulates a technical inspection, analyzing <strong>Exposure</strong>, <strong>Focus</strong>, <strong>Grain</strong>, and <strong>Lighting</strong>. We point out what techniques were used successfully and where the technical execution could be tightened.
                    </p>
                </div>

                {/* 3. Improvements */}
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white uppercase">Prioritized Feedback</h3>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        The core of Snap Critique. We identify specific areas that distract from your subject, ranked by priority. Whether it's a <span className="text-red-500 font-bold">High Priority</span> pose adjustment or a subtle lighting tweak, you'll know exactly what to fix.
                    </p>
                </div>

                {/* 4. Action Plan */}
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white uppercase">Your Homework</h3>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        Feedback is useless without action. We generate a tailored <strong>Action Plan</strong> with specific exercises or experiments you can try immediately to improve your next shot.
                    </p>
                </div>
             </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section className="py-20 container px-4 mx-auto">
         <div className="text-center mb-16">
            <div className="inline-block text-primary font-bold uppercase tracking-widest mb-4 border-b border-primary/20 pb-1">Simple Pricing</div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase">Start for Free. Scale as you Grow.</h2>
         </div>

         <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/20 transition-colors">
                <div className="mb-4">
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Welcome Package</span>
                    <div className="text-4xl font-black text-white mt-2">Free</div>
                </div>
                <p className="text-slate-400 mb-8 border-l-2 border-white/20 pl-4 h-12 flex items-center">
                    Perfect for trying out the power of AI critique.
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-primary" /> <strong>5 Full Critiques</strong> included
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-primary" /> Detailed Technical Analysis
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-primary" /> Composition Scoring
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-primary" /> No Credit Card Required
                    </li>
                </ul>
                <Link href="/login?view=signup" className="btn-secondary w-full py-4 text-center rounded-lg font-bold">
                    Create Free Account
                </Link>
            </div>

            {/* Paid Tier */}
            <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/50 rounded-2xl p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold uppercase px-3 py-1 rounded-bl-lg">
                    Top Up As Needed
                </div>
                <div className="mb-4">
                    <span className="text-sm font-bold uppercase tracking-widest text-primary">Pro Credits</span>
                    <div className="text-4xl font-black text-white mt-2">
                        as low as $0.60 <span className="text-lg font-medium text-slate-400 text-normal">/ critique</span>
                    </div>
                </div>
                <p className="text-slate-300 mb-8 border-l-2 border-primary pl-4 h-12 flex items-center">
                    Buy credits in bulk and save. Never expire.
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-white">
                        <Check className="w-5 h-5 text-primary" /> <strong>On-Demand</strong> Analysis
                    </li>
                    <li className="flex items-center gap-3 text-white">
                        <Check className="w-5 h-5 text-primary" /> Priority Processing
                    </li>
                    <li className="flex items-center gap-3 text-white">
                        <Check className="w-5 h-5 text-primary" /> Volume Discounts Available
                    </li>
                    <li className="flex items-center gap-3 text-white">
                        <Check className="w-5 h-5 text-primary" /> No Subscriptions
                    </li>
                </ul>
                <Link href="/pricing" className="btn-primary w-full py-4 text-center rounded-lg font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    View Packages
                </Link>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-white/10">
          <div className="container px-4 mx-auto text-center">
             <h2 className="text-3xl font-bold text-white mb-6">Ready to improve your photography?</h2>
             <Link href="/login?view=signup" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-lg font-mono uppercase tracking-widest border-b border-primary hover:border-white pb-1">
                Start your first analysis <ArrowRight className="w-5 h-5" />
             </Link>
          </div>
      </section>
    </div>
  )
}
