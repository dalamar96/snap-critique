'use client'

import React from 'react'
import Image from 'next/image'
import { Aperture, Sun, Eye, Layers, ZoomIn, Ruler, BookOpen, AlertTriangle, Camera } from 'lucide-react'

export function UnderstandingAperture() {
  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20 font-sans text-slate-300">

      {/* Introduction */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Aperture: Shaping Light & Depth</h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              If shutter speed controls time, <span className="text-white font-medium">aperture controls space</span>. 
              It decides what the viewer is allowed to notice.
            </p>
        </div>
        
        <div className="bg-gradient-to-r from-orange-900/10 to-transparent border-l-4 border-orange-500 p-8 rounded-r-xl">
           <h3 className="text-white font-bold text-lg mb-2">What Is It?</h3>
           <p className="text-lg text-slate-300">
            Aperture is the opening inside the lens that controls how much light enters the camera. It’s an adjustable diaphragm, similar to the iris of the human eye.
           </p>
           <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-black/20 p-3 rounded border border-white/5 text-sm">
                    <strong className="text-orange-400 block mb-1">Bright Conditions</strong>
                    <span className="text-slate-400">Aperture closes down (Smaller hole)</span>
                </div>
                 <div className="bg-black/20 p-3 rounded border border-white/5 text-sm">
                    <strong className="text-orange-400 block mb-1">Dark Conditions</strong>
                    <span className="text-slate-400">Aperture opens up (Larger hole)</span>
                </div>
           </div>
        </div>
      </div>

      {/* Understanding F-Stops */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold uppercase tracking-wider text-white flex items-center gap-3">
            <Aperture className="w-8 h-8 text-orange-500" />
            Understanding F-Stops
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                <p>Aperture is measured in f-stops. The most important (and confusing) thing to remember:</p>
                
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-4xl font-bold text-white">f/1.8</span>
                            <span className="text-xs text-orange-400 uppercase tracking-widest mt-1">Small Number</span>
                         </div>
                         <div className="h-0.5 flex-1 mx-4 bg-gradient-to-r from-orange-500/50 to-slate-700/50" />
                         <div className="text-right">
                             <span className="text-white font-bold block">Wide Opening</span>
                             <span className="text-xs text-slate-500">More Light</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-4xl font-bold text-white">f/16</span>
                            <span className="text-xs text-orange-400 uppercase tracking-widest mt-1">Large Number</span>
                         </div>
                         <div className="h-0.5 flex-1 mx-4 bg-gradient-to-r from-slate-700/50 to-orange-500/50" />
                         <div className="text-right">
                             <span className="text-white font-bold block">Tiny Opening</span>
                             <span className="text-xs text-slate-500">Less Light</span>
                         </div>
                    </div>
                </div>
                
                <div className="text-sm text-slate-400 bg-black/20 p-4 rounded border-l-2 border-orange-500">
                    <strong>Why?</strong> Because the f-number is a ratio. Think of it like a fraction: 1/2 is bigger than 1/16.
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 p-6 rounded-xl border border-orange-500/20">
                <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                    <Sun className="w-5 h-5" /> Aperture & Light
                </h3>
                <p className="text-sm mb-4">Each full stop doubles or halves the light.</p>
                <div className="space-y-3 font-mono text-sm">
                    <div className="flex items-center justify-between bg-black/40 p-2 rounded">
                        <span className="text-white">f/2.8 → f/4</span>
                        <span className="text-red-400">Half Light (Darker)</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 p-2 rounded">
                        <span className="text-white">f/4 → f/2.8</span>
                        <span className="text-green-400">Double Light (Brighter)</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Creative: Depth of Field */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold uppercase tracking-wider text-white mb-4">Aperture & Depth of Field</h2>
            <p className="text-lg text-slate-300">
                This is where aperture becomes expressive. It controls how much of the world is sharp and how much melts away.
            </p>
        </div>

        {/* Wide Aperture */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Eye className="w-6 h-6 text-purple-500" />
                    Wide Aperture (Shallow Depth)
                </h3>
                <p className="text-slate-400 text-sm mt-1">f/1.4 — f/2.8</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                     <p className="text-sm">
                        Subject sharp, background softly blurred. The viewer's attention is tightly controlled. 
                        Communicates <strong>intimacy, isolation, and emotion</strong>.
                     </p>
                     <div>
                        <strong className="text-xs uppercase tracking-widest text-slate-500">Best For:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Portraits</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Boudoir</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Details</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Low Light</span>
                        </div>
                     </div>
                     <div className="bg-purple-500/10 p-4 rounded text-xs text-purple-200 border border-purple-500/20">
                        <strong>Teaching Note:</strong> Wide apertures remove information. This is a design choice.
                     </div>
                </div>
                 <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                    <Image 
                        src="/lesson_images/aperture/shallow_aperture_example.png"
                        alt="Wide aperture example showing shallow depth of field with a blurry background"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>

        {/* Medium Aperture */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Layers className="w-6 h-6 text-green-500" />
                    Medium Aperture (Balanced)
                </h3>
                <p className="text-slate-400 text-sm mt-1">f/4 — f/8</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <p className="text-sm">
                        Subject clear, background still readable. The most forgiving range. Communicates <strong>context, presence, and realism</strong>.
                     </p>
                     <div>
                        <strong className="text-xs uppercase tracking-widest text-slate-500">Best For:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Street</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Environmental Portraits</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Documentary</span>
                        </div>
                     </div>
                     <div className="bg-green-500/10 p-4 rounded text-xs text-green-200 border border-green-500/20">
                        <strong>Insight:</strong> This is where many professionals live when storytelling matters.
                     </div>
                </div>
                 <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                    <Image 
                        src="/lesson_images/aperture/medium_aperture_example.png"
                        alt="Medium aperture example showing balanced depth of field"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>

        {/* Narrow Aperture */}
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ZoomIn className="w-6 h-6 text-blue-500" />
                    Narrow Aperture (Deep Depth)
                </h3>
                <p className="text-slate-400 text-sm mt-1">f/11 — f/16+</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                     <p className="text-sm">
                        Everything sharp from foreground to background. Minimal blur. Communicates <strong>scale, structure, and completeness</strong>.
                     </p>
                     <div>
                        <strong className="text-xs uppercase tracking-widest text-slate-500">Best For:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Landscapes</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Architecture</span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">Group Photos</span>
                        </div>
                     </div>
                     <div className="bg-blue-500/10 p-4 rounded text-xs text-blue-200 border border-blue-500/20">
                        <strong>Teaching Note:</strong> Deep focus invites exploration. The eye is free to wander.
                     </div>
                </div>
                 <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                    <Image 
                        src="/lesson_images/aperture/narrow_aperture_example.png"
                        alt="Narrow aperture example showing deep depth of field with everything in focus"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* Advanced Concepts */}
      <section className="bg-slate-900/50 p-8 rounded-2xl border border-white/5 space-y-8">
         <h2 className="text-2xl font-bold text-white mb-6">Advanced Concepts</h2>
         
         <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <strong className="text-orange-400 block">1. Bokeh</strong>
                <p className="text-sm text-slate-400">
                    The quality of the out-of-focus blur. It's affected by lens design and aperture shape. Remember: More blur ≠ better blur. Smoothness is key.
                </p>
            </div>
             <div className="space-y-2">
                <strong className="text-orange-400 block">2. Focal Length</strong>
                <p className="text-sm text-slate-400">
                    Telephoto lenses exaggerate background blur. Wide lenses show more in focus. An 85mm f/2 looks very different from a 24mm f/2.
                </p>
            </div>
             <div className="space-y-2">
                <strong className="text-orange-400 block">3. Distance</strong>
                <p className="text-sm text-slate-400">
                   The closer you get to your subject, the shallower the depth of field becomes. This is why macro photos have razor-thin focus.
                </p>
            </div>
         </div>
      </section>

      {/* Exercises & Mental Models */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Classroom Exercises</h2>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-orange-400" /> Exercise 1: DoF Study
                </h3>
                <p className="text-sm text-slate-300 mb-4">Photograph the same subject at <strong>f/2.8, f/5.6, and f/11</strong> keeping framing identical.</p>
                <div className="text-xs text-slate-400 bg-black/20 p-3 rounded">
                    <strong>Compare:</strong> Background detail, subject separation, and emotional impact.
                </div>
            </div>
             <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orange-400" /> Mental Models
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex gap-2">
                        <span className="text-orange-400">Wide:</span> Choose the subject
                    </li>
                    <li className="flex gap-2">
                        <span className="text-orange-400">Medium:</span> Balance the scene
                    </li>
                    <li className="flex gap-2">
                        <span className="text-orange-400">Narrow:</span> Invite exploration
                    </li>
                </ul>
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
                    <span className="text-red-500">✕</span> Shooting everything wide open “for bokeh”
                </div>
                <div className="flex gap-3">
                    <span className="text-red-500">✕</span> Missing focus at f/1.8 (razor thin margin of error)
                </div>
                <div className="flex gap-3">
                    <span className="text-red-500">✕</span> Assuming blur equals professionalism. Blur is just a tool.
                </div>
            </div>
      </div>

    </div>
  )
}
