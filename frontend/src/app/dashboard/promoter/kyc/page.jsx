'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Upload, CheckCircle, Clock, XCircle, AlertCircle, ChevronRight } from 'lucide-react'

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    type: 'NID',
    nidNumber: '',
    nidFront: null,
    nidBack: null,
    selfie: null,
  })
  const [previews, setPreviews] = useState({
    nidFront: null,
    nidBack: null,
    selfie: null,
  })

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetchKycStatus()
  }, [])

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setKycStatus(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (field, file) => {
    if (!file) return
    setForm(prev => ({ ...prev, [field]: file }))
    const url = URL.createObjectURL(file)
    setPreviews(prev => ({ ...prev, [field]: url }))
  }

  const handleSubmit = async () => {
    if (!form.nidNumber) return alert('NID/Passport number দাও!')
    if (!form.nidFront || !form.nidBack || !form.selfie)
      return alert('তিনটি ছবিই দিতে হবে!')

    setSubmitting(true)
    try {
      const token = localStorage.getItem('rf_token')
      const formData = new FormData()
      formData.append('type', form.type)
      formData.append('nidNumber', form.nidNumber)
      formData.append('nidFront', form.nidFront)
      formData.append('nidBack', form.nidBack)
      formData.append('selfie', form.selfie)

      const res = await fetch(`${API}/api/kyc/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        await fetchKycStatus()
        alert('KYC submitted successfully! ✅')
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
      NOT_SUBMITTED: { icon: AlertCircle, text: 'Not Submitted', color: 'text-gray-400', bg: 'bg-gray-500/10' },
      PENDING: { icon: Clock, text: 'Under Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
      VERIFIED: { icon: CheckCircle, text: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      REJECTED: { icon: XCircle, text: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10' },
    }
    const c = config[status] || config.NOT_SUBMITTED
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.color}`}>
        <c.icon size={14} />
        {c.text}
      </span>
    )
  }

  const UploadBox = ({ label, field, preview }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-400">{label}</label>
      <label className="relative cursor-pointer group">
        <div className={`w-full h-36 rounded-xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center
          ${preview ? 'border-violet-500/50' : 'border-white/10 hover:border-violet-500/50'}`}>
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-400 transition-colors">
              <Upload size={24} />
              <span className="text-xs">Click to upload</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(field, e.target.files[0])}
        />
      </label>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">KYC Verification</h1>
              <p className="text-gray-400 text-sm">Verify your identity to unlock all features</p>
            </div>
          </div>
        </div>

        {/* Current Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Current Status</p>
              <StatusBadge status={kycStatus?.status || 'NOT_SUBMITTED'} />
            </div>
            {kycStatus?.kyc?.submittedAt && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-sm text-gray-300">
                  {new Date(kycStatus.kyc.submittedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Rejection Note */}
          {kycStatus?.status === 'REJECTED' && kycStatus?.kyc?.rejectionNote && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400 font-medium mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-300">{kycStatus.kyc.rejectionNote}</p>
            </div>
          )}

          {/* Verified Info */}
          {kycStatus?.status === 'VERIFIED' && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm text-emerald-300">
                🎉 Your identity has been verified! You now have full access to all platform features.
              </p>
            </div>
          )}

          {/* Pending Info */}
          {kycStatus?.status === 'PENDING' && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-sm text-yellow-300">
                ⏳ Your documents are under review. This usually takes 1-2 business days.
              </p>
            </div>
          )}
        </motion.div>

        {/* Form — show if NOT_SUBMITTED or REJECTED */}
        {(kycStatus?.status === 'NOT_SUBMITTED' || kycStatus?.status === 'REJECTED') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
            <h2 className="font-semibold mb-6">Submit Documents</h2>

            {/* Document Type */}
            <div className="mb-5">
              <label className="text-sm text-gray-400 mb-2 block">Document Type</label>
              <div className="flex gap-3">
                {['NID', 'PASSPORT'].map(t => (
                  <button key={t}
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      form.type === t
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {t === 'NID' ? '🪪 NID Card' : '📕 Passport'}
                  </button>
                ))}
              </div>
            </div>

            {/* NID Number */}
            <div className="mb-5">
              <label className="text-sm text-gray-400 mb-2 block">
                {form.type === 'NID' ? 'NID Number' : 'Passport Number'}
              </label>
              <input
                type="text"
                placeholder={form.type === 'NID' ? '10 or 17 digit NID number' : 'Passport number'}
                value={form.nidNumber}
                onChange={(e) => setForm(prev => ({ ...prev, nidNumber: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Image Uploads */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <UploadBox
                label={form.type === 'NID' ? 'NID Front' : 'Passport Photo Page'}
                field="nidFront"
                preview={previews.nidFront}
              />
              <UploadBox
                label={form.type === 'NID' ? 'NID Back' : 'Passport Back'}
                field="nidBack"
                preview={previews.nidBack}
              />
              <UploadBox
                label="Selfie with ID"
                field="selfie"
                preview={previews.selfie}
              />
            </div>

            {/* Tips */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 font-medium mb-2">📋 Tips for faster approval:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center gap-1.5"><ChevronRight size={10} /> Make sure all text on your ID is clearly visible</li>
                <li className="flex items-center gap-1.5"><ChevronRight size={10} /> Selfie: hold your ID next to your face</li>
                <li className="flex items-center gap-1.5"><ChevronRight size={10} /> Max file size: 5MB per image</li>
              </ul>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Shield size={16} />
              {submitting ? 'Submitting...' : kycStatus?.status === 'REJECTED' ? 'Resubmit Documents' : 'Submit for Verification'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
