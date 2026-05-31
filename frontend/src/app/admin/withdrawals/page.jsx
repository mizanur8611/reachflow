'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle, XCircle, Wallet, BanknoteIcon, Users, ChevronDown } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL
const BDT_RATE = 110
const METHOD_LABELS = { BKASH: 'bKash', NAGAD: 'Nagad', BANK_TRANSFER: 'Bank Transfer' }

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [processingId, setProcessingId] = useState(null)
  const [rejectModal, setRejectModal] = useState(null) // { id, promoterName }
  const [rejectNote, setRejectNote] = useState('')

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const headers = { Authorization: `Bearer ${token}` }
      const query = filterStatus ? `?status=${filterStatus}` : ''

      const [wRes, sRes] = await Promise.all([
        fetch(`${API}/api/withdrawals/admin/all${query}`, { headers }),
        fetch(`${API}/api/withdrawals/admin/stats`, { headers }),
      ])
      const wData = await wRes.json()
      const sData = await sRes.json()
      if (wData.withdrawals) setWithdrawals(wData.withdrawals)
      if (sData.success) setStats(sData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filterStatus])

  const handleApprove = async (id) => {
    setProcessingId(id)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/withdrawals/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) fetchData()
    } catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setProcessingId(rejectModal.id)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/withdrawals/admin/${rejectModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reject', note: rejectNote }),
      })
      if (res.ok) { fetchData(); setRejectModal(null); setRejectNote('') }
    } catch (err) { console.error(err) }
    finally { setProcessingId(null) }
  }

  const statusConfig = {
    PENDING:   { label: 'Pending',   cls: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
    COMPLETED: { label: 'Completed', cls: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
    FAILED:    { label: 'Rejected',  cls: 'bg-red-500/10 text-red-400', icon: XCircle },
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Withdrawals 💸</h1>
          <p className="text-gray-400 mt-1">Promoter দের withdrawal requests manage করো।</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'from-yellow-500 to-orange-500' },
            { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
            { label: 'Rejected', value: stats?.failed || 0, icon: XCircle, color: 'from-red-500 to-rose-600' },
            { label: 'Total Paid (USD)', value: `$${stats?.totalPaidUSD || '0.00'}`, icon: Wallet, color: 'from-violet-500 to-purple-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-5">
          {['', 'PENDING', 'COMPLETED', 'FAILED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {s === '' ? 'All' : s === 'FAILED' ? 'Rejected' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Withdrawal Requests</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">কোনো withdrawal request নেই।</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Promoter</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Method & Account</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.map((w, i) => {
                  const s = statusConfig[w.status] || statusConfig.PENDING
                  const Icon = s.icon
                  const accountDetail = w.accountInfo?.phone || w.accountInfo?.accountNumber || '—'
                  const isProcessing = processingId === w.id
                  return (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{w.promoter?.name}</p>
                        <p className="text-xs text-gray-500">{w.promoter?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">${w.amount?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">৳{w.amountBDT}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300">{METHOD_LABELS[w.method] || w.method}</p>
                        <p className="text-xs text-gray-500">{accountDetail}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 justify-center w-fit mx-auto ${s.cls}`}>
                          <Icon size={12} /> {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-400">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleApprove(w.id)} disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              {isProcessing ? '...' : 'Approve'}
                            </button>
                            <button onClick={() => { setRejectModal({ id: w.id, promoterName: w.promoter?.name }); setRejectNote('') }}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">
                            {w.processedAt ? new Date(w.processedAt).toLocaleDateString() : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null) }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-semibold mb-1">Withdrawal Reject করো</h3>
              <p className="text-sm text-gray-400 mb-4">{rejectModal.promoterName} এর request reject হবে এবং টাকা ফেরত যাবে।</p>
              <label className="text-xs text-gray-400 mb-1.5 block">কারণ (optional)</label>
              <textarea
                rows={3} placeholder="কেন reject করছো?"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={handleReject} disabled={processingId === rejectModal.id}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                  {processingId === rejectModal.id ? 'Processing...' : 'Reject করো'}
                </button>
                <button onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
