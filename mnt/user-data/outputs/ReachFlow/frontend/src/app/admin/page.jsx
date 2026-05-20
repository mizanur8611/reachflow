'use client'
// ReachFlow - Admin Panel
// File: frontend/src/app/admin/page.jsx

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Megaphone, DollarSign, TrendingUp, Shield,
  AlertTriangle, CheckCircle, XCircle, Eye, Ban,
  BarChart2, Activity, Globe, Zap
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { format } from 'date-fns'

const revenueData = [
  { month: 'Jan', revenue: 1200, users: 340, campaigns: 45 },
  { month: 'Feb', revenue: 2100, users: 520, campaigns: 78 },
  { month: 'Mar', revenue: 3400, users: 780, campaigns: 120 },
  { month: 'Apr', revenue: 4800, users: 1100, campaigns: 187 },
  { month: 'May', revenue: 6200, users: 1540, campaigns: 243 },
]

const ADMIN_STATS = [
  { label: 'Total Users', value: '12,450', change: '+18%', icon: Users, color: 'from-blue-500 to-cyan-500' },
  { label: 'Active Campaigns', value: '847', change: '+24%', icon: Megaphone, color: 'from-violet-500 to-purple-600' },
  { label: 'Platform Revenue', value: '$24,500', change: '+32%', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
  { label: 'Total Reach', value: '48.2M', change: '+15%', icon: Globe, color: 'from-pink-500 to-rose-600' },
  { label: 'Fraud Detected', value: '23', change: '-8%', icon: Shield, color: 'from-red-500 to-orange-600' },
  { label: 'Pending Disputes', value: '7', change: '+2', icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
]

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  const { data: pendingCampaigns } = useQuery({
    queryKey: ['admin-pending-campaigns'],
    queryFn: () => api.get('/admin/campaigns/pending').then(r => r.data.campaigns)
  })

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => api.get('/admin/users?limit=10').then(r => r.data.users)
  })

  const { data: pendingWithdrawals } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => api.get('/admin/withdrawals/pending').then(r => r.data.withdrawals)
  })

  const approveCampaign = useMutation({
    mutationFn: (id) => api.patch(`/admin/campaigns/${id}`, { status: 'ACTIVE' }),
    onSuccess: () => { toast.success('Campaign approved!'); queryClient.invalidateQueries(['admin-pending-campaigns']) }
  })

  const rejectCampaign = useMutation({
    mutationFn: (id) => api.patch(`/admin/campaigns/${id}`, { status: 'CANCELLED' }),
    onSuccess: () => { toast.success('Campaign rejected'); queryClient.invalidateQueries(['admin-pending-campaigns']) }
  })

  const processWithdrawal = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/admin/withdrawals/${id}`, { action }),
    onSuccess: () => { toast.success('Withdrawal processed!'); queryClient.invalidateQueries(['admin-withdrawals']) }
  })

  const banUser = useMutation({
    mutationFn: (userId) => api.patch(`/admin/users/${userId}/ban`),
    onSuccess: () => { toast.success('User banned'); queryClient.invalidateQueries(['admin-recent-users']) }
  })

  const TABS = ['overview', 'campaigns', 'users', 'payments', 'disputes']

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex">
      <Sidebar role="admin" />

      <div className="flex-1 ml-64">
        <TopBar />

        <main className="p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-gray-400">Platform overview and management</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            {ADMIN_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#1a1b23] border border-white/5 rounded-2xl p-4"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={16} className="text-white" />
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
                <p className={`text-xs mt-1 font-medium ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{s.change}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Revenue Chart */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-5">Platform Revenue & Growth</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a1b23', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#rev)" name="Revenue ($)" />
                    <Area type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} fill="none" name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <div className="grid grid-cols-2 gap-6">
                {/* Pending Campaigns */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="font-semibold text-white text-sm">Pending Campaign Review</h2>
                    <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                      {(pendingCampaigns ?? SAMPLE_CAMPAIGNS).length} pending
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {(pendingCampaigns ?? SAMPLE_CAMPAIGNS).map((c, i) => (
                      <div key={c.id ?? i} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{c.title}</p>
                          <p className="text-gray-400 text-xs">${c.totalBudget} budget · {c.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveCampaign.mutate(c.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg transition-colors"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => rejectCampaign.mutate(c.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Pending Withdrawals */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="font-semibold text-white text-sm">Pending Withdrawals</h2>
                    <span className="bg-violet-500/10 text-violet-400 text-xs px-2 py-0.5 rounded-full">
                      {(pendingWithdrawals ?? SAMPLE_WITHDRAWALS).length} pending
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {(pendingWithdrawals ?? SAMPLE_WITHDRAWALS).map((w, i) => (
                      <div key={w.id ?? i} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">${w.amount} via {w.method}</p>
                          <p className="text-gray-400 text-xs">{w.promoter?.user?.name ?? 'Promoter'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => processWithdrawal.mutate({ id: w.id, action: 'approve' })}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg transition-colors"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => processWithdrawal.mutate({ id: w.id, action: 'reject' })}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="font-semibold text-white">All Users</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(recentUsers ?? SAMPLE_USERS).map((u, i) => (
                    <tr key={u.id ?? i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.[0] ?? 'U'}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{u.name}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.role === 'ADVERTISER' ? 'bg-blue-500/10 text-blue-400' :
                          u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'May 2026'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {u.status ?? 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-gray-500 hover:text-white transition-colors p-1"><Eye size={14} /></button>
                          <button onClick={() => banUser.mutate(u.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1"><Ban size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Platform Settings */}
          {activeTab === 'disputes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
              <h2 className="font-semibold text-white mb-5">Platform Settings</h2>
              <div className="space-y-4 max-w-md">
                {[
                  { label: 'Platform Fee (%)', value: '10', type: 'number' },
                  { label: 'Minimum Withdrawal ($)', value: '10', type: 'number' },
                  { label: 'Auto Payout', value: true, type: 'toggle' },
                  { label: 'Maintenance Mode', value: false, type: 'toggle' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-gray-300 text-sm">{s.label}</span>
                    {s.type === 'toggle' ? (
                      <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${s.value ? 'bg-violet-600' : 'bg-white/20'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${s.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    ) : (
                      <input defaultValue={s.value} type={s.type} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-24 outline-none focus:border-violet-500 text-right" />
                    )}
                  </div>
                ))}
                <button className="w-full bg-violet-600 hover:bg-violet-500 py-2.5 rounded-xl text-sm font-semibold mt-4 transition-colors">
                  Save Settings
                </button>
              </div>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  )
}

// Sample Data
const SAMPLE_CAMPAIGNS = [
  { id: '1', title: 'Summer Fashion Promo', totalBudget: 500, category: 'Fashion' },
  { id: '2', title: 'New Tech Gadget Launch', totalBudget: 300, category: 'Technology' },
  { id: '3', title: 'Food Delivery Offer', totalBudget: 200, category: 'Food' },
]

const SAMPLE_WITHDRAWALS = [
  { id: '1', amount: 150, method: 'BKASH', promoter: { user: { name: 'Rahim Khan' } } },
  { id: '2', amount: 250, method: 'PAYPAL', promoter: { user: { name: 'Sarah Ahmed' } } },
  { id: '3', amount: 80, method: 'NAGAD', promoter: { user: { name: 'Karim Hossain' } } },
]

const SAMPLE_USERS = [
  { id: '1', name: 'Mahfuzur Rahman', email: 'mahfuz@email.com', role: 'ADVERTISER', status: 'ACTIVE', createdAt: new Date() },
  { id: '2', name: 'Sarah Ahmed', email: 'sarah@email.com', role: 'PROMOTER', status: 'ACTIVE', createdAt: new Date() },
  { id: '3', name: 'Rahim Khan', email: 'rahim@email.com', role: 'PROMOTER', status: 'ACTIVE', createdAt: new Date() },
  { id: '4', name: 'Fatema Begum', email: 'fatema@email.com', role: 'ADVERTISER', status: 'SUSPENDED', createdAt: new Date() },
]
