'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

export const placeholders = [
  "teacher's birthday gift",
  "class trip to the zoo",
  "end of year present",
  "school supplies fund",
  "coach appreciation gift",
]

// Map placeholders to icon slugs
export const placeholderIcons: Record<string, string> = {
  "teacher's birthday gift": 'gift-box',
  "class trip to the zoo": 'travel',
  "end of year present": 'medal',
  "school supplies fund": 'book',
  "coach appreciation gift": 'trophy',
}

interface AnimatedInputProps {
  value: string
  onChange: (value: string) => void
  onPlaceholderChange?: (placeholder: string) => void
}

export function AnimatedInput({ value, onChange, onPlaceholderChange }: AnimatedInputProps) {
  const [placeholderText, setPlaceholderText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAnimatingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    isAnimatingRef.current = false
  }, [])

  useEffect(() => {
    // Clear any existing animation when conditions change
    clearAnimation()

    if (isFocused || value) {
      return
    }

    const currentPlaceholder = placeholders[currentIndex]
    let charIndex = 0
    let isDeleting = false
    isAnimatingRef.current = true

    const animate = () => {
      // Check if we should stop
      if (!isAnimatingRef.current) return

      if (!isDeleting) {
        // Typing
        if (charIndex <= currentPlaceholder.length) {
          setPlaceholderText(currentPlaceholder.substring(0, charIndex))
          charIndex++
          timeoutRef.current = setTimeout(animate, 50)
        } else {
          // Pause before deleting
          timeoutRef.current = setTimeout(() => {
            if (!isAnimatingRef.current) return
            isDeleting = true
            animate()
          }, 2000)
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          charIndex--
          setPlaceholderText(currentPlaceholder.substring(0, charIndex))
          timeoutRef.current = setTimeout(animate, 30)
        } else {
          // Move to next placeholder
          if (isAnimatingRef.current) {
            setCurrentIndex((prev) => (prev + 1) % placeholders.length)
          }
        }
      }
    }

    // Notify about current placeholder
    onPlaceholderChange?.(currentPlaceholder)

    animate()

    return clearAnimation
  }, [currentIndex, isFocused, value, clearAnimation, onPlaceholderChange])

  // Cleanup on unmount
  useEffect(() => {
    return clearAnimation
  }, [clearAnimation])

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-transparent text-3xl md:text-4xl font-medium text-kogu-charcoal placeholder:text-kogu-muted focus:outline-none text-center"
        placeholder=""
      />
      {!value && !isFocused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-3xl md:text-4xl font-medium text-kogu-muted">
            {placeholderText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-[2px] h-[1em] bg-kogu-muted ml-0.5 align-middle"
            />
          </span>
        </div>
      )}
    </div>
  )
}
