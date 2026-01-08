'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { searchIcons, Icon3D } from '@/lib/3dicons'

interface IconPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (slug: string) => void
  selectedSlug?: string | null
}

function IconPickerImage({ icon }: { icon: Icon3D }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-kogu-pending rounded">
        <svg
          className="w-6 h-6 text-kogu-muted"
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

  return (
    <Image
      src={icon.cdnUrl}
      alt={icon.name}
      width={64}
      height={64}
      className="w-full h-full object-contain mix-blend-multiply"
      unoptimized
      onError={() => setHasError(true)}
    />
  )
}

export function IconPicker({ isOpen, onClose, onSelect, selectedSlug }: IconPickerProps) {
  const [search, setSearch] = useState('')

  const filteredIcons = searchIcons(search)

  const handleSelect = (icon: Icon3D) => {
    onSelect(icon.slug)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-xl overflow-hidden max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-kogu-warm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-kogu-charcoal">Choose an icon</h2>
                <button
                  onClick={onClose}
                  className="text-kogu-muted hover:text-kogu-charcoal transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-kogu-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search icons..."
                  className="w-full h-10 pl-10 pr-4 text-sm border border-kogu-pending rounded-lg focus:outline-none focus:ring-2 focus:ring-kogu-forest focus:border-transparent"
                />
              </div>
            </div>

            {/* Icon Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {filteredIcons.map((icon) => (
                  <motion.button
                    key={icon.slug}
                    onClick={() => handleSelect(icon)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-square rounded-xl p-3 transition-colors ${
                      selectedSlug === icon.slug
                        ? 'bg-kogu-forest/10 ring-2 ring-kogu-forest'
                        : 'bg-kogu-warm hover:bg-kogu-pending'
                    }`}
                  >
                    <IconPickerImage icon={icon} />
                    {selectedSlug === icon.slug && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-kogu-forest rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-kogu-muted">
                  No icons found for &ldquo;{search}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-kogu-warm bg-kogu-warm/30">
              <p className="text-xs text-kogu-muted text-center">
                Icons by <a href="https://3dicons.co" target="_blank" rel="noopener noreferrer" className="text-kogu-forest hover:underline">3dicons.co</a> (CC0)
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
