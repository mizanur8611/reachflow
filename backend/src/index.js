const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const kycRouter = require('./routes/kyc')
const disputeRouter = require('./routes/dispute')
const ratingRouter = require('./routes/rating')
const analyticsExportRouter = require('./routes/analyticsExport')
const subscriptionRouter = require('./routes/subscription')
const escrowRouter = require('./routes/escrow')
const landingRouter = require('./routes/landing') // ✅ NEW
const { calculateFraudScore, getFraudRiskLevel } = require('./services/fraudDetection')
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const imageaiRouter = require('./routes/imageai')

dotenv.config()
const paymentRouter = require('./routes/payment')
const withdrawalRouter = require('./routes/withdrawal') 
const {
  sendWithdrawalRequestEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRejectedEmail,
  sendSubmissionApprovedEmail,
  sendSubmissionRejectedEmail,
  sendApplicationApprovedEmail,
} = require('./services/emailService')
const cloudinary = require('cloudinary').v2
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max (video এর জন্য)
})

const app = express()
const prisma = new PrismaClient()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://reachflow-lovat.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

async function createNotification(userId, title, message, type) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type }
    })
  } catch (err) {
    console.error('Notification error:', err)
  }
}

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.user = { id: decoded.userId }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

const adminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

app.get('/api/leaderboard', authMiddleware, async (req, res) => {
  try {
    const promoters = await prisma.promoter.findMany({
      where: { totalEarned: { gt: 0 } },
      include: {
        user: { select: { name: true, avatar: true } },
        _count: { select: { submissions: { where: { status: 'APPROVED' } } } }
      },
      orderBy: { totalEarned: 'desc' },
      take: 20
    })

    const myPromoter = await prisma.promoter.findUnique({
      where: { userId: req.userId }
    })

    let myRank = null
    if (myPromoter) {
      const rank = await prisma.promoter.count({
        where: { totalEarned: { gt: myPromoter.totalEarned } }
      })
      myRank = {
        rank: rank + 1,
        totalEarned: myPromoter.totalEarned
      }
    }

    res.json({
      success: true,
      promoters: promoters.map(p => ({
        id: p.id,
        name: p.user.name,
        avatar: p.user.avatar,
        country: p.country,
        totalEarned: p.totalEarned,
        submissionCount: p._count.submissions
      })),
      myRank
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// PROMOTER DASHBOARD
// ─────────────────────────────────────────

app.get('/api/promoter/dashboard', authMiddleware, async (req, res) => {
  try {
    const promoter = await prisma.promoter.findUnique({
      where: { userId: req.userId }
    })
    if (!promoter) return res.json({
      appliedCampaigns: 0, approvedCampaigns: 0,
      pendingCampaigns: 0, totalEarnings: 0,
      kycVerified: false, recentActivity: []
    })

    const applications = await prisma.application.findMany({
      where: { promoterId: promoter.id },
      include: { campaign: true },
      orderBy: { appliedAt: 'desc' },
      take: 5
    })

    const kyc = await prisma.kycVerification.findUnique({
      where: { userId: req.userId }
    })

    res.json({
      appliedCampaigns: await prisma.application.count({ where: { promoterId: promoter.id } }),
      approvedCampaigns: await prisma.application.count({ where: { promoterId: promoter.id, status: 'APPROVED' } }),
      pendingCampaigns: await prisma.application.count({ where: { promoterId: promoter.id, status: 'PENDING' } }),
      totalEarnings: promoter.totalEarned || 0,
      kycVerified: kyc?.status === 'VERIFIED',
      recentActivity: applications.map(a => ({
        campaignName: a.campaign?.title || '',
        amount: a.campaign?.commissionAmount || 0,
        date: a.appliedAt,
        status: a.status
      }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// PROMOTER PROFILE
// ─────────────────────────────────────────

app.get('/api/promoter/profile', authMiddleware, async (req, res) => {
  try {
    const promoter = await prisma.promoter.findUnique({
      where: { userId: req.userId },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        socialAccounts: true,
        _count: {
          select: {
            submissions: { where: { status: 'APPROVED' } },
            applications: true
          }
        }
      }
    })
    if (!promoter) return res.status(404).json({ error: 'Promoter not found' })
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } })
    res.json({
      success: true,
      profile: {
        id: promoter.id,
        name: promoter.user.name,
        email: promoter.user.email,
        avatar: promoter.user.avatar,
        bio: promoter.bio,
        country: promoter.country,
        niche: promoter.niche,
        totalEarned: promoter.totalEarned,
        rating: promoter.rating,
        verified: promoter.verified,
        approvedSubmissions: promoter._count.submissions,
        totalApplications: promoter._count.applications,
        balance: wallet?.balance || 0,
        socialAccounts: promoter.socialAccounts
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/promoter/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, country, niche } = req.body
    if (name) {
      await prisma.user.update({ where: { id: req.userId }, data: { name } })
    }
    await prisma.promoter.update({
      where: { userId: req.userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(country && { country }),
        ...(niche && { niche })
      }
    })
    res.json({ success: true, message: 'Profile updated!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/promoter/social', authMiddleware, async (req, res) => {
  try {
    const { platform, username, profileUrl, followers } = req.body
    if (!platform || !username || !profileUrl) {
      return res.status(400).json({ error: 'platform, username এবং profileUrl দিতে হবে' })
    }
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.status(404).json({ error: 'Promoter not found' })
    const existing = await prisma.socialAccount.findFirst({
      where: { promoterId: promoter.id, platform }
    })
    if (existing) {
      const updated = await prisma.socialAccount.update({
        where: { id: existing.id },
        data: { username, profileUrl, followers: parseInt(followers) || 0 }
      })
      return res.json({ success: true, socialAccount: updated })
    }
    const socialAccount = await prisma.socialAccount.create({
      data: { promoterId: promoter.id, platform, username, profileUrl, followers: parseInt(followers) || 0 }
    })
    res.json({ success: true, socialAccount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/promoter/social/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.socialAccount.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// TEST
// ─────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: '✅ ReachFlow API is running!' })
})

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'ADVERTISER' }
    })

    if (role === 'ADVERTISER' || !role) {
      await prisma.advertiser.create({
        data: { userId: user.id, businessName: name, category: 'General', country: 'Bangladesh' }
      })
    }

    if (role === 'PROMOTER') {
      await prisma.promoter.create({
        data: { userId: user.id, country: 'Bangladesh' }
      })
    }

    await prisma.wallet.create({ data: { userId: user.id } })

    if (req.body.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: req.body.referralCode }
      })
      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
            code: req.body.referralCode,
            status: 'PENDING'
          }
        })
      }
      const verifyToken = crypto.randomBytes(32).toString('hex')
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: false, referralCode: user.referralCode }
      })
      const { sendVerificationEmail } = require('./services/emailService')
      await sendVerificationEmail(user.email, user.name, verifyToken + '_' + user.id)
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query
    if (!token) return res.status(400).json({ error: 'Invalid token' })
    const parts = token.split('_')
    const userId = parts[parts.length - 1]
    if (!userId) return res.status(400).json({ error: 'Invalid token' })
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } })
    res.redirect(`${process.env.FRONTEND_URL || 'https://reachflow-lovat.vercel.app'}/login?verified=true`)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true }
    })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, bio, avatar } = req.body
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, ...(avatar && { avatar }) },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// PASSWORD CHANGE
// ─────────────────────────────────────────

app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password এবং new password দিতে হবে' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password কমপক্ষে ৬ character হতে হবে' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: 'User found হয়নি' })
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password সঠিক নয়' })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashedPassword } })
    res.json({ success: true, message: 'Password সফলভাবে পরিবর্তন হয়েছে!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// PLATFORM SETTINGS
// ─────────────────────────────────────────

app.get('/api/admin/settings', adminMiddleware, async (req, res) => {
  try {
    let settings = await prisma.platformSettings.findFirst()
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { platformFeePercent: 10, minWithdrawal: 10, autoPayoutEnabled: true, maintenanceMode: false }
      })
    }
    res.json({ success: true, settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/admin/settings', adminMiddleware, async (req, res) => {
  try {
    const { bdtRate, minWithdrawal, platformFeePercent } = req.body
    let settings = await prisma.platformSettings.findFirst()
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { platformFeePercent: platformFeePercent || 10, minWithdrawal: minWithdrawal || 10 }
      })
    } else {
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          ...(platformFeePercent && { platformFeePercent }),
          ...(minWithdrawal && { minWithdrawal }),
          ...(bdtRate && { bdtRate })
        }
      })
    }
    res.json({ success: true, settings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────

app.post('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const { title, description, budget, platforms, commissionType, commissionAmount, category } = req.body
    const advertiser = await prisma.advertiser.findUnique({ where: { userId: req.userId } })
    if (!advertiser) return res.status(400).json({ error: 'Advertiser profile not found.' })

    const activeSub = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: 'ACTIVE', endDate: { gt: new Date() } },
      include: { plan: true }
    })
    const campaignLimit = activeSub?.plan?.campaignLimit ?? 10

    if (campaignLimit !== null) {
      const campaignCount = await prisma.campaign.count({ where: { advertiserId: advertiser.id } })
      if (campaignCount >= campaignLimit) {
        return res.status(403).json({
          error: `Your current plan allows maximum ${campaignLimit} campaigns. Please upgrade your plan.`,
          upgradeRequired: true
        })
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: description || '',
        totalBudget: parseFloat(budget) || 0,
        commissionAmount: parseFloat(commissionAmount) || 0,
        commissionType: commissionType || 'PER_POST',
        category: category || 'General',
        targetPlatforms: platforms || [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        advertiserId: advertiser.id,
        status: 'ACTIVE'
      }
    })
    res.json({ success: true, campaign })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { advertiser: { userId: req.userId } },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/campaigns/available', authMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/campaigns/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: { promoter: { include: { user: true } } }
        }
      }
    })
    res.json({ campaign })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────

app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.body
    let promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) {
      promoter = await prisma.promoter.create({
        data: { userId: req.userId, country: 'Bangladesh' }
      })
    }
    const existing = await prisma.application.findUnique({
      where: { campaignId_promoterId: { campaignId, promoterId: promoter.id } }
    })
    if (existing) return res.status(400).json({ error: 'Already applied to this campaign' })

    const application = await prisma.application.create({
      data: { campaignId, promoterId: promoter.id }
    })

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { advertiser: { include: { user: true } } }
    })
    if (campaign?.advertiser?.userId) {
      await createNotification(
        campaign.advertiser.userId,
        '📩 New Promoter Application',
        `Someone applied to your campaign "${campaign.title}". Review their application now.`,
        'application'
      )
    }
    res.json({ success: true, application })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/applications/my', authMiddleware, async (req, res) => {
  try {
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.json({ applications: [] })
    const applications = await prisma.application.findMany({
      where: { promoterId: promoter.id },
      include: { campaign: true },
      orderBy: { appliedAt: 'desc' }
    })
    res.json({ applications })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() },
      include: {
        promoter: { include: { user: true } },
        campaign: true
      }
    })
    if (application.promoter?.userId) {
      if (status === 'APPROVED') {
        await createNotification(
          application.promoter.userId,
          '🎉 Application Approved!',
          `Your application for "${application.campaign.title}" has been approved! You can now start promoting.`,
          'application'
        )
        await sendApplicationApprovedEmail(
          application.promoter.user.email,
          application.promoter.user.name,
          application.campaign.title
        )
      } else if (status === 'REJECTED') {
        await createNotification(
          application.promoter.userId,
          '❌ Application Rejected',
          `Your application for "${application.campaign.title}" was not accepted this time.`,
          'application'
        )
      }
    }
    res.json({ success: true, application })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────

app.post('/api/submissions', authMiddleware, async (req, res) => {
  try {
    const { applicationId, postUrl, description } = req.body
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.status(404).json({ error: 'Promoter not found' })
    const application = await prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) return res.status(404).json({ error: 'Application not found' })

    const submission = await prisma.submission.create({
      data: {
        campaignId: application.campaignId,
        promoterId: promoter.id,
        applicationId,
        postUrl,
        platform: 'FACEBOOK',
        caption: description,
        status: 'PENDING'
      }
    })

    const { score, flags } = await calculateFraudScore(submission, promoter.id)
    if (score > 0) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { fraudScore: score, status: score >= 0.7 ? 'FLAGGED' : 'PENDING' },
      })
      if (score >= 0.7) {
        console.log(`🚨 High fraud: ${submission.id} | Score: ${score} | Flags: ${flags.join(', ')}`)
      }
    }
    res.json({ success: true, submission })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/submissions/my', authMiddleware, async (req, res) => {
  try {
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.json({ submissions: [] })
    const submissions = await prisma.submission.findMany({
      where: { promoterId: promoter.id },
      include: { campaign: { select: { title: true, advertiserId: true, advertiser: { select: { userId: true } } } } },
      orderBy: { submittedAt: 'desc' }
    })
    res.json({ submissions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/submissions/:campaignId', authMiddleware, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { campaignId: req.params.campaignId },
      include: { promoter: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { submittedAt: 'desc' }
    })
    res.json({ submissions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/submissions/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() },
      include: { campaign: true, promoter: { include: { user: true } } }
    })

    if (status === 'APPROVED') {
      const amount = submission.campaign.commissionAmount
      const escrow = await prisma.escrow.findUnique({ where: { campaignId: submission.campaignId } })

      if (escrow && escrow.status !== 'PENDING' && escrow.heldAmount >= amount) {
        const platformSettings = await prisma.platformSettings.findFirst()
        const feePercent = platformSettings?.platformFeePercent || 10
        const platformFee = (amount * feePercent) / 100
        const promoterAmount = amount - platformFee
        const promoterWallet = await prisma.wallet.findUnique({ where: { userId: submission.promoter.userId } })

        await prisma.$transaction(async (tx) => {
          await tx.escrow.update({ where: { id: escrow.id }, data: { heldAmount: { decrement: amount }, releasedAmount: { increment: amount }, status: 'ACTIVE' } })
          await tx.escrowTransaction.create({ data: { escrowId: escrow.id, type: 'RELEASE', amount, toUserId: submission.promoter.userId, submissionId: submission.id, note: 'Auto-released for approved submission' } })
          if (promoterWallet) {
            await tx.wallet.update({ where: { userId: submission.promoter.userId }, data: { balance: { increment: promoterAmount }, totalEarned: { increment: promoterAmount } } })
            await tx.transaction.create({ data: { walletId: promoterWallet.id, type: 'COMMISSION_EARNED', amount: promoterAmount, method: 'WALLET', status: 'COMPLETED', description: `Earned from campaign: ${submission.campaign.title}` } })
          } else {
            await tx.wallet.create({ data: { userId: submission.promoter.userId, balance: promoterAmount, totalEarned: promoterAmount } })
          }
          await tx.promoter.update({ where: { id: submission.promoterId }, data: { totalEarned: { increment: promoterAmount } } })
          await tx.campaign.update({ where: { id: submission.campaignId }, data: { spentBudget: { increment: amount } } })
          await tx.submission.update({ where: { id: submission.id }, data: { earnedAmount: promoterAmount } })
          await tx.platformSettings.updateMany({ data: { totalRevenue: { increment: platformFee } } })
        })

        await createNotification(submission.promoter.userId, '💰 Payment Released!', `$${promoterAmount.toFixed(2)} escrow থেকে release হয়েছে "${submission.campaign.title}" এর জন্য!`, 'submission')
        await sendSubmissionApprovedEmail(submission.promoter.user.email, submission.promoter.user.name, submission.campaign.title, promoterAmount)
      } else {
        const wallet = await prisma.wallet.findUnique({ where: { userId: submission.promoter.userId } })
        if (wallet) {
          await prisma.wallet.update({ where: { userId: submission.promoter.userId }, data: { balance: { increment: amount }, totalEarned: { increment: amount } } })
        } else {
          await prisma.wallet.create({ data: { userId: submission.promoter.userId, balance: amount, totalEarned: amount } })
        }
        await prisma.submission.update({ where: { id: req.params.id }, data: { earnedAmount: amount } })
        await createNotification(submission.promoter.userId, '🎉 Submission Approved!', `Your post for "${submission.campaign.title}" has been approved! $${amount} added to your wallet.`, 'submission')
        await sendSubmissionApprovedEmail(submission.promoter.user.email, submission.promoter.user.name, submission.campaign.title, amount)
      }

      // Referral reward
      const referral = await prisma.referral.findUnique({ where: { refereeId: submission.promoter.userId } })
      if (referral && referral.status === 'PENDING') {
        await prisma.referral.update({ where: { id: referral.id }, data: { status: 'REWARDED', completedAt: new Date() } })
        await prisma.wallet.update({ where: { userId: referral.referrerId }, data: { balance: { increment: referral.rewardAmount }, totalEarned: { increment: referral.rewardAmount } } })
        await createNotification(referral.referrerId, '🎉 Referral Reward!', `তোমার referred promoter প্রথম campaign complete করেছে! $${referral.rewardAmount} wallet এ add হয়েছে।`, 'referral')
      }
    }

    if (status === 'REJECTED' && submission.promoter) {
      await createNotification(submission.promoter.userId, '❌ Submission Rejected', `Your post for "${submission.campaign.title}" was rejected.`, 'submission')
      await sendSubmissionRejectedEmail(submission.promoter.user.email, submission.promoter.user.name, submission.campaign.title)
    }

    res.json({ success: true, submission })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// WALLET
// ─────────────────────────────────────────

app.get('/api/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } })
    res.json({ wallet: wallet || { balance: 0, totalEarned: 0 } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/wallet/add', authMiddleware, async (req, res) => {
  try {
    const { amount, method, reference } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount দিতে হবে' })
    if (!reference) return res.status(400).json({ error: 'Transaction reference দিতে হবে' })

    let wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } })
    if (!wallet) wallet = await prisma.wallet.create({ data: { userId: req.userId } })

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        method: method?.toUpperCase() || 'BKASH',
        status: 'PENDING',
        description: `Deposit request via ${method} | Ref: ${reference}`,
      }
    })
    await createNotification(req.userId, '⏳ Payment Request Received', `$${amount} deposit request পাওয়া হয়েছে। Admin 24 ঘণ্টার মধ্যে verify করবে।`, 'wallet')
    res.json({ success: true, message: 'Payment request submitted. Admin verify করবে।', pending: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// STRIPE PAYMENT
// ─────────────────────────────────────────

app.post('/api/stripe/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount দিতে হবে' })
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { userId: req.userId }
    })
    res.json({ success: true, clientSecret: paymentIntent.client_secret })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/stripe/confirm-payment', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') return res.status(400).json({ error: 'Payment successful হয়নি' })
    if (paymentIntent.metadata.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized' })

    let wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } })
    if (!wallet) wallet = await prisma.wallet.create({ data: { userId: req.userId } })

    await prisma.wallet.update({ where: { userId: req.userId }, data: { balance: { increment: amount } } })
    await prisma.transaction.create({
      data: { walletId: wallet.id, type: 'DEPOSIT', amount, method: 'CARD', status: 'COMPLETED', description: `Card payment via Stripe | ID: ${paymentIntentId}` }
    })
    await createNotification(req.userId, '💳 Card Payment Successful!', `$${amount} আপনার wallet এ add হয়েছে।`, 'wallet')
    res.json({ success: true, message: 'Payment successful!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json({ notifications: notifications || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// FILE UPLOAD
// ─────────────────────────────────────────

// Image Upload
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'reachflow' })
    res.json({ success: true, url: result.secure_url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ✅ Video Upload (max 2 min)
app.post('/api/upload/video', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Video file দিতে হবে' })

    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'video',
      folder: 'reachflow/videos',
      transformation: [{ duration: '120' }] // max 2 min
    })

    res.json({ success: true, url: result.secure_url, duration: result.duration })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// TRACKING
// ─────────────────────────────────────────

app.post('/api/tracking/generate', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.body
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.status(404).json({ error: 'Promoter not found' })

    const existing = await prisma.trackingLink.findFirst({ where: { campaignId, promoterId: promoter.id } })
    if (existing) return res.json({ link: existing })

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const link = await prisma.trackingLink.create({
      data: {
        campaignId,
        promoterId: promoter.id,
        shortCode,
        originalUrl: campaign.productUrl || `https://reachflow-j34o.onrender.com/c/${shortCode}`
      }
    })
    res.json({ link })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/c/:shortCode', async (req, res) => {
  try {
    const link = await prisma.trackingLink.findUnique({
      where: { shortCode: req.params.shortCode },
      include: { campaign: { include: { landingPage: true } } }
    })
    if (!link) return res.status(404).json({ error: 'Link not found' })
    await prisma.trackingLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } })

    const campaign = link.campaign
    const title = campaign?.title || 'Check this out!'
    const description = campaign?.description || 'Amazing offer for you!'
    const image = campaign?.productImages?.[0] || 'https://reachflow-lovat.vercel.app/og-default.png'
    const redirectUrl = link.campaign?.landingPage?.slug 
    ? `${process.env.FRONTEND_URL}/p/${link.campaign.landingPage.slug}?ref=${link.shortCode}`
    : link.originalUrl

    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="https://reachflow-j34o.onrender.com/c/${req.params.shortCode}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
  <script>window.location.href = "${redirectUrl}"</script>
</head>
<body><p>Redirecting...</p></body>
</html>`)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/go/:shortCode', async (req, res) => {
  try {
    const link = await prisma.trackingLink.findUnique({ where: { shortCode: req.params.shortCode } })
    if (!link) return res.status(404).json({ error: 'Link not found' })
    await prisma.trackingLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } })
    res.json({ url: link.originalUrl })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────

app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count()
    const totalAdvertisers = await prisma.user.count({ where: { role: 'ADVERTISER' } })
    const totalPromoters = await prisma.user.count({ where: { role: 'PROMOTER' } })
    const totalCampaigns = await prisma.campaign.count()
    const totalApplications = await prisma.application.count()
    const approvedApplications = await prisma.application.count({ where: { status: 'APPROVED' } })
    res.json({ totalUsers, totalAdvertisers, totalPromoters, totalCampaigns, totalApplications, approvedApplications })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/admin/users/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } })
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/campaigns', adminMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { advertiser: { include: { user: true } }, applications: true }
    })
    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/admin/campaigns/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/admin/campaigns/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: { status } })
    res.json({ success: true, campaign })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/submissions', adminMiddleware, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: { promoter: { include: { user: true } }, campaign: true },
      orderBy: { submittedAt: 'desc' }
    })
    res.json({ submissions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.patch('/api/admin/submissions/:id', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() },
      include: { campaign: true, promoter: { include: { user: true } } }
    })

    if (status === 'APPROVED') {
      const amount = submission.campaign.commissionAmount
      const escrow = await prisma.escrow.findUnique({ where: { campaignId: submission.campaignId } })

      if (escrow && escrow.status !== 'PENDING' && escrow.heldAmount >= amount) {
        const platformSettings = await prisma.platformSettings.findFirst()
        const feePercent = platformSettings?.platformFeePercent || 10
        const platformFee = (amount * feePercent) / 100
        const promoterAmount = amount - platformFee
        const promoterWallet = await prisma.wallet.findUnique({ where: { userId: submission.promoter.userId } })

        await prisma.$transaction(async (tx) => {
          await tx.escrow.update({ where: { id: escrow.id }, data: { heldAmount: { decrement: amount }, releasedAmount: { increment: amount }, status: 'ACTIVE' } })
          await tx.escrowTransaction.create({ data: { escrowId: escrow.id, type: 'RELEASE', amount, toUserId: submission.promoter.userId, submissionId: submission.id, note: 'Admin approved - Auto-released' } })
          if (promoterWallet) {
            await tx.wallet.update({ where: { userId: submission.promoter.userId }, data: { balance: { increment: promoterAmount }, totalEarned: { increment: promoterAmount } } })
            await tx.transaction.create({ data: { walletId: promoterWallet.id, type: 'COMMISSION_EARNED', amount: promoterAmount, method: 'WALLET', status: 'COMPLETED', description: `Earned from campaign: ${submission.campaign.title}` } })
          } else {
            await tx.wallet.create({ data: { userId: submission.promoter.userId, balance: promoterAmount, totalEarned: promoterAmount } })
          }
          await tx.promoter.update({ where: { id: submission.promoterId }, data: { totalEarned: { increment: promoterAmount } } })
          await tx.campaign.update({ where: { id: submission.campaignId }, data: { spentBudget: { increment: amount } } })
          await tx.submission.update({ where: { id: submission.id }, data: { earnedAmount: promoterAmount } })
          await tx.platformSettings.updateMany({ data: { totalRevenue: { increment: platformFee } } })
        })
        await createNotification(submission.promoter.userId, '💰 Payment Released!', `$${(amount - (amount * (await prisma.platformSettings.findFirst())?.platformFeePercent || 10) / 100).toFixed(2)} escrow থেকে release হয়েছে!`, 'submission')
      } else {
        const wallet = await prisma.wallet.findUnique({ where: { userId: submission.promoter.userId } })
        if (wallet) {
          await prisma.wallet.update({ where: { userId: submission.promoter.userId }, data: { balance: { increment: amount }, totalEarned: { increment: amount } } })
        } else {
          await prisma.wallet.create({ data: { userId: submission.promoter.userId, balance: amount, totalEarned: amount } })
        }
        await prisma.submission.update({ where: { id: req.params.id }, data: { earnedAmount: amount } })
        await createNotification(submission.promoter.userId, '🎉 Submission Approved!', `Your post for "${submission.campaign.title}" has been approved! $${amount} added to your wallet.`, 'submission')
      }
    }

    if (status === 'REJECTED' && submission.promoter) {
      await createNotification(submission.promoter.userId, '❌ Submission Rejected', `Your post for "${submission.campaign.title}" was rejected.`, 'submission')
    }

    res.json({ success: true, submission })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ─────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────

app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      where: { id: { not: req.userId } },
      select: { id: true, name: true, role: true },
    })
    const lastMessages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId', 'receiverId'],
    })
    const getLastMessageTime = (userId) => {
      const msg = lastMessages.find(m => m.senderId === userId || m.receiverId === userId)
      return msg ? new Date(msg.createdAt).getTime() : 0
    }
    const users = allUsers.sort((a, b) => getLastMessageTime(b.id) - getLastMessageTime(a.id))
    res.json({ users })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ messages })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/messages/unread', authMiddleware, async (req, res) => {
  try {
    const counts = await prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: req.userId, read: false },
      _count: { id: true }
    })
    res.json({ counts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.userId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    })
    await prisma.message.updateMany({
      where: { senderId: req.params.userId, receiverId: req.userId, read: false },
      data: { read: true }
    })
    res.json({ messages })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content } = req.body
    const message = await prisma.message.create({
      data: { senderId: req.userId, receiverId, content },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      }
    })
    res.json({ message })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// PUBLIC PROMOTER PROFILE
// ─────────────────────────────────────────

app.get('/api/public/promoter/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params
    const user = await prisma.user.findFirst({
      where: { role: 'PROMOTER', status: 'ACTIVE', id: identifier },
      select: {
        id: true, name: true, avatar: true, createdAt: true,
        promoter: {
          select: {
            id: true, bio: true, country: true, niche: true,
            totalFollowers: true, avgEngagement: true, rating: true,
            totalEarned: true, verified: true,
            socialAccounts: { select: { platform: true, username: true, profileUrl: true, followers: true, engagement: true, verified: true } },
            submissions: {
              where: { status: 'APPROVED' }, take: 6, orderBy: { submittedAt: 'desc' },
              select: {
                id: true, platform: true, postUrl: true, earnedAmount: true,
                clicks: true, reach: true, submittedAt: true,
                campaign: { select: { id: true, title: true, category: true, productImages: true, advertiser: { select: { businessName: true } } } }
              }
            },
            _count: { select: { submissions: { where: { status: 'APPROVED' } } } }
          }
        }
      }
    })
    if (!user || !user.promoter) return res.status(404).json({ success: false, message: 'Promoter not found' })
    res.json({ success: true, data: user })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ─────────────────────────────────────────
// CAMPAIGN ANALYTICS
// ─────────────────────────────────────────

app.get('/api/campaigns/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        submissions: { where: { status: 'APPROVED' }, include: { promoter: { include: { user: { select: { name: true, avatar: true } } } } } },
        trackingLinks: true,
        advertiser: true,
      }
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

    const platformMap = {}
    campaign.submissions.forEach(s => {
      const p = s.platform || 'UNKNOWN'
      if (!platformMap[p]) platformMap[p] = { clicks: 0, reach: 0, submissions: 0, earned: 0 }
      platformMap[p].clicks += s.clicks || 0
      platformMap[p].reach += s.reach || 0
      platformMap[p].submissions += 1
      platformMap[p].earned += s.earnedAmount || 0
    })

    const promoterMap = {}
    campaign.submissions.forEach(s => {
      const pid = s.promoterId
      if (!promoterMap[pid]) promoterMap[pid] = { id: pid, name: s.promoter?.user?.name || 'Unknown', avatar: s.promoter?.user?.avatar || null, clicks: 0, reach: 0, submissions: 0, earned: 0 }
      promoterMap[pid].clicks += s.clicks || 0
      promoterMap[pid].reach += s.reach || 0
      promoterMap[pid].submissions += 1
      promoterMap[pid].earned += s.earnedAmount || 0
    })

    const totalClicks = campaign.submissions.reduce((sum, s) => sum + (s.clicks || 0), 0)
    const totalReach = campaign.submissions.reduce((sum, s) => sum + (s.reach || 0), 0)
    const totalEngagement = campaign.submissions.reduce((sum, s) => sum + (s.engagement || 0), 0)
    const totalEarned = campaign.submissions.reduce((sum, s) => sum + (s.earnedAmount || 0), 0)
    const totalTrackingClicks = campaign.trackingLinks.reduce((sum, t) => sum + (t.clicks || 0), 0)

    res.json({
      success: true,
      data: {
        campaign: { id: campaign.id, title: campaign.title, status: campaign.status, totalBudget: campaign.totalBudget, commissionAmount: campaign.commissionAmount, startDate: campaign.startDate, endDate: campaign.endDate },
        totals: { clicks: totalClicks, reach: totalReach, engagement: totalEngagement, earned: totalEarned, trackingClicks: totalTrackingClicks, submissions: campaign.submissions.length, budgetUsed: totalEarned, budgetRemaining: campaign.totalBudget - totalEarned },
        platformBreakdown: platformMap,
        topPromoters: Object.values(promoterMap).sort((a, b) => b.clicks - a.clicks).slice(0, 5),
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// ADVERTISER DASHBOARD & ANALYTICS
// ─────────────────────────────────────────

app.get('/api/advertiser/dashboard', authMiddleware, async (req, res) => {
  try {
    const advertiser = await prisma.advertiser.findUnique({ where: { userId: req.userId } })
    if (!advertiser) return res.status(404).json({ error: 'Advertiser not found' })

    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId: advertiser.id },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    })
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } })

    res.json({
      success: true,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      totalBudget: campaigns.reduce((sum, c) => sum + (c.totalBudget || 0), 0),
      totalSpent: campaigns.reduce((sum, c) => sum + (c.spentBudget || 0), 0),
      totalApplications: campaigns.reduce((sum, c) => sum + c._count.applications, 0),
      walletBalance: wallet?.balance || 0,
      recentCampaigns: campaigns.slice(0, 5).map(c => ({
        id: c.id, title: c.title, status: c.status,
        budget: c.totalBudget, spent: c.spentBudget || 0,
        applicationsCount: c._count.applications, endDate: c.endDate,
      }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/advertiser/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = 'week' } = req.query
    const advertiser = await prisma.advertiser.findUnique({ where: { userId: req.userId } })
    if (!advertiser) return res.status(404).json({ error: 'Advertiser not found' })

    const now = new Date()
    const startDate = period === 'week' ? new Date(now - 7 * 24 * 60 * 60 * 1000)
      : period === 'month' ? new Date(now - 30 * 24 * 60 * 60 * 1000)
      : new Date(now - 365 * 24 * 60 * 60 * 1000)

    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId: advertiser.id },
      include: {
        submissions: { where: { status: 'APPROVED', submittedAt: { gte: startDate } } },
        trackingLinks: true,
        applications: { where: { status: 'APPROVED' } }
      }
    })

    res.json({
      success: true,
      totalSpend: campaigns.reduce((sum, c) => sum + (c.spentBudget || 0), 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.trackingLinks.reduce((s, t) => s + (t.clicks || 0), 0), 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.submissions.length, 0),
      activePromoters: campaigns.reduce((sum, c) => sum + c.applications.length, 0),
      spendByDay: [],
      campaignPerformance: campaigns.map(c => ({
        title: c.title, budget: c.totalBudget, spent: c.spentBudget || 0,
        promoters: c.applications.length,
        clicks: c.trackingLinks.reduce((s, t) => s + (t.clicks || 0), 0),
        conversions: c.submissions.length
      })),
      topPromoters: []
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/advertiser/campaigns', authMiddleware, async (req, res) => {
  try {
    const advertiser = await prisma.advertiser.findUnique({ where: { userId: req.userId } })
    if (!advertiser) return res.status(404).json({ error: 'Advertiser not found' })
    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId: advertiser.id },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, campaigns })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// REFERRAL SYSTEM
// ─────────────────────────────────────────

app.get('/api/referral/my', authMiddleware, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user.referralCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      user = await prisma.user.update({ where: { id: req.userId }, data: { referralCode: code } })
    }
    const referrals = await prisma.referral.findMany({ where: { referrerId: req.userId } })
    const totalEarned = referrals.filter(r => r.status === 'REWARDED').reduce((sum, r) => sum + r.rewardAmount, 0)

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'https://reachflow-lovat.vercel.app'}/register?ref=${user.referralCode}`,
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'REWARDED').length,
      totalEarned,
      referrals: referrals.map(r => ({ id: r.id, status: r.status, rewardAmount: r.rewardAmount, createdAt: r.createdAt, completedAt: r.completedAt }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// ROUTE REGISTRATIONS
// ─────────────────────────────────────────

app.use('/api/payment', authMiddleware, paymentRouter)
app.use('/api/withdrawals', withdrawalRouter)
app.use('/api/kyc', authMiddleware, kycRouter)
app.use('/api/disputes', authMiddleware, disputeRouter)
app.use('/api/ratings', authMiddleware, ratingRouter)
app.use('/api/analytics', analyticsExportRouter)
app.use('/api/subscriptions', subscriptionRouter)
app.use('/api/escrow', escrowRouter)
app.use('/api/landing', landingRouter) // ✅ NEW — Landing Page routes
app.use('/api/imageai', imageaiRouter)

// One-time fix
app.get('/api/admin/verify-all-users', async (req, res) => {
  try {
    const result = await prisma.user.updateMany({ data: { emailVerified: true } })
    res.json({ success: true, count: result.count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))


//index