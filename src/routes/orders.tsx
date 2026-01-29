import { createFileRoute, redirect } from '@tanstack/react-router'
import { LegacyFrame } from '@/components'

// Orders is not yet migrated - show legacy frame
export const Route = createFileRoute('/orders')({
  component: OrdersLegacy,
})

function OrdersLegacy() {
  return (
    <div className="legacy-page">
      <div className="legacy-notice">
        <span className="notice-icon">🔄</span>
        <span className="notice-text">
          Orders is currently running in the legacy MVC application. Migration in progress.
        </span>
      </div>
      <LegacyFrame path="orders" />
    </div>
  )
}
