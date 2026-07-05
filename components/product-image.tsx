'use client'

import { useState } from 'react'

// <img> wrapper with an automatic fallback so a broken/missing URL never
// shows the browser's broken-image icon — guarantees "images without error".
const FALLBACK = 'https://placehold.co/600x600/dcfce7/16a34a?text=KisanMart'

export default function ProductImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const url = failed || !src ? FALLBACK : src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
