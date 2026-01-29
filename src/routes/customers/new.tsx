import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useCreateCustomer, ApiRequestError } from '@/api'
import { useFeatureFlag, FeatureFlags } from '@/features/flags'
import { Button, Card, Input } from '@/components'
import type { CreateCustomerRequest } from '@/types'

export const Route = createFileRoute('/customers/new')({
  component: NewCustomer,
})

function NewCustomer() {
  const navigate = useNavigate()
  const createCustomer = useCreateCustomer()
  const newForm = useFeatureFlag(FeatureFlags.NEW_CUSTOMER_FORM)

  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    phone: '',
    company: '',
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CreateCustomerRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user types
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

    // Basic client-side validation
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      const customer = await createCustomer.mutateAsync(formData)
      navigate({ to: '/customers/$id', params: { id: String(customer.id) } })
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
    <div className="new-customer-page">
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-breadcrumb">
            <Link to="/customers">Customers</Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h1>Add New Customer</h1>
        </div>
      </header>

      <Card className="form-card">
        <form onSubmit={handleSubmit}>
          {newForm && (
            <div className="form-notice">
              ✨ You're using the new customer form (feature flag enabled)
            </div>
          )}

          <div className="form-grid">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={fieldErrors.name}
              required
              autoFocus
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
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
          </div>

          {createCustomer.error && (
            <div className="form-error-banner">
              {createCustomer.error.message}
            </div>
          )}

          <div className="form-actions">
            <Link to="/customers">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={createCustomer.isPending}>
              Create Customer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
