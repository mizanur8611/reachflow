'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Plus, ArrowUpRight, CreditCard, Smartphone, Globe, Bitcoin } from 'lucide-react'

const TXS = [
  { desc: 'Summer Collection Promo', type: 'CAMPAIGN_PAYMENT', method: 'WALLET', status: 'COMPLETED', amount: 500 },
  { desc: 'Stripe Deposit', type: 'DEPOSIT', method: 'STRIPE', status: 'COMPLETED', amount: 1000 },
  { desc: 'PayPal Deposit', type: 'DEPOSIT', method: 'PAYPAL', status: 'COMPLETED', amount: 500 },
  { desc: 'bKash Deposit', type: 'DEPOSIT', method: 'BKASH', status: 'COMPLETED', amount: 250 },
  { desc: 'Platform Fee', type: 'PLATFORM_FEE', method: 'WALLET', status: 'COMPLETED', amount: 50 },
]

const METHODS = [
  { id: 'stripe', label: 'Credit / Debit Card', icon: CreditCard, color: 'from-blue-500 to-cyan-500' },
  { id: 'paypal', label: 'PayPal', icon: Globe, color: 'from-blue-600 to-indigo-600' },
  { id: 'bkash', label: 'bKash', icon: Smartphone, color: 'from-pink-500 to-rose-600' },
  { id: 'nagad', label: 'Nagad', icon: Smartphone, color: 'from-orange-500 to-amber-600' },
  { id: 'crypto', label: 'USDT (TRC20)', icon: Bitcoin, color: 'from-yellow-500 to-orange-500' },
]

export default function WalletPage() {
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState('stripe')
  const [amount, setAmount] = useState('')

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Wallet</h1>
            <p className="text-gray-400 mt-1">Manage your balance and transactions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            <Plus size={16} /> Add Money
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Available Balance', value: '$1,250', icon: Wallet, color: 'from-violet-500 to-purple-600' },
            { label: 'Pending', value: '$450', icon: ArrowUpRight, color: 'from-amber-500 to-orange-600' },
            { label: 'Total Deposited', value: '$3,200', icon: Plus, color: 'from-emerald-500 to-teal-600' },
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

        {/* Transactions */}
        <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Transaction History</h2>
          </div>
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
              {TXS.map((tx, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-white text-sm">{tx.desc}</td>
                  <td className="px-6 py-4"><span className="bg-white/5 text-gray-400 text-xs px-2 py-1 rounded-full">{tx.method}</span></td>
                  <td className="px-6 py-4 text-center"><span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full">{tx.status}</span></td>
                  <td className={`px-6 py-4 text-right font-semibold text-sm ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Money Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#12131a] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Money</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1.5 block">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white outline-none focus:border-violet-500" />
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100, 250].map(a => (
                  <button key={a} onClick={() => setAmount(a.toString())}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${amount == a ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-white/10 text-gray-400'}`}>
                    ${a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 mb-5">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setSelected(m.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${selected === m.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                    <m.icon size={16} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 py-3 rounded-xl font-semibold">
              Pay ${amount || '0'} via {METHODS.find(m => m.id === selected)?.label}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
