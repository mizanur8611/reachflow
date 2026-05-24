'use client'
import { motion } from 'framer-motion'
import { DollarSign, Users, MousePointer, TrendingUp, Eye, Target, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const STATS = [
  { label: 'Total Campaigns', value: '24', change: '+20.5%', icon: Target, color: 'from-violet-500 to-purple-600' },
  { label: 'Total Spent', value: '$2,450', change: '+15.7%', icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
  { label: 'Total Reach', value: '1.2M', change: '+18.3%', icon: Eye, color: 'from-emerald-500 to-teal-600' },
  { label: 'Total Clicks', value: '45.6K', change: '+18.3%', icon: MousePointer, color: 'from-pink-500 to-rose-600' },
  { label: 'Conversions', value: '3.2K', change: '+21.4%', icon: TrendingUp, color: 'from-orange-500 to-amber-600' },
  { label: 'Avg Engagement', value: '8.6%', change: '+11.2%', icon: Users, color: 'from-indigo-500 to-blue-600' },
]

const CAMPAIGNS = [
  { name: 'Summer Collection Promo', platforms: ['TikTok', 'Instagram'], budget: 500, spent: 420, reach: '250K', clicks: '9.2K', status: 'Active' },
  { name: 'New Gadget Launch', platforms: ['YouTube', 'Facebook'], budget: 400, spent: 380, reach: '180K', clicks: '7.1K', status: 'Active' },
  { name: 'Food Delivery Offer', platforms: ['TikTok', 'Telegram'], budget: 300, spent: 250, reach: '120K', clicks: '4.8K', status: 'Completed' },
  { name: 'Skincare Product Promo', platforms: ['Instagram'], budget: 300, spent: 290, reach: '210K', clicks: '8.3K', status: 'Active' },
  { name: 'App Install Drive', platforms: ['Facebook'], budget: 250, spent: 210, reach: '160K', clicks: '6.1K', status: 'Completed' },
]

export default function AdvertiserDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard 👋</h1>
            <p className="text-gray-400 mt-1">Here's what's happening with your campaigns today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/advertiser/wallet">
              <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                💰 Wallet: $1,250
              </button>
            </Link>
            <Link href="/dashboard/advertiser/campaigns/new">
  <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
    <Plus size={16} /> New Campaign
  </button>
</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
              <p className="text-emerald-400 text-xs mt-1 font-medium">{s.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Campaigns Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="px-6 py-3 text-left">Campaign</th>
                <th className="px-6 py-3 text-left">Platforms</th>
                <th className="px-6 py-3 text-right">Budget</th>
                <th className="px-6 py-3 text-right">Spent</th>
                <th className="px-6 py-3 text-right">Reach</th>
                <th className="px-6 py-3 text-right">Clicks</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {CAMPAIGNS.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white text-sm font-medium">{c.name}</td>
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
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}

