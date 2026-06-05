// src/services/fraudDetection.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Calculate fraud score for a submission (0 = clean, 1 = highly suspicious)
 */
async function calculateFraudScore(submission, promoterId, ip = null) {
  let score = 0
  const flags = []

  try {
    // ─────────────────────────────────────────
    // CHECK 1: Duplicate URL (same post submitted before)
    // ─────────────────────────────────────────
    const duplicateUrl = await prisma.submission.findFirst({
      where: {
        postUrl: submission.postUrl,
        id: { not: submission.id },
      },
    })
    if (duplicateUrl) {
      score += 0.4
      flags.push('DUPLICATE_URL')
    }

    // ─────────────────────────────────────────
    // CHECK 2: Too many submissions in short time (spam)
    // ─────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentSubmissions = await prisma.submission.count({
      where: {
        promoterId,
        submittedAt: { gte: oneHourAgo },
        id: { not: submission.id },
      },
    })
    if (recentSubmissions >= 5) {
      score += 0.3
      flags.push('TOO_MANY_SUBMISSIONS')
    } else if (recentSubmissions >= 3) {
      score += 0.15
      flags.push('FREQUENT_SUBMISSIONS')
    }

    // ─────────────────────────────────────────
    // CHECK 3: Same campaign multiple submissions
    // ─────────────────────────────────────────
    const sameCampaignCount = await prisma.submission.count({
      where: {
        promoterId,
        campaignId: submission.campaignId,
        id: { not: submission.id },
      },
    })
    if (sameCampaignCount >= 3) {
      score += 0.25
      flags.push('MULTIPLE_SAME_CAMPAIGN')
    }

    // ─────────────────────────────────────────
    // CHECK 4: URL validity check (suspicious URLs)
    // ─────────────────────────────────────────
    const suspiciousDomains = ['bit.ly', 'tinyurl', 'goo.gl', 'shorturl', 't.co/fake']
    const postUrl = submission.postUrl?.toLowerCase() || ''
    
    const isSuspiciousUrl = suspiciousDomains.some(d => postUrl.includes(d))
    if (isSuspiciousUrl) {
      score += 0.2
      flags.push('SUSPICIOUS_URL')
    }

    // Valid social media URL check
    const validDomains = [
      'facebook.com', 'fb.com', 'instagram.com', 'tiktok.com',
      'youtube.com', 'youtu.be', 'twitter.com', 'x.com',
      'linkedin.com', 'telegram.me', 't.me', 'threads.net'
    ]
    const isValidSocialUrl = validDomains.some(d => postUrl.includes(d))
    if (!isValidSocialUrl && postUrl.length > 0) {
      score += 0.2
      flags.push('INVALID_SOCIAL_URL')
    }

    // ─────────────────────────────────────────
    // CHECK 5: Promoter account age (new account spam)
    // ─────────────────────────────────────────
    const promoter = await prisma.promoter.findUnique({
      where: { id: promoterId },
      include: { user: true },
    })
    if (promoter) {
      const accountAgeDays = (Date.now() - new Date(promoter.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      if (accountAgeDays < 1) {
        score += 0.3
        flags.push('NEW_ACCOUNT')
      } else if (accountAgeDays < 3) {
        score += 0.15
        flags.push('VERY_NEW_ACCOUNT')
      }

      // ─────────────────────────────────────────
      // CHECK 6: No social accounts linked
      // ─────────────────────────────────────────
      const socialAccounts = await prisma.socialAccount.count({
        where: { promoterId },
      })
      if (socialAccounts === 0) {
        score += 0.15
        flags.push('NO_SOCIAL_ACCOUNTS')
      }

      // ─────────────────────────────────────────
      // CHECK 7: Very low followers
      // ─────────────────────────────────────────
      if (promoter.totalFollowers === 0 && socialAccounts > 0) {
        score += 0.1
        flags.push('ZERO_FOLLOWERS')
      }
    }

    // ─────────────────────────────────────────
    // CHECK 8: Previously flagged submissions
    // ─────────────────────────────────────────
    const flaggedCount = await prisma.submission.count({
      where: {
        promoterId,
        status: 'FLAGGED',
      },
    })
    if (flaggedCount >= 3) {
      score += 0.3
      flags.push('HISTORY_OF_FRAUD')
    } else if (flaggedCount >= 1) {
      score += 0.1
      flags.push('PREVIOUS_FLAG')
    }

    // Cap score at 1.0
    score = Math.min(score, 1.0)
    score = Math.round(score * 100) / 100

    return { score, flags }
  } catch (error) {
    console.error('Fraud detection error:', error)
    return { score: 0, flags: [] }
  }
}

/**
 * Get fraud risk level from score
 */
function getFraudRiskLevel(score) {
  if (score >= 0.7) return { level: 'HIGH', color: 'red', label: '🔴 High Risk' }
  if (score >= 0.4) return { level: 'MEDIUM', color: 'orange', label: '🟡 Medium Risk' }
  if (score >= 0.2) return { level: 'LOW', color: 'yellow', label: '🟢 Low Risk' }
  return { level: 'CLEAN', color: 'green', label: '✅ Clean' }
}

module.exports = { calculateFraudScore, getFraudRiskLevel }
