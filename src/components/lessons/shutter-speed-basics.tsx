'use client'

import React from 'react'
import Image from 'next/image'
import { Timer, Zap, Camera, Activity, AlertTriangle, Play, Smartphone } from 'lucide-react'

export function ShutterSpeedBasics() {
  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20 font-sans text-slate-300">
      
      {/* Introduction */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Shutter Speed: Mastering Time</h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              Shutter speed decides whether time is <span className="text-white font-medium">frozen</span>, 
              <span className="text-white font-medium"> suggested</span>, or <span className="text-white font-medium">stretched</span>.
            </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-900/10 to-transparent border-l-4 border-blue-500 p-8 rounded-r-xl">
           <h3 className="text-white font-bold text-lg mb-2">What Is It?</h3>
           <p className="text-lg text-slate-300">
            Shutter speed is the length of time your camera’s shutter remains open. It controls two critical things at once:
           </p>
           <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span><strong>Exposure</strong> (how bright the image is)</span>
                </li>
                <li className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span><strong>Motion rendering</strong> (how movement appears)</span>
                </li>
           </ul>
        </div>
      </div>

      {/* Measurement */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold uppercase tracking-wider text-white flex items-center gap-3">
            <Timer className="w-8 h-8 text-blue-500" />
            How It&apos;s Measured
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
                <p>Shutter speed is measured in seconds or fractions of a second:</p>
                <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-blue-400">1/4000s</span>
                        <span className="text-slate-500">Extremely Fast</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-blue-400">1/1000s</span>
                        <span className="text-slate-500">Fast</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-blue-400">1/250s</span>
                        <span className="text-slate-500">Moderate</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-blue-400">1/60s</span>
                        <span className="text-slate-500">Slow</span>
                    </div>
                    <div className="flex justify-between pb-2">
                        <span className="text-blue-400">1s, 5s, 30s</span>
                        <span className="text-slate-500">Long Exposure</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <strong className="text-blue-400 block mb-2 uppercase tracking-widest text-xs">Teaching Point: Stops</strong>
                <p className="text-sm mb-4">Each full &quot;stop&quot; doubles or halves the amount of light.</p>
                <div className="flex gap-4 text-xs font-mono text-center">
                    <div className="bg-black/50 p-2 rounded flex-1">
                        <span className="block text-slate-500 mb-1">1/250</span>
                        <span className="text-white">Base</span>
                    </div>
                    <div className="flex items-center text-slate-500">→</div>
                    <div className="bg-black/50 p-2 rounded flex-1">
                        <span className="block text-slate-500 mb-1">1/125</span>
                        <span className="text-blue-400">2x Light</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* The Two Faces */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold uppercase tracking-wider text-white">The Two Faces of Shutter Speed</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
            {/* Exposure Face */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    1. Exposure
                </h3>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                        <span>Faster Shutter</span>
                        <span className="text-slate-500">Less Light (Darker)</span>
                    </div>
                     <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                        <span>Slower Shutter</span>
                        <span className="text-white">More Light (Brighter)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        *Must be balanced with Aperture and ISO.
                    </p>
                </div>
            </div>

             {/* Motion Face */}
             <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                    2. Motion
                </h3>
                <p className="mb-4 text-sm">This is where shutter speed becomes expressive. It determines if motion is:</p>
                <ul className="space-y-2 text-sm">
                    <li className="bg-black/20 px-3 py-2 rounded text-white border-l-2 border-blue-400">Frozen</li>
                    <li className="bg-black/20 px-3 py-2 rounded text-slate-300 border-l-2 border-blue-400/50">Slightly Blurred</li>
                    <li className="bg-black/20 px-3 py-2 rounded text-slate-500 border-l-2 border-blue-400/20">Fully Smeared</li>
                </ul>
            </div>
        </div>
      </section>

      {/* Motion Control Deep Dive */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold uppercase tracking-wider text-white mb-4">Motion Control</h2>
            <p className="text-lg text-slate-300">
                Shutter speed does not control how fast something is. <br/>
                <span className="text-white">It controls how much of that movement you record.</span>
            </p>
        </div>

        {/* Fast Shutter */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    Fast Shutter (Freezing)
                </h3>
                <p className="text-slate-400 text-sm mt-1">1/500s — 1/4000s</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                     <p className="text-sm">
                        Total clarity. Individual moments isolated. Energy feels paused in mid-air.
                     </p>
                     <div>
                        <strong className="text-xs uppercase tracking-widest text-slate-500">Best For:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Sports</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Wildlife</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Splashes</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Kids Running</span>
                        </div>
                     </div>
                     <div className="bg-yellow-500/10 p-4 rounded text-xs text-yellow-200 border border-yellow-500/20">
                        <strong>Teaching Insight:</strong> Freezing motion creates clarity but can remove the feeling of speed. A frozen race car can look parked.
                     </div>
                </div>
                 <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                    <Image 
                        src="/lesson_images/shutterspeed/stoptime_example.png"
                        alt="Fast shutter speed example freezing a water splash in mid-air"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>

        {/* Medium Shutter */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Activity className="w-6 h-6 text-green-500" />
                    Medium Shutter (Suggested)
                </h3>
                <p className="text-slate-400 text-sm mt-1">1/60s — 1/250s</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                     <p className="text-sm">
                        Subject mostly sharp, but motion appears as soft blur. The viewer senses movement without losing the subject.
                     </p>
                     <div>
                        <strong className="text-xs uppercase tracking-widest text-slate-500">Best For:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Street Photography</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Portraits</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Panning</span>
                        </div>
                     </div>
                     <div className="bg-green-500/10 p-4 rounded text-xs text-green-200 border border-green-500/20">
                        <strong>Teaching Insight:</strong> The sweet spot for storytelling. The image feels alive, not frozen or chaotic.
                     </div>
                </div>
                 <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                    <Image 
                        src="/lesson_images/shutterspeed/mediumsharp_example.png"
                        alt="Medium shutter speed example showing motion blur in the background while keeping the subject sharp"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>

        {/* Slow Shutter */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Play className="w-6 h-6 text-purple-500" />
                    Slow Shutter (Blur & Long Exposure)
                </h3>
                <p className="text-slate-400 text-sm mt-1">1/30s — 30s+</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                     <p className="text-sm">
                        Movement becomes streaks, trails, or mist. Time feels compressed. Static objects stay sharp (if stable).
                     </p>
                     <div>
                        <strong className="text-xs uppercase tracking-widest text-slate-500">Best For:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Waterfalls (Silky)</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Light Trails</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Night Sky</span>
                        </div>
                     </div>
                     <div className="bg-purple-500/10 p-4 rounded text-xs text-purple-200 border border-purple-500/20 flex gap-3 items-center">
                        <Camera className="w-4 h-4 shrink-0" />
                        <span><strong>Tripod Required.</strong> Do not attempt handheld.</span>
                     </div>
                </div>
                 <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                    <Image 
                        src="/lesson_images/shutterspeed/streaked_example.png"
                        alt="Slow shutter speed example showing light trails and motion blur"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* Camera Shake vs Subject Motion */}
      <section className="bg-slate-900/50 p-8 rounded-2xl border border-white/5">
        <h2 className="text-2xl font-bold text-white mb-6">Camera Shake vs. Subject Motion</h2>
        <div className="grid md:grid-cols-2 gap-8">
             <div>
                <strong className="text-blue-400 block mb-2">1. Subject Motion</strong>
                <p className="text-sm text-slate-400">The subject moves during the exposure. You control this creatively with shutter speed.</p>
             </div>
             <div>
                <strong className="text-red-400 block mb-2">2. Camera Shake</strong>
                <p className="text-sm text-slate-400">The <em>camera</em> moves during exposure. Usually accidental and unwanted blur across the whole image.</p>
             </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/5">
             <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 rounded-full">
                    <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                     <h3 className="text-white font-bold text-lg mb-1">The Handholding Rule</h3>
                     <p className="text-slate-300 text-sm mb-4">
                        Your minimum shutter speed should be <span className="font-mono text-blue-400">1 / focal length</span>.
                     </p>
                     <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                        <div className="bg-black/40 p-2 rounded border border-white/5">
                            <span className="block text-slate-500">50mm Lens</span>
                            <span className="text-white">1/50s+</span>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/5">
                            <span className="block text-slate-500">100mm Lens</span>
                            <span className="text-white">1/100s+</span>
                        </div>
                         <div className="bg-black/40 p-2 rounded border border-white/5">
                            <span className="block text-slate-500">200mm Lens</span>
                            <span className="text-white">1/200s+</span>
                        </div>
                     </div>
                </div>
             </div>
        </div>
      </section>

      {/* Creative Uses */}
      <section className="space-y-6">
         <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Creative Techniques</h2>
         <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
                <strong className="text-white block mb-2">Panning</strong>
                <p className="text-xs text-slate-400">Using a slow shutter (1/30s) to track a moving subject. Subject stays sharp, background streaks.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
                <strong className="text-white block mb-2">ICM</strong>
                <p className="text-xs text-slate-400">Intentional Camera Movement. Moving the camera during exposure for abstract, painterly effects.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
                <strong className="text-white block mb-2">Long Exposure Minimalism</strong>
                <p className="text-xs text-slate-400">Using very long exposures (30s+) to turn water and clouds into mist, removing clutter.</p>
            </div>
         </div>
      </section>

      {/* Conclusion */}
      <div className="border-t border-white/10 pt-10 text-center">
            <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Common Beginner Mistakes
            </h3>
            <div className="inline-grid text-left gap-4 text-sm text-slate-400">
                <div className="flex gap-3">
                    <span className="text-red-500">✕</span> Using shutter speeds too slow for handheld shots
                </div>
                <div className="flex gap-3">
                    <span className="text-red-500">✕</span> Freezing motion when blur would tell a better story
                </div>
                <div className="flex gap-3">
                    <span className="text-red-500">✕</span> Ignoring shutter speed because “Auto picked it”
                </div>
            </div>
      </div>

    </div>
  )
}
