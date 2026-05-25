// ReachFlow - Payment Routes (Fixed & Complete)
// File: backend/src/routes/payment.js

import express, { Router } from 'express'
import Stripe from 'stripe'
import paypal from '@paypal/checkout-server-sdk'
import axios from 'axios'
import crypto from 'crypto'
import { prisma } from '../index.js'
import { creditWallet, deductWallet, getWallet, settlePendingWithdrawal } from '../services/walletService.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ─── AUTH MIDDLEWARE ──────────────────────
// Apply to all routes except webhooks
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  next()
}

// ─── STRIPE ───────────────────────────────

router.post('/stripe/create-intent', requireAuth, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency,
      metadata: { userId: req.user.id }
    })

    res.json({ success: true, clientSecret: paymentIntent.client_secret })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Stripe webhook — must use raw body, NO requireAuth
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).json({ error: 'Webhook signature failed' })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const userId = intent.metadata.userId
    const amount = intent.amount / 100
    await creditWallet(userId, amount, 'STRIPE', `Stripe deposit: ${intent.id}`)
  }

  res.json({ received: true })
})

// ─── PAYPAL ───────────────────────────────

const getPaypalClient = () => {
  const env = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  return new paypal.core.PayPalHttpClient(env)
}

router.post('/paypal/create-order', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: parseFloat(amount).toFixed(2) },
        description: 'ReachFlow Wallet Top-up'
      }]
    })

    const order = await getPaypalClient().execute(request)
    res.json({ success: true, orderId: order.result.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/paypal/capture-order', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body
    const request = new paypal.orders.OrdersCaptureRequest(orderId)
    const capture = await getPaypalClient().execute(request)

    if (capture.result.status === 'COMPLETED') {
      const amount = parseFloat(
        capture.result.purchase_units[0].payments.captures[0].amount.value
      )
      await creditWallet(req.user.id, amount, 'PAYPAL', `PayPal deposit: ${orderId}`)
    }

    res.json({ success: true, capture: capture.result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── BKASH ───────────────────────────────

const getBkashToken = async () => {
  const res = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    { app_key: process.env.BKASH_APP_KEY, app_secret: process.env.BKASH_APP_SECRET },
    { headers: { username: process.env.BKASH_USERNAME, password: process.env.BKASH_PASSWORD } }
  )
  return res.data.id_token
}

router.post('/bkash/create-payment', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const token = await getBkashToken()
    const response = await axios.post(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: req.user.id,
        callbackURL: `${process.env.API_URL}/api/payment/bkash/callback`,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `RF-${Date.now()}`
      },
      { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY } }
    )

    res.json({
      success: true,
      bkashURL: response.data.bkashURL,
      paymentID: response.data.paymentID
    })
  } catch (err) {
    res.status(500).json({ error: 'bKash payment creation failed' })
  }
})

// bKash callback — user redirected here after payment
router.get('/bkash/callback', async (req, res) => {
  try {
    const { paymentID, status } = req.query
    if (status !== 'success') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/advertiser/wallet?status=failed&method=bkash`)
    }

    const token = await getBkashToken()
    const execute = await axios.post(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
      { paymentID },
      { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY } }
    )

    if (execute.data.transactionStatus === 'Completed') {
      const amountBDT = parseFloat(execute.data.amount)
      const amountUSD = amountBDT / 110 // BDT → USD approx
      await creditWallet(
        execute.data.payerReference,
        amountUSD,
        'BKASH',
        `bKash: ${execute.data.trxID} (BDT ${amountBDT})`
      )
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/advertiser/wallet?status=success&method=bkash`)
  } catch {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/advertiser/wallet?status=error&method=bkash`)
  }
})

// ─── NAGAD ────────────────────────────────

router.post('/nagad/create-payment', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const orderId = `RF-${Date.now()}`
    const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    const challenge = crypto.randomBytes(16).toString('hex')

    const plaintext = JSON.stringify({
      merchantId: process.env.NAGAD_MERCHANT_ID,
      orderId,
      currencyCode: '050',
      amount: amount.toString(),
      challenge
    })

    const encrypted = crypto.publicEncrypt(
      { key: process.env.NAGAD_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(plaintext)
    ).toString('base64')

    // Sign with merchant private key
    const sign = crypto.createSign('SHA256')
    sign.update(plaintext)
    const signature = sign.sign(process.env.NAGAD_PRIVATE_KEY, 'base64')

    const response = await axios.post(
      `${process.env.NAGAD_BASE_URL}/remote-payment-gateway-1.0/api/dfs/check-out/initialize/${process.env.NAGAD_MERCHANT_ID}/${orderId}`,
      { dateTime: datetime, sensitiveData: encrypted, signature },
      { headers: { 'X-KM-Api-Version': 'v-0.2.0', 'X-KM-IP-V4': '127.0.0.1', 'X-KM-Client-Type': 'PC_WEB' } }
    )

    // Store orderId → userId mapping for callback
    await prisma.transaction.create({
      data: {
        walletId: (await prisma.wallet.upsert({
          where: { userId: req.user.id },
          create: { userId: req.user.id, balance: 0 },
          update: {}
        })).id,
        type: 'DEPOSIT',
        amount: parseFloat(amount) / 110,
        status: 'PENDING',
        method: 'NAGAD',
        reference: orderId,
        description: `Nagad pending: BDT ${amount}`,
        metadata: { userId: req.user.id, amountBDT: amount }
      }
    })

    res.json({ success: true, redirectUrl: response.data.callBackUrl })
  } catch (err) {
    res.status(500).json({ error: 'Nagad payment failed' })
  }
})

// Nagad callback
router.get('/nagad/callback', async (req, res) => {
  try {
    const { order_id, payment_ref_id, status } = req.query

    if (status !== 'Success') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/advertiser/wallet?status=failed&method=nagad`)
    }

    // Find pending transaction
    const pendingTx = await prisma.transaction.findFirst({
      where: { reference: order_id, status: 'PENDING', method: 'NAGAD' }
    })

    if (pendingTx) {
      const meta = pendingTx.metadata
      const amountUSD = parseFloat(meta.amountBDT) / 110

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: pendingTx.id },
          data: { status: 'COMPLETED', reference: payment_ref_id }
        }),
        prisma.wallet.update({
          where: { id: pendingTx.walletId },
          data: { balance: { increment: amountUSD }, totalEarned: { increment: amountUSD } }
        })
      ])
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/advertiser/wallet?status=success&method=nagad`)
  } catch {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/advertiser/wallet?status=error&method=nagad`)
  }
})

// ─── CRYPTO (NOWPayments - USDT TRC20) ────

router.post('/crypto/create-payment', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const response = await axios.post(
      'https://api.nowpayments.io/v1/payment',
      {
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        ipn_callback_url: `${process.env.API_URL}/api/payment/crypto/webhook`,
        order_id: req.user.id,
        order_description: 'ReachFlow Wallet Top-up'
      },
      { headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY } }
    )

    res.json({
      success: true,
      paymentId: response.data.payment_id,
      payAddress: response.data.pay_address,
      payAmount: response.data.pay_amount,
      currency: 'USDT (TRC20)',
      expiresAt: response.data.expiration_estimate_date
    })
  } catch (err) {
    res.status(500).json({ error: 'Crypto payment failed' })
  }
})

// NOWPayments IPN webhook
router.post('/crypto/webhook', async (req, res) => {
  try {
    // Verify NOWPayments signature
    const sig = req.headers['x-nowpayments-sig']
    if (sig && process.env.NOWPAYMENTS_IPN_SECRET) {
      const sorted = JSON.stringify(req.body, Object.keys(req.body).sort())
      const expected = crypto
        .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET)
        .update(sorted)
        .digest('hex')
      if (sig !== expected) return res.status(400).json({ error: 'Invalid signature' })
    }

    const { payment_status, price_amount, order_id, payment_id } = req.body

    if (payment_status === 'finished') {
      await creditWallet(order_id, parseFloat(price_amount), 'CRYPTO_USDT', `USDT deposit: ${payment_id}`)
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── WALLET ───────────────────────────────

router.get('/wallet', requireAuth, async (req, res) => {
  try {
    const wallet = await getWallet(req.user.id)

    if (!wallet) {
      // Auto-create empty wallet
      const newWallet = await prisma.wallet.create({
        data: { userId: req.user.id },
        include: { transactions: true }
      })
      return res.json({ success: true, wallet: newWallet })
    }

    res.json({ success: true, wallet })
  } catch {
    res.status(500).json({ error: 'Failed to fetch wallet' })
  }
})

// ─── WITHDRAWAL (Promoter) ────────────────

router.post('/withdraw', requireAuth, async (req, res) => {
  try {
    const { amount, method, accountInfo } = req.body

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })
    if (!method || !accountInfo) return res.status(400).json({ error: 'Method and account info required' })

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } })
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }

    const settings = await prisma.platformSettings.findFirst()
    const minWithdrawal = settings?.minWithdrawal ?? 10

    if (amount < minWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal is $${minWithdrawal}` })
    }

    const promoter = await prisma.promoter.findUnique({ where: { userId: req.user.id } })
    if (!promoter) return res.status(403).json({ error: 'Promoter account required' })

    await prisma.$transaction([
      prisma.withdrawal.create({
        data: { promoterId: promoter.id, amount, method, accountInfo, status: 'PENDING' }
      }),
      prisma.wallet.update({
        where: { userId: req.user.id },
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
          status: 'PENDING',
          method,
          description: `Withdrawal via ${method}`
        }
      })
    ])

    res.json({ success: true, message: 'Withdrawal request submitted. Processing within 24-48 hours.' })
  } catch (err) {
    res.status(500).json({ error: 'Withdrawal failed' })
  }
})

// ─── CAMPAIGN PAYMENT (Advertiser deduct) ─

router.post('/campaign/pay', requireAuth, async (req, res) => {
  try {
    const { campaignId, amount } = req.body

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

    await deductWallet(
      req.user.id,
      amount,
      'WALLET',
      `Campaign payment: ${campaign.title}`,
      'CAMPAIGN_PAYMENT'
    )

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { spentBudget: { increment: amount } }
    })

    res.json({ success: true, message: 'Campaign funded successfully' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router


