'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Upload, X } from 'lucide-react'
import Link from 'next/link'

const PLATFORMS = [
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'TikTok', value: 'TIKTOK' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'YouTube', value: 'YOUTUBE' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Telegram', value: 'TELEGRAM' },
  { label: 'Twitter', value: 'TWITTER' },
]
const CATEGORIES = ['Fashion', 'Food', 'Tech', 'Beauty', 'Health', 'Education', 'Gaming', 'General']

export default function CreateCampaignPage() {
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
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
      platforms: f.platforms.includes(p.value)
        ? f.platforms.filter(x => x !== p.value)
        : [...f.platforms, p.value]
    }))
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
    setImageFile(file)

    // Upload to Cloudinary via backend
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setUploadedImageUrl(data.url)
      } else {
        setError('Image upload failed')
      }
    } catch (err) {
      setError('Image upload failed')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.budget || form.platforms.length === 0) {
      setError('Title, Budget and at least one Platform is required')
      return
    }
    if (imageFile && !uploadedImageUrl) {
      setError('Image is still uploading, please wait...')
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
          productImages: uploadedImageUrl ? [uploadedImageUrl] : [],
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

          {/* Product Image Upload */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Product Image (Facebook thumbnail এর জন্য)</label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null); setUploadedImageUrl('') }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/80"
                >
                  <X size={16} />
                </button>
                {imageUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <p className="text-white text-sm">Uploading...</p>
                  </div>
                )}
                {!imageUploading && uploadedImageUrl && (
                  <div className="absolute bottom-2 left-2 bg-emerald-500/80 text-white text-xs px-2 py-1 rounded-lg">
                    ✓ Uploaded
                  </div>
                )}
              </div>
            ) : (
              <label className="w-full h-36 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 hover:bg-white/[0.02] transition-all">
                <Upload size={24} className="text-gray-500 mb-2" />
                <p className="text-gray-500 text-sm">Click to upload image</p>
                <p className="text-gray-600 text-xs mt-1">JPG, PNG (max 5MB)</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

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
                  key={p.value}
                  onClick={() => togglePlatform(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    form.platforms.includes(p.value)
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || imageUploading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition-all"
          >
            {loading ? 'Creating...' : imageUploading ? 'Uploading image...' : <><Plus size={18} /> Create Campaign</>}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
