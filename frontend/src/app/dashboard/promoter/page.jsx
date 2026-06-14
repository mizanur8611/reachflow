'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Target, Clock, CheckCircle, X, Send, Link, FileText, ExternalLink, Shield } from 'lucide-react'

export default function PromoterDashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [wallet, setWallet] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState(null)
  const [submitForm, setSubmitForm] = useState({ postUrl: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submittedIds, setSubmittedIds] = useState([]) // applicationIds already submitted
  const [trackingLinks, setTrackingLinks] = useState({}) // campaignId -> shortCode
  const [generatingLink, setGeneratingLink] = useState(null)
  const [kycStatus, setKycStatus] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('rf_token')
        const headers = { 'Authorization': `Bearer ${token}` }

        const [res1, res2, res3] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/available`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/my`, { headers }),
        ])

        const data1 = await res1.json()
        const data2 = await res2.json()
        const data3 = await res3.json()

        if (data1.campaigns) setCampaigns(data1.campaigns)
        if (data2.applications) setApplications(data2.applications)

        const res4 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet`, { headers })
        const data4 = await res4.json()
          if (data4.wallet) setWallet(data4.wallet)

        // Track which applications already have submissions
        if (data3.submissions) {
          const ids = data3.submissions.map(s => s.applicationId).filter(Boolean)
          setSubmittedIds(ids)
        }
        const res5 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/status`, { headers })
        const data5 = await res5.json()
        setKycStatus(data5)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApply = async (campaignId) => {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      if (data.success) {
        setApplications(prev => [...prev, data.application])
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      alert('Cannot connect to server')
    }
  }

  const handleGenerateLink = async (campaignId) => {
    setGeneratingLink(campaignId)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      if (data.link) {
        const trackingUrl = `${window.location.origin}/go/${data.link.shortCode}`
        setTrackingLinks(prev => ({ ...prev, [campaignId]: trackingUrl }))
      }
    } catch (err) {
      alert('Cannot generate link')
    } finally {
      setGeneratingLink(null)
    }
  }

  const handleSubmitProof = async () => {
    if (!submitForm.postUrl) return alert('Post URL দাও!')
    setSubmitting(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          applicationId: submitModal.applicationId,
          postUrl: submitForm.postUrl,
          description: submitForm.description
        })
      })
      const data = await res.json()
      if (data.success) {
        setSubmittedIds(prev => [...prev, submitModal.applicationId])
        setSubmitModal(null)
        setSubmitForm({ postUrl: '', description: '' })
        alert('Proof submitted successfully! 🎉')
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      alert('Cannot connect to server')
    } finally {
      setSubmitting(false)
    }
  }

  const isApplied = (campaignId) => applications.some(a => a.campaignId === campaignId)
  const hasSubmitted = (applicationId) => submittedIds.includes(applicationId)
  const getApplication = (campaignId) => applications.find(a => a.campaignId === campaignId)

  const STATS = [
    { label: 'Applied Campaigns', value: applications.length.toString(), icon: Target, color: 'from-violet-500 to-purple-600' },
    { label: 'Approved', value: applications.filter(a => a.status === 'APPROVED').length.toString(), icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Pending', value: applications.filter(a => a.status === 'PENDING').length.toString(), icon: Clock, color: 'from-orange-500 to-amber-600' },
    { label: 'Total Earned', value: `$${wallet?.totalEarned?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'from-blue-500 to-cyan-600' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Promoter Dashboard 🚀</h1>
          <p className="text-gray-400 mt-1">Browse campaigns and start earning.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {STATS.map((s, i) => (
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

        {/* KYC Banner */}
          {kycStatus && kycStatus.status !== 'VERIFIED' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-300">KYC Verification Required</p>
                  <p className="text-xs text-yellow-500">Verify your identity to unlock withdrawals & more</p>
                </div>
              </div>
              <a href="/dashboard/promoter/kyc"
                className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-lg transition-all">
                Verify Now →
              </a>
            </motion.div>
          )}

        {/* Available Campaigns — FIX: scroll হবে */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Campaigns</h2>
          {loading ? (
            <div className="text-gray-500 text-center py-12">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-gray-500 text-center py-12">No campaigns available yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {campaigns.map((c, i) => {
                const app = getApplication(c.id)
                const approved = app?.status === 'APPROVED'
                const trackingUrl = trackingLinks[c.id]

                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{c.title}</h3>
                        <p className="text-gray-400 text-xs mt-1">{c.description}</p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                        ${c.commissionAmount} / {c.commissionType?.replace('PER_', '')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.targetPlatforms?.map(p => (
                        <span key={p} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Budget: ${c.totalBudget}</span>
                      <span>Category: {c.category}</span>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={() => !isApplied(c.id) && handleApply(c.id)}
                      disabled={isApplied(c.id)}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 ${
                        isApplied(c.id)
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white'
                      }`}
                    >
                      {isApplied(c.id) ? `✓ Applied (${app?.status})` : 'Apply Now'}
                    </button>

                    {/* Approved Actions: Get Link + Submit Proof */}
                    {approved && (
                      <div className="space-y-2 mt-2">
                        {/* Tracking Link */}
                        {trackingUrl ? (
                          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                            <ExternalLink size={12} className="text-violet-400 shrink-0" />
                            <span className="text-xs text-violet-300 truncate">{trackingUrl}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(trackingUrl); alert('Copied!') }}
                              className="text-xs text-gray-400 hover:text-white ml-auto shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateLink(c.id)}
                            disabled={generatingLink === c.id}
                            className="w-full py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 transition-all border border-white/10 flex items-center justify-center gap-2"
                          >
                            <Link size={12} />
                            {generatingLink === c.id ? 'Generating...' : 'Get Tracking Link'}
                          </button>
                        )}

                        {/* Submit Proof */}
                        {hasSubmitted(app?.id) ? (
                          <div className="w-full py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 text-center">
                            ✓ Proof Submitted
                          </div>
                        ) : (
                          <button
                            onClick={() => setSubmitModal({ applicationId: app.id, campaignTitle: c.title })}
                            className="w-full py-2 rounded-xl text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 transition-all border border-violet-500/20 flex items-center justify-center gap-2"
                          >
                            <Send size={12} />
                            Submit Proof
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* My Applications Table */}
        {applications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">My Applications</h2>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                  <th className="px-6 py-3 text-right">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((a, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-sm font-medium">{a.campaign?.title}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        a.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        a.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {a.status === 'APPROVED' && (
                        hasSubmitted(a.id) ? (
                          <span className="text-xs text-emerald-400 font-medium">✓ Submitted</span>
                        ) : (
                          <button
                            onClick={() => setSubmitModal({ applicationId: a.id, campaignTitle: a.campaign?.title })}
                            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                          >
                            Submit Proof
                          </button>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-400">
                      {new Date(a.appliedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </motion.div>
        )}
      </div>

      {/* Submit Proof Modal */}
      <AnimatePresence>
        {submitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setSubmitModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg">Submit Proof</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{submitModal.campaignTitle}</p>
                </div>
                <button onClick={() => setSubmitModal(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <Link size={14} /> Post URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/your-post..."
                    value={submitForm.postUrl}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, postUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <FileText size={14} /> Description (optional)
                  </label>
                  <textarea
                    placeholder="কী পোস্ট করেছ সংক্ষেপে লেখো..."
                    value={submitForm.description}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setSubmitModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={handleSubmitProof} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  <Send size={14} />
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

