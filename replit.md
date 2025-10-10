# Overview

This is a bilingual (Arabic/English) **LTA (Long-Term Agreement) contract fulfillment application** that enables businesses to manage contract-based product ordering. The system is LTA-centric, where each LTA represents a contract that can include multiple clients and specifies which products from a master catalog are supplied. Features include client authentication with role-based access (admin vs regular clients), product image management with custom metadata support, bulk product import via CSV, responsive product grid display, order templates, and Pipefy webhook integration for order processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod resolvers for form validation

**UI Framework:**
- Shadcn/ui components (Radix UI primitives) configured in "new-york" style
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theme system supporting light/dark modes
- Bilingual support with i18next for translations

**Design System:**
- Material Design 3 with enterprise adaptations
- Custom color palette defined in CSS variables (HSL format)
- Typography: Inter (English), Noto Sans Arabic (Arabic), JetBrains Mono (prices/code)
- RTL/LTR layout switching based on language selection
- 4px base spacing system for consistent layout
- Responsive grid layouts (1 col mobile → 5 cols 2xl)

**State Management:**
- Authentication state managed through React Context (AuthProvider)
- Theme preferences (light/dark) stored in localStorage with Context API
- Language preferences (en/ar) stored in localStorage with Context API
- Server state cached via React Query with infinite stale time by default
- Active LTA context tracking in cart (single-LTA enforcement)

## Backend Architecture

**Technology Stack:**
- Node.js with Express.js for the REST API server
- TypeScript with ESNext module system
- Passport.js with Local Strategy for session-based authentication
- Express-session with configurable session store (currently memory-based, designed to support PostgreSQL)
- Multer for file uploads (product images)

**Authentication Flow:**
- Password hashing using Node.js crypto (scrypt with salt)
- Session-based authentication with 30-day cookie expiration
- Role-based access control (admin vs. regular client users)
- Protected routes middleware for authorization checks

**API Design:**
- RESTful endpoints under `/api` prefix
- Middleware for request/response logging with duration tracking
- Zod schema validation for request payloads
- Consistent error handling with appropriate HTTP status codes
- Image upload validation (jpeg/jpg/png/webp, 5MB max)
- Bilingual error messages (English/Arabic)

**Data Layer:**
- Storage abstraction interface (`IStorage`) for database operations
- Drizzle ORM configured for PostgreSQL (via Neon serverless)
- Schema-first design with shared TypeScript types between frontend and backend
- Database migrations managed through Drizzle Kit

## Database Schema

**LTA-Centric Model:**

1. **LTAs (Long-Term Agreements)** - Contract master table
   - UUID primary key
   - Bilingual names and descriptions
   - Contract dates (startDate, endDate)
   - Status (active/inactive)
   - Created timestamp

2. **LTA Products** - Junction table with contract pricing
   - Links LTAs to products with contract-specific pricing
   - Unique constraint on (ltaId, productId)
   - Decimal contract price and currency
   - Allows same product in multiple LTAs with different prices

3. **LTA Clients** - Junction table for client assignments
   - Links LTAs to clients (many-to-many)
   - Unique constraint on (ltaId, clientId)
   - Allows clients to belong to multiple LTAs

4. **Products** - Master product catalog
   - SKU-based identification
   - Bilingual names and descriptions
   - Image URL support (nullable)
   - Category metadata
   - Custom metadata field (nullable JSON text) for flexible product attributes

5. **Clients** - User accounts with bilingual names and admin flag
   - Authentication credentials (username/password)
   - Contact information (email, phone)
   - Admin privilege flag for system management

6. **Client Departments** - Organizational units
   - Department types: finance, purchase, warehouse
   - Department-specific contact information

7. **Client Locations** - Physical addresses and delivery points
   - Bilingual location names and addresses
   - Headquarters designation flag
   - City/country metadata

8. **Order Templates** - Reusable order configurations
   - Bilingual template names
   - JSON-serialized cart items
   - Timestamp tracking

9. **Orders** - Transaction records
    - JSON-serialized order items
    - Order status workflow (pending → confirmed → shipped → delivered)
    - Total amount and currency tracking
    - LTA reference (ltaId)
    - Client location for delivery
    - Pipefy card ID tracking

**Data Relationships:**
- One-to-many: Client → Departments, Locations, Orders, Templates
- Many-to-many: LTAs ↔ Products (through LtaProducts with pricing)
- Many-to-many: LTAs ↔ Clients (through LtaClients)
- UUID primary keys generated via PostgreSQL `gen_random_uuid()`

**Deprecated Tables:**
- ClientPricing - Replaced by LTA-based pricing model

## Business Logic

**LTA Contract Fulfillment Flow:**
1. Admin creates LTA contracts with dates and status
2. Admin assigns products to LTA with contract-specific pricing
3. Admin assigns clients to LTA (clients can be in multiple LTAs)
4. Clients see only products from their assigned LTA(s)
5. Cart enforces single-LTA context (cannot mix LTAs in one order)
6. Orders validate: client authorization and contract pricing
7. Pipefy webhook sends order data (if configured)

**Security & Validation:**
- Admin-only access for LTA management and product management
- Server-side price validation using LTA contract prices
- Client authorization check for LTA access
- Single-LTA order enforcement (frontend and backend)
- No price manipulation possible (server validates against LTA pricing)

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL via `@neondatabase/serverless`
- WebSocket-based connection pooling
- Environment variable: `DATABASE_URL` (required)

**Session Management:**
- Session store abstraction supporting memory or PostgreSQL
- `connect-pg-simple` for PostgreSQL session persistence
- Environment variable: `SESSION_SECRET` (required for production)

**File Processing:**
- Multer for multipart/form-data handling
- Product image upload (jpeg/jpg/png/webp, 5MB max)
- Images stored in `attached_assets/products/`

**Fonts (Google Fonts CDN):**
- Inter: English UI text (variable weights 300-900)
- Noto Sans Arabic: Arabic UI text (variable weights 300-900)
- JetBrains Mono: Monospaced numbers for prices (weights 400-700)

**Deployment:**
- Replit-specific plugins for development (cartographer, dev banner, error overlay)
- Production build: Vite (frontend) + esbuild (backend bundling)
- Static file serving in production mode

**Third-Party UI Libraries:**
- Radix UI primitives for accessible components
- date-fns with locale support for date formatting
- cmdk for command palette functionality
- class-variance-authority for component variant management

**Development Tools:**
- Drizzle Kit for schema migrations and database management
- tsx for TypeScript execution in development
- PostCSS with Tailwind and Autoprefixer

## Key Features

**Admin Features:**
- LTA Management: Create/edit/delete contracts, set dates and status
- Product Assignment: Assign products to LTAs with contract pricing (individual or bulk CSV import)
- Bulk Product Import: CSV upload for assigning multiple products to LTA at once
- Client Assignment: Assign clients to LTAs (multi-LTA support)
- Product Management: CRUD operations with image upload and custom metadata fields
- Client Management: View/edit client information, departments, locations
- User Management: Toggle admin privileges for any user with visual switch control

**Client Features:**
- View products from assigned LTA(s) in responsive grid (1-5 columns)
- Product display: images, names, descriptions, contract pricing
- Single-LTA cart enforcement with visual indicators
- Active contract badge showing current LTA
- Order templates: save/load cart configurations
- Order history with reorder functionality
- Multi-language support (English/Arabic) with RTL

**System Features:**
- Bilingual throughout (English/Arabic)
- Responsive design with mobile-first approach
- Dark/light theme support
- Pipefy webhook integration for order processing

## Recent Changes (October 2025)

**Major Restructuring: LTA-Centric Model**
- Migrated from client-specific pricing to LTA-based contract pricing
- Added LTA tables: ltas, ltaProducts, ltaClients
- Updated order flow to track and validate LTA context
- Implemented single-LTA cart enforcement (UX fix)
- Added product image management with upload
- Created admin LTA management pages
- Updated client ordering page with responsive grid layout

**Product Enhancements (October 7, 2025):**
- Added custom metadata field to products for flexible JSON-formatted attributes
- Implemented bulk product import for LTAs via CSV upload
- CSV format: SKU, Contract Price, Currency (with template download)
- Bulk import features: SKU-based lookup, duplicate detection, detailed error reporting
- Success/failure tracking with bilingual UI feedback
- Updated product forms to support custom metadata editing

**Inventory Management Removal (October 7, 2025):**
- Removed all inventory tracking features from the application
- Deleted inventory transactions table and related schemas
- Removed quantity, stock status, and stock threshold fields from products
- Removed inventory management admin page and navigation
- Removed stock status badges from product displays
- Simplified product management to focus on core catalog features
- Orders no longer validate or track stock availability

**Authentication Migration to Replit Auth (October 8, 2025):**
- Migrated from local username/password authentication to Replit Auth OAuth
- Implemented automatic client creation for new Replit Auth users
- First user to authenticate automatically becomes admin
- Added admin user management UI with toggle switch to promote/demote users
- Created PATCH /api/admin/clients/:id/admin-status endpoint for admin status management
- Client records linked to Replit users via userId field
- Preserved existing client data structure for compatibility
- Users authenticate via Replit OAuth (no password required)

**Authentication Flow:**
- New users: Click login → Replit OAuth → Auto-create client record → First user gets admin
- Existing users: Replit OAuth links to existing client via userId
- Admin management: Admins can toggle admin status for any user via switch in Client Management page
- Session-based authentication with 30-day cookie expiration

**Vendor Management System (October 10, 2025):**
- Created comprehensive vendor management with dedicated vendors table
- Database schema: vendorNumber (unique), nameEn, nameAr, contactEmail, contactPhone, address
- Updated products table with vendorId foreign key (replaces text vendor fields)
- Full vendor CRUD operations in storage layer with vendorNumber lookup
- Admin-only vendor API routes with bilingual error messages and validation
- AdminVendorsPage: create/edit/delete vendors with bilingual UI
- Dashboard integration: Vendor Management card with Truck icon on /admin
- CSV import/export enhanced to handle all 18 product fields
- CSV vendor matching: imports use vendor number to set vendorId
- Product pricing enhancement: Added cost/selling prices for box/piece, unit info, categoryNum, specifications (AR)
- Pricing fields for admin reference only (don't affect LTA contract prices)
- Backend fully supports all product fields via API and CSV functionality
