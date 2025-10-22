# Overview

This bilingual (Arabic/English) application enables businesses to manage and fulfill Long-Term Agreement (LTA) based product orders. It provides a comprehensive platform for managing contracts, products from a master catalog, and client-specific pricing. Key capabilities include secure client authentication with role-based access, a robust price management system, product image handling, bulk product import, a responsive product grid, order templates, and integration with Pipefy for streamlined order processing. The project's core purpose is to optimize contract fulfillment workflows and enhance the ordering experience for LTA clients.

# Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[APPLICATION_OVERVIEW.md](docs/APPLICATION_OVERVIEW.md)** - Technology stack, architecture patterns, and system design
- **[FEATURES_DOCUMENTATION.md](docs/FEATURES_DOCUMENTATION.md)** - Complete feature breakdown for admin, client, and system features
- **[WORKFLOWS_DOCUMENTATION.md](docs/WORKFLOWS_DOCUMENTATION.md)** - Detailed process flows with diagrams for all major workflows
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - REST API reference with 63+ endpoints, request/response formats, and authentication
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Complete database schema with 28 tables, relationships, and constraints
- **[CODE_AUDIT.md](docs/CODE_AUDIT.md)** - Code quality audit identifying unused/deprecated code and improvement recommendations

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

# External Dependencies

**Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`).
**Session Management:** `express-session`, `connect-pg-simple`.
**File Processing:** Multer for multipart form data (product images, LTA documents).
**Fonts:** Google Fonts CDN (Inter, Noto Sans Arabic, JetBrains Mono).
**Deployment:** Replit-specific plugins, Vite (frontend) + esbuild (backend).
**Third-Party UI Libraries:** Radix UI primitives, `date-fns`, `cmdk`, `class-variance-authority`.
**Development Tools:** Drizzle Kit, `tsx`, PostCSS with Tailwind and Autoprefixer.
**PDF Generation:** `arabic-reshaper`, `bidi-js` for Arabic RTL support.