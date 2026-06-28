'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DollarSign, Users, MousePointer, TrendingUp, Eye, Target, Plus, ChevronRight, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AdvertiserDashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const headers = { Authorization: `Bearer ${token}` }

        const [cRes, wRes] = await Promise.all([
          fetch(`${API}/api/campaigns`, { headers }),
          fetch(`${API}/api/wallet`, { headers }),
        ])

        const cData = await cRes.json()
        const wData = await wRes.json()

        if (cData.campaigns) {
          setCampaigns(cData.campaigns)

          // Analytics calculate from campaigns
          const totalBudget = cData.campaigns.reduce((a, c) => a + (c.totalBudget || 0), 0)
          const totalSpent = cData.campaigns.reduce((a, c) => a + (c.spentBudget || 0), 0)
          const activeCampaigns = cData.campaigns.filter(c => c.status === 'ACTIVE').length
          const totalApplications = cData.campaigns.reduce((a, c) => a + (c._count?.applications || 0), 0)

          setAnalytics({
            totalCampaigns: cData.campaigns.length,
            activeCampaigns,
            totalBudget,
            totalSpent,
            totalApplications,
          })
        }

        if (wData.wallet) setWallet(wData.wallet)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const STATS = [
    { label: 'Total Campaigns', value: analytics?.totalCampaigns || 0, icon: Target, color: 'from-violet-500 to-purple-600' },
    { label: 'Active Campaigns', value: analytics?.activeCampaigns || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Total Budget', value: `$${analytics?.totalBudget?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
    { label: 'Total Spent', value: `$${analytics?.totalSpent?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'from-pink-500 to-rose-600' },
    { label: 'Applications', value: analytics?.totalApplications || 0, icon: Users, color: 'from-orange-500 to-amber-600' },
    { label: 'Wallet Balance', value: `$${wallet?.balance?.toFixed(2) || '0.00'}`, icon: Eye, color: 'from-indigo-500 to-blue-600' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard 👋</h1>
            <p className="text-gray-400 mt-1">Here's what's happening with your campaigns today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/advertiser/wallet">
              <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm text-white">
                💰 Wallet: ${wallet?.balance?.toFixed(2) || '0.00'}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white mt-3">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Campaign Performance */}
        {campaigns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {campaigns.slice(0, 3).map((c, i) => {
              const spent = c.spentBudget || 0
              const budget = c.totalBudget || 1
              const percent = Math.min((spent / budget) * 100, 100).toFixed(0)
              return (
                <div key={i} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-violet-500/20 transition-colors"
                  onClick={() => router.push(`/dashboard/advertiser/campaigns/${c.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-semibold truncate flex-1 mr-2">{c.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.status}
                    </span>
                  </div>
                  {/* Budget progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Spent: ${spent.toFixed(2)}</span>
                      <span>Budget: ${budget.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{percent}% used</p>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={11} /> {c._count?.applications || 0} applied</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(c.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* Campaigns Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Recent Campaigns</h2>
            <Link href="/dashboard/advertiser/campaigns" className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                <th className="px-6 py-3 text-left">Campaign</th>
                <th className="px-6 py-3 text-left">Platforms</th>
                <th className="px-6 py-3 text-right">Budget</th>
                <th className="px-6 py-3 text-right">Spent</th>
                <th className="px-6 py-3 text-center">Applications</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No campaigns yet. <Link href="/dashboard/advertiser/campaigns/new" className="text-violet-400">Create one!</Link>
                </td></tr>
              ) : (
                campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/advertiser/campaigns/${c.id}`)}>
                    <td className="px-6 py-4 text-white text-sm font-medium">{c.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.targetPlatforms?.slice(0, 2).map(p => (
                          <span key={p} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                        {c.targetPlatforms?.length > 2 && (
                          <span className="bg-white/5 text-gray-500 text-xs px-2 py-0.5 rounded-full">+{c.targetPlatforms.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-300">${c.totalBudget}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-400">${c.spentBudget?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">{c._count?.applications || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                        c.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400' :
                        c.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-gray-500/10 text-gray-400'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
