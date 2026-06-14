'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function GoogleAuthButton({ role = 'PROMOTER', onSuccess }) {
  const router = useRouter()
  const btnRef = useRef(null)

  useEffect(() => {
    // Load Google script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        shape: 'rectangular',
      })
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, role }),
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        if (onSuccess) {
          onSuccess(data)
          return
        }

        // Redirect based on role
        if (data.user.role === 'ADVERTISER') {
          router.push('/dashboard/advertiser')
        } else {
          router.push('/dashboard/promoter')
        }
      } else {
        alert('Google login failed. Please try again.')
      }
    } catch (err) {
      console.error('Google auth error:', err)
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div ref={btnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
    </div>
  )
}
