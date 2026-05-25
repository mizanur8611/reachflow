'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, ExternalLink, Link, Copy, Check } from 'lucide-react'

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingLinks, setTrackingLinks] = useState({})
  const [copied, setCopied] = useState(null)

  const token = localStorage.getItem('rf_token')
  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/my`, { headers })
        const data = await res.json()
        if (data.submissions) setSubmissions(data.submissions)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  const generateLink = async (campaignId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/generate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      if (data.link) {
        const url = `https://reachflow-j34o.onrender.com/c/${data.link.shortCode}`
        setTrackingLinks(prev => ({ ...prev, [campaignId]: url }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const copyLink = (campaignId, url) => {
    navigator.clipboard.writeText(url)
    setCopied(campaignId)
    setTimeout(() => setCopied(null), 2000)
  }

  const statusConfig = {
    APPROVED: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-400', icon: XCircle },
    PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Submissions 📋</h1>
          <p className="text-gray-400 mt-1">Track your submitted proofs and their status.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: submissions.length, color: 'from-violet-500 to-purple-600' },
            { label: 'Approved', value: submissions.filter(s => s.status === 'APPROVED').length, color: 'from-emerald-500 to-teal-600' },
            { label: 'Pending', value: submissions.filter(s => s.status === 'PENDING').length, color: 'from-orange-500 to-amber-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <span className="text-white font-bold text-sm">{s.value}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label} Submissions</p>
            </motion.div>
          ))}
        </div>

        {/* Submissions List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">All Submissions</h2>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">No submissions yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-left">Post URL</th>
                  <th className="px-6 py-3 text-left">Tracking Link</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s, i) => {
                  const config = statusConfig[s.status] || statusConfig.PENDING
                  const Icon = config.icon
                  const trackUrl = trackingLinks[s.campaign?.id]
                  return (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-sm font-medium">{s.campaign?.title || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <a href={s.postUrl} target="_blank" rel="noreferrer"
                          className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                          View Post <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {trackUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs truncate max-w-[120px]">{trackUrl}</span>
                            <button onClick={() => copyLink(s.campaign?.id, trackUrl)}
                              className="p-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg transition-all">
                              {copied === s.campaign?.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => generateLink(s.campaign?.id)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg transition-all">
                            <Link size={12} /> Get Link
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 justify-center w-fit mx-auto ${config.color}`}>
                          <Icon size={12} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-400">
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  )
}
