'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function GoogleAuthButton({ role = 'PROMOTER', onSuccess, isLogin = false }) {
  const router = useRouter()
  const btnRef = useRef(null)

  useEffect(() => {
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
        text: isLogin ? 'signin_with' : 'signup_with',
        shape: 'rectangular',
      })
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [role, isLogin])

  const handleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          role,
          isLogin,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Google login failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (onSuccess) {
        onSuccess(data)
        return
      }

      if (data.user.role === 'ADVERTISER') {
        router.push('/dashboard/advertiser')
      } else {
        router.push('/dashboard/promoter')
      }
    } catch (err) {
      console.error('Google auth error:', err)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div ref={btnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
    </div>
  )
}
