# LTA Application - Database Schema Documentation

## Overview

This document provides comprehensive documentation for all database tables in the LTA Contract Fulfillment Application. The schema is managed using Drizzle ORM and PostgreSQL (Neon Serverless).

**Database**: PostgreSQL 15+  
**ORM**: Drizzle ORM  
**Migrations**: Drizzle Kit (`npm run db:push`)

---

## Table of Contents

1. [Entity Relationship Overview](#entity-relationship-overview)
2. [Core Tables](#core-tables)
3. [Business Logic Tables](#business-logic-tables)
4. [System Tables](#system-tables)
5. [Feedback & Analytics Tables](#feedback--analytics-tables)
6. [Document Management Tables](#document-management-tables)
7. [Indexes](#indexes)
8. [Constraints](#constraints)

---

## Entity Relationship Overview

```
┌──────────────┐
│   sessions   │ (Session storage)
└──────────────┘

┌──────────────┐        ┌──────────────────┐
│    users     │───┐    │  passwordReset   │
│              │   │    │     Tokens       │
└──────────────┘   │    └──────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│                        clients                            │
│  (Main client/company table)                             │
└───────────────┬──────────────────────────────────────────┘
                │
     ┌──────────┼──────────┬─────────────┬──────────────┐
     │          │          │             │              │
     ▼          ▼          ▼             ▼              ▼
┌─────────┐ ┌──────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
│ company │ │client│  │  client │  │  orders │  │ price    │
│  Users  │ │Dept. │  │Location │  │         │  │ Requests │
└─────────┘ └──────┘  └─────────┘  └────┬────┘  └────┬─────┘
                                        │             │
                                        ▼             ▼
                                  ┌──────────┐  ┌────────┐
                                  │  order   │  │ price  │
                                  │Feedback  │  │ Offers │
                                  └──────────┘  └────────┘

┌──────────────┐        ┌──────────────┐
│   vendors    │◄───────│  products    │
└──────────────┘        └───────┬──────┘
                                │
                                ▼
                        ┌──────────────┐
                        │     ltas     │
                        └──────┬───────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌───────────┐  ┌────────────┐  ┌─────────┐
         │    lta    │  │    lta     │  │   lta   │
         │  Products │  │  Clients   │  │Documents│
         └───────────┘  └────────────┘  └─────────┘

┌──────────────┐
│  templates   │ (PDF templates)
└──────────────┘

┌──────────────┐
│  documents   │ (Generated PDFs)
└──────────────┘

┌──────────────┐
│notifications │
└──────────────┘

┌──────────────┐
│issueReports  │
└──────────────┘

┌──────────────┐
│microFeedback │
└──────────────┘

┌──────────────┐
│demoRequests  │
└──────────────┘
```

---

## Core Tables

### 1. sessions

**Purpose**: Store Express session data using connect-pg-simple.

**Schema**:
```typescript
{
  sid: varchar (PRIMARY KEY)
  sess: jsonb (NOT NULL)
  expire: timestamp (NOT NULL)
}
```

**Indexes**:
- `IDX_session_expire` on `expire` (for cleanup queries)

**Notes**:
- Managed automatically by connect-pg-simple
- Sessions expire after 30 days
- Cleanup runs periodically to remove expired sessions

---

### 2. users

**Purpose**: Reserved for future multi-tenancy features (currently unused).

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  email: varchar (UNIQUE)
  firstName: varchar
  lastName: varchar
  profileImageUrl: varchar
  createdAt: timestamp (DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Current Usage**: Not actively used. The `clients` table serves as the primary user table.

---

### 3. clients

**Purpose**: Main table for client companies/organizations.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  userId: varchar (UNIQUE, reserved for future)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  username: text (NOT NULL, UNIQUE)
  password: text (NOT NULL, hashed with scrypt)
  email: text
  phone: text
  isAdmin: boolean (NOT NULL, DEFAULT false)
}
```

**Relationships**:
- Has many: `companyUsers`, `clientDepartments`, `clientLocations`, `orders`, `orderTemplates`, `priceRequests`, `priceOffers`, `ltaClients`

**Indexes**:
- UNIQUE on `username`
- UNIQUE on `userId`

**Security**:
- Passwords hashed with Node.js scrypt before storage
- Never returned in API responses

---

### 4. companyUsers

**Purpose**: Multi-user access for companies (multiple employees per company).

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  companyId: varchar (NOT NULL, FK → clients.id, CASCADE DELETE)
  username: text (NOT NULL, UNIQUE)
  password: text (NOT NULL, hashed)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  email: text
  phone: text
  departmentType: text ('finance', 'purchase', 'warehouse', null)
  isActive: boolean (NOT NULL, DEFAULT true)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Relationships**:
- Belongs to: `clients` (companyId)

**Indexes**:
- UNIQUE on `username`
- Foreign key on `companyId`

---

### 5. passwordResetTokens

**Purpose**: Store password reset tokens for forgot password functionality.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  email: text (NOT NULL)
  token: text (NOT NULL, UNIQUE)
  expiresAt: timestamp (NOT NULL)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Indexes**:
- UNIQUE on `token`

**Notes**:
- Tokens expire after 1 hour
- One-time use only
- Deleted after successful password reset

---

## Business Logic Tables

### 6. clientDepartments

**Purpose**: Track client organization departments (finance, purchasing, warehouse).

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  clientId: varchar (NOT NULL)
  departmentType: text (NOT NULL, 'finance' | 'purchase' | 'warehouse')
  contactName: text
  contactEmail: text
  contactPhone: text
}
```

**Relationships**:
- Belongs to: `clients` (clientId)

---

### 7. clientLocations

**Purpose**: Client delivery addresses and branch locations.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  clientId: varchar (NOT NULL)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  addressEn: text (NOT NULL)
  addressAr: text (NOT NULL)
  city: text
  country: text
  latitude: decimal(10, 8)
  longitude: decimal(11, 8)
  isHeadquarters: boolean (DEFAULT false)
  phone: text
}
```

**Relationships**:
- Belongs to: `clients` (clientId)

**Notes**:
- Geolocation support (latitude/longitude)
- One location can be marked as headquarters

---

### 8. vendors

**Purpose**: Product suppliers/vendors.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  vendorNumber: text (NOT NULL, UNIQUE)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  contactEmail: text
  contactPhone: text
  address: text
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Relationships**:
- Has many: `products`

**Indexes**:
- UNIQUE on `vendorNumber`

---

### 9. products

**Purpose**: Master product catalog.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  sku: text (NOT NULL, UNIQUE)
  nameAr: text (NOT NULL)
  nameEn: text (NOT NULL)
  categoryNum: text
  unitType: text
  unit: text
  unitPerBox: text
  costPricePerBox: decimal(10, 2)
  specificationsAr: text
  vendorId: varchar (FK → vendors.id, SET NULL)
  mainCategory: text
  category: text
  costPricePerPiece: decimal(10, 2)
  sellingPricePack: decimal(10, 2)
  sellingPricePiece: decimal(10, 2)
  imageUrl: text
  imageUrls: jsonb (array of image URLs)
  descriptionEn: text
  descriptionAr: text
}
```

**Relationships**:
- Belongs to: `vendors` (vendorId, optional)
- Many-to-many with `ltas` via `ltaProducts`

**Indexes**:
- UNIQUE on `sku`
- Foreign key on `vendorId`

**Notes**:
- `imageUrls` is a JSONB array for multiple product images
- Pricing fields are decimals (10, 2) for currency accuracy

---

### 10. ltas

**Purpose**: Long-Term Agreement contracts.

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  descriptionEn: text
  descriptionAr: text
  startDate: timestamp (NOT NULL)
  endDate: timestamp (NOT NULL)
  status: text (NOT NULL, DEFAULT 'active')
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Relationships**:
- Many-to-many with `products` via `ltaProducts`
- Many-to-many with `clients` via `ltaClients`
- Has many: `ltaDocuments`, `priceRequests`, `priceOffers`, `orders`

**Notes**:
- Status typically 'active' or 'inactive'
- Contract period defined by startDate and endDate

---

### 11. ltaProducts

**Purpose**: Junction table linking LTAs to products with contract pricing.

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  ltaId: uuid (NOT NULL, FK → ltas.id, RESTRICT DELETE)
  productId: varchar (NOT NULL, FK → products.id, CASCADE DELETE)
  contractPrice: decimal(10, 2) (NOT NULL)
  currency: text (NOT NULL, DEFAULT 'USD')
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Constraints**:
- UNIQUE (ltaId, productId) - Cannot assign same product twice to same LTA

**Relationships**:
- Belongs to: `ltas`, `products`

**Notes**:
- Defines product pricing specific to each LTA
- Historical orders maintain original prices even if contract prices change

---

### 12. ltaClients

**Purpose**: Junction table linking LTAs to authorized clients.

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  ltaId: uuid (NOT NULL, FK → ltas.id, RESTRICT DELETE)
  clientId: varchar (NOT NULL, FK → clients.id, CASCADE DELETE)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Constraints**:
- UNIQUE (ltaId, clientId) - Cannot assign same client twice to same LTA

**Relationships**:
- Belongs to: `ltas`, `clients`

**Notes**:
- Controls which clients can access which LTAs
- Clients only see products from their assigned LTAs

---

### 13. clientPricing

**Purpose**: Client-specific pricing (imported via CSV).

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  clientId: varchar (NOT NULL)
  productId: varchar (NOT NULL)
  price: decimal(10, 2) (NOT NULL)
  currency: text (NOT NULL, DEFAULT 'USD')
  importedAt: timestamp (DEFAULT NOW)
}
```

**Notes**:
- Alternative to LTA pricing
- Used for bulk price imports
- Less commonly used than LTA pricing system

---

### 14. orderTemplates

**Purpose**: Saved order templates for quick reordering.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  clientId: varchar (NOT NULL)
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  items: text (NOT NULL, JSON string)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Relationships**:
- Belongs to: `clients` (clientId)

**Notes**:
- `items` is a JSON string storing product IDs and quantities
- Enables one-click reordering of common order combinations

---

### 15. orders

**Purpose**: Customer purchase orders.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  clientId: varchar (NOT NULL)
  ltaId: uuid (FK → ltas.id, RESTRICT DELETE)
  items: text (NOT NULL, JSON string)
  totalAmount: decimal(10, 2) (NOT NULL)
  status: text (NOT NULL, DEFAULT 'pending')
  pipefyCardId: text
  cancellationReason: text
  cancelledAt: timestamp
  cancelledBy: varchar
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  updatedAt: timestamp (DEFAULT NOW)
}
```

**Order Statuses**:
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by admin
- `processing` - Being processed
- `shipped` - In transit
- `delivered` - Completed
- `cancelled` - Cancelled
- `modification_requested` - Client requested changes

**Relationships**:
- Belongs to: `clients`, `ltas`
- Has many: `orderModifications`, `orderFeedback`, `orderHistory`

**Notes**:
- `items` is JSON string with product details, quantities, prices
- `pipefyCardId` stores external Pipefy card ID after webhook
- Single-LTA rule enforced: all items must belong to same LTA

---

### 16. orderModifications

**Purpose**: Client requests to modify or cancel orders.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  orderId: varchar (NOT NULL, FK → orders.id, CASCADE DELETE)
  requestedBy: varchar (NOT NULL, client ID)
  modificationType: text (NOT NULL, 'items' | 'cancel' | 'both')
  newItems: text (JSON string, if modifying items)
  newTotalAmount: decimal(10, 2)
  reason: text (NOT NULL)
  status: text (NOT NULL, DEFAULT 'pending')
  adminResponse: text
  reviewedBy: varchar (admin ID)
  reviewedAt: timestamp
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Modification Statuses**:
- `pending` - Awaiting review
- `approved` - Approved by admin
- `rejected` - Rejected by admin

**Relationships**:
- Belongs to: `orders`

**Notes**:
- Admin can approve/reject with response notes
- If approved, order is updated with new items/amounts

---

### 17. orderHistory

**Purpose**: Audit trail of order status changes.

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  orderId: varchar (NOT NULL, FK → orders.id, CASCADE DELETE)
  status: text (NOT NULL)
  changedBy: varchar (NOT NULL, client/admin ID)
  changedAt: timestamp (NOT NULL, DEFAULT NOW)
  notes: text
  isAdminNote: boolean (NOT NULL, DEFAULT false)
}
```

**Relationships**:
- Belongs to: `orders`

**Notes**:
- Immutable audit log
- Tracks who changed status and when
- Distinguishes admin notes from system-generated entries

---

### 18. priceRequests

**Purpose**: Client-initiated price quote requests.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  requestNumber: text (NOT NULL, UNIQUE, format: PR-{timestamp}-{count})
  clientId: varchar (NOT NULL, FK → clients.id, RESTRICT DELETE)
  ltaId: uuid (NOT NULL, FK → ltas.id, RESTRICT DELETE)
  products: jsonb (NOT NULL, array of {productId, quantity})
  notes: text
  status: text (NOT NULL, DEFAULT 'pending')
  requestedAt: timestamp (NOT NULL, DEFAULT NOW)
  processedAt: timestamp
}
```

**Request Statuses**:
- `pending` - Awaiting admin response
- `processed` - Admin created offer
- `cancelled` - Request cancelled

**Relationships**:
- Belongs to: `clients`, `ltas`
- May have: `priceOffers` (via requestId)

**Notes**:
- `products` is JSONB array for flexible product selections
- Auto-generated request number for tracking

---

### 19. priceOffers

**Purpose**: Admin-created price quotations with PDF generation.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  offerNumber: text (NOT NULL, UNIQUE, format: PO-{timestamp}-{count})
  requestId: varchar (FK → priceRequests.id, SET NULL, optional)
  clientId: varchar (NOT NULL, FK → clients.id, RESTRICT DELETE)
  ltaId: uuid (NOT NULL, FK → ltas.id, RESTRICT DELETE)
  items: jsonb (NOT NULL, array of offer items)
  subtotal: decimal(12, 2) (NOT NULL)
  tax: decimal(12, 2) (NOT NULL, DEFAULT 0)
  total: decimal(12, 2) (NOT NULL)
  notes: text
  validUntil: timestamp (NOT NULL)
  status: text (NOT NULL, DEFAULT 'draft')
  pdfFileName: text
  createdBy: varchar (FK → clients.id, SET NULL, admin who created)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  sentAt: timestamp
  viewedAt: timestamp
  respondedAt: timestamp
  responseNote: text
}
```

**Offer Statuses**:
- `draft` - Being prepared
- `sent` - Sent to client (PDF generated)
- `viewed` - Client opened offer
- `accepted` - Client accepted
- `rejected` - Client rejected
- `expired` - Past validity date

**Relationships**:
- Belongs to: `clients`, `ltas`
- Optional link to: `priceRequests`

**Notes**:
- `items` is JSONB with product details, quantities, prices
- PDF generated when status changes from draft → sent
- Auto-generated offer number for tracking

---

## System Tables

### 20. notifications

**Purpose**: In-app notification system.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  clientId: varchar (FK → clients.id, CASCADE DELETE)
  type: text (NOT NULL, 'system' | 'order' | 'feedback' | 'price')
  titleEn: text (NOT NULL)
  titleAr: text (NOT NULL)
  messageEn: text (NOT NULL)
  messageAr: text (NOT NULL)
  isRead: boolean (DEFAULT false)
  metadata: jsonb (optional context data)
  createdAt: timestamp (DEFAULT NOW)
}
```

**Relationships**:
- Belongs to: `clients`

**Notes**:
- Bilingual notification content
- `metadata` can store related IDs (orderId, offerId, etc.)
- Not deleted when read, only marked as read

---

### 21. templates

**Purpose**: PDF document templates (price offers, invoices, contracts, etc.).

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  nameEn: text (NOT NULL)
  nameAr: text (NOT NULL)
  descriptionEn: text
  descriptionAr: text
  category: text (NOT NULL, enum)
  language: text (NOT NULL, 'en' | 'ar' | 'both', DEFAULT 'both')
  sections: jsonb (NOT NULL, template structure)
  variables: jsonb (NOT NULL, dynamic data placeholders)
  styles: jsonb (NOT NULL, fonts, colors, spacing)
  isActive: boolean (NOT NULL, DEFAULT true)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  updatedAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Categories**:
- `price_offer` - Price quotation templates
- `order` - Order confirmation templates
- `invoice` - Invoice templates
- `contract` - LTA contract templates
- `report` - Report templates
- `other` - Custom templates

**Notes**:
- Only ONE template per category can be active at a time
- `sections` defines document structure (header, body, footer, tables)
- `variables` defines dynamic data replacements
- `styles` defines visual appearance

---

### 22. documents

**Purpose**: Comprehensive document management and storage.

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  fileName: text (NOT NULL)
  fileUrl: text (NOT NULL, Object Storage URL)
  documentType: text (NOT NULL)
  clientId: varchar (FK → clients.id, SET NULL)
  ltaId: uuid (FK → ltas.id, SET NULL)
  orderId: varchar (FK → orders.id, SET NULL)
  priceOfferId: varchar (FK → priceOffers.id, SET NULL)
  fileSize: integer (bytes)
  viewCount: integer (NOT NULL, DEFAULT 0)
  checksum: text (SHA-256 or MD5 hash)
  metadata: jsonb
  parentDocumentId: uuid (self-reference for versions)
  versionNumber: integer (NOT NULL, DEFAULT 1)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  lastViewedAt: timestamp
}
```

**Document Types**:
- `price_offer`
- `order`
- `invoice`
- `contract`
- `lta_document`
- `other`

**Relationships**:
- Optional links to: `clients`, `ltas`, `orders`, `priceOffers`

**Notes**:
- Stores metadata about all generated/uploaded PDFs
- Tracks view count and last viewed timestamp
- Supports document versioning via parentDocumentId

---

### 23. documentAccessLogs

**Purpose**: Audit trail for document access (view/download).

**Schema**:
```typescript
{
  id: uuid (PRIMARY KEY, DEFAULT gen_random_uuid())
  documentId: uuid (NOT NULL, FK → documents.id, CASCADE DELETE)
  clientId: varchar (FK → clients.id, SET NULL)
  action: text (NOT NULL, 'view' | 'download' | 'generate')
  ipAddress: text
  userAgent: text
  accessedAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Relationships**:
- Belongs to: `documents`
- Optionally linked to: `clients`

**Notes**:
- Immutable log for compliance/auditing
- Captures IP and user agent for security

---

### 24. pushSubscriptions

**Purpose**: PWA push notification subscriptions.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  userId: varchar (NOT NULL, companyId or companyUserId)
  userType: text (NOT NULL, 'client' | 'company_user')
  endpoint: text (NOT NULL, UNIQUE)
  keys: jsonb (NOT NULL, {p256dh: string, auth: string})
  userAgent: text
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  updatedAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Indexes**:
- UNIQUE on `endpoint`

**Notes**:
- Stores Web Push API subscription details
- Used for browser push notifications

---

## Feedback & Analytics Tables

### 25. orderFeedback

**Purpose**: Customer feedback on delivered orders.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  orderId: varchar (NOT NULL, FK → orders.id, CASCADE DELETE)
  clientId: varchar (NOT NULL, FK → users.id, CASCADE DELETE)
  rating: integer (NOT NULL, 1-5)
  orderingProcessRating: integer (1-5)
  productQualityRating: integer (1-5)
  deliverySpeedRating: integer (1-5)
  communicationRating: integer (1-5)
  comments: text
  wouldRecommend: boolean (NOT NULL)
  adminResponse: text
  adminResponseAt: timestamp
  respondedBy: varchar (FK → users.id)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Relationships**:
- Belongs to: `orders`, `users`

**Notes**:
- One feedback per order maximum
- Triggered 1 hour after delivery
- Completely separate from issue reports
- Used for NPS calculation and analytics

**NPS Categories**:
- Rating 5 = Promoter
- Rating 4 = Passive
- Rating 1-3 = Detractor

---

### 26. issueReports

**Purpose**: Bug/problem reporting system.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  userId: varchar (NOT NULL)
  userType: text (NOT NULL, 'client' | 'company_user')
  orderId: varchar (optional link to order)
  issueType: text (NOT NULL)
  severity: text (NOT NULL, 'low' | 'medium' | 'high' | 'critical')
  priority: text (DEFAULT 'medium', enum)
  title: text (NOT NULL)
  description: text (NOT NULL)
  steps: text (steps to reproduce)
  expectedBehavior: text
  actualBehavior: text
  browserInfo: text (NOT NULL, user agent)
  screenSize: text (NOT NULL)
  screenshots: jsonb (array of image URLs)
  status: text (NOT NULL, DEFAULT 'open')
  assignedTo: varchar (admin ID)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  resolvedAt: timestamp
}
```

**Issue Types**:
- `bug`
- `feature_request`
- `performance`
- `usability`
- `content`
- `other`

**Issue Statuses**:
- `open` - Newly reported
- `in_progress` - Being worked on
- `resolved` - Fixed
- `closed` - Completed

**Notes**:
- ALL admins notified for EVERY issue (regardless of severity)
- Completely separate from order feedback
- Screenshots stored as JSONB array of URLs

---

### 27. microFeedback

**Purpose**: Touchpoint-based micro-feedback collection.

**Schema**:
```typescript
{
  id: varchar (PRIMARY KEY, DEFAULT gen_random_uuid())
  userId: varchar (NOT NULL)
  touchpoint: text (NOT NULL, feature/page identifier)
  sentiment: text (NOT NULL, 'positive' | 'neutral' | 'negative')
  quickResponse: text
  context: jsonb
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
}
```

**Notes**:
- Lightweight sentiment tracking
- Currently minimally used
- Future enhancement opportunity

---

### 28. demoRequests

**Purpose**: Store demo requests from landing page.

**Schema**:
```typescript
{
  id: serial (PRIMARY KEY)
  name: text (NOT NULL)
  email: text (NOT NULL)
  phone: text (NOT NULL)
  company: text (NOT NULL)
  message: text
  status: text (NOT NULL, DEFAULT 'pending')
  notes: text (admin notes)
  createdAt: timestamp (NOT NULL, DEFAULT NOW)
  updatedAt: timestamp
}
```

**Demo Statuses**:
- `pending` - New request
- `contacted` - Admin reached out
- `scheduled` - Demo scheduled
- `completed` - Demo completed
- `cancelled` - Request cancelled

**Notes**:
- Only table using `serial` ID (auto-incrementing integer)
- Public-facing (no authentication required)

---

## Indexes

### Automatically Created Indexes

1. **Primary Keys** - All tables have indexed primary keys
2. **Unique Constraints** - All UNIQUE columns have indexes
3. **Foreign Keys** - Drizzle creates indexes on foreign key columns

### Explicitly Defined Indexes

1. **sessions.expire** - `IDX_session_expire` for efficient cleanup queries

### Recommended Additional Indexes (Future)

```sql
-- For frequent queries
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_notifications_client_read ON notifications(client_id, is_read);
CREATE INDEX idx_lta_products_lta_id ON lta_products(lta_id);
CREATE INDEX idx_lta_clients_client_id ON lta_clients(client_id);
```

---

## Constraints

### Foreign Key Constraints

| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| companyUsers | companyId | clients.id | CASCADE |
| ltaProducts | ltaId | ltas.id | RESTRICT |
| ltaProducts | productId | products.id | CASCADE |
| ltaClients | ltaId | ltas.id | RESTRICT |
| ltaClients | clientId | clients.id | CASCADE |
| orders | ltaId | ltas.id | RESTRICT |
| orderModifications | orderId | orders.id | CASCADE |
| orderHistory | orderId | orders.id | CASCADE |
| orderFeedback | orderId | orders.id | CASCADE |
| orderFeedback | clientId | users.id | CASCADE |
| priceRequests | clientId | clients.id | RESTRICT |
| priceRequests | ltaId | ltas.id | RESTRICT |
| priceOffers | clientId | clients.id | RESTRICT |
| priceOffers | ltaId | ltas.id | RESTRICT |
| documents | documentId | documents.id | CASCADE |
| notifications | clientId | clients.id | CASCADE |
| products | vendorId | vendors.id | SET NULL |

**Delete Behaviors**:
- **CASCADE**: Child records deleted when parent deleted
- **RESTRICT**: Prevents deletion if child records exist
- **SET NULL**: Sets foreign key to NULL when parent deleted

---

### Unique Constraints

| Table | Columns | Purpose |
|-------|---------|---------|
| clients | username | Prevent duplicate usernames |
| companyUsers | username | Prevent duplicate usernames |
| vendors | vendorNumber | Unique vendor identifiers |
| products | sku | Unique product identifiers |
| ltaProducts | (ltaId, productId) | Cannot assign same product twice to LTA |
| ltaClients | (ltaId, clientId) | Cannot assign same client twice to LTA |
| priceRequests | requestNumber | Unique request tracking |
| priceOffers | offerNumber | Unique offer tracking |
| passwordResetTokens | token | One token per reset request |
| pushSubscriptions | endpoint | One subscription per endpoint |

---

## Data Types

### Text Types
- **text**: Variable-length text (unlimited)
- **varchar**: Variable-length text with limit
- Both support full Unicode including Arabic

### Numeric Types
- **integer**: 4-byte integer
- **serial**: Auto-incrementing integer (only used in demoRequests)
- **decimal(p, s)**: Exact decimal (e.g., decimal(10, 2) for currency)

### Date/Time Types
- **timestamp**: Date and time without timezone
- All timestamps stored in UTC

### Special Types
- **boolean**: TRUE/FALSE values
- **jsonb**: Binary JSON (indexed, efficient queries)
- **uuid**: Universally unique identifier

---

## Migrations

**Tool**: Drizzle Kit

**Commands**:
```bash
# Push schema changes to database
npm run db:push

# Force push (for development only)
npm run db:push --force

# Generate migration files (not used in this project)
npm run db:generate
```

**Migration Strategy**:
- Schema-first: Define in `shared/schema.ts`
- Push directly to database (no manual SQL migrations)
- Drizzle handles type safety and validation

**CRITICAL RULES**:
1. **NEVER change primary key ID types** (serial ↔ varchar)
2. **Check existing schema before changes**
3. **Use `--force` only in development**

---

## Data Integrity

### Referential Integrity
- Enforced via foreign keys
- Cascade deletes where appropriate
- Restrict deletes for critical relationships (LTAs, orders)

### Data Validation
- Zod schemas validate data before database insertion
- Database constraints provide second layer of validation
- Password hashing enforced at application layer

### Transaction Support
- PostgreSQL ACID compliance
- Drizzle supports transactions for multi-table operations
- Example: Bulk product assignment uses transactions

---

## Performance Considerations

### Current Optimizations
1. **Indexes on primary/foreign keys** - Automatic
2. **Session index on expire** - Efficient cleanup
3. **JSONB for flexible data** - Better than text/JSON
4. **Decimal for currency** - Exact precision (no floating point errors)

### Future Optimizations
1. Add composite indexes for common query patterns
2. Implement pagination for large result sets
3. Add database-level partitioning for order history
4. Consider materialized views for analytics queries

---

## Backup & Recovery

**Neon PostgreSQL Features**:
- Automatic daily backups
- Point-in-time recovery
- Replication for high availability

**Replit Features**:
- Database rollback via checkpoints
- Includes schema and data

---

## Summary

This database schema supports:
- ✅ **28 tables** with clear relationships
- ✅ **Multi-tenancy ready** (users + clients + companyUsers)
- ✅ **LTA-centric pricing** with contract enforcement
- ✅ **Comprehensive audit trails** (orderHistory, documentAccessLogs)
- ✅ **Bilingual content** (all user-facing text in EN/AR)
- ✅ **Flexible JSON storage** for dynamic data
- ✅ **Strong referential integrity** via foreign keys
- ✅ **Performance optimization** via indexes
- ✅ **Type safety** with Drizzle ORM

The schema is designed for:
- Scalability (JSONB for flexibility)
- Data integrity (constraints and validations)
- Audit compliance (immutable logs)
- Multi-language support (bilingual fields)
- Future extensibility (reserved fields, flexible metadata)
