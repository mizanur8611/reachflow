// backend/src/routes/withdrawal.js
const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

const MIN_WITHDRAWAL = 10  // USD
const BDT_RATE = 110       // 1 USD = 110 BDT

// ─────────────────────────────────────────
// MIDDLEWARE (index.js এর মতোই)
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
// POST /api/withdrawals
// Promoter withdrawal request করবে
// ─────────────────────────────────────────

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { amount, method, accountInfo } = req.body

    // Validation
    if (!amount || !method || !accountInfo) {
      return res.status(400).json({ error: 'amount, method এবং accountInfo দিতে হবে' })
    }
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ error: `Minimum withdrawal amount $${MIN_WITHDRAWAL}` })
    }

    const validMethods = ['BKASH', 'NAGAD', 'BANK_TRANSFER']
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: 'Invalid method. BKASH, NAGAD বা BANK_TRANSFER দাও' })
    }

    // accountInfo validation
    if ((method === 'BKASH' || method === 'NAGAD') && !accountInfo.phone) {
      return res.status(400).json({ error: `${method} এর জন্য phone number দিতে হবে` })
    }
    if (method === 'BANK_TRANSFER') {
      if (!accountInfo.bankName || !accountInfo.accountNumber || !accountInfo.accountName) {
        return res.status(400).json({ error: 'Bank transfer এর জন্য bankName, accountNumber, accountName দিতে হবে' })
      }
    }

    // Promoter খুঁজো
    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.status(404).json({ error: 'Promoter found হয়নি' })

    // Wallet balance check
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.userId } })
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        error: `Insufficient balance. Available: $${wallet?.balance?.toFixed(2) || '0.00'}`
      })
    }

    // Pending withdrawal check
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: { promoterId: promoter.id, status: 'PENDING' }
    })
    if (pendingWithdrawal) {
      return res.status(400).json({
        error: 'একটি withdrawal request already pending আছে। সেটি process হওয়ার পর নতুন request করো।'
      })
    }

    // Withdrawal create + wallet update
    const [withdrawal] = await prisma.$transaction([
      prisma.withdrawal.create({
        data: { promoterId: promoter.id, amount, method, accountInfo, status: 'PENDING' }
      }),
      prisma.wallet.update({
        where: { userId: req.userId },
        data: {
          balance: { decrement: amount },
          pending: { increment: amount }
        }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount,
          method,
          status: 'PENDING',
          description: `Withdrawal request via ${method}`
        }
      })
    ])

    // Notification
    await prisma.notification.create({
      data: {
        userId: req.userId,
        title: 'Withdrawal Request Submitted',
        message: `$${amount} (৳${(amount * BDT_RATE).toFixed(0)}) withdrawal request submit হয়েছে। Admin review করবে শীঘ্রই।`,
        type: 'payment'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Withdrawal request successfully submitted!',
      data: {
        withdrawalId: withdrawal.id,
        amount,
        amountBDT: (amount * BDT_RATE).toFixed(0),
        method,
        status: 'PENDING',
        createdAt: withdrawal.createdAt
      }
    })
  } catch (error) {
    console.error('requestWithdrawal error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ─────────────────────────────────────────
// GET /api/withdrawals/my
// Promoter নিজের withdrawal history দেখবে
// ─────────────────────────────────────────

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const promoter = await prisma.promoter.findUnique({ where: { userId: req.userId } })
    if (!promoter) return res.json({ withdrawals: [], wallet: { balance: 0, pending: 0, totalEarned: 0 } })

    const where = { promoterId: promoter.id }
    if (status) where.status = status.toUpperCase()

    const [withdrawals, total, wallet] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.withdrawal.count({ where }),
      prisma.wallet.findUnique({ where: { userId: req.userId } })
    ])

    res.json({
      success: true,
      wallet: {
        balance: wallet?.balance || 0,
        pending: wallet?.pending || 0,
        totalEarned: wallet?.totalEarned || 0,
        balanceBDT: ((wallet?.balance || 0) * BDT_RATE).toFixed(0)
      },
      withdrawals: withdrawals.map(w => ({
        ...w,
        amountBDT: (w.amount * BDT_RATE).toFixed(0)
      })),
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('getMyWithdrawals error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ─────────────────────────────────────────
// GET /api/withdrawals/admin/stats
// Admin dashboard stats
// ─────────────────────────────────────────

router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [pending, completed, failed, totalAmountResult] = await Promise.all([
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'COMPLETED' } }),
      prisma.withdrawal.count({ where: { status: 'FAILED' } }),
      prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ])

    const totalPaid = totalAmountResult._sum.amount || 0

    res.json({
      success: true,
      pending,
      completed,
      failed,
      totalPaidUSD: totalPaid.toFixed(2),
      totalPaidBDT: (totalPaid * BDT_RATE).toFixed(0)
    })
  } catch (error) {
    console.error('getWithdrawalStats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ─────────────────────────────────────────
// GET /api/withdrawals/admin/all
// Admin সব withdrawals দেখবে
// ─────────────────────────────────────────

router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method } = req.query

    const where = {}
    if (status) where.status = status.toUpperCase()
    if (method) where.method = method.toUpperCase()

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          promoter: {
            include: {
              user: { select: { name: true, email: true, avatar: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.withdrawal.count({ where })
    ])

    res.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        amount: w.amount,
        amountBDT: (w.amount * BDT_RATE).toFixed(0),
        method: w.method,
        accountInfo: w.accountInfo,
        status: w.status,
        processedAt: w.processedAt,
        createdAt: w.createdAt,
        promoter: {
          id: w.promoter.id,
          name: w.promoter.user.name,
          email: w.promoter.user.email,
          avatar: w.promoter.user.avatar
        }
      })),
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('getAllWithdrawals error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ─────────────────────────────────────────
// PATCH /api/withdrawals/admin/:id
// Admin approve বা reject করবে
// ─────────────────────────────────────────

router.patch('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { action, note } = req.body // action: "approve" | "reject"

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "action হবে 'approve' বা 'reject'" })
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { promoter: { include: { user: true } } }
    })

    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal found হয়নি' })
    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ error: `এই withdrawal already ${withdrawal.status}` })
    }

    const userId = withdrawal.promoter.userId
    const wallet = await prisma.wallet.findUnique({ where: { userId } })

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id },
          data: { status: 'COMPLETED', processedAt: new Date() }
        }),
        prisma.wallet.update({
          where: { userId },
          data: { pending: { decrement: withdrawal.amount } }
        }),
        prisma.transaction.updateMany({
          where: { walletId: wallet.id, type: 'WITHDRAWAL', status: 'PENDING', amount: withdrawal.amount },
          data: { status: 'COMPLETED' }
        })
      ])

      await prisma.notification.create({
        data: {
          userId,
          title: '🎉 Withdrawal Approved!',
          message: `তোমার $${withdrawal.amount} (৳${(withdrawal.amount * BDT_RATE).toFixed(0)}) withdrawal approve হয়েছে। ${withdrawal.method} এ payment পাঠানো হয়েছে।`,
          type: 'payment'
        }
      })

      res.json({ success: true, message: 'Withdrawal approve করা হয়েছে।' })

    } else {
      // Reject: balance ফেরত দাও
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id },
          data: { status: 'FAILED', processedAt: new Date() }
        }),
        prisma.wallet.update({
          where: { userId },
          data: {
            balance: { increment: withdrawal.amount },
            pending: { decrement: withdrawal.amount }
          }
        }),
        prisma.transaction.updateMany({
          where: { walletId: wallet.id, type: 'WITHDRAWAL', status: 'PENDING', amount: withdrawal.amount },
          data: { status: 'FAILED' }
        })
      ])

      await prisma.notification.create({
        data: {
          userId,
          title: '❌ Withdrawal Rejected',
          message: `তোমার $${withdrawal.amount} withdrawal reject হয়েছে।${note ? ' কারণ: ' + note : ''} টাকা wallet এ ফেরত দেওয়া হয়েছে।`,
          type: 'payment'
        }
      })

      res.json({ success: true, message: 'Withdrawal reject করা হয়েছে। Balance ফেরত দেওয়া হয়েছে।' })
    }
  } catch (error) {
    console.error('processWithdrawal error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
