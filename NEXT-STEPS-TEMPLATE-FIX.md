# Template System - Final Setup Steps

## ✅ Completed
- Fixed variable shadowing bug in `server/storage.ts` (line 1658)
- Schema already has `isDefault`, `version`, `tags` fields
- Frontend components already updated for Arabic-only templates
- All PDF endpoints now use template system

## 🔧 Manual Steps Required (2 commands)

### Step 1: Database Migration

Run this command and respond to the prompt:

```bash
npm run db:push
```

**When prompted about `price_offers_offer_number_unique` constraint:**
- Use arrow keys to select: **"No, add the constraint without truncating the table"**
- Press Enter

This will:
- Add `is_default`, `version`, `tags` columns to templates table
- Add unique constraint to price_offers.offerNumber
- Complete all schema migrations

### Step 2: Seed Arabic Templates

After migration completes successfully, run:

```bash
npm run seed:templates
```

Expected output:
```
🌱 Seeding default templates...
✅ Created template: قالب عرض السعر القياسي
✅ Created template: قالب تأكيد الطلب
✅ Created template: قالب الفاتورة
✅ Created template: قالب العقد
✅ Successfully seeded 4 templates
```

## 🧪 Testing After Setup

Once both commands complete, test:

1. **Price Offer Download**: Go to any price offer → Click "Download PDF"
2. **Order Export**: Go to admin orders → Click print/export PDF
3. **Template Manager**: Admin → Documents → Should see 4 Arabic templates
4. **Create Template**: Try creating a new custom template

## 🎯 What's Fixed

- ❌ Before: `"Cannot access 'documents2' before initialization"` error
- ✅ After: PDF downloads work with your Arabic templates

## 📋 Template System Flow

```
User clicks "Download PDF"
  ↓
Backend: DocumentUtils.generateDocument()
  ↓
Fetch active template: category='price_offer', isActive=true, language='ar'
  ↓
TemplatePDFGenerator.generate() with Arabic font
  ↓
Upload PDF to storage
  ↓
Save document metadata
  ↓
Download to user
```

## ❓ If Issues Occur

**Migration fails?**
- Check database connection
- Ensure no duplicate offerNumbers exist in price_offers table

**Seeding fails?**
- Run migration first (step 1)
- Check that templates table has new columns

**PDF still doesn't download?**
- Check browser console for errors
- Check server logs for template errors
- Verify at least one template exists with: isActive=true AND language='ar'

## 🚀 Ready!

After running both commands, your template system will be fully operational!

