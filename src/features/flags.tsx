import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { FlagProvider, useFlag, useVariant, useFlagsStatus, useUnleashClient } from '@unleash/proxy-client-react'
import type { IConfig } from 'unleash-proxy-client'

// ============================================================================
// Feature Flag Names - Define all flags here for type safety
// ============================================================================

export const FeatureFlags = {
  // Migration flags - which pages are migrated to React
  CUSTOMERS_PAGE_MIGRATED: 'customers-page-migrated',
  ORDERS_PAGE_MIGRATED: 'orders-page-migrated',
  DASHBOARD_MIGRATED: 'dashboard-migrated',
  REPORTS_MIGRATED: 'reports-migrated',

  // Feature flags - new features being rolled out
  NEW_CUSTOMER_FORM: 'new-customer-form',
  ADVANCED_SEARCH: 'advanced-search',
  DARK_MODE: 'dark-mode',
  BULK_OPERATIONS: 'bulk-operations',
} as const

export type FeatureFlagName = (typeof FeatureFlags)[keyof typeof FeatureFlags]

// ============================================================================
// Local Development Flags (when Unleash is not configured)
// ============================================================================

const LOCAL_DEV_FLAGS: Record<string, boolean> = {
  [FeatureFlags.CUSTOMERS_PAGE_MIGRATED]: true,
  [FeatureFlags.ORDERS_PAGE_MIGRATED]: false,
  [FeatureFlags.DASHBOARD_MIGRATED]: true,
  [FeatureFlags.REPORTS_MIGRATED]: false,
  [FeatureFlags.NEW_CUSTOMER_FORM]: true,
  [FeatureFlags.ADVANCED_SEARCH]: true,
  [FeatureFlags.DARK_MODE]: false,
  [FeatureFlags.BULK_OPERATIONS]: false,
}

// ============================================================================
// Local Feature Flag Context (for development without Unleash)
// ============================================================================

interface LocalFlagContextValue {
  flags: Record<string, boolean>
  setFlag: (name: string, value: boolean) => void
  isReady: boolean
}

const LocalFlagContext = createContext<LocalFlagContextValue | null>(null)

function LocalFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // Try to load from localStorage for persistence during dev
    const saved = localStorage.getItem('dev-feature-flags')
    if (saved) {
      try {
        return { ...LOCAL_DEV_FLAGS, ...JSON.parse(saved) }
      } catch {
        return LOCAL_DEV_FLAGS
      }
    }
    return LOCAL_DEV_FLAGS
  })

  const setFlag = useCallback((name: string, value: boolean) => {
    setFlags((prev) => {
      const next = { ...prev, [name]: value }
      localStorage.setItem('dev-feature-flags', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <LocalFlagContext.Provider value={{ flags, setFlag, isReady: true }}>
      {children}
    </LocalFlagContext.Provider>
  )
}

function useLocalFlag(name: string): boolean {
  const context = useContext(LocalFlagContext)
  if (!context) {
    throw new Error('useLocalFlag must be used within LocalFlagProvider')
  }
  return context.flags[name] ?? false
}

function useLocalFlagsStatus() {
  const context = useContext(LocalFlagContext)
  return {
    flagsReady: context?.isReady ?? false,
    flagsError: null,
  }
}

// ============================================================================
// Unified Feature Flag Provider
// ============================================================================

const unleashConfig: IConfig | null =
  import.meta.env.VITE_UNLEASH_URL && import.meta.env.VITE_UNLEASH_CLIENT_KEY
    ? {
        url: import.meta.env.VITE_UNLEASH_URL,
        clientKey: import.meta.env.VITE_UNLEASH_CLIENT_KEY,
        appName: import.meta.env.VITE_UNLEASH_APP_NAME || 'mvc-migration-shell',
        refreshInterval: 15,
      }
    : null

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  // Use Unleash if configured, otherwise use local flags
  if (unleashConfig) {
    return <FlagProvider config={unleashConfig}>{children}</FlagProvider>
  }

  return <LocalFlagProvider>{children}</LocalFlagProvider>
}

// ============================================================================
// Unified Hooks
// ============================================================================

export function useFeatureFlag(name: FeatureFlagName): boolean {
  // Check if we're using Unleash or local
  const localContext = useContext(LocalFlagContext)

  if (localContext) {
    return useLocalFlag(name)
  }

  // Using Unleash
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFlag(name)
}

export function useFeatureFlagsStatus() {
  const localContext = useContext(LocalFlagContext)

  if (localContext) {
    return useLocalFlagsStatus()
  }

  // Using Unleash
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFlagsStatus()
}

export function useFeatureVariant(name: FeatureFlagName) {
  const localContext = useContext(LocalFlagContext)

  if (localContext) {
    // Local dev doesn't support variants, return a default
    return {
      enabled: localContext.flags[name] ?? false,
      name: 'default',
      payload: undefined,
    }
  }

  // Using Unleash
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useVariant(name)
}

// ============================================================================
// Migration Route Helper
// ============================================================================

// Maps route paths to their migration feature flags
const ROUTE_MIGRATION_FLAGS: Record<string, FeatureFlagName> = {
  '/customers': FeatureFlags.CUSTOMERS_PAGE_MIGRATED,
  '/orders': FeatureFlags.ORDERS_PAGE_MIGRATED,
  '/dashboard': FeatureFlags.DASHBOARD_MIGRATED,
  '/reports': FeatureFlags.REPORTS_MIGRATED,
}

export function useIsRouteMigrated(path: string): boolean {
  const flagName = ROUTE_MIGRATION_FLAGS[path]
  const localContext = useContext(LocalFlagContext)

  // If no flag defined for this route, assume it needs legacy
  if (!flagName) return false

  if (localContext) {
    return localContext.flags[flagName] ?? false
  }

  // Using Unleash
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useFlag(flagName)
}

export function getMigratedRoutes(): string[] {
  return Object.entries(ROUTE_MIGRATION_FLAGS)
    .filter(([_, flagName]) => LOCAL_DEV_FLAGS[flagName])
    .map(([path]) => path)
}

// ============================================================================
// Dev Tools Component (only shown in development)
// ============================================================================

export function FeatureFlagDevTools() {
  const localContext = useContext(LocalFlagContext)
  const [isOpen, setIsOpen] = useState(false)

  // Only show in development and when using local flags
  if (import.meta.env.PROD || !localContext) {
    return null
  }

  const { flags, setFlag } = localContext

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        🚩 Flags
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 8,
            padding: 16,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            minWidth: 280,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
            Feature Flags (Dev)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(flags).map(([name, enabled]) => (
              <label
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setFlag(name, e.target.checked)}
                />
                <span style={{ fontFamily: 'monospace' }}>{name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Re-export Unleash hooks for advanced usage
export { useUnleashClient }
