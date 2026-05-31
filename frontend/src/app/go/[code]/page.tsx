'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function GoPage() {
  const { code } = useParams()

  useEffect(() => {
    if (code) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/go/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.url) window.location.href = data.url
        })
    }
  }, [code])

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg font-medium">Redirecting...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait</p>
      </div>
    </div>
  )
}

