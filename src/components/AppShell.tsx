import { Link, useRouterState } from '@tanstack/react-router'
import { type ReactNode } from 'react'
import { useFeatureFlag, FeatureFlags } from '@/features/flags'
import clsx from 'clsx'

interface AppShellProps {
  children: ReactNode
}

interface NavItem {
  to: string
  label: string
  icon: string
  featureFlag?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/orders', label: 'Orders', icon: '📦' },
  { to: '/reports', label: 'Reports', icon: '📈' },
]

export function AppShell({ children }: AppShellProps) {
  const darkMode = useFeatureFlag(FeatureFlags.DARK_MODE)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <div className={clsx('app-shell', { 'dark-mode': darkMode })}>
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">🔄</span>
          <span className="brand-text">Migration Shell</span>
        </div>

        <nav className="header-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx('nav-link', { active: isActive })}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="header-actions">
          <button className="user-menu" aria-label="User menu">
            <span className="user-avatar">👤</span>
          </button>
        </div>
      </header>

      <main className="app-content">{children}</main>
    </div>
  )
}
