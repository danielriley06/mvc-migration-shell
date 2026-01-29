# MVC Migration Shell

A React SPA built with TanStack Router and TanStack Query, designed to incrementally replace a legacy .NET MVC application using the strangler fig pattern.

## Features

- **Strangler Fig Pattern**: Gradually migrate pages from MVC to React
- **TanStack Router**: File-based routing with type-safe navigation
- **TanStack Query**: Server state management with caching and prefetching
- **Feature Flags**: Unleash integration for controlling migration rollout
- **Legacy Frame**: Seamlessly embed MVC pages via iframe
- **Type Safety**: Full TypeScript throughout

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

```
src/
├── api/                    # API client and query definitions
│   ├── client.ts          # Fetch wrapper with error handling
│   ├── customers.ts       # Customer queries and mutations
│   └── orders.ts          # Order queries
├── components/            # Reusable UI components
│   ├── AppShell.tsx       # Main layout with navigation
│   ├── LegacyFrame.tsx    # iframe wrapper for MVC pages
│   └── ui.tsx             # Button, Input, Card, etc.
├── features/              # Feature modules
│   └── flags.tsx          # Feature flag provider and hooks
├── routes/                # File-based routes (TanStack Router)
│   ├── __root.tsx         # Root layout with providers
│   ├── index.tsx          # Dashboard (migrated)
│   ├── customers/         # Customer routes (migrated)
│   │   ├── index.tsx      # Customer list
│   │   ├── $id.tsx        # Customer detail
│   │   ├── $id.edit.tsx   # Edit customer
│   │   └── new.tsx        # New customer
│   ├── orders.tsx         # Orders (legacy frame)
│   ├── reports.tsx        # Reports (legacy frame)
│   └── legacy.$.tsx       # Catch-all for legacy routes
├── styles/
│   └── index.css          # Global styles
├── types/
│   └── index.ts           # TypeScript type definitions
├── App.tsx                # App component with providers
├── main.tsx               # Entry point
└── router.ts              # Router configuration
```

## Migration Workflow

### 1. Feature Flag for New Routes

Before migrating a page, create a feature flag in Unleash (or add to `LOCAL_DEV_FLAGS` for development):

```typescript
// src/features/flags.tsx
export const FeatureFlags = {
  CUSTOMERS_PAGE_MIGRATED: 'customers-page-migrated',
  ORDERS_PAGE_MIGRATED: 'orders-page-migrated',  // Add new flag
  // ...
}
```

### 2. Create the React Route

```typescript
// src/routes/orders/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { orderQueries } from '@/api'

export const Route = createFileRoute('/orders/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(orderQueries.list({})),
  component: OrdersList,
})

function OrdersList() {
  const { data } = useSuspenseQuery(orderQueries.list({}))
  // Render orders...
}
```

### 3. Extract Business Logic to API

Both MVC and React should call the same API endpoints:

```csharp
// .NET API Controller
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    [HttpGet]
    public async Task<ActionResult<PagedList<Order>>> GetAll(
        [FromQuery] OrderSearchParams @params)
    {
        return Ok(await _orderService.SearchAsync(@params));
    }
}
```

### 4. Enable the Feature Flag

Toggle the flag in Unleash to roll out to users progressively.

## Feature Flags

### Development Mode

When Unleash is not configured (no `VITE_UNLEASH_URL`), the app uses local flags that can be toggled via the dev tools panel (bottom-left corner).

### Production Mode

Configure Unleash in `.env`:

```env
VITE_UNLEASH_URL=https://your-unleash-instance/api/frontend
VITE_UNLEASH_CLIENT_KEY=your-frontend-token
```

### Using Flags

```typescript
import { useFeatureFlag, FeatureFlags } from '@/features/flags'

function MyComponent() {
  const newFeature = useFeatureFlag(FeatureFlags.NEW_CUSTOMER_FORM)

  if (newFeature) {
    return <NewForm />
  }
  return <OldForm />
}
```

## Legacy MVC Integration

### Enable Communication

Add this to your MVC `_Layout.cshtml`:

```html
<script>
  const isInReactShell = window.parent !== window;
  
  if (isInReactShell) {
    // Notify React shell of navigation
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && link.href && link.origin === window.location.origin) {
        e.preventDefault();
        window.parent.postMessage({ 
          type: 'NAVIGATE', 
          path: link.pathname + link.search 
        }, '*');
      }
    });
    
    // Hide legacy chrome
    document.body.classList.add('in-shell');
  }
</script>

<style>
  .in-shell .mvc-header,
  .in-shell .mvc-sidebar { display: none !important; }
</style>
```

### Legacy URLs

Non-migrated pages are accessible via `/legacy/*`:
- `/legacy/reports` → Shows MVC reports page in iframe
- `/legacy/admin/settings` → Shows MVC admin settings

## API Integration

### Query Definitions

```typescript
// src/api/customers.ts
export const customerQueries = {
  list: (params: CustomerSearchParams) =>
    queryOptions({
      queryKey: ['customers', 'list', params],
      queryFn: () => api.get<PagedResult<Customer>>(`/customers${buildQueryString(params)}`),
      staleTime: 30 * 1000,
    }),

  detail: (id: number) =>
    queryOptions({
      queryKey: ['customers', 'detail', id],
      queryFn: () => api.get<Customer>(`/customers/${id}`),
    }),
}
```

### Using in Routes

```typescript
export const Route = createFileRoute('/customers/')({
  // Prefetch data before render
  loader: ({ context: { queryClient }, deps: { search } }) =>
    queryClient.ensureQueryData(customerQueries.list(search)),
  
  component: CustomersList,
})

function CustomersList() {
  // Data is already cached - instant render
  const { data } = useSuspenseQuery(customerQueries.list(search))
}
```

### Mutations

```typescript
function CreateCustomerForm() {
  const createCustomer = useCreateCustomer()

  const handleSubmit = async (data) => {
    const customer = await createCustomer.mutateAsync(data)
    // Cache is automatically invalidated
    navigate({ to: '/customers/$id', params: { id: customer.id } })
  }
}
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript compiler
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | No (defaults to `/api`) |
| `VITE_LEGACY_APP_URL` | Legacy MVC app URL | No |
| `VITE_UNLEASH_URL` | Unleash frontend API URL | No |
| `VITE_UNLEASH_CLIENT_KEY` | Unleash frontend token | No |
| `VITE_UNLEASH_APP_NAME` | App name for Unleash | No |

## Technology Stack

- **React 18** - UI library
- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Server state management
- **Unleash** - Feature flag management
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
