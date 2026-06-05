'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, XCircle, Eye, X } from 'lucide-react'

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('OPEN')
  const [selected, setSelected] = useState(null)
  const [resolution, setResolution] = useState('')
  const [processing, setProcessing] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/disputes/admin/list?status=${filter}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setDisputes(data.disputes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id, status) => {
    if (status === 'RESOLVED' && !resolution) {
      return alert('Resolution note দাও!')
    }
    setProcessing(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/disputes/admin/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, resolution }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Dispute ${status.toLowerCase()} successfully!`)
        setSelected(null)
        setResolution('')
        fetchDisputes()
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
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dispute Management</h1>
            <p className="text-gray-400 text-sm">Review and resolve user disputes</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'].map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {s === 'OPEN' ? '🔴 Open' : s === 'UNDER_REVIEW' ? '🟡 Under Review' : s === 'RESOLVED' ? '✅ Resolved' : '⚫ Closed'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : disputes.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No {filter.toLowerCase()} disputes</div>
        ) : (
          <div className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                  <th className="px-6 py-4 text-left">Raised By</th>
                  <th className="px-6 py-4 text-left">Against</th>
                  <th className="px-6 py-4 text-left">Reason</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {disputes.map((d, i) => (
                  <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{d.raisedByUser?.name}</p>
                      <p className="text-xs text-gray-500">{d.raisedByUser?.role}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{d.againstUser?.name}</p>
                      <p className="text-xs text-gray-500">{d.againstUser?.role}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">{d.reason}</p>
                      {d.campaign && <p className="text-xs text-gray-500">{d.campaign.title}</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelected(d); setResolution('') }}
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
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1b23] border border-white/10 rounded-2xl w-full max-w-lg">

            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-bold text-lg">Dispute Review</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Raised By</p>
                  <p className="text-sm font-medium">{selected.raisedByUser?.name}</p>
                  <p className="text-xs text-gray-500">{selected.raisedByUser?.email}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Against</p>
                  <p className="text-sm font-medium">{selected.againstUser?.name}</p>
                  <p className="text-xs text-gray-500">{selected.againstUser?.email}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm font-medium">{selected.reason}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-300">{selected.description}</p>
              </div>

              {selected.campaign && (
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Campaign</p>
                  <p className="text-sm font-medium">{selected.campaign.title}</p>
                </div>
              )}

              {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Resolution Note</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Resolution details লেখো..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              )}

              {selected.resolution && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-emerald-400 font-medium mb-1">Resolution:</p>
                  <p className="text-sm text-emerald-300">{selected.resolution}</p>
                </div>
              )}

              {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
                <div className="flex gap-3">
                  {selected.status === 'OPEN' && (
                    <button
                      onClick={() => handleResolve(selected.id, 'UNDER_REVIEW')}
                      disabled={processing}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 transition-all disabled:opacity-50"
                    >
                      🔍 Mark Under Review
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(selected.id, 'RESOLVED')}
                    disabled={processing}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    ✅ Resolve
                  </button>
                  <button
                    onClick={() => handleResolve(selected.id, 'CLOSED')}
                    disabled={processing}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 transition-all disabled:opacity-50"
                  >
                    🔒 Close
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
