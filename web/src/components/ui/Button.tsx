import { type ButtonHTMLAttributes } from 'react'
import { type LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'accent' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  loading?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: 'btn btn-primary',
  accent: 'btn bg-accent text-white border-accent hover:bg-accent/90',
  ghost: 'btn btn-ghost',
  outline: 'btn btn-outline',
}

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${variantClass[variant]} ${sizeClass[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  )
}
