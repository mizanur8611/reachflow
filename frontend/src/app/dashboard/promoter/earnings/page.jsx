'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default function EarningsPage() {
  const [wallet, setWallet] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const headers = { 'Authorization': `Bearer ${token}` }

        const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet`, { headers })
        const data1 = await res1.json()
        if (data1.wallet) setWallet(data1.wallet)

        const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/my`, { headers })
        const data2 = await res2.json()
        if (data2.submissions) setSubmissions(data2.submissions)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED')

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Earnings 💰</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your wallet and earnings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Total Balance', value: `$${wallet?.balance?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'from-violet-500 to-purple-600' },
            { label: 'Total Earned', value: `$${wallet?.totalEarned?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
            { label: 'Approved Posts', value: approvedSubmissions.length, icon: CheckCircle, color: 'from-blue-500 to-cyan-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4 sm:p-5 min-w-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold truncate">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Earnings Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Earning History</h2>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : approvedSubmissions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">No earnings yet.</div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Earned</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {approvedSubmissions.map((s, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm font-medium max-w-[260px] truncate">{s.campaign?.title || '-'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1 justify-center w-fit mx-auto">
                        <CheckCircle size={12} /> Approved
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-semibold whitespace-nowrap">
                      ${s.earnedAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-400 whitespace-nowrap">
                      {new Date(s.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {approvedSubmissions.map((s, i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.campaign?.title || '-'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1 shrink-0">
                        <CheckCircle size={11} /> Approved
                      </span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">{new Date(s.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm shrink-0">
                    ${s.earnedAmount?.toFixed(2) || '0.00'}
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

