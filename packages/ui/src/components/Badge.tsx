import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center font-sans font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        gold: 'rounded-full px-3 py-1 border border-gold/40 bg-gold/10 text-gold text-label-caps',
        class: 'rounded-sm px-2 py-0.5 bg-gold/20 text-gold text-[10px]',
        status: 'rounded-full px-2.5 py-0.5 text-label-sm',
        outline: 'rounded-full px-3 py-1 border text-label-caps',
      },
      status: {
        active: 'bg-success/15 text-success border-success/20',
        inactive: 'bg-sl-outline/15 text-sl-on-surface-variant border-sl-outline/20',
        warning: 'bg-warning/15 text-warning border-warning/20',
        error: 'bg-error/15 text-error border-error/20',
        pending: 'bg-info/15 text-info border-info/20',
      },
    },
    defaultVariants: {
      variant: 'gold',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  label?: string
}

export function Badge({ className, variant, status, label, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, status }), className)} {...props}>
      {label || children}
    </span>
  )
}
