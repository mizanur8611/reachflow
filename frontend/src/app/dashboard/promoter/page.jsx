'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Target, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function PromoterDashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const headers = { 'Authorization': `Bearer ${token}` }

        // Fetch available campaigns
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/available`, { headers })
        const data = await res.json()
        if (data.campaigns) setCampaigns(data.campaigns)

        // Fetch my applications
        const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/my`, { headers })
        const data2 = await res2.json()
        if (data2.applications) setApplications(data2.applications)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApply = async (campaignId) => {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      if (data.success) {
        alert('Applied successfully!')
        setApplications(prev => [...prev, data.application])
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      alert('Cannot connect to server')
    }
  }

  const isApplied = (campaignId) => applications.some(a => a.campaignId === campaignId)

  const STATS = [
    { label: 'Applied Campaigns', value: applications.length.toString(), icon: Target, color: 'from-violet-500 to-purple-600' },
    { label: 'Approved', value: applications.filter(a => a.status === 'APPROVED').length.toString(), icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Pending', value: applications.filter(a => a.status === 'PENDING').length.toString(), icon: Clock, color: 'from-orange-500 to-amber-600' },
    { label: 'Total Earned', value: '$0', icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Promoter Dashboard 🚀</h1>
          <p className="text-gray-400 mt-1">Browse campaigns and start earning.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
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
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Available Campaigns */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Campaigns</h2>
          {loading ? (
            <div className="text-gray-500 text-center py-12">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-gray-500 text-center py-12">No campaigns available yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {campaigns.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{c.title}</h3>
                      <p className="text-gray-400 text-xs mt-1">{c.description}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      ${c.commissionAmount} / {c.commissionType?.replace('PER_', '')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.targetPlatforms?.map(p => (
                      <span key={p} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Budget: ${c.totalBudget}</span>
                    <span>Category: {c.category}</span>
                  </div>
                  <button
                    onClick={() => !isApplied(c.id) && handleApply(c.id)}
                    disabled={isApplied(c.id)}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isApplied(c.id)
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
                    }`}
                  >
                    {isApplied(c.id) ? '✓ Applied' : 'Apply Now'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* My Applications */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">My Applications</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((a, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm font-medium">{a.campaign?.title}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        a.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        a.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-400">
                      {new Date(a.appliedAt).toLocaleDateString()}
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
