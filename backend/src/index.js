const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

dotenv.config()
const paymentRouter = require('./routes/payment')
const withdrawalRouter = require('./routes/withdrawal') 

const cloudinary = require('cloudinary').v2
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.memoryStorage()
const upload = multer({ storage })

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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Registration failed' })
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
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
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

// ─────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────

app.post('/api/campaigns', authMiddleware, async (req, res) => {
  try {
    const { title, description, budget, platforms, commissionType, commissionAmount, category } = req.body
    const advertiser = await prisma.advertiser.findUnique({ where: { userId: req.userId } })
    if (!advertiser) return res.status(400).json({ error: 'Advertiser profile not found.' })

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
          include: {
            promoter: { include: { user: true } }
          }
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

// FIX 1: const → let যাতে reassign করা যায়
app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.body

    // FIX: const → let
    let promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) {
      promoter = await prisma.promoter.create({
        data: { userId: req.userId, country: 'Bangladesh' }
      })
    }

    // Already applied check
    const existing = await prisma.application.findUnique({
      where: { campaignId_promoterId: { campaignId, promoterId: promoter.id } }
    })
    if (existing) return res.status(400).json({ error: 'Already applied to this campaign' })

    const application = await prisma.application.create({
      data: { campaignId, promoterId: promoter.id }
    })

    // Advertiser কে notification
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

// FIX 2: Approve/Reject এ Notification যোগ করা হয়েছে
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

    // Promoter কে notification পাঠাও
    if (application.promoter?.userId) {
      if (status === 'APPROVED') {
        await createNotification(
          application.promoter.userId,
          '🎉 Application Approved!',
          `Your application for "${application.campaign.title}" has been approved! You can now start promoting.`,
          'application'
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
      include: { campaign: { select: { title: true } } },
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

      const wallet = await prisma.wallet.findUnique({ where: { userId: submission.promoter.userId } })
      if (wallet) {
        await prisma.wallet.update({
          where: { userId: submission.promoter.userId },
          data: { balance: { increment: amount }, totalEarned: { increment: amount } }
        })
      } else {
        await prisma.wallet.create({
          data: { userId: submission.promoter.userId, balance: amount, totalEarned: amount }
        })
      }

      await prisma.submission.update({
        where: { id: req.params.id },
        data: { earnedAmount: amount }
      })

      await createNotification(
        submission.promoter.userId,
        '🎉 Submission Approved!',
        `Your post for "${submission.campaign.title}" has been approved! $${amount} added to your wallet.`,
        'submission'
      )
    }

    if (status === 'REJECTED' && submission.promoter) {
      await createNotification(
        submission.promoter.userId,
        '❌ Submission Rejected',
        `Your post for "${submission.campaign.title}" was rejected.`,
        'submission'
      )
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
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

// Image Upload
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'reachflow'
    })
    res.json({ success: true, url: result.secure_url })
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

app.get('/c/:shortCode', async (req, res) => {
  try {
    const link = await prisma.trackingLink.findUnique({
      where: { shortCode: req.params.shortCode },
      include: { campaign: true }
    })
    if (!link) return res.status(404).json({ error: 'Link not found' })

    await prisma.trackingLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    })

    const campaign = link.campaign
    const title = campaign?.title || 'Check this out!'
    const description = campaign?.description || 'Amazing offer for you!'
    const image = campaign?.productImages?.[0] || 'https://reachflow-lovat.vercel.app/og-default.png'
    const redirectUrl = link.originalUrl

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
<body>
  <p>Redirecting...</p>
</body>
</html>`)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Branded redirect
app.get('/api/go/:shortCode', async (req, res) => {
  try {
    const link = await prisma.trackingLink.findUnique({
      where: { shortCode: req.params.shortCode }
    })
    if (!link) return res.status(404).json({ error: 'Link not found' })
    await prisma.trackingLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } }
    })
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
        `Your post for "${submission.campaign.title}" has been approved! $${amount} added to your wallet.`,
        'submission'
      )
    }

    if (status === 'REJECTED' && submission.promoter) {
      await createNotification(
        submission.promoter.userId,
        '❌ Submission Rejected',
        `Your post for "${submission.campaign.title}" was rejected.`,
        'submission'
      )
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
// PAYMENT ROUTER
// ─────────────────────────────────────────

app.use('/api/payment', authMiddleware, paymentRouter)
app.use('/api/withdrawals', withdrawalRouter)

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))


