# LTA Contract Fulfillment Application - Overview

## Purpose

The LTA (Long-Term Agreement) Contract Fulfillment Application is a comprehensive bilingual (Arabic/English) B2B platform that enables businesses to manage and fulfill contract-based product orders. The system streamlines the entire lifecycle of LTA management, from contract setup and product assignments to client ordering, price management, and feedback collection.

## Core Value Proposition

- **Contract-Based Ordering**: Enforce pricing and product availability through pre-configured LTA contracts
- **Comprehensive Price Management**: Request quotes, create offers with PDF generation, and track responses
- **Customer Experience Focus**: Integrated feedback system with analytics and issue reporting
- **Bilingual Support**: Full RTL/LTR support for English and Arabic languages
- **Admin Control**: Centralized management of contracts, products, clients, and orders

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with TypeScript |
| **Vite** | Build tool and dev server |
| **Wouter** | Lightweight routing (< 2KB) |
| **TanStack Query v5** | Server state management & caching |
| **React Hook Form** | Form management with validation |
| **Zod** | Runtime validation |
| **Shadcn/ui** | Component library (Radix UI primitives) |
| **Tailwind CSS** | Utility-first styling with custom theme |
| **i18next** | Internationalization (EN/AR) |
| **Lucide React** | Icon library |
| **date-fns** | Date manipulation |
| **Recharts** | Data visualization |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | Web server & API framework |
| **TypeScript (ESNext)** | Type-safe server code |
| **Passport.js** | Authentication (Local Strategy) |
| **Express Session** | Session management (30-day cookies) |
| **Drizzle ORM** | Type-safe database queries |
| **PostgreSQL (Neon)** | Primary database |
| **Multer** | File upload handling |
| **PDFKit** | PDF generation with Arabic support |
| **arabic-reshaper + bidi-js** | Arabic RTL text rendering |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| **Database** | Neon Serverless PostgreSQL |
| **Storage** | Replit Object Storage (documents/images) |
| **Session Store** | connect-pg-simple (PostgreSQL) |
| **Deployment** | Replit Platform |
| **Integration** | Pipefy (order management webhook) |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Client Pages │  │ Admin Pages  │  │ Public Pages │      │
│  │              │  │              │  │              │      │
│  │ - Ordering   │  │ - LTA Mgmt   │  │ - Landing    │      │
│  │ - Orders     │  │ - Products   │  │ - Catalog    │      │
│  │ - Profile    │  │ - Clients    │  │ - Product    │      │
│  │ - Feedback   │  │ - Analytics  │  │   Details    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   TanStack Query    │
                   │   (State & Cache)   │
                   └──────────┬──────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│               Backend API (Express + TypeScript)              │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐│
│  │ Auth Routes  │ Client       │ Admin Routes │ Feedback    ││
│  │              │ Routes       │              │ Routes      ││
│  │ - Login      │ - Products   │ - LTAs       │ - Submit    ││
│  │ - Session    │ - Orders     │ - Pricing    │ - Analytics ││
│  │ - Password   │ - Profile    │ - Reports    │ - Issues    ││
│  └──────────────┴──────────────┴──────────────┴─────────────┘│
│                              │                                 │
│                   ┌──────────▼──────────┐                      │
│                   │   Drizzle ORM       │                      │
│                   └──────────┬──────────┘                      │
└─────────────────────────────┼─────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│               PostgreSQL Database (Neon)                       │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐│
│  │ Clients      │ Products     │ Orders       │ Feedback    ││
│  │ LTAs         │ LTA Products │ Pricing      │ Issues      ││
│  │ Users        │ Vendors      │ Documents    │ Templates   ││
│  └──────────────┴──────────────┴──────────────┴─────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Client Authentication** → Session-based auth with Passport.js → 30-day secure cookie
2. **Client Requests** → React → TanStack Query → Express API → Drizzle ORM → PostgreSQL
3. **File Uploads** → Multer → Replit Object Storage → URL saved in database
4. **PDF Generation** → Template system → PDFKit with Arabic support → Object Storage
5. **External Integration** → Pipefy webhook receives order data on submission

---

## Key Architectural Decisions

### 1. **Single-LTA Cart Enforcement**
- Cart can only contain products from ONE LTA at a time
- When adding products from different LTA, cart is cleared
- Ensures pricing consistency and contract compliance

### 2. **Session-Based Authentication**
- 30-day secure HTTP-only cookies
- PostgreSQL session storage (connect-pg-simple)
- No JWT tokens - traditional server-side sessions

### 3. **Bilingual Data Model**
- All user-facing content has `nameEn` and `nameAr` fields
- Database stores both languages
- Frontend switches based on user preference

### 4. **Price Management Architecture**
- **Client Pricing**: Imported bulk pricing per client
- **LTA Pricing**: Contract-specific pricing per product
- **Price Requests**: Client-initiated quote requests
- **Price Offers**: Admin-created quotations with PDF generation

### 5. **Feedback System Separation**
- **Order Feedback**: Detailed ratings and recommendations (delivered orders only)
- **Issue Reports**: Bug/problem tracking (any order status)
- **Micro Feedback**: Touchpoint-based sentiment collection
- Two separate buttons in UI (not integrated into single dialog)

### 6. **Document Template System**
- JSON-based template definitions
- Support for multiple categories (price_offer, order, invoice, contract)
- Language-specific or bilingual templates
- Active/inactive template versioning

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Scrypt algorithm (Node.js built-in) |
| **Session Security** | HTTP-only cookies, secure flag in production |
| **SQL Injection Prevention** | Drizzle ORM parameterized queries |
| **File Upload Validation** | MIME type checking, size limits (5MB max) |
| **Role-Based Access Control** | Admin vs Client permissions on all routes |
| **Environment Secrets** | Replit Secrets for sensitive configuration |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│              Replit Deployment                       │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Frontend (Vite)                             │  │
│  │  - Built to dist/                            │  │
│  │  - Served by Express as static files         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Backend (Express + esbuild)                 │  │
│  │  - TypeScript compiled at runtime (tsx)      │  │
│  │  - Single process serves API + static files  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Database (Neon PostgreSQL)                  │  │
│  │  - Serverless, managed externally            │  │
│  │  - Connection via DATABASE_URL env var      │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  Storage (Replit Object Storage)             │  │
│  │  - Product images                            │  │
│  │  - LTA documents                             │  │
│  │  - Generated PDFs                            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy loading for admin pages
- **Query Caching**: TanStack Query with configurable stale times
- **Image Optimization**: Lazy loading, proper sizing
- **Bundle Size**: Tree-shaking with Vite

### Backend Optimization
- **Database Indexing**: Indexes on frequently queried fields
- **Connection Pooling**: Neon serverless manages connections
- **Session Reuse**: PostgreSQL session storage with TTL
- **Caching Strategy**: Query-level caching in TanStack Query

---

## Scalability Design

1. **Stateless Application**: All session data in PostgreSQL
2. **Serverless Database**: Auto-scaling with Neon
3. **Object Storage**: External storage prevents server disk bloat
4. **Horizontal Scaling Ready**: Can add more Replit instances if needed

---

## Development Workflow

```bash
# Install dependencies
npm install

# Database migrations
npm run db:push

# Development (runs both frontend & backend)
npm run dev

# Build for production
npm run build
```

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `SESSION_SECRET` | Session encryption key |
| `NODE_ENV` | Environment (development/production) |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Database connection details |

---

## Project Structure

```
workspace/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (routes)
│   │   │   └── admin/     # Admin-specific pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app with routing
│   └── index.html         # Entry HTML
│
├── server/                # Backend Express application
│   ├── routes.ts          # Main API routes
│   ├── auth.ts            # Authentication logic
│   ├── storage.ts         # Database abstraction layer
│   ├── feedback-routes.ts # Feedback & issue endpoints
│   └── index.ts           # Server entry point
│
├── shared/                # Shared code between frontend/backend
│   └── schema.ts          # Drizzle database schema + Zod schemas
│
├── docs/                  # Project documentation
│
└── attached_assets/       # Uploaded files (local dev only)
```

---

## Integration Points

### Pipefy Integration
- **Webhook**: POST to Pipefy on order creation
- **Data Sent**: Order details, client info, items
- **Purpose**: Sync orders to external fulfillment system

### Replit Services
- **Object Storage**: Image and document storage
- **Database**: Managed PostgreSQL via Neon
- **Deployment**: Automatic HTTPS, custom domains

---

## Next Steps for Enhancement

1. **Real-time Updates**: Add WebSocket support for live order status
2. **Advanced Analytics**: Expand reporting with custom date ranges
3. **Notification System**: Email/SMS notifications for order updates
4. **Mobile App**: React Native app using same backend API
5. **API Documentation**: Auto-generated Swagger/OpenAPI docs
6. **Performance Monitoring**: Add APM (Application Performance Monitoring)
7. **Automated Testing**: Expand test coverage beyond current setup

---

## Related Documentation

- [Features Documentation](./FEATURES_DOCUMENTATION.md) - Complete feature breakdown
- [Workflows Documentation](./WORKFLOWS_DOCUMENTATION.md) - Business process flows
- [API Documentation](./API_DOCUMENTATION.md) - API endpoint reference
- [Database Schema](./DATABASE_SCHEMA.md) - Complete database structure
- [Code Audit](./CODE_AUDIT.md) - Code quality assessment
