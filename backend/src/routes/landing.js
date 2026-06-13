// backend/src/routes/landing.js
const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
const OpenAI = require('openai')

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Auth Middleware ──
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

// ── Slug Generator ──
function generateSlug(productName) {
  const base = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)
  const random = Math.random().toString(36).slice(2, 7)
  return `${base}-${random}`
}

// ── AI Content Generator (built-in) ──
async function generateLandingPageContent({ productName, productTitle, productDetails, price, discountPrice, platforms, category }) {
  try {
    const priceInfo = discountPrice
      ? `Original: $${price}, Discount: $${discountPrice}`
      : price ? `Price: $${price}` : 'Price not specified'

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: `তুমি একজন expert Bangladeshi social media marketer। বাংলা এবং English mix করে লিখবে (Banglish style)। Content হবে engaging, emotional এবং conversion-focused।`
      }, {
        role: 'user',
        content: `এই product এর জন্য content তৈরি করো:
Product: ${productName}
Title: ${productTitle}
Details: ${productDetails}
${priceInfo}
Category: ${category}
Platforms: ${platforms?.join(', ')}

শুধু JSON দাও, কোনো extra text না:
{"headline":"catchy headline max 10 words","description":"2-3 sentence description","hashtags":["tag1","tag2","tag3","tag4","tag5"],"captions":{"FACEBOOK":"emotional caption 300 chars max","TIKTOK":"trendy short caption 150 chars max","INSTAGRAM":"aesthetic caption with hashtags 200 chars max","TELEGRAM":"direct offer caption 200 chars max","TWITTER":"punchy 280 chars max"}}`
      }],
      max_tokens: 1200
    })

    const text = response.choices[0].message.content.trim()
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('AI error:', err)
    return {
      headline: productTitle,
      description: productDetails,
      hashtags: ['offer', 'sale', 'bangladesh', 'trending', 'viral'],
      captions: {
        FACEBOOK: `🔥 ${productTitle}\n\n${productDetails}\n\nএখনই নিন! 👇`,
        TIKTOK: `✨ ${productName} - Must Have! 🔥 Link in bio!`,
        INSTAGRAM: `${productTitle} ✨\n\n${productDetails}\n\n#trending #viral #bangladesh`,
        TELEGRAM: `🎯 Special Offer: ${productTitle}\n${productDetails}`,
        TWITTER: `🔥 ${productTitle} - ${productDetails}`,
      }
    }
  }
}

// ══════════════════════════════════════════
// POST /api/landing/create/:campaignId
// ══════════════════════════════════════════
router.post('/create/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user.id
    const { productName, productTitle, productDetails, productImages, productVideo, price, discountPrice, ctaText, ctaUrl, template, primaryColor } = req.body

    if (!productName || !productTitle || !productDetails || !ctaUrl) {
      return res.status(400).json({ error: 'productName, productTitle, productDetails এবং ctaUrl required' })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { advertiser: true }
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    if (campaign.advertiser.userId !== userId) return res.status(403).json({ error: 'Access denied' })

    const existing = await prisma.campaignLandingPage.findUnique({ where: { campaignId } })
    if (existing) {
      return res.status(400).json({ error: 'Landing page already আছে', slug: existing.slug })
    }

    // AI content generate
    const aiContent = await generateLandingPageContent({
      productName, productTitle, productDetails,
      price, discountPrice,
      platforms: campaign.targetPlatforms,
      category: campaign.category
    })

    const slug = generateSlug(productName)
    const landingPage = await prisma.campaignLandingPage.create({
      data: {
        campaignId,
        productName,
        productTitle,
        productDetails,
        productImages: productImages || [],
        productVideo: productVideo || null,
        price: price ? parseFloat(price) : null,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        ctaText: ctaText || 'এখনই কিনুন',
        ctaUrl,
        slug,
        template: template || 'modern',
        primaryColor: primaryColor || '#7C3AED',
        aiHeadline: aiContent.headline,
        aiDescription: aiContent.description,
        aiHashtags: aiContent.hashtags,
        captionFacebook: aiContent.captions?.FACEBOOK,
        captionTiktok: aiContent.captions?.TIKTOK,
        captionInstagram: aiContent.captions?.INSTAGRAM,
        captionTelegram: aiContent.captions?.TELEGRAM,
        captionTwitter: aiContent.captions?.TWITTER,
      }
    })

    res.json({
      success: true,
      message: 'Landing page তৈরি হয়েছে!',
      landingPage,
      shareUrl: `${process.env.FRONTEND_URL}/p/${slug}`
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/landing/campaign/:campaignId
// ══════════════════════════════════════════
router.get('/campaign/:campaignId', authMiddleware, async (req, res) => {
  try {
    const landingPage = await prisma.campaignLandingPage.findUnique({
      where: { campaignId: req.params.campaignId }
    })
    if (!landingPage) return res.status(404).json({ error: 'Landing page not found' })
    res.json({ success: true, landingPage })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/landing/:slug (PUBLIC)
// ══════════════════════════════════════════
router.get('/:slug', async (req, res) => {
  try {
    const landingPage = await prisma.campaignLandingPage.findUnique({
      where: { slug: req.params.slug },
      include: { campaign: { select: { title: true, status: true } } }
    })
    if (!landingPage || !landingPage.isPublished) {
      return res.status(404).json({ error: 'Page not found' })
    }
    await prisma.campaignLandingPage.update({
      where: { id: landingPage.id },
      data: { totalViews: { increment: 1 } }
    })
    res.json({ success: true, landingPage })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/landing/:slug/click (PUBLIC)
// ══════════════════════════════════════════
router.post('/:slug/click', async (req, res) => {
  try {
    await prisma.campaignLandingPage.update({
      where: { slug: req.params.slug },
      data: { totalClicks: { increment: 1 } }
    })
    res.json({ success: true })
  } catch {
    res.json({ success: false })
  }
})

// ══════════════════════════════════════════
// PUT /api/landing/update/:campaignId
// ══════════════════════════════════════════
router.put('/update/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { advertiser: true }
    })
    if (!campaign || campaign.advertiser.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
    const updated = await prisma.campaignLandingPage.update({
      where: { campaignId },
      data: { ...req.body, updatedAt: new Date() }
    })
    res.json({ success: true, landingPage: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
