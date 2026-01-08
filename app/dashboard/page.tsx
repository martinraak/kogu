'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Collection, Payment, Participant } from '@/types'
import { getCollections, getPaymentsForCollection, getParticipantsForCollection } from '@/lib/mock-data'
import { getDeadlineInfo } from '@/lib/utils'
import { Illustration } from '@/components/Illustration'
import { DEFAULT_PARTICIPANT_COUNT } from '@/lib/constants'

export default function DashboardPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({})
  const [participantsMap, setParticipantsMap] = useState<Record<string, Participant[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cols = getCollections()
    setCollections(cols)

    const pMap: Record<string, Payment[]> = {}
    const partMap: Record<string, Participant[]> = {}
    cols.forEach((c) => {
      pMap[c.id] = getPaymentsForCollection(c.id)
      partMap[c.id] = getParticipantsForCollection(c.id)
    })
    setPaymentsMap(pMap)
    setParticipantsMap(partMap)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-kogu-cream flex items-center justify-center">
        <div className="animate-pulse text-kogu-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kogu-cream">
      <header className="sticky top-0 bg-kogu-cream/80 backdrop-blur-sm border-b border-kogu-pending/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-medium text-kogu-charcoal">Your collections</h1>
          <Link href="/new">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-10 px-4 bg-kogu-forest text-white text-sm font-medium rounded-lg"
            >
              + New collection
            </motion.button>
          </Link>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {collections.filter(c => !c.archived).length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-kogu-warm rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-kogu-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-kogu-charcoal mb-2">No collections yet</h2>
              <p className="text-kogu-muted mb-8">Ready to stop chasing payments?</p>
              <Link href="/new">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-14 px-8 bg-kogu-coral text-white text-lg font-medium rounded-lg shadow-sm"
                >
                  Create your first collection
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {collections.filter(c => !c.archived).map((collection, index) => {
                const payments = paymentsMap[collection.id] || []
                const participants = participantsMap[collection.id] || []
                const completedPayments = payments.filter((p) => p.status === 'completed')
                const totalCollected = completedPayments.reduce((sum, p) => sum + p.amount, 0)
                const deadlineInfo = getDeadlineInfo(collection.deadline)

                const participantCount = participants.length || DEFAULT_PARTICIPANT_COUNT
                const targetAmount = collection.amount ? collection.amount * participantCount : totalCollected
                const progressPercent =
                  targetAmount > 0 ? Math.min((totalCollected / targetAmount) * 100, 100) : 0

                return (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <Link href={`/collection/${collection.id}`}>
                      <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-kogu-warm flex items-center justify-center">
                            <Illustration
                              slug={collection.icon_slug}
                              title={collection.title}
                              size="sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-lg font-medium text-kogu-charcoal truncate">{collection.title}</h3>
                              {collection.status === 'active' ? (
                                <span className="flex-shrink-0 px-2 py-1 bg-green-50 text-kogu-success text-xs font-medium rounded-full">
                                  Active
                                </span>
                              ) : (
                                <span className="flex-shrink-0 px-2 py-1 bg-kogu-warm text-kogu-muted text-xs font-medium rounded-full">
                                  Closed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="h-2 bg-kogu-warm rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-kogu-forest rounded-full"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-kogu-muted">
                            {completedPayments.length} paid · €{totalCollected.toFixed(0)}
                          </p>
                          {deadlineInfo && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${deadlineInfo.color} ${deadlineInfo.bgColor}`}
                            >
                              {deadlineInfo.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
