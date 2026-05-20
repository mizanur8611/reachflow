'use client'
// ReachFlow - Wallet & Payment Page
// File: frontend/src/app/dashboard/advertiser/wallet/page.jsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Globe, Bitcoin, Check, Copy } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { format } from 'date-fns'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex', color: 'from-blue-500 to-cyan-500' },
  { id: 'paypal', label: 'PayPal', icon: Globe, desc: 'Global payment', color: 'from-blue-600 to-indigo-600' },
  { id: 'bkash', label: 'bKash', icon: Smartphone, desc: 'Bangladesh mobile banking', color: 'from-pink-500 to-rose-600' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, desc: 'Bangladesh mobile banking', color: 'from-orange-500 to-amber-600' },
  { id: 'crypto', label: 'USDT (TRC20)', icon: Bitcoin, desc: 'Crypto payment', color: 'from-yellow-500 to-orange-500' },
]

const TX_TYPE_COLORS = {
  DEPOSIT: 'text-emerald-400',
  WITHDRAWAL: 'text-red-400',
  CAMPAIGN_PAYMENT: 'text-amber-400',
  COMMISSION_EARNED: 'text-emerald-400',
  PLATFORM_FEE: 'text-red-400',
  REFUND: 'text-blue-400',
}

export default function WalletPage() {
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('stripe')
  const [amount, setAmount] = useState('')
  const queryClient = useQueryClient()

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/payment/wallet').then(r => r.data.wallet)
  })

  const wallet = walletData ?? { balance: 1250, pending: 450, totalEarned: 3200, transactions: SAMPLE_TXS }

  const paypalMutation = useMutation({
    mutationFn: async (amt) => {
      const { data } = await api.post('/payment/paypal/create-order', { amount: amt })
      window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${data.orderId}`
    }
  })

  const bkashMutation = useMutation({
    mutationFn: async (amt) => {
      const { data } = await api.post('/payment/bkash/create-payment', { amount: amt })
      window.location.href = data.bkashURL
    },
    onError: () => toast.error('bKash payment failed')
  })

  const nagadMutation = useMutation({
    mutationFn: async (amt) => {
      const { data } = await api.post('/payment/nagad/create-payment', { amount: amt })
      window.location.href = data.redirectUrl
    }
  })

  const cryptoMutation = useMutation({
    mutationFn: (amt) => api.post('/payment/crypto/create-payment', { amount: amt }).then(r => r.data),
    onSuccess: (data) => {
      toast((t) => (
        <div className="text-sm">
          <p className="font-semibold mb-1">Send {data.payAmount} USDT to:</p>
          <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{data.payAddress}</p>
        </div>
      ), { duration: 20000 })
    }
  })

  const handlePay = () => {
    if (!amount || parseFloat(amount) < 5) return toast.error('Minimum deposit is $5')
    const amt = parseFloat(amount)

    switch (selectedMethod) {
      case 'paypal': paypalMutation.mutate(amt); break
      case 'bkash': bkashMutation.mutate(amt * 110); break  // USD to BDT
      case 'nagad': nagadMutation.mutate(amt * 110); break
      case 'crypto': cryptoMutation.mutate(amt); break
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex">
      <Sidebar role="advertiser" />

      <div className="flex-1 ml-64">
        <TopBar />

        <main className="p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Wallet</h1>
              <p className="text-gray-400 mt-1">Manage your balance and transactions</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddMoney(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-5 py-2.5 rounded-xl font-semibold text-sm"
            >
              <Plus size={16} /> Add Money
            </motion.button>
          </motion.div>

          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {[
              { label: 'Available Balance', value: `$${wallet.balance?.toLocaleString()}`, icon: Wallet, color: 'from-violet-500 to-purple-600', sub: 'Ready to use' },
              { label: 'Pending', value: `$${wallet.pending ?? 450}`, icon: ArrowDownLeft, color: 'from-amber-500 to-orange-600', sub: 'Under review' },
              { label: 'Total Deposited', value: `$${wallet.totalEarned?.toLocaleString() ?? 3200}`, icon: ArrowUpRight, color: 'from-emerald-500 to-teal-600', sub: 'All time' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4`}>
                  <c.icon size={22} className="text-white" />
                </div>
                <p className="text-3xl font-bold text-white">{c.value}</p>
                <p className="text-gray-400 text-sm mt-1">{c.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Transaction History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Transaction History</h2>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Method</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(wallet.transactions ?? SAMPLE_TXS).map((tx, i) => (
                  <tr key={tx.id ?? i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{tx.description ?? 'Transaction'}</p>
                      <p className="text-gray-500 text-xs">{tx.reference ?? `REF-${tx.id}`}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/5 text-gray-400 text-xs px-2 py-1 rounded-full">{tx.method}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy') : 'May 18, 2026'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.status ?? 'COMPLETED'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${TX_TYPE_COLORS[tx.type] ?? 'text-white'}`}>
                      {['WITHDRAWAL', 'CAMPAIGN_PAYMENT', 'PLATFORM_FEE'].includes(tx.type) ? '-' : '+'}${tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </main>
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddMoney(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#12131a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-1">Add Money</h2>
              <p className="text-gray-400 text-sm mb-5">Choose your payment method</p>

              {/* Amount */}
              <div className="mb-5">
                <label className="text-sm text-gray-400 mb-1.5 block">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-xl font-bold outline-none focus:border-violet-500"
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50, 100, 250].map(a => (
                    <button key={a} onClick={() => setAmount(a.toString())} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${amount == a ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                      ${a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 mb-5">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                      selectedMethod === m.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                      <m.icon size={16} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white text-sm font-medium">{m.label}</p>
                      <p className="text-gray-400 text-xs">{m.desc}</p>
                    </div>
                    {selectedMethod === m.id && <Check size={16} className="text-violet-400" />}
                  </button>
                ))}
              </div>

              {/* Stripe Card Element */}
              {selectedMethod === 'stripe' && (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm amount={parseFloat(amount)} onSuccess={() => { setShowAddMoney(false); queryClient.invalidateQueries(['wallet']) }} />
                </Elements>
              )}

              {selectedMethod !== 'stripe' && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePay}
                  disabled={paypalMutation.isPending || bkashMutation.isPending || nagadMutation.isPending || cryptoMutation.isPending}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  Pay ${amount || '0'} via {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Stripe Card Form
function StripePaymentForm({ amount, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!stripe || !elements || !amount) return
    setLoading(true)
    try {
      const { data } = await api.post('/payment/stripe/create-intent', { amount })
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      })
      if (result.error) toast.error(result.error.message)
      else { toast.success('Payment successful! 💰'); onSuccess() }
    } catch { toast.error('Payment failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <CardElement options={{ style: { base: { color: '#fff', fontSize: '15px', '::placeholder': { color: '#6b7280' } } } }} />
      </div>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSubmit}
        disabled={loading || !amount}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${amount || 0} via Card`}
      </motion.button>
    </div>
  )
}

const SAMPLE_TXS = [
  { id: 1, description: 'Summer Collection Promo', type: 'CAMPAIGN_PAYMENT', method: 'WALLET', status: 'COMPLETED', amount: 500, createdAt: new Date() },
  { id: 2, description: 'Stripe Deposit', type: 'DEPOSIT', method: 'STRIPE', status: 'COMPLETED', amount: 1000, createdAt: new Date(Date.now() - 86400000) },
  { id: 3, description: 'PayPal Deposit', type: 'DEPOSIT', method: 'PAYPAL', status: 'COMPLETED', amount: 500, createdAt: new Date(Date.now() - 172800000) },
  { id: 4, description: 'bKash Deposit', type: 'DEPOSIT', method: 'BKASH', status: 'COMPLETED', amount: 250, createdAt: new Date(Date.now() - 259200000) },
  { id: 5, description: 'Platform Fee', type: 'PLATFORM_FEE', method: 'WALLET', status: 'COMPLETED', amount: 50, createdAt: new Date(Date.now() - 345600000) },
]
