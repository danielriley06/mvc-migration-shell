import { createFileRoute } from '@tanstack/react-router'
import { useFeatureFlag, FeatureFlags } from '@/features/flags'
import { Card } from '@/components'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const advancedSearch = useFeatureFlag(FeatureFlags.ADVANCED_SEARCH)

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome to the migration shell</p>
      </header>

      <div className="dashboard-grid">
        <Card title="Customers" className="stat-card">
          <div className="stat-value">1,234</div>
          <div className="stat-label">Total customers</div>
        </Card>

        <Card title="Orders" className="stat-card">
          <div className="stat-value">567</div>
          <div className="stat-label">This month</div>
        </Card>

        <Card title="Revenue" className="stat-card">
          <div className="stat-value">$89,432</div>
          <div className="stat-label">This month</div>
        </Card>

        <Card title="Pending" className="stat-card">
          <div className="stat-value">23</div>
          <div className="stat-label">Awaiting action</div>
        </Card>
      </div>

      <div className="dashboard-sections">
        <Card title="Migration Progress">
          <div className="migration-progress">
            <MigrationItem
              name="Dashboard"
              status="migrated"
              description="React-based dashboard"
            />
            <MigrationItem
              name="Customers"
              status="migrated"
              description="Full CRUD with React"
            />
            <MigrationItem
              name="Orders"
              status="legacy"
              description="Still using MVC"
            />
            <MigrationItem
              name="Reports"
              status="legacy"
              description="Still using MVC"
            />
          </div>
        </Card>

        {advancedSearch && (
          <Card title="Quick Search">
            <input
              type="search"
              placeholder="Search across all modules..."
              className="form-input"
              style={{ width: '100%' }}
            />
            <p className="form-hint" style={{ marginTop: 8 }}>
              Advanced search is enabled via feature flag
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

interface MigrationItemProps {
  name: string
  status: 'migrated' | 'legacy' | 'in-progress'
  description: string
}

function MigrationItem({ name, status, description }: MigrationItemProps) {
  const statusIcon = {
    migrated: '✅',
    legacy: '🔄',
    'in-progress': '🚧',
  }[status]

  const statusText = {
    migrated: 'React',
    legacy: 'Legacy MVC',
    'in-progress': 'In Progress',
  }[status]

  return (
    <div className="migration-item">
      <span className="migration-icon">{statusIcon}</span>
      <div className="migration-info">
        <span className="migration-name">{name}</span>
        <span className="migration-description">{description}</span>
      </div>
      <span className={`migration-status status-${status}`}>{statusText}</span>
    </div>
  )
}
