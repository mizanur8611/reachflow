'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MousePointer, Eye, Users, DollarSign, TrendingUp, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL

const PLATFORM_COLORS = {
  FACEBOOK: '#3b82f6',
  INSTAGRAM: '#ec4899',
  TIKTOK: '#9ca3af',
  YOUTUBE: '#ef4444',
  TWITTER: '#0ea5e9',
  LINKEDIN: '#2563eb',
  TELEGRAM: '#06b6d4',
  THREADS: '#a855f7',
  UNKNOWN: '#6b7280',
}

function formatNum(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

export default function CampaignAnalyticsPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const res = await fetch(`${API}/api/campaigns/${id}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch_()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-gray-500 text-sm">Loading analytics...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <p className="text-gray-400">No data found.</p>
    </div>
  )

  const { campaign, totals, platformBreakdown, topPromoters } = data

  // Budget progress
  const budgetPercent = campaign.totalBudget > 0
    ? Math.min((totals.budgetUsed / campaign.totalBudget) * 100, 100)
    : 0

  // Platform pie data
  const pieData = Object.entries(platformBreakdown).map(([platform, stats]) => ({
    name: platform,
    value: stats.submissions,
    clicks: stats.clicks,
    reach: stats.reach,
  }))

  // Top promoters bar data
  const barData = topPromoters.map(p => ({
    name: p.name.split(' ')[0],
    clicks: p.clicks,
    reach: p.reach,
    earned: p.earned,
  }))

  const statCards = [
    { label: 'Total Clicks', value: formatNum(totals.clicks), icon: MousePointer, color: 'from-violet-500 to-purple-600', sub: `${formatNum(totals.trackingClicks)} tracking` },
    { label: 'Total Reach', value: formatNum(totals.reach), icon: Eye, color: 'from-blue-500 to-cyan-600', sub: 'across all posts' },
    { label: 'Approved Posts', value: totals.submissions, icon: Target, color: 'from-emerald-500 to-teal-600', sub: 'submissions' },
    { label: 'Total Paid Out', value: `$${totals.earned.toFixed(2)}`, icon: DollarSign, color: 'from-yellow-500 to-orange-500', sub: `$${totals.budgetRemaining.toFixed(2)} remaining` },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/dashboard/advertiser/campaigns/${id}`}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp size={22} className="text-violet-400" />
              Campaign Analytics
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">{campaign.title}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
            campaign.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
            campaign.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
            'bg-gray-500/10 text-gray-400'
          }`}>
            {campaign.status}
          </span>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
              <p className="text-gray-600 text-xs mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Budget Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Zap size={16} className="text-violet-400" /> Budget Overview</h2>
            <span className="text-sm text-gray-400">{budgetPercent.toFixed(1)}% used</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-400">Spent: <span className="text-white font-semibold">${totals.budgetUsed.toFixed(2)}</span></span>
            <span className="text-gray-400">Total: <span className="text-white font-semibold">${campaign.totalBudget.toFixed(2)}</span></span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${budgetPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>$0</span>
            <span className="text-emerald-500">${totals.budgetRemaining.toFixed(2)} remaining</span>
            <span>${campaign.totalBudget.toFixed(2)}</span>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Platform Breakdown Pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Target size={16} className="text-violet-400" /> Platform Breakdown
            </h2>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No submissions yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={PLATFORM_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                      formatter={(val, name, props) => [`${val} posts`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map((p, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.name] || '#6b7280' }} />
                      {p.name}: {p.clicks} clicks
                    </span>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Top Promoters Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-violet-400" /> Top Promoters by Clicks
            </h2>
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                  />
                  <Bar dataKey="clicks" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Top Promoters Table */}
        {topPromoters.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">Promoter Performance</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Promoter</th>
                  <th className="px-6 py-3 text-center">Posts</th>
                  <th className="px-6 py-3 text-center">Clicks</th>
                  <th className="px-6 py-3 text-center">Reach</th>
                  <th className="px-6 py-3 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topPromoters.map((p, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">{p.submissions}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">{formatNum(p.clicks)}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-300">{formatNum(p.reach)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-emerald-400">${p.earned.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

      </div>
    </div>
  )
}
