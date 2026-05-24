'use client'
// ReachFlow - Login / Register Page
// File: frontend/src/app/(auth)/login/page.jsx

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, Zap, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['ADVERTISER', 'PROMOTER']),
})

const STATS = [
  { icon: Users, label: 'Active Promoters', value: '80K+' },
  { icon: TrendingUp, label: 'Campaigns Ran', value: '12K+' },
  { icon: DollarSign, label: 'Paid Out', value: '$2M+' },
]

export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | register
  const [showPass, setShowPass] = useState(false)
  const { setUser } = useAuthStore()
  const router = useRouter()

  const loginForm = useForm({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: 'PROMOTER' } })

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      localStorage.setItem('rf_token', data.token)
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}! 👋`)
      router.push(data.user.role === 'ADVERTISER' ? '/dashboard/advertiser' : '/dashboard/promoter')
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Login failed')
  })

  const registerMutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data),
    onSuccess: ({ data }) => {
      localStorage.setItem('rf_token', data.token)
      setUser(data.user)
      toast.success('Account created! Check your email to verify. 🎉')
      router.push(data.user.role === 'ADVERTISER' ? '/dashboard/advertiser' : '/dashboard/promoter')
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Registration failed')
  })

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0e0f1e] via-[#130d2e] to-[#0a0b0f] flex-col justify-between p-12 relative overflow-hidden">

        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold">R</div>
          <span className="font-bold text-white text-xl">ReachFlow</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white leading-tight mb-4"
          >
            Grow your brand<br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              without paid ads.
            </span>
          </motion.h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Connect with 80,000+ real promoters on TikTok, Instagram, Facebook, WhatsApp, Telegram and more.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <s.icon size={20} className="text-violet-400 mb-2" />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 relative z-10"
        >
          <p className="text-gray-300 text-sm italic mb-3">"ReachFlow gave us 10x more reach than our Facebook ads at 1/5th the cost. Game changer!"</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
            <div>
              <p className="text-white text-xs font-medium">Sarah Ahmed</p>
              <p className="text-gray-500 text-xs">Fashion Brand Owner, Dhaka</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  mode === m ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-2xl font-bold text-white mb-1">Welcome back!</h1>
                <p className="text-gray-400 text-sm mb-6">Sign in to your ReachFlow account</p>

                <form onSubmit={loginForm.handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors"
                    />
                    {loginForm.formState.errors.email && <p className="text-red-400 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        {...loginForm.register('password')}
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-violet-400 text-sm hover:text-violet-300">Forgot password?</Link>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {loginMutation.isPending ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16} /></>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-2xl font-bold text-white mb-1">Join ReachFlow</h1>
                <p className="text-gray-400 text-sm mb-6">Create your account in seconds</p>

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { value: 'ADVERTISER', label: 'Advertiser', desc: 'I want to promote my product', emoji: '📢' },
                    { value: 'PROMOTER', label: 'Promoter', desc: 'I want to earn by promoting', emoji: '💰' },
                  ].map(r => (
                    <label key={r.value} className="cursor-pointer">
                      <input type="radio" {...registerForm.register('role')} value={r.value} className="sr-only" />
                      <div className={`p-4 rounded-xl border-2 transition-all text-center ${
                        registerForm.watch('role') === r.value
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}>
                        <span className="text-2xl">{r.emoji}</span>
                        <p className="text-white font-medium text-sm mt-1">{r.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <form onSubmit={registerForm.handleSubmit(d => registerMutation.mutate(d))} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
                    <input {...registerForm.register('name')} placeholder="Your name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors" />
                    {registerForm.formState.errors.name && <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                    <input {...registerForm.register('email')} type="email" placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input {...registerForm.register('password')} type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none focus:border-violet-500 transition-colors" />
                      <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.password.message}</p>}
                  </div>
                                        <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">I want to</label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${registerForm.watch('role') === 'ADVERTISER' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
                            <input {...registerForm.register('role')} type="radio" value="ADVERTISER" className="hidden" />
                            <span className="text-sm font-medium">Advertiser</span>
                            <span className="text-xs text-gray-400">I want to promote my product</span>
                          </label>
                          <label className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${registerForm.watch('role') === 'PROMOTER' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
                            <input {...registerForm.register('role')} type="radio" value="PROMOTER" className="hidden" />
                            <span className="text-sm font-medium">Promoter</span>
                            <span className="text-xs text-gray-400">I want to earn by promoting</span>
                          </label>
                        </div>
                      </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {registerMutation.isPending ? 'Creating account...' : <><Zap size={16} /><span>Create Free Account</span></>}
                  </motion.button>

                  <p className="text-gray-500 text-xs text-center">By signing up, you agree to our <Link href="/terms" className="text-violet-400">Terms</Link> and <Link href="/privacy" className="text-violet-400">Privacy Policy</Link></p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
