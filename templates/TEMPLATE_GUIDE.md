# Quick Start Guide: Using Templates in Your LTA Application

## For Business Users

### What are Templates?

Templates are pre-designed document formats that automatically generate professional PDFs for:
- **Price Offers** - Send quotes to clients
- **Order Confirmations** - Confirm customer orders
- **Invoices** - Bill customers for delivered goods
- **LTA Contracts** - Create legal agreement documents

### How It Works

1. **Templates are pre-loaded** with your company branding and layout
2. **System fills in the details** automatically (client name, products, prices, etc.)
3. **PDF is generated** instantly in both English and Arabic
4. **You review and send** to the client

## For Administrators

### Accessing the Template Manager

1. Log in with admin credentials
2. Navigate to **Admin Dashboard** → **Templates**
3. You'll see all available templates organized by category

### Managing Templates

#### View Templates
- Click on any template card to see details
- Review sections, variables, and styling
- Check if template is active

#### Activate/Deactivate
- Click the power icon on a template card
- Active templates (green icon) are available for use
- Inactive templates (gray icon) are hidden from users

#### Edit a Template
1. Click the **Edit** button
2. Modify names, descriptions, or colors
3. Click **Save**

#### Duplicate a Template
- Click the **Copy** button to create a variation
- Useful for creating department-specific versions

#### Delete a Template
- Click the **Trash** button
- Confirm deletion (cannot be undone)

### Importing Production Templates

#### Method 1: Using the Import Script (Recommended)
```bash
cd templates
npm run tsx import-templates.ts
```

This will automatically load all 4 production templates:
- Standard Price Offer Template
- Order Confirmation Template
- Invoice Template
- LTA Contract Template

#### Method 2: Manual Import via Admin Interface
1. Open a template JSON file from `templates/production/`
2. Copy the entire content
3. In admin interface, click **New Template**
4. Paste JSON and save

### Customizing Templates

To match your company branding:

1. **Edit an existing template**
2. **Update colors:**
   - Primary Color: Main brand color (headers, titles)
   - Secondary Color: Text and borders
   - Accent Color: Highlights and accents
3. **Adjust font size** (8-16pt recommended)
4. **Save changes**

### Template Variables Explained

Variables are placeholders that get replaced with real data:

- `{{companyName}}` → Your company name
- `{{clientName}}` → Customer name
- `{{total}}` → Order/invoice total
- `{{date}}` → Current date
- `{{products}}` → Product list table

The system automatically provides these values when generating PDFs.

## For Developers

### Template Schema

```typescript
interface Template {
  nameEn: string;              // English name
  nameAr: string;              // Arabic name
  descriptionEn?: string;      // Optional description (EN)
  descriptionAr?: string;      // Optional description (AR)
  category: TemplateCategory;  // price_offer | order | invoice | contract | report | other
  language: 'en' | 'ar' | 'both';
  sections: Section[];         // Document structure
  variables: string[];         // Available variables
  styles: TemplateStyles;      // Visual styling
  isActive: boolean;          // Availability status
}
```

### Section Types

```typescript
type SectionType = 
  | 'header'     // Company header with logo
  | 'body'       // Text content
  | 'table'      // Data tables
  | 'divider'    // Visual separator
  | 'spacer'     // Empty space
  | 'terms'      // Terms & conditions
  | 'footer'     // Page footer
  | 'signature'  // Signature blocks
  | 'image';     // Image insertion
```

### API Usage

#### List Templates
```typescript
const templates = await fetch('/api/admin/templates');
```

#### Filter by Category
```typescript
const priceOffers = await fetch('/api/admin/templates?category=price_offer');
```

#### Create Template
```typescript
await fetch('/api/admin/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(templateData)
});
```

#### Update Template
```typescript
await fetch(`/api/admin/templates/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isActive: true })
});
```

### Generating PDFs from Templates

```typescript
import { TemplateGenerator } from '@/server/template-generator';

// 1. Get template
const template = await TemplateStorage.getTemplate(templateId);

// 2. Prepare variables
const variables = [
  { key: 'companyName', value: 'ACME Corp' },
  { key: 'clientName', value: 'Client Inc.' },
  { key: 'total', value: '$1,500.00' },
  // ... more variables
];

// 3. Generate PDF
const pdfBuffer = await TemplateGenerator.generateFromTemplate(
  template,
  variables
);

// 4. Send or save
res.setHeader('Content-Type', 'application/pdf');
res.send(pdfBuffer);
```

### Adding New Section Types

1. **Define in schema** (`shared/template-schema.ts`)
2. **Add render method** (`server/template-generator.ts`)
3. **Update documentation**

Example:
```typescript
private static renderCustomSection(
  doc: PDFKit.PDFDocument,
  section: any,
  styles: any,
  language: 'en' | 'ar'
) {
  // Your custom rendering logic
}
```

## Common Use Cases

### 1. Sending Price Offer to Client
1. Client requests quote for products
2. System generates PDF using **Price Offer Template**
3. Variables filled: client name, products, LTA pricing, validity date
4. Admin reviews and emails to client

### 2. Confirming an Order
1. Client places order through system
2. **Order Template** generates confirmation PDF
3. Includes: order number, delivery details, department contacts
4. Automatically sent to client email

### 3. Creating an Invoice
1. Order is delivered
2. **Invoice Template** generates billing document
3. Includes: line items, tax, payment terms, bank details
4. Sent to client's finance department

### 4. LTA Contract Generation
1. New LTA agreement needed
2. **Contract Template** creates formal document
3. Includes: legal terms, product schedule, signatures
4. Both parties sign and archive

## Troubleshooting

### Template Not Generating PDF
- **Check**: Is template active?
- **Check**: Are all required variables provided?
- **Check**: Variable names match exactly (case-sensitive)

### Missing Data in PDF
- **Verify**: Variable is in template's `variables` array
- **Verify**: Data is passed to generator
- **Check**: Spelling of variable names

### Styling Issues
- **Colors**: Must be hex format `#RRGGBB`
- **Margins**: In points (72 = 1 inch)
- **Fonts**: Limited to Helvetica, Times, Courier

### Arabic Text Not Displaying
- **Check**: Template language is `ar` or `both`
- **Check**: RTL layout enabled in template
- **Verify**: Arabic text in variables

## Support

- **Documentation**: See `templates/README.md` for detailed reference
- **Examples**: Check `templates/production/` for template samples
- **Admin Interface**: `/admin/templates` for visual management
- **Developer Docs**: See source code comments in `server/template-generator.ts`
