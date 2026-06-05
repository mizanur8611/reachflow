// routes/escrow.js
const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

// ── Auth Middleware ──
router.use(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = { id: user.id, role: user.role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})

// ══════════════════════════════════════════
// POST /api/escrow/fund/:campaignId
// Advertiser funds escrow for a campaign
// ══════════════════════════════════════════
router.post('/fund/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user.id

    // ── 1. Get Campaign ──
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { advertiser: true }
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    if (campaign.advertiser.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // ── 2. Check existing escrow ──
    const existing = await prisma.escrow.findUnique({ where: { campaignId } })
    if (existing && existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Escrow already funded for this campaign' })
    }

    // ── 3. Check wallet balance ──
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < campaign.totalBudget) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        required: campaign.totalBudget,
        available: wallet?.balance || 0
      })
    }

    // ── 4. Deduct from wallet & create/update escrow ──
    await prisma.$transaction(async (tx) => {
      // Deduct from advertiser wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: campaign.totalBudget } }
      })

      // Create or update escrow
      if (existing) {
        await tx.escrow.update({
          where: { campaignId },
          data: {
            status: 'FUNDED',
            heldAmount: campaign.totalBudget,
            fundedAt: new Date()
          }
        })
      } else {
        await tx.escrow.create({
          data: {
            campaignId,
            advertiserId: campaign.advertiserId,
            totalAmount: campaign.totalBudget,
            heldAmount: campaign.totalBudget,
            status: 'FUNDED',
            fundedAt: new Date(),
            transactions: {
              create: {
                type: 'FUND',
                amount: campaign.totalBudget,
                fromUserId: userId,
                note: `Campaign "${campaign.title}" budget funded`
              }
            }
          }
        })
      }

      // Record wallet transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'CAMPAIGN_PAYMENT',
          amount: campaign.totalBudget,
          method: 'WALLET',
          status: 'COMPLETED',
          description: `Escrow funded for campaign: ${campaign.title}`
        }
      })

      // Activate campaign
      await tx.campaign.update({
        where: { id: campaignId },
        data: { status: 'ACTIVE' }
      })
    })

    const escrow = await prisma.escrow.findUnique({
      where: { campaignId },
      include: { transactions: true }
    })

    res.json({
      success: true,
      message: `$${campaign.totalBudget} funded to escrow. Campaign is now ACTIVE!`,
      escrow
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/escrow/:campaignId
// Get escrow details for a campaign
// ══════════════════════════════════════════
router.get('/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    const escrow = await prisma.escrow.findUnique({
      where: { campaignId },
      include: {
        campaign: {
          include: { advertiser: { include: { user: { select: { id: true, name: true } } } } }
        },
        transactions: { orderBy: { createdAt: 'desc' } }
      }
    })

    if (!escrow) return res.status(404).json({ error: 'Escrow not found' })

    // Auth check
    if (userRole === 'ADVERTISER') {
      if (escrow.campaign.advertiser.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    res.json({ success: true, escrow })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/escrow/release/:submissionId
// Release payment to promoter when submission approved
// Called automatically when submission is approved
// ══════════════════════════════════════════
router.post('/release/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    // Only advertiser or admin can release
    if (userRole !== 'ADVERTISER' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // ── Get submission ──
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        campaign: {
          include: {
            advertiser: true,
            analytics: true
          }
        },
        promoter: { include: { user: true } }
      }
    })

    if (!submission) return res.status(404).json({ error: 'Submission not found' })
    if (submission.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Submission must be APPROVED first' })
    }

    // ── Get escrow ──
    const escrow = await prisma.escrow.findUnique({
      where: { campaignId: submission.campaignId }
    })
    if (!escrow) return res.status(404).json({ error: 'Escrow not found for this campaign' })
    if (escrow.status === 'PENDING') {
      return res.status(400).json({ error: 'Escrow not funded yet' })
    }

    const releaseAmount = submission.earnedAmount
    if (releaseAmount <= 0) {
      return res.status(400).json({ error: 'No amount to release' })
    }
    if (escrow.heldAmount < releaseAmount) {
      return res.status(400).json({ error: 'Insufficient escrow balance' })
    }

    // ── Get promoter wallet ──
    const promoterWallet = await prisma.wallet.findUnique({
      where: { userId: submission.promoter.userId }
    })
    if (!promoterWallet) return res.status(404).json({ error: 'Promoter wallet not found' })

    // ── Platform fee ──
    const platformSettings = await prisma.platformSettings.findFirst()
    const feePercent = platformSettings?.platformFeePercent || 10
    const platformFee = (releaseAmount * feePercent) / 100
    const promoterAmount = releaseAmount - platformFee

    // ── Transaction ──
    await prisma.$transaction(async (tx) => {
      // Update escrow
      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          heldAmount: { decrement: releaseAmount },
          releasedAmount: { increment: releaseAmount },
          status: 'ACTIVE'
        }
      })

      // Add escrow transaction
      await tx.escrowTransaction.create({
        data: {
          escrowId: escrow.id,
          type: 'RELEASE',
          amount: releaseAmount,
          toUserId: submission.promoter.userId,
          submissionId: submission.id,
          note: `Payment for approved submission`
        }
      })

      // Add to promoter wallet
      await tx.wallet.update({
        where: { userId: submission.promoter.userId },
        data: {
          balance: { increment: promoterAmount },
          totalEarned: { increment: promoterAmount }
        }
      })

      // Record promoter transaction
      await tx.transaction.create({
        data: {
          walletId: promoterWallet.id,
          type: 'COMMISSION_EARNED',
          amount: promoterAmount,
          method: 'WALLET',
          status: 'COMPLETED',
          description: `Earned from campaign: ${submission.campaign.title}`
        }
      })

      // Update promoter totalEarned
      await tx.promoter.update({
        where: { id: submission.promoterId },
        data: { totalEarned: { increment: promoterAmount } }
      })

      // Update campaign spentBudget
      await tx.campaign.update({
        where: { id: submission.campaignId },
        data: { spentBudget: { increment: releaseAmount } }
      })
    })

    res.json({
      success: true,
      message: `$${promoterAmount.toFixed(2)} released to ${submission.promoter.user.name}`,
      platformFee: platformFee.toFixed(2),
      promoterAmount: promoterAmount.toFixed(2)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/escrow/refund/:campaignId
// Refund remaining escrow to advertiser
// Called when campaign ends/cancelled
// ══════════════════════════════════════════
router.post('/refund/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    const escrow = await prisma.escrow.findUnique({
      where: { campaignId },
      include: { campaign: { include: { advertiser: true } } }
    })

    if (!escrow) return res.status(404).json({ error: 'Escrow not found' })

    // Auth check
    if (userRole === 'ADVERTISER') {
      if (escrow.campaign.advertiser.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    } else if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (escrow.heldAmount <= 0) {
      return res.status(400).json({ error: 'No funds to refund' })
    }

    const refundAmount = escrow.heldAmount

    // ── Get advertiser wallet ──
    const advertiserWallet = await prisma.wallet.findUnique({ where: { userId } })

    await prisma.$transaction(async (tx) => {
      // Update escrow
      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          heldAmount: 0,
          refundedAmount: { increment: refundAmount },
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      // Add escrow transaction
      await tx.escrowTransaction.create({
        data: {
          escrowId: escrow.id,
          type: 'REFUND',
          amount: refundAmount,
          toUserId: userId,
          note: 'Remaining budget refunded to advertiser'
        }
      })

      // Refund to advertiser wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: refundAmount } }
      })

      // Record transaction
      if (advertiserWallet) {
        await tx.transaction.create({
          data: {
            walletId: advertiserWallet.id,
            type: 'REFUND',
            amount: refundAmount,
            method: 'WALLET',
            status: 'COMPLETED',
            description: `Escrow refund for campaign: ${escrow.campaign.title}`
          }
        })
      }

      // Complete campaign
      await tx.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' }
      })
    })

    res.json({
      success: true,
      message: `$${refundAmount.toFixed(2)} refunded to your wallet`,
      refundAmount
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/escrow/admin/all
// Admin: see all escrows
// ══════════════════════════════════════════
router.get('/admin/all', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' })

    const escrows = await prisma.escrow.findMany({
      include: {
        campaign: {
          include: {
            advertiser: { include: { user: { select: { name: true, email: true } } } }
          }
        },
        transactions: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, escrows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
