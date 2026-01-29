import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { customerQueries } from '@/api'
import { useFeatureFlag, FeatureFlags } from '@/features/flags'
import {
  Button,
  Card,
  Input,
  Pagination,
  StatusBadge,
  EmptyState,
} from '@/components'
import type { CustomerSearchParams } from '@/types'

// Validate and parse search params
const validateSearch = (search: Record<string, unknown>): CustomerSearchParams => ({
  search: (search.search as string) || undefined,
  status: search.status as CustomerSearchParams['status'],
  page: Number(search.page) || 1,
  pageSize: Number(search.pageSize) || 10,
})

export const Route = createFileRoute('/customers/')({
  validateSearch,

  // Dependencies for the loader - reruns when these change
  loaderDeps: ({ search }) => ({ search }),

  // Prefetch data before rendering
  loader: ({ context: { queryClient }, deps: { search } }) =>
    queryClient.ensureQueryData(customerQueries.list(search)),

  component: CustomersList,
})

function CustomersList() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const advancedSearch = useFeatureFlag(FeatureFlags.ADVANCED_SEARCH)
  const bulkOperations = useFeatureFlag(FeatureFlags.BULK_OPERATIONS)

  // Data is already loaded by the loader, this is instant
  const { data } = useSuspenseQuery(customerQueries.list(search))

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: value || undefined, page: 1 }),
    })
  }

  const handleStatusChange = (status: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        status: (status || undefined) as CustomerSearchParams['status'],
        page: 1,
      }),
    })
  }

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page }),
    })
  }

  return (
    <div className="customers-page">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Customers</h1>
          <p className="page-subtitle">
            Manage your customer database ({data.totalCount} total)
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/customers/new">
            <Button>+ Add Customer</Button>
          </Link>
        </div>
      </header>

      <Card>
        <div className="list-filters">
          <Input
            placeholder="Search customers..."
            value={search.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ maxWidth: 300 }}
          />

          {advancedSearch && (
            <>
              <select
                className="form-input"
                value={search.status || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ maxWidth: 150 }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </>
          )}

          {bulkOperations && (
            <Button variant="secondary" size="sm">
              Bulk Actions ▾
            </Button>
          )}
        </div>

        {data.items.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No customers found"
            description={
              search.search
                ? `No customers match "${search.search}"`
                : 'Get started by adding your first customer'
            }
            action={
              !search.search && (
                <Link to="/customers/new">
                  <Button>Add Customer</Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  {bulkOperations && (
                    <th style={{ width: 40 }}>
                      <input type="checkbox" />
                    </th>
                  )}
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((customer) => (
                  <tr key={customer.id}>
                    {bulkOperations && (
                      <td>
                        <input type="checkbox" />
                      </td>
                    )}
                    <td>
                      <Link
                        to="/customers/$id"
                        params={{ id: String(customer.id) }}
                        className="table-link"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.company || '—'}</td>
                    <td>
                      <StatusBadge status={customer.status} />
                    </td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link
                        to="/customers/$id/edit"
                        params={{ id: String(customer.id) }}
                      >
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </Card>
    </div>
  )
}
