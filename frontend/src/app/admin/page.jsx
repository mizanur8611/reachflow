'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Megaphone, Shield, Trash2, CheckCircle, XCircle,
  BarChart2, AlertTriangle, Ban, UserCheck, Eye, DollarSign,
  FileText, Clock, TrendingUp, LogOut
} from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : ''
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // ── Auth Protection ──────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('rf_token')
    const userStr = localStorage.getItem('rf_user')
    if (!token || !userStr) { router.push('/login'); return }
    try {
      const user = JSON.parse(userStr)
      if (user.role !== 'ADMIN') { router.push('/dashboard'); return }
    } catch { router.push('/login'); return }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!authChecked) return
    fetchStats()
    fetchUsers()
    fetchCampaigns()
    fetchSubmissions()
  }, [authChecked])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, { headers })
      const data = await res.json()
      setStats(data)
    } finally { setLoading(false) }
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

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/submissions`, { headers })
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch {}
  }

  // ── User Actions ─────────────────────────────────────────
  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, { method: 'DELETE', headers })
    setUsers(users.filter(u => u.id !== id))
  }

  const suspendUser = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: newStatus })
    })
    if (res.ok) setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u))
  }

  // ── Campaign Actions ──────────────────────────────────────
  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/campaigns/${id}`, { method: 'DELETE', headers })
    setCampaigns(campaigns.filter(c => c.id !== id))
  }

  const updateCampaignStatus = async (id, status) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/campaigns/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    })
    if (res.ok) setCampaigns(campaigns.map(c => c.id === id ? { ...c, status } : c))
  }

  // ── Submission Actions ────────────────────────────────────
  const updateSubmission = async (id, status) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    })
    if (res.ok) setSubmissions(submissions.map(s => s.id === id ? { ...s, status } : s))
  }

  const handleLogout = () => {
    localStorage.removeItem('rf_token')
    localStorage.removeItem('rf_user')
    router.push('/login')
  }

  if (!authChecked || loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading admin panel...</div>
    </div>
  )

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-sm">Platform management & overview</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Total Campaigns', value: stats.totalCampaigns, icon: Megaphone, color: 'from-violet-500 to-purple-600' },
              { label: 'Applications', value: stats.totalApplications, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
              { label: 'Advertisers', value: stats.totalAdvertisers, icon: UserCheck, color: 'from-orange-500 to-amber-600' },
              { label: 'Promoters', value: stats.totalPromoters, icon: Users, color: 'from-pink-500 to-rose-600' },
              { label: 'Revenue', value: `$${stats.totalRevenue || 0}`, icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">All Users ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
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
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.role !== 'ADMIN' && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => suspendUser(u.id, u.status)}
                              title={u.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                              className={`p-1.5 rounded-lg transition-all ${u.status === 'SUSPENDED' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'}`}>
                              {u.status === 'SUSPENDED' ? <UserCheck size={15} /> : <Ban size={15} />}
                            </button>
                            <button onClick={() => deleteUser(u.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CAMPAIGNS TAB ── */}
        {tab === 'campaigns' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">All Campaigns ({campaigns.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-left">Budget</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Applications</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-sm font-medium">{c.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">${c.totalBudget}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                          c.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400' :
                          c.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{c.applications?.length || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {c.status === 'ACTIVE' ? (
                            <button onClick={() => updateCampaignStatus(c.id, 'PAUSED')}
                              title="Pause Campaign"
                              className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg">
                              <AlertTriangle size={15} />
                            </button>
                          ) : (
                            <button onClick={() => updateCampaignStatus(c.id, 'ACTIVE')}
                              title="Activate Campaign"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg">
                              <CheckCircle size={15} />
                            </button>
                          )}
                          <button onClick={() => updateCampaignStatus(c.id, 'CANCELLED')}
                            title="Cancel Campaign"
                            className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg">
                            <XCircle size={15} />
                          </button>
                          <button onClick={() => deleteCampaign(c.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {tab === 'submissions' && (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">All Submissions ({submissions.length})</h2>
            </div>
            {submissions.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">No submissions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                      <th className="px-6 py-3 text-left">Promoter</th>
                      <th className="px-6 py-3 text-left">Campaign</th>
                      <th className="px-6 py-3 text-left">Post URL</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {submissions.map(s => (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-sm font-medium">{s.promoter?.user?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{s.campaign?.title || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <a href={s.postUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-violet-400 hover:text-violet-300">
                            <Eye size={13} /> View Post
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            s.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                            s.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                            s.status === 'FLAGGED' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-yellow-500/10 text-yellow-400'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateSubmission(s.id, 'APPROVED')}
                              title="Approve"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg">
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => updateSubmission(s.id, 'REJECTED')}
                              title="Reject"
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                              <XCircle size={15} />
                            </button>
                            <button onClick={() => updateSubmission(s.id, 'FLAGGED')}
                              title="Flag as suspicious"
                              className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg">
                              <AlertTriangle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── REVENUE TAB ── */}
        {tab === 'revenue' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Platform Revenue', value: `$${stats?.totalRevenue || 0}`, icon: DollarSign, color: 'from-emerald-500 to-teal-500', desc: '10% platform fee from all campaigns' },
              { label: 'Total Campaign Budget', value: `$${campaigns.reduce((a, c) => a + (c.totalBudget || 0), 0)}`, icon: BarChart2, color: 'from-blue-500 to-cyan-500', desc: 'Sum of all campaign budgets' },
              { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'ACTIVE').length, icon: TrendingUp, color: 'from-violet-500 to-purple-600', desc: 'Currently running campaigns' },
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-orange-500 to-amber-500', desc: 'Advertisers + Promoters' },
              { label: 'Total Submissions', value: submissions.length, icon: FileText, color: 'from-pink-500 to-rose-500', desc: 'All promoter post submissions' },
              { label: 'Pending Review', value: submissions.filter(s => s.status === 'PENDING').length, icon: Clock, color: 'from-yellow-500 to-orange-500', desc: 'Submissions waiting for review' },
            ].map((item, i) => (
              <div key={i} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon size={20} className="text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{item.value}</p>
                <p className="text-white/80 font-medium text-sm">{item.label}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
