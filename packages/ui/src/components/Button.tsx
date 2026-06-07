import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

const buttonVariants = cva(
  // Base
  'inline-flex items-center justify-center gap-2 font-sans font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: [
          'rounded-full bg-gold text-sl-bg uppercase tracking-wider',
          'hover:brightness-110 hover:shadow-gold-glow',
          'bg-gradient-to-b from-[#f0cc84] to-gold',
        ],
        secondary: [
          'rounded-full border border-gold/40 text-gold uppercase tracking-wider',
          'hover:border-gold hover:bg-gold/10',
        ],
        ghost: [
          'rounded text-le-on-surface-variant dark:text-sl-on-surface-variant',
          'hover:bg-le-surface dark:hover:bg-sl-surface',
        ],
        danger: [
          'rounded-full bg-error text-white uppercase tracking-wider',
          'hover:brightness-110',
        ],
        outline: [
          'rounded border border-le-hairline dark:border-sl-outline-variant',
          'text-le-on-surface dark:text-sl-on-surface',
          'hover:bg-le-surface dark:hover:bg-sl-surface',
        ],
        link: 'rounded text-gold underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-4 text-label-sm',
        md: 'h-10 px-6 text-label-md',
        lg: 'h-12 px-8 text-label-md',
        xl: 'h-14 px-10 text-body-md',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon ? (
          <span className="shrink-0">{rightIcon}</span>
        ) : null}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
