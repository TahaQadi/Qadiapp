# App Page Map and Navigation Flow

## Page Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC PAGES                             │
├─────────────────────────────────────────────────────────────────┤
│ /landing          - Landing page (entry point)                 │
│ /login            - Login page                                  │
│ /logout           - Logout page                                 │
│ /onboarding       - User onboarding (if needed)                │
│ /products/:name   - Product detail (SEO public)                │
│ /catalog          - Product catalog (SEO public)               │
│ /catalog/:cat     - Category catalog (SEO public)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATED PAGES                          │
├─────────────────────────────────────────────────────────────────┤
│ /                 - Root (redirects based on role)            │
│ /ordering         - Main ordering page (clients)              │
│ /orders           - User orders page                           │
│ /profile          - Client profile page                        │
│ /price-request    - Price request page                         │
│ /price-offers     - Client price offers                        │
│ /documents        - Client documents                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN PAGES                                │
├─────────────────────────────────────────────────────────────────┤
│ /admin            - Admin dashboard                            │
│ /admin/products   - Product management                         │
│ /admin/vendors    - Vendor management                          │
│ /admin/clients    - Client management                          │
│ /admin/orders     - Order management                           │
│ /admin/ltas       - LTA management                             │
│ /admin/ltas/:id   - LTA detail page                            │
│ /admin/price-management - Price management                     │
│ /admin/price-requests - Price requests                        │
│ /admin/order-modifications - Order modifications              │
│ /admin/issue-reports - Issue reports                          │
│ /admin/feedback   - Customer feedback                          │
│ /admin/error-logs - Error logs                                 │
│ /admin/documents  - Document management                        │
│ /admin/reports    - Reports                                    │
│ /admin/demo-requests - Demo requests                          │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Flow

### Authentication Flow
```
User visits app
    ↓
Check authentication status
    ↓
┌─────────────────┬─────────────────┐
│   Not logged in  │   Logged in     │
│        ↓        │        ↓        │
│   /landing      │  Check role      │
│                 │        ↓         │
│                 │ ┌─────┴─────┐   │
│                 │ │  Admin    │   │
│                 │ │    ↓      │   │
│                 │ │  /admin   │   │
│                 │ └─────┬─────┘   │
│                 │ ┌─────┴─────┐   │
│                 │ │  Client   │   │
│                 │ │    ↓      │   │
│                 │ │ /ordering │   │
│                 │ └───────────┘   │
└─────────────────┴─────────────────┘
```

### Page Access Control
```
Public Pages (No Auth Required):
- /landing
- /login
- /logout
- /onboarding
- /products/:name
- /catalog
- /catalog/:category

Protected Pages (Auth Required):
- All /admin/* routes (Admin only)
- /ordering (Client only)
- /orders (Client only)
- /profile (Client only)
- /price-request (Client only)
- /price-offers (Client only)
- /documents (Client only)

Root Route Behavior:
- Not authenticated → /landing
- Authenticated Admin → /admin
- Authenticated Client → /ordering
```

### Authentication Flow (FIXED):
✅ **ProtectedRoute** now redirects to `/landing` when not authenticated
✅ **AdminRoute** correctly redirects to `/landing` when not authenticated  
✅ **Root route** correctly redirects to `/landing` when not authenticated
✅ **LogoutPage** now redirects to `/landing` after logout

### Complete Authentication Flow:
1. **Unauthenticated users** → Always redirected to `/landing`
2. **Landing page** → Has "Sign In" button that goes to `/login`
3. **Login page** → Redirects to appropriate dashboard after successful login
4. **Logout page** → Redirects to `/landing` after logout
5. **Protected routes** → Redirect to `/landing` if not authenticated
6. **Admin routes** → Redirect to `/landing` if not authenticated or not admin
