'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLink, Play, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'

// ── File: frontend/src/app/p/[slug]/page.jsx ──

export default function LandingPage() {
  const params = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setPage(data.landingPage)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.slug])

  const handleCTAClick = async () => {
    // Track click
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing/${params.slug}/click`, { method: 'POST' })
    window.open(page.ctaUrl, '_blank')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: page.productTitle, text: page.aiHeadline, url })
    } else {
      navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-center text-white gap-4">
      <p className="text-6xl">😕</p>
      <h1 className="text-2xl font-bold">Page পাওয়া যায়নি</h1>
      <p className="text-gray-400">এই link টি আর available নেই</p>
    </div>
  )

  const color = page.primaryColor || '#7C3AED'
  const hasDiscount = page.discountPrice && page.discountPrice < page.price
  const savings = hasDiscount ? (page.price - page.discountPrice).toFixed(2) : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0b0f', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: color }}>R</div>
          <span className="text-sm font-semibold text-white">ReachFlow</span>
        </div>
        <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <Share2 size={15} />
          {shared ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">

        {/* ── Media Section ── */}
        <div className="mt-4 relative rounded-2xl overflow-hidden bg-white/5" style={{ aspectRatio: '16/9' }}>
          {page.productVideo && showVideo ? (
            <video src={page.productVideo} controls autoPlay className="w-full h-full object-cover" />
          ) : page.productImages?.length > 0 ? (
            <>
              <img src={page.productImages[currentImage]} alt={page.productName}
                className="w-full h-full object-cover" />
              {/* Image Navigation */}
              {page.productImages.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setCurrentImage(i => Math.min(page.productImages.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70">
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {page.productImages.map((_, i) => (
                      <div key={i} onClick={() => setCurrentImage(i)}
                        className="w-1.5 h-1.5 rounded-full cursor-pointer transition-all"
                        style={{ backgroundColor: i === currentImage ? color : 'rgba(255,255,255,0.3)' }} />
                    ))}
                  </div>
                </>
              )}
              {/* Video Button */}
              {page.productVideo && (
                <button onClick={() => setShowVideo(true)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 rounded-full text-xs font-medium hover:bg-black/90">
                  <Play size={12} fill="white" /> Video দেখো
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📦</div>
          )}
        </div>

        {/* ── Thumbnail Strip ── */}
        {page.productImages?.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {page.productImages.map((img, i) => (
              <img key={i} src={img} onClick={() => setCurrentImage(i)}
                className="w-14 h-14 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all"
                style={{ border: i === currentImage ? `2px solid ${color}` : '2px solid transparent' }} />
            ))}
          </div>
        )}

        {/* ── Product Info ── */}
        <div className="mt-5">
          {/* Badge */}
          {hasDiscount && (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2 text-white"
              style={{ backgroundColor: color }}>
              🔥 {Math.round(((page.price - page.discountPrice) / page.price) * 100)}% OFF
            </span>
          )}

          <h1 className="text-xl font-bold text-white leading-tight">{page.aiHeadline || page.productTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{page.productName}</p>

          {/* Price */}
          {(page.price || page.discountPrice) && (
            <div className="flex items-center gap-3 mt-3">
              {page.discountPrice && (
                <span className="text-2xl font-bold" style={{ color }}>${page.discountPrice}</span>
              )}
              {page.price && (
                <span className={`text-lg ${hasDiscount ? 'text-gray-500 line-through text-base' : 'font-bold'}`}
                  style={!hasDiscount ? { color } : {}}>
                  ${page.price}
                </span>
              )}
              {savings && (
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  ${savings} সাশ্রয়!
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="mt-4 bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Product Details</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{page.aiDescription || page.productDetails}</p>
        </div>

        {/* ── Hashtags ── */}
        {page.aiHashtags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {page.aiHashtags.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: color + '20', color }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Powered by ── */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">Powered by <span className="text-gray-400">ReachFlow</span></p>
        </div>
      </div>

      {/* ── Sticky CTA Button ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0b0f] to-transparent">
        <div className="max-w-lg mx-auto">
          <button onClick={handleCTAClick}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-all active:scale-95"
            style={{ backgroundColor: color }}>
            {page.ctaText} <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}


