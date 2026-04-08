'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { signIn, user, loading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already logged in — bounce to dashboard
  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [user, loading, router, next])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
      setSubmitting(false)
      return
    }

    router.replace(next)
  }

  return (
    <div className="min-h-screen bg-[#002855] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#C9A84C] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[#002855] font-bold text-xl">PAL</span>
        </div>
        <h1 className="text-white text-3xl font-bold">PAL360</h1>
        <p className="text-white/50 text-sm mt-1">Client Insurance Portal</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-[#002855] text-xl font-semibold mb-6">Sign in to your account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#002855] text-white font-semibold py-3 rounded-xl hover:bg-[#003a7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pan American Life Insurance Group · Trinidad &amp; Tobago
        </p>
      </div>

      <p className="text-white/30 text-xs mt-8">
        Protected by Supabase Auth · TLS encrypted
      </p>
    </div>
  )
}
