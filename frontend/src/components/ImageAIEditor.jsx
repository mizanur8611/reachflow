// frontend/src/components/ImageAIEditor.jsx
'use client'
import { useState } from 'react'
import { Wand2, RefreshCw, Sparkles, ChevronDown, ChevronUp, Loader2, Check, Download } from 'lucide-react'

const PRESETS = [
  { id: 'studio_white', label: 'স্টুডিও White', emoji: '⬜', desc: 'Clean professional' },
  { id: 'studio_dark', label: 'স্টুডিও Dark', emoji: '⬛', desc: 'Dramatic moody' },
  { id: 'gradient_purple', label: 'Purple Gradient', emoji: '🟣', desc: 'Modern & trendy' },
  { id: 'gradient_blue', label: 'Blue Gradient', emoji: '🔵', desc: 'Premium tech look' },
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛍️', desc: 'Perfect for selling' },
  { id: 'lifestyle_outdoor', label: 'Outdoor', emoji: '🌿', desc: 'Natural lifestyle' },
  { id: 'lifestyle_home', label: 'Home Interior', emoji: '🏠', desc: 'Cozy & warm' },
  { id: 'luxury', label: 'Luxury', emoji: '✨', desc: 'Premium brand feel' },
]

export default function ImageAIEditor({ imageUrl, token, onImageUpdate }) {
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [resultUrl, setResultUrl] = useState(null)
  const [error, setError] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [step, setStep] = useState('') // 'removing' | 'generating' | 'done'

  const apiCall = async (endpoint, body) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/imageai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Failed')
    return data.imageUrl
  }

  const handleRemoveBg = async () => {
    try {
      setLoading(true); setLoadingType('remove'); setError(''); setStep('removing')
      const url = await apiCall('remove-bg', { imageUrl })
      setResultUrl(url)
      onImageUpdate?.(url)
      setStep('done')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleChangeBg = async (preset = null) => {
    try {
      setLoading(true); setLoadingType(preset || 'custom'); setError(''); setSelectedPreset(preset)
      setStep('generating')
      const url = await apiCall('change-bg', {
        imageUrl: resultUrl || imageUrl,
        preset,
        backgroundPrompt: !preset ? customPrompt : undefined
      })
      setResultUrl(url)
      onImageUpdate?.(url)
      setStep('done')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleEnhance = async () => {
    try {
      setLoading(true); setLoadingType('enhance'); setError(''); setStep('generating')
      const url = await apiCall('enhance', { imageUrl: resultUrl || imageUrl })
      setResultUrl(url)
      onImageUpdate?.(url)
      setStep('done')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleReset = () => {
    setResultUrl(null)
    setSelectedPreset(null)
    setStep('')
    setError('')
    onImageUpdate?.(imageUrl)
  }

  const currentImage = resultUrl || imageUrl

  const loadingMessages = {
    remove: 'Background সরানো হচ্ছে...',
    enhance: 'Image enhance হচ্ছে...',
    custom: 'AI দিয়ে background তৈরি হচ্ছে...',
  }

  return (
    <div style={{ background: '#111', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 12 }}>
      
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wand2 size={16} color='#a855f7' />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>AI Image Editor</span>
        <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto', background: '#1a1a1a', padding: '2px 8px', borderRadius: 999 }}>Powered by AI</span>
      </div>

      <div style={{ padding: 16 }}>
        {/* Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: resultUrl ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: '#555', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original</p>
            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#1a1a1a', aspectRatio: '1', position: 'relative' }}>
              <img src={imageUrl} alt="original" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          {resultUrl && (
            <div>
              <p style={{ fontSize: 11, color: '#a855f7', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✨ AI Result</p>
              <div style={{ borderRadius: 10, overflow: 'hidden', background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 0 0 / 12px 12px', aspectRatio: '1', position: 'relative' }}>
                <img src={resultUrl} alt="result" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(168,85,247,0.1)', borderRadius: 10, marginBottom: 14, border: '1px solid rgba(168,85,247,0.2)' }}>
            <Loader2 size={16} color='#a855f7' style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 600 }}>
              {loadingMessages[loadingType] || 'AI কাজ করছে...'}
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, marginBottom: 14, border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
            ❌ {error}
          </div>
        )}

        {/* Step 1: Remove BG */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={handleRemoveBg} disabled={loading}
            style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={14} /> Background সরাও (Step 1)
          </button>
        </div>

        {/* Step 2: Backgrounds */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 8, fontWeight: 600 }}>নতুন Background দাও (Step 2)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => handleChangeBg(p.id)} disabled={loading}
                style={{ padding: '8px 4px', borderRadius: 8, border: selectedPreset === p.id ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.08)', background: selectedPreset === p.id ? 'rgba(168,85,247,0.15)' : '#1a1a1a', cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: loading ? 0.5 : 1, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 18 }}>{p.emoji}</div>
                <div style={{ fontSize: 9, color: selectedPreset === p.id ? '#a855f7' : '#888', fontWeight: 600, marginTop: 2, lineHeight: 1.2 }}>{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setShowCustom(!showCustom)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
            {showCustom ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            নিজের মতো background লিখো
          </button>
          {showCustom && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                placeholder="যেমন: beach sunset background..."
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a', color: '#fff', fontSize: 13, outline: 'none' }} />
              <button onClick={() => handleChangeBg(null)} disabled={loading || !customPrompt}
                style={{ padding: '9px 14px', borderRadius: 8, background: '#a855f7', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: loading || !customPrompt ? 'not-allowed' : 'pointer', opacity: loading || !customPrompt ? 0.5 : 1 }}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Enhance */}
        <button onClick={handleEnhance} disabled={loading}
          style={{ width: '100%', padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: '#1a1a1a', color: '#ccc', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1, marginBottom: resultUrl ? 10 : 0 }}>
          <Sparkles size={14} /> Image Enhance / Upscale করো
        </button>

        {/* Reset + Use */}
        {resultUrl && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <button onClick={handleReset}
              style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Reset করো
            </button>
            <button onClick={() => { onImageUpdate?.(resultUrl); }}
              style={{ padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} /> এটা Use করো
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
