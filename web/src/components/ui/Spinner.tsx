interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return <span className={`loading loading-spinner ${sizeClass[size]}`} />
}
