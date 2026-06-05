// routes/subscription.js
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
// GET /api/subscriptions/plans
// সব available plans দেখাও
// ══════════════════════════════════════════
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    })
    res.json({ success: true, plans })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/subscriptions/my
// আমার current subscription
// ══════════════════════════════════════════
router.get('/my', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    // If no active subscription, return Basic plan info
    if (!subscription) {
      const planType = req.user.role === 'ADVERTISER' ? 'ADVERTISER' : 'PROMOTER'
      const basicPlan = await prisma.subscriptionPlan.findFirst({
        where: { type: planType, name: 'Basic' },
      })
      return res.json({
        success: true,
        subscription: null,
        currentPlan: basicPlan,
        isBasic: true,
      })
    }

    res.json({
      success: true,
      subscription,
      currentPlan: subscription.plan,
      isBasic: false,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/subscriptions/subscribe
// নতুন subscription নাও
// Body: { planId, paymentMethod, reference? }
// ══════════════════════════════════════════
router.post('/subscribe', async (req, res) => {
  try {
    const { planId, paymentMethod, reference, metadata } = req.body
    const userId = req.user.id

    // ── 1. Get Plan ──
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    if (!plan.isActive) return res.status(400).json({ error: 'Plan is not available' })

    // ── 2. Check plan matches user role ──
    const userRole = req.user.role
    if (plan.type === 'ADVERTISER' && userRole !== 'ADVERTISER') {
      return res.status(403).json({ error: 'This plan is for Advertisers only' })
    }
    if (plan.type === 'PROMOTER' && userRole !== 'PROMOTER') {
      return res.status(403).json({ error: 'This plan is for Promoters only' })
    }

    // ── 3. Basic plan is free ──
    if (plan.price === 0) {
      // Cancel any existing subscription
      await prisma.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })
      return res.json({ success: true, message: 'You are on the Basic (Free) plan' })
    }

    // ── 4. For paid plans: handle WALLET payment directly ──
    if (paymentMethod === 'WALLET') {
      const wallet = await prisma.wallet.findUnique({ where: { userId } })
      if (!wallet || wallet.balance < plan.price) {
        return res.status(400).json({ error: 'Insufficient wallet balance' })
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: plan.price } },
      })

      // Cancel existing subscription
      await prisma.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })

      // Create new subscription
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          status: 'ACTIVE',
          paymentMethod: 'WALLET',
          amount: plan.price,
          endDate,
          payments: {
            create: {
              amount: plan.price,
              method: 'WALLET',
              status: 'COMPLETED',
              paidAt: new Date(),
            },
          },
        },
        include: { plan: true },
      })

      return res.json({ success: true, subscription, message: `Subscribed to ${plan.name} plan!` })
    }

    // ── 5. For other payment methods: create PENDING subscription ──
    // (bKash, Nagad, Stripe, etc. — admin confirms payment)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'PAST_DUE', // pending payment confirmation
        paymentMethod,
        amount: plan.price,
        endDate,
        payments: {
          create: {
            amount: plan.price,
            method: paymentMethod,
            status: 'PENDING',
            reference: reference || null,
            metadata: metadata || null,
          },
        },
      },
      include: { plan: true },
    })

    res.json({
      success: true,
      subscription,
      message: 'Subscription created. Waiting for payment confirmation.',
      paymentInstructions: getPaymentInstructions(paymentMethod, plan.price),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// POST /api/subscriptions/cancel
// Subscription cancel করো
// ══════════════════════════════════════════
router.post('/cancel', async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'ACTIVE' },
    })
    if (!subscription) return res.status(404).json({ error: 'No active subscription found' })

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), autoRenew: false },
    })

    res.json({ success: true, message: 'Subscription cancelled. Access continues until end date.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// GET /api/subscriptions/history
// Payment history
// ══════════════════════════════════════════
router.get('/history', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      include: {
        plan: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, subscriptions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// ADMIN: POST /api/subscriptions/admin/confirm/:paymentId
// Admin manually confirms a payment
// ══════════════════════════════════════════
router.post('/admin/confirm/:paymentId', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' })

    const payment = await prisma.subscriptionPayment.update({
      where: { id: req.params.paymentId },
      data: { status: 'COMPLETED', paidAt: new Date() },
      include: { subscription: true },
    })

    // Activate subscription
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'ACTIVE' },
    })

    res.json({ success: true, message: 'Payment confirmed and subscription activated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// ADMIN: GET /api/subscriptions/admin/all
// All subscriptions
// ══════════════════════════════════════════
router.get('/admin/all', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' })

    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, subscriptions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════
// HELPER: Payment Instructions
// ══════════════════════════════════════════
function getPaymentInstructions(method, amount) {
  const instructions = {
    BKASH: {
      type: 'bKash',
      number: process.env.BKASH_NUMBER || '01XXXXXXXXX',
      amount,
      instructions: `Send $${amount} worth of BDT to our bKash number. Use "Send Money" option.`,
    },
    NAGAD: {
      type: 'Nagad',
      number: process.env.NAGAD_NUMBER || '01XXXXXXXXX',
      amount,
      instructions: `Send $${amount} worth of BDT to our Nagad number.`,
    },
    STRIPE: {
      type: 'Stripe',
      instructions: 'Complete payment via Stripe checkout link.',
    },
    PAYPAL: {
      type: 'PayPal',
      email: process.env.PAYPAL_EMAIL || 'pay@reachflow.com',
      amount,
      instructions: `Send $${amount} to our PayPal email.`,
    },
    CRYPTO_USDT: {
      type: 'USDT (TRC20)',
      address: process.env.USDT_ADDRESS || 'T...',
      amount,
      instructions: `Send ${amount} USDT (TRC20) to our wallet address.`,
    },
    BANK_TRANSFER: {
      type: 'Bank Transfer',
      instructions: 'Contact support for bank transfer details.',
    },
  }
  return instructions[method] || null
}

module.exports = router
