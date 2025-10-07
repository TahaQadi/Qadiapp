# Overview

This is a bilingual (Arabic/English) B2B client ordering application that enables businesses to browse products, manage orders, and maintain order templates. The system supports client-specific pricing, multi-department organization, and RTL/LTR language switching. It's designed as a productivity-first tool following Material Design 3 principles with enterprise adaptations for efficient order management.

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

**State Management:**
- Authentication state managed through React Context (AuthProvider)
- Theme preferences (light/dark) stored in localStorage with Context API
- Language preferences (en/ar) stored in localStorage with Context API
- Server state cached via React Query with infinite stale time by default

## Backend Architecture

**Technology Stack:**
- Node.js with Express.js for the REST API server
- TypeScript with ESNext module system
- Passport.js with Local Strategy for session-based authentication
- Express-session with configurable session store (currently memory-based, designed to support PostgreSQL)

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
- File upload support via Multer (for price import functionality)

**Data Layer:**
- Storage abstraction interface (`IStorage`) for database operations
- Drizzle ORM configured for PostgreSQL (via Neon serverless)
- Schema-first design with shared TypeScript types between frontend and backend
- Database migrations managed through Drizzle Kit

## Database Schema

**Core Entities:**

1. **Clients** - User accounts with bilingual names and admin flag
   - Authentication credentials (username/password)
   - Contact information (email, phone)
   - Admin privilege flag for system management

2. **Client Departments** - Organizational units within client companies
   - Department types: finance, purchase, warehouse
   - Department-specific contact information

3. **Client Locations** - Physical addresses and delivery points
   - Bilingual location names and addresses
   - Headquarters designation flag
   - City/country metadata

4. **Products** - Catalog items with bilingual content
   - SKU-based identification
   - Stock status tracking (in-stock, low-stock, out-of-stock)
   - Optional image URLs and categorization

5. **Client Pricing** - Client-specific product pricing
   - Foreign key relationships to clients and products
   - Currency support for international clients
   - Allows different prices per client

6. **Order Templates** - Reusable order configurations
   - Bilingual template names
   - JSON-serialized cart items
   - Timestamp tracking for template usage

7. **Orders** - Transaction records
   - JSON-serialized order items
   - Order status workflow (pending → confirmed → shipped → delivered)
   - Total amount and currency tracking
   - Foreign key to client locations for delivery

**Data Relationships:**
- One-to-many: Client → Departments, Locations, Orders, Templates
- Many-to-many: Clients ↔ Products (through ClientPricing)
- UUID primary keys generated via PostgreSQL `gen_random_uuid()`

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
- Multer for multipart/form-data handling (price import CSV/Excel)
- Client-side file upload for price list imports

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