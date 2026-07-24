import Link from 'next/link'
import { ArrowRight, Check, Camera, Zap, Star, ShieldCheck, Sparkles, Grid, User, Users, MapPin, MessageSquare } from 'lucide-react'

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

          <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
             
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
                    
                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                        <div className="flex flex-col items-center border border-white/10 bg-white/5 p-4 w-full text-center">
                           <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Overall</span>
                           <div className="text-5xl font-black text-primary">82</div>
                        </div>
                         <div className="grid grid-cols-3 gap-2 w-full mt-2">
                             <div className="text-center group relative cursor-help">
                                 <div className="text-sm font-bold text-white">85</div>
                                 <div className="text-[8px] uppercase text-slate-500">Comp</div>
                                 {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-2 text-[10px] text-slate-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-center pointer-events-none">
                                    Framing, balance, & visual flow.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-white/20" />
                                </div>
                             </div>
                             <div className="text-center group relative cursor-help">
                                 <div className="text-sm font-bold text-white">78</div>
                                 <div className="text-[8px] uppercase text-slate-500">Tech</div>
                                 {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-2 text-[10px] text-slate-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-center pointer-events-none">
                                    Exposure, focus, & camera settings.
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-white/20" />
                                </div>
                             </div>
                             <div className="text-center group relative cursor-help">
                                 <div className="text-sm font-bold text-white">84</div>
                                 <div className="text-[8px] uppercase text-slate-500">Create</div>
                                 {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 w-32 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-2 text-[10px] text-slate-300 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-center pointer-events-none">
                                    Originality, story, & choices.
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-white/20" />
                                </div>
                             </div>
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
                       <p className="text-slate-400 text-xs leading-relaxed mb-4">
                         Exposure is correctly prioritized for the highlights to prevent &apos;clipping&apos; while allowing the shadows to fall to pure black. The high level of grain/noise adds a filmic grit.
                       </p>

                       <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-xs border-t border-white/10 pt-4">
                           {/* Example Data */}
                           <div className="col-span-2 flex justify-between text-slate-500 border-b border-white/5 pb-2">
                               <span>Camera</span>
                               <span className="text-white font-mono text-right">Sony A7IV</span>
                           </div>
                           <div className="col-span-2 flex justify-between text-slate-500 border-b border-white/5 pb-2">
                               <span>Lens</span>
                               <span className="text-white font-mono text-right">FE 55mm f/1.8 ZA</span>
                           </div>

                           <div className="flex justify-between text-slate-500">
                               <span>Focal Length</span>
                               <span className="text-white font-mono">55mm</span>
                           </div>
                           <div className="flex justify-between text-slate-500">
                               <span>Aperture</span>
                               <span className="text-white font-mono">f/2.8</span>
                           </div>
                           <div className="flex justify-between text-slate-500">
                               <span>Shutter</span>
                               <span className="text-white font-mono">1/200s</span>
                           </div>
                           <div className="flex justify-between text-slate-500">
                               <span>ISO</span>
                               <span className="text-white font-mono">400</span>
                           </div>
                           <div className="flex justify-between text-slate-500">
                               <span>Exp. Comp</span>
                               <span className="text-white font-mono">-0.7</span>
                           </div>
                           <div className="flex justify-between text-slate-500">
                               <span>Metering</span>
                               <span className="text-white font-mono">Spot</span>
                           </div>
                       </div>
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
                            <span className="font-medium pt-1 text-slate-300 text-sm">Practice &apos;feathering&apos; a single light source.</span>
                        </div>
                        <div className="flex items-start gap-4 p-4 border border-white/5 bg-black">
                            <div className="text-primary/40 font-bold text-xl font-mono">02</div>
                            <span className="font-medium pt-1 text-slate-300 text-sm">Experiment with a subtle &apos;v-flat&apos; or reflector.</span>
                        </div>
                     </div>
                 </div>
             </div>

             {/* The Explainer (Right Side) */}
             <div className="lg:col-span-5 order-1 lg:order-2">
                <div className="lg:sticky lg:top-32 space-y-12 h-fit lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto no-scrollbar">
                    {/* 1. Score & Summary */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shrink-0">
                                <Star className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white uppercase">Objective Scoring</h3>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-lg">
                            We don&apos;t just say &quot;nice shot.&quot; You get a concrete <span className="text-primary font-bold">Composition Score (0-100)</span> and a summarized breakdown of the artistic intent, helping you understand how your image lands at a glance.
                        </p>
                    </div>

                    {/* 2. Technical */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 shrink-0">
                                <Camera className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white uppercase">Technical Deep Dive</h3>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-lg">
                            Our AI simulates a technical inspection, analyzing <strong>Exposure</strong>, <strong>Focus</strong>, <strong>Grain</strong>, and <strong>Lighting</strong>. We point out what techniques were used successfully and where the technical execution could be tightened.
                        </p>
                    </div>

                    {/* 3. Improvements */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 shrink-0">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white uppercase">Prioritized Feedback</h3>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-lg">
                            The core of Snap Critique. We identify specific areas that distract from your subject, ranked by priority. Whether it&apos;s a <span className="text-red-500 font-bold">High Priority</span> pose adjustment or a subtle lighting tweak, you&apos;ll know exactly what to fix.
                        </p>
                    </div>

                    {/* 4. Action Plan */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 shrink-0">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white uppercase">Your Homework</h3>
                        </div>
                        
                        <p className="text-slate-400 leading-relaxed text-lg">
                            Feedback is useless without action. We generate a tailored <strong>Action Plan</strong> with specific exercises or experiments you can try immediately to improve your next shot.
                        </p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Collaborative Critique Section */}
      <section className="py-20 border-t border-white/5 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container px-4 mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                
                {/* Visuals */}
                <div className="flex-1 w-full relative">
                    {/* Mock Comment Thread */}
                    <div className="relative z-10 space-y-4 max-w-md mx-auto md:ml-auto">
                        {/* Pinned Comment Bubble */}
                        <div className="bg-slate-900 border border-white/10 p-4 rounded-xl shadow-2xl rounded-bl-none transform translate-x-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[10px] font-bold">JD</div>
                                    <span className="text-xs font-bold text-white">Jane Doe</span>
                                </div>
                                <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">Critique</span>
                            </div>
                            <p className="text-sm text-slate-300">The eye contact here is intense, but the hair light feels a bit too cool compared to the warmth of the face.</p>
                        </div>
                        
                         {/* Reply */}
                        <div className="bg-slate-800 border border-white/10 p-4 rounded-xl shadow-xl rounded-tr-none transform -translate-x-4 opacity-70">
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">ME</div>
                                    <span className="text-xs font-bold text-white">You</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">Good catch! I mixed daylight and tungsten. I&apos;ll gel it next time.</p>
                        </div>
                    </div>

                    {/* Pin Graphic */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                </div>

                {/* Text Content */}
                <div className="flex-1 w-full text-left">
                    <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest mb-4">
                        <Users className="w-4 h-4" /> 
                        Collaborative Feedback
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase mb-6 leading-tight">
                        Don&apos;t Critique Alone.
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                        AI provides the baseline, but the community provides the nuance. Invite friends, mentors, or the public to review your shots.
                    </p>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase mb-2">Pinpoint Precision</h3>
                                <p className="text-slate-400 text-sm">
                                    Stop explaining &quot;that blurry part in the top left.&quot; <strong className="text-white">Click anywhere on the image</strong> to drop a pin and leave a context-aware comment exactly where it matters.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                             <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase mb-2">Structured Discussions</h3>
                                <p className="text-slate-400 text-sm">
                                    Categorize comments as <span className="text-green-500">Praise</span>, <span className="text-orange-500">Critique</span>, or <span className="text-blue-500">Suggestion</span> to keep feedback constructive and organized.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </section>


      {/* Community Section */}
      <section className="py-20 border-t border-white/5 bg-slate-900/30">
        <div className="container px-4 mx-auto text-center mb-16">
             <div className="inline-block text-primary font-bold uppercase tracking-widest mb-4 border-b border-primary/20 pb-1">Community</div>
             <h2 className="text-3xl md:text-5xl font-black text-white uppercase">More Than Just AI.</h2>
        </div>

        <div className="container px-4 mx-auto grid md:grid-cols-3 gap-8">
             {/* Gallery */}
             <div className="bg-black border border-white/10 p-8 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                     <Grid className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase mb-4">Public Gallery</h3>
                 <p className="text-slate-400 text-sm leading-relaxed mb-6">
                     Choose which analyses to make public. Showcase your best shots and see how others are scoring.
                 </p>
                 <Link href="/gallery" className="text-purple-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Explore Gallery <ArrowRight className="w-4 h-4" />
                 </Link>
             </div>

             {/* Profiles */}
             <div className="bg-black border border-white/10 p-8 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                 <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                     <User className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase mb-4">Photographer Profiles</h3>
                 <p className="text-slate-400 text-sm leading-relaxed mb-6">
                     Build your portfolio. Share your bio, gear, and favorite shots with a dedicated public profile page.
                 </p>
                 <div className="text-blue-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    Build Your Brand
                 </div>
             </div>

             {/* Community */}
             <div className="bg-black border border-white/10 p-8 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                 <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-6 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                     <Users className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold text-white uppercase mb-4">Community Connect</h3>
                 <p className="text-slate-400 text-sm leading-relaxed mb-6">
                     Discover other photographers by camera brand or style. Find inspiration and connect with peers.
                 </p>
                 <Link href="/community" className="text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    Meet the Community <ArrowRight className="w-4 h-4" />
                 </Link>
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
                    Create Free Account
                </Link>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-white/10">
          <div className="container px-4 mx-auto text-center">
             <h2 className="text-3xl font-bold text-white mb-6">Ready to improve your photography?</h2>
             <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-lg font-mono uppercase tracking-widest border-b border-primary hover:border-white pb-1">
                Start your first analysis <ArrowRight className="w-5 h-5" />
             </Link>
          </div>
      </section>
    </div>
  )
}
