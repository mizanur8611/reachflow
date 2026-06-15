'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save, Edit3, X, User, Mail, Phone, Building } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AdvertiserProfilePage() {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', company: '' })
  const { setUser } = useAuthStore()

  useEffect(() => {
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
        }
      } catch (err) {}
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.user) {
        setProfile(data.user)
        setUser(data.user)
        const stored = localStorage.getItem('rf_user')
        if (stored) localStorage.setItem('rf_user', JSON.stringify({ ...JSON.parse(stored), ...data.user }))
      }
      setEditing(false)
    } catch (err) {}
    setSaving(false)
  }

  if (!profile) return <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-400 mt-1">তোমার account manage করো</p>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors">
                <X size={16} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors">
              <Edit3 size={16} /> Edit Profile
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {profile?.avatar ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" /> : (profile?.name?.[0] || 'A')}
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-500 transition-colors">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('image', file)
                  const token = localStorage.getItem('rf_token')
                  const res = await fetch(`${API}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
                  const data = await res.json()
                  if (data.url) {
                    await fetch(`${API}/api/auth/rofile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ avatar: data.url }) })
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
            <div>
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              <p className="text-gray-400">{profile?.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Advertiser</span>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><User size={12} /> Full Name</label>
              {editing ? (
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50" />
              ) : (
                <p className="text-white px-4 py-3 bg-white/5 rounded-xl">{profile?.name || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Mail size={12} /> Email</label>
              <p className="text-gray-400 px-4 py-3 bg-white/5 rounded-xl">{profile?.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Phone size={12} /> Phone</label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50" />
              ) : (
                <p className="text-white px-4 py-3 bg-white/5 rounded-xl">{profile?.phone || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1"><Building size={12} /> Company</label>
              {editing ? (
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Company name"
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50" />
              ) : (
                <p className="text-white px-4 py-3 bg-white/5 rounded-xl">{profile?.company || '—'}</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

