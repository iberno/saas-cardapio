import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export function Card({ glass, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-base-300 p-6 ${
        glass ? 'bg-base-100/80 backdrop-blur-sm' : 'bg-base-100'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
