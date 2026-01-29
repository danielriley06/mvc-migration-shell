import { queryOptions } from '@tanstack/react-query'
import { api, buildQueryString } from './client'
import type { Order, OrderSearchParams, PagedResult } from '@/types'

// ============================================================================
// Query Keys Factory
// ============================================================================

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrderSearchParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
  byCustomer: (customerId: number) => [...orderKeys.all, 'customer', customerId] as const,
}

// ============================================================================
// Query Options
// ============================================================================

export const orderQueries = {
  list: (params: OrderSearchParams = {}) =>
    queryOptions({
      queryKey: orderKeys.list(params),
      queryFn: () =>
        api.get<PagedResult<Order>>(`/orders${buildQueryString(params)}`),
      staleTime: 30 * 1000,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: orderKeys.detail(id),
      queryFn: () => api.get<Order>(`/orders/${id}`),
      staleTime: 60 * 1000,
    }),

  byCustomer: (customerId: number) =>
    queryOptions({
      queryKey: orderKeys.byCustomer(customerId),
      queryFn: () =>
        api.get<PagedResult<Order>>(`/orders${buildQueryString({ customerId })}`),
      staleTime: 30 * 1000,
    }),
}
