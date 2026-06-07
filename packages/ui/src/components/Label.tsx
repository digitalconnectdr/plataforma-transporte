import { cn } from '../utils/cn'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-label-sm font-semibold uppercase tracking-[0.05em]',
        'text-le-on-surface-variant dark:text-sl-on-surface-variant',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-error">*</span>}
    </label>
  )
}
