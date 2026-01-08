export type Profile = {
  id: string
  email: string
  full_name: string | null
  iban: string | null
  created_at: string
}

export type PayoutTrigger = 'deadline' | 'target' | 'all_paid' | 'manual'

export type PayoutStatus = 'pending' | 'requested' | 'completed'

export type Collection = {
  id: string
  slug: string
  organizer_id: string
  title: string
  description: string | null
  icon_slug: string | null
  amount_type: 'fixed' | 'suggested' | 'open'
  amount: number | null
  currency: string
  deadline: string | null
  show_contributors: boolean
  allow_paying_for_others: boolean
  status: 'active' | 'closed'
  archived: boolean
  payout_trigger: PayoutTrigger
  payout_status: PayoutStatus
  payout_requested_at: string | null
  payout_completed_at: string | null
  created_at: string
}

export type Participant = {
  id: string
  collection_id: string
  name: string
  email: string | null
  created_at: string
}

export type Payment = {
  id: string
  collection_id: string
  participant_id: string | null
  payer_name: string
  payer_email: string | null
  amount: number
  message: string | null
  paying_for: string[] | null
  status: 'pending' | 'completed' | 'failed'
  paid_at: string
}
