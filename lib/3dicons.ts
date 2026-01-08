// 3dicons.co - CC0 Licensed (Public Domain)
// https://3dicons.co/

export interface Icon3D {
  id: string
  name: string
  slug: string
  cdnUrl: string
  keywords: string[]
}

const BASE_CDN_URL = 'https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes'

// Curated icons for money collection purposes
// Icon IDs from 3dicons.co (format: {shortid}-{name})
// Verified IDs from https://3dicons.co/icons/{id}
export const icons: Icon3D[] = [
  {
    id: '3f0398-gift',
    name: 'Gift',
    slug: 'gift-box',
    cdnUrl: `${BASE_CDN_URL}/3f0398-gift/dynamic/200/color.webp`,
    keywords: ['gift', 'present', 'birthday', 'christmas', 'surprise', 'box'],
  },
  {
    id: '49654f-trophy',
    name: 'Trophy',
    slug: 'trophy',
    cdnUrl: `${BASE_CDN_URL}/49654f-trophy/dynamic/200/color.webp`,
    keywords: ['trophy', 'award', 'winner', 'competition', 'prize', 'achievement', 'sport', 'coach'],
  },
  {
    id: 'fa6099-travel',
    name: 'Travel',
    slug: 'travel',
    cdnUrl: `${BASE_CDN_URL}/fa6099-travel/dynamic/200/color.webp`,
    keywords: ['travel', 'trip', 'vacation', 'holiday', 'journey', 'tour', 'excursion', 'museum', 'zoo'],
  },
  {
    id: '744cc0-rocket',
    name: 'Rocket',
    slug: 'rocket',
    cdnUrl: `${BASE_CDN_URL}/744cc0-rocket/dynamic/200/color.webp`,
    keywords: ['rocket', 'launch', 'startup', 'space', 'goal', 'mission'],
  },
  {
    id: '1acc3d-heart',
    name: 'Heart',
    slug: 'heart',
    cdnUrl: `${BASE_CDN_URL}/1acc3d-heart/dynamic/200/color.webp`,
    keywords: ['heart', 'love', 'charity', 'care', 'health', 'wedding', 'anniversary'],
  },
  {
    id: '421bcd-dollar',
    name: 'Dollar',
    slug: 'dollar',
    cdnUrl: `${BASE_CDN_URL}/421bcd-dollar/dynamic/200/color.webp`,
    keywords: ['dollar', 'money', 'cash', 'fund', 'payment', 'finance'],
  },
  {
    id: '36f0c6-money-bag',
    name: 'Money Bag',
    slug: 'money-bag',
    cdnUrl: `${BASE_CDN_URL}/36f0c6-money-bag/dynamic/200/color.webp`,
    keywords: ['money', 'bag', 'savings', 'collection', 'fund', 'pool'],
  },
  {
    id: '7d956f-wallet',
    name: 'Wallet',
    slug: 'wallet',
    cdnUrl: `${BASE_CDN_URL}/7d956f-wallet/dynamic/200/color.webp`,
    keywords: ['wallet', 'money', 'payment', 'cash', 'finance'],
  },
  {
    id: '0ef25b-calender',
    name: 'Calendar',
    slug: 'calendar',
    cdnUrl: `${BASE_CDN_URL}/0ef25b-calender/dynamic/200/color.webp`,
    keywords: ['calendar', 'date', 'schedule', 'event', 'deadline', 'day'],
  },
  {
    id: '8ef1fa-clock',
    name: 'Clock',
    slug: 'clock',
    cdnUrl: `${BASE_CDN_URL}/8ef1fa-clock/dynamic/200/color.webp`,
    keywords: ['clock', 'time', 'deadline', 'schedule', 'timer'],
  },
  {
    id: '17125d-star',
    name: 'Star',
    slug: 'star',
    cdnUrl: `${BASE_CDN_URL}/17125d-star/dynamic/200/color.webp`,
    keywords: ['star', 'favorite', 'special', 'rating', 'best', 'top'],
  },
  {
    id: '39121b-medal',
    name: 'Medal',
    slug: 'medal',
    cdnUrl: `${BASE_CDN_URL}/39121b-medal/dynamic/200/color.webp`,
    keywords: ['medal', 'award', 'winner', 'achievement', 'sport', 'competition', 'end of year'],
  },
  {
    id: '628100-notebook',
    name: 'Notebook',
    slug: 'book',
    cdnUrl: `${BASE_CDN_URL}/628100-notebook/dynamic/200/color.webp`,
    keywords: ['book', 'notebook', 'reading', 'study', 'education', 'library', 'learning', 'school', 'supplies'],
  },
  {
    id: '1858b9-map-pin',
    name: 'Map Pin',
    slug: 'location',
    cdnUrl: `${BASE_CDN_URL}/1858b9-map-pin/dynamic/200/color.webp`,
    keywords: ['location', 'map', 'pin', 'place', 'destination', 'trip'],
  },
  {
    id: '49b6f4-target',
    name: 'Target',
    slug: 'target',
    cdnUrl: `${BASE_CDN_URL}/49b6f4-target/dynamic/200/color.webp`,
    keywords: ['target', 'goal', 'aim', 'focus', 'objective'],
  },
]

/**
 * Get icon by slug
 */
export function getIconBySlug(slug: string): Icon3D | undefined {
  return icons.find(icon => icon.slug === slug)
}

/**
 * Get icon URL by slug with optional size
 */
export function getIconUrl(slug: string, size: number = 200): string {
  const icon = getIconBySlug(slug)
  if (!icon) return getDefaultIcon().cdnUrl

  // Replace size in URL
  return icon.cdnUrl.replace('/200/', `/${size}/`)
}

/**
 * Match collection title to an icon based on keywords
 */
export function getIconByKeywords(text: string): Icon3D {
  const lowerText = text.toLowerCase()

  // Score each icon based on keyword matches
  let bestMatch: Icon3D | null = null
  let bestScore = 0

  for (const icon of icons) {
    let score = 0
    for (const keyword of icon.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        // Longer keyword matches are worth more
        score += keyword.length
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = icon
    }
  }

  return bestMatch || getDefaultIcon()
}

/**
 * Get the default icon (money-bag)
 */
export function getDefaultIcon(): Icon3D {
  return icons.find(icon => icon.slug === 'money-bag') || icons[0]
}

/**
 * Search icons by name or keywords
 */
export function searchIcons(query: string): Icon3D[] {
  if (!query.trim()) return icons

  const lowerQuery = query.toLowerCase()
  return icons.filter(icon =>
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
  )
}
