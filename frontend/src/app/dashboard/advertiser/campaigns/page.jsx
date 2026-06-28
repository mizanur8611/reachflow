'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Megaphone, Users, DollarSign, BarChart2, Eye, Edit, Trash2, Search, Filter } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS = {
  ACTIVE: 'text-green-400 bg-green-400/10 border-green-400/20',
  PAUSED: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  COMPLETED: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  DRAFT: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setCampaigns(data.campaigns || data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  const filtered = campaigns.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Campaigns</h1>
            <p className="text-gray-400 text-sm mt-1">Manage and track your campaigns</p>
          </div>
          <Link href="/dashboard/advertiser/campaigns/new">
            <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <Plus size={16} /> New Campaign
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Campaigns */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg font-medium">No campaigns yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first campaign to get started</p>
            <Link href="/dashboard/advertiser/campaigns/new">
              <button className="mt-6 flex items-center gap-2 mx-auto bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold transition-all">
                <Plus size={16} /> Create Campaign
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((campaign, i) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all min-w-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white text-lg truncate max-w-full">{campaign.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[campaign.status] || STATUS_COLORS.ACTIVE}`}>
                        {campaign.status || 'ACTIVE'}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-1">{campaign.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {campaign.targetPlatforms?.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400">{p}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <DollarSign size={14} className="text-violet-400 shrink-0" />
                        Budget: <span className="text-white font-medium">${campaign.totalBudget}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BarChart2 size={14} className="text-violet-400 shrink-0" />
                        ${campaign.commissionAmount}/{campaign.commissionType === 'PER_POST' ? 'Post' : campaign.commissionType === 'PER_SALE' ? 'Sale' : 'Click'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-violet-400 shrink-0" />
                        {campaign._count?.applications || campaign.promoterCount || 0} Promoters
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/advertiser/campaigns/${campaign.id}`}>
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors" title="View">
                        <Eye size={16} className="text-gray-400" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
