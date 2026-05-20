'use client'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Star, Clock, Zap } from 'lucide-react'

const CAMPAIGNS = [
  { id: 1, title: 'Fashion Brand Promo', platforms: ['TikTok', 'Instagram'], commission: 15, type: 'PER_POST', applied: 12 },
  { id: 2, title: 'Skincare Product Review', platforms: ['Instagram', 'YouTube'], commission: 25, type: 'PER_POST', applied: 8 },
  { id: 3, title: 'Healthy Food Delivery', platforms: ['Facebook', 'Telegram'], commission: 10, type: 'PER_SALE', applied: 34 },
  { id: 4, title: 'Tech Gadget Unboxing', platforms: ['YouTube', 'TikTok'], commission: 50, type: 'PER_POST', applied: 5 },
  { id: 5, title: 'App Install Drive', platforms: ['WhatsApp', 'Telegram'], commission: 2, type: 'PER_SALE', applied: 67 },
  { id: 6, title: 'Online Course Promo', platforms: ['LinkedIn', 'Facebook'], commission: 100, type: 'PER_SALE', applied: 3 },
]

export default function PromoterDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back! 👋</h1>
          <p className="text-gray-400 mt-1">Find campaigns and start earning today.</p>
        </div>

        {/* Earnings */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Earned', value: '$1,850', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
            { label: 'Available Balance', value: '$1,200', icon: TrendingUp, color: 'from-violet-500 to-purple-600' },
            { label: 'Pending', value: '$450', icon: Clock, color: 'from-amber-500 to-orange-600' },
            { label: 'Avg. Rating', value: '4.8/5', icon: Star, color: 'from-pink-500 to-rose-600' },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
                <c.icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-gray-400 text-xs mt-1">{c.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Withdraw Banner */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-5 mb-8 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Ready to withdraw $1,200?</p>
            <p className="text-gray-400 text-sm mt-1">Via bKash, Nagad, PayPal or USDT</p>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            Withdraw Now
          </button>
        </div>

        {/* Campaigns */}
        <h2 className="text-xl font-bold text-white mb-5">Available Campaigns</h2>
        <div className="grid grid-cols-3 gap-4">
          {CAMPAIGNS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#1a1b23] border border-white/5 rounded-2xl p-5 hover:border-violet-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white text-sm">{c.title}</h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
                  ${c.commission}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {c.platforms.map(p => (
                  <span key={p} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{c.type.replace('_', ' ')}</span>
                <span>👥 {c.applied} applied</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-violet-600 hover:bg-violet-500 py-2 rounded-xl text-xs font-semibold transition-colors">
                  Apply Now
                </button>
                <button className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors">
                  <Zap size={13} className="text-amber-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
