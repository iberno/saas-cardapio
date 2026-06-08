import { useState } from 'react'
import { Star } from 'lucide-react'
import { createReview, getProductReviews, type ReviewStats } from '../services/reviews.service'

interface ProductRatingProps {
  slug: string
  productId: string
  productName: string
  customerPhone?: string
  orderId?: string
  onRated?: () => void
}

export function ProductRating({ slug, productId, productName, customerPhone, orderId, onRated }: ProductRatingProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const loadStats = async () => {
    try {
      const data = await getProductReviews(slug, productId)
      setStats(data.stats)
    } catch {}
  }

  const handleRate = async (value: number) => {
    if (!customerPhone) return
    setRating(value)
    setSubmitting(true)
    try {
      await createReview({ productId, rating: value, orderId })
      setSubmitted(true)
      loadStats()
      onRated?.()
    } catch {
      setShowForm(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      await createReview({ productId, rating, orderId })
      setSubmitted(true)
      loadStats()
      onRated?.()
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-xs opacity-60">
        {[1, 2, 3, 4, 5].map((v) => (
          <Star key={v} size={12} className="fill-yellow-400 text-yellow-400" />
        ))}
        <span className="ml-1">Avaliado</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {customerPhone ? (
        <div className="rating rating-xs gap-0.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <input
              key={v}
              type="radio"
              name={`rating-${productId}`}
              className="mask mask-star-2 bg-yellow-400"
              disabled={submitting}
              onChange={() => handleRate(v)}
            />
          ))}
        </div>
      ) : (
        <div className="rating rating-xs gap-0.5 opacity-30 pointer-events-none">
          {[1, 2, 3, 4, 5].map((v) => (
            <input
              key={v}
              type="radio"
              className="mask mask-star-2 bg-yellow-400"
              readOnly
            />
          ))}
        </div>
      )}
      {stats && stats.total > 0 && (
        <div className="flex items-center gap-1 text-xs opacity-50">
          <Star size={10} className="fill-yellow-400 text-yellow-400" />
          <span>{stats.average.toFixed(1)} ({stats.total})</span>
        </div>
      )}
    </div>
  )
}

export function ProductReviewStats({ slug, productId }: { slug: string; productId: string }) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    getProductReviews(slug, productId).then((d) => { setStats(d.stats); setLoaded(true) }).catch(() => setLoaded(true))
  }

  if (!stats || stats.total === 0) return null

  return (
    <div className="flex items-center gap-1 text-xs opacity-60">
      <Star size={12} className="fill-yellow-400 text-yellow-400" />
      <span>{stats.average.toFixed(1)}</span>
      <span className="opacity-40">({stats.total})</span>
    </div>
  )
}
