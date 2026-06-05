'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Zap, Crown, Star, Loader2, CreditCard, Smartphone, Building2, Wallet, Bitcoin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL

const PAYMENT_METHODS = [
  { value: 'WALLET',        label: 'Wallet Balance',  icon: Wallet,      color: 'text-violet-400' },
  { value: 'BKASH',         label: 'bKash',           icon: Smartphone,  color: 'text-pink-400' },
  { value: 'NAGAD',         label: 'Nagad',           icon: Smartphone,  color: 'text-orange-400' },
  { value: 'STRIPE',        label: 'Credit Card',     icon: CreditCard,  color: 'text-blue-400' },
  { value: 'PAYPAL',        label: 'PayPal',          icon: CreditCard,  color: 'text-sky-400' },
  { value: 'CRYPTO_USDT',   label: 'USDT Crypto',     icon: Bitcoin,     color: 'text-yellow-400' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer',   icon: Building2,   color: 'text-green-400' },
]

const PLAN_ICONS = { Basic: Star, Pro: Zap, Enterprise: Crown }
const PLAN_COLORS = {
  Basic:      { gradient: 'from-gray-600 to-gray-700',    border: 'border-gray-700',    badge: 'bg-gray-700 text-gray-300' },
  Pro:        { gradient: 'from-violet-600 to-purple-700', border: 'border-violet-500/50', badge: 'bg-violet-500/20 text-violet-300' },
  Enterprise: { gradient: 'from-yellow-500 to-orange-600', border: 'border-yellow-500/50', badge: 'bg-yellow-500/20 text-yellow-300' },
}

export default function SubscriptionPage() {
  const [plans, setPlans]               = useState([])
  const [currentPlan, setCurrentPlan]   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [userRole, setUserRole]         = useState(null)
  const [activeTab, setActiveTab]       = useState('ADVERTISER')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('WALLET')
  const [reference, setReference]       = useState('')
  const [subscribing, setSubscribing]   = useState(false)
  const [success, setSuccess]           = useState(null)
  const [error, setError]               = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentInfo, setPaymentInfo]   = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const token = localStorage.getItem('rf_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [plansRes, myRes, walletRes] = await Promise.all([
        fetch(`${API}/api/subscriptions/plans`, { headers }),
        fetch(`${API}/api/subscriptions/my`, { headers }),
        fetch(`${API}/api/wallet`, { headers }),
      ])

      const plansData  = await plansRes.json()
      const myData     = await myRes.json()
      const walletData = await walletRes.json()

      if (plansData.success)  setPlans(plansData.plans)
      if (myData.success)     setCurrentPlan(myData.currentPlan)
      if (walletData.success) setWalletBalance(walletData.wallet?.balance || 0)

      // Detect user role from token
      const payload = JSON.parse(atob(token.split('.')[1]))
      const role = myData.currentPlan?.type || 'ADVERTISER'
      setUserRole(role)
      setActiveTab(role)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe() {
    if (!selectedPlan) return
    setSubscribing(true)
    setError(null)
    setSuccess(null)
    setPaymentInfo(null)

    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${API}/api/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod,
          reference: reference || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Subscription failed')

      setSuccess(data.message)
      if (data.paymentInstructions) setPaymentInfo(data.paymentInstructions)
      setCurrentPlan(selectedPlan)
      setSelectedPlan(null)
      fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubscribing(false)
    }
  }

  const filteredPlans = plans.filter(p => p.type === activeTab)

  const getFeatures = (plan) => {
    if (plan.type === 'ADVERTISER') {
      return [
        { label: `${plan.campaignLimit ?? 'Unlimited'} Campaigns`,             enabled: true },
        { label: `${plan.maxPromotersPerCamp ?? 'Unlimited'} Promoters/Campaign`, enabled: true },
        { label: 'Analytics Export',   enabled: plan.analyticsExport },
        { label: 'Priority Support',   enabled: plan.prioritySupport },
        { label: `${plan.platformFeePercent}% Platform Fee`, enabled: true },
      ]
    } else {
      return [
        { label: `${plan.maxCampaignApply ?? 'Unlimited'} Campaign Applications`, enabled: true },
        { label: 'Analytics Export',        enabled: plan.analyticsExport },
        { label: 'Priority Applications',   enabled: plan.priorityApplications },
        { label: 'Verified Badge',          enabled: plan.verifiedBadge },
        { label: `${plan.platformFeePercent}% Platform Fee on Earnings`, enabled: true },
      ]
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <p className="text-gray-400 mt-1">Choose the plan that fits your needs</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Wallet Balance</p>
            <p className="text-lg font-bold text-violet-400">${walletBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Current Plan Badge */}
        {currentPlan && (
          <div className="mb-8 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Crown size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Plan</p>
              <p className="font-semibold text-violet-300">{currentPlan.name} — {currentPlan.type}</p>
            </div>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {['ADVERTISER', 'PROMOTER'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {tab === 'ADVERTISER' ? 'Advertiser' : 'Promoter'}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {filteredPlans.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.name] || Star
            const colors = PLAN_COLORS[plan.name]
            const features = getFeatures(plan)
            const isCurrent = currentPlan?.id === plan.id
            const isPopular = plan.name === 'Pro'

            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative bg-[#1a1b23] border ${colors.border} rounded-2xl overflow-hidden ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-violet-500' : ''
                }`}>

                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500" />
                )}
                {isPopular && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-full font-medium">
                    Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className={`p-6 bg-gradient-to-br ${colors.gradient} bg-opacity-20`}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-300 text-sm mb-1">/month</span>}
                    {plan.price === 0 && <span className="text-gray-300 text-sm mb-1">Free</span>}
                  </div>
                </div>

                {/* Features */}
                <div className="p-6 space-y-3">
                  {features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3">
                      {f.enabled
                        ? <Check size={16} className="text-emerald-400 shrink-0" />
                        : <X size={16} className="text-gray-600 shrink-0" />
                      }
                      <span className={`text-sm ${f.enabled ? 'text-gray-200' : 'text-gray-600'}`}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="px-6 pb-6">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium text-center border border-emerald-500/20">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                        plan.name === 'Pro'
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : plan.name === 'Enterprise'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}>
                      {plan.price === 0 ? 'Get Started Free' : `Subscribe — $${plan.price}/mo`}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Payment Modal */}
        {selectedPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-6 w-full max-w-md">

              <h2 className="text-xl font-bold mb-1">Complete Subscription</h2>
              <p className="text-gray-400 text-sm mb-6">
                {selectedPlan.name} Plan — ${selectedPlan.price}/month
              </p>

              {/* Payment Method Selection */}
              <p className="text-sm text-gray-400 mb-3">Select Payment Method</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon
                  return (
                    <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm border transition-all ${
                        paymentMethod === pm.value
                          ? 'border-violet-500 bg-violet-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}>
                      <Icon size={16} className={paymentMethod === pm.value ? 'text-violet-400' : pm.color} />
                      {pm.label}
                    </button>
                  )
                })}
              </div>

              {/* Wallet balance warning */}
              {paymentMethod === 'WALLET' && walletBalance < selectedPlan.price && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  Insufficient balance. Need ${selectedPlan.price}, have ${walletBalance.toFixed(2)}.
                  Please top up your wallet first.
                </div>
              )}

              {/* Reference field for manual payments */}
              {['BKASH', 'NAGAD', 'CRYPTO_USDT', 'BANK_TRANSFER', 'PAYPAL'].includes(paymentMethod) && (
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Transaction Reference (optional)</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Enter transaction ID / reference"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    You can add this later. Admin will verify your payment.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setSelectedPlan(null); setError(null) }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button onClick={handleSubscribe} disabled={subscribing}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-sm font-medium transition-all flex items-center justify-center gap-2">
                  {subscribing ? <Loader2 size={16} className="animate-spin" /> : null}
                  {subscribing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-6">
            <p className="font-semibold">{success}</p>
            {paymentInfo && (
              <div className="mt-3 text-sm text-gray-300 space-y-1">
                <p className="font-medium text-white">{paymentInfo.type} Payment Details:</p>
                {paymentInfo.number && <p>Number: <span className="text-white font-mono">{paymentInfo.number}</span></p>}
                {paymentInfo.email && <p>Email: <span className="text-white font-mono">{paymentInfo.email}</span></p>}
                {paymentInfo.address && <p>Address: <span className="text-white font-mono text-xs">{paymentInfo.address}</span></p>}
                {paymentInfo.amount && <p>Amount: <span className="text-white">${paymentInfo.amount}</span></p>}
                <p className="text-yellow-400 mt-2">{paymentInfo.instructions}</p>
                <p className="text-gray-500 text-xs mt-2">After payment, admin will verify and activate your subscription within 24 hours.</p>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  )
}
