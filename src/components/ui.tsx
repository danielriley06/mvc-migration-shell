import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

// ============================================================================
// Button
// ============================================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="btn-spinner" />}
      {children}
    </button>
  )
}

// ============================================================================
// Input
// ============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className={clsx('form-field', { 'has-error': error }, className)}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className="form-input" {...props} />
        {error && <span className="form-error">{error}</span>}
        {hint && !error && <span className="form-hint">{hint}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ============================================================================
// Card
// ============================================================================

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export function Card({ title, children, className, actions }: CardProps) {
  return (
    <div className={clsx('card', className)}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}

// ============================================================================
// Loading States
// ============================================================================

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div className={clsx('loading-spinner', `spinner-${size}`)} />
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <LoadingSpinner size="lg" />
      <span>Loading...</span>
    </div>
  )
}

export function SkeletonLine({ width = '100%' }: { width?: string }) {
  return <div className="skeleton-line" style={{ width }} />
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <SkeletonLine width="60%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="80%" />
    </div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

// ============================================================================
// Error State
// ============================================================================

interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div className="error-state">
      <span className="error-icon">⚠️</span>
      <h3 className="error-title">{title}</h3>
      <p className="error-message">{message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Pagination
// ============================================================================

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="pagination">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ← Prev
      </Button>

      <div className="pagination-pages">
        {pages[0] > 1 && (
          <>
            <button className="pagination-page" onClick={() => onPageChange(1)}>
              1
            </button>
            {pages[0] > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={clsx('pagination-page', { active: p === page })}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              className="pagination-page"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next →
      </Button>
    </div>
  )
}

// ============================================================================
// Status Badge
// ============================================================================

interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
}

const STATUS_VARIANTS: Record<string, StatusBadgeProps['variant']> = {
  active: 'success',
  completed: 'success',
  delivered: 'success',
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  inactive: 'default',
  cancelled: 'error',
  error: 'error',
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || STATUS_VARIANTS[status.toLowerCase()] || 'default'

  return (
    <span className={clsx('status-badge', `badge-${resolvedVariant}`)}>
      {status}
    </span>
  )
}
