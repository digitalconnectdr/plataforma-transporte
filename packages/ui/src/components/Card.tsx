import { cn } from '../utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: 'dark' | 'light'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  className,
  theme = 'dark',
  hover = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const isDark = theme === 'dark'

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'rounded-md transition-all duration-200',
        isDark
          ? 'border border-sl-outline-variant bg-sl-surface-low'
          : 'border border-le-hairline bg-le-surface-lowest',
        hover && isDark && 'hover:border-gold/30 hover:shadow-gold-glow-sm cursor-pointer',
        hover && !isDark && 'hover:border-le-outline cursor-pointer',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-start justify-between', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-serif text-headline-sm text-sl-on-surface dark:text-sl-on-surface', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  )
}
