# Overview

This bilingual (Arabic/English) application manages and fulfills Long-Term Agreement (LTA) based product orders. It provides a platform for contract management, product catalogs, and client-specific pricing. Key capabilities include secure client authentication, role-based access, a robust price management system, product image handling, bulk product import, responsive product display, order templates, and integration with Pipefy for streamlined order processing. The project's core purpose is to optimize contract fulfillment workflows and enhance the ordering experience for LTA clients.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter, TanStack Query, React Hook Form with Zod.
**UI Framework:** Shadcn/ui (Radix UI primitives) in "new-york" style, Tailwind CSS with custom design tokens, custom theme (light/dark), i18next for bilingual support.
**Design System:** Material Design 3 adaptations, custom HSL color palette, Inter/Noto Sans Arabic/JetBrains Mono fonts, RTL/LTR layout, 4px base spacing, responsive grid.
**State Management:** React Context for authentication, theme, and language; React Query for server state caching; single-LTA context enforcement in cart.

## Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript (ESNext modules), Passport.js (Local Strategy), Express-session, Multer.
**Authentication Flow:** Session-based (30-day cookie), scrypt password hashing, role-based access control (admin/client), protected routes.
**API Design:** RESTful endpoints (`/api`), logging middleware, Zod schema validation, consistent error handling, image upload validation, bilingual error messages.
**Data Layer:** Storage abstraction (`IStorage`), Drizzle ORM for PostgreSQL (Neon serverless), schema-first design, Drizzle Kit for migrations.

## Database Schema (LTA-Centric Model)

**Core Entities:** LTAs, LTA Products, LTA Clients, LTA Documents, Products, Clients, Client Departments, Client Locations, Order Templates, Orders, Order Modifications, Templates (for PDF generation), Price Requests, Price Offers.
**Price Management Tables:** Price Requests (client-initiated quotes), Price Offers (admin-managed with pricing, PDF, validity).
**Relationships:** One-to-many (Client to Departments, Locations, Orders, Templates, Price Requests, Price Offers; LTA to Price Requests, Price Offers); Many-to-many (LTAs to Products via LtaProducts, LTAs to Clients via LtaClients). UUID primary keys are used.

## Business Logic

**LTA Contract Fulfillment Flow:** Admin manages LTAs, product assignments, and client assignments. Clients view only assigned LTA products. Shopping cart enforces single-LTA context. Orders validate client authorization and contract pricing. Pipefy webhook integrates for order data.
**Security & Validation:** Admin-only access for LTA/product management. Server-side validation for pricing, client authorization, single-LTA order enforcement, and contract pricing.

## Key Features

**Admin Features:** LTA management (CRUD, document upload/download), product assignment (individual/bulk CSV), client assignment, product management (CRUD, image upload), client management, user management, order modification review, template management, price request/offer management.
**Client Features:** Responsive product grid, product display, single-LTA cart, active contract badge, order templates, order history with reorder, order modification/cancellation requests, price request submission, price offer viewing/acceptance/rejection, multi-language (EN/AR) with RTL support.
**System Features:** Full bilingual support (EN/AR with RTL/BiDi), responsive design, dark/light themes, PWA with push notifications, Pipefy webhook integration, comprehensive order modification workflow, template-based PDF generation (price offers, orders, invoices, LTA contracts).
**Core System Enhancements:** Standardized API responses with error codes, centralized error handling, type-safe query key factory, comprehensive Zod validation schemas with middleware, performance monitoring (API metrics, caching, business KPIs), enhanced security (rate limiting, security headers, audit logging), and admin monitoring dashboard.
**Template System:** Refactored to Arabic-only for PDF generation (UI remains bilingual). Database schema adjusted, backend code updated, and 8 Arabic templates (2 per category: price offer, order, invoice, contract) are seeded with default templates marked. Migration completed October 29, 2025: added is_default, version, and tags columns to templates table.

# External Dependencies

**Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`).
**Session Management:** `express-session`, `connect-pg-simple`.
**File Processing:** Multer for multipart form data.
**Fonts:** Google Fonts CDN (Inter, Noto Sans Arabic, JetBrains Mono).
**Deployment:** Replit-specific plugins, Vite (frontend) + esbuild (backend).
**Third-Party UI Libraries:** Radix UI primitives, `date-fns`, `cmdk`, `class-variance-authority`.
**Development Tools:** Drizzle Kit, `tsx`, PostCSS with Tailwind and Autoprefixer.
**PDF Generation:** `arabic-reshaper`, `bidi-js` for Arabic RTL support.