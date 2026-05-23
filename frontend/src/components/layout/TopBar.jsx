'use client'
// ReachFlow - TopBar
// File: frontend/src/components/layout/TopBar.jsx

import { useState, useEffect, useRef } from 'react'
import { Bell, Search, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { io } from 'socket.io-client'

export default function TopBar() {
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const notifRef = useRef(null)

  // Real-time notifications via Socket.IO
  useEffect(() => {
    if (!user?.id) return
    const socket = io(process.env.NEXT_PUBLIC_API_URL)
    socket.emit('join', user.id)
    socket.on('notification', () => {
      queryClient.invalidateQueries(['notifications'])
    })
    return () => socket.disconnect()
  }, [user?.id])

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notification').then(r => r.data.notifications),
    refetchInterval: 30000
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notification/read-all'),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  })

  const unread = notifications?.filter(n => !n.read).length ?? 0

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 bg-[#0a0b0f]/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">

      {/* Search */}
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative overflow-hidden"
            >
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search campaigns, creators..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
              />
              <button onClick={() => { setSearchOpen(false); setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <X size={13} />
              </button>
            </motion.div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
              <Search size={18} />
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 bg-[#1a1b23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="font-semibold text-white text-sm">Notifications</span>
                  {unread > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications?.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">No notifications yet</div>
                  ) : (
                    (notifications ?? SAMPLE_NOTIFS).map((n, i) => (
                      <div key={n.id ?? i} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-violet-500/5' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-violet-400' : 'bg-transparent'}`} />
                          <div>
                            <p className="text-white text-xs font-medium">{n.title}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{n.message}</p>
                            <p className="text-gray-600 text-xs mt-1">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '2 min ago'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {user?.name?.[0] ?? 'U'}
        </div>
        {/* Logout */}
<button
  onClick={logout}
  className="ml-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
  title="Logout"
>
  ⏻
</button>
      </div>
    </header>
  )
}

const SAMPLE_NOTIFS = [
  { id: 1, title: '🎯 New Campaign Match!', message: 'Summer Collection Promo matches your profile.', read: false, createdAt: new Date() },
  { id: 2, title: '✅ Application Approved!', message: 'You\'ve been approved for Gadget Launch campaign.', read: false, createdAt: new Date(Date.now() - 3600000) },
  { id: 3, title: '💸 Payment Received', message: '$45 credited to your wallet.', read: true, createdAt: new Date(Date.now() - 86400000) },
]
