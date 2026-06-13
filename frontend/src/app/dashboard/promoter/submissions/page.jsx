'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, ExternalLink, Link, Copy, Check, Star, X, QrCode, Download } from 'lucide-react'
import QRCode from 'react-qr-code'

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [trackingLinks, setTrackingLinks] = useState({})
  const [copied, setCopied] = useState(null)
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingForm, setRatingForm] = useState({ score: 0, comment: '' })
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratedCampaigns, setRatedCampaigns] = useState([])
  const [qrModal, setQrModal] = useState(null) // { url, title }
  const qrRef = useRef(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : ''
  const headers = { 'Authorization': `Bearer ${token}` }
  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API}/api/submissions/my`, { headers })
      const data = await res.json()
      if (data.submissions) setSubmissions(data.submissions)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const generateLink = async (campaignId) => {
    try {
      const res = await fetch(`${API}/api/tracking/generate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })
      const data = await res.json()
      if (data.link) {
        const url = `https://reachflow-j34o.onrender.com/c/${data.link.shortCode}`
        setTrackingLinks(prev => ({ ...prev, [campaignId]: url }))
      }
    } catch (err) { console.error(err) }
  }

  const copyLink = (campaignId, url) => {
    navigator.clipboard.writeText(url)
    setCopied(campaignId)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── QR Code Download ──
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 0, 0, 300, 300)
      const a = document.createElement('a')
      a.download = `qr-${qrModal.title || 'reachflow'}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleRatingSubmit = async () => {
    if (!ratingForm.score) return alert('Star rating দাও!')
    setSubmittingRating(true)
    try {
      const res = await fetch(`${API}/api/ratings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: ratingModal.advertiserId,
          campaignId: ratingModal.campaignId,
          score: ratingForm.score,
          comment: ratingForm.comment,
          type: 'PROMOTER_TO_ADVERTISER',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setRatedCampaigns(prev => [...prev, ratingModal.campaignId])
        setRatingModal(null)
        setRatingForm({ score: 0, comment: '' })
        alert('Rating submitted! ⭐')
      } else { alert(data.message || 'Something went wrong') }
    } catch (err) { alert('Server error') }
    finally { setSubmittingRating(false) }
  }

  const statusConfig = {
    APPROVED: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-400', icon: XCircle },
    PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  }

  const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={() => onChange(star)} type="button">
          <Star size={28} className={`transition-colors ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
        </button>
      ))}
    </div>
  )

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
                  <th className="px-6 py-3 text-center">QR Code</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Rate</th>
                  <th className="px-6 py-3 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s, i) => {
                  const config = statusConfig[s.status] || statusConfig.PENDING
                  const Icon = config.icon
                  const trackUrl = trackingLinks[s.campaignId || s.campaign?.id]
                  const alreadyRated = ratedCampaigns.includes(s.campaignId)
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
                          <button onClick={() => generateLink(s.campaignId || s.campaign?.id)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg transition-all">
                            <Link size={12} /> Get Link
                          </button>
                        )}
                      </td>

                      {/* QR Code Button */}
                      <td className="px-6 py-4 text-center">
                        {trackUrl ? (
                          <button
                            onClick={() => setQrModal({ url: trackUrl, title: s.campaign?.title })}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all mx-auto">
                            <QrCode size={12} /> QR Code
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">Link নাও আগে</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 justify-center w-fit mx-auto ${config.color}`}>
                          <Icon size={12} /> {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.status === 'APPROVED' && (
                          alreadyRated ? (
                            <span className="text-xs text-yellow-400">⭐ Rated</span>
                          ) : (
                            <button
                              onClick={() => setRatingModal({
                                campaignId: s.campaignId,
                                campaignTitle: s.campaign?.title,
                                advertiserId: s.campaign?.advertiser?.userId,
                              })}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all mx-auto">
                              <Star size={12} /> Rate
                            </button>
                          )
                        )}
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

      {/* ── QR Code Modal ── */}
      <AnimatePresence>
        {qrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setQrModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">QR Code</h3>
                  <p className="text-gray-400 text-sm">{qrModal.title}</p>
                </div>
                <button onClick={() => setQrModal(null)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* QR Code */}
              <div ref={qrRef} className="bg-white p-5 rounded-2xl inline-block mb-4">
                <QRCode value={qrModal.url} size={200} />
              </div>

              <p className="text-xs text-gray-500 mb-5 break-all px-2">{qrModal.url}</p>

              <div className="flex gap-3">
                <button onClick={() => copyLink('qr', qrModal.url)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all">
                  {copied === 'qr' ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Link Copy</>}
                </button>
                <button onClick={downloadQR}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white transition-all hover:opacity-90">
                  <Download size={14} /> Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rating Modal ── */}
      <AnimatePresence>
        {ratingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setRatingModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg">Rate this Campaign</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{ratingModal.campaignTitle}</p>
                </div>
                <button onClick={() => setRatingModal(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-gray-400 mb-3 block">Your Rating</label>
                  <StarRating value={ratingForm.score} onChange={(v) => setRatingForm(prev => ({ ...prev, score: v }))} />
                  {ratingForm.score > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{['', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'][ratingForm.score]}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Comment (optional)</label>
                  <textarea placeholder="তোমার অভিজ্ঞতা শেয়ার করো..." value={ratingForm.comment}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setRatingModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleRatingSubmit} disabled={submittingRating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Star size={14} />
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
