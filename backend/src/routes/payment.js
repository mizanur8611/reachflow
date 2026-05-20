// ReachFlow - Payment Routes
// File: backend/src/routes/payment.js

import { Router } from 'express'
import Stripe from 'stripe'
import paypal from '@paypal/checkout-server-sdk'
import axios from 'axios'
import crypto from 'crypto'
import { prisma } from '../index.js'
import { creditWallet, deductWallet } from '../services/walletService.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ─── STRIPE ───────────────────────────────

router.post('/stripe/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // in cents
      currency,
      metadata: { userId: req.user.id }
    })

    res.json({ success: true, clientSecret: paymentIntent.client_secret })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

const paypalClient = () => {
  const env = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  return new paypal.core.PayPalHttpClient(env)
}

router.post('/paypal/create-order', async (req, res) => {
  try {
    const { amount } = req.body
    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: amount.toString() },
        description: 'ReachFlow Wallet Top-up'
      }]
    })

    const order = await paypalClient().execute(request)
    res.json({ success: true, orderId: order.result.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body
    const request = new paypal.orders.OrdersCaptureRequest(orderId)
    const capture = await paypalClient().execute(request)

    if (capture.result.status === 'COMPLETED') {
      const amount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value)
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

router.post('/bkash/create-payment', async (req, res) => {
  try {
    const { amount } = req.body
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

    res.json({ success: true, bkashURL: response.data.bkashURL, paymentID: response.data.paymentID })
  } catch (err) {
    res.status(500).json({ error: 'bKash payment creation failed' })
  }
})

router.get('/bkash/callback', async (req, res) => {
  try {
    const { paymentID, status } = req.query
    if (status !== 'success') return res.redirect(`${process.env.FRONTEND_URL}/payment?status=failed`)

    const token = await getBkashToken()
    const execute = await axios.post(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
      { paymentID },
      { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY } }
    )

    if (execute.data.transactionStatus === 'Completed') {
      const amountBDT = parseFloat(execute.data.amount)
      const amountUSD = amountBDT / 110 // BDT to USD
      await creditWallet(execute.data.payerReference, amountUSD, 'BKASH', `bKash: ${execute.data.trxID}`)
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment?status=success`)
  } catch {
    res.redirect(`${process.env.FRONTEND_URL}/payment?status=error`)
  }
})

// ─── NAGAD ────────────────────────────────

router.post('/nagad/create-payment', async (req, res) => {
  try {
    const { amount } = req.body
    const orderId = `RF-${Date.now()}`
    const datetime = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)

    const plaintext = `{"merchantId":"${process.env.NAGAD_MERCHANT_ID}","orderId":"${orderId}","currencyCode":"050","amount":"${amount}","challenge":"${crypto.randomBytes(16).toString('hex')}"}`

    // Encrypt with Nagad public key
    const encrypted = crypto.publicEncrypt(
      { key: process.env.NAGAD_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(plaintext)
    ).toString('base64')

    const response = await axios.post(
      `${process.env.NAGAD_BASE_URL}/remote-payment-gateway-1.0/api/dfs/check-out/initialize/${process.env.NAGAD_MERCHANT_ID}/${orderId}`,
      { dateTime: datetime, sensitiveData: encrypted, signature: '' },
      { headers: { 'X-KM-Api-Version': 'v-0.2.0', 'X-KM-IP-V4': '127.0.0.1', 'X-KM-Client-Type': 'PC_WEB' } }
    )

    res.json({ success: true, redirectUrl: response.data.callBackUrl })
  } catch {
    res.status(500).json({ error: 'Nagad payment failed' })
  }
})

// ─── CRYPTO (USDT via NOWPayments) ────────

router.post('/crypto/create-payment', async (req, res) => {
  try {
    const { amount } = req.body

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
      currency: 'USDT (TRC20)'
    })
  } catch {
    res.status(500).json({ error: 'Crypto payment failed' })
  }
})

router.post('/crypto/webhook', async (req, res) => {
  const { payment_status, price_amount, order_id } = req.body
  if (payment_status === 'finished') {
    await creditWallet(order_id, parseFloat(price_amount), 'CRYPTO_USDT', `USDT deposit`)
  }
  res.json({ ok: true })
})

// ─── WALLET ───────────────────────────────

router.get('/wallet', async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    })
    res.json({ success: true, wallet })
  } catch {
    res.status(500).json({ error: 'Failed to fetch wallet' })
  }
})

// ─── WITHDRAWAL (Promoter) ────────────────

router.post('/withdraw', async (req, res) => {
  try {
    const { amount, method, accountInfo } = req.body
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } })

    if (wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' })

    const settings = await prisma.platformSettings.findFirst()
    if (amount < settings.minWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal is $${settings.minWithdrawal}` })
    }

    const promoter = await prisma.promoter.findUnique({ where: { userId: req.user.id } })

    await prisma.$transaction([
      prisma.withdrawal.create({ data: { promoterId: promoter.id, amount, method, accountInfo } }),
      prisma.wallet.update({ where: { userId: req.user.id }, data: { balance: { decrement: amount }, pending: { increment: amount } } })
    ])

    res.json({ success: true, message: 'Withdrawal request submitted. Processing within 24-48 hours.' })
  } catch {
    res.status(500).json({ error: 'Withdrawal failed' })
  }
})

export default router
