'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Megaphone, DollarSign, Shield, CheckCircle, XCircle } from 'lucide-react'

const STATS = [
  { label: 'Total Users', value: '12,450', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: 'Active Campaigns', value: '847', icon: Megaphone, color: 'from-violet-500 to-purple-600' },
  { label: 'Platform Revenue', value: '$24,500', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
  { label: 'Fraud Detected', value: '23', icon: Shield, color: 'from-red-500 to-orange-600' },
]

const PENDING = [
  { id: 1, title: 'Summer Fashion Promo', budget: 500, category: 'Fashion' },
  { id: 2, title: 'New Tech Gadget', budget: 300, category: 'Technology' },
  { id: 3, title: 'Food Delivery Offer', budget: 200, category: 'Food' },
]

const USERS = [
  { id: 1, name: 'Mahfuzur Rahman', email: 'mahfuz@email.com', role: 'ADVERTISER', status: 'ACTIVE' },
  { id: 2, name: 'Sarah Ahmed', email: 'sarah@email.com', role: 'PROMOTER', status: 'ACTIVE' },
  { id: 3, name: 'Rahim Khan', email: 'rahim@email.com', role: 'PROMOTER', status: 'ACTIVE' },
]

export default function AdminPanel() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Platform management & overview</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'campaigns', 'users'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Pending Campaigns */}
        {tab === 'campaigns' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Pending Campaign Review</h2>
            </div>
            <div className="divide-y divide-white/5">
              {PENDING.map(c => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{c.title}</p>
                    <p className="text-gray-400 text-sm">${c.budget} · {c.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">All Users</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {USERS.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'ADVERTISER' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full">{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Platform Settings</h2>
              <div className="space-y-3">
                {[
                  { label: 'Platform Fee', value: '10%' },
                  { label: 'Min Withdrawal', value: '$10' },
                  { label: 'Auto Payout', value: 'Enabled' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-400">{s.label}</span>
                    <span className="text-white font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Today\'s Revenue', value: '$1,240' },
                  { label: 'New Users Today', value: '47' },
                  { label: 'Active Campaigns', value: '847' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-400">{s.label}</span>
                    <span className="text-emerald-400 font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
