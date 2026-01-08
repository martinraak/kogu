'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { getIconBySlug, getIconByKeywords, getDefaultIcon, Icon3D } from '@/lib/3dicons'

interface IllustrationProps {
  slug?: string | null
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
}

const sizeMap = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
}

// Fallback SVG for when CDN images fail to load
function FallbackIcon({ size, className }: { size: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-kogu-warm rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-1/2 h-1/2 text-kogu-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  )
}

export function Illustration({
  slug,
  title,
  size = 'md',
  className = '',
  animate = false,
}: IllustrationProps) {
  const [hasError, setHasError] = useState(false)

  // Determine which icon to show
  let icon: Icon3D

  if (slug) {
    icon = getIconBySlug(slug) || getDefaultIcon()
  } else if (title) {
    icon = getIconByKeywords(title)
  } else {
    icon = getDefaultIcon()
  }

  const pixelSize = sizeMap[size]

  const imageElement = hasError ? (
    <FallbackIcon size={pixelSize} className={className} />
  ) : (
    <Image
      src={icon.cdnUrl}
      alt={icon.name}
      width={pixelSize}
      height={pixelSize}
      className={`object-contain mix-blend-multiply ${className}`}
      unoptimized
      onError={() => setHasError(true)}
    />
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {imageElement}
      </motion.div>
    )
  }

  return imageElement
}

interface AnimatedIllustrationProps {
  slug: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AnimatedIllustration({
  slug,
  size = 'lg',
  className = '',
}: AnimatedIllustrationProps) {
  const [hasError, setHasError] = useState(false)
  const icon = slug ? getIconBySlug(slug) || getDefaultIcon() : getDefaultIcon()
  const pixelSize = sizeMap[size]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={icon.slug}
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={className}
      >
        {hasError ? (
          <FallbackIcon size={pixelSize} />
        ) : (
          <Image
            src={icon.cdnUrl}
            alt={icon.name}
            width={pixelSize}
            height={pixelSize}
            className="object-contain mix-blend-multiply"
            unoptimized
            onError={() => setHasError(true)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
