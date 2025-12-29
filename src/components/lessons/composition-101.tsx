'use client'

import React from 'react'
import Image from 'next/image'
import { Grid, ArrowRight, MousePointer2, Maximize2, Minus, LayoutTemplate, Camera, Eye, Layers, Box } from 'lucide-react'

export function Composition101() {
  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20 font-sans">
      
      {/* Introduction */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Mastering Composition</h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              Composition is the language of photography. It’s not just <span className="text-white font-medium">what</span> you shoot,
              but <span className="text-white font-medium">how</span> you arrange the elements to control the viewer's eye.
            </p>
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-8 rounded-r-xl">
           <p className="text-xl text-slate-200 italic font-serif">
            "Strong composition feels intentional. Weak composition feels accidental.
            The difference is rarely gear and almost always how the scene is organized."
           </p>
        </div>
      </div>

      {/* 1. Rule of Thirds */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Grid className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">The Rule of Thirds</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Foundational Balance</div>
             </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-slate-300 leading-loose">
                <p>
                    The Rule of Thirds is likely the first rule you'll learn, and for good reason. It introduces balance without the static feel of perfect symmetry.
                </p>
                <p>
                    <strong>The Concept:</strong> Imagine dividing your frame into a <span className="text-white font-mono">3×3 grid</span>. 
                    Instead of placing your subject in the center, place them along these lines or at the 
                    <span className="text-white font-bold"> "power points"</span> (the intersections).
                </p>
                <div className="bg-white/5 p-4 rounded-lg text-sm border border-white/10">
                    <strong className="text-primary block mb-2 uppercase text-xs tracking-widest">Advanced Tip: Gaze Direction</strong>
                     If photographing a person or moving subject, place them on a third line so they are looking/moving 
                     <em> into</em> the negative space (the other 2/3rds), not out of the frame. This creates anticipation.
                </div>
            </div>
            <div className="space-y-4">
                <div className="bg-black">
                     <Image 
                        src="/lesson_images/composition_101/ruleofthirds_example.png"
                        alt="Rule of thirds example showing a woman posed on the power point and facing in towards the extra 2/3rds."
                        width={400}
                        height={600}
                        className="rounded-xl"
                     />
                </div>
            </div>
        </div>

        {/* Practice Card */}
        <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-3 bg-white/5 rounded-full shrink-0">
                <Camera className="w-6 h-6 text-purple-400" />
            </div>
            <div>
                <h3 className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-2">Practice Shot: The Horizon Limit</h3>
                <p className="text-slate-300 text-sm mb-4">
                    Take a landscape photo where the horizon is NOT in the center. Place it on the <strong>top horizontal line</strong> to emphasize the foreground, or the <strong>bottom horizontal line</strong> to emphasize a dramatic sky.
                </p>
                <div className="flex gap-2">
                    <span className="px-2 py-1 bg-black/50 rounded text-xs text-slate-400 border border-white/5">Landscape</span>
                    <span className="px-2 py-1 bg-black/50 rounded text-xs text-slate-400 border border-white/5">Travel</span>
                </div>
            </div>
        </div>
      </section>

      {/* 2. Leading Lines */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <ArrowRight className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Leading Lines</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Depth & Flow</div>
             </div>
        </div>
        
        <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg">
                Leading lines are visual highways that guide the viewer’s eye through the frame, typically ending at your main subject. They create a powerful sense of <strong>depth</strong> (3D feel on a 2D screen).
            </p>
            <div className="grid md:grid-cols-2 gap-8 my-8 not-prose">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h4 className="text-primary font-bold mb-2">Types of Lines</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                            <div className="space-y-3">
                                <div>
                                    <strong className="text-white">Converging Lines</strong>
                                    <p className="mt-1 leading-relaxed">
                                        Lines move toward a single vanishing point. Creates the strongest sense of depth and naturally pulls attention to whatever sits at or near the convergence.
                                    </p>
                                    <div className="mt-2 text-xs text-slate-400">
                                        <strong className="text-slate-500 uppercase tracking-wider text-[10px] mr-2">Examples:</strong>
                                        Railroad tracks, roads, hallways, fences, rows of trees
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="bg-red-500/5 p-3 rounded border border-red-500/10 text-xs text-slate-300">
                                         <strong className="text-red-400 block mb-1 uppercase tracking-widest text-[10px]">Common Mistake</strong>
                                         <p>Letting the lines converge into nothing. Always reward the viewer at the end of the journey.</p>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                            <div className="space-y-3">
                                <div>
                                    <strong className="text-white">Curved Lines (S-Curves)</strong>
                                    <p className="mt-1 leading-relaxed">
                                        Softer, more elegant movement. Keeps the eye in the frame longer. Feels organic and natural rather than mechanical.
                                    </p>
                                    <p className="mt-2 text-sm text-slate-300">
                                        <strong className="text-primary text-xs uppercase tracking-wider mr-1">Why it works:</strong>
                                        The eye follows curves more slowly than straight lines, increasing engagement.
                                    </p>
                                    <div className="mt-2 text-xs text-slate-400">
                                        <strong className="text-slate-500 uppercase tracking-wider text-[10px] mr-2">Examples:</strong>
                                        Rivers, winding roads, coastlines, fabric folds, bodies in portraiture
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="bg-purple-500/5 p-3 rounded border border-purple-500/10 text-xs text-slate-300">
                                         <strong className="text-purple-400 block mb-1 uppercase tracking-widest text-[10px]">Advanced Note</strong>
                                         <p>An S-curve can function as both a leading line and a framing device.</p>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                            <div className="space-y-3">
                                <div>
                                    <strong className="text-white">Diagonal Lines</strong>
                                    <p className="mt-1 leading-relaxed">
                                        Introduce energy and tension. Feel more dynamic than horizontal or vertical lines. Suggest motion, action, or instability.
                                    </p>
                                    <p className="mt-2 text-sm text-slate-300">
                                        <strong className="text-primary text-xs uppercase tracking-wider mr-1">Why diagonals feel powerful:</strong>
                                        They resist the natural stability of horizontal and vertical orientation, creating visual excitement.
                                    </p>
                                    <div className="mt-2 text-xs text-slate-400">
                                        <strong className="text-slate-500 uppercase tracking-wider text-[10px] mr-2">Examples:</strong>
                                        Staircases, shadows, beams of light, body angles
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="bg-black border border-white/10 rounded-xl overflow-hidden relative group">
                     <div className="h-full bg-transparent flex items-center justify-center">
                        <Image 
                        src="/lesson_images/composition_101/leadinglines_example.png"
                        alt="Leading lines example showing a guy walking away from the camera with all the lines converging at the vanishing point."
                        width={400}
                        height={600}
                        className="rounded-xl"
                     />
                     </div>
                </div>
            </div>
        </div>

        {/* Practice Card */}
        <div className="bg-gradient-to-br from-blue-900/10 to-teal-900/10 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-start">
            <div className="p-3 bg-white/5 rounded-full shrink-0">
                <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <div>
                <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2">Practice Shot: The Urban Canyon</h3>
                <p className="text-slate-300 text-sm mb-0">
                    Find a street, hallway, or bridge. Get <strong>low to the ground</strong> to emphasize the lines of the floor/road. Wait for a subject (person, car) to enter the "vanishing point" area before clicking.
                </p>
            </div>
        </div>
      </section>

      {/* 3. Golden Ratio */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <MousePointer2 className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">The Golden Ratio</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Organic Perfection</div>
             </div>
        </div>
        <p className="text-slate-300 leading-7 text-lg">
            Ideally used for nature and portraits, the Golden Ratio (Fibonacci Spiral) is a more complex cousin of the Rule of Thirds. 
            While thirds are rigid, the Golden Ratio draws the eye in a spiral motion towards the subject. It feels mathematically "correct" and deeply satisfying to the human eye.
        </p>
        <div className="grid grid-cols-2 gap-4">
             <div className="aspect-video bg-black border border-white/10 rounded-lg relative overflow-hidden">
                <Image 
                        src="/lesson_images/composition_101/goldenratio_example.png"
                        alt="Golden ratio example showing a spiral pattern over a portait at sunset."
                        width={600}
                        height={400}
                        className="rounded-xl"
                     />
                <div className="bottom-2 left-2 text-xs text-slate-500 font-mono">The Golden Ratio - Phi Spiral</div>
             </div>
             <div className="bg-white/5 p-6 rounded-lg flex flex-col justify-center">
                 <h4 className="font-bold text-white mb-2">When to use it?</h4>
                 <p className="text-sm text-slate-400">Use when you have curves in your scene (staircases, seashells, flowers) or when you want a portrait to feel more "classic" and less "edgy".</p>
             </div>
        </div>
      </section>

      {/* 4. Framing */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Maximize2 className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Framing (Sub-framing)</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Context & Voyeurism</div>
             </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
             <div className="flex-1 space-y-4">
                 <p className="text-slate-300 leading-7">
                    Using elements within your scene to "frame" your main subject creates a "picture within a picture". 
                    This adds context, hides distracting elements, and forces the viewer's eye onto the subject.
                </p>
                <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex gap-2 items-center"><Box className="w-4 h-4 text-primary" /> Archways or Door frames</li>
                    <li className="flex gap-2 items-center"><Box className="w-4 h-4 text-primary" /> Tree branches or foliage (foreground blur)</li>
                    <li className="flex gap-2 items-center"><Box className="w-4 h-4 text-primary" /> Car windows or mirrors</li>
                </ul>
             </div>
             <div className="flex-1 bg-gradient-to-br from-green-900/10 to-teal-900/10 border border-white/10 p-6 rounded-xl">
                <h3 className="text-green-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Practice Shot: Through the Keyhole
                </h3>
                <p className="text-slate-300 text-sm">
                    Find a generic subject (a building, a person). Now, step back and find something to shoot <em>through</em>. 
                    Use leaves, a fence hole, or a window. Focus on the subject, letting the frame blur out.
                </p>
             </div>
        </div>
      </section>

      {/* 5. Negative Space */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Minus className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Negative Space</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Less is More</div>
             </div>
        </div>
        <p className="text-slate-300 leading-7 text-lg">
            Negative space is the "empty" area around your subject. It defines the subject and breathes life into it. 
            Minimalist photography relies heavily on this. By making the subject small and the surroundings vast, you can convey 
            <strong> isolation, loneliness, freedom, or scale</strong>.
        </p>
      </section>

      {/* 6. Symmetry */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <LayoutTemplate className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Symmetry & Reflections</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Order & Power</div>
             </div>
        </div>
         <div className="grid md:grid-cols-2 gap-8 items-center">
            <p className="text-slate-300 leading-7">
                While the Rule of Thirds avoids the center, Symmetry embraces it. It is perfect for architecture, reflections in water, or powerful portraits.
                It conveys strength, authority, and divine order. 
            </p>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                 <Image 
                        src="/lesson_images/composition_101/mirror_example.png"
                        alt="Mirror image example showing a couple mirrored against each other and the mirror lake in front of them."
                        width={600}
                        height={400}
                        className="rounded-xl"
                     />
                 <span className="text-xs text-slate-500 uppercase tracking-widest">Mirror Image</span>
            </div>
         </div>
      </section>

       {/* 7. Viewpoint (NEW) */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Layers className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Viewpoint & Angle</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Change Perspectives</div>
             </div>
        </div>
         <p className="text-slate-300 leading-7">
             Most beginners shoot from eye level. <strong>Don't be a statue.</strong> Changing your height changes the power dynamic:
         </p>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-black border border-white/10 p-4 rounded-lg">
                <span className="text-primary font-bold block mb-1">Worm's Eye (Low)</span>
                <p className="text-xs text-slate-400">Makes the subject look giant, powerful, and heroic. Great for sports or architecture.</p>
            </div>
            <div className="bg-black border border-white/10 p-4 rounded-lg">
                <span className="text-primary font-bold block mb-1">Bird's Eye (High)</span>
                <p className="text-xs text-slate-400">Makes the subject look small, vulnerable, or part of a pattern. good for food or flat-lays.</p>
            </div>
            <div className="bg-black border border-white/10 p-4 rounded-lg">
                <span className="text-primary font-bold block mb-1">Dutch Angle (Tilt)</span>
                <p className="text-xs text-slate-400">Tilting the camera creates unease, chaos, or speed. Use sparingly.</p>
            </div>
         </div>
         
         {/* Practice Card */}
        <div className="bg-gradient-to-br from-orange-900/10 to-red-900/10 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-start mt-4">
            <div className="p-3 bg-white/5 rounded-full shrink-0">
                <Camera className="w-6 h-6 text-orange-400" />
            </div>
            <div>
                <h3 className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-2">Practice Shot: The 3 Angles</h3>
                <p className="text-slate-300 text-sm mb-0">
                    Pick a boring object (fire hydrant, chair). Photograph it from: 
                    1. The ground looking up. 
                    2. Directly above looking down. 
                    3. Through something else.
                    Notice how the "feeling" of the object changes.
                </p>
            </div>
         </div>
      </section>

      {/* Conclusion */}
      <div className="border-t border-white/10 pt-16 mt-16 text-center">
          <h2 className="text-4xl font-black uppercase text-white mb-6">Breaking the Rules</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            These aren't laws; they are tools. Learn them so you can use them subconsciously, but don't let them stifle your creativity.
            Sometimes, the most powerful shot is the one that breaks every rule.
          </p>
          <div className="inline-block bg-white/5 px-8 py-4 rounded-full border border-white/20">
              <span className="text-sm font-mono text-primary uppercase tracking-widest mr-2">Final Thought:</span>
              <span className="text-white font-bold">"If the image communicates emotion, the composition is successful."</span>
          </div>
      </div>

    </div>
  )
}
