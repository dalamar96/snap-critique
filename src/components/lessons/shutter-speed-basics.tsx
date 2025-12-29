import React from 'react'
import { Timer } from 'lucide-react'

export function ShutterSpeedBasics() {
  return (
    <div className="prose prose-invert max-w-none">
      <p className="lead text-xl text-slate-300">
        Shutter speed controls time. It determines how long your camera's sensor is exposed to light, allowing you to freeze fast action or blur motion for artistic effect.
      </p>

      <h2>Freezing vs. Blurring</h2>
      <p>
        The shutter is a curtain that opens and closes.
      </p>

      <div className="my-8 flex flex-col md:flex-row gap-4">
         <div className="flex-1 bg-blue-900/20 p-6 rounded border border-blue-500/30">
            <h3 className="flex items-center gap-2 text-blue-400 font-bold m-0 mb-4">
                <Timer className="w-5 h-5" /> Fast Shutter (1/1000s)
            </h3>
            <p className="text-sm text-slate-300 m-0">
                Use this to freeze a bird in flight, a runner, or splashing water. The shutter opens and closes so fast the motion is stopped instantly.
            </p>
         </div>
         <div className="flex-1 bg-purple-900/20 p-6 rounded border border-purple-500/30">
            <h3 className="flex items-center gap-2 text-purple-400 font-bold m-0 mb-4">
                <Timer className="w-5 h-5" /> Slow Shutter (1s+)
            </h3>
            <p className="text-sm text-slate-300 m-0">
                Use this to create silky smooth waterfalls, light trails from cars, or star trails. You MUST use a tripod, or your hand shake will ruin the photo.
            </p>
         </div>
      </div>

      <h2>How it relates to Light</h2>
      <p>
        Shutter speed also affects exposure:
      </p>
      <ul>
        <li><strong>Fast Shutter:</strong> Lets in LESS light (image gets darker). You might need to open your aperture or raise ISO to compensate.</li>
        <li><strong>Slow Shutter:</strong> Lets in MORE light (image gets brighter). Great for night photography, but be careful of overexposure in daylight.</li>
      </ul>

      <h2>Rule of Thumb</h2>
      <p>
        To avoid blurry photos from shaky hands, keep your shutter speed faster than your focal length. If you are shooting with a 50mm lens, keep your shutter faster than 1/50th of a second (e.g., 1/60 or 1/100).
      </p>
    </div>
  )
}
