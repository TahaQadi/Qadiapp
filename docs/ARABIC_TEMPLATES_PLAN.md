
# Arabic Document Templates Plan

## Overview
Create professional, elegant Arabic-only document templates for the Al Qadi Trading Company document library. These templates will be RTL-compliant and follow the company's branding.

## Template Categories

### 1. Price Offer (عرض سعر)
**Purpose**: Send price quotations to clients
**Key Sections**:
- Company header with logo and contact info
- Client information
- Product/service pricing table
- Terms and validity period
- Signature section

### 2. Purchase Order (أمر شراء)
**Purpose**: Confirm purchase orders from clients
**Key Sections**:
- Order number and date
- Client and delivery information
- Product details table
- Total amount and payment terms
- Delivery instructions

### 3. Invoice (فاتورة)
**Purpose**: Bill clients for delivered goods/services
**Key Sections**:
- Invoice number and tax details
- Client billing information
- Itemized products/services
- Subtotal, VAT (15%), and total
- Payment instructions and bank details

### 4. Contract (عقد)
**Purpose**: Formal agreements (LTA, service contracts, etc.)
**Key Sections**:
- Contract title and parties
- Terms and conditions
- Product/service scope
- Duration and renewal terms
- Signatures and stamps

### 5. Delivery Note (مذكرة تسليم)
**Purpose**: Accompany delivered goods
**Key Sections**:
- Delivery reference number
- Client and location details
- Product list with quantities
- Recipient signature

### 6. Receipt (إيصال)
**Purpose**: Acknowledge payment received
**Key Sections**:
- Receipt number and date
- Client information
- Payment details (amount, method)
- Reference to invoice/order
- Company stamp

## Design Guidelines

### Colors
- **Primary**: #1a365d (Navy blue - professional)
- **Secondary**: #2d3748 (Dark gray - text)
- **Accent**: #d4af37 (Gold - luxury touch)
- **Text**: #000000 (Black for Arabic text)

### Typography
- **Font**: Noto Sans Arabic (already installed)
- **Headers**: Bold, 14-16pt
- **Body**: Regular, 10-12pt
- **Tables**: Regular, 9-11pt

### Layout
- **Margins**: Top: 140px, Bottom: 90px, Left/Right: 50px
- **Header Height**: 120px (with logo)
- **Footer Height**: 70px
- **RTL**: All text flows right-to-left
- **Alignment**: Right-aligned for all Arabic text

### Branding Elements
1. **Company Logo**: Top right corner
2. **Gold Accent Line**: Below header
3. **Professional Footer**: Page numbers, contact info
4. **Watermark**: Optional "نسخة أصلية" (Original Copy)

## Template Variables

### Common Variables
- `{{companyNameAr}}` - شركة القاضي التجارية
- `{{companyAddressAr}}` - الرياض، المملكة العربية السعودية
- `{{companyPhone}}` - +966 XX XXX XXXX
- `{{companyEmail}}` - info@alqadi.com
- `{{taxNumber}}` - الرقم الضريبي
- `{{commercialRegister}}` - السجل التجاري

### Document-Specific Variables
- `{{documentNumber}}` - رقم المستند
- `{{documentDate}}` - تاريخ المستند
- `{{clientNameAr}}` - اسم العميل
- `{{clientAddressAr}}` - عنوان العميل
- `{{validUntil}}` - صالح حتى
- `{{totalAmount}}` - المبلغ الإجمالي
- `{{items}}` - جدول المنتجات

## Implementation Steps

1. **Create Template JSON Files** (server/templates/arabic/)
   - ar-price-offer.json
   - ar-purchase-order.json
   - ar-invoice.json
   - ar-contract.json
   - ar-delivery-note.json
   - ar-receipt.json

2. **Update Template Storage** (server/template-storage.ts)
   - Import Arabic templates on initialization
   - Tag templates with `language: 'ar'`

3. **Enhance PDF Generator** (server/template-pdf-generator.ts)
   - Verify RTL rendering for all sections
   - Add Arabic-specific formatting helpers
   - Test with real data

4. **Update Admin UI** (client/src/pages/AdminTemplatesPage.tsx)
   - Add "Arabic Documents" category filter
   - Preview templates with Arabic text
   - Easy duplicate/customize flow

## Testing Checklist

- [ ] All Arabic text renders right-to-left
- [ ] Letters connect properly (not disconnected)
- [ ] Tables have proper RTL column order
- [ ] Numbers display correctly (Western or Arabic numerals)
- [ ] Page numbers are right-aligned
- [ ] Company logo appears in correct position
- [ ] Gold accent lines enhance professional look
- [ ] PDF opens correctly in all viewers (Adobe, Chrome, etc.)
- [ ] Print output is professional quality

## Next Phase
After default templates are created, enable clients to:
- Customize colors while maintaining brand identity
- Add custom footer text
- Upload company stamp/seal
- Create template variations for different departments
