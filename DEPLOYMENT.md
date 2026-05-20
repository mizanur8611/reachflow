# 🚀 ReachFlow — Deployment Guide

## ✅ Complete File Summary

### Backend (Node.js + Express)
- `backend/src/index.js` — Main server + Socket.IO
- `backend/src/routes/auth.js` — Register, Login, OTP, JWT
- `backend/src/routes/campaign.js` — Create, Browse, Apply, Submit
- `backend/src/routes/payment.js` — Stripe, PayPal, bKash, Nagad, Crypto
- `backend/src/routes/tracking.js` — Short links, Click tracking, Conversion pixel
- `backend/src/services/aiService.js` — AI Matching, Fraud Detection, Content Suggestion
- `backend/prisma/schema.prisma` — Full PostgreSQL database schema
- `backend/.env.example` — All environment variables
- `backend/package.json` — All dependencies

### Frontend (Next.js 14)
- `frontend/src/app/page.jsx` — Landing Page (Full marketing page)
- `frontend/src/app/(auth)/login/page.jsx` — Login + Register
- `frontend/src/app/dashboard/advertiser/page.jsx` — Advertiser Dashboard
- `frontend/src/app/dashboard/advertiser/wallet/page.jsx` — Wallet & Payments
- `frontend/src/app/dashboard/promoter/page.jsx` — Promoter Dashboard
- `frontend/src/app/admin/page.jsx` — Admin Panel
- `frontend/src/components/layout/Sidebar.jsx` — Collapsible Sidebar
- `frontend/src/components/layout/TopBar.jsx` — Topbar + Notifications
- `frontend/src/components/campaigns/CreateCampaignModal.jsx` — Campaign form
- `frontend/src/components/Providers.jsx` — React Query + Toast
- `frontend/src/app/layout.jsx` — Root Layout
- `frontend/src/lib/api.js` — Axios API client
- `frontend/src/store/authStore.js` — Zustand auth store
- `frontend/package.json` — All dependencies

---

## 🛠️ Step-by-Step Setup

### 1. Database Setup
```bash
# Install PostgreSQL and create database
createdb reachflow

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npx prisma migrate dev --name init
npx prisma generate
```

### 2. Redis Setup
```bash
# Install Redis
sudo apt install redis-server
redis-server
```

### 3. Backend Start
```bash
cd backend
npm run dev
# API running at http://localhost:4000
```

### 4. Frontend Start
```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
echo "NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_..." >> .env.local

npm run dev
# App running at http://localhost:3000
```

---

## ☁️ Production Deployment

### Frontend → Vercel
```bash
cd frontend
npm install -g vercel
vercel --prod
# Add env variables in Vercel dashboard
```

### Backend → Railway
```bash
# Go to railway.app
# New Project → Deploy from GitHub
# Add PostgreSQL & Redis plugins
# Set environment variables
# Deploy!
```

### Custom Domain
```
app.reachflow.io → Frontend (Vercel)
api.reachflow.io → Backend (Railway)
go.reachflow.io  → Tracking links (Backend)
```

---

## 🔑 Required API Keys

| Service | Where to Get |
|---------|-------------|
| Stripe | stripe.com/dashboard |
| PayPal | developer.paypal.com |
| bKash | bkash.com/developer (Merchant account) |
| Nagad | nagad.com.bd (Merchant) |
| NOWPayments (Crypto) | nowpayments.io |
| OpenAI | platform.openai.com |
| AWS S3 | aws.amazon.com |
| SMTP | Gmail App Password |

---

## 💰 Revenue Projections

| Users | Monthly Revenue |
|-------|----------------|
| 100 advertisers × $49/mo | $4,900 |
| 10% campaign fee on $50K spend | $5,000 |
| **Total Month 1** | **~$10,000** |
| Scale to 1000 advertisers | **~$100,000/mo** |

---

## 📞 Next Steps
1. Setup all API keys in `.env`
2. Run database migrations
3. Test with a sample campaign
4. Deploy to production
5. Onboard first 10 advertisers & 100 promoters
6. Market on LinkedIn, Facebook groups, Dhaka startup communities
