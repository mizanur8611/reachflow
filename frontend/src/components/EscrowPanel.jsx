'use client'
import { useState, useEffect } from 'react'
import { Shield, DollarSign, ArrowDownToLine, RefreshCw, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

/**
 * EscrowPanel component
 * Usage: <EscrowPanel campaignId={campaign.id} campaign={campaign} onUpdate={fetchCampaign} />
 */
export default function EscrowPanel({ campaignId, campaign, onUpdate }) {
  const [escrow, setEscrow]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [funding, setFunding]   = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)

  useEffect(() => {
    fetchEscrow()
  }, [campaignId])

  async function fetchEscrow() {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/escrow/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setEscrow(data.escrow)
    } catch (err) {
      // No escrow yet
    } finally {
      setLoading(false)
    }
  }

  async function handleFund() {
    setFunding(true)
    setError(null)
    setSuccess(null)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/escrow/fund/${campaignId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fund escrow')
      setSuccess(data.message)
      fetchEscrow()
      if (onUpdate) onUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setFunding(false)
    }
  }

  async function handleRefund() {
    if (!confirm('Refund remaining budget to your wallet? This will complete the campaign.')) return
    setRefunding(true)
    setError(null)
    setSuccess(null)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/escrow/refund/${campaignId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to refund')
      setSuccess(data.message)
      fetchEscrow()
      if (onUpdate) onUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setRefunding(false)
    }
  }

  const STATUS_CONFIG = {
    PENDING:   { color: 'text-gray-400',   bg: 'bg-gray-500/10',   icon: Clock,         label: 'Pending Funding' },
    FUNDED:    { color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: Shield,        label: 'Funded' },
    ACTIVE:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle,  label: 'Active' },
    COMPLETED: { color: 'text-violet-400', bg: 'bg-violet-500/10', icon: CheckCircle,   label: 'Completed' },
    DISPUTED:  { color: 'text-red-400',    bg: 'bg-red-500/10',    icon: AlertTriangle, label: 'Disputed' },
    REFUNDED:  { color: 'text-orange-400', bg: 'bg-orange-500/10', icon: RefreshCw,     label: 'Refunded' },
  }

  if (loading) return (
    <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-gray-500" />
    </div>
  )

  const status = escrow?.status || 'PENDING'
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon

  return (
    <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield size={16} className="text-violet-400" />
          Escrow
        </h3>
        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.bg} ${statusConfig.color}`}>
          <StatusIcon size={12} />
          {statusConfig.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Budget',  value: `$${campaign?.totalBudget?.toFixed(2) || '0.00'}`,           color: 'text-white' },
          { label: 'Held',          value: `$${escrow?.heldAmount?.toFixed(2) || '0.00'}`,              color: 'text-blue-400' },
          { label: 'Released',      value: `$${escrow?.releasedAmount?.toFixed(2) || '0.00'}`,          color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Refunded row */}
      {escrow?.refundedAmount > 0 && (
        <div className="flex items-center justify-between text-sm mb-4 p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
          <span className="text-gray-400">Refunded</span>
          <span className="text-orange-400 font-medium">${escrow.refundedAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Error/Success */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Fund Escrow */}
        {(!escrow || status === 'PENDING') && (
          <button onClick={handleFund} disabled={funding}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all">
            {funding ? <Loader2 size={15} className="animate-spin" /> : <DollarSign size={15} />}
            {funding ? 'Funding...' : `Fund $${campaign?.totalBudget?.toFixed(2)} to Escrow`}
          </button>
        )}

        {/* Refund remaining */}
        {escrow && ['FUNDED', 'ACTIVE'].includes(status) && escrow.heldAmount > 0 && (
          <button onClick={handleRefund} disabled={refunding}
            className="w-full py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 disabled:opacity-50 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all">
            {refunding ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {refunding ? 'Refunding...' : `Refund $${escrow.heldAmount.toFixed(2)} Remaining`}
          </button>
        )}
      </div>

      {/* Transaction History */}
      {escrow?.transactions?.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-gray-500 uppercase mb-2">Transaction History</p>
          <div className="space-y-2">
            {escrow.transactions.slice(0, 5).map((tx, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.type === 'FUND'    ? 'bg-blue-500/10 text-blue-400' :
                    tx.type === 'RELEASE' ? 'bg-emerald-500/10 text-emerald-400' :
                    tx.type === 'REFUND'  ? 'bg-orange-500/10 text-orange-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>{tx.type}</span>
                  <span className="text-gray-500 text-xs">{tx.note}</span>
                </div>
                <span className="font-medium">${tx.amount?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
