'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Save, Edit3, X, User, Mail, Phone, Building, Globe } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AdvertiserProfilePage() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', company: '' })
  const { setUser } = useAuthStore()

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.user) {
        setProfile(data.user)
        setForm({ name: data.user.name || '', phone: data.user.phone || '', company: data.user.company || '' })
        localStorage.setItem('rf_user', JSON.stringify(data.user))
        setUser(data.user)
      }
    } catch (err) {}
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Error')
      setProfile(data.user)
      setUser(data.user)
      localStorage.setItem('rf_user', JSON.stringify(data.user))
      setSuccess('Profile updated!')
      setEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Server error') }
    finally { setSaving(false) }
  }

  if (!profile) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-400 mt-1">তোমার account manage করো</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors">
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setError('') }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 mb-6">

          {/* Avatar + Name */}
          <div className="flex items-start gap-5 mb-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {profile?.avatar
                  ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : (profile?.name?.[0] || 'A')}
              </div>
              <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-500 transition-colors">
                <Camera size={13} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('image', file)
                  const token = localStorage.getItem('rf_token')
                  const res = await fetch(`${API}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
                  const data = await res.json()
                  if (data.url) {
                    await fetch(`${API}/api/auth/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ avatar: data.url }) })
                    setProfile(p => ({ ...p, avatar: data.url }))
                    const stored = localStorage.getItem('rf_user')
                    if (stored) {
                      const u = JSON.parse(stored)
                      localStorage.setItem('rf_user', JSON.stringify({ ...u, avatar: data.url }))
                      setUser({ ...u, avatar: data.url })
                    }
                  }
                }} />
              </label>
            </div>
            <div className="flex-1">
              {editing ? (
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:border-violet-500/50 mb-2" />
              ) : (
                <h2 className="text-xl font-bold mb-1">{profile?.name}</h2>
              )}
              <p className="text-gray-400 text-sm">{profile?.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Advertiser</span>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Phone size={12} /> Phone</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
              ) : (
                <p className="text-sm text-gray-300 px-4 py-2.5 bg-white/5 rounded-xl">{profile?.phone || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Building size={12} /> Company</label>
              {editing ? (
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Company name"
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
              ) : (
                <p className="text-sm text-gray-300 px-4 py-2.5 bg-white/5 rounded-xl">{profile?.company || '—'}</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Mail size={12} /> Email</label>
              <p className="text-sm text-gray-400 px-4 py-2.5 bg-white/5 rounded-xl">{profile?.email}</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

