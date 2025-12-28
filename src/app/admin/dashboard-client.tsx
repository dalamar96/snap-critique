'use client'

import { useState } from 'react'
import { Sidebar, Activity, Users, Database, Globe, Search, Lock, List, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { UserTable } from './user-table'
import { UnclaimedTable } from './unclaimed-table'
import { AllAnalysesTable } from './all-analyses-table'

interface DashboardData {
    users: any[]
    unclaimedCount: number
    totalRevenue: number
    recentSubmissions?: any[] // If we keep recent activity
}

export function DashboardClient({ 
    data, 
    userEmail 
}: { 
    data: DashboardData, 
    userEmail: string 
}) {
    const [showUnclaimed, setShowUnclaimed] = useState(false)
    const [showAllAnalyses, setShowAllAnalyses] = useState(false)

    // Derived metrics
    const totalUsers = data.users.length
    const totalRevenue = data.totalRevenue
    const totalAnalyses = data.users.reduce((acc, u) => acc + (u.stats?.total_analyses || 0), 0) + data.unclaimedCount + data.users.reduce((acc, u) => acc + (u.stats?.deleted_analyses || 0), 0)

    return (
        <div className="min-h-screen bg-slate-950 font-mono text-white">
           {/* Top Bar */}
           <div className="border-b border-white/10 bg-black p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest">
                 <Database className="w-5 h-5" />
                 Admin Dashboard
              </div>
              <div className="flex items-center gap-4 text-xs">
                 <div className="text-slate-500">
                    User: <span className="text-white">{userEmail}</span>
                 </div>
                 <div className="text-slate-500">
                    Status: <span className="text-green-500">ONLINE</span>
                 </div>
              </div>
           </div>
    
           <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
              
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {/* Clickable User Count */}
                 <div onClick={() => document.getElementById('user-table-section')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer">
                    <KpiCard label="Active Profiles" value={totalUsers} icon={<Users className="w-5 h-5 text-orange-500"/>} />
                 </div>

                 {/* Clickable Unclaimed Count */}
                 <div onClick={() => setShowUnclaimed(true)} className="cursor-pointer">
                    <KpiCard 
                        label="Unclaimed Analyses" 
                        value={data.unclaimedCount} 
                        icon={<Globe className="w-5 h-5 text-blue-500"/>} 
                        highlight={data.unclaimedCount > 0}
                    />
                 </div>

                 {/* Clickable Total Analyses */}
                 <div onClick={() => setShowAllAnalyses(true)} className="cursor-pointer">
                    <KpiCard label="Total Analyses" value={totalAnalyses} icon={<Activity className="w-5 h-5 text-green-500"/>} />
                 </div>

                 <KpiCard label="Est. Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<Search className="w-5 h-5 text-primary"/>} />
              </div>
              
              {/* Management & Quick Links */}
              <div>
                  <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    Management
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/admin/taxonomy" className="bg-black border border-white/10 p-6 rounded-lg hover:border-primary transition-colors flex items-center justify-between group">
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase mb-1">Taxonomy</h3>
                            <p className="text-slate-500 text-xs">Manage Brands & Types</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                    </Link>
                  </div>
              </div>
    
              {/* Users Table */}
              <div id="user-table-section" className="mt-12">
                 <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    User Directory
                 </h2>
                 <UserTable profiles={data.users} />
              </div>
           </div>

           {/* Modals */}
           <UnclaimedTable isOpen={showUnclaimed} onClose={() => setShowUnclaimed(false)} />
           <AllAnalysesTable isOpen={showAllAnalyses} onClose={() => setShowAllAnalyses(false)} />
        </div>
    )
}

function KpiCard({label, value, icon, highlight}: {label: string, value: string | number, icon: React.ReactNode, highlight?: boolean}) {
    return (
       <div className={`bg-black border p-6 flex flex-col gap-2 rounded-lg transition-all hover:bg-white/5 ${highlight ? 'border-orange-500/50' : 'border-white/10'}`}>
          <div className="flex justify-between items-start">
             <span className="text-slate-500 text-xs uppercase tracking-widest">{label}</span>
             {icon}
          </div>
          <div className={`text-3xl font-bold ${highlight ? 'text-orange-500' : 'text-white'}`}>{value}</div>
       </div>
    )
 }
