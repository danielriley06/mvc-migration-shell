import { createFileRoute } from '@tanstack/react-router'
import { LegacyFrame } from '@/components'

// This route catches all paths under /legacy/* and renders them in the iframe
export const Route = createFileRoute('/legacy/$')({
  component: LegacyPassthrough,
})

function LegacyPassthrough() {
  // The _splat param captures everything after /legacy/
  const params = Route.useParams()
  const splatPath = (params as { _splat?: string })._splat || ''

  return (
    <div className="legacy-page">
      <div className="legacy-notice">
        <span className="notice-icon">🔄</span>
        <span className="notice-text">
          This page is running in the legacy MVC application
        </span>
      </div>
      <LegacyFrame path={splatPath} />
    </div>
  )
}
