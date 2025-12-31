import { Composition101 } from '@/components/lessons/composition-101'
import { UnderstandingAperture } from '@/components/lessons/understanding-aperture'
import { ShutterSpeedBasics } from '@/components/lessons/shutter-speed-basics'
import { TypesOfPhotographyShoots } from '@/components/lessons/types-of-photography-shoots'
import { LightingForPhotographers } from '@/components/lessons/lighting-for-photographers';
import { ComponentType } from 'react'

export const LessonRegistry: Record<string, ComponentType> = {
    'composition-101': Composition101,
    'understanding-aperture': UnderstandingAperture,
    'shutter-speed-basics': ShutterSpeedBasics,
    'types-of-photography-shoots': TypesOfPhotographyShoots,
    'lighting-for-photographers': LightingForPhotographers,
}
