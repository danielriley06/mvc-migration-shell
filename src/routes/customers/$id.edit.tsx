import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { customerQueries, useUpdateCustomer, ApiRequestError } from '@/api'
import { Button, Card, Input } from '@/components'
import type { UpdateCustomerRequest } from '@/types'

export const Route = createFileRoute('/customers/$id/edit')({
  parseParams: (params) => ({
    id: Number(params.id),
  }),

  stringifyParams: (params) => ({
    id: String(params.id),
  }),

  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(customerQueries.detail(params.id)),

  component: EditCustomer,
})

function EditCustomer() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: customer } = useSuspenseQuery(customerQueries.detail(id))
  const updateCustomer = useUpdateCustomer(id)

  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    name: customer.name,
    email: customer.email,
    phone: customer.phone || '',
    company: customer.company || '',
    status: customer.status,
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Sync form when customer data changes (e.g., from cache update)
  useEffect(() => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      status: customer.status,
    })
  }, [customer])

  const handleChange = (field: keyof UpdateCustomerRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const errors: Record<string, string> = {}
    if (!formData.name?.trim()) errors.name = 'Name is required'
    if (!formData.email?.trim()) errors.email = 'Email is required'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await updateCustomer.mutateAsync(formData)
      navigate({ to: '/customers/$id', params: { id: String(id) } })
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(error.getFieldErrors()).map(([k, v]) => [k, v[0]])
          )
        )
      }
    }
  }

  return (
    <div className="edit-customer-page">
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-breadcrumb">
            <Link to="/customers">Customers</Link>
            <span>/</span>
            <Link to="/customers/$id" params={{ id: String(id) }}>
              {customer.name}
            </Link>
            <span>/</span>
            <span>Edit</span>
          </div>
          <h1>Edit Customer</h1>
        </div>
      </header>

      <Card className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              error={fieldErrors.name}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              error={fieldErrors.email}
              required
            />

            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={fieldErrors.phone}
            />

            <Input
              label="Company"
              name="company"
              value={formData.company || ''}
              onChange={(e) => handleChange('company', e.target.value)}
              error={fieldErrors.company}
            />

            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {updateCustomer.error && (
            <div className="form-error-banner">
              {updateCustomer.error.message}
            </div>
          )}

          <div className="form-actions">
            <Link to="/customers/$id" params={{ id: String(id) }}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={updateCustomer.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
