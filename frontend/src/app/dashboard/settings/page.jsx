'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return setError('সব field পূরণ করো')
    }
    if (form.newPassword.length < 6) {
      return setError('নতুন password কমপক্ষে ৬ character হতে হবে')
    }
    if (form.newPassword !== form.confirmPassword) {
      return setError('নতুন password দুটো match করছে না')
    }
    if (form.currentPassword === form.newPassword) {
      return setError('নতুন password পুরনো password এর মতো হতে পারবে না')
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'কিছু একটা সমস্যা হয়েছে')
      setSuccess('Password সফলভাবে পরিবর্তন হয়েছে! 🎉')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      setError('Server error')
    } finally {
      setLoading(false)
    }
  }

  const InputField = ({ label, field, showKey }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-3 text-gray-500" />
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[field]}
          onChange={e => setForm({ ...form, [field]: e.target.value })}
          className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
          placeholder="••••••••"
        />
        <button type="button"
          onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300">
          {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-md mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Change Password 🔐</h1>
          <p className="text-gray-400 mt-1">তোমার account এর password পরিবর্তন করো।</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 space-y-4">

          <InputField label="Current Password" field="currentPassword" showKey="current" />
          <InputField label="New Password (কমপক্ষে ৬ character)" field="newPassword" showKey="new" />
          <InputField label="Confirm New Password" field="confirmPassword" showKey="confirm" />

          {/* Password strength indicator */}
          {form.newPassword && (
            <div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    form.newPassword.length >= i * 3
                      ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                      : 'bg-white/10'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {form.newPassword.length < 6 ? 'Too short' :
                 form.newPassword.length < 8 ? 'Weak' :
                 form.newPassword.length < 12 ? 'Good' : 'Strong'}
              </p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors mt-2">
            <Save size={16} />
            {loading ? 'Saving...' : 'Password পরিবর্তন করো'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
