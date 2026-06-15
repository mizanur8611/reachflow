'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, Users, User, BarChart2, Wallet,
  MessageSquare, Settings, HelpCircle, LogOut, ChevronLeft,
  Star, Plus, TrendingUp, Shield, Bell, ArrowDownToLine, Gift, UserCheck, AlertTriangle, Crown, Menu, X
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const ADVERTISER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/advertiser' },
  { label: 'Campaigns', icon: Megaphone, href: '/dashboard/advertiser/campaigns' },
  { label: 'Create Campaign', icon: Plus, href: '/dashboard/advertiser/campaigns/new' },
  { label: 'Creators', icon: Users, href: '/dashboard/advertiser/creators' },
  { label: 'Analytics', icon: BarChart2, href: '/dashboard/advertiser/analytics' },
  { label: 'Payments', icon: Wallet, href: '/dashboard/advertiser/wallet' },
  { label: 'Messages', icon: MessageSquare, href: '/dashboard/advertiser/messages' },
  { label: 'My Profile', icon: User, href: '/dashboard/advertiser/profile' },
  { label: 'Subscription', icon: Crown, href: '/dashboard/advertiser/subscription' },
]

const PROMOTER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/promoter' },
  { label: 'My Profile', icon: User, href: '/dashboard/promoter/profile' },
  { label: 'Browse Campaigns', icon: Megaphone, href: '/dashboard/promoter/campaigns' },
  { label: 'My Submissions', icon: TrendingUp, href: '/dashboard/promoter/submissions' },
  { label: 'Earnings', icon: Wallet, href: '/dashboard/promoter/earnings' },
  { label: 'Withdrawal', icon: ArrowDownToLine, href: '/dashboard/promoter/withdrawal' },
  { label: 'Leaderboard', icon: Star, href: '/dashboard/promoter/leaderboard' },
  { label: 'Referral', icon: Gift, href: '/dashboard/promoter/referral' },
  { label: 'Messages', icon: MessageSquare, href: '/dashboard/promoter/messages' },
  { label: 'Disputes', icon: AlertTriangle, href: '/dashboard/promoter/disputes' },
  { label: 'Subscription', icon: Crown, href: '/dashboard/promoter/subscription' },
]

const ADMIN_NAV = [
  { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
  { label: 'Payments', icon: Wallet, href: '/admin/payments' },
  { label: 'Withdrawals', icon: ArrowDownToLine, href: '/admin/withdrawals' },
  { label: 'Analytics', icon: BarChart2, href: '/admin/analytics' },
  { label: 'Disputes', icon: Shield, href: '/admin/disputes' },
  { label: 'KYC', icon: UserCheck, href: '/admin/kyc' },
]

export default function Sidebar({ role = 'advertiser' }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
              <span className="font-bold text-white text-lg">ReachFlow</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && !isMobile && (
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto">R</div>
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-white transition-colors ml-auto">
            <X size={18} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(c => !c)} className="text-gray-500 hover:text-white transition-colors ml-auto">
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  active ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 px-3 py-4 space-y-1">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotif(s => !s)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <div className="relative">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>
              )}
            </div>
            {(!collapsed || isMobile) && <span className="text-sm">Notifications</span>}
            {(!collapsed || isMobile) && unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </button>
          {showNotif && (
            <div className="fixed bottom-20 left-4 md:left-64 w-72 bg-[#1a1b23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-violet-400 hover:text-violet-300">Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications</div>
                ) : notifications.map((n, i) => (
                  <div key={i} className={`px-4 py-3 border-b border-white/5 ${!n.read ? 'bg-violet-500/5' : ''}`}>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link href="/dashboard/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all">
            <Settings size={18} />
            {(!collapsed || isMobile) && <span className="text-sm">Settings</span>}
          </div>
        </Link>
        <Link href="/help">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all">
            <HelpCircle size={18} />
            {(!collapsed || isMobile) && <span className="text-sm">Help & Support</span>}
          </div>
        </Link>

        <div className="flex items-center gap-3 px-3 py-3 mt-2 bg-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0] ?? 'U'}
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
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
    </div>
  )

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0e0f16] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">R</div>
          <span className="font-bold text-white">ReachFlow</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 bg-[#0e0f16] border-r border-white/5 z-50 overflow-hidden">
              <SidebarContent isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside animate={{ width: collapsed ? 72 : 256 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-[#0e0f16] border-r border-white/5 flex-col z-40 overflow-hidden">
        <SidebarContent isMobile={false} />
      </motion.aside>
    </>
  )
}

