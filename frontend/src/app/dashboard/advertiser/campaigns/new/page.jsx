'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

const PLATFORMS = ['Facebook', 'TikTok', 'Instagram', 'YouTube', 'WhatsApp', 'Telegram', 'Twitter']
const CATEGORIES = ['Fashion', 'Food', 'Tech', 'Beauty', 'Health', 'Education', 'Gaming', 'General']

export default function CreateCampaignPage() {
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    commissionAmount: '',
    commissionType: 'PER_POST',
    category: 'General',
    platforms: [],
  })

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p]
    }))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.budget || form.platforms.length === 0) {
      setError('Title, Budget and at least one Platform is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          budget: parseFloat(form.budget),
          commissionAmount: parseFloat(form.commissionAmount),
          commissionType: form.commissionType,
          category: form.category,
          platforms: form.platforms,
        })
      })
      const data = await res.json()
      if (data.success) {
        router.push('/dashboard/advertiser')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setError('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/advertiser" className="p-2 bg-white/5 rounded-xl hover:bg-white/10">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create New Campaign</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in all the details</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 space-y-6"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Campaign Title *</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              placeholder="e.g. Summer Collection Promo"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Description</label>
            <textarea
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
              placeholder="Describe your campaign..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Budget & Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Total Budget ($) *</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                placeholder="500"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Commission ($)</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                placeholder="10"
                value={form.commissionAmount}
                onChange={e => setForm(f => ({ ...f, commissionAmount: e.target.value }))}
              />
            </div>
          </div>

          {/* Commission Type */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Commission Type</label>
            <div className="flex gap-3">
              {['PER_POST', 'PER_SALE', 'PER_CLICK'].map(type => (
                <button
                  key={type}
                  onClick={() => setForm(f => ({ ...f, commissionType: type }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    form.commissionType === type
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {type === 'PER_POST' ? 'Per Post' : type === 'PER_SALE' ? 'Per Sale' : 'Per Click'}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Category</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1a1b23]">{c}</option>)}
            </select>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-sm text-gray-400 mb-3 block">Platforms * (where to promote)</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    form.platforms.includes(p)
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition-all"
          >
            {loading ? 'Creating...' : <><Plus size={18} /> Create Campaign</>}
          </button>
        </motion.div>
      </div>
    </div>
  )
}