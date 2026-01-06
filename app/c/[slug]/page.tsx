'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Collection, Payment } from '@/types'
import { getCollectionBySlug, getPaymentsForCollection, savePayment, generateId, getProfile, getParticipantsForCollection } from '@/lib/mock-data'
import { getDeadlineInfo } from '@/lib/utils'

const banks = [
  { id: 'swedbank', name: 'Swedbank', color: '#FF6600' },
  { id: 'seb', name: 'SEB', color: '#60CD18' },
  { id: 'lhv', name: 'LHV', color: '#000000' },
  { id: 'luminor', name: 'Luminor', color: '#7F35B2' },
  { id: 'coop', name: 'Coop Pank', color: '#00A651' },
]

export default function ContributorPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [collection, setCollection] = useState<Collection | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Form state
  const [payerName, setPayerName] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [payingFor, setPayingFor] = useState<string[]>([''])

  // Payment flow state
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const c = getCollectionBySlug(slug)
    if (c) {
      setCollection(c)
      setPayments(getPaymentsForCollection(c.id))
      const participants = getParticipantsForCollection(c.id)
      setParticipantCount(participants.length || 10) // Default to 10 if no participants
      if (c.amount_type === 'fixed' && c.amount) {
        setAmount(c.amount.toString())
      } else if (c.amount_type === 'suggested' && c.amount) {
        setAmount(c.amount.toString())
      }
    }
    setLoading(false)
  }, [slug])

  const handlePayClick = () => {
    if (!payerName.trim()) return
    setShowBankSelector(true)
  }

  const handleAddPayingFor = () => {
    setPayingFor([...payingFor, ''])
  }

  const handleRemovePayingFor = (index: number) => {
    setPayingFor(payingFor.filter((_, i) => i !== index))
  }

  const handlePayingForChange = (index: number, value: string) => {
    const updated = [...payingFor]
    updated[index] = value
    setPayingFor(updated)
  }

  // Get valid paying_for names (non-empty)
  const validPayingFor = payingFor.filter(name => name.trim())
  const payingForCount = validPayingFor.length || 1

  const handleBankSelect = async (bankId: string) => {
    setSelectedBank(bankId)
    setPaymentStatus('processing')

    // Simulate bank connection
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setPaymentStatus('success')

    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  const handleDone = () => {
    if (!collection) return

    // Calculate total amount based on paying_for count
    const baseAmount = collection.amount_type === 'fixed' && collection.amount
      ? collection.amount
      : parseFloat(amount) || 0
    const totalAmount = baseAmount * payingForCount

    const newPayment: Payment = {
      id: generateId(),
      collection_id: collection.id,
      participant_id: null,
      payer_name: payerName,
      payer_email: payerEmail || null,
      amount: totalAmount,
      message: message || null,
      paying_for: validPayingFor.length > 0 ? validPayingFor : null,
      status: 'completed',
      paid_at: new Date().toISOString(),
    }

    savePayment(newPayment)
    setPayments([...payments, newPayment])

    // Reset
    setShowBankSelector(false)
    setSelectedBank(null)
    setPaymentStatus('idle')
    setPayerName('')
    setPayerEmail('')
    setMessage('')
    setPayingFor([''])
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
          <p className="text-kogu-muted">This link may be incorrect or the collection may have been closed.</p>
        </div>
      </div>
    )
  }

  const profile = getProfile()
  const completedPayments = payments.filter((p) => p.status === 'completed')
  const totalCollected = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const deadlineInfo = getDeadlineInfo(collection.deadline)

  const targetAmount = collection.amount ? collection.amount * participantCount : totalCollected
  const progressPercent = targetAmount > 0 ? Math.min((totalCollected / targetAmount) * 100, 100) : 0

  const baseAmount = collection.amount_type === 'fixed' ? collection.amount : amount ? parseFloat(amount) : 0
  const totalDisplayAmount = (baseAmount || 0) * payingForCount

  return (
    <div className="min-h-screen bg-kogu-cream">
      <main className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          {/* Collection Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h1 className="text-2xl font-medium text-kogu-charcoal mb-2">{collection.title}</h1>

            {collection.description && (
              <p className="text-kogu-muted mb-4">{collection.description}</p>
            )}

            <p className="text-sm text-kogu-muted mb-4">Organized by {profile.full_name?.split(' ')[0] || 'Mari'}</p>

            {/* Deadline */}
            {deadlineInfo && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${deadlineInfo.color} ${deadlineInfo.bgColor} mb-4`}>
                {deadlineInfo.text}
              </span>
            )}

            {/* Progress */}
            <div className="mb-4">
              <div className="h-3 bg-kogu-warm rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-kogu-forest rounded-full"
                />
              </div>
              <p className="text-sm text-kogu-muted mt-2">
                {completedPayments.length} paid · €{totalCollected.toFixed(0)} collected
              </p>
            </div>

            {/* Contributors list */}
            {collection.show_contributors && completedPayments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {completedPayments.flatMap((p) => {
                  // If paying_for exists, show each child's name with "(via Payer)"
                  if (p.paying_for && p.paying_for.length > 0) {
                    return p.paying_for.map((childName, idx) => (
                      <motion.span
                        key={`${p.id}-${idx}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-kogu-warm rounded-full text-sm text-kogu-charcoal"
                      >
                        <svg className="w-4 h-4 text-kogu-success" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {childName} <span className="text-kogu-muted">(via {p.payer_name})</span>
                      </motion.span>
                    ))
                  }
                  // Otherwise show the payer's name
                  return [(
                    <motion.span
                      key={p.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-kogu-warm rounded-full text-sm text-kogu-charcoal"
                    >
                      <svg className="w-4 h-4 text-kogu-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {p.payer_name}
                    </motion.span>
                  )]
                })}
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-kogu-charcoal mb-4">Make a payment</h2>

            {/* Amount */}
            {collection.amount_type === 'fixed' ? (
              <div className="text-center py-4 mb-4 bg-kogu-warm rounded-lg">
                <span className="text-3xl font-medium text-kogu-charcoal">€{collection.amount}</span>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kogu-muted text-lg">€</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={collection.amount?.toString() || '15'}
                    min="0"
                    step="0.01"
                    className="w-full h-12 pl-10 pr-4 text-lg border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                  />
                </div>
                {collection.amount_type === 'suggested' && (
                  <p className="text-sm text-kogu-muted mt-1">Suggested: €{collection.amount}</p>
                )}
              </div>
            )}

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-kogu-charcoal mb-2">Your name</label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Anna"
                required
                className="w-full h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                Email <span className="text-kogu-muted font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                placeholder="For your receipt"
                className="w-full h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
              />
            </div>

            {/* Paying for others */}
            {collection.allow_paying_for_others && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                  Who are you paying for? <span className="text-kogu-muted font-normal">(optional)</span>
                </label>
                <div className="space-y-2">
                  {payingFor.map((name, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handlePayingForChange(index, e.target.value)}
                        placeholder="Child's name"
                        className="flex-1 h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                      />
                      {payingFor.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePayingFor(index)}
                          className="w-12 h-12 flex items-center justify-center text-kogu-muted hover:text-kogu-charcoal transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddPayingFor}
                  className="mt-2 text-sm text-kogu-forest hover:underline"
                >
                  + Add another
                </button>
              </div>
            )}

            {!collection.allow_paying_for_others && <div className="mb-2" />}

            {/* Pay Button */}
            <motion.button
              onClick={handlePayClick}
              disabled={!payerName.trim() || !totalDisplayAmount}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 bg-kogu-coral text-white text-lg font-medium rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {payingForCount > 1 && baseAmount ? (
                <>Pay €{totalDisplayAmount} ({payingForCount} × €{baseAmount}) →</>
              ) : (
                <>Pay €{totalDisplayAmount || 0} →</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Bank Selector Modal */}
      <AnimatePresence>
        {showBankSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
            onClick={() => paymentStatus === 'idle' && setShowBankSelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-2xl p-6"
            >
              {paymentStatus === 'idle' && (
                <>
                  <h2 className="text-xl font-medium text-kogu-charcoal mb-6 text-center">Choose your bank</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {banks.map((bank) => (
                      <motion.button
                        key={bank.id}
                        onClick={() => handleBankSelect(bank.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-20 bg-kogu-warm rounded-xl flex items-center justify-center text-lg font-medium text-kogu-charcoal hover:bg-kogu-pending transition-colors"
                      >
                        {bank.name}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {paymentStatus === 'processing' && (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 border-4 border-kogu-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg text-kogu-charcoal">
                    Connecting to {banks.find((b) => b.id === selectedBank)?.name}...
                  </p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    className="w-16 h-16 bg-kogu-success rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  <h2 className="text-xl font-medium text-kogu-charcoal mb-2">Payment successful!</h2>
                  <p className="text-kogu-muted mb-6">{profile.full_name?.split(' ')[0] || 'Mari'} will be happy.</p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-kogu-charcoal mb-2 text-left">
                      Add a message <span className="text-kogu-muted font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="From the Tamm family 🎉"
                      className="w-full h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                    />
                  </div>

                  <motion.button
                    onClick={handleDone}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 bg-kogu-forest text-white text-lg font-medium rounded-lg"
                  >
                    Done
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
