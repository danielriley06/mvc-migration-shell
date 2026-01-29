// ============================================================================
// Common API Types
// ============================================================================

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code?: string
  message: string
  field?: string
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: ApiError[]
}

// ============================================================================
// Customer Types (Example Domain)
// ============================================================================

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  company?: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerRequest {
  name: string
  email: string
  phone?: string
  company?: string
}

export interface UpdateCustomerRequest {
  name?: string
  email?: string
  phone?: string
  company?: string
  status?: Customer['status']
}

export interface CustomerSearchParams {
  search?: string
  status?: Customer['status']
  page?: number
  pageSize?: number
}

// ============================================================================
// Order Types (Example Domain)
// ============================================================================

export interface Order {
  id: number
  customerId: number
  customerName: string
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface OrderSearchParams {
  customerId?: number
  status?: Order['status']
  page?: number
  pageSize?: number
}

// ============================================================================
// Auth Types
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
