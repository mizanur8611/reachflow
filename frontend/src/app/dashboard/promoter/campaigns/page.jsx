'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Link, ExternalLink, X, FileText, Megaphone } from 'lucide-react'

export default function BrowseCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState(null)
  const [submitForm, setSubmitForm] = useState({ postUrl: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submittedIds, setSubmittedIds] = useState([])
  const [trackingLinks, setTrackingLinks] = useState({})
  const [generatingLink, setGeneratingLink] = useState(null)

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
        if (data3.submissions) {
          const ids = data3.submissions.map(s => s.applicationId).filter(Boolean)
          setSubmittedIds(ids)
        }
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

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Campaigns 🎯</h1>
          <p className="text-gray-400 mt-1">Available campaigns দেখো এবং apply করো।</p>
        </div>

        {/* Campaigns */}
        {loading ? (
          <div className="text-gray-500 text-center py-12 animate-pulse">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg font-medium">কোনো campaign নেই এখন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    }`}>
                    {isApplied(c.id) ? `✓ Applied (${app?.status})` : 'Apply Now'}
                  </button>

                  {/* Approved Actions */}
                  {approved && (
                    <div className="space-y-2 mt-2">
                      {trackingUrl ? (
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                          <ExternalLink size={12} className="text-violet-400 shrink-0" />
                          <span className="text-xs text-violet-300 truncate">{trackingUrl}</span>
                          <button onClick={() => { navigator.clipboard.writeText(trackingUrl); alert('Copied!') }}
                            className="text-xs text-gray-400 hover:text-white ml-auto shrink-0">Copy</button>
                        </div>
                      ) : (
                        <button onClick={() => handleGenerateLink(c.id)} disabled={generatingLink === c.id}
                          className="w-full py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 transition-all border border-white/10 flex items-center justify-center gap-2">
                          <Link size={12} />
                          {generatingLink === c.id ? 'Generating...' : 'Get Tracking Link'}
                        </button>
                      )}
                      {hasSubmitted(app?.id) ? (
                        <div className="w-full py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 text-center">
                          ✓ Proof Submitted
                        </div>
                      ) : (
                        <button onClick={() => setSubmitModal({ applicationId: app.id, campaignTitle: c.title })}
                          className="w-full py-2 rounded-xl text-xs font-medium bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 transition-all border border-violet-500/20 flex items-center justify-center gap-2">
                          <Send size={12} /> Submit Proof
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
                  <input type="url" placeholder="https://facebook.com/your-post..."
                    value={submitForm.postUrl}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, postUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <FileText size={14} /> Description (optional)
                  </label>
                  <textarea placeholder="কী পোস্ট করেছ সংক্ষেপে লেখো..."
                    value={submitForm.description}
                    onChange={(e) => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setSubmitModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all">Cancel</button>
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
