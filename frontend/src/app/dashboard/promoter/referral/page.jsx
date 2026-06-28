'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Users, DollarSign, Clock, Gift, TrendingUp, CheckCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ReferralPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const res = await fetch(`${API}/api/referral/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) setData(json)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchReferral()
  }, [])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  )

  const stats = [
    { label: 'Total Referrals', value: data?.totalReferrals || 0, icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Completed', value: data?.completedReferrals || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Pending', value: data?.pendingReferrals || 0, icon: Clock, color: 'from-orange-500 to-amber-600' },
    { label: 'Total Earned', value: `$${(data?.totalEarned || 0).toFixed(2)}`, icon: DollarSign, color: 'from-yellow-500 to-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Gift size={28} className="text-violet-400 shrink-0" /> Referral Program
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">বন্ধুদের invite করো এবং প্রতিটি সফল referral এ <span className="text-emerald-400 font-semibold">$5</span> earn করো!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4 sm:p-5 min-w-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold truncate">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Referral Link Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4 sm:p-6 mb-6">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400" /> তোমার Referral Link
          </h2>
          <p className="text-gray-500 text-sm mb-4">এই link শেয়ার করো — নতুন promoter এই link দিয়ে register করলে এবং প্রথম campaign complete করলে তুমি $5 পাবে।</p>

          {/* Link box */}
          <div className="flex items-center gap-3 bg-[#0f1014] border border-white/10 rounded-xl px-4 py-3 mb-3">
            <span className="text-sm text-violet-300 flex-1 truncate">{data?.referralLink}</span>
            <button onClick={() => handleCopy(data?.referralLink)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium transition-colors shrink-0">
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>

          {/* Code box */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[#0f1014] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Referral Code</p>
                <p className="text-lg font-black tracking-widest text-violet-400">{data?.referralCode}</p>
              </div>
              <button onClick={() => handleCopy(data?.referralCode)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4 sm:p-6 mb-6">
          <h2 className="font-semibold mb-4">কীভাবে কাজ করে?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { step: '01', title: 'Link শেয়ার করো', desc: 'তোমার unique referral link বন্ধু বা social media তে শেয়ার করো', icon: '🔗' },
              { step: '02', title: 'বন্ধু Register করুক', desc: 'তোমার link দিয়ে নতুন promoter ReachFlow এ join করুক', icon: '👤' },
              { step: '03', title: '$5 Earn করো', desc: 'বন্ধু প্রথম campaign approve পেলে তোমার wallet এ $5 add হবে', icon: '💰' },
            ].map((item, i) => (
              <div key={i} className="bg-[#0f1014] border border-white/5 rounded-xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-xs text-violet-400 font-bold mb-1">STEP {item.step}</div>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Referrals List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Referral History</h2>
          </div>
          {!data?.referrals || data.referrals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500 text-sm">এখনো কোনো referral নেই। link শেয়ার করো!</p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left whitespace-nowrap">Date</th>
                  <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-center whitespace-nowrap">Reward</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.referrals.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        r.status === 'REWARDED' ? 'bg-emerald-500/10 text-emerald-400' :
                        r.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`text-sm font-semibold ${r.status === 'REWARDED' ? 'text-emerald-400' : 'text-gray-500'}`}>
                        ${r.rewardAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500 whitespace-nowrap">
                      {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {data.referrals.map((r, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    <span className={`inline-block mt-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                      r.status === 'REWARDED' ? 'bg-emerald-500/10 text-emerald-400' :
                      r.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${r.status === 'REWARDED' ? 'text-emerald-400' : 'text-gray-500'}`}>
                    ${r.rewardAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            </>
          )}
        </motion.div>

      </div>
    </div>
  )
}
