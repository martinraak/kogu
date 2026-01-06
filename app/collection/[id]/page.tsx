'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Collection, Payment, Participant } from '@/types'
import {
  getCollectionById,
  getPaymentsForCollection,
  getParticipantsForCollection,
  getProfile,
  saveCollection,
} from '@/lib/mock-data'
import { getDeadlineInfo, formatDate, copyToClipboard } from '@/lib/utils'

export default function CollectionPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [collection, setCollection] = useState<Collection | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')

  useEffect(() => {
    // Set link URL client-side only
    if (typeof window !== 'undefined') {
      setLinkUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    const c = getCollectionById(id)
    if (c) {
      setCollection(c)
      setPayments(getPaymentsForCollection(c.id))
      setParticipants(getParticipantsForCollection(c.id))
    }
    setLoading(false)
  }, [id])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCopyLink = async () => {
    if (!collection || !linkUrl) return
    const link = `${linkUrl}/c/${collection.slug}`
    const success = await copyToClipboard(link)
    showToast(success ? 'Link copied!' : 'Failed to copy link')
  }

  const handleCopyReminder = async () => {
    if (!collection || !linkUrl) return
    const link = `${linkUrl}/c/${collection.slug}`
    const completedCount = payments.filter((p) => p.status === 'completed').length
    const participantTotal = participants.length || 10
    const message = `Hey! Quick reminder about ${collection.title} — we're at ${completedCount}/${participantTotal} paid. Here's the link: ${link}`
    const success = await copyToClipboard(message)
    setShowReminderModal(false)
    showToast(success ? 'Gentle nudge ready. Fingers crossed!' : 'Failed to copy message')
  }

  const handleCloseCollection = () => {
    if (!collection) return
    const updated = { ...collection, status: 'closed' as const }
    saveCollection(updated)
    setCollection(updated)
    setShowCloseModal(false)
    showToast('Collection closed')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kogu-cream flex items-center justify-center">
        <div className="animate-pulse text-kogu-muted">Loading...</div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-kogu-cream flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-kogu-charcoal mb-2">Collection not found</h1>
          <Link href="/dashboard" className="text-kogu-forest hover:underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const profile = getProfile()
  const completedPayments = payments.filter((p) => p.status === 'completed')
  const totalCollected = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const participantCount = participants.length || 10 // Default to 10 if no participants
  const targetAmount = collection.amount ? collection.amount * participantCount : totalCollected
  const progressPercent = targetAmount > 0 ? Math.min((totalCollected / targetAmount) * 100, 100) : 0
  const deadlineInfo = getDeadlineInfo(collection.deadline)
  const maskedIBAN = profile.iban ? `••••${profile.iban.slice(-4)}` : ''

  // Combine participants with payments - match by participant_id only (strict matching)
  const participantPayments = participants.map((p) => {
    const payment = payments.find((pay) => pay.participant_id === p.id)
    return { participant: p, payment }
  })

  // Sort: pending first, then completed
  participantPayments.sort((a, b) => {
    if (a.payment && !b.payment) return 1
    if (!a.payment && b.payment) return -1
    return 0
  })

  return (
    <div className="min-h-screen bg-kogu-cream">
      <header className="sticky top-0 bg-kogu-cream/80 backdrop-blur-sm border-b border-kogu-pending/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-kogu-forest font-medium">
            ← Back
          </Link>
          <span className="text-kogu-muted text-sm">Collection</span>
        </div>
      </header>

      <main className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-medium text-kogu-charcoal mb-2">{collection.title}</h1>
              {collection.description && <p className="text-kogu-muted">{collection.description}</p>}
            </div>
            {collection.status === 'active' ? (
              <span className="px-3 py-1 bg-green-50 text-kogu-success text-sm font-medium rounded-full">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-kogu-warm text-kogu-muted text-sm font-medium rounded-full">
                Closed
              </span>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="mb-4">
              <div className="h-4 bg-kogu-warm rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-kogu-forest rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-lg text-kogu-charcoal">
                €{totalCollected.toFixed(0)} of €{targetAmount.toFixed(0)} collected
              </p>
              {deadlineInfo && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${deadlineInfo.color} ${deadlineInfo.bgColor}`}
                >
                  {deadlineInfo.text}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {collection.status === 'active' && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <motion.button
                onClick={handleCopyLink}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 bg-kogu-forest text-white font-medium rounded-lg"
              >
                Copy link
              </motion.button>
              <motion.button
                onClick={() => setShowReminderModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg hover:bg-kogu-pending transition-colors"
              >
                Send reminder
              </motion.button>
              <motion.button
                onClick={() => setShowCloseModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg hover:bg-kogu-pending transition-colors"
              >
                Close collection
              </motion.button>
            </div>
          )}

          {/* Participant List */}
          {participants.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-kogu-warm">
                <h2 className="font-medium text-kogu-charcoal">Participants</h2>
              </div>
              <div className="divide-y divide-kogu-warm">
                {participantPayments.map(({ participant, payment }) => (
                  <div key={participant.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {payment ? (
                        <div className="w-8 h-8 bg-kogu-success rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-kogu-pending rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-kogu-muted rounded-full" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-kogu-charcoal">
                          {participant.name}
                          {payment?.paying_for && payment.paying_for.length > 0 && (
                            <span className="text-kogu-muted font-normal"> — paid for {payment.paying_for.join(', ')}</span>
                          )}
                        </p>
                        {payment?.message && (
                          <p className="text-sm text-kogu-muted">&ldquo;{payment.message}&rdquo;</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {payment ? (
                        <>
                          <p className="font-medium text-kogu-charcoal">€{payment.amount}</p>
                          <p className="text-sm text-kogu-muted">{formatDate(payment.paid_at)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-kogu-pending">Pending</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Payment List (if no participants) */
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-kogu-warm">
                <h2 className="font-medium text-kogu-charcoal">Payments</h2>
              </div>
              {completedPayments.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-kogu-muted">No participants added. Anyone with the link can contribute.</p>
                </div>
              ) : (
                <div className="divide-y divide-kogu-warm">
                  {completedPayments.map((payment) => (
                    <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-kogu-success rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-kogu-charcoal">
                            {payment.payer_name}
                            {payment.paying_for && payment.paying_for.length > 0 && (
                              <span className="text-kogu-muted font-normal"> — paid for {payment.paying_for.join(', ')}</span>
                            )}
                          </p>
                          {payment.message && <p className="text-sm text-kogu-muted">&ldquo;{payment.message}&rdquo;</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-kogu-charcoal">€{payment.amount}</p>
                        <p className="text-sm text-kogu-muted">{formatDate(payment.paid_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payout Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-kogu-muted">Funds will be sent to</p>
            <p className="font-medium text-kogu-charcoal">
              {maskedIBAN} · {profile.full_name}
            </p>
          </div>
        </motion.div>
      </main>

      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            onClick={() => setShowReminderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-xl p-6"
            >
              <h2 className="text-xl font-medium text-kogu-charcoal mb-4">Send a reminder</h2>
              <div className="bg-kogu-warm rounded-lg p-4 mb-6">
                <p className="text-sm text-kogu-charcoal">
                  Hey! Quick reminder about {collection.title} — we&apos;re at{' '}
                  {completedPayments.length}/{participantCount} paid. Here&apos;s the link:{' '}
                  <span className="text-kogu-forest">{linkUrl}/c/{collection.slug}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleCopyReminder}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 bg-kogu-forest text-white font-medium rounded-lg"
                >
                  Copy message
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            onClick={() => setShowCloseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-xl p-6"
            >
              <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Close collection?</h2>
              <p className="text-kogu-muted mb-6">
                People will no longer be able to pay. You can still view all payments.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleCloseCollection}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 bg-kogu-urgent text-white font-medium rounded-lg"
                >
                  Close collection
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-kogu-charcoal text-white rounded-full shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
