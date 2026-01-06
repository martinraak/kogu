import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DeadlineInfo = {
  text: string
  color: string
  bgColor: string
}

export function getDeadlineInfo(deadline: string | null): DeadlineInfo | null {
  if (!deadline) return null

  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: 'Overdue', color: 'text-kogu-urgent', bgColor: 'bg-red-50' }
  } else if (diffDays === 0) {
    return { text: 'Due today', color: 'text-kogu-urgent', bgColor: 'bg-red-50' }
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', color: 'text-kogu-urgent', bgColor: 'bg-red-50' }
  } else if (diffDays <= 5) {
    return { text: `${diffDays} days left`, color: 'text-amber-600', bgColor: 'bg-amber-50' }
  } else {
    return { text: `${diffDays} days left`, color: 'text-kogu-success', bgColor: 'bg-green-50' }
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers or if clipboard permission denied
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      return false
    }
  }
}

export function formatIBAN(value: string): string {
  const cleaned = value.replace(/\s/g, '').toUpperCase()
  const groups = cleaned.match(/.{1,4}/g)
  return groups ? groups.join(' ') : cleaned
}

export function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  // Basic validation: Estonian IBANs are 20 characters
  if (cleaned.length !== 20) return false
  if (!cleaned.startsWith('EE')) return false
  // Check for valid characters (letters and numbers only)
  return /^[A-Z]{2}[0-9]{18}$/.test(cleaned)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
