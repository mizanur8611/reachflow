const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

dotenv.config()

const app = express()
const prisma = new PrismaClient()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://reachflow-lovat.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))