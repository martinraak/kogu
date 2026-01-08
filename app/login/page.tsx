'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

const isDev = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSent(true)
    }
  }

  const handleDevLogin = () => {
    // In dev mode, just redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-kogu-cream flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-medium text-kogu-forest">
            Kogu
          </Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          {sent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-kogu-success rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Check your email</h2>
              <p className="text-kogu-muted">
                We sent a magic link to <span className="font-medium">{email}</span>
              </p>
            </motion.div>
          ) : (
            <>
              <h1 className="text-xl font-medium text-kogu-charcoal mb-2">Sign in</h1>
              <p className="text-kogu-muted mb-6">Enter your email to receive a magic link</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-kogu-forest text-white font-medium rounded-lg"
                >
                  Send magic link
                </motion.button>
              </form>

              {/* Dev mode quick login */}
              {isDev && (
                <div className="mt-4 pt-4 border-t border-kogu-warm">
                  <motion.button
                    type="button"
                    onClick={handleDevLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 bg-kogu-charcoal text-white font-medium rounded-lg text-sm"
                  >
                    Dev: Skip to Dashboard →
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm text-kogu-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/new" className="text-kogu-forest hover:underline">
            Create a collection
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
