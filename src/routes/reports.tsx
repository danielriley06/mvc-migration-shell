import { createFileRoute } from '@tanstack/react-router'
import { LegacyFrame } from '@/components'

// Reports is not yet migrated - show legacy frame
export const Route = createFileRoute('/reports')({
  component: ReportsLegacy,
})

function ReportsLegacy() {
  return (
    <div className="legacy-page">
      <div className="legacy-notice">
        <span className="notice-icon">🔄</span>
        <span className="notice-text">
          Reports is currently running in the legacy MVC application
        </span>
      </div>
      <LegacyFrame path="reports" />
    </div>
  )
}
