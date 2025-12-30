'use client'

import React from 'react'
import Image from 'next/image'
import { Camera, Sun, Mountain, Users, Calendar, Box, Lightbulb, Building2, User } from 'lucide-react'

export function TypesOfPhotographyShoots() {
  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20 font-sans">
      
      {/* Introduction */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Understanding Different Types of Photography Shoots</h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              How Context, Constraints, and Intent Shape Every Technical Decision
            </p>
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-8 rounded-r-xl">
           <p className="text-xl text-slate-200 italic font-serif">
            "A common beginner mistake is assuming that good photography is universal technique applied everywhere. In reality, strong photography is adaptive decision-making."
           </p>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg">
                Photography does not exist in a vacuum. Every shoot type brings with it a distinct set of environmental conditions, creative expectations, technical constraints, and ethical considerations. While the camera remains the same, the way it must be used changes dramatically depending on whether you are working in a studio, on the street, in a landscape, or within an event. Understanding these differences is critical to moving beyond technical competence and into professional fluency.
            </p>
        </div>
      </div>

      {/* Studio Photography */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Lightbulb className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Studio Photography</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Control as the Primary Variable</div>
             </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 text-slate-300 leading-loose">
                <p>
                    Studio photography represents the highest level of environmental control a photographer can achieve. Light, background, subject position, camera angle, and timing are all deliberate choices. Nothing happens unless the photographer allows it to happen. Because of this, studio work places a heavy emphasis on intentionality and precision.
                </p>
                <div className="space-y-4">
                    <h4 className="text-white font-bold">Key Technical Considerations:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong className="text-primary">Lighting:</strong> The dominant factor. Unlike natural light, artificial light is predictable and repeatable. Shadows are placed deliberately, highlights are shaped rather than discovered.</li>
                        <li><strong className="text-primary">Depth of Field:</strong> Often more conservative (narrow apertures) to ensure consistent sharpness, especially in commercial or product work.</li>
                        <li><strong className="text-primary">Shutter Speed:</strong> Typically locked near the flash sync speed, making it largely irrelevant to exposure.</li>
                        <li><strong className="text-primary">ISO:</strong> Kept as low as possible for maximum image quality.</li>
                    </ul>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" /> Studio Failure Modes
                    </h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Over-lighting</strong>
                            Adding lights without purpose, flattening the subject and removing dimension.
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Inconsistent Focus</strong>
                            Relying on wide apertures instead of lighting design to create separation.
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Background Neglect</strong>
                            Ignoring texture and edge contamination, resulting in halos or muddy gradients.
                        </div>
                    </div>
                </div>

                <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl">
                    <h3 className="text-green-500 font-bold mb-4 uppercase text-xs tracking-widest">Studio Checklist</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Confirm lighting ratios are intentional.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Meter/test for highlight clipping (especially on skin).</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Lock camera settings once exposure is correct.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Direct your subject continuously; silence = stiffness.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Street Photography */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Building2 className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Street Photography</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Responsiveness Over Control</div>
             </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-start">
             <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" /> Street Failure Modes
                    </h3>
                     <div className="space-y-4 text-sm text-slate-300">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Hesitation</strong>
                            Moments are missed because the photographer waits for perfection instead of committing.
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Visual Overload</strong>
                            Everything is visible, but nothing is emphasized. No clear subject.
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Ethical Missteps</strong>
                            Prioritizing images over human dignity or context.
                        </div>
                    </div>
                </div>

                <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl">
                    <h3 className="text-green-500 font-bold mb-4 uppercase text-xs tracking-widest">Street Checklist</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Set exposure BEFORE the moment happens.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Aperture: Balance clarity with context.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Shutter: Fast enough for unpredictable movement.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Position yourself first, then wait for the scene.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="space-y-6 text-slate-300 leading-loose">
                <p>
                    Street photography exists at the opposite end of the control spectrum. The photographer has no authority over the environment. Success depends on anticipation, timing, and situational awareness.
                </p>
                <div className="space-y-4">
                    <h4 className="text-white font-bold">Key Technical Considerations:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong className="text-primary">Light:</strong> Opportunistic. Harsh sun and deep shadows are realities to be worked with. Technical flexibility (Auto ISO, moderate apertures) is essential.</li>
                        <li><strong className="text-primary">Depth of Field:</strong> Chosen to balance subject clarity with environmental context. Too shallow = no sense of place. Too deep = visual noise.</li>
                        <li><strong className="text-primary">Imperfection:</strong> Motion blur, imperfect framing, and visual clutter are acceptable if they contribute to the story.</li>
                        <li><strong className="text-primary">Ethics:</strong> Constantly evaluating the line between observation and intrusion.</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Landscape Photography */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Mountain className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Landscape Photography</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Time, Scale, and Patience</div>
             </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 text-slate-300 leading-loose">
                <p>
                    Landscape photography is defined less by subjects and more by conditions. It demands long-term planning and a willingness to wait. Light, weather, and atmosphere are the core materials.
                </p>
                 <div className="space-y-4">
                    <h4 className="text-white font-bold">Key Technical Considerations:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li><strong className="text-primary">Depth:</strong> Foreground, midground, and background are arranged to guide the viewer. Narrower apertures (f/8-f/16) are common.</li>
                        <li><strong className="text-primary">Shutter Speed:</strong> Secondary to aperture. Often extends into multi-second exposures (requiring a tripod).</li>
                        <li><strong className="text-primary">Dynamic Range:</strong> Frequent battles with sunrise/sunset contrast. Exposure blending or filters become creative choices.</li>
                        <li><strong className="text-primary">Logistics:</strong> Success depends on research, scouting, and weather forecasting.</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                         <Camera className="w-5 h-5 text-primary" /> Landscape Failure Modes
                    </h3>
                     <div className="space-y-4 text-sm text-slate-300">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">No Foreground</strong>
                            Images feel distant and unanchored without a near element to lead the eye.
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Weak Composition</strong>
                            Relying entirely on dramatic light instead of strong structure.
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                            <strong className="text-red-400 block mb-1">Over-processing</strong>
                            Excessive contrast and saturation stripping the scene of realism.
                        </div>
                    </div>
                </div>

                 <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl">
                    <h3 className="text-green-500 font-bold mb-4 uppercase text-xs tracking-widest">Landscape Checklist</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Scout locations in advance.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Arrive early, stay late (don't leave too soon).</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Use a tripod for stability and flexibility.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Check frame edges for distractions.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Environmental Portraiture */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <User className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Environmental Portraiture</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Balancing Person and Place</div>
             </div>
        </div>
        
         <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg">
                Environmental portraiture exists in the space between traditional portrait photography and documentary work. Its purpose is not simply to show what a person looks like, but to communicate something essential about who they are by placing them within a meaningful environment. In this genre, the surroundings are not decorative. They are narrative elements that provide context, identity, and subtext.
            </p>
            <p>
                A successful environmental portrait allows the viewer to learn about the subject without explanation. A workshop, street corner, kitchen, office, or landscape becomes visual evidence of the subject’s life, profession, or state of mind. Because of this, environmental portraiture requires the photographer to think beyond facial expression and consider how space, objects, light, and framing contribute to meaning.
            </p>

             <div className="grid md:grid-cols-2 gap-8 my-8 not-prose">
                 <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h4 className="text-primary font-bold mb-4">Key Considerations</h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li><strong>Lighting:</strong> Often a negotiation. Natural light is the foundation, but may need shaping. Artificial light shouldn't overpower the environment.</li>
                        <li><strong>Aperture:</strong> One of the most critical decisions. Too wide erases context; too narrow dilutes the subject.</li>
                        <li><strong>Composition:</strong> Architectural lines and objects must guide the eye toward the subject, not away.</li>
                    </ul>
                 </div>
                 
                 <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-4">Common Failures</h4>
                     <ul className="space-y-3 text-sm text-slate-300">
                        <li><strong>Background Overload:</strong> Environment is visually dominant, making the subject secondary.</li>
                        <li><strong>Lighting Inconsistency:</strong> Artificial light contradicts natural light direction or quality.</li>
                        <li><strong>Disconnection:</strong> Subject appears uncomfortable or unrelated to the environment.</li>
                    </ul>
                 </div>

                 <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl mt-6">
                    <h3 className="text-green-500 font-bold mb-4 uppercase text-xs tracking-widest">Environmental Portrait Checklist</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Choose locations that reveal something meaningful.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Control depth of field for context.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Watch background lines (head intersections).</span>
                        </li>
                         <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Use light direction to separate subtly.</span>
                        </li>
                    </ul>
                </div>
             </div>
             <p>
                Environmental portraiture succeeds when the viewer believes the subject belongs exactly where they are.
             </p>
        </div>
      </section>

      {/* Event Photography */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Calendar className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Event Photography</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Irreversible Moments</div>
             </div>
        </div>
        
         <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg">
                Event photography is defined by a single, unforgiving truth: moments happen once. There are no second chances, no controlled resets, and no opportunity to correct missed expressions or interactions. This irreversibility creates a unique psychological and technical pressure.
            </p>
            <p>
                Unlike studio or portrait work, event photography does not reward perfection. It rewards awareness, anticipation, and responsiveness. The photographer must constantly read the room and predict moments.
            </p>
            
            <div className="my-8 space-y-4">
                <h4 className="text-white font-bold">Technical Realities:</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                    <li><strong className="text-primary">Lighting:</strong> Often chaotic. Mixed temperatures, dim interiors. High ISOs and fast lenses are norms, not exceptions.</li>
                    <li><strong className="text-primary">Depth of Field:</strong> A practical compromise. Excessive shallow depth increases missed focus risks. Apertures are chosen for tolerance, not just bokeh.</li>
                    <li><strong className="text-primary">Success Metric:</strong> Coverage and continuity matter more than a single flawless frame. Reaction shots and transitions carry emotional weight.</li>
                </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl not-prose">
                <h4 className="text-red-400 font-bold mb-4">Failure Modes</h4>
                <ul className="space-y-3 text-sm text-slate-300">
                    <li><strong>Tunnel Vision:</strong> Locking onto one subject while other moments unfold elsewhere.</li>
                    <li><strong>Technical Rigidity:</strong> Resisting setting changes as conditions shift.</li>
                    <li><strong>Prioritizing Aesthetics:</strong> Choosing "artistic" settings that lead to missed or unusable images (blur, focus errors).</li>
                </ul>
            </div>

            <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl mt-6 not-prose">
                <h3 className="text-green-500 font-bold mb-4 uppercase text-xs tracking-widest">Event Shooting Checklist</h3>
                <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Know the schedule and anticipate moments.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Prioritize reliability in settings.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Move constantly with purpose.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Capture transitions and reactions.</span>
                    </li>
                </ul>
            </div>
            <p className="border-l-4 border-primary pl-4 italic text-slate-400 mt-4">
                Event photography rewards adaptability, humility, and endurance.
            </p>
        </div>
      </section>

      {/* Product & Commercial Photography */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Box className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Product & Commercial</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Precision as a Requirement</div>
             </div>
        </div>
         <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg">
                Product and commercial photography operate under a fundamentally different set of expectations. Creativity is subordinated to clarity, accuracy, and consistency. The primary goal is communication, not just expression. Every decision serves the brief.
            </p>
            <p>
                Unlike many creative genres, product photography leaves little room for improvisation. Preparation, testing, and repetition are central. What appears simple is often the result of dozens of precise adjustments.
            </p>

            <div className="grid md:grid-cols-2 gap-8 my-8 not-prose">
                 <div className="space-y-4">
                    <h4 className="text-white font-bold">Technical Discipline</h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li><strong className="text-primary">Lighting:</strong> Use to describe form, texture, and value with precision. Not just for mood.</li>
                        <li><strong className="text-primary">Depth of Field:</strong> Typically maximized for full sharpness. Focus stacking is common.</li>
                        <li><strong className="text-primary">Color:</strong> Non-negotiable accuracy. Must match real-world product appearance.</li>
                    </ul>
                 </div>

                 <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                     <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" /> Common Failures
                    </h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex gap-2 items-start">
                             <span className="text-red-400 mt-1">x</span>
                             <span>Ignoring reflections on glossy surfaces (distractions).</span>
                        </li>
                        <li className="flex gap-2 items-start">
                             <span className="text-red-400 mt-1">x</span>
                             <span>Uneven lighting that distorts shape or texture.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                             <span className="text-red-400 mt-1">x</span>
                             <span>Underestimating dust/imperfections which become glaring at high res.</span>
                        </li>
                    </ul>
                 </div>

                 <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl mt-6 col-span-1 md:col-span-2">
                     <h3 className="text-green-500 font-bold mb-4 uppercase text-xs tracking-widest">Product Shooting Checklist</h3>
                    <ul className="space-y-3 text-sm text-slate-300 grid md:grid-cols-2 gap-4">
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Clean the product before shooting.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Control reflections aggressively.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Use stable support and precise focus.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Match lighting style to brand intent.</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Shoot variations for flexibility.</span>
                        </li>
                    </ul>
                 </div>
            </div>
            
            <p className="border-l-4 border-primary pl-4 italic text-slate-400">
                Product photography rewards patience, discipline, and respect for detail.
            </p>
        </div>
      </section>


      {/* Conclusion */}
      <div className="border-t border-white/10 pt-16 mt-16 text-center">
          <h2 className="text-4xl font-black uppercase text-white mb-6">Choosing the Right Approach</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Control, timing, depth, context, and technical tolerance all shift depending on the shoot. Understanding these differences allows informed decisions.
          </p>
          <div className="inline-block bg-white/5 px-8 py-4 rounded-full border border-white/20">
              <span className="text-sm font-mono text-primary uppercase tracking-widest mr-2">Guiding Principle:</span>
              <span className="text-white font-bold">"The environment dictates your priorities, not your preferences."</span>
          </div>
      </div>

    </div>
  )
}
