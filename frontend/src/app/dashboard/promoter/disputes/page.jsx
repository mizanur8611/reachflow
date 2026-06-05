'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, X, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'

const REASONS = [
  'Payment not received',
  'Submission wrongly rejected',
  'Campaign terms violated',
  'Advertiser not responding',
  'Incorrect commission amount',
  'Other',
]

export default function DisputePage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [campaigns, setCampaigns] = useState([])
  const [form, setForm] = useState({
    againstId: '',
    campaignId: '',
    reason: '',
    description: '',
  })

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [r1, r2] = await Promise.all([
        fetch(`${API}/api/disputes/my`, { headers }),
        fetch(`${API}/api/applications/my`, { headers }),
      ])

      const d1 = await r1.json()
      const d2 = await r2.json()

      if (d1.disputes) setDisputes(d1.disputes)
      if (d2.applications) {
        const approved = d2.applications.filter(a => a.status === 'APPROVED')
        setCampaigns(approved)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.againstId || !form.reason || !form.description) {
      return alert('সব field পূরণ করো!')
    }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        alert('Dispute submitted successfully!')
        setShowModal(false)
        setForm({ againstId: '', campaignId: '', reason: '', description: '' })
        fetchData()
      } else {
        alert(data.message || 'Something went wrong')
      }
    } catch (err) {
      alert('Server error')
    } finally {
      setSubmitting(false)
    }
  }

  const StatusBadge = ({ status }) => {
    const config = {
      OPEN: { icon: AlertTriangle, text: 'Open', color: 'text-orange-400', bg: 'bg-orange-500/10' },
      UNDER_REVIEW: { icon: Clock, text: 'Under Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
      RESOLVED: { icon: CheckCircle, text: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      CLOSED: { icon: XCircle, text: 'Closed', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    }
    const c = config[status] || config.OPEN
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.color}`}>
        <c.icon size={12} />
        {c.text}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Disputes</h1>
              <p className="text-gray-400 text-sm">Raise and track your disputes</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Plus size={16} />
            Raise Dispute
          </button>
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : disputes.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <AlertTriangle size={40} className="mx-auto mb-3 text-gray-700" />
            <p>No disputes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-white">{d.reason}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Against: {d.againstUser?.name} ({d.againstUser?.role})
                      {d.campaign && ` • Campaign: ${d.campaign.title}`}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-sm text-gray-400 mb-3">{d.description}</p>
                {d.resolution && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs text-emerald-400 font-medium mb-1">Resolution:</p>
                    <p className="text-sm text-emerald-300">{d.resolution}</p>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2">{new Date(d.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Dispute Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-lg">

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Raise a Dispute</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Campaign (optional) */}
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Related Campaign (optional)</label>
                  <select
                    value={form.campaignId}
                    onChange={(e) => {
                      const selected = campaigns.find(c => c.campaignId === e.target.value)
                      setForm(prev => ({
                        ...prev,
                        campaignId: e.target.value,
                        againstId: selected?.campaign?.advertiserId || prev.againstId,
                      }))
                    }}
                    className="w-full bg-[#1a1b23] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors [&>option]:bg-[#1a1b23] [&>option]:text-white"
                  >
                    <option value="">Select a campaign...</option>
                    {campaigns.map(a => (
                      <option key={a.campaignId} value={a.campaignId}>{a.campaign?.title}</option>
                    ))}
                  </select>
                </div>

                {/* Against User ID */}
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Against User ID *</label>
                  <input
                    type="text"
                    placeholder="User ID of the person you're disputing against"
                    value={form.againstId}
                    onChange={(e) => setForm(prev => ({ ...prev, againstId: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Reason *</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="">Select a reason...</option>
                    {REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Description *</label>
                  <textarea
                    placeholder="বিস্তারিত লেখো..."
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white transition-all disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
