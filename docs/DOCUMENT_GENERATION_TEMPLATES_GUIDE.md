
# Document Generation & Template Assignment System - Complete Guide

**Version**: 3.0  
**Last Updated**: 2025-01-26  
**Status**: Manual Generation Only

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Template System](#template-system)
4. [Manual Document Generation](#manual-document-generation)
5. [Template Assignment](#template-assignment)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is This System?

The Document Generation & Template Assignment System is a comprehensive solution for creating professional, bilingual (English/Arabic) PDF documents in the LTA Contract Fulfillment Application. It supports:

- **Dynamic PDF Generation** from JSON-based templates
- **Bilingual Support** (English, Arabic, or both)
- **Template-Based Design** with reusable components
- **Manual Document Generation** via admin UI or API
- **Secure Document Storage** and access control
- **Template Management** via admin interface

### Important Change (v3.0)

**Automatic document generation has been disabled.** All documents must now be generated manually through the admin interface or API. This simplifies the system and gives administrators full control over when documents are created.

### Supported Document Types

1. **Price Offers** - Professional quotations for clients
2. **Purchase Orders** - Order confirmations and receipts
3. **Invoices** - Commercial invoices with tax calculations
4. **LTA Contracts** - Long-term agreement contracts
5. **Custom Documents** - Any other document type via custom templates

### Key Features

- ✅ **Template-Driven**: Create once, generate infinite documents
- ✅ **Variable Substitution**: Dynamic data replacement (e.g., `{{clientName}}`)
- ✅ **Multi-Language**: Full English and Arabic support with RTL layout
- ✅ **Section-Based**: Modular sections (header, body, table, footer, etc.)
- ✅ **Secure Storage**: Object storage with checksum validation
- ✅ **Access Control**: Token-based secure downloads
- ✅ **Event-Driven**: Automatic generation on business events
- ✅ **Audit Trail**: Complete document access logging

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   ADMIN INTERFACE                        │
│  /admin/templates/documents - Template Management       │
│  /admin/documents - Generated Documents Library         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   API LAYER                              │
│  Template CRUD: /api/admin/templates/*                  │
│  Document Gen:  /api/documents/generate                 │
│  Download:      /api/documents/:id/download             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               BUSINESS LOGIC                             │
│  TemplatePDFGenerator  │  DocumentTriggerService        │
│  TemplateStorage       │  PDFAccessControl              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               DATA LAYER                                 │
│  PostgreSQL (Neon)     │  Object Storage (Replit)       │
│  - templates           │  - documents/*.pdf             │
│  - documents           │  - checksum verification       │
│  - document_access_logs│                                │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

#### Template Creation Flow
```
1. Admin creates template via UI (/admin/templates/documents)
2. Template data validated against schema (shared/template-schema.ts)
3. Stored in PostgreSQL 'templates' table
4. Available for document generation
```

#### Document Generation Flow (Manual Only)
```
1. Admin initiates generation via UI or API
2. Fetch template from TemplateStorage
3. Prepare variables (client data, order data, etc.)
4. TemplatePDFGenerator.generate() creates PDF buffer
5. Validate PDF (signature check, size limits)
6. Upload to Object Storage via PDFStorage.uploadPDF()
7. Create metadata record in 'documents' table
8. Log access event in 'document_access_logs' table
9. Return document ID and download URL
```

#### Document Download Flow
```
1. User requests download token
2. PDFAccessControl.generateDownloadToken() creates HMAC-signed token
3. Token valid for 2 hours (configurable)
4. User accesses /api/documents/:id/download?token=xxx
5. Server verifies token signature and expiry
6. Fetch PDF from Object Storage
7. Verify checksum
8. Stream PDF to user
9. Log download event
10. Increment view count
```

---

## Template System

### Template Structure

A template is a JSON object defining the structure and styling of a PDF document.

#### Basic Template Schema

```typescript
interface Template {
  // Metadata
  nameEn: string;              // English name
  nameAr: string;              // Arabic name
  descriptionEn?: string;      // Optional description (EN)
  descriptionAr?: string;      // Optional description (AR)
  category: TemplateCategory;  // Document type
  language: 'en' | 'ar' | 'both';
  isActive: boolean;           // Availability status
  
  // Structure
  sections: Section[];         // Document sections
  variables: string[];         // Available variables
  
  // Styling
  styles: {
    primaryColor: string;      // Hex color
    secondaryColor: string;
    accentColor: string;
    fontSize: number;          // Base font size (pt)
    fontFamily: string;        // Default: 'Helvetica'
    margins: {
      top: number;             // In points (72 = 1 inch)
      bottom: number;
      left: number;
      right: number;
    };
  };
}
```

#### Template Categories

```typescript
type TemplateCategory = 
  | 'price_offer'   // Price quotations
  | 'order'         // Purchase orders
  | 'invoice'       // Commercial invoices
  | 'contract'      // LTA contracts
  | 'report'        // Custom reports
  | 'other';        // Miscellaneous
```

### Section Types

Templates are composed of sections, each with a specific purpose:

#### 1. Header Section
Company branding, logo, and contact information at the top of the document.

```json
{
  "type": "header",
  "order": 0,
  "content": {
    "showLogo": true,
    "titleEn": "OFFICIAL PRICE OFFER",
    "titleAr": "عرض سعر رسمي",
    "companyInfoEn": {
      "name": "Al Qadi Trading Company",
      "address": "Riyadh, Kingdom of Saudi Arabia",
      "phone": "+966 XX XXX XXXX",
      "email": "info@alqadi.com",
      "taxNumber": "{{taxNumber}}"
    },
    "companyInfoAr": {
      "name": "شركة القاضي التجارية",
      "address": "الرياض، المملكة العربية السعودية",
      "phone": "+966 XX XXX XXXX",
      "email": "info@alqadi.com",
      "taxNumber": "{{taxNumber}}"
    }
  }
}
```

#### 2. Body Section
Main text content with variable substitution.

```json
{
  "type": "body",
  "order": 1,
  "content": {
    "textEn": "Dear {{clientName}},\n\nWe are pleased to present our price offer.",
    "textAr": "عزيزنا {{clientNameAr}}،\n\nيسعدنا أن نقدم لكم عرض الأسعار."
  }
}
```

#### 3. Table Section
Dynamic data tables with headers and rows.

```json
{
  "type": "table",
  "order": 2,
  "content": {
    "headers": ["Item", "SKU", "Quantity", "Price", "Total"],
    "headersAr": ["الصنف", "الرمز", "الكمية", "السعر", "المجموع"],
    "dataSource": "{{items}}",
    "showBorders": true,
    "alternateRowColors": true
  }
}
```

#### 4. Terms Section
Bullet-point lists for terms and conditions.

```json
{
  "type": "terms",
  "order": 3,
  "content": {
    "titleEn": "Terms and Conditions",
    "titleAr": "الشروط والأحكام",
    "itemsEn": [
      "Payment within 30 days",
      "Delivery as per LTA contract"
    ],
    "itemsAr": [
      "الدفع خلال 30 يوماً",
      "التسليم حسب عقد LTA"
    ]
  }
}
```

#### 5. Signature Section
Signature blocks for authorized parties.

```json
{
  "type": "signature",
  "order": 4,
  "content": {
    "party1Label": "Supplier",
    "party1LabelAr": "المورد",
    "party1Name": "Al Qadi Trading Company",
    "party1NameAr": "شركة القاضي التجارية",
    "party2Label": "Client",
    "party2LabelAr": "العميل",
    "party2Name": "{{clientName}}",
    "party2NameAr": "{{clientNameAr}}"
  }
}
```

#### 6. Footer Section
Page footer with contact information and page numbers.

```json
{
  "type": "footer",
  "order": 5,
  "content": {
    "textEn": "Al Qadi Trading Company | Riyadh, Saudi Arabia",
    "textAr": "شركة القاضي التجارية | الرياض، السعودية",
    "pageNumbers": true
  }
}
```

#### 7. Additional Section Types

- **Divider**: Horizontal line separator
- **Spacer**: Empty vertical space
- **Image**: Embedded images (logos, diagrams)

### Variable System

Variables are placeholders that get replaced with actual data during PDF generation.

#### Variable Syntax

```
{{variableName}}
```

#### Nested Variable Access

```
{{client.nameEn}}
{{order.items[0].productName}}
```

#### Common Variables

##### Order Documents
```typescript
{
  orderId: string;
  orderDate: string;
  orderStatus: string;
  totalAmount: number;
  currency: string;
  clientName: string;
  clientNameAr: string;
  items: Array<OrderItem>;
  deliveryLocation: string;
}
```

##### Price Offers
```typescript
{
  offerNumber: string;
  offerDate: string;
  validUntil: string;
  clientName: string;
  clientNameAr: string;
  items: Array<OfferItem>;
  total: number;
  currency: string;
  ltaNumber: string;
}
```

##### Invoices
```typescript
{
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientNameAr: string;
  items: Array<InvoiceItem>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  taxNumber: string;
}
```

##### LTA Contracts
```typescript
{
  ltaNumber: string;
  contractDate: string;
  startDate: string;
  endDate: string;
  clientName: string;
  clientNameAr: string;
  productCategories: Array<Category>;
}
```

---

## Manual Document Generation

### Via API

```typescript
import { TemplatePDFGenerator } from '@/server/template-pdf-generator';
import { TemplateStorage } from '@/server/template-storage';

// 1. Get template
const templates = await TemplateStorage.getTemplates('price_offer');
const template = templates.find(t => t.isActive && t.language === 'both');

// 2. Prepare variables
const variables = [
  { key: 'clientName', value: 'ACME Corporation' },
  { key: 'offerNumber', value: 'PO-2025-001' },
  { key: 'total', value: '50,000 SAR' },
  { key: 'items', value: [
    { sku: 'PROD-001', name: 'Product A', qty: 10, price: 5000 }
  ]}
];

// 3. Generate PDF
const pdfBuffer = await TemplatePDFGenerator.generate({
  template,
  variables,
  language: 'en' // or 'ar'
});

// 4. Save or send
fs.writeFileSync('output.pdf', pdfBuffer);
```

#### Via Admin Interface

1. Navigate to `/admin/templates/documents`
2. Select a template
3. Click "Generate Document"
4. Fill in required variables
5. Preview and download

### When to Generate Documents

Since automatic generation has been disabled, administrators should manually generate documents when needed:

- **Order Confirmations**: After reviewing and approving an order
- **Price Offers**: When creating a formal quotation for a client
- **Invoices**: When an order is completed and ready for billing
- **LTA Contracts**: When finalizing a long-term agreement

This manual approach ensures:
- Full control over document creation timing
- Ability to review data before generating
- No unexpected document generation errors
- Reduced system complexity

---

## Template Assignment

### How Templates Are Assigned

Templates are automatically selected based on:

1. **Document Type**: Match template category to document type
2. **Active Status**: Only active templates are used
3. **Language Preference**: Select bilingual templates for flexibility
4. **Default Template**: Fallback to default template if specific not found

### Assignment Logic

```typescript
// Priority order for template selection:
// 1. Active template matching exact category + bilingual
const template = templates.find(t => 
  t.category === documentType && 
  t.isActive && 
  t.language === 'both'
);

// 2. Active template matching category (any language)
if (!template) {
  template = templates.find(t => 
    t.category === documentType && 
    t.isActive
  );
}

// 3. Fallback to invoice template (most generic)
if (!template) {
  const invoiceTemplates = await TemplateStorage.getTemplates('invoice');
  template = invoiceTemplates.find(t => t.isActive);
}
```

### Setting Default Templates

Mark a template as default for its category:

```typescript
await TemplateStorage.updateTemplate(templateId, {
  isDefault: true,
  category: 'price_offer'
});
```

### Template Versioning

Templates support versioning for tracking changes:

```typescript
{
  version: 1,
  parentTemplateId: 'uuid-of-original',
  versionNumber: 2
}
```

---

## Automatic Document Triggers

### DocumentTriggerService

The `DocumentTriggerService` is a singleton service that handles automatic document generation.

#### Core Methods

```typescript
class DocumentTriggerService {
  // Queue an event for processing
  async queueEvent(event: DocumentGenerationEvent): Promise<void>;
  
  // Get current queue status
  getQueueStatus(): { queueLength: number; isProcessing: boolean };
  
  // Clear queue (for testing)
  clearQueue(): void;
}
```

#### Event Types

```typescript
interface DocumentGenerationEvent {
  type: 'order_placed' | 'order_status_changed' | 'price_offer_created' | 'lta_contract_signed';
  data: any;            // Event-specific data (order, offer, contract)
  clientId: string;     // Target client
  timestamp: Date;      // Event timestamp
}
```

#### Usage Examples

##### Order Placed Trigger

```typescript
// In order submission handler
await documentTriggerService.queueEvent({
  type: 'order_placed',
  data: {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    items: JSON.parse(order.items)
  },
  clientId: order.clientId,
  timestamp: new Date()
});

// Result:
// - Order confirmation PDF generated
// - Uploaded to object storage
// - Database record created
// - Access logged
```

##### Order Status Changed Trigger

```typescript
// In order update handler
await documentTriggerService.queueEvent({
  type: 'order_status_changed',
  data: {
    order: updatedOrder,
    oldStatus: 'pending',
    newStatus: 'shipped'
  },
  clientId: order.clientId,
  timestamp: new Date()
});

// Result:
// - Status update document generated (if status triggers it)
// - Invoice generated (if status is 'delivered')
```

##### Price Offer Created Trigger

```typescript
// In price offer creation handler
await documentTriggerService.queueEvent({
  type: 'price_offer_created',
  data: {
    id: offer.id,
    offerNumber: offer.offerNumber,
    validUntil: offer.validUntil,
    total: offer.total,
    currency: offer.currency,
    items: JSON.parse(offer.items),
    language: offer.language
  },
  clientId: offer.clientId,
  timestamp: new Date()
});

// Result:
// - Price offer PDF generated in specified language
// - Available for immediate download
```

### Error Handling

The trigger service includes robust error handling:

```typescript
try {
  await this.processEvent(event);
} catch (error) {
  console.error(`❌ Failed to process document event ${event.type}:`, error);
  // Event is logged but doesn't block other events
  // Can be retried manually from admin panel
}
```

---

## API Reference

### Template Management API

#### List Templates

```http
GET /api/admin/templates
GET /api/admin/templates?category=price_offer

Response: Template[]
```

#### Get Template

```http
GET /api/admin/templates/:id

Response: Template
```

#### Create Template

```http
POST /api/admin/templates
Content-Type: application/json

Body: {
  nameEn: string;
  nameAr: string;
  category: string;
  language: string;
  sections: Section[];
  variables: string[];
  styles: object;
}

Response: { id: string; ... }
```

#### Update Template

```http
PUT /api/admin/templates/:id
Content-Type: application/json

Body: Partial<Template>

Response: Template
```

#### Delete Template

```http
DELETE /api/admin/templates/:id

Response: { success: boolean }
```

#### Duplicate Template

```http
POST /api/admin/templates/:id/duplicate
Content-Type: application/json

Body: { name: { en: string; ar: string } }

Response: Template
```

### Document Generation API

#### Generate Document

```http
POST /api/documents/generate
Content-Type: application/json

Body: {
  templateId: string;
  variables: Array<{ key: string; value: any }>;
  language: 'en' | 'ar';
  saveToDocuments?: boolean;
  clientId?: string;
}

Response: {
  success: boolean;
  documentId?: string;
  fileName?: string;
  fileUrl?: string;
}
```

#### Get Download Token

```http
POST /api/documents/:id/token

Response: {
  token: string;
  expiresIn: string;
}
```

#### Download Document

```http
GET /api/documents/:id/download?token=xxx

Response: PDF Binary (application/pdf)
```

---

## Usage Examples

### Example 1: Create Price Offer Template

```typescript
const template = {
  nameEn: "Standard Price Offer",
  nameAr: "عرض سعر قياسي",
  descriptionEn: "Professional price quotation template",
  descriptionAr: "قالب عرض سعر احترافي",
  category: "price_offer",
  language: "both",
  sections: [
    {
      type: "header",
      order: 0,
      content: {
        showLogo: true,
        titleEn: "PRICE QUOTATION",
        titleAr: "عرض سعر",
        companyInfoEn: {
          name: "Al Qadi Trading Company",
          address: "Riyadh, Saudi Arabia",
          phone: "+966 XX XXX XXXX",
          email: "info@alqadi.com"
        }
      }
    },
    {
      type: "body",
      order: 1,
      content: {
        textEn: "Offer Number: {{offerNumber}}\nValid Until: {{validUntil}}",
        textAr: "رقم العرض: {{offerNumber}}\nصالح حتى: {{validUntil}}"
      }
    },
    {
      type: "table",
      order: 2,
      content: {
        headers: ["Item", "Quantity", "Price", "Total"],
        headersAr: ["الصنف", "الكمية", "السعر", "المجموع"],
        dataSource: "{{items}}"
      }
    }
  ],
  variables: ["offerNumber", "validUntil", "clientName", "items", "total"],
  styles: {
    primaryColor: "#1a365d",
    secondaryColor: "#2d3748",
    accentColor: "#d4af37",
    fontSize: 11,
    fontFamily: "Helvetica",
    margins: { top: 140, bottom: 80, left: 50, right: 50 }
  },
  isActive: true
};

// Save template
const response = await fetch('/api/admin/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(template)
});
```

### Example 2: Generate Invoice from Order

```typescript
// Trigger automatic invoice generation when order is delivered
await documentTriggerService.queueEvent({
  type: 'order_status_changed',
  data: {
    order: {
      id: 'order-123',
      createdAt: new Date(),
      status: 'delivered',
      totalAmount: 15000,
      currency: 'SAR',
      items: [
        { sku: 'PROD-001', name: 'Product A', quantity: 10, price: 1500 }
      ]
    },
    oldStatus: 'shipped',
    newStatus: 'delivered'
  },
  clientId: 'client-uuid',
  timestamp: new Date()
});

// System automatically:
// 1. Finds invoice template
// 2. Prepares variables
// 3. Generates PDF
// 4. Stores document
// 5. Returns document ID
```

### Example 3: Bulk Document Generation

```typescript
// Generate invoices for multiple orders
const orders = await storage.getOrders({ status: 'delivered' });

for (const order of orders) {
  await documentTriggerService.queueEvent({
    type: 'order_status_changed',
    data: { order, oldStatus: 'shipped', newStatus: 'delivered' },
    clientId: order.clientId,
    timestamp: new Date()
  });
}

// Monitor queue
setInterval(() => {
  const status = documentTriggerService.getQueueStatus();
  console.log(`Processing: ${status.queueLength} documents remaining`);
}, 5000);
```

---

## Troubleshooting

### Common Issues

#### 1. Template Not Found

**Error**: `No active template found for category 'order'`

**Solution**:
- Check template is marked as `isActive: true`
- Verify category matches exactly
- Ensure at least one template exists for the category

```typescript
// Check active templates
const templates = await TemplateStorage.getTemplates('order');
console.log('Active templates:', templates.filter(t => t.isActive));
```

#### 2. Variable Not Substituted

**Error**: PDF shows `{{clientName}}` instead of actual name

**Solution**:
- Variable name must match exactly (case-sensitive)
- Ensure variable is in template's `variables` array
- Check variable is provided in generation call

```typescript
// Correct variable provision
const variables = [
  { key: 'clientName', value: 'ACME Corp' }, // Exact match
  { key: 'ClientName', value: 'ACME Corp' }  // Won't work!
];
```

#### 3. Table Headers Not Found

**Error**: `Table headers not found or invalid in section`

**Solution**:
- Use `headers` for English, `headersAr` for Arabic
- Both arrays must have same length
- Check template JSON structure

```json
// Correct table section
{
  "type": "table",
  "content": {
    "headers": ["Item", "Qty", "Price"],      // 3 columns
    "headersAr": ["الصنف", "الكمية", "السعر"], // 3 columns (same)
    "dataSource": "{{items}}"
  }
}
```

#### 4. PDF Generation Timeout

**Error**: `Failed to generate PDF: timeout`

**Solution**:
- Reduce number of table rows (paginate if > 100 rows)
- Simplify template sections
- Check server resources

```typescript
// Paginate large datasets
const itemsPerPage = 50;
const pages = Math.ceil(items.length / itemsPerPage);

for (let i = 0; i < pages; i++) {
  const pageItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
  // Generate separate PDF for each page
}
```

#### 5. Arabic Text Not Displaying

**Error**: Arabic characters show as boxes or gibberish

**Solution**:
- Ensure template `language` is `'ar'` or `'both'`
- Verify Arabic font is available (`Noto Sans Arabic`)
- Check RTL layout is enabled

```typescript
// Correct Arabic setup
{
  language: 'both',
  styles: {
    fontFamily: 'Noto Sans Arabic', // For Arabic text
    rtl: true,                      // Right-to-left layout
    alignment: 'right'              // Text alignment
  }
}
```

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// In server/template-pdf-generator.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Template:', JSON.stringify(template, null, 2));
  console.log('Variables:', variables);
  console.log('Section type:', section.type);
}
```

### Validation

Test template structure before saving:

```typescript
import { createTemplateSchema } from '@/shared/template-schema';

// Validate template
try {
  createTemplateSchema.parse(templateData);
  console.log('✓ Template is valid');
} catch (error) {
  console.error('✗ Validation errors:', error.errors);
}
```

---

## Best Practices

### Template Design

1. **Use Consistent Naming**: Follow naming convention for variables (`camelCase`)
2. **Bilingual Support**: Always provide both EN and AR content
3. **Test Before Production**: Generate test PDFs with sample data
4. **Version Control**: Duplicate templates before major changes
5. **Keep It Simple**: Fewer sections = faster generation

### Variable Management

1. **Document Variables**: List all variables in template metadata
2. **Nested Access**: Use dot notation for complex objects
3. **Default Values**: Provide fallbacks for optional variables
4. **Type Safety**: Validate variable types before generation

### Performance

1. **Template Caching**: Templates are cached after first load
2. **Lazy Loading**: Load templates only when needed
3. **Batch Operations**: Queue multiple documents instead of synchronous generation
4. **Resource Limits**: Limit table rows to 100 per page

### Security

1. **Access Control**: Use token-based downloads
2. **Input Validation**: Sanitize all variable values
3. **Audit Logging**: Track all document access
4. **Checksum Verification**: Verify file integrity

---

## Appendix

### Template File Locations

```
server/templates/
├── price-offer-template.json
├── order-template.json
├── invoice-template.json
├── contract-template.json
└── arabic/
    ├── ar-price-offer.json
    ├── ar-purchase-order.json
    └── ar-invoice.json
```

### Database Schema

```sql
-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name_en VARCHAR NOT NULL,
  name_ar VARCHAR NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  category VARCHAR NOT NULL,
  language VARCHAR NOT NULL,
  sections JSONB NOT NULL,
  variables TEXT[] NOT NULL,
  styles JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  document_type VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  checksum VARCHAR,
  client_id UUID REFERENCES clients(id),
  order_id UUID REFERENCES orders(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Related Documentation

- [DOCUMENT_MANAGEMENT_SYSTEM.md](./DOCUMENT_MANAGEMENT_SYSTEM.md) - Infrastructure details
- [DOCUMENT_GENERATION_IMPLEMENTATION_PLAN.md](./DOCUMENT_GENERATION_IMPLEMENTATION_PLAN.md) - Implementation roadmap
- [TEMPLATE_GUIDE.md](../templates/TEMPLATE_GUIDE.md) - Quick start guide

---

**END OF DOCUMENTATION**
