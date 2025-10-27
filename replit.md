# Overview

This bilingual (Arabic/English) application enables businesses to manage and fulfill Long-Term Agreement (LTA) based product orders. It provides a comprehensive platform for managing contracts, products from a master catalog, and client-specific pricing. Key capabilities include secure client authentication with role-based access, a robust price management system, product image handling, bulk product import, a responsive product grid, order templates, and integration with Pipefy for streamlined order processing. The project's core purpose is to optimize contract fulfillment workflows and enhance the ordering experience for LTA clients.

# Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[COMPREHENSIVE_APPLICATION_REPORT.md](docs/COMPREHENSIVE_APPLICATION_REPORT.md)** - Complete application documentation (2,184 lines) covering technology stack, system architecture, all features, database schema (28 tables), API reference (63+ endpoints), integrations, security, performance, and development roadmap
- **[PHASE_2_MIGRATION_GUIDE.md](docs/PHASE_2_MIGRATION_GUIDE.md)** - Migration guide for API validation schemas and query key factory
- **[PHASE_3_4_IMPLEMENTATION.md](docs/PHASE_3_4_IMPLEMENTATION.md)** - Performance optimization, monitoring, and security enhancements guide
- **[CODE_AUDIT.md](docs/CODE_AUDIT.md)** - Code quality audit identifying unused/deprecated code and improvement recommendations
- **[README.md](docs/README.md)** - Documentation index and quick start guide

These documents provide detailed technical specifications, implementation details, and maintenance guidance for the entire application.

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

-   **Core Entities:** LTAs, LTA Products, LTA Clients, LTA Documents, Products, Clients, Client Departments, Client Locations, Order Templates, Orders, Order Modifications, Templates (for PDF generation), Price Requests, Price Offers.
-   **Price Management Tables:** 
    - **Price Requests**: Client-initiated requests with LTA, product selections, quantities, and notes. Status: pending/processed/cancelled.
    - **Price Offers**: Admin-managed offers with pricing, auto-generated offer number, PDF attachment, validity period, and client responses. Status: draft/sent/viewed/accepted/rejected/expired.
-   **Relationships:** One-to-many (Client to Departments, Locations, Orders, Templates, Price Requests, Price Offers; LTA to Price Requests, Price Offers); Many-to-many (LTAs to Products via LtaProducts, LTAs to Clients via LtaClients). UUID primary keys are used across the schema.

## Business Logic

**LTA Contract Fulfillment Flow:** Admin manages LTAs, product assignments (with pricing), and client assignments. Clients view only assigned LTA products. The shopping cart enforces a single-LTA context. Orders validate client authorization and contract pricing. Pipefy webhook integrates for order data.
**Security & Validation:** Admin-only access for LTA/product management. Server-side validation is implemented for pricing, client authorization, single-LTA order enforcement, and contract pricing.

## Key Features

**Admin Features:** LTA management (CRUD, document upload/download), product assignment to LTAs (individual/bulk CSV), client assignment, product management (CRUD, image upload, custom metadata), client management, user management (admin toggles), order modification review and approval, template management (list, preview, edit, duplicate, delete, toggle active), price request management (view all requests, create offers from requests), price offer management (create drafts, send with PDF generation, track responses).
**Client Features:** Responsive product grid, product display (images, names, SKU, descriptions, pricing), single-LTA cart, active contract badge, order templates, order history with reorder, order modification/cancellation requests, price request submission (select LTA products and request quotes), price offer viewing (receive offers, download PDFs, accept/reject), multi-language (EN/AR) with RTL support.
**System Features:** Full bilingual support (EN/AR with RTL/BiDi), responsive design, dark/light themes, PWA with push notifications, Pipefy webhook integration, comprehensive order modification workflow, template-based PDF generation (price offers, orders, invoices, LTA contracts).

# Recent Improvements (December 2024 - January 2025)

## Phase 1: Critical Fixes ✅ COMPLETED
- **Standardized API Responses** (`shared/api-types.ts`): All endpoints now return consistent `ApiResponse<T>` format with `{success, data?, error?, meta?}` structure
- **Error Code System**: 15+ standardized error codes (`ErrorCode` enum) with bilingual messages (EN/AR) for programmatic error handling
- **Error Handler Middleware** (`server/error-handler.ts`): Centralized error handling with `AppError` class, automatic Zod validation error handling, and helper functions (`errors.unauthorized()`, `errors.notFound()`, etc.)
- **Authentication Middleware**: Updated `isAuthenticated`, `requireAuth`, `requireAdmin` to use standardized error responses
- **Type Duplication Cleanup**: Removed duplicate table definitions from `server/db.ts`, consolidated all schemas in `shared/schema.ts`
- **Middleware Stack**: Correctly ordered middleware (Security Headers → Rate Limiting → Performance Monitoring → Routes → API 404 Handler → SPA Fallback → Error Handler) ensuring JSON responses for API routes and HTML for client routes

## Phase 2: API Improvements ✅ COMPLETED
- **Query Key Factory** (`client/src/lib/queryKeys.ts`): Centralized, hierarchical query key system for TanStack Query with type-safe keys for all resources (products, LTAs, clients, orders, templates, price requests/offers, documents, feedback, stats)
- **API Validation Schemas** (`shared/api-validation.ts`): Comprehensive Zod schemas for all API requests/responses with reusable validators, pagination support, bulk operations, file uploads, and query parameter coercion
- **Validation Middleware** (`server/validation-middleware.ts`): Express middleware factory for automatic validation of body/query/params with file upload validation, common helpers (`validateId`, `validatePagination`), and standardized error responses
- **Migration Guide** (`docs/PHASE_2_MIGRATION_GUIDE.md`): Complete guide with before/after examples, CRUD demonstration, and clear distinction between JSON body validation and query parameter validation
- **Query String Coercion**: Fixed pagination and query parameter validation to properly handle URL query strings with `z.coerce.number()` for automatic type conversion

## Phase 3: Performance Optimization & Monitoring ✅ COMPLETED
- **Performance Monitoring** (`server/performance-monitoring.ts`): Tracks API endpoint metrics including response times, sizes, status codes; detects slow requests (>1s); stores last 1000 metrics in-memory; admin endpoints for stats/metrics/clear
- **Caching Layer** (`server/caching.ts`): In-memory TTL-based caching with pattern-based invalidation, cache middleware factory for GET endpoints, automatic cleanup, cache hit/miss headers, predefined TTL constants (SHORT/MEDIUM/LONG/VERY_LONG)
- **Business Metrics** (`server/business-metrics.ts`): Event tracking for 30+ business KPIs (orders, price offers, LTAs, products); time-range filtering; user activity tracking; admin endpoints for metrics and events
- **Frontend Performance** (`client/src/lib/queryClient.ts`): Enhanced retry logic with intelligent exponential backoff; rate limit aware (429 handling with Retry-After); don't retry 4xx errors except 429; retry 5xx errors up to 3 times; granular cache strategies by data type

## Phase 4: Enhanced Security ✅ COMPLETED
- **Rate Limiting** (`server/rate-limiting.ts`): Per-user and per-IP rate limiting with sliding window algorithm; configurable windows and limits; rate limit headers (X-RateLimit-*); Retry-After header for 429 responses; 4 presets (AUTH: 5/15min, API: 100/15min, PUBLIC: 300/15min, EXPENSIVE: 10/hour)
- **Security Headers** (`server/security-headers.ts`): 7 security headers (CORS, CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy); dev/production presets
- **Audit Logging** (`server/audit-logging.ts`): Comprehensive audit trail tracking user, action, resource, changes; IP address and user agent tracking; resource history tracking; time-based filtering; 40+ predefined audit actions
- **Monitoring Routes** (`server/monitoring-routes.ts`): Admin-only monitoring dashboard with 10 endpoints for performance, cache, business metrics, audit logs, and system health; mounted at `/api/monitoring/*`
- **Implementation Guide** (`docs/PHASE_3_4_IMPLEMENTATION.md`): Complete documentation with usage examples, integration points, benefits, migration checklist, and future enhancements

# Code Cleanup (October 2025)

## Cleanup Summary
- **Removed 70+ temporary development files** from `attached_assets/` folder (screenshots, test videos, pasted text files, Word documents)
- **Removed unused database table**: Deleted the `users` table from `shared/schema.ts` which was marked as "RESERVED FOR FUTURE USE" but completely unused
- **Fixed duplicate route registration**: Removed duplicate `demoRequestRoutes` registration in `server/routes.ts`
- **Removed test files**: Deleted 5 test files from `server/` directory (`test-document-api.ts`, `test-document-triggers.ts`, `test-enhanced-pdf-generator.ts`, `test-pdf-flow.ts`, `test-pdf-generator-simple.ts`)
- **Removed duplicate hook file**: Deleted duplicate `use-mobile.ts` (kept `use-mobile.tsx` which uses media queries for better performance)
- **Removed empty directory**: Deleted the empty `backups/` directory
- **Documentation consolidation**: Removed 38 redundant documentation files from `docs/` folder, consolidated all information into `COMPREHENSIVE_APPLICATION_REPORT.md` (2,184 lines), kept only 5 essential files

## Production Data Preserved
- All production assets in `attached_assets/documents/` and `attached_assets/products/` remain intact
- All database tables and production data preserved
- All production features remain functional

# External Dependencies

**Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`).
**Session Management:** `express-session`, `connect-pg-simple`.
**File Processing:** Multer for multipart form data (product images, LTA documents).
**Fonts:** Google Fonts CDN (Inter, Noto Sans Arabic, JetBrains Mono).
**Deployment:** Replit-specific plugins, Vite (frontend) + esbuild (backend).
**Third-Party UI Libraries:** Radix UI primitives, `date-fns`, `cmdk`, `class-variance-authority`.
**Development Tools:** Drizzle Kit, `tsx`, PostCSS with Tailwind and Autoprefixer.
**PDF Generation:** `arabic-reshaper`, `bidi-js` for Arabic RTL support.