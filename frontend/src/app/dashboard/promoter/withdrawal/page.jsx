'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Clock, CheckCircle, XCircle, ArrowDownToLine, BanknoteIcon, Building2, Phone, ChevronDown } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

const METHOD_LABELS = { BKASH: 'bKash', NAGAD: 'Nagad', BANK_TRANSFER: 'Bank Transfer' }
const BDT_RATE = 110

export default function WithdrawalPage() {
  const [wallet, setWallet] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    amount: '',
    method: 'BKASH',
    phone: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  })

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [wRes, wdRes] = await Promise.all([
        fetch(`${API}/api/withdrawals/my`, { headers }),
        fetch(`${API}/api/withdrawals/my`, { headers }),
      ])
      const data = await wRes.json()
      if (data.wallet) setWallet(data.wallet)
      if (data.withdrawals) setWithdrawals(data.withdrawals)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    const amount = parseFloat(form.amount)
    if (!amount || amount < 10) return setError('Minimum withdrawal amount $10')

    let accountInfo = {}
    if (form.method === 'BKASH' || form.method === 'NAGAD') {
      if (!form.phone) return setError('Phone number দিতে হবে')
      accountInfo = { phone: form.phone }
    } else {
      if (!form.bankName || !form.accountNumber || !form.accountName)
        return setError('Bank এর সব তথ্য দিতে হবে')
      accountInfo = { bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName }
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, method: form.method, accountInfo }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'কিছু একটা সমস্যা হয়েছে')
      setSuccess(`$${amount} withdrawal request সফলভাবে submit হয়েছে!`)
      setShowForm(false)
      setForm({ amount: '', method: 'BKASH', phone: '', bankName: '', accountNumber: '', accountName: '' })
      fetchData()
    } catch (err) {
      setError('Server error')
    } finally {
      setSubmitting(false)
    }
  }

  const statusConfig = {
    PENDING:   { label: 'Pending',   icon: Clock,         cls: 'bg-yellow-500/10 text-yellow-400' },
    COMPLETED: { label: 'Completed', icon: CheckCircle,   cls: 'bg-emerald-500/10 text-emerald-400' },
    FAILED:    { label: 'Rejected',  icon: XCircle,       cls: 'bg-red-500/10 text-red-400' },
  }

  const hasPending = withdrawals.some(w => w.status === 'PENDING')

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Withdrawal 💸</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">তোমার wallet থেকে টাকা তুলো।</p>
          </div>
          {!hasPending && (
            <button
              onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
            >
              <ArrowDownToLine size={16} />
              Withdraw করো
            </button>
          )}
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Available Balance', value: `$${wallet?.balance?.toFixed(2) || '0.00'}`, sub: `৳${((wallet?.balance || 0) * BDT_RATE).toFixed(0)}`, icon: Wallet, color: 'from-violet-500 to-purple-600' },
            { label: 'Pending Withdrawal', value: `$${wallet?.pending?.toFixed(2) || '0.00'}`, sub: `৳${((wallet?.pending || 0) * BDT_RATE).toFixed(0)}`, icon: Clock, color: 'from-yellow-500 to-orange-500' },
            { label: 'Total Earned', value: `$${wallet?.totalEarned?.toFixed(2) || '0.00'}`, sub: `৳${((wallet?.totalEarned || 0) * BDT_RATE).toFixed(0)}`, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4 sm:p-5 min-w-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold truncate">{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5 truncate">{s.sub}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Withdrawal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4 sm:p-6 mb-6 overflow-hidden">
              <h2 className="font-semibold mb-5 flex items-center gap-2">
                <ArrowDownToLine size={16} className="text-violet-400" /> নতুন Withdrawal Request
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Amount (USD) — min $10</label>
                  <input
                    type="number" min="10" placeholder="10"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                  />
                  {form.amount && (
                    <p className="text-xs text-gray-500 mt-1">≈ ৳{(parseFloat(form.amount || 0) * BDT_RATE).toFixed(0)}</p>
                  )}
                </div>

                {/* Method */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Payment Method</label>
                  <div className="relative">
                    <select
                      value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value, phone: '', bankName: '', accountNumber: '', accountName: '' })}
                      className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 appearance-none"
                    >
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* bKash / Nagad */}
                {(form.method === 'BKASH' || form.method === 'NAGAD') && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 mb-1.5 block">{METHOD_LABELS[form.method]} নম্বর</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-gray-500" />
                      <input
                        type="text" placeholder="01XXXXXXXXX"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* Bank Transfer */}
                {form.method === 'BANK_TRANSFER' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Bank Name</label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-3 text-gray-500" />
                        <input
                          type="text" placeholder="Dutch-Bangla Bank"
                          value={form.bankName}
                          onChange={e => setForm({ ...form, bankName: e.target.value })}
                          className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Account Number</label>
                      <input
                        type="text" placeholder="1234567890"
                        value={form.accountNumber}
                        onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                        className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-400 mb-1.5 block">Account Name</label>
                      <input
                        type="text" placeholder="তোমার নাম"
                        value={form.accountName}
                        onChange={e => setForm({ ...form, accountName: e.target.value })}
                        className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                  {submitting ? 'Submitting...' : 'Request করো'}
                </button>
                <button onClick={() => { setShowForm(false); setError('') }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending notice */}
        {hasPending && (
          <div className="mb-6 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
            <Clock size={14} /> একটি withdrawal request pending আছে। Process হওয়ার পর নতুন request করতে পারবে।
          </div>
        )}

        {/* History Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Withdrawal History</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">কোনো withdrawal request নেই।</div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left whitespace-nowrap">Amount</th>
                  <th className="px-6 py-3 text-left whitespace-nowrap">Method</th>
                  <th className="px-6 py-3 text-left whitespace-nowrap">Account</th>
                  <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-right whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.map((w, i) => {
                  const s = statusConfig[w.status] || statusConfig.PENDING
                  const Icon = s.icon
                  const accountDetail = w.accountInfo?.phone || w.accountInfo?.accountNumber || '—'
                  return (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold">${w.amount?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">৳{w.amountBDT}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{METHOD_LABELS[w.method] || w.method}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{accountDetail}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 justify-center w-fit mx-auto ${s.cls}`}>
                          <Icon size={12} /> {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-400 whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-white/5">
              {withdrawals.map((w, i) => {
                const s = statusConfig[w.status] || statusConfig.PENDING
                const Icon = s.icon
                const accountDetail = w.accountInfo?.phone || w.accountInfo?.accountNumber || '—'
                return (
                  <div key={i} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">${w.amount?.toFixed(2)} <span className="text-xs text-gray-500 font-normal">(৳{w.amountBDT})</span></p>
                      <p className="text-xs text-gray-400 mt-1">{METHOD_LABELS[w.method] || w.method} • {accountDetail}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(w.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 shrink-0 ${s.cls}`}>
                      <Icon size={12} /> {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
