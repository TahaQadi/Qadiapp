# 📋 Template System Status

**Last Updated**: October 29, 2025  
**Total Templates**: 8 (All Active ✅)

## 🎯 Default Templates by Category

### 1. Price Offer Template ⭐
- **Name**: قالب عرض السعر الافتراضي
- **ID**: `d158e26e-3bf6-49bd-ab85-e5588eb0446e`
- **Variables** (12):
  - `date`, `offerNumber`, `clientName`, `validUntil`
  - `items`, `subtotal`, `tax`, `total`, `currency`
  - `ltaReference`, `paymentTerms`, `deliveryTerms`

### 2. Order Template ⭐
- **Name**: قالب تأكيد الطلب الافتراضي
- **ID**: `d756d406-8a96-4e40-a812-34d13ad9f7aa`
- **Variables** (10):
  - `orderId`, `orderDate`, `clientName`
  - `deliveryAddress`, `clientPhone`
  - `paymentMethod`, `reference`
  - `items`, `totalAmount`, `deliveryDays`

### 3. Invoice Template ⭐
- **Name**: قالب الفاتورة الافتراضي
- **ID**: `d3811c39-c358-42ef-a753-e2d85853157d`
- **Variables** (16):
  - `invoiceNumber`, `invoiceDate`, `dueDate`
  - `clientName`, `clientAddress`, `clientTaxNumber`
  - `items`, `subtotal`, `tax`, `taxRate`, `total`, `currency`
  - `bankName`, `iban`, `paymentTerms`, `notes`

### 4. Contract Template ⭐
- **Name**: قالب العقد الإطاري الافتراضي
- **ID**: `a48e86a8-1842-4008-a46d-45533cc9d0f9`
- **Variables** (5):
  - `clientName`, `contractDate`
  - `startDate`, `endDate`
  - `products`

## 📁 Alternative Templates (Non-Default)

Each category also has a more detailed alternative template:

1. **قالب عرض السعر القياسي** - More detailed price offer
2. **قالب تأكيد الطلب** - More detailed order confirmation
3. **قالب الفاتورة** - More detailed invoice
4. **قالب عقد الاتفاقية** - More detailed contract

These alternative templates require additional variables like:
- Company info: `companyNameAr`, `companyAddressAr`, `companyPhone`, `companyEmail`
- Extended delivery info: `deliveryAddressAr`, `contactPersonAr`, `expectedDeliveryAr`
- Department/location details

## 🔧 Current Integration Status

### ✅ Using New Template System:
1. **Price Offer Generation** → Uses `price_offer` template
2. **Order Confirmation** → Uses `order` template  
3. **PDF Export** → Uses `order` template (FIXED)
4. **Document Triggers** → Automatic generation on events

### ⚠️ Still Using Old System:
1. **Print Function** (AdminOrdersPage.tsx) → Uses hardcoded HTML template

## 🎨 Template Structure

All templates follow this structure:
```typescript
{
  name: string;              // Template name in Arabic
  description?: string;      // Template description
  category: string;          // price_offer|order|invoice|contract
  language: 'ar';            // Arabic-only
  sections: Section[];       // Ordered sections (header, body, table, etc.)
  variables: string[];       // Required variable names
  styles: StyleConfig;       // Colors, fonts, margins
  isActive: boolean;         // Whether template is available
  isDefault: boolean;        // Whether it's the default for its category
  version: number;           // Template version
}
```

## 📊 Section Types

Templates use these section types:
- **header**: Company logo, name, contact info
- **body**: Text content with variable substitution
- **table**: Product/item lists with headers
- **terms**: Terms & conditions lists
- **spacer**: Vertical spacing
- **divider**: Visual separator
- **footer**: Footer with page numbers

## 🔍 How Templates Are Selected

When generating a document:

1. System looks for **default template** in requested category
2. If no default found, uses **first active template**
3. Template must be `isActive: true`
4. Variables are substituted: `{{variableName}}` → actual value
5. Result is cached for 5 minutes for performance

## 🚀 Usage Example

```typescript
const result = await DocumentUtils.generateDocument({
  templateCategory: 'order',
  variables: [
    { key: 'orderId', value: 'ORD-001' },
    { key: 'orderDate', value: '2025/10/29' },
    { key: 'clientName', value: 'عميل تجريبي' },
    { key: 'items', value: [...] },
    // ... more variables
  ],
  clientId: 'client-id',
  metadata: { orderId: 'ORD-001' }
});

if (result.success) {
  console.log('PDF generated:', result.fileName);
}
```

## 🛠️ Management Commands

```bash
# Check all templates
npx tsx server/scripts/check-templates.ts

# Seed default templates (if database is empty)
npx tsx server/scripts/seed-templates.ts

# Import custom Arabic templates
npx tsx server/scripts/import-arabic-templates.ts
```

## 📝 Notes

- All templates are **Arabic-only** (RTL layout)
- Templates use **Noto Sans Arabic** font for proper Arabic rendering
- PDF generation includes automatic **deduplication** (same template + variables = reuse existing PDF)
- All generated documents are **tracked in database** with access logs
- Templates can be managed via **Admin Documents Page** → Templates tab

## 🔐 Security

- Only **admins** can create/edit templates
- **Clients** can only view their assigned documents
- All document access is **logged** with IP and user agent
- Generated PDFs are stored in **object storage** (configurable: local/S3)

---

**✅ System Status**: All templates properly configured and active!

