'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, ArrowUpRight, CreditCard, Smartphone, Globe, Bitcoin, X, Copy, Check, RefreshCw, ArrowDownLeft } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('rf_token') : null
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

const METHODS = [
  { id: 'stripe', label: 'Credit / Debit Card', icon: CreditCard, color: 'from-blue-500 to-cyan-500', currency: 'USD' },
  { id: 'paypal', label: 'PayPal', icon: Globe, color: 'from-blue-600 to-indigo-600', currency: 'USD' },
  { id: 'bkash', label: 'bKash', icon: Smartphone, color: 'from-pink-500 to-rose-600', currency: 'BDT' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, color: 'from-orange-500 to-amber-600', currency: 'BDT' },
  { id: 'crypto', label: 'USDT (TRC20)', icon: Bitcoin, color: 'from-yellow-500 to-orange-500', currency: 'USD' },
]

const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400',
  PENDING: 'bg-amber-500/10 text-amber-400',
  FAILED: 'bg-red-500/10 text-red-400',
  REFUNDED: 'bg-blue-500/10 text-blue-400',
}

const TYPE_LABELS = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  CAMPAIGN_PAYMENT: 'Campaign',
  COMMISSION_EARNED: 'Commission',
  PLATFORM_FEE: 'Platform Fee',
  REFUND: 'Refund',
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState('stripe')
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [cryptoInfo, setCryptoInfo] = useState(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/payment/wallet`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setWallet(data.wallet)
      else showToast(data.error || 'Failed to load wallet', 'error')
    } catch {
      showToast('Failed to load wallet', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWallet()
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const method = params.get('method')
    if (status === 'success') showToast(`${method?.toUpperCase() || 'Payment'} successful!`, 'success')
    if (status === 'failed') showToast('Payment was cancelled or failed.', 'error')
    if (status) window.history.replaceState({}, '', window.location.pathname)
  }, [fetchWallet])

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) return showToast('Enter a valid amount', 'error')
    setPaying(true)
    try {
      if (selected === 'stripe') {
        const res = await fetch(`${API}/api/payment/stripe/create-intent`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ amount: parseFloat(amount) })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        showToast('Stripe: Integrate Stripe.js with clientSecret in production', 'success')
      }
      else if (selected === 'paypal') {
        const res = await fetch(`${API}/api/payment/paypal/create-order`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ amount: parseFloat(amount) })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        showToast('PayPal: Integrate PayPal SDK with orderId in production', 'success')
      }
      else if (selected === 'bkash') {
        const res = await fetch(`${API}/api/payment/bkash/create-payment`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ amount: parseFloat(amount) })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        window.location.href = data.bkashURL
      }
      else if (selected === 'nagad') {
        const res = await fetch(`${API}/api/payment/nagad/create-payment`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ amount: parseFloat(amount) })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        window.location.href = data.redirectUrl
      }
      else if (selected === 'crypto') {
        const res = await fetch(`${API}/api/payment/crypto/create-payment`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ amount: parseFloat(amount) })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setCryptoInfo(data)
        setShowModal(false)
      }
    } catch (err) {
      showToast(err.message || 'Payment failed', 'error')
    } finally {
      setPaying(false)
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(cryptoInfo.payAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedMethod = METHODS.find(m => m.id === selected)
  const isBDT = selectedMethod?.currency === 'BDT'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Wallet</h1>
            <p className="text-gray-400 mt-1">Manage your balance and transactions</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchWallet} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <Plus size={16} /> Add Money
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Available Balance', value: `$${(wallet?.balance || 0).toFixed(2)}`, icon: Wallet, color: 'from-violet-500 to-purple-600' },
            { label: 'Pending', value: `$${(wallet?.pending || 0).toFixed(2)}`, icon: ArrowUpRight, color: 'from-amber-500 to-orange-600' },
            { label: 'Total Deposited', value: `$${(wallet?.totalEarned || 0).toFixed(2)}`, icon: ArrowDownLeft, color: 'from-emerald-500 to-teal-600' },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4`}>
                <c.icon size={22} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{c.value}</p>
              <p className="text-gray-400 text-sm mt-1">{c.label}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {cryptoInfo && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-[#1a1b23] border border-yellow-500/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-yellow-400 flex items-center gap-2"><Bitcoin size={18} /> Send USDT (TRC20)</h3>
                  <p className="text-gray-400 text-sm mt-1">Send exactly <span className="text-white font-semibold">{cryptoInfo.payAmount} USDT</span></p>
                </div>
                <button onClick={() => setCryptoInfo(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="bg-black/30 rounded-xl p-4 flex items-center justify-between gap-3">
                <code className="text-yellow-400 text-sm break-all">{cryptoInfo.payAddress}</code>
                <button onClick={copyAddress} className="shrink-0 p-2 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 transition-all">
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-yellow-400" />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-3">Balance updates after network confirmation (1-5 mins)</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Transaction History</h2>
          </div>
          {!wallet?.transactions?.length ? (
            <div className="px-6 py-12 text-center text-gray-500">No transactions yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Method</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {wallet.transactions.map((tx) => {
                  const isCredit = ['DEPOSIT', 'COMMISSION_EARNED', 'REFUND'].includes(tx.type)
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <p className="text-white text-sm">{tx.description || TYPE_LABELS[tx.type] || tx.type}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4"><span className="bg-white/5 text-gray-400 text-xs px-2 py-1 rounded-full">{tx.method}</span></td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[tx.status] || 'bg-white/5 text-gray-400'}`}>{tx.status}</span>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold text-sm ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#12131a] border border-white/10 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Add Money</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1.5 block">
                  Amount ({isBDT ? 'BDT' : 'USD'}) {isBDT && <span className="text-gray-500">≈ ${(parseFloat(amount || 0) / 110).toFixed(2)} USD</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{isBDT ? '৳' : '$'}</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div className="flex gap-2 mt-2">
                  {(isBDT ? [500, 1000, 2000, 5000] : [10, 25, 50, 100]).map(a => (
                    <button key={a} onClick={() => setAmount(a.toString())}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${parseFloat(amount) === a ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                      {isBDT ? '৳' : '$'}{a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setSelected(m.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${selected === m.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                      <m.icon size={16} className="text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">{m.label}</span>
                    <span className="ml-auto text-gray-500 text-xs">{m.currency}</span>
                  </button>
                ))}
              </div>
              <button onClick={handlePay} disabled={paying || !amount || parseFloat(amount) <= 0}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                {paying && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Pay {isBDT ? '৳' : '$'}{amount || '0'} via {selectedMethod?.label}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl font-medium text-sm shadow-xl z-50 ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

