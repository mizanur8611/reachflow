'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function RegisterRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  useEffect(() => {
    if (ref) {
      router.replace(`/login?ref=${ref}&mode=register`)
    } else {
      router.replace('/login?mode=register')
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterRedirect />
    </Suspense>
  )
}

