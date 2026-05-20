'use client'
// ReachFlow - Promoter Dashboard
// File: frontend/src/app/dashboard/promoter/page.jsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Star, Clock, ChevronRight, Search, Filter, Zap, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import AIContentModal from '@/components/ai/AIContentModal'

const PLATFORM_ICONS = {
  FACEBOOK: '📘', TIKTOK: '🎵', INSTAGRAM: '📸',
  YOUTUBE: '▶️', WHATSAPP: '💬', TELEGRAM: '✈️',
  TWITTER: '𝕏', LINKEDIN: '💼', THREADS: '🧵'
}

export default function PromoterDashboard() {
  const [filter, setFilter] = useState({ platform: '', category: '' })
  const [aiModal, setAiModal] = useState(null)
  const queryClient = useQueryClient()

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['browse-campaigns', filter],
    queryFn: () => api.get('/campaign/browse', { params: filter }).then(r => r.data.campaigns)
  })

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/payment/wallet').then(r => r.data.wallet)
  })

  const { data: mySubmissions } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => api.get('/promoter/submissions').then(r => r.data.submissions)
  })

  const applyMutation = useMutation({
    mutationFn: (campaignId) => api.post(`/campaign/${campaignId}/apply`),
    onSuccess: () => { toast.success('Application submitted! ✅'); queryClient.invalidateQueries(['browse-campaigns']) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to apply')
  })

  const totalEarned = wallet?.totalEarned ?? 1850
  const pending = wallet?.pending ?? 450
  const balance = wallet?.balance ?? 1200

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex">
      <Sidebar role="promoter" />

      <div className="flex-1 ml-64">
        <TopBar />

        <main className="p-8 overflow-y-auto h-[calc(100vh-64px)]">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold text-white">Welcome back! 👋</h1>
            <p className="text-gray-400 mt-1">Find campaigns and start earning today.</p>
          </motion.div>

          {/* Earnings Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Earned', value: `$${totalEarned.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-teal-600', sub: '+20.5% this month' },
              { label: 'Available Balance', value: `$${balance.toLocaleString()}`, icon: TrendingUp, color: 'from-violet-500 to-purple-600', sub: 'Ready to withdraw' },
              { label: 'Pending Approval', value: `$${pending}`, icon: Clock, color: 'from-amber-500 to-orange-600', sub: 'Under review' },
              { label: 'Avg. Rating', value: '4.8/5', icon: Star, color: 'from-pink-500 to-rose-600', sub: '124 reviews' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                  <card.icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-gray-400 text-xs mt-1">{card.label}</p>
                <p className="text-emerald-400 text-xs mt-1">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Withdraw Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-white">Ready to withdraw ${balance}?</p>
              <p className="text-gray-400 text-sm mt-1">Via bKash, Nagad, PayPal or USDT</p>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard/promoter/withdraw'}
              className="bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Withdraw Now
            </button>
          </motion.div>

          {/* Campaign Browser */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Available Campaigns</h2>

              <div className="flex gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    placeholder="Search campaigns..."
                    className="bg-[#1a1b23] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 w-52"
                  />
                </div>

                <select
                  value={filter.platform}
                  onChange={e => setFilter(f => ({ ...f, platform: e.target.value }))}
                  className="bg-[#1a1b23] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none"
                >
                  <option value="">All Platforms</option>
                  {Object.keys(PLATFORM_ICONS).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                  value={filter.category}
                  onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                  className="bg-[#1a1b23] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none"
                >
                  <option value="">All Categories</option>
                  {['Fashion', 'Food', 'Technology', 'Health', 'Gaming'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#1a1b23] rounded-2xl h-52 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {(campaigns ?? SAMPLE_CAMPAIGNS).map((campaign, i) => (
                  <CampaignCard
                    key={campaign.id ?? i}
                    campaign={campaign}
                    onApply={() => applyMutation.mutate(campaign.id)}
                    onAISuggest={() => setAiModal(campaign)}
                    isApplying={applyMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {aiModal && <AIContentModal campaign={aiModal} onClose={() => setAiModal(null)} />}
    </div>
  )
}

function CampaignCard({ campaign, onApply, onAISuggest, isApplying }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
    >
      {campaign.productImages?.[0] && (
        <div className="h-36 overflow-hidden">
          <img src={campaign.productImages[0]} alt={campaign.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white text-sm leading-tight">{campaign.title}</h3>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
            ${campaign.commissionAmount}
          </span>
        </div>

        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{campaign.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {campaign.targetPlatforms?.map(p => (
            <span key={p} className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-gray-400">
              {PLATFORM_ICONS[p]} {p}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{campaign.commissionType?.replace('_', ' ')}</span>
          <span>👥 {campaign._count?.applications ?? 0} applied</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onApply}
            disabled={isApplying}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            Apply Now
          </button>
          <button
            onClick={onAISuggest}
            className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors"
            title="Get AI content suggestions"
          >
            <Zap size={13} className="text-amber-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Sample data for preview
const SAMPLE_CAMPAIGNS = [
  { id: '1', title: 'Fashion Brand Promo', description: 'Promote our summer collection to your followers. Original content required.', targetPlatforms: ['TIKTOK', 'INSTAGRAM'], commissionAmount: 15, commissionType: 'PER_POST', productImages: [], _count: { applications: 12 } },
  { id: '2', title: 'Skincare Product Review', description: 'Review our new skincare line. Must show before/after results.', targetPlatforms: ['INSTAGRAM', 'YOUTUBE'], commissionAmount: 25, commissionType: 'PER_POST', productImages: [], _count: { applications: 8 } },
  { id: '3', title: 'Healthy Food Delivery', description: 'Share your meal experience and use our referral code for extra commission.', targetPlatforms: ['FACEBOOK', 'TELEGRAM'], commissionAmount: 10, commissionType: 'PER_SALE', productImages: [], _count: { applications: 34 } },
  { id: '4', title: 'Tech Gadget Unboxing', description: 'Unbox and review our latest smart home device. Keep the product!', targetPlatforms: ['YOUTUBE', 'TIKTOK'], commissionAmount: 50, commissionType: 'PER_POST', productImages: [], _count: { applications: 5 } },
  { id: '5', title: 'App Install Drive', description: 'Get people to install and register on our app. Per install commission.', targetPlatforms: ['FACEBOOK', 'WHATSAPP', 'TELEGRAM'], commissionAmount: 2, commissionType: 'PER_SALE', productImages: [], _count: { applications: 67 } },
  { id: '6', title: 'Online Course Promo', description: 'Promote our digital marketing course. High ticket = high commission.', targetPlatforms: ['LINKEDIN', 'FACEBOOK'], commissionAmount: 100, commissionType: 'PER_SALE', productImages: [], _count: { applications: 3 } },
]
