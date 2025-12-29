'use client'

import { useState } from 'react'
import { Sidebar, Activity, Users, Database, Globe, Search, Lock, List, ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { UserTable } from './user-table'
import { UnclaimedTable } from './unclaimed-table'
import { AllAnalysesTable } from './all-analyses-table'
import { ErrorLogTable } from './error-log-table'
import { SupportInbox } from './support-inbox'

interface DashboardData {
    users: any[]
    unclaimedCount: number
    totalRevenue: number
    recentErrors: number
    supportUnreadCount: number
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
    const [showErrors, setShowErrors] = useState(false)
    const [showMessages, setShowMessages] = useState(false)

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                 <div onClick={() => document.getElementById('user-table-section')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer">
                    <KpiCard label="Active Profiles" value={totalUsers} icon={<Users className="w-5 h-5 text-orange-500"/>} />
                 </div>

                 <div onClick={() => setShowUnclaimed(true)} className="cursor-pointer">
                    <KpiCard 
                        label="Unclaimed Analyses" 
                        value={data.unclaimedCount} 
                        icon={<Globe className="w-5 h-5 text-blue-500"/>} 
                        highlight={data.unclaimedCount > 0}
                    />
                 </div>

                 <div onClick={() => setShowAllAnalyses(true)} className="cursor-pointer">
                    <KpiCard label="Total Analyses" value={totalAnalyses} icon={<Activity className="w-5 h-5 text-green-500"/>} />
                 </div>

                 <KpiCard label="Est. Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<Search className="w-5 h-5 text-primary"/>} />

                 <div onClick={() => setShowErrors(true)} className="cursor-pointer">
                    <KpiCard 
                        label="System Errors (24h)" 
                        value={data.recentErrors} 
                        icon={<AlertTriangle className="w-5 h-5 text-red-500"/>} 
                        highlight={data.recentErrors > 0}
                        highlightColor="text-red-500"
                        borderColor="border-red-500/50"
                    />
                 </div>
              </div>
              
              {/* Management & Quick Links */}
              <div>
                  <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    Management
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => setShowMessages(true)} className="cursor-pointer bg-black border border-white/10 p-6 rounded-lg hover:border-primary transition-colors flex items-center justify-between group relative overflow-hidden">
                         <div>
                             <h3 className="text-lg font-bold text-white uppercase mb-1 flex items-center gap-2">
                                Support Inbox
                                {data.supportUnreadCount > 0 && (
                                    <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                                        {data.supportUnreadCount} New
                                    </span>
                                )}
                             </h3>
                             <p className="text-slate-500 text-xs">Reply to user messages</p>
                         </div>
                         <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                         {data.supportUnreadCount > 0 && (
                             <div className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full m-2"></div>
                         )}
                    </div>

                    <Link href="/admin/taxonomy" className="bg-black border border-white/10 p-6 rounded-lg hover:border-primary transition-colors flex items-center justify-between group">
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase mb-1">Taxonomy</h3>
                            <p className="text-slate-500 text-xs">Manage Brands & Types</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                    </Link>

                    <Link href="/admin/lessons" className="bg-black border border-white/10 p-6 rounded-lg hover:border-primary transition-colors flex items-center justify-between group">
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase mb-1">Lessons</h3>
                            <p className="text-slate-500 text-xs">Manage Courses & Content</p>
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
           {showErrors && <ErrorLogTable onClose={() => setShowErrors(false)} />}
           {showMessages && <SupportInbox onClose={() => setShowMessages(false)} />}
        </div>
    )
}

function KpiCard({
    label, 
    value, 
    icon, 
    highlight, 
    highlightColor = 'text-orange-500',
    borderColor = 'border-orange-500/50'
}: {
    label: string, 
    value: string | number, 
    icon: React.ReactNode, 
    highlight?: boolean,
    highlightColor?: string,
    borderColor?: string
}) {
    return (
       <div className={`bg-black border p-6 flex flex-col gap-2 rounded-lg transition-all hover:bg-white/5 ${highlight ? borderColor : 'border-white/10'}`}>
          <div className="flex justify-between items-start">
             <span className="text-slate-500 text-xs uppercase tracking-widest">{label}</span>
             {icon}
          </div>
          <div className={`text-3xl font-bold ${highlight ? highlightColor : 'text-white'}`}>{value}</div>
       </div>
    )
 }
