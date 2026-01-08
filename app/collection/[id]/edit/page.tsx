'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Collection } from '@/types'
import { getCollectionById, saveCollection, getProfile, saveProfile, getParticipantsForCollection, saveParticipants } from '@/lib/mock-data'
import { formatIBAN, validateIBAN } from '@/lib/utils'
import { Illustration } from '@/components/Illustration'
import { IconPicker } from '@/components/IconPicker'

export default function EditCollectionPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amountType, setAmountType] = useState<'fixed' | 'suggested' | 'open'>('fixed')
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [showContributors, setShowContributors] = useState(true)
  const [allowPayingForOthers, setAllowPayingForOthers] = useState(false)
  const [participants, setParticipants] = useState('')
  const [payoutTrigger, setPayoutTrigger] = useState<'deadline' | 'target' | 'all_paid' | 'manual'>('manual')
  const [iconSlug, setIconSlug] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Bank account info
  const [hasIBAN, setHasIBAN] = useState(false)
  const [fullName, setFullName] = useState('')
  const [iban, setIban] = useState('')
  const [existingIBAN, setExistingIBAN] = useState('')
  const [existingName, setExistingName] = useState('')
  const [ibanError, setIbanError] = useState('')

  useEffect(() => {
    const c = getCollectionById(id)
    if (c) {
      // Redirect if collection is closed
      if (c.status === 'closed') {
        router.replace(`/collection/${id}`)
        return
      }

      setCollection(c)
      setTitle(c.title)
      setDescription(c.description || '')
      setAmountType(c.amount_type)
      setAmount(c.amount ? c.amount.toString() : '')
      setDeadline(c.deadline || '')
      setShowContributors(c.show_contributors)
      setAllowPayingForOthers(c.allow_paying_for_others)
      setPayoutTrigger(c.payout_trigger)
      setIconSlug(c.icon_slug)

      // Load participants
      const existingParticipants = getParticipantsForCollection(c.id)
      if (existingParticipants.length > 0) {
        setParticipants(existingParticipants.map(p => p.name).join('\n'))
      }
    }

    // Check if user already has IBAN
    const profile = getProfile()
    if (profile.iban && profile.full_name) {
      setHasIBAN(true)
      setExistingIBAN(profile.iban)
      setExistingName(profile.full_name)
    }

    setLoading(false)
  }, [id, router])

  // Reset payout trigger if its dependency is removed
  useEffect(() => {
    if (payoutTrigger === 'deadline' && !deadline) {
      setPayoutTrigger('manual')
    }
    if (payoutTrigger === 'target' && (amountType === 'open' || !amount)) {
      setPayoutTrigger('manual')
    }
    if (payoutTrigger === 'all_paid' && !participants.trim()) {
      setPayoutTrigger('manual')
    }
  }, [deadline, amountType, amount, participants, payoutTrigger])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!collection) return

    // Validate amount for fixed/suggested types
    if (amountType !== 'open' && amount) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return
      }
    }

    // Validate IBAN if provided
    if (!hasIBAN && iban) {
      if (!validateIBAN(iban)) {
        setIbanError('Please enter a valid Estonian IBAN')
        return
      }
    }

    // Save profile if new IBAN
    if (!hasIBAN && iban && fullName) {
      const profile = getProfile()
      saveProfile({
        ...profile,
        full_name: fullName,
        iban: iban.replace(/\s/g, ''),
      })
    }

    const updatedCollection: Collection = {
      ...collection,
      title,
      description: description || null,
      icon_slug: iconSlug,
      amount_type: amountType,
      amount: amountType !== 'open' && amount ? parseFloat(amount) : null,
      deadline: deadline || null,
      show_contributors: showContributors,
      allow_paying_for_others: allowPayingForOthers,
      payout_trigger: payoutTrigger,
    }

    saveCollection(updatedCollection)

    // Update participants if changed
    if (participants.trim()) {
      const participantNames = participants.split('\n').map(name => name.trim()).filter(Boolean)
      if (participantNames.length > 0) {
        saveParticipants(collection.id, participantNames)
      }
    }

    // Show toast and redirect
    setShowToast(true)
    setTimeout(() => {
      router.push(`/collection/${collection.id}`)
    }, 1500)
  }

  const maskedIBAN = existingIBAN ? `••••${existingIBAN.slice(-4)}` : ''

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

  return (
    <div className="min-h-screen bg-kogu-cream">
      <header className="sticky top-0 bg-kogu-cream/80 backdrop-blur-sm border-b border-kogu-pending/30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href={`/collection/${id}`} className="text-kogu-forest font-medium">
            ← Cancel
          </Link>
          <span className="text-kogu-muted text-sm">Edit collection</span>
        </div>
      </header>

      <main className="px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title with Icon */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Icon selector */}
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="flex-shrink-0 w-16 h-16 rounded-xl bg-kogu-warm hover:bg-kogu-pending transition-colors flex items-center justify-center"
                >
                  <Illustration
                    slug={iconSlug}
                    title={title || "collection"}
                    size="md"
                  />
                </button>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                    What are you collecting for?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Teacher's birthday gift"
                    required
                    className="w-full h-12 px-4 text-lg border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-kogu-muted mt-3">
                Tap the icon to change it
              </p>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                Add some details <span className="text-kogu-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Let's get her something nice for her birthday on Dec 15th"
                rows={3}
                className="w-full px-4 py-3 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent resize-none"
              />
            </div>

            {/* Amount Type */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-kogu-charcoal mb-4">
                How much per person?
              </label>
              <div className="flex gap-2 mb-4">
                {(['fixed', 'suggested', 'open'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAmountType(type)}
                    className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                      amountType === type
                        ? 'bg-kogu-forest text-white'
                        : 'bg-kogu-warm text-kogu-charcoal hover:bg-kogu-pending'
                    }`}
                  >
                    {type === 'fixed' ? 'Fixed' : type === 'suggested' ? 'Suggested' : 'Open'}
                  </button>
                ))}
              </div>
              {amountType !== 'open' && (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kogu-muted text-lg">
                    €
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="15"
                    min="0"
                    step="0.01"
                    className="w-full h-12 pl-10 pr-4 text-lg border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                  />
                </div>
              )}
              <p className="mt-2 text-sm text-kogu-muted">
                {amountType === 'fixed'
                  ? 'Everyone pays the same amount'
                  : amountType === 'suggested'
                  ? 'Suggest an amount, but let people choose'
                  : 'Let people decide how much to give'}
              </p>
            </div>

            {/* Deadline */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                When do you need it by? <span className="text-kogu-muted font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
              />
            </div>

            {/* Payout Trigger */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-kogu-charcoal mb-4">
                When should the money be paid out?
              </label>
              <div className="space-y-3">
                {deadline && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payoutTrigger"
                      value="deadline"
                      checked={payoutTrigger === 'deadline'}
                      onChange={() => setPayoutTrigger('deadline')}
                      className="mt-1 w-4 h-4 text-kogu-forest focus:ring-kogu-forest"
                    />
                    <div>
                      <span className="text-kogu-charcoal font-medium">When deadline passes</span>
                      <p className="text-sm text-kogu-muted">Payout becomes available after the deadline</p>
                    </div>
                  </label>
                )}
                {amountType !== 'open' && amount && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payoutTrigger"
                      value="target"
                      checked={payoutTrigger === 'target'}
                      onChange={() => setPayoutTrigger('target')}
                      className="mt-1 w-4 h-4 text-kogu-forest focus:ring-kogu-forest"
                    />
                    <div>
                      <span className="text-kogu-charcoal font-medium">When target is reached</span>
                      <p className="text-sm text-kogu-muted">Payout becomes available when collected amount matches the target</p>
                    </div>
                  </label>
                )}
                {participants.trim() && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payoutTrigger"
                      value="all_paid"
                      checked={payoutTrigger === 'all_paid'}
                      onChange={() => setPayoutTrigger('all_paid')}
                      className="mt-1 w-4 h-4 text-kogu-forest focus:ring-kogu-forest"
                    />
                    <div>
                      <span className="text-kogu-charcoal font-medium">When everyone has paid</span>
                      <p className="text-sm text-kogu-muted">Payout becomes available when all participants have contributed</p>
                    </div>
                  </label>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payoutTrigger"
                    value="manual"
                    checked={payoutTrigger === 'manual'}
                    onChange={() => setPayoutTrigger('manual')}
                    className="mt-1 w-4 h-4 text-kogu-forest focus:ring-kogu-forest"
                  />
                  <div>
                    <span className="text-kogu-charcoal font-medium">Manual</span>
                    <p className="text-sm text-kogu-muted">Close collection and request payout whenever you want</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Show contributors */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-kogu-charcoal">
                    Show who has paid publicly
                  </label>
                  <p className="text-sm text-kogu-muted mt-1">
                    Contributors will see first names of people who paid
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContributors(!showContributors)}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    showContributors ? 'bg-kogu-forest' : 'bg-kogu-pending'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                      showContributors ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Allow paying for others */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-kogu-charcoal">
                    Allow paying for others
                  </label>
                  <p className="text-sm text-kogu-muted mt-1">
                    Let payers specify who they&apos;re paying for (e.g., their children)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowPayingForOthers(!allowPayingForOthers)}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    allowPayingForOthers ? 'bg-kogu-forest' : 'bg-kogu-pending'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                      allowPayingForOthers ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                Participants <span className="text-kogu-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Paste names or emails, one per line"
                rows={4}
                className="w-full px-4 py-3 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent resize-none font-mono text-sm"
              />
              <p className="mt-2 text-sm text-kogu-muted">
                Optional: track specific people. Anyone with the link can still pay.
              </p>
            </div>

            {/* Bank Account */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {hasIBAN ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-kogu-muted">Funds will go to</p>
                    <p className="text-kogu-charcoal font-medium">
                      {maskedIBAN} · {existingName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasIBAN(false)}
                    className="text-kogu-forest text-sm hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-kogu-charcoal mb-4">
                    Where should the money go?
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As it appears on your bank account"
                        required={!hasIBAN}
                        className="w-full h-12 px-4 text-base border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-kogu-charcoal mb-2">
                        IBAN
                      </label>
                      <input
                        type="text"
                        value={iban}
                        onChange={(e) => {
                          setIban(formatIBAN(e.target.value))
                          setIbanError('')
                        }}
                        placeholder="EE38 2200 2210 1234 5678"
                        required={!hasIBAN}
                        className={`w-full h-12 px-4 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent font-mono ${
                          ibanError ? 'border-kogu-urgent' : 'border-kogu-pending'
                        }`}
                      />
                      {ibanError && (
                        <p className="text-sm text-kogu-urgent mt-1">{ibanError}</p>
                      )}
                    </div>
                    <p className="text-sm text-kogu-muted">
                      We&apos;ll save this for your future collections
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 bg-kogu-forest text-white text-lg font-medium rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              Save changes
            </motion.button>
          </form>
        </motion.div>
      </main>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-kogu-charcoal text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
          >
            <span>Changes saved!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Picker */}
      <IconPicker
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={setIconSlug}
        selectedSlug={iconSlug}
      />
    </div>
  )
}
