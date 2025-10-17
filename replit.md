# Overview

This bilingual (Arabic/English) application is designed for businesses to manage and fulfill Long-Term Agreement (LTA) based product orders. It centers around LTAs, where each LTA represents a contract defining products from a master catalog for specific clients. Key features include client authentication with role-based access, product image management, bulk product import via CSV, a responsive product grid, order templates, and integration with Pipefy for order processing. The project aims to streamline contract fulfillment and enhance the ordering experience for LTA clients.

# Recent Changes

**PWA and Push Notifications (October 17, 2025):**
- Implemented complete PWA (Progressive Web App) infrastructure with manifest.json and service worker
- Added install prompt component for mobile devices with native app-like installation
- Created push notifications system with VAPID keys and backend API routes
- Added `push_subscriptions` table to database for managing notification subscriptions
- Service worker handles offline caching, push notifications, and background sync
- Fixed VAPID key generation and integration with web-push library
- Notifications work on mobile devices with proper permission handling

**Order Modification and Cancellation Feature Completion (October 17, 2025):**
- Fixed critical TypeScript errors in order modification routes (notification type and clientId null support)
- Fixed frontend API call in OrderModificationsPage (corrected apiRequest signature to 'POST', url, data)
- Updated storage.createNotification to accept string type and nullable clientId for admin notifications
- Verified complete implementation: backend routes, admin UI, client UI, database schema
- System supports full workflow: client request → admin review → approval/rejection → notification
- Created comprehensive documentation in ORDER_MODIFICATION_FEATURE.md

**Product Filtering Fix (October 17, 2025):**
- Fixed critical filtering bug in ordering page where all products showed when no LTA was assigned
- Refactored `useProductFilters` hook to enforce proper LTA-based filtering hierarchy: LTA → search → category
- Categories now calculated from LTA-filtered products only (prevents showing irrelevant categories)
- When no LTA is selected, no products are displayed (previously showed all products)
- Improved UX: category dropdown now only shows categories that exist in the selected LTA contract

**Code Cleanup and Refactoring (October 17, 2025):**
- Removed duplicate `/examples` folder containing outdated component duplicates
- Removed all debug `console.log` statements from server files (pdf-generator.ts, object-storage.ts)
- Removed debug `console.log` statements from client files (ProductDetailPage.tsx)
- Consolidated `AuthUser` interface - moved from useAuth.ts to shared/schema.ts for single source of truth
- Created centralized date formatting utilities (`formatDateLocalized`, `formatRelativeTime`) in `lib/dateUtils.ts`
- Refactored `getCategoryIcon` to use data-driven lookup pattern in `lib/categoryIcons.ts` (removed if/else chain)
- Improved code maintainability and reduced duplication across the codebase
- All changes are non-breaking and improve developer experience

**Order Modification and Cancellation System (October 16, 2025):**
- Added `order_modifications` table to track client modification/cancellation requests
- Extended orders table with cancellation tracking fields (cancellationReason, cancelledAt, cancelledBy, updatedAt)
- Implemented backend API routes for order modification workflow (`/api/orders/:id/modify`, `/api/orders/:id/cancel`)
- Created admin review UI at `/admin/order-modifications` with approve/reject capability
- Built client-facing order management page at `/orders` with modification request dialog
- Status workflow: pending → modification_requested → (approved/rejected) → cancelled/updated
- Full bilingual support for modification requests and admin responses
- Note: Currently supports order cancellation; item modification UI to be added in future

**Document Templates System (October 15, 2025):**
- Added `templates` table to database schema for PDF/document template management (13 columns: UUID, bilingual fields, JSONB sections/variables/styles)
- Created 4 production-ready template JSONs: price offer, order, invoice, LTA contract
- Enhanced PDF generator to support all section types: header, body, table, footer, signature, image, divider, spacer, terms
- Implemented bilingual rendering (language: 'en' | 'ar' | 'both') with proper fallbacks
- Added template import script for bulk loading via API
- Fixed TypeScript interfaces to match production template structure
- Admin templates page ready at /admin/templates (list, preview, edit, duplicate, delete, toggle active)

**Database Schema Fix (October 13, 2025):**
- Fixed TypeScript error in shared/schema.ts (notifications table: changed `isRead` to `read`)
- Resolved "products not showing in catalog" issue by adding missing `image_urls` column (jsonb type) to products table
- Database now has 734 products loading successfully in catalog
- Note: Some schema drift remains (price columns as text vs decimal in schema.ts, unused metadata column) but does not affect functionality
- Future improvements needed: formal migration for image_urls column, reconcile price column types, decide on metadata column

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, TanStack Query for server state, React Hook Form with Zod for validation.
**UI Framework:** Shadcn/ui (Radix UI primitives) in "new-york" style, Tailwind CSS with custom design tokens, custom theme (light/dark), i18next for bilingual support.
**Design System:** Material Design 3 adaptations, custom HSL color palette, Inter/Noto Sans Arabic/JetBrains Mono fonts, RTL/LTR layout, 4px base spacing, responsive grid (1 to 5 columns).
**State Management:** React Context for authentication, theme, and language; React Query for server state caching; single-LTA context enforcement in cart.

## Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript (ESNext modules), Passport.js (Local Strategy), Express-session, Multer for file uploads.
**Authentication Flow:** Session-based (30-day cookie), scrypt password hashing, role-based access control (admin/client), protected routes.
**API Design:** RESTful endpoints (`/api`), logging middleware, Zod schema validation, consistent error handling, image upload validation (jpeg/jpg/png/webp, 5MB max), bilingual error messages.
**Data Layer:** Storage abstraction (`IStorage`), Drizzle ORM for PostgreSQL (Neon serverless), schema-first design, Drizzle Kit for migrations.

## Database Schema (LTA-Centric Model)

-   **LTAs:** Contract master, UUID PK, bilingual names/descriptions, dates, status, timestamp.
-   **LTA Products:** Junction table linking LTAs to products with contract-specific pricing.
-   **LTA Clients:** Junction table linking LTAs to clients.
-   **LTA Documents:** Stores contract documents (PDF, DOC, XLS, ZIP, etc., 10MB max) with bilingual names and metadata.
-   **Products:** Master catalog with SKU, bilingual names/descriptions, image URL, category, custom JSON metadata.
-   **Clients:** User accounts, auth credentials, contact info, admin flag.
-   **Client Departments:** Organizational units (finance, purchase, warehouse).
-   **Client Locations:** Physical addresses, bilingual names.
-   **Order Templates:** Reusable order configurations (JSON-serialized cart items).
-   **Orders:** Transaction records (JSON-serialized items, status workflow, total, LTA reference, Pipefy card ID, cancellation tracking).
-   **Order Modifications:** Client modification/cancellation requests with admin review workflow (modification type, reason, new items, status, admin response).
-   **Relationships:** One-to-many (Client to Departments, Locations, Orders, Templates); Many-to-many (LTAs to Products via LtaProducts, LTAs to Clients via LtaClients). UUID primary keys.

## Business Logic

**LTA Contract Fulfillment Flow:** Admin manages LTAs, product assignments (with pricing), and client assignments. Clients view only assigned LTA products. Cart enforces single-LTA context. Orders validate client authorization and contract pricing. Pipefy webhook for order data.
**Security & Validation:** Admin-only access for LTA/product management. Server-side price validation, client authorization checks, single-LTA order enforcement, server validates against LTA pricing.

## Key Features

**Admin Features:** LTA management (CRUD, document upload/download), product assignment to LTAs (individual/bulk CSV), client assignment, product management (CRUD, image upload, custom metadata), client management, user management (admin toggles), order modification review and approval.
**Client Features:** Responsive product grid from assigned LTA(s), product display (images, names, SKU, descriptions, pricing), single-LTA cart, active contract badge, order templates, order history with reorder, order modification/cancellation requests, multi-language (EN/AR) with RTL.
**System Features:** Full bilingual support, responsive design, dark/light themes, Pipefy webhook integration, order modification workflow.

# External Dependencies

**Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`).
**Session Management:** `express-session`, `connect-pg-simple` for PostgreSQL session persistence.
**Email Service:** SendGrid integration available but not yet configured (user dismissed initial setup - will configure manually with Hostinger domain later).
**File Processing:** Multer for multipart form data, product image uploads (to `attached_assets/products/`), LTA document uploads (to `attached_assets/lta-documents/`).
**Fonts:** Google Fonts CDN (Inter, Noto Sans Arabic, JetBrains Mono).
**Deployment:** Replit-specific plugins, Vite (frontend) + esbuild (backend) for production builds, static file serving.
**Third-Party UI Libraries:** Radix UI primitives, `date-fns`, `cmdk`, `class-variance-authority`.
**Development Tools:** Drizzle Kit, `tsx`, PostCSS with Tailwind and Autoprefixer.