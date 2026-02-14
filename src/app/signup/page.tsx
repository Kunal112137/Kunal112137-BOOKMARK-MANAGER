'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { parseAuthError } from '@/lib/authError'
import ActionButton from '@/components/ActionButton'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [action, setAction] = useState<null | { href: string; label: string }>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
      })

      if (err) {
        const parsed = parseAuthError(err.message)
        setError(parsed.message)
        setAction(parsed.action ? { href: parsed.action.href, label: parsed.action.label } : null)
      } else {
        setSuccess(true)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    try {
      // If user provided an email in the form, pre-check server-side whether
      // that email is already registered. This requires the server API
      // route `/api/check-user` which uses a Supabase service role key.
      if (email) {
        setLoading(true)
        setError('')
        const resp = await fetch('/api/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          const parsed = parseAuthError(body?.error || 'Unable to check email')
          setError(parsed.message)
          setAction(parsed.action ? { href: parsed.action.href, label: parsed.action.label } : null)
          setLoading(false)
          return
        }

        const body = await resp.json()
        if (body.exists) {
          const parsed = parseAuthError('Email already registered — please sign in instead')
          setError(parsed.message)
          setAction(parsed.action ? { href: parsed.action.href, label: parsed.action.label } : null)
          setLoading(false)
          return
        }
        setLoading(false)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          // ask user to select account (forces account chooser / re-auth if needed)
          // this improves UX when users have multiple Google accounts
          queryParams: { prompt: 'select_account' },
        },
      })

      if (error) {
        const parsed = parseAuthError(error.message)
        setError(parsed.message)
        setAction(parsed.action ? { href: parsed.action.href, label: parsed.action.label } : null)
      }
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Show OAuth error messages (from redirect) if present
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error_description') || params.get('error')
    if (oauthError) {
      const parsed = parseAuthError(decodeURIComponent(oauthError))
      setError(parsed.message)
      setAction(parsed.action ? { href: parsed.action.href, label: parsed.action.label } : null)
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-xl font-bold text-white">📚</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="mt-2 text-gray-600">Join Smart Bookmarks today</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 rounded-lg bg-green-100 p-4 text-center text-sm text-green-800">
              <p className="font-semibold">✓ Account created successfully!</p>
              <p>Redirecting to login...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

              {error && (
                <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                      {action && (
                        <p className="mt-2 text-center">
                          <ActionButton onClick={() => router.push(action.href)} label={action.label} />
                        </p>
                      )}
                </div>
              )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : success ? 'Success!' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignup}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          <p className="mt-3 text-center text-sm text-gray-600">
            If you already registered with your email/password, please{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              sign in instead
            </Link>
            .
          </p>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
