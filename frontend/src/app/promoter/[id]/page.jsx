'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Star, Users, TrendingUp, CheckCircle, ExternalLink,
  Briefcase, Calendar, Award, ChevronRight, Globe, Zap
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

const PLATFORM_CONFIG = {
  FACEBOOK:  { color: 'from-blue-600 to-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   text: 'text-blue-400',  icon: '📘' },
  INSTAGRAM: { color: 'from-pink-600 to-rose-400',   bg: 'bg-pink-500/10 border-pink-500/20',   text: 'text-pink-400',  icon: '📸' },
  TIKTOK:    { color: 'from-gray-600 to-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20',   text: 'text-gray-300',  icon: '🎵' },
  YOUTUBE:   { color: 'from-red-600 to-red-400',     bg: 'bg-red-500/10 border-red-500/20',     text: 'text-red-400',   icon: '▶️' },
  TWITTER:   { color: 'from-sky-600 to-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',     text: 'text-sky-400',   icon: '🐦' },
  LINKEDIN:  { color: 'from-blue-700 to-blue-500',   bg: 'bg-blue-600/10 border-blue-600/20',   text: 'text-blue-500',  icon: '💼' },
  TELEGRAM:  { color: 'from-cyan-600 to-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20',   text: 'text-cyan-400',  icon: '✈️' },
  THREADS:   { color: 'from-purple-600 to-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', icon: '@' },
}

function formatFollowers(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function timeAgo(date) {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function PublicPromoterProfile({ params }) {
  const { id } = params
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/api/public/promoter/${id}`)
        const json = await res.json()
        if (!json.success) { setNotFound(true); return }
        setData(json.data)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-gray-500 text-sm">Loading profile...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-xl font-bold text-white mb-2">Promoter not found</h2>
        <p className="text-gray-500 text-sm">This profile doesn't exist or has been removed.</p>
      </div>
    </div>
  )

  const p = data.promoter
  const totalFollowers = p.socialAccounts?.reduce((sum, s) => sum + (s.followers || 0), 0) || 0
  const completedCampaigns = p._count?.submissions || 0
  const memberSince = new Date(data.createdAt).getFullYear()

  const stats = [
    { label: 'Total Followers', value: formatFollowers(totalFollowers), icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Campaigns Done', value: completedCampaigns, icon: Briefcase, color: 'from-emerald-500 to-teal-600' },
    { label: 'Avg Engagement', value: `${p.avgEngagement?.toFixed(1) || '0.0'}%`, icon: TrendingUp, color: 'from-blue-500 to-cyan-600' },
    { label: 'Rating', value: p.rating?.toFixed(1) || '0.0', icon: Star, color: 'from-yellow-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-10">

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1b23] border border-white/5 rounded-3xl overflow-hidden mb-6"
        >
          {/* Cover gradient */}
          <div className="h-28 bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-[#1a1b23] relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
          </div>

          <div className="px-7 pb-7 -mt-12 relative">
            <div className="flex items-end justify-between flex-wrap gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-4xl font-black border-4 border-[#1a1b23] shadow-xl">
                  {data.avatar
                    ? <img src={data.avatar} alt={data.name} className="w-full h-full object-cover rounded-xl" />
                    : data.name?.[0]?.toUpperCase()
                  }
                </div>
                {p.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#1a1b23]">
                    <CheckCircle size={13} className="text-white" />
                  </div>
                )}
              </div>

              {/* Contact button (for advertisers) */}
              <motion.a
                href={`/dashboard/advertiser/messages`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
              >
                <Zap size={15} />
                Contact Promoter
              </motion.a>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">{data.name}</h1>
                {p.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle size={10} /> Verified
                  </span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-gray-400">
                {p.country && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-gray-500" /> {p.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-gray-500" /> Member since {memberSince}
                </span>
              </div>

              {p.bio && (
                <p className="mt-3 text-gray-300 text-sm leading-relaxed max-w-xl">{p.bio}</p>
              )}

              {/* Niches */}
              {p.niche?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.niche.map(n => (
                    <span key={n} className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-medium">
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={16} className="text-white" />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Social Accounts */}
        {p.socialAccounts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 mb-6"
          >
            <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe size={14} /> Social Platforms
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {p.socialAccounts.map((s, i) => {
                const cfg = PLATFORM_CONFIG[s.platform] || { bg: 'bg-white/5 border-white/10', text: 'text-gray-400', icon: '🔗' }
                return (
                  <motion.a
                    key={i}
                    href={s.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    whileHover={{ x: 4 }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${cfg.bg} group transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cfg.icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${cfg.text}`}>{s.username}</p>
                        <p className="text-xs text-gray-500">{formatFollowers(s.followers)} followers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {s.verified && <CheckCircle size={13} className="text-emerald-400" />}
                      <ExternalLink size={13} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden"
        >
          {/* Tab Headers */}
          <div className="flex border-b border-white/5">
            {[
              { id: 'campaigns', label: 'Completed Campaigns', count: p.submissions?.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{tab.count}</span>
                )}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                )}
              </button>
            ))}
          </div>

          {/* Campaign Cards */}
          <div className="p-5">
            {!p.submissions || p.submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500 text-sm">No completed campaigns yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {p.submissions.map((sub, i) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    className="bg-[#0f1014] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group"
                  >
                    {/* Campaign image */}
                    {sub.campaign?.productImages?.[0] && (
                      <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-white/5">
                        <img
                          src={sub.campaign.productImages[0]}
                          alt={sub.campaign.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{sub.campaign?.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sub.campaign?.advertiser?.businessName}</p>
                      </div>
                      {sub.platform && (
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${PLATFORM_CONFIG[sub.platform]?.bg || 'bg-white/5'} ${PLATFORM_CONFIG[sub.platform]?.text || 'text-gray-400'} border`}>
                          {sub.platform}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {sub.clicks > 0 && <span>{sub.clicks.toLocaleString()} clicks</span>}
                        {sub.reach > 0 && <span>{formatFollowers(sub.reach)} reach</span>}
                      </div>
                      <span className="text-xs text-gray-600">{timeAgo(sub.submittedAt)}</span>
                    </div>

                    <a
                      href={sub.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      View post <ExternalLink size={11} />
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">
          Powered by <span className="text-violet-500 font-medium">ReachFlow</span>
        </p>
      </div>
    </div>
  )
}
