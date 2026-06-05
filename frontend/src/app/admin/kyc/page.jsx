'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, XCircle, Clock, Eye, X, AlertCircle } from 'lucide-react'

export default function AdminKYCPage() {
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedKyc, setSelectedKyc] = useState(null)
  const [rejectionNote, setRejectionNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetchKycs()
  }, [filter])

  const fetchKycs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/kyc/admin/list?status=${filter}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setKycs(data.kycs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id, status) => {
    if (status === 'REJECTED' && !rejectionNote) {
      return alert('Rejection note দাও!')
    }
    setProcessing(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/kyc/admin/${id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, rejectionNote }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`KYC ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully!`)
        setSelectedKyc(null)
        setRejectionNote('')
        fetchKycs()
      } else {
        alert(data.message || 'Something went wrong')
      }
    } catch (err) {
      alert('Server error')
    } finally {
      setProcessing(false)
    }
  }

  const StatusBadge = ({ status }) => {
    const config = {
      PENDING: { icon: Clock, text: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
      VERIFIED: { icon: CheckCircle, text: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      REJECTED: { icon: XCircle, text: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10' },
    }
    const c = config[status] || config.PENDING
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.color}`}>
        <c.icon size={12} />
        {c.text}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">KYC Management</h1>
              <p className="text-gray-400 text-sm">Review and verify user identities</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['PENDING', 'VERIFIED', 'REJECTED'].map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {s === 'PENDING' ? '⏳ Pending' : s === 'VERIFIED' ? '✅ Verified' : '❌ Rejected'}
            </button>
          ))}
        </div>

        {/* KYC List */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : kycs.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No {filter.toLowerCase()} KYC requests</div>
        ) : (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">NID Number</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Submitted</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kycs.map((kyc, i) => (
                  <motion.tr key={kyc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{kyc.user?.name}</p>
                        <p className="text-xs text-gray-500">{kyc.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{kyc.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{kyc.nidNumber || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={kyc.status} />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">
                      {new Date(kyc.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedKyc(kyc); setRejectionNote('') }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition-all"
                      >
                        <Eye size={12} />
                        Review
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1b23] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h3 className="font-bold text-lg">KYC Review</h3>
                <p className="text-gray-400 text-sm">{selectedKyc.user?.name} — {selectedKyc.user?.email}</p>
              </div>
              <button onClick={() => setSelectedKyc(null)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Document Type</p>
                  <p className="text-sm font-medium">{selectedKyc.type}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">NID/Passport Number</p>
                  <p className="text-sm font-medium">{selectedKyc.nidNumber || '—'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={selectedKyc.status} />
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Submitted At</p>
                  <p className="text-sm font-medium">{new Date(selectedKyc.submittedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Document Images */}
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">Documents</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'NID Front', url: selectedKyc.nidFrontUrl },
                    { label: 'NID Back', url: selectedKyc.nidBackUrl },
                    { label: 'Selfie with ID', url: selectedKyc.selfieUrl },
                  ].map(({ label, url }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={label}
                            className="w-full h-32 object-cover rounded-xl border border-white/10 hover:border-violet-500/50 transition-all cursor-pointer" />
                        </a>
                      ) : (
                        <div className="w-full h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <AlertCircle size={20} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Note */}
              {selectedKyc.status === 'PENDING' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Rejection Note (required if rejecting)</label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="কেন reject করছ তার কারণ লেখো..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              )}

              {selectedKyc.kyc?.rejectionNote && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400 font-medium mb-1">Previous Rejection Reason:</p>
                  <p className="text-sm text-red-300">{selectedKyc.rejectionNote}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedKyc.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(selectedKyc.id, 'REJECTED')}
                    disabled={processing}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleReview(selectedKyc.id, 'VERIFIED')}
                    disabled={processing}
                    className="flex-1 py-3 rounded-xl font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
