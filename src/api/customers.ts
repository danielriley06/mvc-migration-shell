import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, buildQueryString } from './client'
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerSearchParams,
  PagedResult,
} from '@/types'

// ============================================================================
// Query Keys Factory
// ============================================================================

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerSearchParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
}

// ============================================================================
// Query Options (for loaders and useQuery/useSuspenseQuery)
// ============================================================================

export const customerQueries = {
  list: (params: CustomerSearchParams = {}) =>
    queryOptions({
      queryKey: customerKeys.list(params),
      queryFn: () =>
        api.get<PagedResult<Customer>>(`/customers${buildQueryString(params)}`),
      staleTime: 30 * 1000, // 30 seconds
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: customerKeys.detail(id),
      queryFn: () => api.get<Customer>(`/customers/${id}`),
      staleTime: 60 * 1000, // 1 minute
    }),
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      api.post<Customer>('/customers', data),

    onSuccess: () => {
      // Invalidate all customer lists to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useUpdateCustomer(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCustomerRequest) =>
      api.put<Customer>(`/customers/${id}`, data),

    onSuccess: (updatedCustomer) => {
      // Update the cache directly for immediate UI update
      queryClient.setQueryData(customerKeys.detail(id), updatedCustomer)
      // Invalidate lists since the customer data changed
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/customers/${id}`),

    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
