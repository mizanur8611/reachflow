// backend/src/routes/imageai.js
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const FormData = require('form-data')

const prisma = new PrismaClient()

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = { id: user.id, role: user.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Helper: poll replicate prediction
async function pollPrediction(predictionId, token) {
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed') throw new Error(data.error || 'Prediction failed')
  }
  throw new Error('Timeout')
}

// ══════════════════════════════════════════
// POST /api/imageai/remove-bg
// Remove background from image URL
// ══════════════════════════════════════════
router.post('/remove-bg', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' })

    const token = process.env.REPLICATE_API_TOKEN

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
        input: { image: imageUrl }
      })
    })

    const prediction = await response.json()
    if (prediction.error) return res.status(500).json({ error: prediction.error })

    const output = await pollPrediction(prediction.id, token)
    res.json({ success: true, imageUrl: output })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/imageai/change-bg
// Change background with AI prompt
// ══════════════════════════════════════════
router.post('/change-bg', authMiddleware, async (req, res) => {
  try {
    const { imageUrl, backgroundPrompt, preset } = req.body
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' })

    const token = process.env.REPLICATE_API_TOKEN

    // Preset backgrounds
    const presets = {
      studio_white: 'clean white studio background, professional product photography, soft shadows',
      studio_dark: 'dark dramatic studio background, professional product photography, moody lighting',
      gradient_purple: 'beautiful purple to pink gradient background, modern minimalist',
      gradient_blue: 'deep blue to cyan gradient background, premium tech look',
      lifestyle_outdoor: 'beautiful outdoor lifestyle background, natural sunlight, bokeh',
      lifestyle_home: 'modern home interior background, warm cozy atmosphere',
      ecommerce: 'clean light grey ecommerce background, professional product shot',
      luxury: 'dark luxury background with golden light accents, premium brand feel',
    }

    const bgPrompt = preset ? presets[preset] : (backgroundPrompt || 'clean white studio background')

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 'a4c349e4bb9e28f0fbb3e2e7d7fa9c7c12a9938bf3f6b9cfaeb7f37db960b23e',
        input: {
          image: imageUrl,
          prompt: `Professional product photography, ${bgPrompt}, high quality, 4k, sharp`,
          negative_prompt: 'blurry, low quality, distorted product',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      })
    })

    const prediction = await response.json()
    if (prediction.error) return res.status(500).json({ error: prediction.error })

    const output = await pollPrediction(prediction.id, token)
    const outputUrl = Array.isArray(output) ? output[0] : output
    res.json({ success: true, imageUrl: outputUrl })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/imageai/enhance
// Upscale & enhance product image
// ══════════════════════════════════════════
router.post('/enhance', authMiddleware, async (req, res) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' })

    const token = process.env.REPLICATE_API_TOKEN

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        input: {
          image: imageUrl,
          scale: 2,
          face_enhance: false,
        }
      })
    })

    const prediction = await response.json()
    if (prediction.error) return res.status(500).json({ error: prediction.error })

    const output = await pollPrediction(prediction.id, token)
    res.json({ success: true, imageUrl: output })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
