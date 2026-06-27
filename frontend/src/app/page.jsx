'use client'
// ReachFlow - Landing Page
// File: frontend/src/app/page.jsx

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Check, Star, TrendingUp, Users, DollarSign,
  Zap, Shield, Globe, ChevronDown, Play, Menu, X
} from 'lucide-react'
import Link from 'next/link'

const PLATFORMS = ['📘 Facebook', '🎵 TikTok', '📸 Instagram', '▶️ YouTube', '💬 WhatsApp', '✈️ Telegram', '𝕏 Twitter', '💼 LinkedIn']

const STATS = [
  { value: '80K+', label: 'Active Promoters' },
  { value: '12K+', label: 'Campaigns Launched' },
  { value: '$2M+', label: 'Paid to Promoters' },
  { value: '500+', label: 'Brands Worldwide' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Campaign', desc: 'Upload your product, set budget and target. Takes less than 5 minutes.', icon: '🚀' },
  { step: '02', title: 'AI Matches Creators', desc: 'Our AI finds the perfect promoters from 80K+ verified creators.', icon: '🤖' },
  { step: '03', title: 'Creators Promote', desc: 'Real people share your product on their social media channels.', icon: '📣' },
  { step: '04', title: 'Real People See It', desc: 'Thousands of engaged followers discover your product organically.', icon: '👁️' },
  { step: '05', title: 'Track & Pay', desc: 'Real-time analytics. Pay only for results.', icon: '📊' },
]

const FEATURES = [
  { icon: Zap, title: 'AI-Powered Matching', desc: 'Our AI automatically finds the best promoters for your campaign based on niche, audience, and engagement.', color: 'from-violet-500 to-purple-600' },
  { icon: Shield, title: 'Fraud Protection', desc: 'Advanced AI detects fake submissions, bot followers, and fraudulent activity automatically.', color: 'from-blue-500 to-cyan-600' },
  { icon: Globe, title: 'Multi-Platform', desc: 'Promote on Facebook, TikTok, Instagram, YouTube, WhatsApp, Telegram and more from one dashboard.', color: 'from-emerald-500 to-teal-600' },
  { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Track reach, clicks, conversions and ROI in real-time. Download detailed reports.', color: 'from-orange-500 to-amber-600' },
  { icon: DollarSign, title: 'Flexible Payments', desc: 'Pay via Stripe, PayPal, bKash, Nagad, or Crypto. Promoters withdraw instantly.', color: 'from-pink-500 to-rose-600' },
  { icon: Users, title: 'Community of Creators', desc: '80,000+ verified promoters across Bangladesh and globally. Every niche covered.', color: 'from-indigo-500 to-blue-600' },
]

const PRICING = [
  {
    name: 'Starter',
    price: 19,
    desc: 'Perfect for small businesses',
    features: ['5 Active Campaigns', '100 Promoters', 'Basic Analytics', 'Email Support', 'bKash & Nagad'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 49,
    desc: 'For growing brands',
    features: ['Unlimited Campaigns', '1,000 Promoters', 'Advanced Analytics', 'AI Content Suggestions', 'Priority Support', 'All Payment Methods', 'Fraud Protection'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    desc: 'For large organizations',
    features: ['Everything in Pro', 'Dedicated Account Manager', 'Custom Integrations', 'White-label Option', 'SLA Guarantee', 'API Access'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

const TESTIMONIALS = [
  { name: 'Mahfuzur Rahman', role: 'Fashion Brand Owner, Dhaka', text: 'ReachFlow gave us 10x more reach than Facebook Ads at 1/5th the cost. 250K real people saw our product!', rating: 5 },
  { name: 'Sarah Chen', role: 'E-commerce Director, Singapore', text: 'The AI matching is incredible. Within 48 hours we had 200 promoters sharing our product across TikTok and Instagram.', rating: 5 },
  { name: 'Karim Hossain', role: 'Promoter, Chittagong', text: 'I earn $500-800 per month just by posting about products I love. The best side income I\'ve found.', rating: 5 },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [platformIndex, setPlatformIndex] = useState(0)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setPlatformIndex(i => (i + 1) % PLATFORMS.length), 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0b0f]/90 backdrop-blur border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center font-bold">R</div>
            <span className="font-bold text-xl">ReachFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Pricing', 'For Creators'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-gray-400 hover:text-white text-sm transition-colors">{item}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"><button className="text-gray-300 hover:text-white px-4 py-2 text-sm transition-colors">Sign In</button></Link>
            <Link href="/login?mode=register">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                Get Started Free
              </motion.button>
            </Link>
          </div>

          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-gray-400">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-[#12131a] border-t border-white/5 px-6 py-4 space-y-3">
            {['Features', 'How it Works', 'Pricing'].map(item => (
              <a key={item} href="#" className="block text-gray-300 py-2">{item}</a>
            ))}
            <Link href="/login?mode=register"><button className="w-full bg-violet-600 py-3 rounded-xl font-semibold mt-2">Get Started Free</button></Link>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* BG Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 text-sm text-violet-300 mb-6">
              <Zap size={14} /> AI-Powered Influencer Marketing Platform
            </div>

            <h1 className="text-6xl md:text-7xl font-black leading-none mb-6">
              Grow Your Brand<br />
              <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                Without Paid Ads
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed">
              Connect with <strong className="text-white">80,000+ real promoters</strong> on{' '}
              <motion.span
                key={platformIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-violet-400 font-semibold"
              >
                {PLATFORMS[platformIndex]}
              </motion.span>
              {' '}and more. Pay only for real results.
            </p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <Link href="/login">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-violet-500/30 transition-all">
                  Start Free Campaign <ArrowRight size={20} />
                </motion.button>
              </Link>
              <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-4 rounded-2xl font-semibold transition-all">
                <Play size={16} className="text-violet-400" /> Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Launch your first campaign in under 10 minutes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute top-8 left-3/4 w-1/2 h-px bg-gradient-to-r from-violet-500/50 to-transparent hidden md:block" />
                )}
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-violet-400 text-xs font-bold mb-2">{step.step}</div>
                <h3 className="text-white font-semibold mb-2 text-sm">{step.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose ReachFlow?</h2>
            <p className="text-gray-400 text-lg">Everything you need to run successful influencer campaigns</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 text-lg">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`rounded-2xl p-6 border relative ${plan.highlight ? 'bg-gradient-to-b from-violet-900/50 to-[#1a1b23] border-violet-500/50 shadow-2xl shadow-violet-500/20' : 'bg-[#1a1b23] border-white/5'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-3 py-1 rounded-full font-semibold">Most Popular</div>
                )}
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.highlight ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
                    {plan.cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Loved by Brands & Creators</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-[#1a1b23] border border-white/5 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">{t.name[0]}</div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-5xl font-black text-white mb-4">Ready to Grow?</h2>
            <p className="text-gray-400 text-lg mb-8">Join 500+ brands already using ReachFlow to reach millions of real people.</p>
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-violet-500/30 mx-auto transition-all">
                Start Free — No Credit Card Needed <ArrowRight size={22} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center font-bold text-xs">R</div>
            <span className="font-bold text-white">ReachFlow</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 ReachFlow. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => <a key={l} href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  )
}
