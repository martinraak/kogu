'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AnimatedInput } from '@/components/AnimatedInput'
import Link from 'next/link'

export default function LandingPage() {
  const [title, setTitle] = useState('')
  const router = useRouter()

  const handleStart = () => {
    if (title.trim()) {
      router.push(`/new?title=${encodeURIComponent(title.trim())}`)
    } else {
      router.push('/new')
    }
  }

  return (
    <div className="min-h-screen bg-kogu-cream">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-kogu-cream/80 backdrop-blur-sm z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-kogu-forest">
            kogu
          </Link>
          <Link href="/login" className="text-kogu-charcoal hover:text-kogu-forest transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl text-center"
        >
          <h1 className="text-3xl md:text-4xl font-medium text-kogu-charcoal mb-2">
            Start collecting money for
          </h1>

          <div className="mb-8">
            <AnimatedInput value={title} onChange={setTitle} />
          </div>

          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-14 px-8 bg-kogu-coral text-white text-lg font-medium rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            Start collecting →
          </motion.button>

          <p className="mt-6 text-sm text-kogu-muted">
            Free · No app download · Works on any device
          </p>
        </motion.div>
      </main>

      {/* How it works */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-medium text-kogu-charcoal text-center mb-16"
          >
            How it works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '1',
                title: 'Create a collection',
                description: 'Set the amount and deadline',
              },
              {
                step: '2',
                title: 'Share the link',
                description: 'WhatsApp, Messenger, email',
              },
              {
                step: '3',
                title: 'Track who paid',
                description: 'No more spreadsheets',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-kogu-forest text-white rounded-full flex items-center justify-center text-xl font-medium mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-medium text-kogu-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-kogu-muted">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-kogu-cream py-8 px-6 text-center">
        <p className="text-sm text-kogu-muted">
          Already have collections?{' '}
          <Link href="/login" className="text-kogu-forest hover:underline">
            Sign in
          </Link>
        </p>
      </footer>
    </div>
  )
}
