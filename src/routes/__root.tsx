import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components'
import { FeatureFlagDevTools } from '@/features/flags'

// Define the router context type
export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>

      {/* Dev tools - only in development */}
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
          <FeatureFlagDevTools />
        </>
      )}
    </>
  )
}
