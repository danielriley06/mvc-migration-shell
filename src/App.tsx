import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router, queryClient } from './router'
import { FeatureFlagProvider } from './features/flags'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider>
        <RouterProvider router={router} />
      </FeatureFlagProvider>
    </QueryClientProvider>
  )
}
