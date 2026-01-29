import type { ProblemDetails, ApiError } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ============================================================================
// Custom Error Class
// ============================================================================

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public errors: ApiError[],
    public problemDetails?: ProblemDetails
  ) {
    super(errors[0]?.message || 'An unexpected error occurred')
    this.name = 'ApiRequestError'
  }

  get isValidationError(): boolean {
    return this.status === 400
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isServerError(): boolean {
    return this.status >= 500
  }

  getFieldErrors(): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {}
    for (const error of this.errors) {
      if (error.field) {
        if (!fieldErrors[error.field]) {
          fieldErrors[error.field] = []
        }
        fieldErrors[error.field].push(error.message)
      }
    }
    return fieldErrors
  }
}

// ============================================================================
// Request Helper
// ============================================================================

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for auth
  })

  // Handle non-OK responses
  if (!response.ok) {
    let problemDetails: ProblemDetails | undefined
    let errors: ApiError[] = []

    try {
      const body = await response.json()
      if (body.errors) {
        problemDetails = body
        errors = body.errors
      } else if (body.message) {
        errors = [{ message: body.message }]
      }
    } catch {
      errors = [{ message: response.statusText || 'Request failed' }]
    }

    throw new ApiRequestError(response.status, errors, problemDetails)
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  return response.json()
}

// ============================================================================
// HTTP Methods
// ============================================================================

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

// ============================================================================
// Query String Builder
// ============================================================================

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
