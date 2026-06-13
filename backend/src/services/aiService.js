// ReachFlow - AI Service
// File: backend/src/services/aiService.js

import OpenAI from 'openai'
import { prisma } from '../index.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── AI Promoter Matching ───────────────────
// Finds the best promoters for a campaign using scoring algorithm
export async function aiMatchPromoters(campaign) {
  try {
    const promoters = await prisma.promoter.findMany({
      where: { verified: true },
      include: { socialAccounts: true, user: true }
    })

    const scored = promoters.map(promoter => {
      let score = 0

      // Niche match
      const nicheMatch = promoter.niche.some(n =>
        campaign.category.toLowerCase().includes(n.toLowerCase())
      )
      if (nicheMatch) score += 40

      // Platform match
      const hasPlatform = promoter.socialAccounts.some(sa =>
        campaign.targetPlatforms.includes(sa.platform)
      )
      if (hasPlatform) score += 30

      // Engagement rate (higher = better)
      score += Math.min(promoter.avgEngagement * 2, 20)

      // Country match
      const countryMatch = campaign.targetCountries.includes(promoter.country)
      if (countryMatch) score += 10

      return { ...promoter, matchScore: score }
    })

    // Return top 50 matches
    return scored
      .filter(p => p.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50)
  } catch (err) {
    console.error('AI Matching error:', err)
    return []
  }
}

// ── AI Campaign Quality Score ──────────────
export async function aiScoreCampaign({ title, description, commissionAmount, totalBudget }) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are a campaign quality evaluator for an influencer marketing platform. Score campaigns from 0-100 based on: clarity, budget fairness, description quality, and promoter appeal. Respond with ONLY a JSON object: {"score": number, "feedback": "brief reason"}'
      }, {
        role: 'user',
        content: `Campaign Title: ${title}\nDescription: ${description}\nCommission: $${commissionAmount}\nTotal Budget: $${totalBudget}`
      }],
      max_tokens: 100
    })

    const result = JSON.parse(response.choices[0].message.content)
    return result.score / 100 // normalize to 0-1
  } catch {
    return 0.5 // default score on error
  }
}

// ── AI Content Suggestion ─────────────────
export async function generateContentSuggestion({ campaign, platform, promoterNiche }) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: `You are an expert social media content creator. Generate platform-optimized promotional content for ${platform}. Be authentic, engaging, and not overly salesy.`
      }, {
        role: 'user',
        content: `Create a promotional post for:
Product: ${campaign.title}
Description: ${campaign.description}
Platform: ${platform}
My Niche: ${promoterNiche}
Required Hashtags: ${campaign.hashtags?.join(', ')}

Provide 3 variations. Format as JSON: {"variations": [{"caption": "...", "hashtags": ["..."], "tips": "..."}]}`
      }],
      max_tokens: 800
    })

    const result = JSON.parse(response.choices[0].message.content)
    return result.variations
  } catch {
    return []
  }
}

// ── AI Fraud Detection ────────────────────
export async function detectFraud({ postUrl, promoterId, screenshot }) {
  try {
    let fraudScore = 0
    const reasons = []

    // 1. Check submission history (same promoter submitting too fast)
    const recentSubmissions = await prisma.submission.count({
      where: {
        promoterId,
        submittedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // last 1 hour
      }
    })
    if (recentSubmissions > 5) { fraudScore += 0.3; reasons.push('Too many submissions in 1 hour') }

    // 2. Check if URL was already submitted
    const duplicateUrl = await prisma.submission.findFirst({
      where: { postUrl }
    })
    if (duplicateUrl) { fraudScore += 0.5; reasons.push('Duplicate post URL') }

    // 3. URL validity check
    try {
      const urlCheck = await fetch(postUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (!urlCheck.ok) { fraudScore += 0.2; reasons.push('URL not accessible') }
    } catch {
      fraudScore += 0.15; reasons.push('URL check failed')
    }

    // 4. AI Image Analysis (if screenshot provided)
    if (screenshot) {
      const imageResponse = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: 'Is this a genuine social media post screenshot? Look for signs of editing, fake engagement numbers, or manipulation. Respond with JSON: {"genuine": boolean, "confidence": 0-1, "reason": "..."}'
          }, {
            type: 'image_url',
            image_url: { url: screenshot }
          }]
        }],
        max_tokens: 150
      })

      const analysis = JSON.parse(imageResponse.choices[0].message.content)
      if (!analysis.genuine) {
        fraudScore += 0.4 * analysis.confidence
        reasons.push(`Suspicious screenshot: ${analysis.reason}`)
      }
    }

    return {
      fraudScore: Math.min(fraudScore, 1),
      isFraud: fraudScore > 0.7,
      reasons
    }
  } catch {
    return { fraudScore: 0, isFraud: false, reasons: [] }
  }
}

// ── AI Dashboard Insights ─────────────────
export async function generateInsights(analyticsData) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are a marketing analytics expert. Generate actionable insights from campaign data. Be concise and specific.'
      }, {
        role: 'user',
        content: `Analyze this campaign data and give 3 key insights and recommendations:
${JSON.stringify(analyticsData, null, 2)}

Respond with JSON: {"insights": [{"title": "...", "description": "...", "action": "..."}]}`
      }],
      max_tokens: 400
    })

    const result = JSON.parse(response.choices[0].message.content)
    return result.insights
  } catch {
    return []
  }
}

// ── Routes for AI endpoints ───────────────
import { Router } from 'express'
const router = Router()

router.post('/content-suggestion', async (req, res) => {
  try {
    const { campaignId, platform } = req.body
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.user.id } })

    const suggestions = await generateContentSuggestion({
      campaign,
      platform,
      promoterNiche: promoter.niche?.join(', ')
    })

    res.json({ success: true, suggestions })
  } catch {
    res.status(500).json({ error: 'AI suggestion failed' })
  }
})

router.get('/insights/:campaignId', async (req, res) => {
  try {
    const analytics = await prisma.campaignAnalytics.findUnique({
      where: { campaignId: req.params.campaignId }
    })
    const insights = await generateInsights(analytics)
    res.json({ success: true, insights })
  } catch {
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

// ─────────────────────────────────────────
// aiService.js এর শেষে এই functions যোগ করো
// ─────────────────────────────────────────

// ── AI Landing Page Content Generator ────
export async function generateLandingPageContent({
  productName,
  productTitle,
  productDetails,
  price,
  discountPrice,
  platforms,
  category,
}) {
  try {
    const priceInfo = discountPrice
      ? `Original: $${price}, Discount: $${discountPrice}`
      : price ? `Price: $${price}` : 'Price not specified'

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: `তুমি একজন expert Bangladeshi social media marketer। তোমাকে একটি product এর জন্য viral marketing content তৈরি করতে হবে। 
        বাংলা এবং English mix করে লিখবে (Banglish style)। Content হবে engaging, emotional এবং conversion-focused।`
      }, {
        role: 'user',
        content: `এই product এর জন্য landing page content তৈরি করো:

Product Name: ${productName}
Product Title: ${productTitle}  
Details: ${productDetails}
${priceInfo}
Category: ${category}
Platforms: ${platforms.join(', ')}

নিচের format এ JSON response দাও (শুধু JSON, কোনো extra text না):
{
  "headline": "একটি catchy headline (max 10 words)",
  "description": "SEO-friendly product description (2-3 sentences)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "captions": {
    "FACEBOOK": "Facebook এর জন্য emotional long-form caption (emoji সহ, max 300 chars)",
    "TIKTOK": "TikTok এর জন্য trendy short caption (emoji সহ, max 150 chars)",
    "INSTAGRAM": "Instagram এর জন্য aesthetic caption (hashtags সহ, max 200 chars)",
    "TELEGRAM": "Telegram এর জন্য direct offer-focused caption (max 200 chars)",
    "TWITTER": "Twitter এর জন্য punchy caption (max 280 chars)",
    "YOUTUBE": "YouTube description caption (max 300 chars)",
    "WHATSAPP": "WhatsApp forward-friendly caption (max 200 chars)"
  }
}`
      }],
      max_tokens: 1200
    })

    const content = response.choices[0].message.content.trim()
    const cleaned = content.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Landing page AI error:', err)
    // Fallback content
    return {
      headline: productTitle,
      description: productDetails,
      hashtags: ['#offer', '#sale', '#bangladesh', '#trending', '#viral'],
      captions: {
        FACEBOOK: `🔥 ${productTitle}\n\n${productDetails}\n\nএখনই নিন! 👇`,
        TIKTOK: `✨ ${productName} - Must Have! 🔥 Link in bio!`,
        INSTAGRAM: `${productTitle} ✨\n\n${productDetails}\n\n#trending #viral #bangladesh`,
        TELEGRAM: `🎯 Special Offer: ${productTitle}\n${productDetails}`,
        TWITTER: `🔥 ${productTitle} - Don't miss this! ${productDetails}`,
        YOUTUBE: `${productTitle} - ${productDetails}`,
        WHATSAPP: `🛍️ ${productTitle}\n\n${productDetails}\n\nআজই অর্ডার করুন!`
      }
    }
  }
}

// ── AI route for landing page ─────────────
// এটা aiRouter এ add করো (router এর আগে):

router.post('/generate-landing-content', async (req, res) => {
  try {
    const { productName, productTitle, productDetails, price, discountPrice, platforms, category } = req.body

    if (!productName || !productTitle || !productDetails) {
      return res.status(400).json({ error: 'Product name, title and details required' })
    }

    const content = await generateLandingPageContent({
      productName, productTitle, productDetails,
      price, discountPrice, platforms, category
    })

    res.json({ success: true, content })
  } catch (err) {
    res.status(500).json({ error: 'AI generation failed' })
  }
})


export { router as aiRouter }
export default router






