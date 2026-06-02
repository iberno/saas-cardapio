import type { HTMLAttributes } from 'react'

type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

const colorClass: Record<BadgeColor, string> = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  info: 'badge badge-info',
  neutral: 'badge badge-neutral',
}

export function Badge({ color = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span className={`${colorClass[color]} ${className}`} {...props}>
      {children}
    </span>
  )
}
