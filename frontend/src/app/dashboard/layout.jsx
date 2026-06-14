'use client'
import { useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/authStore'

export default function DashboardLayout({ children }) {
  const { user, fetchMe } = useAuthStore()
  const role = user?.role?.toLowerCase() || 'advertiser'

  useEffect(() => {
    fetchMe()
  }, [])

  return (
    <div className="flex h-screen bg-[#0a0b0f]">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto flex flex-col pt-14 md:pt-0 md:pl-64">
        {children}
      </main>
    </div>
  )
}

