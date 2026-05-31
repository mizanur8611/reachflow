'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Star, TrendingUp, DollarSign, Crown } from 'lucide-react'

export default function LeaderboardPage() {
  const [promoters, setPromoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const headers = { Authorization: `Bearer ${token}` }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`, { headers })
        const data = await res.json()
        if (data.promoters) {
          setPromoters(data.promoters)
          setMyRank(data.myRank)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={18} className="text-yellow-400" />
    if (rank === 2) return <Medal size={18} className="text-gray-300" />
    if (rank === 3) return <Medal size={18} className="text-amber-600" />
    return <span className="text-gray-500 text-sm font-bold">#{rank}</span>
  }

  const getRankBg = (rank) => {
    if (rank === 1) return 'border-yellow-500/30 bg-yellow-500/5'
    if (rank === 2) return 'border-gray-400/30 bg-gray-400/5'
    if (rank === 3) return 'border-amber-600/30 bg-amber-600/5'
    return 'border-white/5'
  }

  const top3 = promoters.slice(0, 3)
  const rest = promoters.slice(3)

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Leaderboard 🏆</h1>
          <p className="text-gray-400 mt-1">Top performing promoters on ReachFlow</p>
        </div>

        {/* My Rank */}
        {myRank && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star size={18} className="text-violet-400" />
              <span className="text-sm text-violet-300">তোমার rank</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white font-bold">#{myRank.rank}</span>
              <span className="text-gray-400">${myRank.totalEarned?.toFixed(2)} earned</span>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : promoters.length === 0 ? (
          <div className="text-center text-gray-500 py-20">কোনো data নেই এখনো।</div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-[#1a1b23] border border-gray-400/20 rounded-2xl p-5 text-center mt-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    {top3[1]?.name?.[0] || '?'}
                  </div>
                  <Medal size={20} className="text-gray-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm truncate">{top3[1]?.name}</p>
                  <p className="text-emerald-400 font-bold mt-1">${top3[1]?.totalEarned?.toFixed(2)}</p>
                  <p className="text-gray-500 text-xs mt-1">{top3[1]?.submissionCount || 0} posts</p>
                </motion.div>

                {/* 1st Place */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                  className="bg-[#1a1b23] border border-yellow-500/30 bg-yellow-500/5 rounded-2xl p-5 text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    #1
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 mt-2">
                    {top3[0]?.name?.[0] || '?'}
                  </div>
                  <Crown size={22} className="text-yellow-400 mx-auto mb-2" />
                  <p className="font-bold truncate">{top3[0]?.name}</p>
                  <p className="text-emerald-400 font-bold text-lg mt-1">${top3[0]?.totalEarned?.toFixed(2)}</p>
                  <p className="text-gray-500 text-xs mt-1">{top3[0]?.submissionCount || 0} posts</p>
                </motion.div>

                {/* 3rd Place */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-[#1a1b23] border border-amber-600/20 rounded-2xl p-5 text-center mt-10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    {top3[2]?.name?.[0] || '?'}
                  </div>
                  <Medal size={20} className="text-amber-600 mx-auto mb-2" />
                  <p className="font-semibold text-sm truncate">{top3[2]?.name}</p>
                  <p className="text-emerald-400 font-bold mt-1">${top3[2]?.totalEarned?.toFixed(2)}</p>
                  <p className="text-gray-500 text-xs mt-1">{top3[2]?.submissionCount || 0} posts</p>
                </motion.div>
              </div>
            )}

            {/* Rest of the list */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="font-semibold">All Rankings</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                    <th className="px-6 py-3 text-left">Rank</th>
                    <th className="px-6 py-3 text-left">Promoter</th>
                    <th className="px-6 py-3 text-center">Posts</th>
                    <th className="px-6 py-3 text-right">Total Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {promoters.map((p, i) => (
                    <tr key={i} className={`hover:bg-white/[0.02] border ${getRankBg(i + 1)}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(i + 1)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {p.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.country || 'Bangladesh'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-400">
                        {p.submissionCount || 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-emerald-400 font-semibold">${p.totalEarned?.toFixed(2)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
