# Template System Guide

## Overview

The LTA Contract Fulfillment Application includes a comprehensive template system for generating professional PDF documents. This system supports bilingual (Arabic/English) documents with full RTL/LTR support and dynamic variable replacement.

## Features

- **Bilingual Support**: Full Arabic and English support with proper RTL/LTR text handling
- **Dynamic Variables**: Template variables that can be replaced with actual data
- **Multiple Document Types**: Support for price offers, orders, invoices, contracts, and more
- **Template Management**: Admin interface for creating, editing, and managing templates
- **Default Templates**: Automatic fallback to default templates for each category
- **PDF Generation**: High-quality PDF output using PDFKit with Arabic text shaping

## Template Structure

### Basic Template Schema

```typescript
interface DocumentTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category: 'price_offer' | 'order' | 'invoice' | 'contract' | 'report' | 'other';
  language: 'en' | 'ar' | 'both';
  sections: TemplateSection[];
  variables: string[];
  styles: TemplateStyles;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Section Types

1. **Header**: Company information, logo, contact details
2. **Body**: Main content, titles, dates, client information
3. **Table**: Product lists, pricing tables, data grids
4. **Footer**: Page numbers, contact information, legal text
5. **Signature**: Signature blocks for contracts and agreements
6. **Image**: Logo, diagrams, charts
7. **Divider**: Visual separators
8. **Spacer**: White space for layout
9. **Terms**: Terms and conditions, legal text

### Template Variables

Variables are placeholders in the format `{{variableName}}` that get replaced with actual data during PDF generation.

Common variables:
- `{{companyName}}` / `{{companyNameAr}}`
- `{{companyAddress}}` / `{{companyAddressAr}}`
- `{{companyPhone}}` / `{{companyEmail}}`
- `{{clientName}}` / `{{clientNameAr}}`
- `{{date}}` / `{{validUntil}}`
- `{{products}}` (array of product data)
- `{{subtotal}}` / `{{tax}}` / `{{total}}`
- `{{currency}}`

## API Endpoints

### Template Management

#### Get Default Template
```
GET /api/templates/default/:category
```
Returns the default template for a specific category.

#### Generate Document
```
POST /api/templates/generate
```
Generates a PDF document from a template with provided variables.

**Request Body:**
```json
{
  "category": "price_offer",
  "variables": [
    { "key": "companyName", "value": "ACME Corp" },
    { "key": "clientName", "value": "Client Inc." },
    { "key": "date", "value": "2024-01-15" }
  ],
  "templateId": "optional-template-id",
  "language": "both"
}
```

#### Get Templates by Category
```
GET /api/templates/category/:category
```
Returns all active templates for a specific category.

#### Get Template Variables
```
GET /api/templates/:id/variables
```
Returns the variables required by a specific template.

### Admin Endpoints

#### Set Default Template
```
POST /api/admin/templates/set-default
```
Sets a template as the default for its category.

#### Validate Template
```
POST /api/admin/templates/validate
```
Validates a template structure and returns validation errors.

#### Get Template Statistics
```
GET /api/admin/templates/stats
```
Returns statistics about templates in the system.

#### Preview Template
```
POST /api/admin/templates/:id/preview
```
Generates a preview PDF of a template with sample data.

## Usage Examples

### 1. Generate a Price Offer

```typescript
import { TemplateManager } from './server/template-manager';

const variables = [
  { key: 'companyName', value: 'ACME Corporation' },
  { key: 'companyNameAr', value: 'شركة إيه سي إم إي' },
  { key: 'clientName', value: 'Client Inc.' },
  { key: 'clientNameAr', value: 'شركة العميل' },
  { key: 'date', value: '2024-01-15' },
  { key: 'offerNumber', value: 'PO-2024-001' },
  { key: 'products', value: [
    { sku: 'SKU001', name: 'Product 1', unit: 'pcs', qty: 10, price: 100, total: 1000 },
    { sku: 'SKU002', name: 'Product 2', unit: 'pcs', qty: 5, price: 200, total: 1000 }
  ]},
  { key: 'subtotal', value: '2000.00' },
  { key: 'tax', value: '200.00' },
  { key: 'total', value: '2200.00' },
  { key: 'currency', value: 'USD' }
];

const pdfBuffer = await TemplateManager.generateDocument('price_offer', variables);
```

### 2. Create a Custom Template

```typescript
import { TemplateStorage } from './server/template-storage';

const template = {
  nameEn: 'Custom Invoice Template',
  nameAr: 'قالب فاتورة مخصص',
  descriptionEn: 'Custom invoice template for our clients',
  descriptionAr: 'قالب فاتورة مخصص لعملائنا',
  category: 'invoice',
  language: 'both',
  sections: [
    {
      type: 'header',
      content: {
        companyName: '{{companyName}}',
        companyNameAr: '{{companyNameAr}}',
        address: '{{companyAddress}}',
        addressAr: '{{companyAddressAr}}',
        phone: '{{companyPhone}}',
        email: '{{companyEmail}}',
        logo: true
      },
      order: 0
    },
    // ... more sections
  ],
  variables: ['companyName', 'companyNameAr', 'clientName', 'clientNameAr', 'date', 'total'],
  styles: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    fontSize: 10,
    fontFamily: 'Helvetica',
    headerHeight: 120,
    footerHeight: 70,
    margins: {
      top: 140,
      bottom: 90,
      left: 50,
      right: 50
    }
  },
  isActive: true,
  isDefault: false
};

const createdTemplate = await TemplateStorage.createTemplate(template);
```

## Template Seeding

The system includes a template seeding mechanism to ensure default templates are always available.

### Run Template Seeding

```bash
npm run seed:templates
```

This will:
1. Load templates from the `templates/production` directory
2. Create default templates for each category if none exist
3. Ensure all required templates are available

### Default Templates

The system includes default templates for:
- **Price Offers**: Professional price offer template with product tables
- **Orders**: Order confirmation template with delivery details
- **Invoices**: Invoice template with payment terms and bank details
- **Contracts**: LTA contract template with legal terms and signatures

## Styling and Customization

### Color Scheme
- **Primary Color**: Main brand color for headers and accents
- **Secondary Color**: Supporting text and borders
- **Accent Color**: Highlights and call-to-action elements

### Typography
- **English**: Helvetica font family
- **Arabic**: Noto Sans Arabic with proper RTL support
- **Code/Prices**: JetBrains Mono for technical content

### Layout
- **Margins**: Configurable top, bottom, left, right margins
- **Header Height**: Fixed height for company information
- **Footer Height**: Fixed height for page numbers and contact info

## Error Handling

The template system includes comprehensive error handling:

1. **Template Validation**: Validates template structure before saving
2. **Variable Replacement**: Handles missing or invalid variables gracefully
3. **PDF Generation**: Catches and reports PDF generation errors
4. **Database Operations**: Handles database connection and query errors

## Best Practices

1. **Always provide fallback values** for template variables
2. **Use descriptive variable names** that clearly indicate their purpose
3. **Test templates thoroughly** with various data sets
4. **Keep templates simple** and focused on their specific purpose
5. **Use consistent styling** across all templates
6. **Include both English and Arabic content** for bilingual templates

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**
   - Check that all required variables are provided
   - Verify template structure is valid
   - Ensure template is active

2. **Arabic Text Not Displaying Correctly**
   - Verify Noto Sans Arabic font is available
   - Check RTL text direction settings
   - Ensure proper text shaping with arabic-reshaper

3. **Template Variables Not Replacing**
   - Check variable names match exactly (case-sensitive)
   - Verify variable format: `{{variableName}}`
   - Ensure variables are provided in the request

4. **Database Connection Issues**
   - Verify DATABASE_URL is set correctly
   - Check database server is running
   - Ensure proper database permissions

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=template-system
```

This will provide detailed logging of template processing and PDF generation.