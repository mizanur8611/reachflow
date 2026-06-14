'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLink, ChevronLeft, ChevronRight, Share2, Play, ShieldCheck, Zap, Star, Clock, MessageCircle, Facebook, Send } from 'lucide-react'

export default function LandingPageClient({ params: propParams }) {
  const routerParams = useParams()
  const params = propParams || routerParams

  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [shared, setShared] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [lang, setLang] = useState('bn') // 'bn' or 'en'

  const t = {
    bn: {
      buyNow: 'এখনই কিনুন',
      details: 'বিস্তারিত',
      saved: 'সাশ্রয়!',
      off: 'ছাড়!',
      todayOnly: 'আজই নিন',
      safe: '১০০% নিরাপদ',
      trusted: 'বিশ্বস্ত বিক্রেতা',
      fast: 'দ্রুত ডেলিভারি',
      offerEnds: 'অফার শেষ হতে বাকি',
      days: 'দিন',
      hours: 'ঘণ্টা',
      minutes: 'মিনিট',
      seconds: 'সেকেন্ড',
      whatsapp: 'WhatsApp এ যোগাযোগ',
      share: 'শেয়ার করুন',
      copied: 'কপি হয়েছে!',
      poweredBy: 'Powered by',
      offerExpired: 'অফার শেষ হয়ে গেছে!',
      shareTitle: 'শেয়ার করুন',
      fbShare: 'Facebook এ শেয়ার',
      waShare: 'WhatsApp এ শেয়ার',
      tgShare: 'Telegram এ শেয়ার',
      copyLink: 'Link কপি করুন',
    },
    en: {
      buyNow: 'Buy Now',
      details: 'Product Details',
      saved: 'saved!',
      off: '% OFF',
      todayOnly: 'Get it today',
      safe: '100% Secure',
      trusted: 'Trusted Seller',
      fast: 'Fast Delivery',
      offerEnds: 'Offer ends in',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Mins',
      seconds: 'Secs',
      whatsapp: 'Contact on WhatsApp',
      share: 'Share',
      copied: 'Copied!',
      poweredBy: 'Powered by',
      offerExpired: 'Offer has ended!',
      shareTitle: 'Share',
      fbShare: 'Share on Facebook',
      waShare: 'Share on WhatsApp',
      tgShare: 'Share on Telegram',
      copyLink: 'Copy Link',
    }
  }[lang]

  useEffect(() => {
    const savedLang = localStorage.getItem('rf_lang') || 'bn'
    setLang(savedLang)
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn'
    setLang(newLang)
    localStorage.setItem('rf_lang', newLang)
  }

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

  // Countdown Timer
  useEffect(() => {
    if (!page?.offerEndsAt) return
    const endDate = new Date(page.offerEndsAt)

    const tick = () => {
      const now = new Date()
      const diff = endDate - now
      if (diff <= 0) { setTimeLeft(null); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [page])

  const handleCTAClick = async () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/landing/${params.slug}/click`, { method: 'POST' })
    window.open(page.ctaUrl, '_blank')
  }

  const handleShare = async (platform) => {
    const url = window.location.href
    const text = `${page.aiHeadline || page.productTitle} - ${url}`
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(page.aiHeadline || '')}`, '_blank')
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    const number = page.whatsappNumber?.replace(/\D/g, '')
    const msg = `আমি আপনার "${page.productTitle}" product সম্পর্কে জানতে চাই।`
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #333', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 16 }}>
      <p style={{ fontSize: 64 }}>😕</p>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Page পাওয়া যায়নি</h1>
    </div>
  )

  const color = page.primaryColor || '#a855f7'
  const hasDiscount = page.discountPrice && page.discountPrice < page.price
  const discountPct = hasDiscount ? Math.round(((page.price - page.discountPrice) / page.price) * 100) : null
  const savings = hasDiscount ? (page.price - page.discountPrice).toFixed(2) : null
  const offerExpired = page.offerEndsAt && new Date(page.offerEndsAt) < new Date() && !timeLeft

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 20px 60px ${color}55 !important; }
        .cta-btn:active { transform: scale(0.97); }
        .share-btn:hover { background: rgba(255,255,255,0.1) !important; }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 ${color}66; } 70% { box-shadow: 0 0 0 12px ${color}00; } 100% { box-shadow: 0 0 0 0 ${color}00; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ticker { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.5s 0.1s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.2s ease both; }
        .ticker { animation: ticker 1s ease-in-out infinite; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)', background: 'rgba(13,13,13,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${color}, ${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>R</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>ReachFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language Toggle */}
          <button onClick={toggleLang}
            style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#ccc', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {lang === 'bn' ? '🇬🇧 EN' : '🇧🇩 বাংলা'}
          </button>
          <button onClick={() => handleShare('copy')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ccc', fontSize: 12, cursor: 'pointer' }}>
            <Share2 size={13} /> {shared ? t.copied : t.share}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 140px' }}>

        {/* Countdown Timer */}
        {timeLeft && (
          <div className="fade-up" style={{ marginTop: 16, background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}44`, borderRadius: 16, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>⏰ {t.offerEnds}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {[
                { val: timeLeft.days, label: t.days },
                { val: timeLeft.hours, label: t.hours },
                { val: timeLeft.minutes, label: t.minutes },
                { val: timeLeft.seconds, label: t.seconds },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div className="ticker" style={{ background: color, borderRadius: 10, padding: '8px 12px', minWidth: 52, fontSize: 22, fontWeight: 900, color: '#fff' }}>
                    {String(item.val).padStart(2, '0')}
                  </div>
                  <p style={{ fontSize: 10, color: '#888', marginTop: 4, fontWeight: 600 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer Expired */}
        {offerExpired && (
          <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', color: '#f87171', fontSize: 14, fontWeight: 700 }}>
            ❌ {t.offerExpired}
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="fade-up" style={{ marginTop: timeLeft ? 12 : 20, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}44`, fontSize: 13, fontWeight: 700, color }}>
              <Zap size={13} fill={color} /> {discountPct}% {t.off} — {t.todayOnly}
            </div>
          </div>
        )}

        {/* Media */}
        <div className="fade-up-2" style={{ marginTop: 14, borderRadius: 20, overflow: 'hidden', background: '#1a1a1a', aspectRatio: '4/3', position: 'relative', boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.6)` }}>
          {page.productVideo && showVideo ? (
            <video src={page.productVideo} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : page.productImages?.length > 0 && !imgError ? (
            <>
              <img src={page.productImages[currentImage]} alt={page.productName} onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', pointerEvents: 'none' }} />
              {page.productImages.length > 1 && (
                <>
                  <button onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', padding: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCurrentImage(i => Math.min(page.productImages.length - 1, i + 1))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', padding: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}>
                    <ChevronRight size={18} />
                  </button>
                  <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                    {page.productImages.map((_, i) => (
                      <div key={i} onClick={() => setCurrentImage(i)}
                        style={{ width: i === currentImage ? 20 : 6, height: 6, borderRadius: 3, background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} />
                    ))}
                  </div>
                </>
              )}
              {page.productVideo && (
                <button onClick={() => setShowVideo(true)}
                  style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Play size={11} fill="white" /> Video
                </button>
              )}
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>📦</div>
          )}
        </div>

        {/* Thumbnails */}
        {page.productImages?.length > 1 && !imgError && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
            {page.productImages.map((img, i) => (
              <img key={i} src={img} onClick={() => setCurrentImage(i)} alt=""
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, cursor: 'pointer', flexShrink: 0, border: i === currentImage ? `2.5px solid ${color}` : '2.5px solid transparent', opacity: i === currentImage ? 1 : 0.6, transition: 'all 0.2s' }} />
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="fade-up-3" style={{ marginTop: 16, background: 'linear-gradient(135deg, #1a1a1a, #161616)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            {page.aiHeadline || page.productTitle}
          </h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 5 }}>{page.productName}</p>

          {(page.price || page.discountPrice) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {page.discountPrice && <span style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-1px' }}>${page.discountPrice}</span>}
              {page.price && <span style={{ fontSize: hasDiscount ? 16 : 28, fontWeight: hasDiscount ? 500 : 900, color: hasDiscount ? '#555' : color, textDecoration: hasDiscount ? 'line-through' : 'none' }}>${page.price}</span>}
              {savings && <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '4px 10px', borderRadius: 999 }}>${savings} {t.saved}</span>}
            </div>
          )}

          {/* Trust Badges */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {[
              { icon: <ShieldCheck size={12} />, label: t.safe },
              { icon: <Star size={12} />, label: t.trusted },
              { icon: <Clock size={12} />, label: t.fast },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 600, color: '#aaa' }}>
                <span style={{ color }}>{b.icon}</span> {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginTop: 12, background: '#141414', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t.details}</p>
          <p style={{ fontSize: 14, color: '#bbb', lineHeight: 1.7 }}>{page.aiDescription || page.productDetails}</p>
        </div>

        {/* Hashtags */}
        {page.aiHashtags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            {page.aiHashtags.map((tag, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, background: `${color}15`, color, border: `1px solid ${color}30` }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Share Buttons */}
        <div style={{ marginTop: 20, background: '#141414', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t.shareTitle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Facebook', icon: '📘', color: '#1877f2', action: 'facebook' },
              { label: 'WhatsApp', icon: '💬', color: '#25d366', action: 'whatsapp' },
              { label: 'Telegram', icon: '✈️', color: '#0088cc', action: 'telegram' },
              { label: shared ? t.copied : 'Copy', icon: '🔗', color: '#888', action: 'copy' },
            ].map((s, i) => (
              <button key={i} className="share-btn" onClick={() => handleShare(s.action)}
                style={{ padding: '8px 4px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 18 }}>{s.icon}</div>
                <div style={{ fontSize: 9, color: '#888', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Contact */}
        {page.whatsappNumber && (
          <button onClick={handleWhatsApp}
            style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 14, border: '1px solid #25d36644', background: 'rgba(37,211,102,0.08)', color: '#25d366', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <MessageCircle size={18} /> {t.whatsapp}
          </button>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#333' }}>{t.poweredBy} <span style={{ color: '#555' }}>ReachFlow</span></p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 20px', background: 'linear-gradient(to top, #0D0D0D 70%, transparent)', zIndex: 40 }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <button onClick={handleCTAClick} className="cta-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '17px 24px', borderRadius: 16, border: 'none', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff', fontSize: 17, fontWeight: 800, cursor: 'pointer', letterSpacing: '-0.3px', boxShadow: `0 8px 32px ${color}44`, transition: 'all 0.2s', animation: 'pulse-ring 2.5s ease-in-out infinite' }}>
            {page.ctaText || t.buyNow} <ExternalLink size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
