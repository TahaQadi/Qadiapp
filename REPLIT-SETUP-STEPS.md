# Replit Setup Steps - Apply All Changes

## 🔄 Step-by-Step Instructions

### Step 1: Stop the Server (if running)

In the Replit console, press:
```
Ctrl + C
```

Or click the **Stop** button in Replit's interface.

---

### Step 2: Run Database Migration

In the Replit Shell, run:

```bash
npm run db:push
```

**IMPORTANT**: When you see this prompt:
```
· You're about to add price_offers_offer_number_unique unique constraint to the table, 
  which contains 1 items. If this statement fails, you will receive an error from the 
  database. Do you want to truncate price_offers table?

❯ No, add the constraint without truncating the table
  Yes, truncate the table
```

**Use arrow keys** to ensure **"No, add the constraint without truncating the table"** is selected, then press **Enter**.

**Expected Output:**
```
✓ Pulling schema from database...
✓ Changes applied successfully
```

---

### Step 3: Seed Arabic Templates

After migration completes successfully, run:

```bash
npm run seed:templates
```

**Expected Output:**
```
🚀 Starting template seeding process...
🌱 Seeding default templates...
✅ Created template: قالب عرض السعر القياسي
✅ Created template: قالب تأكيد الطلب
✅ Created template: قالب الفاتورة
✅ Created template: قالب العقد
✅ Successfully seeded 4 templates
✅ Template seeding process completed successfully!
```

---

### Step 4: Restart the Server

In the Replit Shell, run:

```bash
npm run dev
```

Or click the **Run** button in Replit.

**Wait for:**
```
Server running on port 5000
✓ Database connected
```

---

### Step 5: Clear Browser Cache

**Important**: Clear your browser cache to ensure changes take effect:

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

Or:
- Chrome/Edge: `Ctrl + Shift + Delete` → Clear cached images and files
- Firefox: `Ctrl + Shift + Delete` → Clear cache

---

## ✅ Verification Checklist

After server restarts, test these features:

### Test 1: Check Templates in Admin Panel
1. Log in as admin
2. Go to **Admin** → **Document Templates**
3. You should see **4 Arabic templates**:
   - قالب عرض السعر القياسي (Price Offer)
   - قالب تأكيد الطلب (Order)
   - قالب الفاتورة (Invoice)
   - قالب العقد (Contract)

### Test 2: Download Price Offer PDF
1. Go to any price offer page
2. Click **"Download PDF"** button
3. PDF should download successfully (no error)
4. PDF should contain Arabic text

### Test 3: Print Price Offer
1. Go to any price offer page
2. Click **"Print"** button (printer icon)
3. Print dialog should open
4. Preview should show formatted content

### Test 4: Export to Excel
1. Go to admin orders or price offers page
2. Click **"Export to Excel"** button
3. CSV file should download with proper data

---

## 🐛 Troubleshooting

### Issue: Migration prompt doesn't appear
**Solution**: The database is already in sync. Skip to Step 3 (seed templates).

### Issue: "ℹ️ Found X existing templates. Skipping seed."
**Solution**: Templates already exist! Your system is ready. Go to Step 4 (restart server).

### Issue: Still getting "Cannot access 'documents2'" error
**Solution**: 
1. Ensure server was restarted (Step 4)
2. Clear browser cache (Step 5)
3. Check that `server/storage.ts` line 1658 shows `const docs = await query` (not `const documents`)

### Issue: "No active template found for category: price_offer"
**Solution**:
1. Verify templates were seeded (Step 3)
2. Check admin panel shows templates with green "Active" status
3. If templates exist but are inactive, edit them and set `isActive = true`

### Issue: PDF downloads but is blank or corrupted
**Solution**:
1. Check server logs for errors
2. Verify Arabic font exists: `server/fonts/NotoSansArabic-Regular.ttf`
3. Restart server (Step 4)

---

## 📝 What Changed

### Code Changes (Already Applied ✅)
- Fixed variable shadowing bug in `server/storage.ts`
- Updated price request PDF generation to use template system
- Fixed template seeding script import
- All frontend pages updated for Arabic-only templates

### Database Changes (Step 2 ⏳)
- Add `is_default` column to templates table
- Add `version` column to templates table  
- Add `tags` column to templates table
- Add unique constraint to price_offers.offerNumber

### Data Changes (Step 3 ⏳)
- Create 4 default Arabic templates in database
- Templates are marked as active and default

---

## 🚀 You're Done!

Once all steps complete:
- ✅ PDF downloads work with Arabic templates
- ✅ Print functionality works
- ✅ Excel export works
- ✅ Template management works
- ✅ No more "documents2" errors!

The template system is fully operational! 🎉

