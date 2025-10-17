
# Navigation Flow & Access Points

## Public Pages (No Login Required)
- **Landing Page** (`/landing`)
  - ✅ "Sign In" button → `/login`
  - ✅ "Request Demo" button → Opens demo dialog
  - ✅ "Browse Products" button → `/catalog`

- **Login Page** (`/login`)
  - ✅ "Sign up" link → `/onboarding`

- **Catalog Pages** (`/catalog`, `/catalog/:category`)
  - ✅ Back button → `/` (Landing or Ordering based on auth)
  - ✅ Product cards → `/products/:subCategory/:productName`

- **Product Detail** (`/products/:subCategory/:productName`)
  - ✅ Back button → Previous page

## Client Pages (Login Required)
- **Ordering Page** (`/ordering`) - Main Hub
  - ✅ Logo/Brand → Stays on page
  - ✅ Profile icon → `/profile`
  - ✅ Admin icon (if admin) → `/admin`
  - ✅ Notifications icon → Dropdown
  - ✅ Shopping cart → Side sheet
  - ✅ "My Orders" tab → Shows order history
  - ✅ Theme toggle
  - ✅ Language toggle
  - ✅ Logout button

- **Orders Page** (`/orders`)
  - ✅ Back button → `/ordering`
  - ✅ Profile icon → `/profile`
  - ✅ Admin icon (if admin) → `/admin`
  - ✅ Notifications icon
  - ✅ Theme/Language toggles
  - ✅ Logout button

- **Profile Page** (`/profile`)
  - ✅ Back button → `/` (returns to main page)
  - ✅ Theme/Language toggles
  - ✅ Logout button

- **Price Offers Page** (`/price-offers`)
  - ✅ Back button → `/`
  - ✅ Profile icon → `/profile`
  - ✅ Notifications
  - ✅ Theme/Language toggles

- **Price Request Page** (`/price-request`)
  - ✅ Back button → `/`
  - ✅ Full header navigation

## Admin Pages (Admin Only)
- **Admin Dashboard** (`/admin`)
  - ✅ Back to ordering → `/ordering`
  - ✅ Profile → `/profile`
  - ✅ Cards link to:
    - `/admin/ltas`
    - `/admin/clients`
    - `/admin/products`
    - `/admin/vendors`
    - `/admin/price-management`
    - `/admin/orders`
    - `/admin/order-modifications`
    - `/admin/templates`

- **All Admin Sub-Pages**
  - ✅ Back button → `/admin`
  - ✅ Theme/Language toggles
  - ✅ Consistent headers

## Navigation Best Practices Applied
1. ✅ Every page has a way to navigate back
2. ✅ Consistent header across authenticated pages
3. ✅ Logo is clickable/visible on all pages
4. ✅ Admin pages accessible only to admins
5. ✅ Mobile-responsive navigation
6. ✅ RTL support for Arabic
7. ✅ Clear visual hierarchy
8. ✅ Accessibility (ARIA labels, focus states)

## Missing/Suggested Improvements
- Consider adding breadcrumbs for deep pages
- Add keyboard shortcuts for power users
- Add "Home" button in mobile menu
