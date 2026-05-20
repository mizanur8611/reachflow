'use client'
// ReachFlow - Advertiser Dashboard
// File: frontend/src/app/dashboard/advertiser/page.jsx

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, Users, MousePointer, ShoppingBag, DollarSign,
  Plus, ArrowUpRight, ArrowDownRight, Bell, Settings,
  BarChart2, Globe, Zap, ChevronRight, Eye, Target
} from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import CreateCampaignModal from '@/components/campaigns/CreateCampaignModal'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

// ── Sample Data ───────────────────────────
const performanceData = [
  { date: 'May 1', reach: 12000, clicks: 800, conversions: 45 },
  { date: 'May 5', reach: 28000, clicks: 1200, conversions: 89 },
  { date: 'May 10', reach: 45000, clicks: 2100, conversions: 134 },
  { date: 'May 15', reach: 38000, clicks: 1800, conversions: 112 },
  { date: 'May 20', reach: 62000, clicks: 3200, conversions: 198 },
  { date: 'May 25', reach: 55000, clicks: 2700, conversions: 167 },
  { date: 'May 31', reach: 78000, clicks: 4100, conversions: 245 },
]

const platformData = [
  { name: 'TikTok', value: 40, color: '#fe2c55' },
  { name: 'Instagram', value: 25, color: '#e1306c' },
  { name: 'YouTube', value: 15, color: '#ff0000' },
  { name: 'Telegram', value: 10, color: '#0088cc' },
  { name: 'Facebook', value: 10, color: '#1877f2' },
]

const STAT_CARDS = [
  { label: 'Total Campaigns', value: '24', change: '+20.5%', up: true, icon: Target, color: 'from-violet-500 to-purple-600' },
  { label: 'Total Spent', value: '$2,450', change: '+15.7%', up: true, icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
  { label: 'Total Reach', value: '1.2M', change: '+18.3%', up: true, icon: Eye, color: 'from-emerald-500 to-teal-600' },
  { label: 'Conversions', value: '3.2K', change: '+21.4%', up: true, icon: ShoppingBag, color: 'from-orange-500 to-amber-600' },
  { label: 'Total Clicks', value: '45.6K', change: '+18.3%', up: true, icon: MousePointer, color: 'from-pink-500 to-rose-600' },
  { label: 'Avg Engagement', value: '8.6%', change: '+11.2%', up: true, icon: TrendingUp, color: 'from-indigo-500 to-blue-600' },
]

export default function AdvertiserDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const { data: campaigns } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaign/my').then(r => r.data.campaigns)
  })

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/payment/wallet').then(r => r.data.wallet)
  })

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex">
      <Sidebar role="advertiser" />

      <div className="flex-1 ml-64 overflow-hidden">
        <TopBar />

        <main className="p-8 overflow-y-auto h-[calc(100vh-64px)]">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Dashboard 👋
              </h1>
              <p className="text-gray-400 mt-1">Here's what's happening with your campaigns today.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-[#1a1b23] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300">
                May 01 – May 31, 2026
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/25"
              >
                <Plus size={18} />
                New Campaign
              </motion.button>
            </div>
          </motion.div>

          {/* Wallet Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-violet-900/50 to-purple-900/30 border border-violet-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-400 text-sm">Wallet Balance</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(wallet?.balance ?? 1250)}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/advertiser/wallet">
                <button className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  + Add Money
                </button>
              </Link>
              <Link href="/dashboard/advertiser/transactions">
                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Transactions
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            {STAT_CARDS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                  <span className="text-gray-500 font-normal">vs last 30d</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">

            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-2 bg-[#1a1b23] border border-white/5 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-white">Campaign Performance</h2>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none">
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                  <option>Last 90 Days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a1b23', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="reach" stroke="#7c3aed" strokeWidth={2} fill="url(#reachGrad)" />
                  <Area type="monotone" dataKey="clicks" stroke="#06b6d4" strokeWidth={2} fill="url(#clickGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Platform Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6"
            >
              <h2 className="font-semibold text-white mb-4">Reach by Platform</h2>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={0}>
                    {platformData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val}%`} contentStyle={{ background: '#1a1b23', border: '1px solid #ffffff10', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {platformData.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-gray-400">{p.name}</span>
                    </div>
                    <span className="text-white font-medium">{p.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Campaigns Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Recent Campaigns</h2>
              <Link href="/dashboard/advertiser/campaigns" className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-left">Platforms</th>
                  <th className="px-6 py-3 text-right">Budget</th>
                  <th className="px-6 py-3 text-right">Spent</th>
                  <th className="px-6 py-3 text-right">Reach</th>
                  <th className="px-6 py-3 text-right">Clicks</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: 'Summer Collection Promo', platforms: ['TikTok', 'Instagram'], budget: 500, spent: 420, reach: '250K', clicks: '9.2K', status: 'Active' },
                  { name: 'New Gadget Launch', platforms: ['YouTube', 'Facebook'], budget: 400, spent: 380, reach: '180K', clicks: '7.1K', status: 'Active' },
                  { name: 'Food Delivery Offer', platforms: ['TikTok', 'Telegram'], budget: 300, spent: 250, reach: '120K', clicks: '4.8K', status: 'Completed' },
                  { name: 'Skincare Product Promo', platforms: ['Instagram'], budget: 300, spent: 290, reach: '210K', clicks: '8.3K', status: 'Active' },
                  { name: 'App Install Drive', platforms: ['Facebook', 'Twitter'], budget: 250, spent: 210, reach: '160K', clicks: '6.1K', status: 'Completed' },
                ].map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">{c.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {c.platforms.map(p => (
                          <span key={p} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">${c.budget}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">${c.spent}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">{c.reach}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">{c.clicks}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        c.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-gray-500 hover:text-white transition-colors">···</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </main>
      </div>

      {showCreateModal && <CreateCampaignModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}
