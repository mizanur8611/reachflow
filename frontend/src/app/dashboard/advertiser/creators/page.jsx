'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Users, TrendingUp, ExternalLink } from 'lucide-react'

export default function CreatorsPage() {
  const [promoters, setPromoters] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all') // 'all' | 'applied'
  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : null

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all campaigns to get applicants
      const campRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const campData = await campRes.json()

      // Collect all applications from all campaigns
      const allApps = []
      if (campData.campaigns) {
        for (const camp of campData.campaigns) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/${camp.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (data.campaign?.applications) {
            data.campaign.applications.forEach(app => {
              allApps.push({ ...app, campaignTitle: camp.title })
            })
          }
        }
      }
      setApplications(allApps)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Unique promoters from applications
  const appliedPromoters = applications.reduce((acc, app) => {
    if (app.promoter && !acc.find(p => p.id === app.promoter.id)) {
      acc.push({
        ...app.promoter,
        campaigns: applications.filter(a => a.promoter?.id === app.promoter.id).map(a => a.campaignTitle),
        status: app.status
      })
    }
    return acc
  }, [])

  const filtered = appliedPromoters.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.country?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Creators</h1>
        <p className="text-gray-400 text-sm mt-1">Promoters who applied to your campaigns</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
          placeholder="Search by name or country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Total Creators</p>
          <p className="text-2xl font-bold text-white mt-1">{appliedPromoters.length}</p>
        </div>
        <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {appliedPromoters.filter(p => p.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {appliedPromoters.filter(p => p.status === 'PENDING').length}
          </p>
        </div>
      </div>

      {/* Creators List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p>No creators found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((promoter, i) => (
            <motion.div
              key={promoter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {promoter.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{promoter.user?.name || 'Unknown'}</h3>
                    <p className="text-gray-400 text-sm">{promoter.country || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    promoter.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    promoter.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {promoter.status}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Star size={14} className="text-yellow-400 mx-auto mb-1" />
                  <p className="text-white text-sm font-semibold">{promoter.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-gray-500 text-xs">Rating</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <TrendingUp size={14} className="text-violet-400 mx-auto mb-1" />
                  <p className="text-white text-sm font-semibold">${promoter.totalEarned?.toFixed(0) || '0'}</p>
                  <p className="text-gray-500 text-xs">Earned</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Users size={14} className="text-blue-400 mx-auto mb-1" />
                  <p className="text-white text-sm font-semibold">{promoter.campaigns?.length || 0}</p>
                  <p className="text-gray-500 text-xs">Campaigns</p>
                </div>
              </div>

              {/* Campaigns */}
              {promoter.campaigns?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {promoter.campaigns.map((c, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-gray-400">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

