'use client'

import dynamic from 'next/dynamic'
import type { ProgressData } from '../progress-data'

// recharts is the heaviest client dependency and the charts sit below the
// fold, so load it on demand instead of shipping it in the dashboard's
// initial bundle. (ssr:false must live in a Client Component.)
const ProgressSection = dynamic(
    () => import('./progress-section').then((m) => m.ProgressSection),
    {
        ssr: false,
        loading: () => <div className="h-48 bg-white/5 border border-white/10 animate-pulse" aria-hidden />,
    }
)

export function LazyProgressSection({ data }: { data: ProgressData }) {
    return <ProgressSection data={data} />
}
