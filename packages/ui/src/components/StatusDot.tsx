import { cn } from '../utils/cn'

type DotStatus = 'active' | 'inactive' | 'warning' | 'error' | 'pending'

interface StatusDotProps {
  status: DotStatus
  label?: string
  className?: string
}

const statusClasses: Record<DotStatus, string> = {
  active: 'bg-success',
  inactive: 'bg-sl-outline',
  warning: 'bg-warning',
  error: 'bg-error',
  pending: 'bg-info',
}

const statusLabels: Record<DotStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  warning: 'Warning',
  error: 'Error',
  pending: 'Pending',
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn('inline-block h-2 w-2 rounded-full', statusClasses[status])}
        aria-hidden="true"
      />
      {(label !== undefined ? label : statusLabels[status]) && (
        <span className="text-label-sm text-sl-on-surface-variant">
          {label !== undefined ? label : statusLabels[status]}
        </span>
      )}
    </span>
  )
}
