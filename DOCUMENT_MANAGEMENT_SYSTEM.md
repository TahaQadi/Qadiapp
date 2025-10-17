
# Document Management System

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Document Flow](#document-flow)
5. [Template System](#template-system)
6. [Security & Access Control](#security--access-control)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [UI Components](#ui-components)
10. [Bilingual Support](#bilingual-support)

---

## System Overview

The document management system is a comprehensive PDF generation and access control infrastructure designed for multi-tenant, bilingual business operations. It handles the complete lifecycle of business documents including price offers, orders, invoices, and contracts.

### Key Features
- ✅ Professional PDF generation with company branding
- ✅ Template-based document creation
- ✅ Secure token-based access control
- ✅ Complete audit trail and version tracking
- ✅ Bilingual support (English/Arabic)
- ✅ Document integrity validation
- ✅ Persistent object storage

---

## Architecture

### System Layers

```
┌─────────────────────────────────────────┐
│         Client UI Components            │
│  (AdminDocumentsPage, TemplateEditor)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          API Routes Layer               │
│     (Document CRUD, Token Gen)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Business Logic Layer              │
│  (PDF Gen, Access Control, Templates)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Data Storage Layer              │
│    (PostgreSQL + Object Storage)        │
└─────────────────────────────────────────┘
```

---

## Core Components

### 1. PDF Generation Layer

**Files:**
- `server/pdf-generator.ts` - Core PDF creation engine
- `server/template-generator.ts` - Template-based document generation
- `server/template-storage.ts` - Template persistence

**Capabilities:**
- Professional letterhead with logo
- Bilingual content (English/Arabic)
- Dynamic table generation
- Custom styling and branding
- Variable substitution

### 2. Access Control Layer

**Files:**
- `server/pdf-access-control.ts` - Token-based security
- `server/document-access-log.ts` - Audit logging

**Security Features:**
- HMAC-SHA256 signed tokens
- 2-hour token expiry
- Client-document ownership validation
- IP and User-Agent tracking
- Admin override permissions

### 3. Storage Layer

**Files:**
- `server/object-storage.ts` - Persistent file storage
- `server/storage.ts` - Database operations

**Storage Features:**
- SHA-256 checksum validation
- Metadata management
- Version tracking
- File integrity verification

---

## Document Flow

### 1. Price Request → Price Offer Workflow

```
Client Request → Admin Review → Product Assignment → PDF Generation
    ↓                ↓                  ↓                 ↓
Price Request    Assign LTA        Set Prices      Create Offer
Database         Products          Contract         Upload PDF
                                   Prices           Link Records
```

**Detailed Steps:**
1. Client submits price request for products
2. Admin assigns products to LTA with contract prices
3. Admin generates price offer via API endpoint
4. System performs:
   - Creates unique offer number (e.g., `PO-2025-0001`)
   - Generates professional PDF with company letterhead
   - Uploads to Object Storage with checksum
   - Creates document metadata record
   - Links to price offer in database
   - Sends notification to client

### 2. Document Access Workflow

```
User Request → Permission Check → Token Generation → Download
     ↓               ↓                   ↓              ↓
Document ID    Verify Ownership    HMAC Signature   Stream PDF
               Check Expiry        Encrypt Data     Log Access
```

**Security Checks:**
1. Validate token signature (HMAC-SHA256)
2. Check token expiry (2-hour window)
3. Verify user permissions (owner or admin)
4. Validate file integrity (checksum)
5. Log access (IP, user agent, action)
6. Stream PDF buffer to client

---

## Template System

### Template Structure

```json
{
  "nameEn": "Price Offer Template",
  "nameAr": "قالب عرض السعر",
  "category": "price_offer",
  "language": "both",
  "sections": [
    {
      "type": "header",
      "content": {...}
    },
    {
      "type": "table",
      "columns": [...],
      "rows": [...]
    }
  ],
  "variables": [
    "companyName",
    "clientName",
    "date",
    "offerNumber"
  ],
  "styles": {
    "primaryColor": "#d4af37",
    "fontSize": 12,
    "margins": 20
  }
}
```

### Template Categories

| Category | Description | Use Case |
|----------|-------------|----------|
| `price_offer` | Professional quotes | Client pricing |
| `order` | Order confirmations | Purchase orders |
| `invoice` | Billing documents | Payment requests |
| `contract` | Legal agreements | LTA contracts |

### Section Types

| Type | Purpose | Example |
|------|---------|---------|
| `header` | Company letterhead | Logo, contact info |
| `body` | Text content | Introduction, terms |
| `table` | Tabular data | Product lists |
| `terms` | Terms & Conditions | Numbered clauses |
| `signature` | Sign-off blocks | Multi-party signatures |
| `footer` | Page footer | Legal text, page numbers |
| `divider` | Visual separator | Horizontal line |
| `spacer` | Layout spacing | Vertical space |
| `image` | Graphics | Logo, diagrams |

### Variable Substitution

Variables are replaced dynamically during PDF generation:

```javascript
// Template variable
"{{clientName}}"

// Substituted value
"Al Qadi Trading Co."
```

**Available Variables:**
- `{{companyName}}`, `{{companyNameAr}}`
- `{{clientName}}`, `{{clientNameAr}}`
- `{{date}}`, `{{offerNumber}}`
- `{{totalAmount}}`, `{{currency}}`
- Custom variables per template

---

## Security & Access Control

### Token-Based Downloads

**Token Structure:**
```typescript
{
  documentId: string;
  clientId: string;
  expiresAt: number;
  signature: string; // HMAC-SHA256
}
```

**Generation Flow:**
1. User requests download for document ID
2. System validates permissions
3. Creates token with encrypted payload
4. Signs with HMAC-SHA256 secret
5. Returns time-limited URL (2 hours)

**Verification Flow:**
1. Extract token from query parameter
2. Verify HMAC signature
3. Check expiry timestamp
4. Validate client-document ownership
5. Stream file if valid

### Document Integrity

**Checksum Validation:**
- SHA-256 hash generated on upload
- Stored in metadata
- Verified on download
- Detects file corruption

**File Validation:**
```typescript
// Check PDF header
if (!buffer.toString('utf-8', 0, 4).startsWith('%PDF')) {
  throw new Error('Invalid PDF file');
}
```

### Audit Logging

**Logged Events:**
- `view` - Document viewed
- `download` - Document downloaded
- `generate` - Document created

**Logged Data:**
- User ID and role
- IP address
- User agent
- Timestamp
- Action type

---

## API Endpoints

### Admin Endpoints

#### Document Search
```http
GET /api/admin/documents/search
Query Params:
  - searchTerm: string
  - documentType: string
  - startDate: string
  - endDate: string
```

#### Document Details
```http
GET /api/admin/documents/:id
Response: {
  id, fileName, fileUrl, documentType,
  clientId, ltaId, fileSize, viewCount,
  createdAt, checksum, metadata
}
```

#### Version History
```http
GET /api/admin/documents/:id/versions
Response: [{
  id, versionNumber, createdAt,
  fileName, fileUrl, checksum
}]
```

#### Access Logs
```http
GET /api/admin/documents/:id/accessLogs
Response: [{
  id, userId, action, timestamp,
  ipAddress, userAgent
}]
```

#### Generate Price Offer
```http
POST /api/admin/price-requests/:id/generate-pdf
Response: {
  offerId, offerNumber, fileUrl
}
```

### Template Endpoints

#### List Templates
```http
GET /api/admin/templates?category=price_offer
Response: [{
  id, nameEn, nameAr, category,
  sections, variables, styles
}]
```

#### Create Template
```http
POST /api/admin/templates
Body: {
  nameEn, nameAr, category,
  sections[], variables[], styles{}
}
```

#### Duplicate Template
```http
POST /api/admin/templates/:id/duplicate
Response: { id, nameEn, nameAr, ... }
```

### Client Endpoints

#### View Price Offers
```http
GET /api/client/price-offers
Response: [{
  id, offerNumber, status, totalAmount,
  pdfUrl, createdAt, viewedAt
}]
```

#### Request Download Token
```http
POST /api/pdf/generate-token/:documentId
Response: {
  token: string,
  expiresAt: number
}
```

#### Download Document
```http
GET /api/pdf/download/:fileName?token=xxx
Response: PDF file stream
```

---

## Database Schema

### Tables

#### `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  lta_id UUID REFERENCES ltas(id),
  order_id UUID REFERENCES orders(id),
  price_offer_id UUID REFERENCES price_offers(id),
  file_size BIGINT,
  view_count INTEGER DEFAULT 0,
  checksum TEXT,
  metadata JSONB,
  parent_document_id UUID REFERENCES documents(id),
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  last_viewed_at TIMESTAMP
);
```

#### `templates`
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT DEFAULT 'both',
  sections JSONB NOT NULL,
  variables JSONB,
  styles JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `price_offers`
```sql
CREATE TABLE price_offers (
  id UUID PRIMARY KEY,
  offer_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  lta_id UUID REFERENCES ltas(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  pdf_url TEXT,
  document_id UUID REFERENCES documents(id),
  valid_until DATE,
  viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `document_access_logs`
```sql
CREATE TABLE document_access_logs (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  client_id UUID REFERENCES clients(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP DEFAULT NOW()
);
```

---

## UI Components

### Admin Components

#### AdminDocumentsPage
**Location:** `client/src/pages/AdminDocumentsPage.tsx`

**Features:**
- Advanced search and filtering
- Document type badges
- View count tracking
- Version history dialog
- Access logs viewer
- Bulk actions

**Filter Options:**
- Search term (filename, client)
- Document type (price_offer, order, invoice, contract)
- Date range (start/end dates)

#### AdminTemplatesPage
**Location:** `client/src/pages/AdminTemplatesPage.tsx`

**Features:**
- Template CRUD operations
- Visual template builder
- JSON section editor
- Live preview
- Duplicate templates
- Category filtering

#### TemplateEditor
**Location:** `client/src/components/TemplateEditor.tsx`

**Features:**
- Drag-and-drop sections
- Variable picker
- Style customization
- Section type selector
- Validation rules

#### BatchPdfGenerator
**Location:** `client/src/components/BatchPdfGenerator.tsx`

**Features:**
- Bulk document generation
- Client selection
- Progress tracking
- Error handling

### Client Components

#### ClientPriceOffersPage
**Features:**
- View assigned offers
- Download with token auth
- Status indicators
- Offer details modal

---

## Bilingual Support

### Language Configuration

**Supported Languages:**
- English (`en`)
- Arabic (`ar`)
- Both (`both`) - side-by-side

### Implementation

**Template Language Field:**
```json
{
  "language": "both",
  "nameEn": "Price Offer",
  "nameAr": "عرض السعر"
}
```

**Variable Fallbacks:**
```typescript
const name = client.nameAr || client.nameEn;
```

**RTL Layout:**
- Arabic sections use right-to-left layout
- Proper font rendering (Amiri, Noto Sans Arabic)
- Culturally appropriate formatting

**Date Formatting:**
- English: `January 15, 2025`
- Arabic: `١٥ يناير ٢٠٢٥`

**Number Formatting:**
- Western numerals for English
- Arabic-Indic numerals for Arabic

---

## Document Lifecycle

### 1. Creation Phase
```
Template + Variables → PDF Buffer → Object Storage → Database Record
```

**Steps:**
1. Select template
2. Populate variables
3. Generate PDF buffer
4. Calculate checksum
5. Upload to storage
6. Create metadata record
7. Link relationships

### 2. Storage Phase
```
File Upload → Checksum Validation → Metadata Storage → Relationship Linking
```

**Metadata:**
- File size, type, MIME
- Checksum (SHA-256)
- Client/LTA associations
- Creation timestamp

### 3. Access Phase
```
Permission Check → Token Generation → Secure Download → Audit Log
```

**Access Control:**
- Owner validation
- Admin override
- Token expiry check
- Signature verification

### 4. Versioning Phase
```
Document Update → New Version → Parent Linking → History Tracking
```

**Version Management:**
- Parent document reference
- Incremental version numbers
- Change history
- Rollback capability

### 5. Archival Phase
```
Retention Policy → Archive Flag → Compressed Storage → Audit Preservation
```

**Long-term Storage:**
- Persistent storage
- Integrity validation
- Compliance retention
- Immutable audit logs

---

## Best Practices

### Document Generation
1. ✅ Always validate template structure
2. ✅ Use variable substitution for dynamic content
3. ✅ Generate checksums for integrity
4. ✅ Store metadata for searchability
5. ✅ Link documents to business entities

### Security
1. ✅ Never expose direct file URLs
2. ✅ Always use token-based downloads
3. ✅ Log all access attempts
4. ✅ Validate file integrity
5. ✅ Implement proper RBAC

### Templates
1. ✅ Use semantic section types
2. ✅ Provide bilingual content
3. ✅ Include fallback values
4. ✅ Test with real data
5. ✅ Version template changes

### Performance
1. ✅ Stream large PDFs
2. ✅ Cache template data
3. ✅ Index document metadata
4. ✅ Paginate search results
5. ✅ Optimize image sizes

---

## Troubleshooting

### Common Issues

**Issue: PDF Download Fails**
- Check token expiry
- Verify HMAC signature
- Validate file existence
- Check user permissions

**Issue: Template Rendering Errors**
- Validate JSON structure
- Check variable names
- Verify section types
- Test with sample data

**Issue: Checksum Mismatch**
- Re-upload file
- Verify storage integrity
- Check buffer encoding
- Validate hash algorithm

**Issue: Access Denied**
- Verify client ownership
- Check admin role
- Validate token signature
- Review audit logs

---

## Future Enhancements

### Planned Features
- [ ] Electronic signatures
- [ ] Document encryption
- [ ] Advanced analytics
- [ ] Automated workflows
- [ ] OCR capabilities
- [ ] Multi-format export (DOCX, XLSX)
- [ ] Collaborative editing
- [ ] Mobile app integration

### API Improvements
- [ ] GraphQL endpoint
- [ ] Webhook notifications
- [ ] Bulk operations API
- [ ] Advanced search filters
- [ ] Rate limiting

---

## Support & Maintenance

### Monitoring
- Track document generation errors
- Monitor storage usage
- Audit access patterns
- Review performance metrics

### Backup Strategy
- Daily database backups
- Object storage replication
- Audit log retention
- Template versioning

### Updates
- Regular security patches
- Template library updates
- Feature enhancements
- Performance optimizations

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Maintained By:** Al Qadi Development Team
