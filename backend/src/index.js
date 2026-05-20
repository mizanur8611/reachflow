const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())

// Test Route
app.get('/', (req, res) => {
  res.json({ message: '✅ ReachFlow API is running!' })
})

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  if (email && password) {
    res.json({
      success: true,
      token: 'demo_token_123',
      user: {
        id: '1', name: 'Demo User', email,
        role: email.includes('admin') ? 'ADMIN' : email.includes('promoter') ? 'PROMOTER' : 'ADVERTISER',
        wallet: { balance: 1250 }
      }
    })
  } else {
    res.status(400).json({ error: 'Email and password required' })
  }
})

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body
  res.json({ success: true, token: 'demo_token_123', user: { id: '1', name, email, role } })
})

// Campaigns
app.get('/api/campaign/browse', (req, res) => {
  res.json({
    success: true,
    campaigns: [
      { id: '1', title: 'Fashion Brand Promo', description: 'Promote our summer collection', targetPlatforms: ['TIKTOK', 'INSTAGRAM'], commissionAmount: 15, commissionType: 'PER_POST', _count: { applications: 12 } },
      { id: '2', title: 'Skincare Review', description: 'Review our new skincare line', targetPlatforms: ['INSTAGRAM', 'YOUTUBE'], commissionAmount: 25, commissionType: 'PER_POST', _count: { applications: 8 } },
      { id: '3', title: 'Food Delivery Offer', description: 'Share your meal experience', targetPlatforms: ['FACEBOOK', 'TELEGRAM'], commissionAmount: 10, commissionType: 'PER_SALE', _count: { applications: 34 } },
      { id: '4', title: 'Tech Gadget Unboxing', description: 'Unbox our latest device', targetPlatforms: ['YOUTUBE', 'TIKTOK'], commissionAmount: 50, commissionType: 'PER_POST', _count: { applications: 5 } },
      { id: '5', title: 'App Install Drive', description: 'Get people to install our app', targetPlatforms: ['WHATSAPP', 'TELEGRAM'], commissionAmount: 2, commissionType: 'PER_SALE', _count: { applications: 67 } },
      { id: '6', title: 'Online Course Promo', description: 'Promote our digital course', targetPlatforms: ['LINKEDIN', 'FACEBOOK'], commissionAmount: 100, commissionType: 'PER_SALE', _count: { applications: 3 } },
    ]
  })
})

app.get('/api/campaign/my', (req, res) => {
  res.json({
    success: true,
    campaigns: [
      { id: '1', title: 'Summer Collection Promo', status: 'ACTIVE', totalBudget: 500, spentBudget: 420, analytics: { totalReach: 250000, totalClicks: 9200 }, _count: { applications: 12, submissions: 8 } },
      { id: '2', title: 'New Gadget Launch', status: 'ACTIVE', totalBudget: 400, spentBudget: 380, analytics: { totalReach: 180000, totalClicks: 7100 }, _count: { applications: 6, submissions: 4 } },
    ]
  })
})

// Wallet
app.get('/api/payment/wallet', (req, res) => {
  res.json({
    success: true,
    wallet: {
      balance: 1250, pending: 450, totalEarned: 3200,
      transactions: [
        { id: 1, description: 'Summer Collection Promo', type: 'CAMPAIGN_PAYMENT', method: 'WALLET', status: 'COMPLETED', amount: 500, createdAt: new Date() },
        { id: 2, description: 'Stripe Deposit', type: 'DEPOSIT', method: 'STRIPE', status: 'COMPLETED', amount: 1000, createdAt: new Date() },
        { id: 3, description: 'bKash Deposit', type: 'DEPOSIT', method: 'BKASH', status: 'COMPLETED', amount: 500, createdAt: new Date() },
      ]
    }
  })
})

// Notifications
app.get('/api/notification', (req, res) => {
  res.json({
    success: true,
    notifications: [
      { id: 1, title: '🎯 New Campaign Match!', message: 'Summer Collection matches your profile.', read: false, createdAt: new Date() },
      { id: 2, title: '✅ Application Approved!', message: 'Approved for Gadget Launch.', read: false, createdAt: new Date() },
      { id: 3, title: '💸 Payment Received', message: '$45 credited to your wallet.', read: true, createdAt: new Date() },
    ]
  })
})

app.patch('/api/notification/read-all', (req, res) => {
  res.json({ success: true })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✅ ReachFlow API running on http://localhost:${PORT}`)
})