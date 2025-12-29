import React from 'react'

export function UnderstandingAperture() {
  return (
    <div className="prose prose-invert max-w-none">
      <p className="lead text-xl text-slate-300">
        Aperture is one of the three pillars of photography (along with Shutter Speed and ISO). It controls how much light enters your camera and the depth of field in your image.
      </p>

      <h2>What is Aperture?</h2>
      <p>
        Inside your lens is a set of blades that can open or close to change the size of the hole that light passes through. This hole is the aperture.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          <div className="bg-white/5 p-6 rounded-lg text-center border border-white/10">
              <div className="w-24 h-24 rounded-full border-4 border-white mx-auto mb-4 bg-black flex items-center justify-center relative">
                 <div className="w-20 h-20 rounded-full bg-white/10"></div>
              </div>
              <h3 className="text-primary font-bold mb-2">Large Aperture (f/1.8)</h3>
              <p className="text-sm text-slate-400">lots of light, blurry background (shallow depth of field)</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg text-center border border-white/10">
              <div className="w-24 h-24 rounded-full border-[12px] border-white mx-auto mb-4 bg-black flex items-center justify-center relative">
                 <div className="w-4 h-4 rounded-full bg-white/10"></div>
              </div>
              <h3 className="text-primary font-bold mb-2">Small Aperture (f/16)</h3>
              <p className="text-sm text-slate-400">Less light, everything in focus (deep depth of field)</p>
          </div>
      </div>

      <h2>The F-Stop Scale</h2>
      <p>
        Aperture is measured in "f-stops". It can be confusing because the numbers work backwards:
      </p>
      <ul>
        <li><strong>Small Number (f/1.4, f/2.8)</strong> = Big Hole = More Light = Blurry Background.</li>
        <li><strong>Big Number (f/11, f/16)</strong> = Small Hole = Less Light = Sharp Background.</li>
      </ul>

      <h2>When to use which?</h2>
      <ul>
         <li><strong>Portraits:</strong> Use a wide aperture (f/2.8) to blur the background and isolate your subject.</li>
         <li><strong>Landscapes:</strong> Use a narrow aperture (f/11) to ensure everything from the foreground to the mountains is sharp.</li>
      </ul>
    </div>
  )
}
