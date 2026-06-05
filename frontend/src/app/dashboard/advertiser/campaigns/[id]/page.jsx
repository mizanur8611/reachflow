'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, DollarSign, Eye, MousePointer, Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import EscrowPanel from '@/components/EscrowPanel'

export default function CampaignDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const handleUpdateStatus = async (applicationId, status) => {
  try {
    const token = localStorage.getItem('rf_token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    if (data.success) {
      setCampaign(prev => ({
        ...prev,
        applications: prev.applications.map(a =>
          a.id === applicationId ? { ...a, status } : a
        )
      }))
    }
  } catch (err) {
    console.error(err)
  }
}
 const handleSubmissionStatus = async (submissionId, status) => {
  try {
    const token = localStorage.getItem('rf_token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/${submissionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    if (data.success) {
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status } : s))
    }
  } catch (err) {
    console.error(err)
  }
}

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.campaign) setCampaign(data.campaign)
          const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
        })
        const data2 = await res2.json()
      if (data2.submissions) setSubmissions(data2.submissions)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaign()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )

  if (!campaign) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-gray-400">Campaign not found.</div>
    </div>
  )

  const stats = [
    { label: 'Total Budget', value: `$${campaign.totalBudget}`, icon: DollarSign, color: 'from-violet-500 to-purple-600' },
    { label: 'Spent', value: `$${campaign.spentBudget || 0}`, icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
    { label: 'Reach', value: campaign.totalReach || 0, icon: Eye, color: 'from-emerald-500 to-teal-600' },
    { label: 'Clicks', value: campaign.totalClicks || 0, icon: MousePointer, color: 'from-pink-500 to-rose-600' },
    { label: 'Promoters', value: campaign.applications?.length || 0, icon: Users, color: 'from-orange-500 to-amber-600' },
    { label: 'Max Promoters', value: campaign.maxPromoters || 50, icon: Users, color: 'from-indigo-500 to-blue-600' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8 pb-32">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/advertiser" className="p-2 bg-white/5 rounded-xl hover:bg-white/10">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{campaign.description}</p>
          </div>
            <Link href={`/dashboard/advertiser/campaigns/${id}/analytics`}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-xl text-sm font-medium transition-colors">
              <TrendingUp size={15} /> Analytics
            </Link>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            campaign.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
            campaign.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400' :
            'bg-orange-500/10 text-orange-400'
          }`}>
            {campaign.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6"
          >
            <h2 className="font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Category</span>
                <span>{campaign.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Commission Type</span>
                <span>{campaign.commissionType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Commission Amount</span>
                <span>${campaign.commissionAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Start Date</span>
                <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">End Date</span>
                <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6"
          >
            <h2 className="font-semibold mb-4">Platforms</h2>
            <div className="flex flex-wrap gap-2">
              {campaign.targetPlatforms?.map(p => (
                <span key={p} className="bg-violet-500/10 text-violet-400 text-sm px-3 py-1.5 rounded-xl border border-violet-500/20">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <EscrowPanel
          campaignId={id}
          campaign={campaign}
          onUpdate={() => window.location.reload()}
        />

        {/* Promoter Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Promoter Applications</h2>
            <p className="text-gray-400 text-sm mt-1">{campaign.applications?.length || 0} promoters applied</p>
          </div>
          {!campaign.applications || campaign.applications.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No promoters have applied yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Promoter</th>
                  <th className="px-6 py-3 text-left">Message</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaign.applications.map((app, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{app.promoter?.user?.name || 'Unknown'}</span>
                        {app.promoter?.userId && (
                          <Link
                            href={`/promoter/${app.promoter.userId}`}
                            target="_blank"
                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Eye size={11} /> Profile
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{app.message || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {app.status === 'PENDING' && (
                        <div className="flex gap-2 justify-center">
                          <button
                          onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg">
                            <CheckCircle size={16} />
                          </button>
                          <button 
                          onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
        {/* Submissions */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden mt-6"
>
  <div className="px-6 py-4 border-b border-white/5">
    <h2 className="font-semibold">Submissions</h2>
    <p className="text-gray-400 text-sm mt-1">{submissions.length} proof submitted</p>
  </div>
  {submissions.length === 0 ? (
    <div className="px-6 py-12 text-center text-gray-500">No submissions yet.</div>
  ) : (
    <table className="w-full">
      <thead>
        <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
          <th className="px-6 py-3 text-left">Promoter</th>
          <th className="px-6 py-3 text-left">Post URL</th>
          <th className="px-6 py-3 text-left">Caption</th>
          <th className="px-6 py-3 text-center">Status</th>
          <th className="px-6 py-3 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {submissions.map((s, i) => (
          <tr key={i} className="hover:bg-white/[0.02]">
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{s.promoter?.user?.name || 'Unknown'}</span>
                {s.promoter?.userId && (
                  <Link
                    href={`/promoter/${s.promoter.userId}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Eye size={11} /> Profile
                  </Link>
                )}
              </div>
            </td>
            <td className="px-6 py-4 text-sm">
              <a href={s.postUrl} target="_blank" rel="noreferrer"
                className="text-violet-400 hover:text-violet-300 underline">
                View Post
              </a>
            </td>
            <td className="px-6 py-4 text-sm text-gray-400">{s.caption || '-'}</td>
            <td className="px-6 py-4 text-center">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                s.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                s.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                'bg-yellow-500/10 text-yellow-400'
              }`}>
                {s.status}
              </span>
            </td>
            <td className="px-6 py-4 text-center">
              {s.status === 'PENDING' && (
                <div className="flex gap-2 justify-center">
                  <button onClick={() => handleSubmissionStatus(s.id, 'APPROVED')}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <CheckCircle size={16} />
                  </button>
                  <button onClick={() => handleSubmissionStatus(s.id, 'REJECTED')}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</motion.div>
      </div>
    </div>
  )
}