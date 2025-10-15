# Document Templates System

This directory contains production-ready JSON templates for generating PDF documents in your LTA application.

## Template Structure

Each template is a JSON file with the following structure:

```json
{
  "nameEn": "English Template Name",
  "nameAr": "Arabic Template Name",
  "descriptionEn": "Description in English",
  "descriptionAr": "Description in Arabic",
  "category": "price_offer|order|invoice|contract|report|other",
  "language": "en|ar|both",
  "sections": [...],
  "variables": [...],
  "styles": {...},
  "isActive": true
}
```

## Available Templates

### 1. Price Offer Template (`price-offer-template.json`)
- **Category**: `price_offer`
- **Features**: Product table, totals, terms & conditions
- **Variables**: Company info, client info, LTA reference, products, pricing
- **Use Case**: Sending price quotations to clients based on LTA contracts

### 2. Order Confirmation Template (`order-template.json`)
- **Category**: `order`
- **Features**: Order details, delivery info, department contacts
- **Variables**: Order number, delivery location, contact persons, order items
- **Use Case**: Confirming orders from clients

### 3. Invoice Template (`invoice-template.json`)
- **Category**: `invoice`
- **Features**: Line items, tax calculation, payment details, bank info
- **Variables**: Invoice number, due date, tax rates, bank details, payment terms
- **Use Case**: Billing clients for delivered orders

### 4. LTA Contract Template (`contract-template.json`)
- **Category**: `contract`
- **Features**: Legal terms, product schedule, signature blocks
- **Variables**: Contract parties, dates, product list, legal terms
- **Use Case**: Formal LTA contract documents

## Section Types

Templates support the following section types:

- **header**: Company logo, name, address, contact
- **body**: Text content with variables
- **table**: Product/item lists with headers
- **divider**: Visual separator
- **spacer**: Empty space (configurable height)
- **terms**: Terms & conditions (bulleted list)
- **footer**: Page footer with page numbers
- **signature**: Signature blocks for contracts

## Template Variables

Variables use the `{{variableName}}` syntax. Common variables:

**Company Info:**
- `{{companyName}}`, `{{companyNameAr}}`
- `{{companyAddress}}`, `{{companyAddressAr}}`
- `{{companyPhone}}`, `{{companyEmail}}`

**Client Info:**
- `{{clientName}}`, `{{clientNameAr}}`
- `{{clientAddress}}`, `{{clientAddressAr}}`

**LTA Info:**
- `{{ltaName}}`, `{{ltaNameAr}}`
- `{{ltaReference}}`, `{{ltaReferenceAr}}`

**Financial:**
- `{{subtotal}}`, `{{total}}`, `{{tax}}`, `{{currency}}`

**Products:**
- `{{products}}` - Array of product objects

## Styling Options

Each template includes customizable styles:

```json
{
  "primaryColor": "#2563eb",
  "secondaryColor": "#64748b",
  "accentColor": "#10b981",
  "fontSize": 10,
  "fontFamily": "Helvetica",
  "headerHeight": 120,
  "footerHeight": 70,
  "margins": {
    "top": 140,
    "bottom": 90,
    "left": 50,
    "right": 50
  }
}
```

## How to Import Templates

### Option 1: Admin Interface
1. Log in as an admin user
2. Navigate to `/admin/templates`
3. Click "New Template"
4. Copy/paste template JSON or create manually
5. Save and activate

### Option 2: Import Script
```bash
# Make sure you're logged in as admin
npm run tsx templates/import-templates.ts
```

### Option 3: API Direct
```bash
curl -X POST http://localhost:5000/api/admin/templates \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d @templates/production/price-offer-template.json
```

## Creating Custom Templates

To create a new template:

1. Copy an existing template JSON file
2. Modify the sections, variables, and styles
3. Test with sample data
4. Import into the system

### Example Custom Section

```json
{
  "type": "body",
  "content": {
    "title": "Custom Section",
    "text": "Hello {{clientName}}, this is custom content."
  },
  "order": 5
}
```

## Template Categories

- **price_offer**: Price quotations and offers
- **order**: Order confirmations
- **invoice**: Billing documents
- **contract**: Legal agreements
- **report**: Summary and analysis reports
- **other**: Miscellaneous documents

## Language Support

Templates can be:
- **en**: English only
- **ar**: Arabic only (RTL layout)
- **both**: Bilingual (recommended for LTA system)

## Best Practices

1. **Always use bilingual templates** (`language: "both"`) for client-facing documents
2. **Include all required variables** in the variables array
3. **Test templates** with real data before activating
4. **Use semantic colors** that match your brand
5. **Keep font sizes between 8-12pt** for readability
6. **Order sections logically** using the `order` property
7. **Add conditions** for optional sections using the `condition` property

## Troubleshooting

**Template not showing:**
- Check `isActive: true` in the template
- Verify category matches your use case
- Ensure template was successfully imported

**Variables not replaced:**
- Verify variable names match exactly (case-sensitive)
- Check variable is included in `variables` array
- Ensure data passed to PDF generator includes all variables

**Styling issues:**
- Colors must be hex format: `#RRGGBB`
- Margins are in points (72 points = 1 inch)
- Font sizes between 8-16 recommended

## API Endpoints

- `GET /api/admin/templates` - List all templates
- `GET /api/admin/templates?category=price_offer` - Filter by category
- `GET /api/admin/templates/:id` - Get specific template
- `POST /api/admin/templates` - Create new template
- `PATCH /api/admin/templates/:id` - Update template
- `DELETE /api/admin/templates/:id` - Delete template
- `POST /api/admin/templates/:id/duplicate` - Duplicate template

## Support

For questions or issues with templates:
1. Check this README
2. Review existing template examples
3. Test in admin interface with preview
4. Contact system administrator
