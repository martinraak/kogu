'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import { getDeadlineInfo, formatDate, formatDateTime, copyToClipboard } from '@/lib/utils'
import { Illustration } from '@/components/Illustration'
import { DEFAULT_PARTICIPANT_COUNT } from '@/lib/constants'

export default function CollectionPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')

  const payoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (payoutTimeoutRef.current) clearTimeout(payoutTimeoutRef.current)
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

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

  const showToastMessage = (message: string) => {
    setToast(message)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000)
  }

  const handleCopyLink = async () => {
    if (!collection || !linkUrl) return
    const link = `${linkUrl}/c/${collection.slug}`
    const success = await copyToClipboard(link)
    showToastMessage(success ? 'Link copied!' : 'Failed to copy link')
  }

  const handleCopyReminder = async () => {
    if (!collection || !linkUrl) return
    const link = `${linkUrl}/c/${collection.slug}`
    const completedCount = payments.filter((p) => p.status === 'completed').length
    const message = `Hey! Quick reminder about ${collection.title} — we've got ${completedCount} paid so far. Here's the link: ${link}`
    const success = await copyToClipboard(message)
    setShowReminderModal(false)
    showToastMessage(success ? 'Gentle nudge ready. Fingers crossed!' : 'Failed to copy message')
  }

  const handleCloseCollection = (andRequestPayout: boolean = false) => {
    if (!collection) return
    const updated = { ...collection, status: 'closed' as const }
    saveCollection(updated)
    setCollection(updated)
    setShowCloseModal(false)

    if (andRequestPayout) {
      // Immediately show payout modal
      setShowPayoutModal(true)
    } else {
      showToastMessage('Collection closed')
    }
  }

  const handleRequestPayout = () => {
    if (!collection) return
    const requestedAt = new Date().toISOString()
    const updated = {
      ...collection,
      payout_status: 'requested' as const,
      payout_requested_at: requestedAt,
    }
    saveCollection(updated)
    setCollection(updated)
    setShowPayoutModal(false)
    showToastMessage('Payout requested! Funds arriving shortly...')

    // Auto-complete payout after 4 seconds (with proper cleanup)
    if (payoutTimeoutRef.current) clearTimeout(payoutTimeoutRef.current)
    payoutTimeoutRef.current = setTimeout(() => {
      const completed = {
        ...updated,
        payout_status: 'completed' as const,
        payout_completed_at: new Date().toISOString(),
      }
      saveCollection(completed)
      setCollection(completed)
      showToastMessage('Funds have arrived!')
    }, 4000)
  }

  const handleArchiveCollection = () => {
    if (!collection) return
    const updated = { ...collection, archived: true }
    saveCollection(updated)
    setShowArchiveModal(false)
    showToastMessage('Collection archived')
    router.push('/dashboard')
  }

  // Check if payout trigger is met
  const isPayoutTriggerMet = (c: Collection, completedPayments: Payment[], participantCount: number, targetAmount: number, totalCollected: number): boolean => {
    if (c.status === 'closed') return true

    switch (c.payout_trigger) {
      case 'deadline':
        if (c.deadline) {
          const deadline = new Date(c.deadline)
          return new Date() >= deadline
        }
        return false
      case 'target':
        return totalCollected >= targetAmount
      case 'all_paid':
        return participantCount > 0 && completedPayments.length >= participantCount
      case 'manual':
      default:
        return false
    }
  }

  const getPayoutTriggerDescription = (c: Collection): string => {
    switch (c.payout_trigger) {
      case 'deadline':
        if (c.deadline) {
          return `Payout scheduled for ${formatDate(c.deadline)}`
        }
        return 'Payout when deadline reached'
      case 'target':
        return 'Payout when target reached'
      case 'all_paid':
        return 'Payout when everyone has paid'
      case 'manual':
      default:
        return 'Manual payout'
    }
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
  const participantCount = participants.length || DEFAULT_PARTICIPANT_COUNT
  const targetAmount = collection.amount ? collection.amount * participantCount : totalCollected
  const progressPercent = targetAmount > 0 ? Math.min((totalCollected / targetAmount) * 100, 100) : 0
  const deadlineInfo = getDeadlineInfo(collection.deadline)
  const maskedIBAN = profile.iban ? `••••${profile.iban.slice(-4)}` : ''
  const payoutTriggerMet = isPayoutTriggerMet(collection, completedPayments, participantCount, targetAmount, totalCollected)

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
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-kogu-warm flex items-center justify-center">
              <Illustration
                slug={collection.icon_slug}
                title={collection.title}
                size="md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-medium text-kogu-charcoal">{collection.title}</h1>
                {collection.status === 'active' ? (
                  <span className="flex-shrink-0 px-3 py-1 bg-green-50 text-kogu-success text-sm font-medium rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="flex-shrink-0 px-3 py-1 bg-kogu-warm text-kogu-muted text-sm font-medium rounded-full">
                    Closed
                  </span>
                )}
              </div>
              {collection.description && <p className="text-kogu-muted mt-1">{collection.description}</p>}
            </div>
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
            <div className="grid grid-cols-4 gap-3 mb-6">
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
                Remind
              </motion.button>
              <Link
                href={`/collection/${collection.id}/edit`}
                className="h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg hover:bg-kogu-pending transition-colors flex items-center justify-center"
              >
                Edit
              </Link>
              <motion.button
                onClick={() => setShowCloseModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg hover:bg-kogu-pending transition-colors"
              >
                Close
              </motion.button>
            </div>
          )}

          {/* Closed collection actions */}
          {collection.status === 'closed' && !collection.archived && (
            <div className="flex gap-3 mb-6">
              <Link
                href={`/new?duplicate=${collection.id}`}
                className="inline-flex items-center gap-2 h-10 px-4 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg hover:bg-kogu-pending transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </Link>
              <motion.button
                onClick={() => setShowArchiveModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 h-10 px-4 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg hover:bg-kogu-pending transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
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

          {/* Payout Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            {/* State 4: Payout completed */}
            {collection.payout_status === 'completed' && collection.payout_completed_at && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-kogu-success rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-kogu-charcoal">€{totalCollected.toFixed(0)} transferred</p>
                    <p className="text-sm text-kogu-muted">To {maskedIBAN} · {profile.full_name}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-kogu-warm">
                  <div className="flex items-center gap-2 text-sm text-kogu-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Completed {formatDateTime(collection.payout_completed_at)}</span>
                  </div>
                </div>
              </>
            )}

            {/* State 3: Payout requested */}
            {collection.payout_status === 'requested' && collection.payout_requested_at && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-kogu-forest rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium text-kogu-charcoal">€{totalCollected.toFixed(0)} on its way</p>
                    <p className="text-sm text-kogu-muted">To {maskedIBAN} · {profile.full_name}</p>
                  </div>
                </div>
                <div className="mt-4 bg-kogu-warm rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-kogu-forest mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-kogu-charcoal">Arriving in a few seconds...</p>
                      <p className="text-sm text-kogu-muted mt-1">Requested {formatDateTime(collection.payout_requested_at)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* State 2: Trigger met OR collection closed - ready for payout */}
            {collection.payout_status === 'pending' && payoutTriggerMet && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-kogu-coral/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-kogu-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-kogu-charcoal">€{totalCollected.toFixed(0)} ready for payout</p>
                    <p className="text-sm text-kogu-muted">To {maskedIBAN} · {profile.full_name}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowPayoutModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-kogu-coral text-white font-medium rounded-lg"
                >
                  Request payout
                </motion.button>
              </>
            )}

            {/* State 1: Trigger not met, collection active */}
            {collection.payout_status === 'pending' && !payoutTriggerMet && collection.status === 'active' && (
              <>
                <div className="mb-4">
                  <p className="font-medium text-kogu-charcoal">{getPayoutTriggerDescription(collection)}</p>
                  <p className="text-sm text-kogu-muted">€{totalCollected.toFixed(0)} collected so far</p>
                </div>
                <div className="bg-kogu-warm rounded-lg p-4">
                  <p className="text-sm text-kogu-charcoal">
                    Need the money sooner?{' '}
                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="text-kogu-forest font-medium hover:underline"
                    >
                      Close the collection
                    </button>{' '}
                    to request a payout.
                  </p>
                </div>
                <p className="text-sm text-kogu-muted mt-4">
                  Funds will be sent to {maskedIBAN} · {profile.full_name}
                </p>
              </>
            )}
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
                  Hey! Quick reminder about {collection.title} — we&apos;ve got{' '}
                  {completedPayments.length} paid so far. Here&apos;s the link:{' '}
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

      {/* Close Modal - Different content based on trigger state */}
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
              {payoutTriggerMet ? (
                // Trigger already met - simple close
                <>
                  <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Close collection?</h2>
                  <p className="text-kogu-muted mb-6">
                    People will no longer be able to pay. You can still request your payout.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCloseModal(false)}
                      className="flex-1 h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={() => handleCloseCollection(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 h-12 bg-kogu-charcoal text-white font-medium rounded-lg"
                    >
                      Close collection
                    </motion.button>
                  </div>
                </>
              ) : (
                // Trigger not met - close early flow
                <>
                  <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Close collection early?</h2>
                  <p className="text-kogu-muted mb-4">
                    You&apos;ve collected €{totalCollected.toFixed(0)} of €{targetAmount.toFixed(0)}. Closing now will stop accepting new payments.
                  </p>
                  <div className="bg-kogu-warm rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-kogu-charcoal">
                      €{totalCollected.toFixed(0)} will be available for payout
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <motion.button
                      onClick={() => handleCloseCollection(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 bg-kogu-forest text-white font-medium rounded-lg"
                    >
                      Close & request payout · €{totalCollected.toFixed(0)}
                    </motion.button>
                    <button
                      onClick={() => setShowCloseModal(false)}
                      className="w-full h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg"
                    >
                      Keep open
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout Confirmation Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            onClick={() => setShowPayoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-xl p-6"
            >
              <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Request payout</h2>
              <p className="text-kogu-muted mb-4">
                Transfer €{totalCollected.toFixed(0)} to your bank account?
              </p>
              <div className="bg-kogu-warm rounded-lg p-4 mb-6">
                <p className="text-sm text-kogu-muted">Sending to</p>
                <p className="font-medium text-kogu-charcoal">{maskedIBAN} · {profile.full_name}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleRequestPayout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 bg-kogu-forest text-white font-medium rounded-lg"
                >
                  Confirm payout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Modal */}
      <AnimatePresence>
        {showArchiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
            onClick={() => setShowArchiveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-xl p-6"
            >
              <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Archive collection?</h2>
              <p className="text-kogu-muted mb-6">
                This will hide the collection from your dashboard. You can still access it via direct link.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="flex-1 h-12 bg-kogu-warm text-kogu-charcoal font-medium rounded-lg"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleArchiveCollection}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 bg-kogu-forest text-white font-medium rounded-lg"
                >
                  Archive
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
