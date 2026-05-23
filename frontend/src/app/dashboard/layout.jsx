'use client'
import Sidebar from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/authStore'

export default function DashboardLayout({ children }) {
  const { user } = useAuthStore()
  const role = user?.role?.toLowerCase() || 'advertiser'

  return (
    <div className="flex h-screen bg-[#0a0b0f]">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}