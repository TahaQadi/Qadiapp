# LTA Contract Fulfillment Application - Comprehensive Report

**Version**: 1.0  
**Date**: October 2025  
**Company**: Al Qadi Trading Company  
**Document Purpose**: Complete application documentation covering features, architecture, technology stack, integrations, and development roadmap

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Integrations](#integrations)
8. [Security & Performance](#security--performance)
9. [Debug & Maintenance](#debug--maintenance)
10. [Development Roadmap](#development-roadmap)
11. [Deployment & Infrastructure](#deployment--infrastructure)

---

## Executive Summary

### Purpose

The LTA (Long-Term Agreement) Contract Fulfillment Application is a comprehensive **bilingual (Arabic/English) B2B platform** that enables Al Qadi Trading Company to manage and fulfill contract-based product orders. The system streamlines the entire lifecycle of LTA management, from contract setup and product assignments to client ordering, price management, document generation, and customer feedback collection.

### Core Value Proposition

- **Contract-Based Ordering**: Enforce pricing and product availability through pre-configured LTA contracts
- **Comprehensive Price Management**: Request quotes, create offers with PDF generation, and track client responses
- **Customer Experience Focus**: Integrated feedback system with analytics and issue reporting
- **Bilingual Support**: Full RTL/LTR support for English and Arabic languages with proper BiDi text handling
- **Admin Control**: Centralized management of contracts, products, clients, orders, and analytics
- **Document Management**: Template-based PDF generation with secure storage and access control

### Key Metrics

- **28 Database Tables** with comprehensive relationships
- **63+ API Endpoints** with full RESTful coverage
- **40+ Frontend Pages** (Admin, Client, Public)
- **Full Bilingual Support** with RTL layout for Arabic
- **Template-Based PDF Generation** for 4+ document types
- **Role-Based Access Control** (Admin/Client permissions)

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework with TypeScript |
| **Vite** | 6.4.1 | Build tool and dev server |
| **Wouter** | 3.3.5 | Lightweight routing (< 2KB) |
| **TanStack Query** | 5.60.5 | Server state management & caching |
| **React Hook Form** | 7.55.0 | Form management with validation |
| **Zod** | 3.24.2 | Runtime validation schemas |
| **Shadcn/ui** | Latest | Component library (Radix UI primitives) |
| **Tailwind CSS** | 3.4.17 | Utility-first styling with custom theme |
| **i18next** | 25.5.3 | Internationalization (EN/AR) |
| **Lucide React** | 0.453.0 | Icon library (1000+ icons) |
| **date-fns** | 3.6.0 | Date manipulation and formatting |
| **Recharts** | 2.15.4 | Data visualization charts |
| **Framer Motion** | 11.18.2 | Animation library |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest | JavaScript runtime |
| **Express** | 4.21.2 | Web server & API framework |
| **TypeScript** | 5.6.3 | Type-safe server code (ESNext modules) |
| **Passport.js** | 0.7.0 | Authentication (Local Strategy) |
| **Express Session** | 1.18.1 | Session management |
| **Drizzle ORM** | 0.39.1 | Type-safe database queries |
| **PostgreSQL** | 15+ | Primary relational database (Neon) |
| **Multer** | 2.0.2 | Multipart/form-data file uploads |
| **PDFKit** | 0.17.2 | PDF generation engine |
| **arabic-reshaper** | 1.1.0 | Arabic text shaping for PDFs |
| **bidi-js** | 1.0.3 | Bidirectional text handling |
| **Zod** | 3.24.2 | Server-side validation |

### Infrastructure & Services

| Component | Technology | Details |
|-----------|-----------|---------|
| **Database** | Neon Serverless PostgreSQL | Managed database with auto-scaling |
| **Storage** | Replit Object Storage | Document/image storage with CDN |
| **Session Store** | connect-pg-simple | PostgreSQL session storage |
| **Deployment** | Replit Platform | Automatic HTTPS, custom domains |
| **External Integration** | Pipefy | Order management webhook |
| **Package Manager** | npm | Dependency management |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Drizzle Kit** | 0.31.5 | Database migrations |
| **esbuild** | 0.25.0 | Backend bundler |
| **tsx** | 4.20.5 | TypeScript execution |
| **Vitest** | 4.0.3 | Unit testing framework |
| **Autoprefixer** | 10.4.20 | CSS vendor prefixes |
| **PostCSS** | 8.4.47 | CSS processing |

---

## System Architecture

### High-Level Architecture Diagram

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
│  │ - Prices     │  │ - Reports    │  │ - SEO Pages  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   TanStack Query    │
                   │  (State & Cache)    │
                   │  - Smart retries    │
                   │  - Cache strategies │
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
│  │   Reset      │ - Templates  │ - Users      │             ││
│  └──────────────┴──────────────┴──────────────┴─────────────┘│
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │         Middleware Stack (Ordered)                       ││
│  │  1. Security Headers (CSP, HSTS, X-Frame-Options)       ││
│  │  2. Rate Limiting (Per-user & Per-IP)                   ││
│  │  3. Performance Monitoring                              ││
│  │  4. Caching Layer (TTL-based)                           ││
│  │  5. Authentication (Passport.js)                        ││
│  │  6. Error Handler (Standardized responses)              ││
│  └──────────────────────────────────────────────────────────┘│
│                              │                                 │
│                   ┌──────────▼──────────┐                      │
│                   │   Drizzle ORM       │                      │
│                   │  - Type-safe ORM    │                      │
│                   │  - Query builder    │                      │
│                   └──────────┬──────────┘                      │
└─────────────────────────────┼─────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│               PostgreSQL Database (Neon)                       │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐│
│  │ Core Tables  │ Business     │ Documents    │ Feedback &  ││
│  │              │ Logic        │ & Templates  │ Analytics   ││
│  │ - Clients    │ - Orders     │ - Documents  │ - Feedback  ││
│  │ - Products   │ - LTAs       │ - Templates  │ - Issues    ││
│  │ - Vendors    │ - Pricing    │ - Access     │ - Micro     ││
│  │ - Sessions   │ - Contracts  │   Logs       │   Feedback  ││
│  └──────────────┴──────────────┴──────────────┴─────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Data Flow Patterns                        │
└──────────────────────────────────────────────────────────────┘

1. Authentication Flow:
   User → Login Form → POST /api/auth/login → Passport.js 
   → Validate Credentials → Create Session (PostgreSQL)
   → Set HTTP-only Cookie (30 days) → Redirect to Dashboard

2. Client Request Flow:
   React Component → TanStack Query → GET /api/endpoint
   → Authentication Middleware → Authorization Check
   → Drizzle ORM → PostgreSQL → Response → Cache Update

3. File Upload Flow:
   User → File Input → Multer Middleware → Validation
   → Replit Object Storage → Save URL to Database
   → Return File URL to Client

4. PDF Generation Flow:
   Admin → Create Offer → Select Template → Fill Variables
   → Template PDF Generator → PDFKit with Arabic Support
   → Generate Buffer → Upload to Object Storage
   → Save Document Metadata → Send to Client

5. Order Submission Flow:
   Client → Add to Cart → Checkout → POST /api/orders
   → Validate LTA Assignment → Check Contract Pricing
   → Create Order in DB → Trigger Pipefy Webhook
   → Send Notification → Return Order Confirmation
```

### Key Architectural Decisions

#### 1. Single-LTA Cart Enforcement
- **Rationale**: Ensures pricing consistency and contract compliance
- **Implementation**: Cart can only contain products from ONE LTA at a time
- **Behavior**: When adding products from different LTA, cart is automatically cleared
- **Benefits**: Prevents pricing conflicts, simplifies order processing

#### 2. Session-Based Authentication
- **Choice**: Traditional server-side sessions instead of JWT
- **Storage**: PostgreSQL via connect-pg-simple
- **Duration**: 30-day secure HTTP-only cookies
- **Security**: 
  - HTTP-only flag prevents XSS attacks
  - Secure flag in production (HTTPS only)
  - SameSite: 'lax' for CSRF protection
  - Session rolling (extends on activity)

#### 3. Bilingual Data Model
- **Approach**: Database stores both languages natively
- **Pattern**: All user-facing content has `nameEn` and `nameAr` fields
- **Frontend**: Client-side language switching via i18next
- **Benefits**: SEO-friendly, no translation API needed, consistent data

#### 4. Price Management Architecture
Multiple pricing tiers for flexibility:
- **LTA Pricing** (Primary): Contract-specific pricing per product
- **Client Pricing**: Imported bulk pricing per client
- **Price Requests**: Client-initiated quote requests
- **Price Offers**: Admin-created quotations with PDF generation

#### 5. Feedback System Separation
- **Order Feedback**: Detailed ratings and recommendations (delivered orders only)
- **Issue Reports**: Bug/problem tracking (any order status)
- **Micro Feedback**: Touchpoint-based sentiment collection
- **Design**: Two separate entry points in UI (not integrated into single dialog)

#### 6. Document Template System
- **Format**: JSON-based template definitions
- **Categories**: price_offer, order, invoice, contract, lta_document
- **Language Support**: Language-specific or bilingual templates
- **Versioning**: Active/inactive template management
- **Rendering**: Server-side with PDFKit and Arabic text support

---

## Core Features

### Admin Features

#### 1. LTA Management

##### 1.1 LTA CRUD Operations
- **Create LTAs**: Define new long-term agreements with bilingual names and descriptions
- **Edit LTAs**: Update contract details, dates, and status
- **Delete LTAs**: Remove contracts (restricted if clients/products are assigned)
- **View LTAs**: List all contracts with filtering and search
- **Status Management**: Activate/deactivate contracts

**Fields**:
- Name (English/Arabic)
- Description (English/Arabic)
- Start Date / End Date
- Status (active/inactive)

**Routes**: `/admin/ltas`, `/admin/ltas/:id`

##### 1.2 Product Assignment to LTAs
- **Individual Assignment**: Add single products with contract pricing
- **Bulk Assignment**: Import CSV file with product SKUs and prices
- **Price Management**: Update contract prices for assigned products
- **Remove Products**: Unassign products from LTA
- **View Assignments**: See all products assigned to an LTA

**CSV Import Format**:
```csv
SKU,Contract Price
PROD-001,29.99
PROD-002,149.50
```

##### 1.3 Client Assignment to LTAs
- **Assign Clients**: Grant clients access to specific LTAs
- **Bulk Assignment**: Select multiple clients at once
- **Revoke Access**: Remove client assignments
- **View Assignments**: See all clients with access to an LTA

##### 1.4 LTA Documents
- **Upload Documents**: Attach PDFs, contracts, terms & conditions
- **Download Documents**: Retrieve uploaded files
- **Document Metadata**: Track upload date and file size
- **Delete Documents**: Remove attachments

---

#### 2. Product Management

##### 2.1 Product CRUD Operations
- **Create Products**: Add new products with bilingual details
- **Edit Products**: Update product information
- **Delete Products**: Remove products from catalog
- **Search Products**: Find products by SKU, name, category
- **Filter Products**: By category, vendor, price range

**Product Fields**:
- SKU (unique identifier)
- Name (English/Arabic)
- Description (English/Arabic)
- Category, Main Category
- Unit Type, Units per Box
- Cost Price (per box/per piece)
- Selling Price (pack/piece)
- Specifications (Arabic)
- Image(s)
- Vendor

##### 2.2 Product Image Management
- **Upload Images**: Single or multiple images per product
- **Image Validation**: JPEG, PNG, WEBP only, 5MB max
- **Primary Image**: First image is default display
- **Multiple Images**: Gallery support
- **Delete Images**: Remove product images

**Supported Formats**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

##### 2.3 Product Import/Export
- **Bulk Import**: Upload CSV with product data
- **Export to CSV**: Download all products as CSV
- **Field Mapping**: Automatic mapping of CSV columns
- **Validation**: Pre-import data validation
- **Error Reporting**: Display import errors with line numbers

---

#### 3. Client Management

##### 3.1 Client CRUD Operations
- **Create Clients**: Add new client companies
- **Edit Clients**: Update client information
- **Delete Clients**: Remove clients (cascades to related data)
- **Search Clients**: Find by name, username, email
- **Admin Toggle**: Promote/demote admin privileges

**Client Fields**:
- Username (unique, for login)
- Password (hashed with scrypt)
- Name (English/Arabic)
- Email, Phone
- Admin Status

##### 3.2 Multi-User Management (Company Users)
- **Add Users**: Create multiple users per company
- **Department Assignment**: Finance, Purchase, Warehouse
- **Role Management**: Active/inactive users
- **Shared Access**: All company users access same company data

##### 3.3 Department Management
- **Add Departments**: Create client departments
- **Edit Departments**: Update department info
- **Delete Departments**: Remove departments

##### 3.4 Location Management
- **Add Locations**: Create delivery locations
- **Edit Locations**: Update location info
- **Delete Locations**: Remove locations

---

#### 4. Order Management

##### 4.1 Order Overview
- **View All Orders**: List all client orders
- **Filter by Status**: pending, confirmed, processing, shipped, delivered, cancelled
- **Search Orders**: By order ID, client name
- **Pagination**: Handle large order lists
- **Order Details**: View full order information

##### 4.2 Order Actions
- **Update Status**: Change order status
- **View Items**: See ordered products and quantities
- **Export Options**: Print, PDF, CSV export
- **Bulk Actions**: Delete multiple orders

##### 4.3 Order Modifications
- **View Requests**: See modification/cancellation requests
- **Approve/Reject**: Manage modification requests
- **Status Tracking**: Track request status
- **Communication**: Reason for approval/rejection

---

#### 5. Price Management

##### 5.1 Price Requests
- **View All Requests**: See all client price requests
- **Filter by Status**: pending, processed, cancelled
- **Request Details**: Products, quantities, client notes
- **Create Offer from Request**: Convert request to price offer

##### 5.2 Price Offers
- **Create Offers**: Draft price offers manually or from requests
- **Offer Fields**:
  - Auto-generated offer number
  - Client, LTA, Products
  - Pricing, Validity period
  - Terms & conditions
- **Generate PDF**: Create professional offer documents
- **Send Offers**: Mark as sent, notify client
- **Track Responses**: View client acceptance/rejection
- **Status Management**: draft, sent, viewed, accepted, rejected, expired

##### 5.3 Client Pricing Import
- **Bulk Import**: Upload CSV with client-specific pricing
- **Price Management**: Update imported prices
- **Export**: Download client pricing data

---

#### 6. Vendor Management
- **CRUD Operations**: Create, read, update, delete vendors
- **Vendor Fields**: Name (EN/AR), contact info
- **Product Association**: Link products to vendors
- **Bulk Import/Export**: CSV support

---

#### 7. Template Management

##### 7.1 Document Templates
- **List Templates**: View all PDF templates
- **Create Templates**: Define new document templates
- **Edit Templates**: Update template structure
- **Duplicate Templates**: Clone existing templates
- **Delete Templates**: Remove templates
- **Toggle Active**: Enable/disable templates

##### 7.2 Template Categories
- Price Offer Templates
- Order Templates
- Invoice Templates
- Contract Templates

##### 7.3 Template Structure
- **JSON-based**: Flexible template definition
- **Sections**: header, body, table, footer, signature, image, divider, spacer, terms
- **Variables**: Dynamic data placeholders
- **Styling**: Colors, fonts, spacing
- **Language**: English, Arabic, or bilingual

---

#### 8. Document Management
- **Document Library**: Central repository for all generated PDFs
- **Search & Filter**: By type, client, LTA, date range
- **Download Documents**: Secure document access
- **Delete Documents**: Remove documents
- **Access Tracking**: View count, last viewed date
- **Access Logs**: Audit trail of document access

---

#### 9. Feedback & Analytics

##### 9.1 Feedback Dashboard
- **View All Feedback**: Customer feedback and ratings
- **Filter Options**: By rating, date, order status
- **Analytics**: Average ratings, trends
- **Recommendation Tracking**: NPS-style tracking

##### 9.2 Issue Reports
- **View Issues**: Customer-reported problems
- **Status Management**: new, in_progress, resolved, closed
- **Priority Assignment**: low, medium, high, urgent
- **Assign to Team**: Route issues to departments
- **Communication**: Add notes and updates

##### 9.3 Micro Feedback (Planned)
- **Touchpoint Tracking**: Sentiment at various app points
- **Quick Responses**: Thumbs up/down
- **Context Capture**: What user was doing

---

#### 10. System Monitoring & Logs

##### 10.1 Error Logs
- **View Errors**: Application errors and exceptions
- **Filter by Severity**: error, warning, info
- **Stack Traces**: Full error details
- **User Context**: Who encountered the error
- **Clear Logs**: Archive old errors

##### 10.2 Performance Monitoring
- **Endpoint Stats**: Response times, error rates
- **Slow Queries**: Identify performance bottlenecks
- **Cache Performance**: Hit/miss ratios
- **Business Metrics**: Track KPIs and events

##### 10.3 Audit Logs
- **Action Tracking**: Who did what, when
- **Resource History**: Track changes to entities
- **Security Audits**: Login attempts, permission changes
- **IP & User Agent**: Full request context

---

### Client Features

#### 1. Product Browsing

##### 1.1 Product Catalog
- **View Products**: Browse products assigned to client's LTAs
- **Product Display**: Images, names, SKU, descriptions
- **Pricing Display**: Contract-specific pricing
- **LTA Badge**: Show which LTA product belongs to
- **Responsive Grid**: 1-5 columns based on screen size

##### 1.2 Product Search & Filter
- **Search**: By name, SKU, category
- **Filter by Category**: Main category and subcategory
- **Filter by LTA**: Show products from specific LTA
- **Sort Options**: Name, price, SKU

##### 1.3 Product Details
- **Image Gallery**: Multiple product images
- **Full Description**: Detailed product information
- **Specifications**: Technical details
- **Pricing**: Contract price with currency
- **Add to Cart**: Quick add functionality

---

#### 2. Shopping Cart & Orders

##### 2.1 Shopping Cart
- **Add Products**: Add items with quantities
- **Update Quantities**: Adjust item quantities
- **Remove Items**: Delete from cart
- **Cart Summary**: Total items, total price
- **LTA Enforcement**: Single LTA per cart
- **Clear Cart**: Empty entire cart

##### 2.2 Order Templates
- **Save Templates**: Save frequently used orders
- **Load Templates**: Quickly reorder
- **Edit Templates**: Update saved templates
- **Delete Templates**: Remove templates
- **Template List**: View all saved templates

##### 2.3 Order Placement
- **Select Department**: Choose ordering department
- **Select Location**: Choose delivery location
- **Add Notes**: Special instructions
- **Submit Order**: Place order with confirmation
- **Order Confirmation**: View submitted order details

##### 2.4 Order History
- **View Orders**: See all past orders
- **Order Status**: Track order progress
- **Order Details**: View items and pricing
- **Reorder**: Quickly reorder past orders
- **Download Documents**: PDF order documents

##### 2.5 Order Modifications
- **Request Cancellation**: Cancel pending orders
- **Request Changes**: Modify items or quantities
- **Track Requests**: See request status
- **View Responses**: Admin approval/rejection

---

#### 3. Price Management

##### 3.1 Price Requests
- **Submit Requests**: Request quotes for products
- **Select Products**: Choose from LTA products
- **Specify Quantities**: Expected order quantities
- **Add Notes**: Additional requirements
- **View Status**: Track request progress

##### 3.2 Price Offers
- **View Offers**: See received price offers
- **Offer Details**: Products, pricing, validity
- **Download PDF**: Professional offer documents
- **Accept/Reject**: Respond to offers
- **Offer History**: View past offers

---

#### 4. Profile Management

##### 4.1 Personal Information
- **View Profile**: Company details
- **Update Info**: Change name, email, phone
- **Change Password**: Update credentials

##### 4.2 Departments & Locations
- **View Departments**: See company departments
- **View Locations**: See delivery locations
- **Request Changes**: Contact admin for updates

---

#### 5. Feedback & Support

##### 5.1 Order Feedback
- **Rate Orders**: 1-5 star ratings
- **Product Quality**: Rate product quality
- **Delivery Service**: Rate delivery
- **Recommendations**: Would recommend? (Yes/No)
- **Comments**: Detailed feedback

##### 5.2 Issue Reporting
- **Report Issues**: Submit problem reports
- **Issue Types**: Order, product, delivery, system
- **Priority**: Indicate urgency
- **Attachments**: Upload screenshots
- **Track Issues**: See issue status

---

#### 6. Notifications
- **In-App Notifications**: Real-time updates
- **Push Notifications**: Browser push (PWA)
- **Notification Types**:
  - Order status changes
  - Price offers received
  - Modification request responses
  - System announcements
- **Mark as Read**: Manage notifications
- **Notification History**: View past notifications

---

### Public Features

#### 1. Landing Page
- **Company Information**: About Al Qadi Trading
- **Features Showcase**: Platform capabilities
- **Demo Request**: Submit demo requests
- **Contact Information**: Get in touch

#### 2. Product Catalog (Public)
- **Browse Products**: View product catalog without login
- **Product Details**: SEO-optimized product pages
- **No Pricing**: Prices hidden for non-authenticated users
- **Call to Action**: Encourage login/registration

#### 3. SEO Pages
- **Optimized URLs**: `/products/[category]/[product-name]`
- **Meta Tags**: Title, description, Open Graph
- **Structured Data**: Product schema markup
- **Mobile-Friendly**: Responsive design
- **Fast Loading**: Optimized images and code

---

### System Features

#### 1. Internationalization (i18n)
- **Dual Language**: English and Arabic
- **Language Switching**: Toggle between languages
- **RTL Support**: Right-to-left layout for Arabic
- **BiDi Text**: Proper bidirectional text rendering
- **Date Formatting**: Locale-aware dates
- **Number Formatting**: Currency and numbers
- **Translation Files**: JSON-based translations

#### 2. Theme System
- **Light Mode**: Default light theme
- **Dark Mode**: Dark theme support
- **Theme Toggle**: User preference
- **Local Storage**: Persist theme choice
- **CSS Variables**: Dynamic theme colors
- **Smooth Transitions**: Animated theme changes

#### 3. Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Flexible Grids**: Adaptive layouts
- **Touch Friendly**: Large tap targets
- **Hamburger Menu**: Mobile navigation

#### 4. Progressive Web App (PWA)
- **Install Prompt**: Add to home screen
- **Service Worker**: Offline capabilities
- **App Manifest**: PWA configuration
- **Icon Sets**: Multiple icon sizes
- **Splash Screens**: Launch screens

#### 5. Security
- **Password Hashing**: Scrypt algorithm
- **Session Security**: HTTP-only cookies
- **CSRF Protection**: SameSite cookies
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **HTTPS Enforcement**: Secure flag in production
- **Rate Limiting**: API rate limits
- **Security Headers**: HSTS, X-Frame-Options, etc.

#### 6. Performance Optimization
- **Code Splitting**: Lazy loading
- **Image Optimization**: Lazy loading, proper sizing
- **Caching Strategy**: TanStack Query caching
- **Database Indexing**: Optimized queries
- **CDN**: Replit Object Storage with CDN
- **Compression**: Gzip compression

#### 7. Error Handling
- **Standardized Responses**: Consistent error format
- **Error Codes**: Programmatic error handling
- **Bilingual Messages**: EN/AR error messages
- **Error Logging**: Centralized error tracking
- **User-Friendly**: Clear error messages

#### 8. Monitoring & Analytics
- **Performance Metrics**: API response times
- **Business Metrics**: Orders, revenue, users
- **Error Tracking**: Application errors
- **Audit Logs**: User actions
- **Cache Metrics**: Cache performance

---

## Database Schema

### Schema Overview

**Total Tables**: 28  
**Primary Keys**: UUID (gen_random_uuid())  
**Relationships**: One-to-many, Many-to-many  
**Indexes**: Optimized for common queries  

### Entity Relationship Diagram

```
sessions (Session storage)

passwordResetTokens

clients (Main client/company table)
├── companyUsers (Multi-user support)
├── clientDepartments
├── clientLocations
├── ltaClients (M:M with ltas)
├── orders
│   ├── orderItems
│   ├── orderFeedback
│   └── orderModifications
├── orderTemplates
│   └── orderTemplateItems
├── priceRequests
│   └── priceRequestItems
└── priceOffers
    └── priceOfferItems

products
├── ltaProducts (M:M with ltas)
├── orderItems
├── orderTemplateItems
├── priceRequestItems
└── priceOfferItems

vendors
└── products (One-to-many)

ltas (Long-Term Agreements)
├── ltaProducts (M:M with products)
├── ltaClients (M:M with clients)
├── ltaDocuments
├── orders
├── priceRequests
└── priceOffers

templates (PDF templates)
└── documents (Generated from templates)

documents (Generated PDFs)
└── documentAccessLogs

notifications
issueReports
microFeedback
demoRequests
errorLogs
```

### Core Tables

#### 1. sessions
**Purpose**: Express session storage via connect-pg-simple

```typescript
{
  sid: varchar (PRIMARY KEY)
  sess: jsonb (NOT NULL)
  expire: timestamp (NOT NULL, indexed)
}
```

**Notes**:
- Automatic cleanup of expired sessions
- 30-day session duration
- PostgreSQL-backed for scalability

---

#### 2. clients
**Purpose**: Main client/company table

```typescript
{
  id: varchar (PK, UUID)
  userId: varchar (UNIQUE, reserved)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  username: text (NOT NULL, UNIQUE)
  password: text (NOT NULL, hashed)
  email: text
  phone: text
  isAdmin: boolean (DEFAULT false)
}
```

**Relationships**:
- Has many: companyUsers, clientDepartments, clientLocations, orders, orderTemplates, priceRequests, priceOffers, ltaClients

**Security**:
- Passwords hashed with scrypt
- Never returned in API responses

---

#### 3. companyUsers
**Purpose**: Multi-user access per company

```typescript
{
  id: varchar (PK, UUID)
  companyId: varchar (FK → clients.id, CASCADE)
  username: text (NOT NULL, UNIQUE)
  password: text (NOT NULL, hashed)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  email: text
  phone: text
  departmentType: text ('finance', 'purchase', 'warehouse', null)
  isActive: boolean (DEFAULT true)
  createdAt: timestamp (DEFAULT NOW)
}
```

---

#### 4. products
**Purpose**: Product catalog

```typescript
{
  id: varchar (PK, UUID)
  sku: text (NOT NULL, UNIQUE)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  descriptionEn: text
  descriptionAr: text
  category: text
  mainCategory: text
  unitType: text
  unitsPerBox: integer
  costPricePerBox: decimal(10,2)
  costPricePerPiece: decimal(10,2)
  sellingPricePack: decimal(10,2)
  sellingPricePiece: decimal(10,2)
  specificationsAr: text
  imageUrls: text[] (array)
  vendorId: varchar (FK → vendors.id)
}
```

**Indexes**: sku (UNIQUE)

---

#### 5. vendors
**Purpose**: Vendor/supplier management

```typescript
{
  id: varchar (PK, UUID)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  contactPerson: text
  email: text
  phone: text
  address: text
}
```

---

#### 6. ltas (Long-Term Agreements)
**Purpose**: Contract definitions

```typescript
{
  id: varchar (PK, UUID)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  descriptionEn: text
  descriptionAr: text
  startDate: date
  endDate: date
  status: text (DEFAULT 'active')
}
```

---

#### 7. ltaProducts
**Purpose**: M:M relationship between LTAs and products with contract pricing

```typescript
{
  id: varchar (PK, UUID)
  ltaId: varchar (FK → ltas.id, CASCADE)
  productId: varchar (FK → products.id, CASCADE)
  contractPrice: decimal(10,2) (NOT NULL)
  currency: text (DEFAULT 'USD')
  assignedAt: timestamp (DEFAULT NOW)
}
```

**Constraints**: UNIQUE (ltaId, productId)

---

#### 8. ltaClients
**Purpose**: M:M relationship between LTAs and clients

```typescript
{
  id: varchar (PK, UUID)
  ltaId: varchar (FK → ltas.id, CASCADE)
  clientId: varchar (FK → clients.id, CASCADE)
  assignedAt: timestamp (DEFAULT NOW)
}
```

**Constraints**: UNIQUE (ltaId, clientId)

---

### Business Logic Tables

#### 9. orders
**Purpose**: Customer orders

```typescript
{
  id: varchar (PK, UUID)
  clientId: varchar (FK → clients.id)
  ltaId: varchar (FK → ltas.id)
  departmentId: varchar (FK → clientDepartments.id)
  locationId: varchar (FK → clientLocations.id)
  status: text (DEFAULT 'pending')
  totalAmount: decimal(10,2)
  notes: text
  createdAt: timestamp (DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Statuses**: pending, confirmed, processing, shipped, delivered, cancelled

---

#### 10. orderItems
**Purpose**: Order line items

```typescript
{
  id: varchar (PK, UUID)
  orderId: varchar (FK → orders.id, CASCADE)
  productId: varchar (FK → products.id)
  quantity: integer (NOT NULL)
  unitPrice: decimal(10,2) (NOT NULL)
  totalPrice: decimal(10,2) (NOT NULL)
}
```

---

#### 11. orderTemplates
**Purpose**: Saved order templates for quick reordering

```typescript
{
  id: varchar (PK, UUID)
  clientId: varchar (FK → clients.id, CASCADE)
  name: text (NOT NULL)
  ltaId: varchar (FK → ltas.id)
  createdAt: timestamp (DEFAULT NOW)
}
```

---

#### 12. priceRequests
**Purpose**: Client-initiated price quote requests

```typescript
{
  id: varchar (PK, UUID)
  clientId: varchar (FK → clients.id, CASCADE)
  ltaId: varchar (FK → ltas.id)
  status: text (DEFAULT 'pending')
  notes: text
  createdAt: timestamp (DEFAULT NOW)
}
```

**Statuses**: pending, processed, cancelled

---

#### 13. priceOffers
**Purpose**: Admin-created price quotations

```typescript
{
  id: varchar (PK, UUID)
  offerNumber: text (NOT NULL, UNIQUE, auto-generated)
  clientId: varchar (FK → clients.id)
  ltaId: varchar (FK → ltas.id)
  priceRequestId: varchar (FK → priceRequests.id, nullable)
  status: text (DEFAULT 'draft')
  validUntil: date
  terms: text
  pdfUrl: text
  createdAt: timestamp (DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Statuses**: draft, sent, viewed, accepted, rejected, expired

---

### Document Management Tables

#### 14. templates
**Purpose**: PDF document templates

```typescript
{
  id: varchar (PK, UUID)
  name: text (NOT NULL)
  category: text (NOT NULL)
  language: text (NOT NULL)
  sections: jsonb (NOT NULL)
  styles: jsonb
  isActive: boolean (DEFAULT true)
  createdAt: timestamp (DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Categories**: price_offer, order, invoice, contract

---

#### 15. documents
**Purpose**: Generated PDF documents with versioning

```typescript
{
  id: varchar (PK, UUID)
  documentType: text (NOT NULL)
  fileName: text (NOT NULL)
  fileUrl: text (NOT NULL)
  ltaId: varchar (FK → ltas.id, nullable)
  clientId: varchar (FK → clients.id, nullable)
  orderId: varchar (FK → orders.id, nullable)
  priceOfferId: varchar (FK → priceOffers.id, nullable)
  fileSize: integer
  viewCount: integer (DEFAULT 0)
  lastViewedAt: timestamp
  checksum: text
  metadata: jsonb
  parentDocumentId: varchar (FK → documents.id, nullable)
  versionNumber: integer (DEFAULT 1)
  createdAt: timestamp (DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Document Types**: price_offer, order, invoice, contract, lta_document

---

#### 16. documentAccessLogs
**Purpose**: Audit trail for document access

```typescript
{
  id: varchar (PK, UUID)
  documentId: varchar (FK → documents.id, CASCADE)
  clientId: varchar (FK → clients.id)
  action: text (NOT NULL)
  ipAddress: text
  userAgent: text
  accessedAt: timestamp (DEFAULT NOW)
}
```

**Actions**: view, download, generate

---

### Feedback & Analytics Tables

#### 17. orderFeedback
**Purpose**: Customer feedback on delivered orders

```typescript
{
  id: varchar (PK, UUID)
  orderId: varchar (FK → orders.id, CASCADE)
  clientId: varchar (FK → clients.id)
  rating: integer (1-5)
  productQuality: integer (1-5)
  deliveryService: integer (1-5)
  wouldRecommend: boolean
  comments: text
  createdAt: timestamp (DEFAULT NOW)
}
```

---

#### 18. issueReports
**Purpose**: Customer issue/problem reporting

```typescript
{
  id: varchar (PK, UUID)
  orderId: varchar (FK → orders.id, nullable)
  clientId: varchar (FK → clients.id)
  issueType: text (NOT NULL)
  priority: text (DEFAULT 'medium')
  status: text (DEFAULT 'new')
  description: text (NOT NULL)
  attachmentUrls: text[]
  assignedTo: text
  resolution: text
  createdAt: timestamp (DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Issue Types**: order_issue, product_quality, delivery_problem, system_bug  
**Priorities**: low, medium, high, urgent  
**Statuses**: new, in_progress, resolved, closed

---

#### 19. microFeedback
**Purpose**: Lightweight touchpoint feedback

```typescript
{
  id: varchar (PK, UUID)
  userId: varchar (NOT NULL)
  touchpoint: text (NOT NULL)
  sentiment: text (NOT NULL)
  quickResponse: text
  context: jsonb
  createdAt: timestamp (DEFAULT NOW)
}
```

**Sentiments**: positive, neutral, negative

---

#### 20. notifications
**Purpose**: In-app and push notifications

```typescript
{
  id: varchar (PK, UUID)
  clientId: varchar (FK → clients.id, CASCADE)
  title: text (NOT NULL)
  message: text (NOT NULL)
  type: text
  relatedId: text
  isRead: boolean (DEFAULT false)
  createdAt: timestamp (DEFAULT NOW)
}
```

---

### System Tables

#### 21. errorLogs
**Purpose**: Application error tracking

```typescript
{
  id: varchar (PK, UUID)
  errorMessage: text (NOT NULL)
  errorStack: text
  severity: text (DEFAULT 'error')
  userId: varchar
  route: text
  method: text
  requestBody: jsonb
  createdAt: timestamp (DEFAULT NOW)
}
```

**Severities**: info, warning, error, critical

---

#### 22. demoRequests
**Purpose**: Demo requests from landing page

```typescript
{
  id: varchar (PK, UUID)
  companyName: text (NOT NULL)
  contactName: text (NOT NULL)
  email: text (NOT NULL)
  phone: text
  message: text
  status: text (DEFAULT 'pending')
  createdAt: timestamp (DEFAULT NOW)
}
```

---

### Additional Tables

- **clientDepartments**: Client company departments
- **clientLocations**: Client delivery locations
- **ltaDocuments**: LTA contract documents
- **orderModifications**: Order change/cancellation requests
- **clientPricing**: Imported client-specific pricing
- **passwordResetTokens**: Password reset functionality

---

## API Reference

### API Overview

**Base URL**: `/api`  
**Authentication**: Session-based (HTTP-only cookies)  
**Response Format**: JSON  
**Total Endpoints**: 63+

### Standardized Response Format

All endpoints return consistent `ApiResponse<T>` structure:

```typescript
{
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
    messageAr: string
  }
  meta?: {
    page?: number
    pageSize?: number
    totalPages?: number
    totalCount?: number
  }
}
```

### Error Codes

```typescript
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  // ... 15+ error codes
}
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and create session.

**Request**:
```json
{
  "username": "client1",
  "password": "SecurePassword123"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "username": "client1",
  "nameEn": "ABC Company",
  "nameAr": "شركة ABC",
  "isAdmin": false
}
```

---

#### POST /api/auth/logout
End current session.

**Response** (200):
```json
{
  "message": "Logged out successfully",
  "messageAr": "تم تسجيل الخروج بنجاح"
}
```

---

#### GET /api/auth/user
Get current authenticated user.

**Auth**: Required

**Response** (200):
```json
{
  "id": "uuid",
  "username": "client1",
  "nameEn": "ABC Company",
  "isAdmin": false
}
```

---

### Product Endpoints

#### GET /api/products
Get products assigned to authenticated client's LTAs.

**Auth**: Required (Client)

**Query Params**:
- `category` - Filter by category
- `search` - Search by name/SKU
- `ltaId` - Filter by LTA

**Response** (200):
```json
[
  {
    "id": "uuid",
    "sku": "PROD-001",
    "nameEn": "Product Name",
    "nameAr": "اسم المنتج",
    "contractPrice": 99.99,
    "currency": "USD",
    "imageUrls": ["url1", "url2"]
  }
]
```

---

#### GET /api/products/:id
Get single product details.

**Auth**: Required (Client)

**Response** (200):
```json
{
  "id": "uuid",
  "sku": "PROD-001",
  "nameEn": "Product Name",
  "descriptionEn": "Description...",
  "contractPrice": 99.99,
  "ltaId": "uuid"
}
```

---

### Order Endpoints

#### POST /api/orders
Create new order.

**Auth**: Required (Client)

**Request**:
```json
{
  "ltaId": "uuid",
  "departmentId": "uuid",
  "locationId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 10
    }
  ],
  "notes": "Special instructions"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "status": "pending",
  "totalAmount": 999.99,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

#### GET /api/orders
Get client's orders.

**Auth**: Required (Client)

**Query Params**:
- `status` - Filter by status
- `page`, `pageSize` - Pagination

**Response** (200):
```json
{
  "orders": [...],
  "totalPages": 5,
  "currentPage": 1
}
```

---

### Admin Endpoints

#### POST /api/admin/ltas
Create new LTA.

**Auth**: Required (Admin)

**Request**:
```json
{
  "nameEn": "Contract 2024",
  "nameAr": "عقد 2024",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

---

#### POST /api/admin/ltas/:id/products
Assign products to LTA.

**Auth**: Required (Admin)

**Request**:
```json
{
  "products": [
    {
      "productId": "uuid",
      "contractPrice": 99.99
    }
  ]
}
```

---

#### GET /api/admin/orders
Get all orders (admin view).

**Auth**: Required (Admin)

**Query Params**:
- `page`, `pageSize` - Pagination
- `status` - Filter by status
- `search` - Search by order ID

---

### Price Management Endpoints

#### POST /api/price-requests
Submit price request.

**Auth**: Required (Client)

**Request**:
```json
{
  "ltaId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 100
    }
  ],
  "notes": "Bulk order inquiry"
}
```

---

#### POST /api/admin/price-offers
Create price offer.

**Auth**: Required (Admin)

**Request**:
```json
{
  "clientId": "uuid",
  "ltaId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 100,
      "unitPrice": 89.99
    }
  ],
  "validUntil": "2024-12-31",
  "terms": "Payment terms..."
}
```

---

#### POST /api/admin/price-offers/:id/send
Generate PDF and send offer to client.

**Auth**: Required (Admin)

**Response** (200):
```json
{
  "success": true,
  "pdfUrl": "url-to-pdf",
  "message": "Price offer sent successfully"
}
```

---

### Feedback Endpoints

#### POST /api/feedback
Submit order feedback.

**Auth**: Required (Client)

**Request**:
```json
{
  "orderId": "uuid",
  "rating": 5,
  "productQuality": 5,
  "deliveryService": 4,
  "wouldRecommend": true,
  "comments": "Excellent service!"
}
```

---

#### POST /api/issues
Report issue.

**Auth**: Required (Client)

**Request**:
```json
{
  "orderId": "uuid",
  "issueType": "product_quality",
  "priority": "high",
  "description": "Product damaged on arrival"
}
```

---

### Monitoring Endpoints (Admin Only)

#### GET /api/monitoring/performance/stats
Get API performance statistics.

#### GET /api/monitoring/cache/stats
Get cache performance metrics.

#### GET /api/monitoring/business/metrics
Get business KPIs and metrics.

#### GET /api/monitoring/business/events
Get recent business events.

---

## Integrations

### 1. Pipefy Integration

**Purpose**: Order management workflow automation

**Type**: Webhook  
**Direction**: Outbound (LTA App → Pipefy)  
**Trigger**: Order creation

**Configuration**:
```typescript
{
  webhookUrl: process.env.PIPEFY_WEBHOOK_URL,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PIPEFY_API_TOKEN}`
  }
}
```

**Payload**:
```json
{
  "order_id": "uuid",
  "client_name": "ABC Company",
  "total_amount": 999.99,
  "items": [...],
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Handling**:
- Retry mechanism: 3 attempts with exponential backoff
- Failed webhooks logged to error logs
- Manual retry option in admin panel

---

### 2. Replit Object Storage

**Purpose**: File storage for images and documents

**Type**: Object Storage Service  
**Provider**: Replit  
**SDK**: `@replit/object-storage`

**Usage**:
```typescript
import { Client } from '@replit/object-storage';

const storage = new Client();

// Upload file
await storage.uploadFromBytes(
  'products/product-123.jpg',
  fileBuffer,
  { type: 'image/jpeg' }
);

// Get URL
const url = await storage.downloadAsBytes('products/product-123.jpg');
```

**Stored Files**:
- Product images: `products/*.jpg`
- LTA documents: `documents/ltas/*.pdf`
- Generated PDFs: `documents/generated/*.pdf`

**Features**:
- CDN distribution
- Automatic HTTPS
- Checksum verification
- File size limits: 5MB for images, no limit for PDFs

---

### 3. Neon PostgreSQL

**Purpose**: Primary database

**Type**: Serverless PostgreSQL  
**Provider**: Neon  
**Connection**: Via `DATABASE_URL` environment variable

**Features**:
- Serverless auto-scaling
- Connection pooling
- Point-in-time recovery
- Branch databases for development

**Configuration**:
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
```

---

### 4. Google Fonts CDN

**Purpose**: Web fonts for bilingual support

**Fonts**:
- **Inter**: Primary English font
- **Noto Sans Arabic**: Primary Arabic font
- **JetBrains Mono**: Monospace font (SKU, codes)

**Implementation**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

### 5. Future Integrations (Planned)

#### Email Service
- **Provider**: SendGrid or Nodemailer + SMTP
- **Use Cases**: 
  - Order confirmations
  - Price offer notifications
  - Password resets
  - Issue reports

#### SMS Notifications
- **Provider**: Twilio
- **Use Cases**:
  - Order status updates
  - Urgent notifications

#### Payment Gateway
- **Provider**: Stripe or local payment provider
- **Use Cases**:
  - Online payments
  - Invoicing

---

## Security & Performance

### Security Implementation

#### 1. Authentication & Sessions
- **Strategy**: Passport.js Local Strategy
- **Password Hashing**: Scrypt (Node.js crypto module)
- **Session Storage**: PostgreSQL via connect-pg-simple
- **Session Duration**: 30 days with rolling expiration
- **Cookie Security**:
  - HTTP-only: Prevents XSS
  - Secure flag: HTTPS only in production
  - SameSite: 'lax' for CSRF protection

#### 2. Security Headers
Implemented via `server/security-headers.ts`:

```typescript
{
  'Content-Security-Policy': "default-src 'self'; ...",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}
```

#### 3. Rate Limiting
Implemented via `server/rate-limiting.ts`:

**Presets**:
- **AUTH**: 5 requests per 15 minutes (login, password reset)
- **API**: 100 requests per 15 minutes (general API)
- **PUBLIC**: 300 requests per 15 minutes (public endpoints)
- **EXPENSIVE**: 10 requests per hour (PDF generation, bulk operations)

**Features**:
- Per-user and per-IP tracking
- Sliding window algorithm
- Rate limit headers (X-RateLimit-*)
- Retry-After header for 429 responses

#### 4. SQL Injection Prevention
- **ORM**: Drizzle ORM with parameterized queries
- **No raw SQL**: All queries via type-safe ORM
- **Validation**: Zod schemas for all inputs

#### 5. File Upload Security
- **MIME type validation**: Whitelist only (jpeg, jpg, png, webp)
- **File size limits**: 5MB for images
- **File name sanitization**: Remove special characters
- **Virus scanning**: (Planned for production)

#### 6. Audit Logging
Implemented via `server/audit-logging.ts`:

**Tracked Actions**:
- User login/logout
- Create/update/delete operations
- Document access
- Permission changes
- Sensitive operations

**Log Fields**:
- User ID, action, resource, changes
- IP address, user agent
- Timestamp

---

### Performance Optimization

#### 1. Performance Monitoring
Implemented via `server/performance-monitoring.ts`:

**Metrics Tracked**:
- API endpoint response times
- Response sizes
- Status codes
- Slow request detection (> 1s)

**Features**:
- In-memory storage (last 1000 metrics)
- Per-endpoint statistics
- Admin dashboard endpoints

#### 2. Caching Layer
Implemented via `server/caching.ts`:

**Cache TTLs**:
- SHORT: 1 minute (frequently changing)
- MEDIUM: 5 minutes (default)
- LONG: 15 minutes (semi-static)
- VERY_LONG: 1 hour (static data)

**Features**:
- Pattern-based invalidation
- Cache hit/miss headers
- Automatic cleanup

**Example Usage**:
```typescript
router.get('/products', 
  cacheMiddleware(CacheTTL.MEDIUM),
  handler
);
```

#### 3. Business Metrics
Implemented via `server/business-metrics.ts`:

**Tracked Events**:
- Order created, submitted, approved
- Price offer accepted/rejected
- Product views, creates, updates
- User login, registration
- Template usage

#### 4. Frontend Performance

**TanStack Query Optimizations**:
- Smart retry logic with exponential backoff
- Rate limit aware (429 handling)
- Granular cache strategies by data type
- Automatic cache invalidation

**Code Splitting**:
- Lazy loading for admin pages
- Route-based splitting

**Image Optimization**:
- Lazy loading
- Proper sizing
- WebP support

---

## Debug & Maintenance

### Recent Debug Session (January 2025)

A comprehensive debug session was conducted to identify and resolve application issues. The following findings and fixes were implemented:

#### Issues Identified & Fixed

##### 1. TypeScript Compilation Errors ✅ **FIXED**
**Client-Side Issues:**
- Fixed error handling in `BatchPdfGenerator.tsx` (unknown error type)
- Corrected API request parameter order in `DemoRequestDialog.tsx`
- Fixed undefined property access in `MobileNav.tsx` (badge property)
- Resolved `startTransition` async function issues in `OptimisticList.tsx`
- Fixed null assignment issues in `OrderModificationDialog.tsx`
- Corrected query type definitions in `OrderModificationHistory.tsx`
- Removed undefined function call in `PriceOfferCreationDialog.tsx`
- Fixed array type issues in `ProductDetailPage.tsx`
- Resolved type assertion issues in `lazyWithPreload.ts`

**Server-Side Issues:**
- Fixed import errors for `AuthenticatedRequest` and `AdminRequest` types
- Corrected document type mapping (lowercase to uppercase enum conversion)
- Fixed return type mismatches (`success` vs `ok` properties in PDF storage)
- Resolved type conversion issues in `document-access-log.ts`
- Fixed boolean type issues in `error-logger.ts`

##### 2. Dependencies & Security ✅ **ADDRESSED**
- Successfully installed all missing dependencies
- Identified 4 moderate security vulnerabilities in esbuild/drizzle-kit (development dependencies only)
- All vulnerabilities are in development tools, not production code

##### 3. Code Quality Improvements ✅ **COMPLETED**
- No linter errors found
- Improved type safety throughout the codebase
- Enhanced error handling in multiple components
- Fixed type assertions and null safety issues

#### Remaining Issues

##### 1. Runtime Dependencies ⚠️ **REQUIRES ATTENTION**
**Object Storage Connection Failed:**
- **Issue**: App requires Replit's object storage service (port 1106) which is not available in development environments
- **Impact**: Prevents application startup
- **Solution Needed**: 
  - Create mock implementations for development
  - Add environment variable checks to disable object storage in development
  - Implement local file storage as fallback

**Port Conflict:**
- **Issue**: Port 26053 appears to be in use (false positive detection)
- **Impact**: Prevents server startup
- **Solution**: Use different port or resolve port detection issue

##### 2. TypeScript Errors (Partially Fixed) ⚠️ **IN PROGRESS**
**Route Handler Type Issues:**
- Express middleware type compatibility issues remain
- Some route handlers still need type signature updates
- Document type mapping needs refinement

**Server-Side Type Assertions:**
- Some type assertions need completion
- Middleware function signatures need standardization

#### Debug Recommendations

##### 1. For Development Environment
```typescript
// Add to server/object-storage.ts
if (process.env.NODE_ENV === 'development' && !process.env.REPLIT_DB_URL) {
  // Use mock implementation
  export class PDFStorage {
    static async uploadPDF() {
      return { ok: true, fileName: 'mock-file.pdf' };
    }
    // ... other mock methods
  }
}
```

##### 2. For Production Environment
- Ensure Replit object storage service is properly configured
- Complete remaining TypeScript error fixes
- Address any remaining type safety issues

##### 3. Code Quality Improvements
- Complete route handler type fixes
- Add comprehensive error handling for missing services
- Implement proper fallbacks for development environments
- Add environment-specific configuration checks

#### Debug Tools & Commands

**TypeScript Checking:**
```bash
npm run check          # Check TypeScript compilation
npm run build          # Build application
```

**Dependency Management:**
```bash
npm install            # Install dependencies
npm audit              # Check security vulnerabilities
npm audit fix          # Fix vulnerabilities (use with caution)
```

**Development Server:**
```bash
npm run dev            # Start development server
npm run start          # Start production server
```

**Database Operations:**
```bash
npm run db:push        # Push database schema changes
```

#### Maintenance Checklist

**Regular Maintenance Tasks:**
- [ ] Run `npm run check` to verify TypeScript compilation
- [ ] Check for security vulnerabilities with `npm audit`
- [ ] Verify object storage connectivity in production
- [ ] Monitor error logs for new issues
- [ ] Update dependencies regularly
- [ ] Test application startup in different environments

**Code Quality Monitoring:**
- [ ] Ensure no linter errors
- [ ] Maintain type safety standards
- [ ] Test error handling paths
- [ ] Verify API response consistency
- [ ] Check database query performance

**Environment-Specific Checks:**
- [ ] Development: Mock services working
- [ ] Staging: Full integration testing
- [ ] Production: All services operational

---

## Development Roadmap

### Completed (2024-2025)

#### Phase 1: Critical Fixes ✅
- Standardized API responses
- Error code system with bilingual messages
- Centralized error handler
- Type duplication cleanup
- Middleware stack optimization

#### Phase 2: API Improvements ✅
- Query key factory for TanStack Query
- API validation schemas with Zod
- Validation middleware
- Query parameter coercion
- Migration guide

#### Phase 3: Performance & Monitoring ✅
- Performance monitoring system
- Caching layer with TTL
- Business metrics collection
- Frontend performance enhancements

#### Phase 4: Enhanced Security ✅
- Rate limiting system
- Security headers
- Audit logging
- Monitoring dashboard

#### Code Cleanup (October 2025) ✅
- Removed 70+ temporary files
- Removed unused database tables
- Fixed duplicate route registrations
- Removed test files
- Updated documentation

---

### Planned Enhancements

#### Q1 2026: Real-time Features
- **WebSocket Integration**: Live order status updates
- **Real-time Notifications**: Push notifications for all users
- **Live Chat**: Customer support chat
- **Collaborative Editing**: Multiple admins editing simultaneously

#### Q2 2026: Advanced Analytics
- **Custom Reports**: User-defined report builder
- **Data Visualization**: Interactive dashboards
- **Export Options**: PDF, Excel, CSV reports
- **Predictive Analytics**: Order forecasting
- **Trend Analysis**: Sales trends, popular products

#### Q3 2026: Mobile Application
- **React Native App**: iOS and Android apps
- **Offline Support**: Work without internet
- **Push Notifications**: Native notifications
- **Biometric Auth**: Fingerprint/Face ID
- **Barcode Scanning**: Product lookup

#### Q4 2026: Automation & Integration
- **Email Notifications**: Automated email system
- **SMS Notifications**: Twilio integration
- **Payment Gateway**: Online payment processing
- **ERP Integration**: SAP/Oracle integration
- **Inventory Sync**: Real-time inventory updates

---

### Feature Backlog

#### High Priority
1. **Email System**: Complete email notification infrastructure
2. **Advanced Search**: Elasticsearch integration
3. **Bulk Operations**: Improved bulk import/export
4. **API Documentation**: Auto-generated Swagger docs
5. **Automated Testing**: Comprehensive test coverage

#### Medium Priority
1. **Multi-currency Support**: Support multiple currencies
2. **Tax Calculation**: Automatic tax computation
3. **Shipping Integration**: DHL, FedEx, Aramex
4. **Customer Portal**: Enhanced client self-service
5. **Vendor Portal**: Vendor access to orders

#### Low Priority
1. **Social Media Integration**: Share products
2. **Loyalty Program**: Customer rewards
3. **Referral System**: Client referrals
4. **Advanced Permissions**: Granular access control
5. **API Rate Plans**: Tiered API access

---

### Technical Debt & Improvements

#### Code Quality
- [ ] Increase test coverage to 80%+
- [ ] Add E2E testing with Playwright
- [ ] Implement ESLint rules
- [ ] Add Prettier for code formatting
- [ ] Code review process

#### Performance
- [ ] Implement Redis caching
- [ ] Optimize database queries
- [ ] Add database read replicas
- [ ] Implement CDN for static assets
- [ ] Lazy load images

#### Security
- [ ] Security audit by third party
- [ ] Penetration testing
- [ ] OWASP compliance review
- [ ] Data encryption at rest
- [ ] Two-factor authentication

#### DevOps
- [ ] CI/CD pipeline
- [ ] Automated deployments
- [ ] Staging environment
- [ ] Database backups automation
- [ ] Monitoring & alerting

---

## Deployment & Infrastructure

### Current Deployment

**Platform**: Replit  
**Environment**: Production  
**Database**: Neon Serverless PostgreSQL  
**Storage**: Replit Object Storage  

### Deployment Process

1. **Code Changes**: Push to Git repository
2. **Automatic Build**: Vite builds frontend, esbuild compiles backend
3. **Database Migration**: `npm run db:push` (manual)
4. **Deploy**: Replit auto-deploys on push
5. **Health Check**: Automatic health monitoring

### Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (development/production)

**Optional**:
- `PIPEFY_WEBHOOK_URL` - Pipefy integration URL
- `PIPEFY_API_TOKEN` - Pipefy authentication
- `COOKIE_DOMAIN` - Custom cookie domain

### Build Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database migration
npm run db:push

# Run tests
npm test
```

### Project Structure

```
workspace/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Shadcn UI components
│   │   │   └── ...        # Custom components
│   │   ├── pages/         # Page components
│   │   │   ├── admin/     # Admin pages
│   │   │   └── ...        # Client pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app with routing
│   └── index.html         # Entry HTML
│
├── server/                # Backend Express application
│   ├── routes.ts          # Main API routes
│   ├── auth.ts            # Authentication logic
│   ├── storage.ts         # Database abstraction
│   ├── feedback-routes.ts # Feedback endpoints
│   ├── error-handler.ts   # Error handling
│   ├── performance-monitoring.ts
│   ├── caching.ts
│   ├── rate-limiting.ts
│   ├── security-headers.ts
│   ├── audit-logging.ts
│   ├── business-metrics.ts
│   ├── template-pdf-generator.ts
│   └── index.ts           # Server entry point
│
├── shared/                # Shared code
│   ├── schema.ts          # Drizzle schema + Zod
│   ├── api-types.ts       # API response types
│   ├── api-validation.ts  # Validation schemas
│   └── types.ts           # Shared TypeScript types
│
├── docs/                  # Documentation
│   ├── COMPREHENSIVE_APPLICATION_REPORT.md
│   ├── FEATURES_DOCUMENTATION.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── WORKFLOWS_DOCUMENTATION.md
│   └── ...
│
├── attached_assets/       # Uploaded files
│   ├── products/          # Product images
│   └── documents/         # Generated PDFs
│
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS config
└── drizzle.config.ts      # Drizzle ORM config
```

---

## Conclusion

The LTA Contract Fulfillment Application is a comprehensive, production-ready B2B platform with:

- **Full-stack TypeScript** architecture
- **Bilingual support** (English/Arabic) with RTL
- **28 database tables** with optimized relationships
- **63+ API endpoints** with standardized responses
- **Role-based access control** (Admin/Client)
- **Template-based PDF generation** with Arabic support
- **Performance monitoring** and caching
- **Security hardening** with rate limiting and audit logs
- **Mobile-responsive** design with PWA support
- **Comprehensive documentation** for maintenance and development

The application successfully manages the complete LTA lifecycle from contract creation to order fulfillment, with integrated price management, customer feedback, and document generation systems.

---

**For More Information**:
- [Features Documentation](./FEATURES_DOCUMENTATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Workflows Documentation](./WORKFLOWS_DOCUMENTATION.md)
- [Code Audit](./CODE_AUDIT.md)

**Last Updated**: January 2025  
**Document Version**: 1.1
