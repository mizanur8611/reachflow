'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, Upload, X, Sparkles, Link as LinkIcon, Video, Image as ImageIcon, Check, Copy } from 'lucide-react'
import Link from 'next/link'

const PLATFORMS = [
  { label: 'Facebook', value: 'FACEBOOK', emoji: '📘' },
  { label: 'TikTok', value: 'TIKTOK', emoji: '🎵' },
  { label: 'Instagram', value: 'INSTAGRAM', emoji: '📸' },
  { label: 'YouTube', value: 'YOUTUBE', emoji: '▶️' },
  { label: 'WhatsApp', value: 'WHATSAPP', emoji: '💬' },
  { label: 'Telegram', value: 'TELEGRAM', emoji: '✈️' },
  { label: 'Twitter', value: 'TWITTER', emoji: '🐦' },
]
const CATEGORIES = ['Fashion', 'Food', 'Tech', 'Beauty', 'Health', 'Education', 'Gaming', 'General']
const TEMPLATES = [
  { value: 'modern', label: 'Modern', desc: 'Clean & professional' },
  { value: 'bold', label: 'Bold', desc: 'High contrast & punchy' },
  { value: 'minimal', label: 'Minimal', desc: 'Simple & elegant' },
]

export default function CreateCampaignPage() {
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_token') : null

  const [step, setStep] = useState(1) // 1: Campaign Info, 2: Landing Page, 3: AI Preview
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCampaignId, setCreatedCampaignId] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const [aiContent, setAiContent] = useState(null)
  const [copied, setCopied] = useState('')

  // Step 1: Campaign form
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', budget: '',
    commissionAmount: '', commissionType: 'PER_POST',
    category: 'General', platforms: [],
  })

  // Step 2: Landing page form
  const [landingForm, setLandingForm] = useState({
    productName: '', productTitle: '', productDetails: '',
    price: '', discountPrice: '', ctaText: 'এখনই কিনুন', ctaUrl: '',
    template: 'modern', primaryColor: '#7C3AED',
  })
  const [productImages, setProductImages] = useState([]) // [{url, preview}]
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('')

  // ── Image Upload ──
  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
      })
      const data = await res.json()
      if (data.success) setUploadedImageUrl(data.url)
      else setError('Image upload failed')
    } catch { setError('Image upload failed') }
    finally { setImageUploading(false) }
  }

  // ── Product Images (multiple) ──
  const handleProductImageAdd = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      if (productImages.length >= 5) break
      const reader = new FileReader()
      const preview = await new Promise(res => { reader.onloadend = () => res(reader.result); reader.readAsDataURL(file) })
      try {
        const formData = new FormData()
        formData.append('image', file)
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        })
        const data = await uploadRes.json()
        if (data.success) {
          setProductImages(prev => [...prev, { url: data.url, preview }])
        }
      } catch { setError('Product image upload failed') }
    }
  }

  // ── Video Upload ──
  const handleVideoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Check duration (max 2 min)
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.onloadedmetadata = async () => {
      if (video.duration > 120) {
        setError('Video must be under 2 minutes')
        return
      }
      setVideoPreview(URL.createObjectURL(file))
      setVideoFile(file)
      setVideoUploading(true)
      try {
        const formData = new FormData()
        formData.append('video', file)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/video`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        })
        const data = await res.json()
        if (data.success) setUploadedVideoUrl(data.url)
        else setError('Video upload failed')
      } catch { setError('Video upload failed') }
      finally { setVideoUploading(false) }
    }
  }

  // ── Step 1: Create Campaign ──
  const handleCreateCampaign = async () => {
    if (!form.title || !form.budget || form.platforms.length === 0) {
      setError('Title, Budget এবং কমপক্ষে একটা Platform দিন')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title, description: form.description,
          budget: parseFloat(form.budget), commissionAmount: parseFloat(form.commissionAmount),
          commissionType: form.commissionType, category: form.category,
          platforms: form.platforms, productImages: uploadedImageUrl ? [uploadedImageUrl] : [],
        })
      })
      const data = await res.json()
      if (data.success) {
        setCreatedCampaignId(data.campaign.id)
        setStep(2)
      } else { setError(data.error || 'Something went wrong') }
    } catch { setError('Cannot connect to server') }
    finally { setLoading(false) }
  }

  // ── Step 2: Generate AI + Create Landing Page ──
  const handleCreateLandingPage = async () => {
    if (!landingForm.productName || !landingForm.productTitle || !landingForm.productDetails || !landingForm.ctaUrl) {
      setError('Product Name, Title, Details এবং CTA URL দিন')
      return
    }
    setAiLoading(true); setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing/create/${createdCampaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...landingForm,
          productImages: productImages.map(i => i.url),
          productVideo: uploadedVideoUrl || null,
          price: landingForm.price ? parseFloat(landingForm.price) : null,
          discountPrice: landingForm.discountPrice ? parseFloat(landingForm.discountPrice) : null,
        })
      })
      const data = await res.json()
      if (data.success) {
        setAiContent(data.landingPage)
        setShareUrl(data.shareUrl)
        setStep(3)
      } else { setError(data.error || 'Landing page তৈরি হয়নি') }
    } catch { setError('Cannot connect to server') }
    finally { setAiLoading(false) }
  }

  // ── Skip landing page ──
  const handleSkip = () => router.push('/dashboard/advertiser')

  // ── Copy to clipboard ──
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const platformCaptions = aiContent ? {
    FACEBOOK: aiContent.captionFacebook,
    TIKTOK: aiContent.captionTiktok,
    INSTAGRAM: aiContent.captionInstagram,
    TELEGRAM: aiContent.captionTelegram,
    TWITTER: aiContent.captionTwitter,
  } : {}

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Link href="/dashboard/advertiser" className="p-2 bg-white/5 rounded-xl hover:bg-white/10">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {step === 1 ? 'Create Campaign' : step === 2 ? 'Landing Page তৈরি করো' : '🎉 সব হয়ে গেছে!'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {step === 1 ? 'Campaign এর basic info দাও' : step === 2 ? 'Product info দাও — AI বাকি সব করবে' : 'Share করো এবং promoter দের পাঠাও'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ══ STEP 1: Campaign Info ══ */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 space-y-6">

              {/* Product Image */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Product Image (thumbnail)</label>
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10">
                    <img src={imagePreview} className="w-full h-full object-cover" />
                    <button onClick={() => { setImagePreview(null); setUploadedImageUrl('') }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg">
                      <X size={16} />
                    </button>
                    {imageUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><p className="text-sm">Uploading...</p></div>}
                    {!imageUploading && uploadedImageUrl && <div className="absolute bottom-2 left-2 bg-emerald-500/80 text-xs px-2 py-1 rounded-lg">✓ Uploaded</div>}
                  </div>
                ) : (
                  <label className="w-full h-36 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 transition-all">
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
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="e.g. Summer Collection Promo" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Description</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Describe your campaign..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Budget & Commission */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Total Budget ($) *</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="500" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Commission ($)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="10" value={form.commissionAmount} onChange={e => setForm(f => ({ ...f, commissionAmount: e.target.value }))} />
                </div>
              </div>

              {/* Commission Type */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Commission Type</label>
                <div className="flex gap-3">
                  {['PER_POST', 'PER_SALE', 'PER_CLICK'].map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, commissionType: type }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.commissionType === type ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                      {type === 'PER_POST' ? 'Per Post' : type === 'PER_SALE' ? 'Per Sale' : 'Per Click'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Category</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1a1b23]">{c}</option>)}
                </select>
              </div>

              {/* Platforms */}
              <div>
                <label className="text-sm text-gray-400 mb-3 block">Platforms *</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.value} onClick={() => setForm(f => ({
                      ...f, platforms: f.platforms.includes(p.value)
                        ? f.platforms.filter(x => x !== p.value) : [...f.platforms, p.value]
                    }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${form.platforms.includes(p.value) ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCreateCampaign} disabled={loading || imageUploading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition-all">
                {loading ? 'Creating...' : <><ArrowRight size={18} /> Next: Landing Page তৈরি করো</>}
              </button>
            </motion.div>
          )}

          {/* ══ STEP 2: Landing Page Builder ══ */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 space-y-6">

              {/* AI Badge */}
              <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                <Sparkles size={16} className="text-violet-400" />
                <p className="text-violet-300 text-sm">Product info দাও — AI automatically সব platform এর জন্য caption তৈরি করবে!</p>
              </div>

              {/* Product Images */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Product Images (max 5)</label>
                <div className="flex gap-3 flex-wrap">
                  {productImages.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                      <img src={img.preview} className="w-full h-full object-cover" />
                      <button onClick={() => setProductImages(p => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full"><X size={10} /></button>
                    </div>
                  ))}
                  {productImages.length < 5 && (
                    <label className="w-20 h-20 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50">
                      <ImageIcon size={20} className="text-gray-500" />
                      <span className="text-gray-600 text-xs mt-1">Add</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleProductImageAdd} />
                    </label>
                  )}
                </div>
              </div>

              {/* Product Video */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Product Video (max 2 min)</label>
                {videoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <video src={videoPreview} controls className="w-full h-40 object-cover" />
                    <button onClick={() => { setVideoPreview(null); setVideoFile(null); setUploadedVideoUrl('') }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg"><X size={16} /></button>
                    {videoUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><p className="text-sm">Uploading video...</p></div>}
                    {!videoUploading && uploadedVideoUrl && <div className="absolute bottom-2 left-2 bg-emerald-500/80 text-xs px-2 py-1 rounded-lg">✓ Uploaded</div>}
                  </div>
                ) : (
                  <label className="w-full h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50">
                    <Video size={24} className="text-gray-500 mb-2" />
                    <p className="text-gray-500 text-sm">Click to upload video</p>
                    <p className="text-gray-600 text-xs mt-1">MP4 (max 2 minutes)</p>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                  </label>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Product Name *</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="e.g. লাল শাড়ি" value={landingForm.productName}
                  onChange={e => setLandingForm(f => ({ ...f, productName: e.target.value }))} />
              </div>

              {/* Product Title */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Product Title *</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="e.g. হাতে বোনা বেনারসি শাড়ি - বিশেষ ছাড়ে" value={landingForm.productTitle}
                  onChange={e => setLandingForm(f => ({ ...f, productTitle: e.target.value }))} />
              </div>

              {/* Product Details */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Product Details *</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  placeholder="Product এর বিস্তারিত বিবরণ দাও — material, size, color, features..."
                  value={landingForm.productDetails}
                  onChange={e => setLandingForm(f => ({ ...f, productDetails: e.target.value }))} />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Original Price ($)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="50" value={landingForm.price}
                    onChange={e => setLandingForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Discount Price ($)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="35" value={landingForm.discountPrice}
                    onChange={e => setLandingForm(f => ({ ...f, discountPrice: e.target.value }))} />
                </div>
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Button Text</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="এখনই কিনুন" value={landingForm.ctaText}
                    onChange={e => setLandingForm(f => ({ ...f, ctaText: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Product/Buy URL *</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    placeholder="https://yourshop.com/product" value={landingForm.ctaUrl}
                    onChange={e => setLandingForm(f => ({ ...f, ctaUrl: e.target.value }))} />
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="text-sm text-gray-400 mb-3 block">Page Template</label>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map(t => (
                    <button key={t.value} onClick={() => setLandingForm(f => ({ ...f, template: t.value }))}
                      className={`p-3 rounded-xl border text-left transition-colors ${landingForm.template === t.value ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                      <p className="font-semibold text-sm">{t.label}</p>
                      <p className="text-gray-500 text-xs mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Brand Color</label>
                <div className="flex gap-3 items-center">
                  {['#7C3AED', '#2563EB', '#DC2626', '#059669', '#D97706', '#DB2777'].map(color => (
                    <button key={color} onClick={() => setLandingForm(f => ({ ...f, primaryColor: color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${landingForm.primaryColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                  <input type="color" value={landingForm.primaryColor}
                    onChange={e => setLandingForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-0" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSkip} className="flex-1 py-3.5 rounded-xl font-semibold border border-white/10 text-gray-400 hover:bg-white/5">
                  Skip করো
                </button>
                <button onClick={handleCreateLandingPage} disabled={aiLoading || videoUploading}
                  className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 py-3.5 rounded-xl font-semibold transition-all">
                  {aiLoading ? (
                    <><Sparkles size={18} className="animate-pulse" /> AI Content তৈরি হচ্ছে...</>
                  ) : (
                    <><Sparkles size={18} /> AI দিয়ে Landing Page তৈরি করো</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 3: AI Result + Share ══ */}
          {step === 3 && aiContent && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">

              {/* Success */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-emerald-400">Landing Page তৈরি হয়েছে!</h2>
                <p className="text-gray-400 text-sm mt-2">Promoter দের এই link পাঠাও</p>
              </div>

              {/* Share URL */}
              <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-2"><LinkIcon size={14} /> Share Link</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-violet-400 text-sm font-mono truncate">
                    {shareUrl}
                  </div>
                  <button onClick={() => handleCopy(shareUrl, 'url')}
                    className="px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors">
                    {copied === 'url' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* AI Headline */}
              <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /> AI Generated Headline</p>
                <p className="text-lg font-bold text-white">{aiContent.aiHeadline}</p>
                <div className="flex gap-2 flex-wrap mt-3">
                  {aiContent.aiHashtags?.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Platform Captions */}
              <div className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5">
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /> Platform Captions (copy করো)</p>
                <div className="space-y-3">
                  {PLATFORMS.filter(p => platformCaptions[p.value]).map(p => (
                    <div key={p.value} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{p.emoji} {p.label}</span>
                        <button onClick={() => handleCopy(platformCaptions[p.value], p.value)}
                          className="p-1.5 bg-white/10 hover:bg-violet-500/20 rounded-lg transition-colors">
                          {copied === p.value ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-gray-400" />}
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{platformCaptions[p.value]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done Button */}
              <button onClick={() => router.push('/dashboard/advertiser')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 py-3.5 rounded-xl font-semibold transition-all">
                Dashboard এ যাও →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


