const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

dotenv.config()
const paymentRouter = require('./routes/payment')

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

// Test Route
app.get('/', (req, res) => {
  res.json({ message: '✅ ReachFlow API is running!' })
})

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already exists' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'ADVERTISER' }
    })
  // Auto create Advertiser profile
    if (role === 'ADVERTISER' || !role) {
      await prisma.advertiser.create({
        data: { userId: user.id, businessName: name, category: 'General', country: 'Bangladesh' }
      })
    }
    // Auto create Promoter profile
    if (role === 'PROMOTER') {
      await prisma.promoter.create({
        data: { userId: user.id, country: 'Bangladesh' }
      })
    }
    // Wallet create
    await prisma.wallet.create({
      data: { userId: user.id }
    })
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Get Me
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

// Update Profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      select: { id: true, name: true, email: true, role: true }
    })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Create Campaign
app.post('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const { title, description, budget, platforms, commissionType, commissionAmount, category } = req.body
    const advertiser = await prisma.advertiser.findUnique({
  where: { userId: req.userId }
})
if (!advertiser) {
  return res.status(400).json({ error: 'Advertiser profile not found.' })
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

// Get Campaigns
app.get('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { advertiser: { userId: req.userId } },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ campaigns })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Get Available Campaigns (for promoters)
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

// Apply to Campaign
app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.body
    const promoter = await prisma.promoter.findUnique({
      where: { userId: req.userId }
    })
    if (!promoter) {
  promoter = await prisma.promoter.create({
    data: {
      userId: req.userId,
      country: 'Bangladesh',
    }
  })
  }
    const application = await prisma.application.create({
      data: { campaignId, promoterId: promoter.id }
    })
    res.json({ success: true, application })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get My Applications
app.get('/api/applications/my', authMiddleware, async (req, res) => {
  try {
    const promoter = await prisma.promoter.findUnique({
      where: { userId: req.userId }
    })
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
// Approve/Reject Application
 app.patch('/api/applications/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() }
    })
    res.json({ success: true, application })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Get Single Campaign
app.get('/api/campaigns/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: {
            promoter: {
              include: { user: true }
            }
          }
        }
      }
    })
    res.json({ campaign })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Submit Content Proof
app.post('/api/submissions', authMiddleware, async (req, res) => {
  try {
    const { applicationId, postUrl, description } = req.body
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const promoter = await prisma.promoter.findUnique({ where: { userId: decoded.userId } })
    if (!promoter) return res.status(404).json({ error: 'Promoter not found' })

    const application = await prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) return res.status(404).json({ error: 'Application not found' })
    //if (application.promoterId !== promoter.id) return res.status(403).json({ error: 'Forbidden' })

    const submission = await prisma.submission.create({
      data: {
        campaignId: application.campaignId,
        promoterId: promoter.id,
        applicationId,
        postUrl,
        platform: 'FACEBOOK',
        caption: description,   // ← description → caption
        status: 'PENDING'
      }
    })
    res.json({ success: true, submission })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
 // Get My Submissions (Promoter)
app.get('/api/submissions/my', authMiddleware, async (req, res) => {
  try {
    const promoter = await prisma.promoter.findUnique({
      where: { userId: req.userId }
    })
    if (!promoter) return res.json({ submissions: [] })
    const submissions = await prisma.submission.findMany({
      where: { promoterId: promoter.id },
      include: { campaign: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' }
    })
    res.json({ submissions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Get Submissions for a campaign (Advertiser)
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

// Update Submission Status (Advertiser approve/reject)
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


      const wallet = await prisma.wallet.findUnique({
        where: { userId: submission.promoter.userId }
      })

      if (wallet) {
        await prisma.wallet.update({
          where: { userId: submission.promoter.userId },
          data: {
            balance: { increment: amount },
            totalEarned: { increment: amount }
          }
        })
      } else {
        await prisma.wallet.create({
          data: {
            userId: submission.promoter.userId,
            balance: amount,
            totalEarned: amount
          }
        })
      }

      await prisma.submission.update({
        where: { id: req.params.id },
        data: { earnedAmount: amount }
      })
      await createNotification(
  submission.promoter.userId,
  '🎉 Submission Approved!',
  `Your post for "${submission.campaign.title}" has been approved! $${submission.campaign.commissionAmount} added to your wallet.`,
  'submission'
)
    }
    if (status === 'REJECTED') {
  // const rejPromoter = await prisma.promoter.findUnique({
  //  where: { id: submission.promoterId },
  //  include: { user: true }
  //  })

  if (submission.promoter) {
    await createNotification(
      submission.promoter.userId,
      '❌ Submission Rejected',
      `Your post for "${submission.campaign.title}" was rejected.`,
      'submission'
    )
  }
}
    res.json({ success: true, submission })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Admin Middleware
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

// Admin - Get Stats
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

// Admin - Get All Users
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

// Admin - Delete User
app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin - Get All Campaigns
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

// Admin - Delete Campaign
app.delete('/api/admin/campaigns/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Admin - User Status Update
app.patch('/api/admin/users/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status }
    })
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin - Campaign Status Update
app.patch('/api/admin/campaigns/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status }
    })
    res.json({ success: true, campaign })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin - Get All Submissions
app.get('/api/admin/submissions', adminMiddleware, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        promoter: { include: { user: true } },
        campaign: true
      },
      orderBy: { submittedAt: 'desc' }
    })
    res.json({ submissions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin - Update Submission Status
app.patch('/api/admin/submissions/:id', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() }
    })
    res.json({ success: true, submission })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
// Get Wallet (Promoter)
app.get('/api/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.userId }
    })
    res.json({ wallet: wallet || { balance: 0, totalEarned: 0 } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
 // Notification Helper
async function createNotification(userId, title, message, type) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type }
    })
  } catch (err) {
    console.error('Notification error:', err)
  }
}

// Get Notifications
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

// Mark All as Read
app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mark One as Read
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Notifications - Get all
app.get('/api/notification', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json({ notifications })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Notifications - Mark all read
app.patch('/api/notification/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Generate Tracking Link for Promoter
app.post('/api/tracking/generate', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.body
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.status(404).json({ error: 'Promoter not found' })
    const existing = await prisma.trackingLink.findFirst({
      where: { campaignId, promoterId: promoter.id }
    })
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

// Track click
app.get('/c/:shortCode', async (req, res) => {
  try {
    const link = await prisma.trackingLink.findUnique({
      where: { shortCode: req.params.shortCode }
    })
    if (!link) return res.status(404).json({ error: 'Link not found' })
    await prisma.trackingLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    })
    res.redirect(link.originalUrl)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.use('/api/payment', authMiddleware, paymentRouter)

// Get Users for messaging
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.userId } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    })
    res.json({ users })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get Conversations
app.get('/api/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.userId }, { receiverId: req.userId }]
      },
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
// Get Unread Count
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

// Get Messages with a specific user
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

// Send Message
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

