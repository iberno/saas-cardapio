import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <fieldset className="fieldset">
        {label && <legend className="fieldset-legend">{label}</legend>}
        <input
          ref={ref}
          id={inputId}
          className={`input w-full ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </fieldset>
    )
  },
)

Input.displayName = 'Input'
