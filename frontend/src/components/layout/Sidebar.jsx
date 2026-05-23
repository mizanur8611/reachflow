'use client'
// ReachFlow - Sidebar Layout
// File: frontend/src/components/layout/Sidebar.jsx

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, Users, BarChart2, Wallet,
  MessageSquare, Settings, HelpCircle, LogOut, ChevronLeft,
  Star, Plus, TrendingUp, Shield, Bell
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const ADVERTISER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/advertiser' },
  { label: 'Campaigns', icon: Megaphone, href: '/dashboard/advertiser/campaigns' },
  { label: 'Create Campaign', icon: Plus, href: '/dashboard/advertiser/campaigns/create' },
  { label: 'Creators', icon: Users, href: '/dashboard/advertiser/creators' },
  { label: 'Analytics', icon: BarChart2, href: '/dashboard/advertiser/analytics' },
  { label: 'Payments', icon: Wallet, href: '/dashboard/advertiser/wallet' },
  { label: 'Messages', icon: MessageSquare, href: '/dashboard/advertiser/messages' },
]

const PROMOTER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/promoter' },
  { label: 'Browse Campaigns', icon: Megaphone, href: '/dashboard/promoter/campaigns' },
  { label: 'My Submissions', icon: TrendingUp, href: '/dashboard/promoter/submissions' },
  { label: 'Earnings', icon: Wallet, href: '/dashboard/promoter/earnings' },
  { label: 'Leaderboard', icon: Star, href: '/dashboard/promoter/leaderboard' },
  { label: 'Messages', icon: MessageSquare, href: '/dashboard/promoter/messages' },
]

const ADMIN_NAV = [
  { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
  { label: 'Payments', icon: Wallet, href: '/admin/payments' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { label: 'Disputes', icon: Shield, href: '/admin/disputes' },
]

export default function Sidebar({ role = 'advertiser' }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const nav = role === 'admin' ? ADMIN_NAV : role === 'promoter' ? PROMOTER_NAV : ADVERTISER_NAV

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-[#0e0f16] border-r border-white/5 flex flex-col z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
              <span className="font-bold text-white text-lg">ReachFlow</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto">R</div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-500 hover:text-white transition-colors ml-auto"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 px-3 py-4 space-y-1">
        <Link href="/settings">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all`}>
            <Settings size={18} />
            {!collapsed && <span className="text-sm">Settings</span>}
          </div>
        </Link>
        <Link href="/help">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all">
            <HelpCircle size={18} />
            {!collapsed && <span className="text-sm">Help & Support</span>}
          </div>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 bg-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0] ?? 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name ?? 'User'}</p>
                <p className="text-gray-500 text-xs truncate capitalize">{role} Plan</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors">
  <LogOut size={14} />
</button>
        </div>
      </div>
    </motion.aside>
  )
}
