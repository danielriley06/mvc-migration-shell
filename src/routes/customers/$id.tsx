import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { customerQueries, orderQueries, useDeleteCustomer } from '@/api'
import { Button, Card, StatusBadge, ErrorState } from '@/components'

export const Route = createFileRoute('/customers/$id')({
  // Parse the ID param
  parseParams: (params) => ({
    id: Number(params.id),
  }),

  // Stringify back to string
  stringifyParams: (params) => ({
    id: String(params.id),
  }),

  // Prefetch customer and their orders
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(customerQueries.detail(params.id)),
      queryClient.ensureQueryData(orderQueries.byCustomer(params.id)),
    ])
  },

  component: CustomerDetail,
})

function CustomerDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const deleteCustomer = useDeleteCustomer()

  const { data: customer } = useSuspenseQuery(customerQueries.detail(id))
  const { data: orders } = useSuspenseQuery(orderQueries.byCustomer(id))

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      await deleteCustomer.mutateAsync(id)
      navigate({ to: '/customers' })
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  return (
    <div className="customer-detail-page">
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-breadcrumb">
            <Link to="/customers">Customers</Link>
            <span>/</span>
            <span>{customer.name}</span>
          </div>
          <h1>{customer.name}</h1>
        </div>
        <div className="page-header-actions">
          <Link to="/customers/$id/edit" params={{ id: String(id) }}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteCustomer.isPending}
          >
            Delete
          </Button>
        </div>
      </header>

      <div className="detail-grid">
        <Card title="Customer Information">
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </dd>
            </div>
            <div className="detail-item">
              <dt>Phone</dt>
              <dd>{customer.phone || '—'}</dd>
            </div>
            <div className="detail-item">
              <dt>Company</dt>
              <dd>{customer.company || '—'}</dd>
            </div>
            <div className="detail-item">
              <dt>Status</dt>
              <dd>
                <StatusBadge status={customer.status} />
              </dd>
            </div>
            <div className="detail-item">
              <dt>Created</dt>
              <dd>{new Date(customer.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="detail-item">
              <dt>Last Updated</dt>
              <dd>{new Date(customer.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </Card>

        <Card
          title="Recent Orders"
          actions={
            <Link
              to="/orders"
              search={{ customerId: id }}
              className="card-link"
            >
              View All
            </Link>
          }
        >
          {orders.items.length === 0 ? (
            <p className="text-muted">No orders yet</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to="/orders/$id" params={{ id: String(order.id) }}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
