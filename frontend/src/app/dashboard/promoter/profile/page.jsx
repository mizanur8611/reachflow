'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Edit3, Save, X, Plus, Trash2, Globe, Star,
  CheckCircle, TrendingUp, Wallet, ExternalLink
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

const PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'LINKEDIN', 'TELEGRAM', 'THREADS']
const NICHES = ['Fashion', 'Tech', 'Food', 'Travel', 'Health', 'Beauty', 'Sports', 'Gaming', 'Education', 'Lifestyle', 'Finance', 'Entertainment']
const PLATFORM_COLORS = {
  FACEBOOK: 'bg-blue-500/10 text-blue-400',
  INSTAGRAM: 'bg-pink-500/10 text-pink-400',
  TIKTOK: 'bg-gray-500/10 text-gray-300',
  YOUTUBE: 'bg-red-500/10 text-red-400',
  TWITTER: 'bg-sky-500/10 text-sky-400',
  LINKEDIN: 'bg-blue-600/10 text-blue-500',
  TELEGRAM: 'bg-cyan-500/10 text-cyan-400',
  THREADS: 'bg-purple-500/10 text-purple-400',
}

export default function PromoterProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSocialForm, setShowSocialForm] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({ name: '', bio: '', country: '', niche: [] })
  const [socialForm, setSocialForm] = useState({ platform: 'FACEBOOK', username: '', profileUrl: '', followers: '' })

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/promoter/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
        setForm({
          name: data.profile.name || '',
          bio: data.profile.bio || '',
          country: data.profile.country || '',
          niche: data.profile.niche || []
        })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/promoter/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Error')
      setSuccess('Profile updated!')
      setEditing(false)
      fetchProfile()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Server error') }
    finally { setSaving(false) }
  }

  const toggleNiche = (n) => {
    setForm(f => ({
      ...f,
      niche: f.niche.includes(n) ? f.niche.filter(x => x !== n) : [...f.niche, n]
    }))
  }

  const handleAddSocial = async () => {
    setError('')
    if (!socialForm.username || !socialForm.profileUrl) return setError('Username এবং Profile URL দিতে হবে')
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/promoter/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(socialForm)
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Error')
      setSuccess('Social account added!')
      setShowSocialForm(false)
      setSocialForm({ platform: 'FACEBOOK', username: '', profileUrl: '', followers: '' })
      fetchProfile()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Server error') }
  }

  const handleDeleteSocial = async (id) => {
    try {
      const token = localStorage.getItem('rf_token')
      await fetch(`${API}/api/promoter/social/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchProfile()
    } catch { }
  }

  if (loading) return (
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
            <h1 className="text-3xl font-bold">My Profile 👤</h1>
            <p className="text-gray-400 mt-1">তোমার profile manage করো।</p>
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

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Earned', value: `$${profile?.totalEarned?.toFixed(2) || '0.00'}`, icon: Wallet, color: 'from-emerald-500 to-teal-600' },
            { label: 'Balance', value: `$${profile?.balance?.toFixed(2) || '0.00'}`, icon: TrendingUp, color: 'from-violet-500 to-purple-600' },
            { label: 'Approved Posts', value: profile?.approvedSubmissions || 0, icon: CheckCircle, color: 'from-blue-500 to-cyan-600' },
            { label: 'Rating', value: profile?.rating?.toFixed(1) || '0.0', icon: Star, color: 'from-yellow-500 to-orange-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Profile Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-5 mb-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {profile?.name?.[0] || 'U'}
            </div>
            <div className="flex-1">
              {editing ? (
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-lg font-bold focus:outline-none focus:border-violet-500/50 mb-2" />
              ) : (
                <h2 className="text-xl font-bold mb-1">{profile?.name}</h2>
              )}
              <p className="text-gray-400 text-sm">{profile?.email}</p>
              {profile?.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Bio */}
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1.5 block">Bio</label>
              {editing ? (
                <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="তোমার সম্পর্কে লেখো..."
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none" />
              ) : (
                <p className="text-sm text-gray-300">{profile?.bio || <span className="text-gray-600">No bio yet.</span>}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
              {editing ? (
                <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                  placeholder="Bangladesh"
                  className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
              ) : (
                <p className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Globe size={13} className="text-gray-500" /> {profile?.country || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Niche */}
          <div className="mt-4">
            <label className="text-xs text-gray-400 mb-2 block">Niche {editing && <span className="text-gray-600">(select করো)</span>}</label>
            <div className="flex flex-wrap gap-2">
              {editing ? (
                NICHES.map(n => (
                  <button key={n} onClick={() => toggleNiche(n)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.niche.includes(n) ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {n}
                  </button>
                ))
              ) : (
                profile?.niche?.length > 0 ? profile.niche.map(n => (
                  <span key={n} className="px-3 py-1 bg-violet-500/10 text-violet-400 rounded-full text-xs font-medium">{n}</span>
                )) : <span className="text-gray-600 text-sm">No niche selected.</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Social Accounts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold">Social Accounts</h2>
            <button onClick={() => { setShowSocialForm(!showSocialForm); setError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-lg text-xs font-medium transition-colors">
              <Plus size={14} /> Add Account
            </button>
          </div>

          {/* Social Form */}
          <AnimatePresence>
            {showSocialForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/5">
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Platform</label>
                    <select value={socialForm.platform} onChange={e => setSocialForm({ ...socialForm, platform: e.target.value })}
                      className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50">
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Username</label>
                    <input value={socialForm.username} onChange={e => setSocialForm({ ...socialForm, username: e.target.value })}
                      placeholder="@username"
                      className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Profile URL</label>
                    <input value={socialForm.profileUrl} onChange={e => setSocialForm({ ...socialForm, profileUrl: e.target.value })}
                      placeholder="https://facebook.com/username"
                      className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Followers</label>
                    <input type="number" value={socialForm.followers} onChange={e => setSocialForm({ ...socialForm, followers: e.target.value })}
                      placeholder="10000"
                      className="w-full bg-[#0a0b0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button onClick={handleAddSocial}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors">
                      Add করো
                    </button>
                    <button onClick={() => setShowSocialForm(false)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social List */}
          {profile?.socialAccounts?.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">কোনো social account add হয়নি।</div>
          ) : (
            <div className="divide-y divide-white/5">
              {profile?.socialAccounts?.map((s, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PLATFORM_COLORS[s.platform] || 'bg-white/5 text-gray-400'}`}>
                      {s.platform}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{s.username}</p>
                      <p className="text-xs text-gray-500">{s.followers?.toLocaleString()} followers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={s.profileUrl} target="_blank" rel="noreferrer"
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <ExternalLink size={14} className="text-gray-400" />
                    </a>
                    <button onClick={() => handleDeleteSocial(s.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
