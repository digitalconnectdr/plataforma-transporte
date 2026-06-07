import { forwardRef } from 'react'
import { cn } from '../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  theme?: 'dark' | 'light'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, theme = 'dark', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`
    const isDark = theme === 'dark'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-label-sm font-semibold uppercase tracking-[0.05em]',
              isDark ? 'text-sl-on-surface-variant' : 'text-le-on-surface-variant'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sl-on-surface-variant dark:text-sl-on-surface-variant">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded transition-colors duration-150',
              'px-4 py-3 text-body-md font-serif',
              'focus:outline-none focus:ring-0',
              isDark
                ? 'bg-sl-surface-low border border-sl-outline-variant text-sl-on-surface placeholder:text-sl-on-surface-variant focus:border-gold'
                : 'bg-le-surface-low border border-le-outline-variant text-le-on-surface placeholder:text-le-on-surface-variant focus:border-gold-dark',
              error && (isDark ? 'border-error' : 'border-error'),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sl-on-surface-variant">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-label-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-label-sm text-sl-on-surface-variant">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
