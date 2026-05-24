'use client'
import { useState, useEffect } from 'react'
import { Users, Megaphone, Shield, Trash2, CheckCircle, XCircle } from 'lucide-react'

export default function AdminPanel() {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : ''

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchCampaigns()
  }, [])

  const fetchStats = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, { headers })
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  const fetchUsers = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, { headers })
    const data = await res.json()
    setUsers(data.users || [])
  }

  const fetchCampaigns = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/campaigns`, { headers })
    const data = await res.json()
    setCampaigns(data.campaigns || [])
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, { method: 'DELETE', headers })
    setUsers(users.filter(u => u.id !== id))
  }

  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/campaigns/${id}`, { method: 'DELETE', headers })
    setCampaigns(campaigns.filter(c => c.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Platform management & overview</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Total Campaigns', value: stats.totalCampaigns, icon: Megaphone, color: 'from-violet-500 to-purple-600' },
              { label: 'Total Applications', value: stats.totalApplications, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
              { label: 'Advertisers', value: stats.totalAdvertisers, icon: Users, color: 'from-orange-500 to-amber-600' },
              { label: 'Promoters', value: stats.totalPromoters, icon: Users, color: 'from-pink-500 to-rose-600' },
              { label: 'Approved', value: stats.approvedApplications, icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
            ].map((s, i) => (
              <div key={i} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['users', 'campaigns'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">All Users ({users.length})</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'ADVERTISER' ? 'bg-blue-500/10 text-blue-400' : u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.role !== 'ADMIN' && (
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Campaigns */}
        {tab === 'campaigns' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">All Campaigns ({campaigns.length})</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Budget</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Applications</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm font-medium">{c.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">${c.totalBudget}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{c.applications?.length || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => deleteCampaign(c.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
