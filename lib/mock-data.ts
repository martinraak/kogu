import { Profile, Collection, Participant, Payment } from '@/types'

export const mockProfile: Profile = {
  id: '1',
  email: 'mari@example.com',
  full_name: 'Mari Tamm',
  iban: 'EE382200221012345678',
  created_at: '2025-01-01T00:00:00Z'
}

export const mockCollections: Collection[] = [
  {
    id: '1',
    slug: 'teacher-birthday-dec',
    organizer_id: '1',
    title: "Mrs. Kask's Birthday Gift",
    description: "Let's get her something nice for her birthday on Dec 15th",
    icon_slug: 'gift-box',
    amount_type: 'fixed',
    amount: 15,
    currency: 'EUR',
    deadline: '2025-12-10',
    show_contributors: true,
    allow_paying_for_others: true,
    status: 'active',
    archived: false,
    payout_trigger: 'deadline',
    payout_status: 'pending',
    payout_requested_at: null,
    payout_completed_at: null,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    slug: 'class-trip-spring',
    organizer_id: '1',
    title: 'Spring Class Trip',
    description: 'Bus and entry tickets to Estonian Open Air Museum',
    icon_slug: 'travel',
    amount_type: 'fixed',
    amount: 25,
    currency: 'EUR',
    deadline: '2025-03-01',
    show_contributors: true,
    allow_paying_for_others: false,
    status: 'active',
    archived: false,
    payout_trigger: 'deadline',
    payout_status: 'pending',
    payout_requested_at: null,
    payout_completed_at: null,
    created_at: '2025-01-02T00:00:00Z'
  }
]

export const mockParticipants: Participant[] = [
  { id: '1', collection_id: '1', name: 'Anna Kivi', email: 'anna@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '2', collection_id: '1', name: 'Peeter Puu', email: null, created_at: '2025-01-01T00:00:00Z' },
  { id: '3', collection_id: '1', name: 'Liis Lepp', email: 'liis@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '4', collection_id: '1', name: 'Mart Mets', email: 'mart@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '5', collection_id: '1', name: 'Kati Kuusk', email: null, created_at: '2025-01-01T00:00:00Z' },
  { id: '6', collection_id: '1', name: 'Jaan Jõgi', email: 'jaan@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '7', collection_id: '1', name: 'Marika Mägi', email: null, created_at: '2025-01-01T00:00:00Z' },
  { id: '8', collection_id: '1', name: 'Toomas Tamm', email: 'toomas@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '9', collection_id: '1', name: 'Kadri Kask', email: 'kadri@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '10', collection_id: '1', name: 'Andres Aas', email: null, created_at: '2025-01-01T00:00:00Z' },
  { id: '11', collection_id: '1', name: 'Piret Põld', email: 'piret@example.com', created_at: '2025-01-01T00:00:00Z' },
  { id: '12', collection_id: '1', name: 'Raul Rebane', email: null, created_at: '2025-01-01T00:00:00Z' },
]

export const mockPayments: Payment[] = [
  { id: '1', collection_id: '1', participant_id: '1', payer_name: 'Anna', payer_email: 'anna@example.com', amount: 30, message: null, paying_for: ['Mia', 'Lucas'], status: 'completed', paid_at: '2025-01-05T10:00:00Z' },
  { id: '2', collection_id: '1', participant_id: '3', payer_name: 'Liis', payer_email: 'liis@example.com', amount: 15, message: 'From the Lepp family! 🎉', paying_for: ['Emma'], status: 'completed', paid_at: '2025-01-05T14:30:00Z' },
  { id: '3', collection_id: '1', participant_id: '4', payer_name: 'Mart', payer_email: 'mart@example.com', amount: 15, message: null, paying_for: null, status: 'completed', paid_at: '2025-01-06T09:15:00Z' },
  { id: '4', collection_id: '1', participant_id: '6', payer_name: 'Jaan', payer_email: 'jaan@example.com', amount: 15, message: 'Happy birthday!', paying_for: ['Karl'], status: 'completed', paid_at: '2025-01-06T11:00:00Z' },
  { id: '5', collection_id: '1', participant_id: '8', payer_name: 'Toomas', payer_email: 'toomas@example.com', amount: 15, message: null, paying_for: null, status: 'completed', paid_at: '2025-01-06T16:45:00Z' },
  { id: '6', collection_id: '1', participant_id: '9', payer_name: 'Kadri', payer_email: 'kadri@example.com', amount: 15, message: 'Best wishes!', paying_for: ['Sofia'], status: 'completed', paid_at: '2025-01-07T08:30:00Z' },
  { id: '7', collection_id: '1', participant_id: '11', payer_name: 'Piret', payer_email: 'piret@example.com', amount: 15, message: null, paying_for: null, status: 'completed', paid_at: '2025-01-07T12:00:00Z' },
  { id: '8', collection_id: '1', participant_id: '12', payer_name: 'Raul', payer_email: null, amount: 15, message: 'From all of us!', paying_for: ['Oliver'], status: 'completed', paid_at: '2025-01-07T14:20:00Z' },
]

// Helper to get collections from localStorage or fallback to mock
export function getCollections(): Collection[] {
  if (typeof window === 'undefined') return mockCollections
  const stored = localStorage.getItem('kogu_collections')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return mockCollections
    }
  }
  return mockCollections
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  const collections = getCollections()
  return collections.find(c => c.slug === slug)
}

export function getCollectionById(id: string): Collection | undefined {
  const collections = getCollections()
  return collections.find(c => c.id === id)
}

export function saveCollection(collection: Collection): void {
  if (typeof window === 'undefined') return
  const collections = getCollections()
  const existingIndex = collections.findIndex(c => c.id === collection.id)
  if (existingIndex >= 0) {
    collections[existingIndex] = collection
  } else {
    collections.push(collection)
  }
  localStorage.setItem('kogu_collections', JSON.stringify(collections))
}

export function getPaymentsForCollection(collectionId: string): Payment[] {
  if (typeof window === 'undefined') return mockPayments.filter(p => p.collection_id === collectionId)
  const stored = localStorage.getItem('kogu_payments')
  if (stored) {
    try {
      const payments: Payment[] = JSON.parse(stored)
      return payments.filter(p => p.collection_id === collectionId)
    } catch {
      return mockPayments.filter(p => p.collection_id === collectionId)
    }
  }
  return mockPayments.filter(p => p.collection_id === collectionId)
}

export function savePayment(payment: Payment): void {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem('kogu_payments')
  let payments: Payment[] = []
  if (stored) {
    try {
      payments = JSON.parse(stored)
    } catch {
      payments = [...mockPayments]
    }
  } else {
    payments = [...mockPayments]
  }
  payments.push(payment)
  localStorage.setItem('kogu_payments', JSON.stringify(payments))
}

export function getParticipantsForCollection(collectionId: string): Participant[] {
  if (typeof window === 'undefined') return mockParticipants.filter(p => p.collection_id === collectionId)
  const stored = localStorage.getItem('kogu_participants')
  if (stored) {
    try {
      const participants: Participant[] = JSON.parse(stored)
      return participants.filter(p => p.collection_id === collectionId)
    } catch {
      return mockParticipants.filter(p => p.collection_id === collectionId)
    }
  }
  return mockParticipants.filter(p => p.collection_id === collectionId)
}

export function getProfile(): Profile {
  if (typeof window === 'undefined') return mockProfile
  const stored = localStorage.getItem('kogu_profile')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return mockProfile
    }
  }
  return mockProfile
}

export function saveProfile(profile: Profile): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('kogu_profile', JSON.stringify(profile))
}

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)
  const random = crypto.randomUUID().substring(0, 6)
  return `${base}-${random}`
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function saveParticipants(collectionId: string, participantNames: string[]): void {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem('kogu_participants')
  let participants: Participant[] = []
  if (stored) {
    try {
      participants = JSON.parse(stored)
    } catch {
      participants = [...mockParticipants]
    }
  } else {
    participants = [...mockParticipants]
  }

  // Add new participants for this collection
  const newParticipants = participantNames
    .filter(name => name.trim())
    .map(name => ({
      id: generateId(),
      collection_id: collectionId,
      name: name.trim(),
      email: null,
      created_at: new Date().toISOString(),
    }))

  participants.push(...newParticipants)
  localStorage.setItem('kogu_participants', JSON.stringify(participants))
}
