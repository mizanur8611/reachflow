'use client'
// ReachFlow - Sidebar Layout
// File: frontend/src/components/layout/Sidebar.jsx
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, Users, BarChart2, Wallet,
  MessageSquare, Settings, HelpCircle, LogOut, ChevronLeft,
  Star, Plus, TrendingUp, Shield, Bell, ArrowDownToLine
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
  { label: 'Withdrawal', icon: ArrowDownToLine, href: '/dashboard/promoter/withdrawal' },
  { label: 'Leaderboard', icon: Star, href: '/dashboard/promoter/leaderboard' },
  { label: 'Messages', icon: MessageSquare, href: '/dashboard/promoter/messages' },
]

const ADMIN_NAV = [
  { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
  { label: 'Payments', icon: Wallet, href: '/admin/payments' },
  { label: 'Withdrawals', icon: ArrowDownToLine, href: '/admin/withdrawals' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { label: 'Disputes', icon: Shield, href: '/admin/disputes' },
]

export default function Sidebar({ role = 'advertiser' }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const unread = notifications.filter(n => !n.read).length
  useEffect(() => {
  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('rf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch (err) {}
  }
  fetchNotifs()
  const interval = setInterval(fetchNotifs, 30000)
  return () => clearInterval(interval)
}, [])

const markAllRead = async () => {
  try {
    const token = localStorage.getItem('rf_token')
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  } catch (err) {}
}
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
      {/* Notification Bell */}
<div className="relative">
  <button
   onClick={() => setShowNotif(s => !s)}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all relative"
  >
    <div className="relative">
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
          {unread}
        </span>
      )}
    </div>
    {!collapsed && <span className="text-sm">Notifications</span>}
    {!collapsed && unread > 0 && (
      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
    )}
  </button>
  {showNotif && (
    <div className="fixed bottom-20 left-64 w-80 bg-[#1a1b23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Notifications</span>
        <button onClick={markAllRead} className="text-xs text-violet-400 hover:text-violet-300">Mark all read</button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications</div>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className={`px-4 py-3 border-b border-white/5 ${!n.read ? 'bg-violet-500/5' : ''}`}>
              <p className="text-sm font-medium text-white">{n.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )}
</div>
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
