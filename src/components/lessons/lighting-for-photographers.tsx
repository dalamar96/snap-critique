'use client'

import React from 'react'
import { Lightbulb, Sun, Cloud, Maximize, Minimize, AlertTriangle, CheckCircle, XCircle, Zap, Palette } from 'lucide-react'

export function LightingForPhotographers() {
  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-20 font-sans">
      
      {/* Introduction */}
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Lighting for Photographers</h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              Natural Light and Studio Light, How to Shape Each, and Why It Works
            </p>
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-8 rounded-r-xl">
           <p className="text-xl text-slate-200 italic font-serif">
            &quot;Lighting is not “brightness.” Lighting is shape, texture, mood, and depth. A camera records what light does to a scene, not the scene itself.&quot;
           </p>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300">
            <p className="text-lg">
                The most common mistake beginners make is treating light as something you either have or don’t have. Professionals treat light as something you place, shape, subtract, and direct even when it comes from the sun.
            </p>
            <p className="text-lg">
                A useful mental model is this: exposure is about how much light you capture; lighting is about what the light looks like. Two photos can have identical exposure and feel completely different because the light’s direction, softness, contrast, and color are different. Your job as a photographer is to recognize those qualities and control them as much as the environment allows.
            </p>
        </div>
      </div>

      {/* Part 1: Core Qualities */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Palette className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">The Core Qualities of Light</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Applies to Everything</div>
             </div>
        </div>
        
        <div className="prose prose-invert max-w-none text-slate-300">
            <p>
                Before splitting into natural vs studio, you must learn to evaluate light using a small set of consistent questions. These questions will solve most lighting problems faster than memorizing setups.
            </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Maximize className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-bold">Direction</h3>
                </div>
                <p className="text-sm text-slate-400">
                    Where the light comes from relative to the subject. Determines where shadows fall and how form is revealed.
                </p>
            </div>
             <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-bold">Softness</h3>
                </div>
                <p className="text-sm text-slate-400">
                    How gentle the transition is between highlights and shadows. Controlled by the size of the light source relative to the subject.
                </p>
            </div>
             <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Minimize className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-bold">Contrast</h3>
                </div>
                <p className="text-sm text-slate-400">
                    The difference between highlight and shadow. Increases with hard light; decreases with fill or softness.
                </p>
            </div>
             <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-bold">Color Temp</h3>
                </div>
                <p className="text-sm text-slate-400">
                    The tint of light. Warm (golden) vs Cool (moody). Mixed temps can be a creative tool or a problem.
                </p>
            </div>
             <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-bold">Specularity</h3>
                </div>
                <p className="text-sm text-slate-400">
                    How &quot;shiny&quot; highlights behave. Small sources create sharp reflections; large sources create smooth highlights.
                </p>
            </div>
        </div>
      </section>

      {/* Part 2: Natural Lighting */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Sun className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Natural Lighting</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Using What Exists, Then Shaping It</div>
             </div>
        </div>

        <div className="space-y-6 text-slate-300 leading-loose">
            <p>
                Natural light is not just &quot;sun.&quot; It includes open shade, skylight, window light, reflected light, and even streetlight. The key is to recognize that natural light has different personalities depending on time of day and environment.
            </p>

            <div className="grid gap-6">
                <div className="p-6 bg-slate-900 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="text-white font-bold text-lg mb-2">Golden Hour</h3>
                    <p className="text-sm text-slate-400">Low, warm, directional. Produces long shadows and cinematic feel. <strong>Use:</strong> Backlight for rim/glow, sidelight for texture.</p>
                </div>
                <div className="p-6 bg-slate-900 rounded-lg border-l-4 border-orange-500">
                    <h3 className="text-white font-bold text-lg mb-2">Midday Sun</h3>
                    <p className="text-sm text-slate-400">High, hard, unforgiving. Shadows fall into eye sockets. <strong>Use:</strong> Graphic/contrast styles, or move to open shade/diffuse.</p>
                </div>
                <div className="p-6 bg-slate-900 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-white font-bold text-lg mb-2">Overcast Light</h3>
                    <p className="text-sm text-slate-400">Giant softbox. Gentle shadows, even exposure. Can look flat. <strong>Use:</strong> Portraits (skin is forgiving). create direction with surroundings.</p>
                </div>
                <div className="p-6 bg-slate-900 rounded-lg border-l-4 border-indigo-400">
                    <h3 className="text-white font-bold text-lg mb-2">Open Shade</h3>
                    <p className="text-sm text-slate-400">Subject protected from sun but lit by skylight. Soft, cool light. <strong>Use:</strong> Classic portraits. Watch for &quot;raccoon eyes&quot; if shade is too overhead.</p>
                </div>
                 <div className="p-6 bg-slate-900 rounded-lg border-l-4 border-white">
                    <h3 className="text-white font-bold text-lg mb-2">Window Light</h3>
                    <p className="text-sm text-slate-400">Directional and controllable. <strong>Use:</strong> Moving subject closer = softer/brighter. Moving away = dramatic falloff.</p>
                </div>
            </div>

             <div className="mt-8">
                 <h3 className="text-2xl text-white font-bold mb-4">Natural Modifiers</h3>
                 <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white/5 p-4 rounded-lg">
                        <strong className="text-primary block mb-1">Reflectors</strong>
                        Bounce existing light into shadows. (White=Soft, Silver=Punchy, Gold=Warm).
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <strong className="text-primary block mb-1">Diffusers</strong>
                         Translucent material between sun and subject. Enlarges source, reduces contrast.
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <strong className="text-primary block mb-1">Negative Fill</strong>
                        Black surface to absorb light. Deepens shadows and adds shape.
                    </div>
                 </div>
             </div>
        </div>
      </section>

      {/* Part 3: Studio Lighting */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Studio Lighting</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Building Light from Scratch</div>
             </div>
        </div>

        <div className="space-y-12">
            
            {/* Building Blocks */}
            <div className="space-y-6">
                 <h3 className="text-2xl text-white font-bold">The Building Blocks (Roles)</h3>
                 <p className="text-slate-300">Nearly every setup uses lights in one of four functional roles. These are jobs, not gear.</p>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <h4 className="text-lg font-bold text-primary mb-2">Key Light</h4>
                        <p className="text-sm text-slate-400">The author of shape. Defines the subject, shadows, and mood. If you remove everything else, this is what remains.</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <h4 className="text-lg font-bold text-primary mb-2">Fill Light</h4>
                        <p className="text-sm text-slate-400">The manager of contrast. Lifts shadows without creating new ones. Should be felt, not seen.</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <h4 className="text-lg font-bold text-primary mb-2">Rim Light</h4>
                        <p className="text-sm text-slate-400">The separator. Outlines edges to pull subject from background. Needs control (grids) to prevent spill.</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <h4 className="text-lg font-bold text-primary mb-2">Background Light</h4>
                        <p className="text-sm text-slate-400">The controller of space. Shapes the environment behind the subject (tone, gradient, texture).</p>
                    </div>
                 </div>
            </div>

            {/* Patterns */}
            <div className="space-y-6">
                 <h3 className="text-2xl text-white font-bold">Classic Lighting Patterns</h3>
                 <p className="text-slate-300">Descriptive names for where shadows fall on the face.</p>
                 <div className="grid gap-4">
                     <div className="flex gap-4 items-start bg-white/5 p-4 rounded-lg">
                        <div className="bg-primary/20 p-2 rounded text-primary font-bold min-w-[3rem] text-center">45°</div>
                        <div>
                            <strong className="text-white block">Rembrandt</strong>
                            <span className="text-slate-400 text-sm">Triangle of light on the shadowed cheek. Adds depth and drama.</span>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start bg-white/5 p-4 rounded-lg">
                        <div className="bg-primary/20 p-2 rounded text-primary font-bold min-w-[3rem] text-center">30°</div>
                        <div>
                            <strong className="text-white block">Loop</strong>
                            <span className="text-slate-400 text-sm">Nose shadow &quot;loops&quot; onto cheek but doesn&apos;t connect. Flattering, standard.</span>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start bg-white/5 p-4 rounded-lg">
                        <div className="bg-primary/20 p-2 rounded text-primary font-bold min-w-[3rem] text-center">90°</div>
                        <div>
                            <strong className="text-white block">Split</strong>
                            <span className="text-slate-400 text-sm">Half face lit, half shadow. High contrast, dramatic, graphic.</span>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start bg-white/5 p-4 rounded-lg">
                        <div className="bg-primary/20 p-2 rounded text-primary font-bold min-w-[3rem] text-center">0°</div>
                        <div>
                            <strong className="text-white block">Butterfly</strong>
                            <span className="text-slate-400 text-sm">Shadow under nose resembles butterfly wings. Glamorous, symmetrical.</span>
                        </div>
                     </div>
                 </div>
            </div>

            {/* Modifiers */}
            <div className="space-y-6">
                 <h3 className="text-2xl text-white font-bold">Studio Modifiers</h3>
                 <p className="text-slate-300">Precision tools to control direction, softness, and spill.</p>
                 <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="border border-white/10 p-4 rounded">
                        <strong className="text-white block">Softboxes</strong>
                        <span className="text-slate-400">Soft, shaped, controlled spill. Feathering is key.</span>
                    </div>
                    <div className="border border-white/10 p-4 rounded">
                        <strong className="text-white block">Umbrellas</strong>
                        <span className="text-slate-400">Fast, broad, spills everywhere. Good for groups by messy for precision.</span>
                    </div>
                     <div className="border border-white/10 p-4 rounded">
                        <strong className="text-white block">Beauty Dish</strong>
                        <span className="text-slate-400">Crisp, textured light. Between hard and soft. Enhances structure.</span>
                    </div>
                     <div className="border border-white/10 p-4 rounded">
                        <strong className="text-white block">Grids</strong>
                        <span className="text-slate-400">Restricts spread. Adds direction without changing softness.</span>
                    </div>
                     <div className="border border-white/10 p-4 rounded">
                        <strong className="text-white block">Snoots</strong>
                        <span className="text-slate-400">Precision spotlights. Hard edges. For accents/hair.</span>
                    </div>
                     <div className="border border-white/10 p-4 rounded">
                        <strong className="text-white block">Gels</strong>
                        <span className="text-slate-400">Color control (correction or creative). Warning: Overuse looks amateur.</span>
                    </div>
                 </div>
                 <p className="text-center italic text-slate-400 text-sm">&quot;Modifiers do not create style. They enable control.&quot;</p>
            </div>

            {/* Workflow */}
            <div className="bg-slate-900 p-8 rounded-2xl border border-white/10">
                <h3 className="text-2xl text-white font-bold mb-6">Practical Workflow: One to Three Lights</h3>
                <div className="space-y-8 relative before:absolute before:left-[19px] before:top-10 before:bottom-10 before:w-0.5 before:bg-white/10">
                    <div className="relative pl-12">
                        <div className="absolute left-0 top-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-black">1</div>
                        <h4 className="text-white font-bold text-lg">One Light (Mastery)</h4>
                        <p className="text-slate-400 text-sm mt-1">Placement matters more than power. Use one light to define key. Use a reflector for contrast control. If you can&apos;t make it look good with one light, more won&apos;t help.</p>
                    </div>
                    <div className="relative pl-12">
                         <div className="absolute left-0 top-0 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white border border-white/20">2</div>
                        <h4 className="text-white font-bold text-lg">Two Lights (Separation)</h4>
                        <p className="text-slate-400 text-sm mt-1">Add a second light ONLY to solve a problem (e.g., subject blending into background). Rim light or Background light.</p>
                    </div>
                     <div className="relative pl-12">
                         <div className="absolute left-0 top-0 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white border border-white/20">3</div>
                        <h4 className="text-white font-bold text-lg">Three Lights (Polish)</h4>
                        <p className="text-slate-400 text-sm mt-1">Key + Fill/Rim + Background. High control, high risk of over-lighting. Restraint is the discipline.</p>
                    </div>
                </div>
            </div>

        </div>
      </section>

      {/* Part 4: Natural vs Studio */}
      <section className="space-y-8">
         <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                 <h3 className="text-xl font-bold text-white mb-4">Natural Light</h3>
                 <ul className="space-y-3 text-slate-300 text-sm">
                     <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/> <span>Authentic, believable, immediate.</span></li>
                     <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/> <span>Communicates honesty and presence.</span></li>
                     <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5"/> <span>Unpredictable (time, weather).</span></li>
                     <li className="text-xs text-slate-500 mt-4 italic">Best for: Environmental portraits, lifestyle, documentary.</li>
                 </ul>
             </div>
             <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                 <h3 className="text-xl font-bold text-white mb-4">Studio Light</h3>
                 <ul className="space-y-3 text-slate-300 text-sm">
                     <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/> <span>Consistent, repeatable, precise.</span></li>
                     <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5"/> <span>Signals intention and authority.</span></li>
                     <li className="flex gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5"/> <span>Can feel artificial/distant if overdone.</span></li>
                     <li className="text-xs text-slate-500 mt-4 italic">Best for: Commercial, product, branding, formal portraits.</li>
                 </ul>
             </div>
         </div>
      </section>

      {/* Common Mistakes */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-primary border-b border-white/10 pb-4">
             <div className="p-3 bg-primary/10 rounded-xl">
                <AlertTriangle className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-3xl font-bold uppercase tracking-wider text-white">Common Mistakes</h2>
                <div className="text-sm text-slate-500 font-mono uppercase tracking-widest">Errors that apply to BOTH worlds</div>
             </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-6">
                 <ul className="space-y-4 text-sm text-slate-300">
                    <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Placing light too far away:</strong> Creates small, hard, harsh light. Solution: Move closer for softness.</span>
                    </li>
                    <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Aiming directly at face:</strong> Creates hot spots. Solution: Feather the light (use the edge).</span>
                    </li>
                    <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Ignoring the background:</strong> Chaos or bright spots distract from subject. Solution: Light the back separately or move.</span>
                    </li>
                     <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Mixed Color Temps:</strong> Orange lamp + Blue window = Amateur. Solution: Match with gels or block one source.</span>
                    </li>
                     <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Over-filling:</strong> Eliminating all shadows removes depth. Subject looks pasted on.</span>
                    </li>
                 </ul>
                 <ul className="space-y-4 text-sm text-slate-300">
                     <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Chasing Brightness:</strong> Focusing on exposure instead of shape. Shape first, exposure second.</span>
                    </li>
                    <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Adding lights to fix placement:</strong> More lights won&apos;t fix a bad key light. Diagnose, don&apos;t add.</span>
                    </li>
                    <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Visual Noise:</strong> Over-lighting makes images feel busy. Subtlety is strength.</span>
                    </li>
                     <li className="flex gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        <span><strong>Evaluation Order:</strong> Failing to check eyes first. Faces carry the image.</span>
                    </li>
                 </ul>
            </div>
        </div>
        
        <div className="text-center pt-8">
            <p className="text-xl text-white font-bold mb-2">&quot;If something feels off, remove complexity before adding it.&quot;</p>
        </div>
      </section>

    </div>
  )
}
